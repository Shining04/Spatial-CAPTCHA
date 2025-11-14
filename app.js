import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

let currentUser = null;
let currentRoute = 'login';

async function init() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    currentUser = session.user;
    currentRoute = 'dashboard';
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    (async () => {
      if (session) {
        currentUser = session.user;
        if (currentRoute === 'login' || currentRoute === 'signup') {
          navigate('dashboard');
        }
      } else {
        currentUser = null;
        navigate('login');
      }
    })();
  });

  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}

function handleRouteChange() {
  const hash = window.location.hash.slice(1) || 'login';
  navigate(hash);
}

function navigate(route) {
  currentRoute = route;
  window.location.hash = route;
  render();
}

function render() {
  const root = document.getElementById('app-root');

  if (!currentUser && currentRoute !== 'signup') {
    root.innerHTML = renderLogin();
  } else if (!currentUser && currentRoute === 'signup') {
    root.innerHTML = renderSignup();
  } else if (currentRoute === 'dashboard') {
    root.innerHTML = renderDashboard();
    loadDashboardData();
  } else if (currentRoute === 'api-keys') {
    root.innerHTML = renderApiKeys();
    loadApiKeys();
  } else if (currentRoute === 'analytics') {
    root.innerHTML = renderAnalytics();
    loadAnalytics();
  } else if (currentRoute === 'settings') {
    root.innerHTML = renderSettings();
    loadSettings();
  } else if (currentRoute === 'widget') {
    root.innerHTML = renderWidget();
  }

  attachEventListeners();
}

function renderLogin() {
  return `
    <div class="auth-container">
      <div class="auth-box">
        <h1 class="auth-title">Spatial CAPTCHA SaaS</h1>
        <p class="auth-subtitle">Sign in to manage your API keys</p>

        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="login-email" required placeholder="you@example.com" />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" id="login-password" required placeholder="••••••••" />
          </div>

          <button type="submit" class="btn btn-primary btn-block">Sign In</button>

          <p class="auth-footer">
            Don't have an account?
            <a href="#signup" class="link">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  `;
}

function renderSignup() {
  return `
    <div class="auth-container">
      <div class="auth-box">
        <h1 class="auth-title">Create Account</h1>
        <p class="auth-subtitle">Start using Spatial CAPTCHA today</p>

        <form id="signup-form" class="auth-form">
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="signup-email" required placeholder="you@example.com" />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" id="signup-password" required placeholder="••••••••" minlength="6" />
          </div>

          <div class="form-group">
            <label>Company Name (optional)</label>
            <input type="text" id="signup-company" placeholder="Acme Inc." />
          </div>

          <button type="submit" class="btn btn-primary btn-block">Sign Up</button>

          <p class="auth-footer">
            Already have an account?
            <a href="#login" class="link">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  `;
}

