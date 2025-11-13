import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Canvas and renderer setup --------------------------------------------------
const canvas = document.getElementById("captcha-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Target preview canvas (shows the correct orientation)
const previewCanvas = document.getElementById("preview-canvas");
const previewRenderer = new THREE.WebGLRenderer({
  canvas: previewCanvas,
  antialias: true,
  alpha: false,
});
previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Main scene, camera, and lighting -------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color("#f0f0f0");

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
camera.position.set(0, 0, 5);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Preview scene (for target orientation) -------------------------------------
const previewScene = new THREE.Scene();
previewScene.background = new THREE.Color("#e8f5e9");

const previewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
previewCamera.position.set(0, 0, 5);

const previewAmbientLight = new THREE.AmbientLight(0xffffff, 0.75);
previewScene.add(previewAmbientLight);

const previewDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
previewDirectionalLight.position.set(5, 10, 7);
previewScene.add(previewDirectionalLight);

// Interactive object container -----------------------------------------------
const root = new THREE.Group();
scene.add(root);

const previewRoot = new THREE.Group();
previewScene.add(previewRoot);

let interactiveObject = null;
let previewObject = null;
let targetRotation = new THREE.Euler(); // Store target rotation

const loader = new GLTFLoader();
loader.setPath("./");
loader.setResourcePath("./");

const assetCandidates = [
  { path: "captcha_model.glb", label: "GLB" },
  { path: "captcha_model.gltf", label: "glTF" },
];

/**
 * Centers the object around the origin and optionally fits it into view.
 * @param {THREE.Object3D} object
 */
function normalizeObject(object) {
  const box = new THREE.Box3().setFromObject(object);

  if (!box.isEmpty()) {
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center); // Move pivot to the center

    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const targetSize = 2.0; // World units ensuring it remains inside the frustum

    if (maxDimension > 0) {
      const scale = targetSize / maxDimension;
      object.scale.multiplyScalar(scale);
    }
  }
}

/**
 * Generates a random target rotation for the captcha challenge.
 * Sets the preview object to show the correct answer.
 * Limited rotation ranges to avoid complete opposite orientations.
 */
function generateRandomChallenge() {
  if (!interactiveObject || !previewObject) return;
  
  // Generate random target rotation with limited range (avoid extreme angles)
  // Using smaller ranges to keep objects recognizable
  targetRotation.set(
    THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(-90, 90)),
    THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(-90, 90)),
    THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(-45, 45))
  );
  
  // Set preview object to target rotation (shows the answer)
  previewObject.rotation.copy(targetRotation);
  
  // Apply moderate random offset to the interactive object (user must solve)
  // Limited to 60-90 degrees to avoid opposite orientations
  const offsetX = THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(-75, 75));
  const offsetY = THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(-75, 75));
  const offsetZ = THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(-30, 30));
  
  interactiveObject.rotation.set(
    targetRotation.x + offsetX,
    targetRotation.y + offsetY,
    targetRotation.z + offsetZ
  );
  
  console.log(`🎯 New challenge generated! Target rotation: (${THREE.MathUtils.radToDeg(targetRotation.x).toFixed(1)}°, ${THREE.MathUtils.radToDeg(targetRotation.y).toFixed(1)}°, ${THREE.MathUtils.radToDeg(targetRotation.z).toFixed(1)}°)`);
}

/**
 * Creates a fallback 3D object composed of multiple geometries.
 * This serves as a captcha challenge when no GLB/GLTF file is available.
 * Enhanced with clear front/back indicators for better orientation recognition.
 */
function createFallbackObject() {
  const group = new THREE.Group();
  
  // Main body - Cube
  const cubeGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a90e2,
    roughness: 0.3,
    metalness: 0.6,
  });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  group.add(cube);
  
  // Top sphere (always on top)
  const sphereGeometry = new THREE.SphereGeometry(0.4, 32, 32);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0xe94b3c,
    roughness: 0.4,
    metalness: 0.3,
  });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(0, 1, 0);
  group.add(sphere);
  
  // Right side cylinder
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
  
  // FRONT indicator - Large bright cone pointing forward
  const coneGeometry = new THREE.ConeGeometry(0.45, 1.0, 32);
  const coneMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.2,
    metalness: 0.8,
    emissive: 0xffd700,
    emissiveIntensity: 0.2,
  });
  const cone = new THREE.Mesh(coneGeometry, coneMaterial);
  cone.position.set(0, -0.5, 1.0);
  cone.rotation.x = Math.PI; // Point forward
  group.add(cone);
  
  // Front marker ring - CLEAR orientation indicator
  const markerGeometry = new THREE.TorusGeometry(0.3, 0.1, 16, 32);
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0xff00ff,
    emissiveIntensity: 0.5,
  });
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.set(0, 0, 0.8);
  group.add(marker);
  
  // Back indicator - Small dark sphere (opposite side)
  const backSphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const backSphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2,
  });
  const backSphere = new THREE.Mesh(backSphereGeometry, backSphereMaterial);
  backSphere.position.set(0, 0, -0.8);
  group.add(backSphere);
  
  group.scale.setScalar(0.8);
  return group;
}

