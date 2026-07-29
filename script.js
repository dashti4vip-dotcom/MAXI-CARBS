(() => {
  const loader = document.getElementById('loader');
  const count = document.getElementById('loaderCount');
  let n = 0;
  const timer = setInterval(() => {
    n += Math.ceil((100 - n) * 0.13);
    if (n >= 99) n = 99;
    count.textContent = String(n).padStart(2, '0');
  }, 55);

  window.addEventListener('load', () => {
    setTimeout(() => {
      clearInterval(timer);
      count.textContent = '100';
      loader.classList.add('is-hidden');
      document.querySelectorAll('.reveal').forEach((el, i) => {
        if (i === 0) setTimeout(() => el.classList.add('in-view'), 180);
      });
    }, 1150);
  });

  const header = document.getElementById('siteHeader');
  const bottle = document.getElementById('bottle');
  const productStage = document.getElementById('productStage');
  const progress = document.getElementById('powerProgress');
  const glow = document.getElementById('cursorGlow');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 20);
    const heroH = Math.max(window.innerHeight, 700);
    const t = Math.min(1, y / heroH);
    bottle.style.transform = `translateY(${t * 90}px) rotate(${2 + t * 12}deg) scale(${1 - t * .08})`;

    const power = document.querySelector('.power');
    const rect = power.getBoundingClientRect();
    const span = power.offsetHeight - window.innerHeight;
    const p = Math.max(0, Math.min(1, -rect.top / Math.max(1, span)));
    progress.style.transform = `scaleX(${p})`;
  }, { passive: true });

  if (matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
      const r = productStage.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      bottle.style.setProperty('translate', `${dx * 10}px ${dy * 8}px`);
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: .16 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize(){
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    particles = Array.from({length: Math.min(70, Math.floor(innerWidth / 18))}, () => ({
      x: Math.random()*innerWidth,
      y: Math.random()*innerHeight,
      r: Math.random()*1.4+.25,
      v: Math.random()*.35+.08,
      a: Math.random()*.55+.12
    }));
  }
  function draw(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for(const p of particles){
      p.y -= p.v;
      if(p.y < -10){p.y = innerHeight+10;p.x=Math.random()*innerWidth}
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(123,255,143,${p.a})`;ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  resize(); draw(); addEventListener('resize', resize);
})();
