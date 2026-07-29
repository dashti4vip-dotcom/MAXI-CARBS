import * as THREE from 'https://unpkg.com/three@0.166.1/build/three.module.js';

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

const loader = $('#loader');
const loaderBar = $('#loaderBar');
const header = $('#header');
const soundToggle = $('#soundToggle');
const story = $('#story');
const storyMeter = $('#storyMeter');
const storyIndex = $('#storyIndex');
const storySteps = $$('.story-step');
const sceneButtons = $$('.story__scenes button');
const shell = $('#productShell');
let audioCtx = null;
let soundOn = false;
let currentScene = 0;

function bootLoader() {
  let p = 0;
  const timer = setInterval(() => {
    p += Math.ceil(Math.random() * 10);
    if (p >= 100) {
      p = 100;
      clearInterval(timer);
      setTimeout(() => loader.classList.add('is-hidden'), 240);
    }
    loaderBar.style.width = `${p}%`;
  }, 50);
}
bootLoader();

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function tone(type = 'soft') {
  if (!soundOn) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  if (type === 'whoosh') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.start(now); osc.stop(now + 0.24);
  } else {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.start(now); osc.stop(now + 0.1);
  }
}

soundToggle.addEventListener('click', () => {
  soundOn = !soundOn;
  soundToggle.classList.toggle('is-on', soundOn);
  soundToggle.setAttribute('aria-pressed', String(soundOn));
  soundToggle.textContent = soundOn ? 'Sound on' : 'Sound off';
  if (soundOn) tone('whoosh');
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  });
}, { threshold: 0.18 });
$$('.reveal').forEach(el => revealObserver.observe(el));

function setScene(scene) {
  currentScene = clamp(scene, 0, storySteps.length - 1);
  storySteps.forEach((step, i) => step.classList.toggle('is-active', i === currentScene));
  sceneButtons.forEach((btn, i) => btn.classList.toggle('is-active', i === currentScene));
  storyIndex.textContent = String(currentScene + 1).padStart(2, '0');
}
sceneButtons.forEach(btn => btn.addEventListener('click', () => {
  const target = Number(btn.dataset.target || 0);
  const y = story.offsetTop + (story.offsetHeight - innerHeight) * (target / (storySteps.length - 1));
  scrollTo({ top: y, behavior: 'smooth' });
  tone('soft');
}));

