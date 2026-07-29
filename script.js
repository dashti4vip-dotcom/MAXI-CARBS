(() => {
  'use strict';
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => [...c.querySelectorAll(s)];
  const clamp = (n,min=0,max=1) => Math.min(max,Math.max(min,n));
  const pad = n => String(n).padStart(2,'0');

  const flavours = [
    {key:'apple',name:'Apple',word:'APPLE',number:'01',bg:'#08110a',rgb:'140,255,100',accent:'#8cff64',desc:'Crisp, bright and made to keep momentum moving.'},
    {key:'grape',name:'Grape',word:'GRAPE',number:'02',bg:'#16071d',rgb:'193,104,255',accent:'#c168ff',desc:'Deep grape energy with a bold purple atmosphere.'},
    {key:'blue',name:'Blue Exotic',word:'BLUE',number:'03',bg:'#041624',rgb:'50,199,255',accent:'#32c7ff',desc:'A cool electric profile with an exotic blue identity.'},
    {key:'strawberry',name:'Strawberry',word:'BERRY',number:'04',bg:'#24060d',rgb:'255,73,109',accent:'#ff496d',desc:'Sweet strawberry flavour with sharp, athletic energy.'},
    {key:'watermelon',name:'Watermelon',word:'MELON',number:'05',bg:'#17090c',rgb:'255,92,85',accent:'#ff5c55',desc:'Fresh watermelon character with a vivid red finish.'}
  ];
  const sceneCopy = [
    ['Fuel the next move.','A crisp flavour identity built around movement, training and momentum.'],
    ['Fast energy.','Carbohydrate support designed for demanding sessions and active days.'],
    ['BCAA support.','A performance-focused formula presented in a ready-to-drink format.'],
    ['No mixing.','Open it cold, carry it anywhere and keep your rhythm uninterrupted.'],
    ['Choose. Move.','Five flavour worlds. One connected VyoMax Maxi Carbs experience.']
  ];

  let activeIndex = 0;
  let activeScene = 0;
  let soundOn = false;
  let audioCtx = null;
  let particleRgb = flavours[0].rgb;
  let switching = false;

  const body = document.body;
  const root = document.documentElement;
  const themeColor = $('#themeColor');
  const flash = $('#transitionFlash');
  const heroFlavour = $('#heroFlavour');
  const heroDescription = $('#heroDescription');
  const heroNumber = $('#heroNumber');
  const heroWord = $('#heroWord');
  const experienceWord = $('#experienceWord');
  const experienceKicker = $('#experienceKicker');
  const experienceTitle = $('#experienceTitle');
  const experienceText = $('#experienceText');
  const experienceStep = $('#experienceStep');
  const experienceMeter = $('#experienceMeter');
  const burstWord = $('#burstWord');
  const burstBottle = $('#burstBottle');
  const lineupButtons = $$('.lineup-bottle');
  const flavourControls = $$('[data-flavour]');
  const sequenceFrames = $$('.sequence-frame');
  const railButtons = $$('.experience__rail button');

  // Loader
  const loader = $('#loader');
  const loaderBar = $('#loaderBar');
  const loaderCount = $('#loaderCount');
  let loadProgress = 0;
  const loadTimer = setInterval(() => {
    loadProgress += Math.ceil(Math.random()*9);
    if (loadProgress >= 100) {
      loadProgress = 100; clearInterval(loadTimer);
      setTimeout(() => loader.classList.add('is-hidden'), 260);
    }
    loaderBar.style.width = `${loadProgress}%`;
    loaderCount.textContent = pad(loadProgress);
  }, 55);

  function ensureAudio(){
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function tone(type='click'){
    if (!soundOn) return;
    ensureAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (type === 'whoosh') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(170,now); osc.frequency.exponentialRampToValueAtTime(680,now+.16);
      gain.gain.setValueAtTime(.0001,now); gain.gain.exponentialRampToValueAtTime(.055,now+.025); gain.gain.exponentialRampToValueAtTime(.0001,now+.18);
      osc.start(now); osc.stop(now+.19);
    } else {
      osc.type='triangle'; osc.frequency.setValueAtTime(470,now); osc.frequency.exponentialRampToValueAtTime(250,now+.07);
      gain.gain.setValueAtTime(.035,now); gain.gain.exponentialRampToValueAtTime(.0001,now+.08);
      osc.start(now); osc.stop(now+.09);
    }
  }
  const soundToggle = $('#soundToggle');
  soundToggle.addEventListener('click', () => {
    soundOn = !soundOn;
    soundToggle.classList.toggle('is-on',soundOn);
    soundToggle.setAttribute('aria-pressed',String(soundOn));
    soundToggle.setAttribute('aria-label',soundOn?'Disable interface sound':'Enable interface sound');
    soundToggle.querySelector('span').textContent = soundOn?'Sound on':'Sound off';
    if (soundOn){ ensureAudio(); tone('whoosh'); }
  });

  function signedSlot(index){
    let d = index - activeIndex;
    if (d > 2) d -= 5;
    if (d < -2) d += 5;
    return d;
  }
  function updateLineupSlots(){
    lineupButtons.forEach((button,index) => {
      const slot = signedSlot(index);
      const abs = Math.abs(slot);
      const mobile = innerWidth <= 900;
      button.style.setProperty('--x', `${slot * (mobile ? 31 : 17)}vw`);
      button.style.setProperty('--z', `${(2 - abs) * (mobile ? 20 : 45)}px`);
      button.style.setProperty('--ry', `${slot * (mobile ? -10 : -12)}deg`);
      button.style.setProperty('--rz', `${slot * 3}deg`);
      button.style.setProperty('--scale', String(1 - abs * (mobile ? .16 : .12)));
      button.style.setProperty('--opacity', String(1 - abs * .18));
      button.style.setProperty('--sat', String(1 - abs * .16));
      button.style.setProperty('--bright', String(1 - abs * .1));
      button.classList.toggle('is-active',slot===0);
      button.style.zIndex = String(10-Math.abs(slot));
    });
  }
  function updateSequence(flavour){
    sequenceFrames.forEach((frame,index) => {
      frame.src = `assets/images/${flavour.key}-${String(index).padStart(3,'0')}.webp`;
      frame.alt = `Maxi Carbs ${flavour.name} product angle ${index+1}`;
    });
  }
  function setFlavour(index, direction=1){
    const next = (index + flavours.length) % flavours.length;
    if (next === activeIndex || switching) return;
    switching = true;
    activeIndex = next;
    const f = flavours[activeIndex];
    flash.classList.remove('is-active'); void flash.offsetWidth; flash.classList.add('is-active');
    body.dataset.flavour = f.key;
    themeColor.setAttribute('content',f.bg);
    particleRgb = f.rgb;
    heroFlavour.textContent = f.word;
    heroDescription.textContent = f.desc;
    heroNumber.textContent = f.number;
    heroWord.textContent = f.word;
    experienceWord.textContent = f.word;
    experienceKicker.textContent = `${f.number} · ${f.word}`;
    burstWord.textContent = f.word;
    burstBottle.src = `assets/images/${f.key}-000.webp`;
    burstBottle.alt = `Maxi Carbs ${f.name}`;
    flavourControls.forEach(el => el.classList.toggle('is-active',el.dataset.flavour===f.key));
    updateLineupSlots();
    updateSequence(f);
    tone('whoosh');
    navigator.vibrate?.(12);
    setTimeout(() => switching=false,560);
  }

  flavourControls.forEach(control => control.addEventListener('click', () => {
    const i = flavours.findIndex(f => f.key === control.dataset.flavour);
    if (i >= 0) setFlavour(i, i>activeIndex?1:-1);
  }));
  $$('[data-prev]').forEach(btn => btn.addEventListener('click',()=>setFlavour(activeIndex-1,-1)));
  $$('[data-next]').forEach(btn => btn.addEventListener('click',()=>setFlavour(activeIndex+1,1)));

  function bindSwipe(zone){
    let sx=0,sy=0,tracking=false;
    zone.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;sx=e.clientX;sy=e.clientY;tracking=true;zone.setPointerCapture?.(e.pointerId)});
    zone.addEventListener('pointerup',e=>{if(!tracking)return;tracking=false;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>46&&Math.abs(dx)>Math.abs(dy)*1.15)setFlavour(activeIndex+(dx<0?1:-1),dx<0?1:-1)});
    zone.addEventListener('pointercancel',()=>tracking=false);
    zone.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();setFlavour(activeIndex+1,1)}if(e.key==='ArrowLeft'){e.preventDefault();setFlavour(activeIndex-1,-1)}});
  }
  $$('.swipe-zone').forEach(bindSwipe);

  const experience = $('.experience');
  function setScene(scene){
    scene = Math.max(0,Math.min(4,scene));
    if (scene===activeScene) return;
    activeScene=scene;
    sequenceFrames.forEach((frame,i)=>frame.classList.toggle('is-active',i===scene));
    railButtons.forEach((b,i)=>b.classList.toggle('is-active',i===scene));
    experienceTitle.textContent=sceneCopy[scene][0];
    experienceText.textContent=sceneCopy[scene][1];
    experienceStep.textContent=pad(scene+1);
    tone('click');
  }
  railButtons.forEach((b,i)=>b.addEventListener('click',()=>{
    const top = experience.offsetTop + i*(experience.offsetHeight-innerHeight)/4;
    window.scrollTo({top,behavior:'smooth'});
  }));

  const header = $('#siteHeader');
  let ticking=false;
  function onScroll(){
    if(ticking)return;ticking=true;
    requestAnimationFrame(()=>{
      header.classList.toggle('is-scrolled',scrollY>20);
      const r=experience.getBoundingClientRect();
      const scrollable=Math.max(1,experience.offsetHeight-innerHeight);
      const p=clamp(-r.top/scrollable);
      root.style.setProperty('--scene-progress',p.toFixed(4));
      root.style.setProperty('--halo-scale', String(.72 + p * .2));
      root.style.setProperty('--tunnel-rotate', `${p * 35}deg`);
      root.style.setProperty('--product-shift', `${(p - .5) * (innerWidth <= 900 ? 2 : 7)}vw`);
      root.style.setProperty('--product-rotate', `${(p - .5) * 4}deg`);
      root.style.setProperty('--orbit-rotate', `${p * 180}deg`);
      experienceMeter.style.transform=`scaleX(${p})`;
      setScene(Math.min(4,Math.floor(p*5)));
      ticking=false;
    });
  }
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',()=>{updateLineupSlots();onScroll();});

  const menuToggle=$('#menuToggle'), mobileMenu=$('#mobileMenu');
  menuToggle.addEventListener('click',()=>{
    const open=!menuToggle.classList.contains('is-open');
    menuToggle.classList.toggle('is-open',open);mobileMenu.classList.toggle('is-open',open);
    menuToggle.setAttribute('aria-expanded',String(open));mobileMenu.setAttribute('aria-hidden',String(!open));
  });
  $$('#mobileMenu a').forEach(a=>a.addEventListener('click',()=>{menuToggle.classList.remove('is-open');mobileMenu.classList.remove('is-open');menuToggle.setAttribute('aria-expanded','false');mobileMenu.setAttribute('aria-hidden','true')}));

  // Particles
  const canvas=$('#particles'),ctx=canvas.getContext('2d');
  let particles=[],dpr=1;
  function resizeCanvas(){
    dpr=Math.min(devicePixelRatio||1,2);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;canvas.style.width=`${innerWidth}px`;canvas.style.height=`${innerHeight}px`;ctx.setTransform(dpr,0,0,dpr,0,0);
    const count=Math.min(78,Math.max(24,Math.floor(innerWidth/18)));
    particles=Array.from({length:count},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.3+.25,s:Math.random()*.23+.05,a:Math.random()*.32+.06,d:(Math.random()-.5)*.08}));
  }
  function draw(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    particles.forEach(p=>{p.y-=p.s;p.x+=p.d;if(p.y<-8){p.y=innerHeight+8;p.x=Math.random()*innerWidth}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(${particleRgb},${p.a})`;ctx.fill()});
    requestAnimationFrame(draw);
  }
  resizeCanvas();draw();addEventListener('resize',resizeCanvas);
  updateLineupSlots();onScroll();
})();
