/*
 * Spatial CAPTCHA Widget
 * Embeddable 3D CAPTCHA for client websites
 */

(function() {
  'use strict';

  const API_BASE_URL = 'https://ibgdyftqdfqawoxnlzxp.supabase.co/functions/v1/captcha-api';

  window.SpatialCaptcha = {
    config: null,
    currentSession: null,
    container: null,
    scene: null,
    camera: null,
    renderer: null,
    interactiveObject: null,
    previewObject: null,
    targetRotation: null,

    init: function(options) {
      this.config = {
        apiKey: options.apiKey,
        container: options.container || '#spatial-captcha',
        onSuccess: options.onSuccess || function() {},
        onError: options.onError || function() {},
        theme: options.theme || 'light'
      };

      if (!this.config.apiKey) {
        console.error('Spatial CAPTCHA: API key is required');
        return;
      }

      this.loadThreeJS(() => {
        this.render();
        this.createSession();
      });
    },

    loadThreeJS: function(callback) {
      if (window.THREE) {
        callback();
        return;
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
        window.THREE = THREE;
        window.dispatchEvent(new Event('threejs-loaded'));
      `;
      document.head.appendChild(script);

      window.addEventListener('threejs-loaded', callback, { once: true });
    },

    render: function() {
      const container = document.querySelector(this.config.container);
      if (!container) {
        console.error('Spatial CAPTCHA: Container not found');
        return;
      }

      container.innerHTML = `
        <div class="spatial-captcha-widget">
          <style>
            .spatial-captcha-widget {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
              max-width: 500px;
              margin: 0 auto;
            }
            .captcha-header {
              text-align: center;
              margin-bottom: 1rem;
              font-size: 1.1rem;
              font-weight: 600;
              color: #333;
            }
            .captcha-canvas-container {
              position: relative;
              width: 100%;
              aspect-ratio: 1;
              background: #f5f5f5;
              border-radius: 1rem;
              overflow: hidden;
              margin-bottom: 1rem;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .captcha-canvas {
              width: 100%;
              height: 100%;
              cursor: grab;
            }
            .captcha-canvas:active {
              cursor: grabbing;
            }
            .captcha-status {
              text-align: center;
              padding: 0.75rem;
              border-radius: 0.5rem;
              font-weight: 600;
              margin-bottom: 1rem;
              background: #e3f2fd;
              color: #1976d2;
            }
            .captcha-status.loading {
              background: #fff3e0;
              color: #f57c00;
            }
            .captcha-status.success {
              background: #e8f5e9;
              color: #2e7d32;
            }
            .captcha-status.error {
              background: #ffebee;
              color: #c62828;
            }
            .captcha-button {
              width: 100%;
              padding: 1rem;
              border: none;
              border-radius: 0.5rem;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              background: #2196f3;
              color: white;
              transition: all 0.2s;
            }
            .captcha-button:hover {
              background: #1976d2;
              transform: translateY(-2px);
            }
            .captcha-button:disabled {
              background: #ccc;
              cursor: not-allowed;
              transform: none;
            }
            .captcha-hint {
              text-align: center;
              font-size: 0.875rem;
              color: #666;
              margin-top: 0.5rem;
            }
          </style>

          <div class="captcha-header">Rotate the 3D object to verify</div>

          <div class="captcha-canvas-container">
            <canvas class="captcha-canvas" id="captcha-widget-canvas"></canvas>
          </div>

          <div class="captcha-status" id="captcha-status">
            Drag to rotate the object to match the target orientation
          </div>

          <button class="captcha-button" id="captcha-verify-btn">
            Verify
          </button>

          <div class="captcha-hint">Use mouse/touch to rotate</div>
        </div>
      `;

      this.setupThreeJS();
      this.setupInteraction();

      document.getElementById('captcha-verify-btn').addEventListener('click', () => {
        this.verify();
      });
    },

    setupThreeJS: function() {
      const canvas = document.getElementById('captcha-widget-canvas');
      const THREE = window.THREE;

      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color('#f0f0f0');

      this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
      this.camera.position.set(0, 0, 5);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
      directionalLight.position.set(5, 10, 7);
      this.scene.add(directionalLight);

      this.interactiveObject = this.createObject();
      this.scene.add(this.interactiveObject);

      this.animate();
    },

    createObject: function() {
      const THREE = window.THREE;
      const group = new THREE.Group();

      const cubeGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const cubeMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a90e2,
        roughness: 0.3,
        metalness: 0.6,
      });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      group.add(cube);

      const sphereGeometry = new THREE.SphereGeometry(0.4, 32, 32);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 0xe94b3c,
        roughness: 0.4,
        metalness: 0.3,
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(0, 1, 0);
      group.add(sphere);

      const cylinderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 32);
      const cylinderMaterial = new THREE.MeshStandardMaterial({
        color: 0x50c878,
        roughness: 0.5,
        metalness: 0.4,
      });
      const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      cylinder.position.set(1.2, 0, 0);
      cylinder.rotation.z = Math.PI / 2;
      group.add(cylinder);

      const coneGeometry = new THREE.ConeGeometry(0.45, 1.0, 32);
      const coneMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.8,
      });
      const cone = new THREE.Mesh(coneGeometry, coneMaterial);
      cone.position.set(0, -0.5, 1.0);
      cone.rotation.x = Math.PI;
      group.add(cone);

      group.scale.setScalar(0.8);
      return group;
    },

    setupInteraction: function() {
      const canvas = document.getElementById('captcha-widget-canvas');
      let isDragging = false;
      let lastPointer = { x: 0, y: 0 };

      const handleStart = (e) => {
        isDragging = true;
        const x = e.clientX || e.touches?.[0]?.clientX || 0;
        const y = e.clientY || e.touches?.[0]?.clientY || 0;
        lastPointer = { x, y };
      };

      const handleMove = (e) => {
        if (!isDragging) return;
        const x = e.clientX || e.touches?.[0]?.clientX || lastPointer.x;
        const y = e.clientY || e.touches?.[0]?.clientY || lastPointer.y;

        const deltaX = x - lastPointer.x;
        const deltaY = y - lastPointer.y;

        this.interactiveObject.rotation.y += deltaX * 0.005;
        this.interactiveObject.rotation.x += deltaY * 0.005;

        lastPointer = { x, y };
      };

      const handleEnd = () => {
        isDragging = false;
      };

      canvas.addEventListener('mousedown', handleStart);
      canvas.addEventListener('mousemove', handleMove);
      canvas.addEventListener('mouseup', handleEnd);
      canvas.addEventListener('touchstart', handleStart);
      canvas.addEventListener('touchmove', handleMove);
      canvas.addEventListener('touchend', handleEnd);
    },

    animate: function() {
      requestAnimationFrame(() => this.animate());

      const canvas = document.getElementById('captcha-widget-canvas');
      if (canvas) {
        const { clientWidth, clientHeight } = canvas;
        if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
          this.renderer.setSize(clientWidth, clientHeight, false);
          this.camera.aspect = clientWidth / clientHeight;
          this.camera.updateProjectionMatrix();
        }
        this.renderer.render(this.scene, this.camera);
      }
    },

    createSession: async function() {
      const statusEl = document.getElementById('captcha-status');
      statusEl.textContent = 'Loading challenge...';
      statusEl.className = 'captcha-status loading';

      try {
        const response = await fetch(`${API_BASE_URL}/create`, {
          method: 'POST',
          headers: {
            'X-API-Key': this.config.apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to create CAPTCHA session');
        }

        const data = await response.json();
        this.currentSession = data.session_token;
        this.targetRotation = data.target_rotation;

        this.interactiveObject.rotation.set(
          this.targetRotation.x + (Math.random() - 0.5) * 1.5,
          this.targetRotation.y + (Math.random() - 0.5) * 1.5,
          this.targetRotation.z + (Math.random() - 0.5) * 0.5
        );

        statusEl.textContent = 'Rotate the object to the correct position';
        statusEl.className = 'captcha-status';
      } catch (error) {
        statusEl.textContent = 'Failed to load challenge';
        statusEl.className = 'captcha-status error';
        this.config.onError(error);
      }
    },

    verify: async function() {
      if (!this.currentSession) {
        return;
      }

      const statusEl = document.getElementById('captcha-status');
      const verifyBtn = document.getElementById('captcha-verify-btn');

      verifyBtn.disabled = true;
      statusEl.textContent = 'Verifying...';
      statusEl.className = 'captcha-status loading';

      try {
        const response = await fetch(`${API_BASE_URL}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_token: this.currentSession,
            user_rotation: {
              x: this.interactiveObject.rotation.x,
              y: this.interactiveObject.rotation.y,
              z: this.interactiveObject.rotation.z
            }
          })
        });

        const result = await response.json();

        if (result.verified) {
          statusEl.textContent = `Success! You are human (Error: ${result.error_degrees.toFixed(1)}°)`;
          statusEl.className = 'captcha-status success';
          verifyBtn.textContent = 'Verified';
          this.config.onSuccess(this.currentSession);
        } else {
          statusEl.textContent = `Try again (Error: ${result.error_degrees.toFixed(1)}° / ${result.attempts} attempts)`;
          statusEl.className = 'captcha-status error';
          verifyBtn.disabled = false;

          if (result.attempts >= 10) {
            statusEl.textContent = 'Maximum attempts reached. Refreshing...';
            setTimeout(() => {
              this.createSession();
              verifyBtn.disabled = false;
              verifyBtn.textContent = 'Verify';
            }, 2000);
          }
        }
      } catch (error) {
        statusEl.textContent = 'Verification failed';
        statusEl.className = 'captcha-status error';
        verifyBtn.disabled = false;
        this.config.onError(error);
      }
    }
  };
})();