/**
 * Loads the GLB model. Falls back to a procedural composite object if loading fails.
 * Creates both the interactive object and the preview object.
 */
function loadInteractiveAsset(candidateIndex = 0) {
  const candidate = assetCandidates[candidateIndex];

  if (!candidate) {
    console.warn("No GLB/GLTF asset found. Creating procedural captcha object.");
    
    // Create interactive object
    const fallbackObject = createFallbackObject();
    root.add(fallbackObject);
    interactiveObject = fallbackObject;
    
    // Create preview object (clone of the interactive object)
    const previewFallbackObject = createFallbackObject();
    previewRoot.add(previewFallbackObject);
    previewObject = previewFallbackObject;
    
    // Generate the challenge
    generateRandomChallenge();
    console.info("✅ Procedural captcha object created and ready!");
    return;
  }

  loader.load(
    candidate.path,
    (gltf) => {
      // Load interactive object
      const object = gltf.scene || gltf.scenes[0];
      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
      
      normalizeObject(object);
      root.add(object);
      interactiveObject = object;
      
      // Clone for preview object
      const previewObjectClone = object.clone();
      previewRoot.add(previewObjectClone);
      previewObject = previewObjectClone;
      
      // Generate the challenge
      generateRandomChallenge();
      console.info(`✅ ${candidate.label} 로드 완료: ${candidate.path}`);
    },
    undefined,
    (error) => {
      console.warn(
        `Failed to load ${candidate.path}. Trying next candidate if available.`,
        error
      );
      loadInteractiveAsset(candidateIndex + 1);
    }
  );
}

// Interaction handling --------------------------------------------------------
let isDragging = false;
let lastPointerPosition = { x: 0, y: 0 };

// Adaptive rotation speed based on device
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const rotationSpeed = isTouchDevice ? 0.008 : 0.005; // More sensitive on mobile
const fineRotationStep = THREE.MathUtils.degToRad(2); // 2 degrees per click

function handlePointerDown(event) {
  if (!interactiveObject) return;
  isDragging = true;
  lastPointerPosition.x = event.clientX || event.touches?.[0]?.clientX || 0;
  lastPointerPosition.y = event.clientY || event.touches?.[0]?.clientY || 0;
  
  // Prevent default touch behaviors
  if (event.touches) {
    event.preventDefault();
  }
  
  try {
    canvas.setPointerCapture(event.pointerId);
  } catch (e) {
    // Pointer capture might not be available on some devices
  }
}

function handlePointerMove(event) {
  if (!isDragging || !interactiveObject) return;

  const currentX = event.clientX || event.touches?.[0]?.clientX || lastPointerPosition.x;
  const currentY = event.clientY || event.touches?.[0]?.clientY || lastPointerPosition.y;

  const deltaX = currentX - lastPointerPosition.x;
  const deltaY = currentY - lastPointerPosition.y;

  interactiveObject.rotation.y += deltaX * rotationSpeed;
  interactiveObject.rotation.x += deltaY * rotationSpeed;

  lastPointerPosition.x = currentX;
  lastPointerPosition.y = currentY;
  
  // Prevent scrolling on touch devices
  if (event.touches) {
    event.preventDefault();
  }
}

function handlePointerUp(event) {
  if (!interactiveObject) return;
  isDragging = false;
  
  try {
    canvas.releasePointerCapture(event.pointerId);
  } catch (e) {
    // Pointer capture might not be available
  }
}

// Use both pointer events (modern) and touch events (fallback)
canvas.addEventListener("pointerdown", handlePointerDown, { passive: false });
canvas.addEventListener("pointermove", handlePointerMove, { passive: false });
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", handlePointerUp);
canvas.addEventListener("pointerleave", handlePointerUp);

