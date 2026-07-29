(() => {
  'use strict';

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  const flavours = [
    {
      key: 'apple', name: 'Apple', word: 'APPLE', number: '01',
      bg: '#071108', soft: '#0d2510', accent: '#7dff58', accent2: '#d7ff59', rgb: '125,255,88',
      lead: 'Crisp, electric and built to keep momentum moving.',
      gallery: 'Crisp and bright with an electric green identity.'
    },
    {
      key: 'grape', name: 'Grape', word: 'GRAPE', number: '02',
      bg: '#0b0714', soft: '#2a103d', accent: '#b45cff', accent2: '#ef8fff', rgb: '180,92,255',
      lead: 'Deep flavour with a bold violet charge.',
      gallery: 'Dark, rich and wrapped in a high-energy violet atmosphere.'
    },
    {
      key: 'blue', name: 'Blue Exotic', word: 'BLUE EXOTIC', number: '03',
      bg: '#030d18', soft: '#06294b', accent: '#42b9ff', accent2: '#56f1ff', rgb: '66,185,255',
      lead: 'A cool exotic profile with a clean blue rush.',
      gallery: 'Cool blue light and an exotic profile made to stand apart.'
    },
    {
      key: 'strawberry', name: 'Strawberry', word: 'STRAWBERRY', number: '04',
      bg: '#160608', soft: '#4c0c18', accent: '#ff4764', accent2: '#ff9bad', rgb: '255,71,100',
      lead: 'Bright strawberry energy with a sharp red finish.',
      gallery: 'A brighter red flavour world with a vivid strawberry glow.'
    },
    {
      key: 'watermelon', name: 'Watermelon', word: 'WATERMELON', number: '05',
      bg: '#110607', soft: '#431014', accent: '#ff3b4d', accent2: '#69ff88', rgb: '255,59,77',
      lead: 'Juicy red impact balanced by a fresh green edge.',
      gallery: 'Red at the centre, fresh green at the edge — unmistakably Watermelon.'
    }
  ];

  const root = document.documentElement;
  const themeColor = qs('#themeColor');
  const loader = qs('#loader');
  const loaderCount = qs('#loaderCount');
  const loaderBar = qs('#loaderBar');
  let loadValue = 0;
  const loadTimer = setInterval(() => {
    loadValue += Math.max(1, Math.ceil((96 - loadValue) * 0.09));
    loadValue = Math.min(96, loadValue);
    loaderCount.textContent = String(loadValue).padStart(2, '0');
    loaderBar.style.transform = `scaleX(${loadValue / 100})`;
  }, 48);

  window.addEventListener('load', () => {
    clearInterval(loadTimer);
    loaderCount.textContent = '100';
    loaderBar.style.transform = 'scaleX(1)';
    setTimeout(() => loader.classList.add('is-hidden'), 400);
    setTimeout(() => qs('.hero .reveal')?.classList.add('in-view'), 620);
  });

  const header = qs('#siteHeader');
  const menuButton = qs('#menuButton');
  const mobileMenu = qs('#mobileMenu');
  function setMenu(open) {
    menuButton.classList.toggle('is-open', open);
    mobileMenu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  }
  menuButton.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('is-open')));
  qsa('a', mobileMenu).forEach(link => link.addEventListener('click', () => setMenu(false)));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in-view'); });
  }, { threshold: 0.14 });
  qsa('.reveal').forEach(el => revealObserver.observe(el));

  let activeIndex = 0;
  let particleRgb = flavours[0].rgb;
  let switching = false;

  const heroEyebrow = qs('#heroEyebrow');
  const heroFlavour = qs('#heroFlavour');
  const heroLead = qs('#heroLead');
  const heroFruitWord = qs('#heroFruitWord');
  const flavourNumber = qs('#flavourNumber');
  const galleryNumber = qs('#galleryNumber');
  const galleryTitle = qs('#galleryTitle');
  const galleryText = qs('#galleryText');
  const galleryWord = qs('#galleryWord');
  const labFlavour = qs('#labFlavour');
  const momentumTitle = qs('#momentumTitle');
  const energyWord = qs('#energyWord');
  const heroImages = qsa('.hero-bottle');
  const galleryImages = qsa('.gallery-bottle');
  const flavourControls = qsa('[data-flavour]');
  const sequenceFrames = qsa('.sequence-frame');

  function applyTheme(flavour) {
    root.style.setProperty('--bg', flavour.bg);
    root.style.setProperty('--bg-soft', flavour.soft);
    root.style.setProperty('--accent', flavour.accent);
    root.style.setProperty('--accent-2', flavour.accent2);
    root.style.setProperty('--accent-rgb', flavour.rgb);
    document.body.dataset.flavour = flavour.key;
    themeColor.setAttribute('content', flavour.bg);
    particleRgb = flavour.rgb;
  }

  function switchImageSet(images, key, direction) {
    const previous = images.find(img => img.classList.contains('is-active'));
    const next = images.find(img => img.dataset.flavourImg === key);
    if (!next || next === previous) return;
    if (previous) {
      previous.classList.remove('is-active');
      previous.classList.add(direction > 0 ? 'is-leaving-left' : 'is-leaving-right');
      setTimeout(() => previous.classList.remove('is-leaving-left', 'is-leaving-right'), 760);
    }
    next.classList.remove('is-leaving-left', 'is-leaving-right');
    next.style.transform = direction > 0 ? 'translateX(46%) rotate(9deg) scale(.86)' : 'translateX(-46%) rotate(-9deg) scale(.86)';
    requestAnimationFrame(() => {
      next.classList.add('is-active');
      next.style.removeProperty('transform');
    });
  }

  function updateSequence(flavour) {
    sequenceFrames.forEach((frame, index) => {
      const nextSrc = `assets/images/${flavour.key}-${String(index).padStart(3, '0')}.webp`;
      if (!frame.src.endsWith(nextSrc)) frame.src = nextSrc;
      frame.alt = `Maxi Carbs ${flavour.name} bottle view ${index + 1}`;
      frame.classList.toggle('is-active', index === activeFrame);
    });
    labFlavour.textContent = flavour.name;
  }

  function setFlavour(nextIndex, source = 'direct') {
    const normalized = (nextIndex + flavours.length) % flavours.length;
    if (normalized === activeIndex || switching) return;
    switching = true;
    const direction = source === 'prev' ? -1 : source === 'next' ? 1 : (normalized > activeIndex ? 1 : -1);
    activeIndex = normalized;
    const flavour = flavours[activeIndex];
    document.body.classList.add('is-changing');
    applyTheme(flavour);
    switchImageSet(heroImages, flavour.key, direction);
    switchImageSet(galleryImages, flavour.key, direction);
    flavourControls.forEach(control => control.classList.toggle('is-active', control.dataset.flavour === flavour.key));

    setTimeout(() => {
      heroEyebrow.textContent = flavour.name;
      heroFlavour.textContent = flavour.word;
      heroLead.textContent = flavour.lead;
      heroFruitWord.textContent = flavour.word;
      flavourNumber.textContent = flavour.number;
      galleryNumber.textContent = flavour.number;
      galleryTitle.textContent = flavour.name;
      galleryText.textContent = flavour.gallery;
      galleryWord.textContent = flavour.word;
      momentumTitle.textContent = `Choose ${flavour.name}. Keep moving.`;
      energyWord.textContent = flavour.word;
      updateSequence(flavour);
      document.body.classList.remove('is-changing');
      qsa(`[data-flavour="${flavour.key}"]`).forEach(el => {
        const parent = el.parentElement;
        if (!parent || parent.scrollWidth <= parent.clientWidth) return;
        const left = el.offsetLeft - (parent.clientWidth - el.offsetWidth) / 2;
        parent.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
      });
      navigator.vibrate?.(12);
      switching = false;
    }, 230);
  }

  flavourControls.forEach(control => control.addEventListener('click', () => {
    const index = flavours.findIndex(item => item.key === control.dataset.flavour);
    setFlavour(index, 'direct');
  }));
  qsa('[data-flavour-prev]').forEach(button => button.addEventListener('click', () => setFlavour(activeIndex - 1, 'prev')));
  qsa('[data-flavour-next]').forEach(button => button.addEventListener('click', () => setFlavour(activeIndex + 1, 'next')));

  function bindSwipe(zone) {
    let startX = 0, startY = 0, tracking = false;
    zone.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      startX = event.clientX; startY = event.clientY; tracking = true;
      zone.setPointerCapture?.(event.pointerId);
    });
    zone.addEventListener('pointerup', event => {
      if (!tracking) return;
      tracking = false;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        setFlavour(activeIndex + (dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev');
      }
    });
    zone.addEventListener('pointercancel', () => { tracking = false; });
    zone.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); setFlavour(activeIndex + 1, 'next'); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setFlavour(activeIndex - 1, 'prev'); }
    });
  }
  qsa('.flavour-swipe-zone').forEach(bindSwipe);

  // Scroll through all flavours while the cinematic gallery remains pinned.
  const flavourGallery = qs('.flavour-gallery');
  function updateGalleryScroll() {
    const rect = flavourGallery.getBoundingClientRect();
    // Only let scroll drive the flavour while the gallery is actually pinned.
    if (rect.top > 0 || rect.bottom < innerHeight) return;
    const scrollable = Math.max(1, flavourGallery.offsetHeight - innerHeight);
    const progress = clamp(-rect.top / scrollable);
    const index = Math.min(flavours.length - 1, Math.floor(progress * flavours.length));
    if (index !== activeIndex && !switching) setFlavour(index, index > activeIndex ? 'next' : 'prev');
  }

  const heroProduct = qs('#heroProduct');
  const sequenceStage = qs('#sequenceStage');
  const cursorLight = qs('#cursorLight');
  const finePointer = matchMedia('(pointer:fine)').matches;
  function applyTilt(target, clientX, clientY, strength = 10) {
    const rect = target.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1) - 0.5;
    const y = clamp((clientY - rect.top) / rect.height, 0, 1) - 0.5;
    target.style.setProperty('--tilt-x', `${x * strength}deg`);
    target.style.setProperty('--tilt-y', `${-y * strength * 0.65}deg`);
  }
  if (finePointer) {
    window.addEventListener('pointermove', event => {
      cursorLight.style.left = `${event.clientX}px`;
      cursorLight.style.top = `${event.clientY}px`;
      applyTilt(heroProduct, event.clientX, event.clientY, 12);
      applyTilt(sequenceStage, event.clientX, event.clientY, 8);
    }, { passive: true });
  }

  const productLab = qs('.product-lab');
  const labProgress = qs('#labProgress');
  const labStep = qs('#labStep');
  const labTitle = qs('#labTitle');
  const labText = qs('#labText');
  const dataCards = qsa('.data-card');
  const sequenceCopy = [
    ['Face the energy.', 'Scroll slowly to inspect the selected bottle from every available angle.'],
    ['Cut for motion.', 'The sculpted shape creates a fast, athletic silhouette from the first glance.'],
    ['Details in depth.', 'Side panels carry the performance story while the bottle keeps a strong profile.'],
    ['The formula side.', 'Turn the product around to reveal the complete information panel and structure.'],
    ['Every angle counts.', 'The final view completes the product study. Choose another flavour at any time.']
  ];
  let activeFrame = 0;

  function updateProductLab() {
    const rect = productLab.getBoundingClientRect();
    const scrollable = Math.max(1, productLab.offsetHeight - innerHeight);
    const progress = clamp(-rect.top / scrollable);
    root.style.setProperty('--lab-progress', progress.toFixed(4));
    labProgress.style.transform = `scaleX(${progress})`;
    const frameIndex = Math.min(sequenceFrames.length - 1, Math.floor(progress * sequenceFrames.length));
    if (frameIndex !== activeFrame) {
      activeFrame = frameIndex;
      sequenceFrames.forEach((frame, index) => frame.classList.toggle('is-active', index === frameIndex));
      labStep.textContent = String(frameIndex + 1).padStart(2, '0');
      labTitle.textContent = sequenceCopy[frameIndex][0];
      labText.textContent = sequenceCopy[frameIndex][1];
      dataCards.forEach((card, index) => card.classList.toggle('is-active', index === Math.min(2, Math.floor(frameIndex / 2))));
    }
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', scrollY > 18);
      const heroProgress = clamp(scrollY / Math.max(innerHeight, 680));
      qsa('.hero-bottle.is-active').forEach(bottle => {
        bottle.style.translate = `0 ${heroProgress * 70}px`;
        bottle.style.scale = String(1 - heroProgress * 0.05);
      });
      updateGalleryScroll();
      updateProductLab();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { updateGalleryScroll(); updateProductLab(); });

  const canvas = qs('#particles');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let dpr = 1;
  function resizeCanvas() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const total = Math.min(84, Math.max(24, Math.floor(innerWidth / 18)));
    particles = Array.from({ length: total }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      radius: Math.random() * 1.35 + .25, speed: Math.random() * .26 + .06,
      alpha: Math.random() * .38 + .08, drift: (Math.random() - .5) * .08
    }));
  }
  function drawParticles() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    particles.forEach(p => {
      p.y -= p.speed; p.x += p.drift;
      if (p.y < -8) { p.y = innerHeight + 8; p.x = Math.random() * innerWidth; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particleRgb},${p.alpha})`; ctx.fill();
    });
    requestAnimationFrame(drawParticles);
  }
  resizeCanvas(); drawParticles();
  window.addEventListener('resize', resizeCanvas);

  // Preload all remaining product frames after the hero is usable.
  const preload = () => flavours.forEach(flavour => {
    for (let i = 0; i < 5; i += 1) {
      const image = new Image(); image.src = `assets/images/${flavour.key}-${String(i).padStart(3, '0')}.webp`;
    }
  });
  if ('requestIdleCallback' in window) requestIdleCallback(preload, { timeout: 2500 });
  else setTimeout(preload, 1200);

  applyTheme(flavours[0]);
  updateProductLab();
})();