function renderDashboard() {
  return `
    ${renderNav()}
    <div class="container">
      <div class="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your CAPTCHA service overview.</p>
      </div>

      <div class="stats-grid" id="stats-grid">
        <div class="stat-card">
          <div class="stat-label">API Calls This Month</div>
          <div class="stat-value" id="stat-calls">--</div>
          <div class="stat-limit" id="stat-limit">of -- limit</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Success Rate</div>
          <div class="stat-value" id="stat-success">--%</div>
          <div class="stat-sublabel">Last 30 days</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Active API Keys</div>
          <div class="stat-value" id="stat-keys">--</div>
          <div class="stat-sublabel">Total keys</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Avg. Attempts</div>
          <div class="stat-value" id="stat-attempts">--</div>
          <div class="stat-sublabel">Per verification</div>
        </div>
      </div>

      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-cards">
          <a href="#api-keys" class="action-card">
            <div class="action-icon">🔑</div>
            <h3>Manage API Keys</h3>
            <p>Create and manage your API keys</p>
          </a>

          <a href="#analytics" class="action-card">
            <div class="action-icon">📊</div>
            <h3>View Analytics</h3>
            <p>Track usage and performance</p>
          </a>

          <a href="#widget" class="action-card">
            <div class="action-icon">🧩</div>
            <h3>Embed Widget</h3>
            <p>Get integration code</p>
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderApiKeys() {
  return `
    ${renderNav()}
    <div class="container">
      <div class="page-header">
        <h1>API Keys</h1>
        <button class="btn btn-primary" id="create-key-btn">+ Create New Key</button>
      </div>

      <div id="create-key-form" class="card" style="display: none;">
        <h3>Create New API Key</h3>
        <form id="new-key-form">
          <div class="form-group">
            <label>Key Name</label>
            <input type="text" id="key-name" required placeholder="Production API Key" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Generate Key</button>
            <button type="button" class="btn btn-secondary" id="cancel-key-btn">Cancel</button>
          </div>
        </form>
      </div>

      <div id="new-key-display" class="card success-card" style="display: none;">
        <h3>API Key Created Successfully</h3>
        <p>Save this key securely. You won't be able to see it again!</p>
        <div class="key-display">
          <code id="generated-key"></code>
          <button class="btn btn-sm" id="copy-key-btn">Copy</button>
        </div>
      </div>

      <div class="card">
        <h3>Your API Keys</h3>
        <div id="keys-list">
          <div class="loading">Loading API keys...</div>
        </div>
      </div>
    </div>
  `;
}

function renderAnalytics() {
  return `
    ${renderNav()}
    <div class="container">
      <div class="page-header">
        <h1>Analytics</h1>
        <p>Track your CAPTCHA performance over time</p>
      </div>

      <div class="card">
        <h3>Last 30 Days</h3>
        <div id="analytics-data">
          <div class="loading">Loading analytics...</div>
        </div>
      </div>
    </div>
  `;
}

function renderSettings() {
  return `
    ${renderNav()}
    <div class="container">
      <div class="page-header">
        <h1>Settings</h1>
      </div>

      <div class="card">
        <h3>Account Information</h3>
        <div id="settings-data">
          <div class="loading">Loading settings...</div>
        </div>
      </div>
    </div>
  `;
}

function renderWidget() {
  return `
    ${renderNav()}
    <div class="container">
      <div class="page-header">
        <h1>Embed Widget</h1>
        <p>Integrate Spatial CAPTCHA into your website</p>
      </div>

      <div class="card">
        <h3>Integration Code</h3>
        <p>Add this code to your HTML where you want the CAPTCHA to appear:</p>

        <pre class="code-block"><code>&lt;div id="spatial-captcha"&gt;&lt;/div&gt;
&lt;script src="${window.location.origin}/widget.js"&gt;&lt;/script&gt;
&lt;script&gt;
  SpatialCaptcha.init({
    apiKey: 'YOUR_API_KEY',
    container: '#spatial-captcha',
    onSuccess: function(token) {
      console.log('CAPTCHA verified:', token);
      // Submit your form or proceed
    },
    onError: function(error) {
      console.error('CAPTCHA failed:', error);
    }
  });
&lt;/script&gt;</code></pre>

        <button class="btn btn-primary" id="copy-widget-code">Copy Code</button>
      </div>

      <div class="card">
        <h3>Backend Verification</h3>
        <p>Verify the CAPTCHA token on your backend:</p>

        <pre class="code-block"><code>// Node.js example
const response = await fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/captcha-api/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    session_token: token,
    user_rotation: { x, y, z }
  })
});