// Additional touch event support for better mobile compatibility
canvas.addEventListener("touchstart", handlePointerDown, { passive: false });
canvas.addEventListener("touchmove", handlePointerMove, { passive: false });
canvas.addEventListener("touchend", handlePointerUp);
canvas.addEventListener("touchcancel", handlePointerUp);

// Fine control buttons --------------------------------------------------------
const controlButtons = document.querySelectorAll('.control-btn');
controlButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (!interactiveObject) return;
    
    const axis = btn.dataset.axis;
    const direction = parseFloat(btn.dataset.direction);
    const rotation = fineRotationStep * direction;
    
    if (axis === 'x') {
      interactiveObject.rotation.x += rotation;
    } else if (axis === 'y') {
      interactiveObject.rotation.y += rotation;
    } else if (axis === 'z') {
      interactiveObject.rotation.z += rotation;
    }
    
    // Visual feedback
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = '', 100);
  });
});

// Keyboard controls -----------------------------------------------------------
document.addEventListener('keydown', (event) => {
  if (!interactiveObject) return;
  
  const key = event.key.toLowerCase();
  let rotated = false;
  
  switch(key) {
    case 'w':
      interactiveObject.rotation.x -= fineRotationStep;
      rotated = true;
      break;
    case 's':
      interactiveObject.rotation.x += fineRotationStep;
      rotated = true;
      break;
    case 'a':
      interactiveObject.rotation.y -= fineRotationStep;
      rotated = true;
      break;
    case 'd':
      interactiveObject.rotation.y += fineRotationStep;
      rotated = true;
      break;
    case 'q':
      interactiveObject.rotation.z -= fineRotationStep;
      rotated = true;
      break;
    case 'e':
      interactiveObject.rotation.z += fineRotationStep;
      rotated = true;
      break;
  }
  
  if (rotated) {
    event.preventDefault();
    updateVisualFeedback();
  }
});

// Resizing --------------------------------------------------------------------
function resizeRendererToDisplaySize() {
  const { clientWidth, clientHeight } = canvas;
  const needResize =
    canvas.width !== clientWidth || canvas.height !== clientHeight;

  if (needResize) {
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }
}

// Verification logic ----------------------------------------------------------
const verifyButton = document.getElementById("verify-btn");
const refreshButton = document.getElementById("refresh-btn");

verifyButton.addEventListener("click", () => {
  if (!interactiveObject || !previewObject) {
    alert("⏳ Model is loading. Please wait a moment.");
    return;
  }

  // Compare user's rotation with target rotation using quaternions
  interactiveObject.updateMatrixWorld();
  previewObject.updateMatrixWorld();
  
  const userQuaternion = interactiveObject.quaternion.clone();
  const targetQuaternion = previewObject.quaternion.clone();
  
  const angleRadians = userQuaternion.angleTo(targetQuaternion);
  const angleDegrees = THREE.MathUtils.radToDeg(angleRadians);

  // Log detailed rotation info for debugging
  console.log(`🎯 Verification:`);
  console.log(`   User rotation: (${THREE.MathUtils.radToDeg(interactiveObject.rotation.x).toFixed(1)}°, ${THREE.MathUtils.radToDeg(interactiveObject.rotation.y).toFixed(1)}°, ${THREE.MathUtils.radToDeg(interactiveObject.rotation.z).toFixed(1)}°)`);
  console.log(`   Target rotation: (${THREE.MathUtils.radToDeg(previewObject.rotation.x).toFixed(1)}°, ${THREE.MathUtils.radToDeg(previewObject.rotation.y).toFixed(1)}°, ${THREE.MathUtils.radToDeg(previewObject.rotation.z).toFixed(1)}°)`);
  console.log(`   Error: ${angleDegrees.toFixed(1)}°`);

  if (angleDegrees < 35) {
    alert(`✅ Success — You are human! 🎉\n(Error: ${angleDegrees.toFixed(1)}°)`);
    // Generate new challenge after success
    setTimeout(() => generateRandomChallenge(), 500);
  } else {
    alert(`❌ Try Again\n(Current error: ${angleDegrees.toFixed(1)}° / Allowed: 35°)\n\n💡 Tip: Match the target orientation on the right!`);
  }
});

// Refresh button to generate new challenge
refreshButton.addEventListener("click", () => {
  if (!interactiveObject || !previewObject) {
    alert("⏳ Model is loading. Please wait a moment.");
    return;
  }
  generateRandomChallenge();
  console.log("🔄 New challenge generated");
});

