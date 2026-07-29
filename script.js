(() => {
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

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
    setTimeout(() => loader.classList.add('is-hidden'), 420);
    setTimeout(() => qs('.hero .reveal')?.classList.add('in-view'), 650);
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
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.14 });
  qsa('.reveal').forEach(el => revealObserver.observe(el));

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

  [heroProduct, sequenceStage].forEach(target => {
    target.addEventListener('touchmove', event => {
      const touch = event.touches[0];
      if (touch) applyTilt(target, touch.clientX, touch.clientY, 9);
    }, { passive: true });
    target.addEventListener('touchend', () => {
      target.style.setProperty('--tilt-x', '0deg');
      target.style.setProperty('--tilt-y', '0deg');
    }, { passive: true });
  });

  const productLab = qs('.product-lab');
  const labProgress = qs('#labProgress');
  const frames = qsa('.sequence-frame');
  const labStep = qs('#labStep');
  const labTitle = qs('#labTitle');
  const labText = qs('#labText');
  const dataCards = qsa('.data-card');
  const sequenceCopy = [
    ['Face the energy.', 'Scroll slowly to inspect the Apple bottle from every available angle.'],
    ['Cut for motion.', 'The sculpted shape creates a fast, athletic silhouette from the first glance.'],
    ['Details in depth.', 'Side panels carry the performance story while the bottle keeps a strong profile.'],
    ['The formula side.', 'Turn the product around to reveal the complete information panel and structure.'],
    ['Every angle counts.', 'The final view completes the product study and prepares the flavour system.']
  ];
  let activeFrame = -1;

  function updateProductLab() {
    const rect = productLab.getBoundingClientRect();
    const scrollable = Math.max(1, productLab.offsetHeight - innerHeight);
    const progress = clamp(-rect.top / scrollable);
    productLab.style.setProperty('--lab-progress', progress.toFixed(4));
    labProgress.style.transform = `scaleX(${progress})`;

    const frameIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
    if (frameIndex !== activeFrame) {
      activeFrame = frameIndex;
      frames.forEach((frame, index) => frame.classList.toggle('is-active', index === frameIndex));
      labStep.textContent = String(frameIndex + 1).padStart(2, '0');
      labTitle.textContent = sequenceCopy[frameIndex][0];
      labText.textContent = sequenceCopy[frameIndex][1];
      dataCards.forEach((card, index) => card.classList.toggle('is-active', index === Math.min(2, Math.floor(frameIndex / 2))));
    }
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', scrollY > 18);
        const heroBottle = qs('#heroBottle');
        const heroProgress = clamp(scrollY / Math.max(innerHeight, 680));
        heroBottle.style.translate = `0 ${heroProgress * 72}px`;
        heroBottle.style.scale = String(1 - heroProgress * 0.055);
        updateProductLab();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateProductLab);
  updateProductLab();

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
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      radius: Math.random() * 1.35 + 0.25,
      speed: Math.random() * 0.26 + 0.06,
      alpha: Math.random() * 0.38 + 0.08,
      drift: (Math.random() - 0.5) * 0.08
    }));
  }

  function drawParticles() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    particles.forEach(particle => {
      particle.y -= particle.speed;
      particle.x += particle.drift;
      if (particle.y < -8) {
        particle.y = innerHeight + 8;
        particle.x = Math.random() * innerWidth;
      }
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(135,255,104,${particle.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(drawParticles);
  }
  resizeCanvas();
  drawParticles();
  window.addEventListener('resize', resizeCanvas);
})();