// ---------- Three.js scene ----------
const canvas = $('#threeCanvas');
let renderer, scene, camera, bottleGroup, liquidMesh, bottleOuter, labelMesh, capMesh, rimMesh;
let mainLight, fillLight, rimLight;
let webglReady = false;
let reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function createLabelTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const x = c.getContext('2d');

  const grad = x.createLinearGradient(0, 0, c.width, 0);
  grad.addColorStop(0, '#09150b');
  grad.addColorStop(.35, '#16361a');
  grad.addColorStop(.65, '#1d4f23');
  grad.addColorStop(1, '#09140c');
  x.fillStyle = grad;
  x.fillRect(0, 0, c.width, c.height);

  x.fillStyle = 'rgba(255,255,255,.08)';
  for (let i = 0; i < 14; i++) {
    x.fillRect((i * 82) % c.width, 0, 1, c.height);
  }

  x.fillStyle = '#d4f7c8';
  x.font = '700 34px Inter, Arial';
  x.fillText('VyoMax', 48, 62);

  x.fillStyle = '#f5fff2';
  x.font = '900 112px Inter, Arial';
  x.fillText('MAXI', 46, 190);
  x.fillStyle = '#9dff8c';
  x.fillText('CARBS', 46, 292);

  x.strokeStyle = 'rgba(255,255,255,.12)';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(46, 334); x.lineTo(c.width - 44, 334); x.stroke();

  x.fillStyle = '#ffffff';
  x.font = '700 42px Inter, Arial';
  x.fillText('APPLE', 48, 402);
  x.fillStyle = '#c7d8c4';
  x.font = '600 28px Inter, Arial';
  x.fillText('60G CARBS + BCAA', 48, 448);
  x.fillText('READY TO DRINK · GREAT TASTE', 48, 486);

  x.strokeStyle = 'rgba(197,255,170,.54)';
  x.lineWidth = 4;
  x.strokeRect(36, 26, c.width - 72, c.height - 52);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function createBottle() {
  const group = new THREE.Group();

  const profile = [
    [0.0, -1.35], [0.36, -1.35], [0.48, -1.16], [0.52, -0.86], [0.52, -0.24],
    [0.51, 0.18], [0.47, 0.78], [0.34, 1.1], [0.22, 1.28], [0.22, 1.52], [0.27, 1.62]
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const glassGeo = new THREE.LatheGeometry(profile, 64);
  bottleOuter = new THREE.Mesh(
    glassGeo,
    new THREE.MeshPhysicalMaterial({
      color: 0xf7fff6,
      metalness: 0,
      roughness: 0.12,
      transmission: 0.93,
      thickness: 1.25,
      ior: 1.46,
      transparent: true,
      opacity: 0.88,
      envMapIntensity: 1.1,
      reflectivity: 1
    })
  );
  group.add(bottleOuter);

  const innerProfile = [
    [0.0, -1.2], [0.28, -1.2], [0.41, -1.06], [0.43, -0.83], [0.43, -0.26], [0.42, 0.16], [0.38, 0.72], [0.28, 0.98], [0.18, 1.12], [0.18, 1.28]
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const liquidGeo = new THREE.LatheGeometry(innerProfile, 64);
  liquidMesh = new THREE.Mesh(
    liquidGeo,
    new THREE.MeshPhysicalMaterial({
      color: 0x81f06f,
      roughness: 0.08,
      metalness: 0,
      transparent: true,
      opacity: 0.82,
      transmission: 0.42,
      clearcoat: 0.45,
      clearcoatRoughness: 0.16
    })
  );
  liquidMesh.position.y = 0.02;
  group.add(liquidMesh);

  const labelGeo = new THREE.CylinderGeometry(0.525, 0.515, 0.88, 64, 1, true);
  labelMesh = new THREE.Mesh(
    labelGeo,
    new THREE.MeshStandardMaterial({
      map: createLabelTexture(),
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.75,
      side: THREE.DoubleSide
    })
  );
  labelMesh.position.y = -0.26;
  group.add(labelMesh);

  const capGeo = new THREE.CylinderGeometry(0.205, 0.22, 0.32, 40, 1, false);
  capMesh = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.18 }));
  capMesh.position.y = 1.72;
  group.add(capMesh);

  const rimGeo = new THREE.TorusGeometry(0.21, 0.02, 16, 64);
  rimMesh = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.6, metalness: 0.2 }));
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = 1.58;
  group.add(rimMesh);

  group.scale.setScalar(1.22);
  group.position.y = -0.08;
  return group;
}

function initThree() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    renderer.setSize(shell.clientWidth, shell.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(28, shell.clientWidth / shell.clientHeight, 0.1, 100);
    camera.position.set(0, 0.1, 7.4);
    scene.add(camera);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    mainLight = new THREE.DirectionalLight(0xf7ffef, 4.8);
    mainLight.position.set(4.5, 4.6, 5.4);
    scene.add(mainLight);

    fillLight = new THREE.PointLight(0x8aff8f, 10, 20, 1.7);
    fillLight.position.set(-2.6, -0.8, 3.1);
    scene.add(fillLight);

    rimLight = new THREE.PointLight(0xc9ff9b, 14, 24, 1.8);
    rimLight.position.set(0.5, 2.5, -4.2);
    scene.add(rimLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.5, 64),
      new THREE.ShadowMaterial({ opacity: 0.18 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.08;
    scene.add(floor);

    bottleGroup = createBottle();
    scene.add(bottleGroup);
    webglReady = true;
    shell.classList.remove('is-fallback');
  } catch (err) {
    console.error(err);
    shell.classList.add('is-fallback');
  }
}
initThree();

function resizeThree() {
  if (!webglReady) return;
  const w = shell.clientWidth;
  const h = shell.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 820 ? 1.5 : 1.8));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.position.z = innerWidth < 820 ? 8.2 : 7.4;
  camera.fov = innerWidth < 820 ? 31 : 28;
  camera.updateProjectionMatrix();
}
resizeThree();
addEventListener('resize', resizeThree);