// Visual feedback for rotation similarity ----------------------------------
const accuracyText = document.getElementById('accuracy-text');
const accuracyBar = document.getElementById('accuracy-bar');
const accuracyIndicator = document.getElementById('accuracy-indicator');

function updateVisualFeedback() {
  if (!interactiveObject || !previewObject) return;
  
  interactiveObject.updateMatrixWorld();
  previewObject.updateMatrixWorld();
  
  const userQuaternion = interactiveObject.quaternion.clone();
  const targetQuaternion = previewObject.quaternion.clone();
  
  const angleRadians = userQuaternion.angleTo(targetQuaternion);
  const angleDegrees = THREE.MathUtils.radToDeg(angleRadians);
  
  // Update accuracy text
  accuracyText.textContent = `Error: ${angleDegrees.toFixed(1)}°`;
  
  // Update accuracy bar (inverted: 0° = 100%, 180° = 0%)
  const maxAngle = 180;
  const accuracy = Math.max(0, Math.min(100, ((maxAngle - angleDegrees) / maxAngle) * 100));
  accuracyBar.style.width = `${accuracy}%`;
  
  // Update accuracy indicator color and text based on accuracy
  if (angleDegrees < 35) {
    accuracyIndicator.style.background = 'rgba(76, 175, 80, 0.9)';
    accuracyText.style.color = 'white';
    canvas.style.boxShadow = '0 0 30px rgba(76, 175, 80, 0.6), 0 0 60px rgba(76, 175, 80, 0.3)';
  } else if (angleDegrees < 60) {
    accuracyIndicator.style.background = 'rgba(255, 152, 0, 0.9)';
    accuracyText.style.color = 'white';
    canvas.style.boxShadow = '0 0 20px rgba(255, 193, 7, 0.5)';
  } else if (angleDegrees < 90) {
    accuracyIndicator.style.background = 'rgba(255, 87, 34, 0.9)';
    accuracyText.style.color = 'white';
    canvas.style.boxShadow = '';
  } else {
    accuracyIndicator.style.background = 'rgba(244, 67, 54, 0.9)';
    accuracyText.style.color = 'white';
    canvas.style.boxShadow = '';
  }
  
  // Add status indicator
  if (angleDegrees < 35) {
    accuracyText.textContent = `✅ Error: ${angleDegrees.toFixed(1)}° - Ready to verify!`;
  } else if (angleDegrees < 60) {
    accuracyText.textContent = `🟡 Error: ${angleDegrees.toFixed(1)}° - Almost there!`;
  } else {
    accuracyText.textContent = `🔴 Error: ${angleDegrees.toFixed(1)}° - Keep rotating`;
  }
}

// Animation loop --------------------------------------------------------------
let frameCount = 0;
function render() {
  resizeRendererToDisplaySize();
  renderer.render(scene, camera);
  
  // Also render the preview canvas
  const { clientWidth, clientHeight } = previewCanvas;
  const needResize = previewCanvas.width !== clientWidth || previewCanvas.height !== clientHeight;
  if (needResize) {
    previewRenderer.setSize(clientWidth, clientHeight, false);
    previewCamera.aspect = clientWidth / clientHeight;
    previewCamera.updateProjectionMatrix();
  }
  previewRenderer.render(previewScene, previewCamera);
  
  // Update visual feedback every 5 frames for better responsiveness
  frameCount++;
  if (frameCount % 5 === 0) {
    updateVisualFeedback();
  }
  
  requestAnimationFrame(render);
}

// Entry point -----------------------------------------------------------------
function initialize() {
  console.log("🚀 Spatial Captcha initializing...");
  
  // Wait for CSS to load and elements to have dimensions
  const waitForDimensions = () => {
    if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
      console.log("⏳ Waiting for canvas dimensions...");
      requestAnimationFrame(waitForDimensions);
      return;
    }
    
    console.log(`Canvas size: ${canvas.clientWidth}x${canvas.clientHeight}`);
    
    // Set initial renderer sizes now that we have dimensions
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    
    previewRenderer.setSize(previewCanvas.clientWidth, previewCanvas.clientHeight, false);
    previewCamera.aspect = previewCanvas.clientWidth / previewCanvas.clientHeight;
    previewCamera.updateProjectionMatrix();
    
    console.log(`Camera aspect: ${camera.aspect}`);
    
    loadInteractiveAsset();
    render();
    
    console.log("✅ Render loop started");
  };
  
  waitForDimensions();
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

