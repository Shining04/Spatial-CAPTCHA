import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHash } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, X-API-Key',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/captcha-api', '');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Route: POST /create - Create new CAPTCHA session
    if (path === '/create' && req.method === 'POST') {
      const apiKey = req.headers.get('X-API-Key');
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Missing API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify API key
      const keyHash = createHash('sha256').update(apiKey).digest('hex');
      const { data: apiKeyData, error: keyError } = await supabase
        .from('api_keys')
        .select('id, user_id, is_active')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .maybeSingle();

      if (keyError || !apiKeyData) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check usage limits
      const { data: profile } = await supabase
        .from('users_profile')
        .select('api_calls_limit, api_calls_used')
        .eq('id', apiKeyData.user_id)
        .single();

      if (profile && profile.api_calls_used >= profile.api_calls_limit) {
        return new Response(
          JSON.stringify({ error: 'API call limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate random target rotation
      const targetRotation = {
        x: (Math.random() * Math.PI) - (Math.PI / 2),
        y: (Math.random() * Math.PI) - (Math.PI / 2),
        z: (Math.random() * Math.PI / 2) - (Math.PI / 4),
      };

      // Create session
      const sessionToken = crypto.randomUUID();
      const { data: session, error: sessionError } = await supabase
        .from('captcha_sessions')
        .insert({
          api_key_id: apiKeyData.id,
          session_token: sessionToken,
          target_rotation_x: targetRotation.x,
          target_rotation_y: targetRotation.y,
          target_rotation_z: targetRotation.z,
          client_ip: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
        })
        .select()
        .single();

      if (sessionError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update API key last used
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKeyData.id);

      // Increment usage count
      await supabase
        .from('users_profile')
        .update({ api_calls_used: (profile?.api_calls_used || 0) + 1 })
        .eq('id', apiKeyData.user_id);

      return new Response(
        JSON.stringify({
          session_token: sessionToken,
          target_rotation: targetRotation,
          expires_in: 600,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: POST /verify - Verify user rotation
    if (path === '/verify' && req.method === 'POST') {
      const { session_token, user_rotation } = await req.json();

      if (!session_token || !user_rotation) {
        return new Response(
          JSON.stringify({ error: 'Missing session_token or user_rotation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get session
      const { data: session, error: sessionError } = await supabase
        .from('captcha_sessions')
        .select('*, api_keys!inner(user_id)')
        .eq('session_token', session_token)
        .maybeSingle();

      if (sessionError || !session) {
        return new Response(
          JSON.stringify({ error: 'Invalid session token' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if expired
      if (new Date(session.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Session expired' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already verified
      if (session.is_verified) {
        return new Response(
          JSON.stringify({ verified: true, error_degrees: session.error_degrees }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate rotation error using quaternion angle
      const targetQuat = eulerToQuaternion(
        session.target_rotation_x,
        session.target_rotation_y,
        session.target_rotation_z
      );
      const userQuat = eulerToQuaternion(
        user_rotation.x,
        user_rotation.y,
        user_rotation.z
      );

      const angleRad = quaternionAngle(targetQuat, userQuat);
      const angleDeg = (angleRad * 180) / Math.PI;

      const isVerified = angleDeg < 35;
      const newAttempts = session.attempts + 1;

      // Update session
      await supabase
        .from('captcha_sessions')
        .update({
          is_verified: isVerified,
          attempts: newAttempts,
          error_degrees: angleDeg,
          verified_at: isVerified ? new Date().toISOString() : null,
        })
        .eq('session_token', session_token);

      // Update analytics if final attempt or verified
      if (isVerified || newAttempts >= 10) {
        await supabase.rpc('update_verification_analytics', {
          p_user_id: session.api_keys.user_id,
          p_success: isVerified,
          p_error_degrees: angleDeg,
          p_attempts: newAttempts,
        });
      }

      return new Response(
        JSON.stringify({
          verified: isVerified,
          error_degrees: angleDeg,
          attempts: newAttempts,
          max_attempts: 10,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: Convert Euler angles to Quaternion
function eulerToQuaternion(x: number, y: number, z: number) {
  const c1 = Math.cos(x / 2);
  const c2 = Math.cos(y / 2);
  const c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2);
  const s2 = Math.sin(y / 2);
  const s3 = Math.sin(z / 2);

  return {
    w: c1 * c2 * c3 + s1 * s2 * s3,
    x: s1 * c2 * c3 - c1 * s2 * s3,
    y: c1 * s2 * c3 + s1 * c2 * s3,
    z: c1 * c2 * s3 - s1 * s2 * c3,
  };
}

// Helper: Calculate angle between two quaternions
function quaternionAngle(q1: any, q2: any) {
  const dot = q1.w * q2.w + q1.x * q2.x + q1.y * q2.y + q1.z * q2.z;
  return 2 * Math.acos(Math.min(Math.abs(dot), 1.0));
}