let pointerX = 0;
let pointerY = 0;
addEventListener('pointermove', e => {
  pointerX = (e.clientX / innerWidth) * 2 - 1;
  pointerY = (e.clientY / innerHeight) * 2 - 1;
});
addEventListener('deviceorientation', e => {
  if (e.gamma == null || e.beta == null) return;
  pointerX = clamp(e.gamma / 35, -1, 1);
  pointerY = clamp(e.beta / 55 - 1, -1, 1);
});

function updateStoryProgress() {
  const rect = story.getBoundingClientRect();
  const scrollable = Math.max(1, story.offsetHeight - innerHeight);
  const progress = clamp(-rect.top / scrollable);
  storyMeter.style.width = `${progress * 100}%`;
  const step = Math.min(storySteps.length - 1, Math.floor(progress * storySteps.length));
  if (step !== currentScene) {
    setScene(step);
    if (progress > 0.02) tone('soft');
  }
  return progress;
}

function updateHeader() {
  header.classList.toggle('is-scrolled', scrollY > 18);
}
addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

function animate() {
  requestAnimationFrame(animate);
  if (!webglReady) return;

  const storyProgress = updateStoryProgress();
  const heroRect = $('#top').getBoundingClientRect();
  const heroProgress = clamp((innerHeight - heroRect.top) / (innerHeight + heroRect.height), 0, 1);
  const combined = Math.max(heroProgress * 0.35, storyProgress);
  const idle = performance.now() * 0.00045;

  const targetRotY = -0.68 + combined * 1.8 + pointerX * 0.16;
  const targetRotX = 0.12 - storyProgress * 0.18 - pointerY * 0.08;
  bottleGroup.rotation.y += (targetRotY - bottleGroup.rotation.y) * 0.08;
  bottleGroup.rotation.x += (targetRotX - bottleGroup.rotation.x) * 0.08;
  bottleGroup.rotation.z += ((pointerX * -0.05) - bottleGroup.rotation.z) * 0.08;
  bottleGroup.position.y += (((storyProgress > 0.06 ? -0.08 : 0.02) + Math.sin(idle * 2.2) * 0.04) - bottleGroup.position.y) * 0.07;
  bottleGroup.position.x += ((pointerX * 0.12) - bottleGroup.position.x) * 0.06;
  bottleGroup.scale.setScalar((innerWidth < 820 ? 1.26 : 1.22) + Math.sin(idle * 2.6) * 0.006);

  liquidMesh.rotation.y = bottleGroup.rotation.y * 0.72;
  liquidMesh.position.y = 0.02 + Math.sin(idle * 3.2) * 0.015;
  labelMesh.rotation.y = Math.sin(idle * 1.3) * 0.02;
  capMesh.rotation.y += 0.0038;
  rimMesh.rotation.y = capMesh.rotation.y;

  mainLight.position.x = 4.5 + pointerX * 0.8;
  mainLight.position.y = 4.6 - pointerY * 0.4;
  fillLight.position.x = -2.6 + Math.sin(idle * 1.7) * 0.7;
  fillLight.intensity = 8.8 + Math.sin(idle * 3.2) * 1.6;
  rimLight.intensity = 12 + storyProgress * 4;

  const accent = 0.22 + storyProgress * 0.4;
  bottleOuter.material.opacity = 0.86 + storyProgress * 0.05;
  bottleOuter.material.thickness = 1.15 + storyProgress * 0.4;
  liquidMesh.material.emissive = new THREE.Color().setRGB(0.02 + accent * 0.08, 0.14 + accent * 0.42, 0.04 + accent * 0.07);
  liquidMesh.material.emissiveIntensity = 0.12 + storyProgress * 0.3;

  camera.position.y += ((0.06 - storyProgress * 0.12) - camera.position.y) * 0.05;
  camera.position.z += (((innerWidth < 820 ? 8.2 : 7.4) - storyProgress * 0.3) - camera.position.z) * 0.05;
  camera.lookAt(0, 0.06 - storyProgress * 0.16, 0);

  renderer.render(scene, camera);
}
animate();

setScene(0);

// On older devices or if WebGL context becomes unavailable, show fallback image.
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  shell.classList.add('is-fallback');
});