const result = await response.json();
if (result.verified) {
  // User is human, proceed
}</code></pre>
      </div>
    </div>
  `;
}

function renderNav() {
  return `
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">Spatial CAPTCHA</div>
        <div class="nav-menu">
          <a href="#dashboard" class="nav-link ${currentRoute === 'dashboard' ? 'active' : ''}">Dashboard</a>
          <a href="#api-keys" class="nav-link ${currentRoute === 'api-keys' ? 'active' : ''}">API Keys</a>
          <a href="#analytics" class="nav-link ${currentRoute === 'analytics' ? 'active' : ''}">Analytics</a>
          <a href="#widget" class="nav-link ${currentRoute === 'widget' ? 'active' : ''}">Widget</a>
          <a href="#settings" class="nav-link ${currentRoute === 'settings' ? 'active' : ''}">Settings</a>
          <button class="btn btn-secondary btn-sm" id="logout-btn">Sign Out</button>
        </div>
      </div>
    </nav>
  `;
}

function attachEventListeners() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  const createKeyBtn = document.getElementById('create-key-btn');
  if (createKeyBtn) {
    createKeyBtn.addEventListener('click', () => {
      document.getElementById('create-key-form').style.display = 'block';
    });
  }

  const cancelKeyBtn = document.getElementById('cancel-key-btn');
  if (cancelKeyBtn) {
    cancelKeyBtn.addEventListener('click', () => {
      document.getElementById('create-key-form').style.display = 'none';
    });
  }

  const newKeyForm = document.getElementById('new-key-form');
  if (newKeyForm) {
    newKeyForm.addEventListener('submit', handleCreateKey);
  }

  const copyKeyBtn = document.getElementById('copy-key-btn');
  if (copyKeyBtn) {
    copyKeyBtn.addEventListener('click', () => {
      const key = document.getElementById('generated-key').textContent;
      navigator.clipboard.writeText(key);
      copyKeyBtn.textContent = 'Copied!';
      setTimeout(() => copyKeyBtn.textContent = 'Copy', 2000);
    });
  }

  const copyWidgetBtn = document.getElementById('copy-widget-code');
  if (copyWidgetBtn) {
    copyWidgetBtn.addEventListener('click', () => {
      const code = copyWidgetBtn.previousElementSibling.textContent;
      navigator.clipboard.writeText(code);
      copyWidgetBtn.textContent = 'Copied!';
      setTimeout(() => copyWidgetBtn.textContent = 'Copy Code', 2000);
    });
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Login failed: ' + error.message);
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const company = document.getElementById('signup-company').value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { company_name: company }
    }
  });

  if (error) {
    alert('Signup failed: ' + error.message);
  } else {
    if (company) {
      await supabase.from('users_profile').update({ company_name: company }).eq('id', data.user.id);
    }
    alert('Account created! Please sign in.');
    navigate('login');
  }
}

async function handleLogout() {
  await supabase.auth.signOut();
}

async function loadDashboardData() {
  const { data: profile } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (profile) {
    document.getElementById('stat-calls').textContent = profile.api_calls_used;
    document.getElementById('stat-limit').textContent = `of ${profile.api_calls_limit} limit`;
  }

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id')
    .eq('user_id', currentUser.id)
    .eq('is_active', true);

  document.getElementById('stat-keys').textContent = keys?.length || 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: analytics } = await supabase
    .from('verification_analytics')
    .select('*')
    .eq('user_id', currentUser.id)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

  if (analytics && analytics.length > 0) {
    const totals = analytics.reduce((acc, day) => ({
      successful: acc.successful + day.successful_verifications,
      failed: acc.failed + day.failed_verifications,
      attempts: acc.attempts + (day.avg_attempts * day.total_sessions)
    }), { successful: 0, failed: 0, attempts: 0 });

    const total = totals.successful + totals.failed;
    const successRate = total > 0 ? ((totals.successful / total) * 100).toFixed(1) : 0;
    const avgAttempts = total > 0 ? (totals.attempts / total).toFixed(1) : 0;

    document.getElementById('stat-success').textContent = `${successRate}%`;
    document.getElementById('stat-attempts').textContent = avgAttempts;
  } else {
    document.getElementById('stat-success').textContent = 'N/A';
    document.getElementById('stat-attempts').textContent = 'N/A';
  }
}

async function loadApiKeys() {
  const { data: keys } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  const keysList = document.getElementById('keys-list');

  if (!keys || keys.length === 0) {
    keysList.innerHTML = '<p class="empty-state">No API keys yet. Create one to get started!</p>';
    return;
  }

  keysList.innerHTML = keys.map(key => `
    <div class="key-item">
      <div class="key-info">
        <div class="key-name">${key.name}</div>
        <div class="key-meta">
          <span class="key-prefix">${key.key_prefix}••••••••</span>
          <span class="key-date">Created ${new Date(key.created_at).toLocaleDateString()}</span>
          ${key.last_used_at ? `<span>Last used ${new Date(key.last_used_at).toLocaleDateString()}</span>` : ''}
        </div>
      </div>
      <div class="key-actions">
        <span class="status-badge ${key.is_active ? 'active' : 'inactive'}">
          ${key.is_active ? 'Active' : 'Inactive'}
        </span>
        <button class="btn btn-sm btn-danger" onclick="deleteKey('${key.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function handleCreateKey(e) {
  e.preventDefault();
  const name = document.getElementById('key-name').value;

  const apiKey = `sk_${Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('')}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const { error } = await supabase
    .from('api_keys')
    .insert({
      user_id: currentUser.id,
      name,
      key_hash: keyHash,
      key_prefix: apiKey.substring(0, 8),
    });

  if (error) {
    alert('Failed to create API key: ' + error.message);
    return;
  }

  document.getElementById('create-key-form').style.display = 'none';
  document.getElementById('new-key-form').reset();
  document.getElementById('generated-key').textContent = apiKey;
  document.getElementById('new-key-display').style.display = 'block';

  setTimeout(() => {
    document.getElementById('new-key-display').style.display = 'none';
    loadApiKeys();
  }, 30000);
}

window.deleteKey = async function(keyId) {
  if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) {
    return;
  }

  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId);

  if (error) {
    alert('Failed to delete key: ' + error.message);
  } else {
    loadApiKeys();
  }
};

async function loadAnalytics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: analytics } = await supabase
    .from('verification_analytics')
    .select('*')
    .eq('user_id', currentUser.id)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  const analyticsData = document.getElementById('analytics-data');

  if (!analytics || analytics.length === 0) {
    analyticsData.innerHTML = '<p class="empty-state">No analytics data yet. Start using your API keys!</p>';
    return;
  }

  const tableHTML = `
    <table class="analytics-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Sessions</th>
          <th>Success</th>
          <th>Failed</th>
          <th>Success Rate</th>
          <th>Avg Error</th>
        </tr>
      </thead>
      <tbody>
        ${analytics.map(day => {
          const total = day.successful_verifications + day.failed_verifications;
          const rate = total > 0 ? ((day.successful_verifications / total) * 100).toFixed(1) : 0;
          return `
            <tr>
              <td>${new Date(day.date).toLocaleDateString()}</td>
              <td>${day.total_sessions}</td>
              <td>${day.successful_verifications}</td>
              <td>${day.failed_verifications}</td>
              <td>${rate}%</td>
              <td>${day.avg_error_degrees.toFixed(1)}°</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  analyticsData.innerHTML = tableHTML;
}

async function loadSettings() {
  const { data: profile } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  const settingsData = document.getElementById('settings-data');

  settingsData.innerHTML = `
    <div class="settings-grid">
      <div class="setting-item">
        <label>Email</label>
        <div>${currentUser.email}</div>
      </div>
      <div class="setting-item">
        <label>Company Name</label>
        <div>${profile?.company_name || 'Not set'}</div>
      </div>
      <div class="setting-item">
        <label>Plan Type</label>
        <div class="plan-badge">${profile?.plan_type || 'free'}</div>
      </div>
      <div class="setting-item">
        <label>Monthly Limit</label>
        <div>${profile?.api_calls_limit || 0} API calls</div>
      </div>
      <div class="setting-item">
        <label>Account Created</label>
        <div>${new Date(profile?.created_at).toLocaleDateString()}</div>
      </div>
    </div>
  `;
}

init();
