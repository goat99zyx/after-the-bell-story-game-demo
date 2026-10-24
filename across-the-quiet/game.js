(() => {
  'use strict';
  const E = window.QuietEngine;
  const $ = id => document.getElementById(id);
  const canvas = $('game-canvas');
  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let state = E.startLevel();
  let started = false;
  let paused = false;
  let overlayMode = 'start';
  let lastFrame = performance.now();
  let audioCtx = null;
  let soundOn = false;
  let buttonRepeat = null;
  let lastPulseId = 0;
  const stars = Array.from({ length: 48 }, (_, i) => ({ x: ((i * 127.31) % 100) / 100, y: ((i * 53.73) % 100) / 100, r: .45 + (i % 4) * .2 }));

  function tone(frequency, duration, volume = .07) {
    if (!soundOn) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.25, audioCtx.currentTime + duration);
      gain.gain.setValueAtTime(.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + .03);
      gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duration);
      oscillator.connect(gain).connect(audioCtx.destination);
      oscillator.start(); oscillator.stop(audioCtx.currentTime + duration + .01);
    } catch { soundOn = false; $('sound-btn').textContent = 'Sound unavailable'; }
  }

  function setStatus(message) { $('status-text').textContent = message; }
  function updateUI() {
    const level = E.levels[state.level];
    $('chapter-count').textContent = `${String(state.level + 1).padStart(2, '0')} / ${String(E.levels.length).padStart(2, '0')}`;
    $('chapter-title').textContent = level.title;
    $('story-line').textContent = level.line;
    $('echo-count').textContent = `ECHOES ${level.echoes.length - state.echoes.size} / ${level.echoes.length}`;
    const energy = state.energy ? 1 : E.isSafe(state) ? Math.min(1, state.restMs / 1000) : 0;
    $('energy-fill').style.width = `${Math.round(energy * 100)}%`;
    $('energy-label').textContent = state.energy ? 'Ready' : E.isSafe(state) ? 'Resting…' : 'Recharge on shore';
    $('pulse-btn').disabled = !started || paused || state.completed || !state.energy || !E.isSafe(state);
  }
  function showOverlay(mode) {
    overlayMode = mode;
    $('overlay').classList.remove('hidden');
    const content = {
      start: ['✦', 'A SMALL JOURNEY', 'Across the Quiet', 'A gentle pulse makes hidden bridges appear. Find the echoes on each shore, then reach the waiting light. Pause on an island to recharge.', 'Begin the journey'],
      next: ['✧', `SHORE ${state.level + 1} REACHED`, 'A little closer', 'The water grew louder, but the light found its way. There is another shore ahead.', 'Continue'],
      finish: ['✦', 'THE QUIET RETURNS', 'Someone was waiting', 'The last wave fades. Two lights are here now, and the distance between them is gone. Thank you for making the journey.', 'Play again'],
      paused: ['◇', 'TAKE YOUR TIME', 'Paused', 'The bridges will wait until you return.', 'Resume'],
    }[mode];
    ['overlay-symbol', 'overlay-kicker', 'overlay-title', 'overlay-copy', 'overlay-action'].forEach((id, i) => {
      $(id).textContent = content[i];
    });
  }
  function hideOverlay() { $('overlay').classList.add('hidden'); overlayMode = null; }
  function restart() {
    state = E.startLevel(); started = true; paused = false; lastPulseId = 0;
    hideOverlay(); setStatus('Find the first hidden bridge'); updateUI();
  }
  function overlayAction() {
    if (overlayMode === 'start' || overlayMode === 'finish') { restart(); return; }
    if (overlayMode === 'next') {
      state = E.nextLevel(state); lastPulseId = state.pulseId;
      hideOverlay(); setStatus('A new shore ahead'); updateUI(); return;
    }
    if (overlayMode === 'paused') { paused = false; hideOverlay(); setStatus('Keep going'); }
  }
  function move(dx, dy) {
    if (!started || paused || state.completed) return;
    const beforeFalls = state.falls;
    const beforeEchoes = state.echoes.size;
    if (!E.move(state, dx, dy)) { setStatus('The water is too deep here'); return; }
    if (state.completed) {
      tone(440, .38); setTimeout(() => tone(660, .52), 85);
      setStatus('You reached the light');
      showOverlay(state.level === E.levels.length - 1 ? 'finish' : 'next');
    } else if (state.echoes.size < beforeEchoes) { tone(587, .32, .045); setStatus('An echo is remembered'); }
    else if (state.falls > beforeFalls) setStatus('The shore holds you');
    else if (state.x === E.levels[state.level].goal[0] && state.y === E.levels[state.level].goal[1]) setStatus(`${state.echoes.size} echo${state.echoes.size === 1 ? '' : 'es'} still waiting`);
    else if (E.isBridge(state, state.x, state.y)) setStatus('Keep crossing while the bridge glows');
    else setStatus(state.energy ? 'Your light is ready' : 'Pause here to restore your light');
    updateUI();
  }
  function pulse() {
    if (!started || paused || state.completed) return;
    if (!E.pulse(state)) { setStatus(E.isSafe(state) ? 'Rest on the shore to recharge' : 'Pulse from a safe island'); return; }
    tone(392, .62); setStatus('The hidden path is glowing'); updateUI();
  }
  function pause() {
    if (!started || state.completed) return;
    paused = !paused;
    if (paused) showOverlay('paused'); else hideOverlay();
    updateUI();
  }

  $('overlay-action').addEventListener('click', overlayAction);
  $('pulse-btn').addEventListener('click', pulse);
  $('restart-btn').addEventListener('click', () => { state = E.startLevel(); started = false; paused = false; showOverlay('start'); updateUI(); });
  $('sound-btn').addEventListener('click', () => {
    soundOn = !soundOn; $('sound-btn').textContent = soundOn ? 'Sound on' : 'Sound off';
    $('sound-btn').setAttribute('aria-pressed', String(soundOn)); if (soundOn) tone(440, .22, .035);
  });
  document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    const direction = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] }[key];
    if (direction) { event.preventDefault(); move(...direction); return; }
    if (key === ' ' || key === 'enter') { event.preventDefault(); overlayMode ? overlayAction() : pulse(); }
    if (key === 'p' || key === 'escape') { event.preventDefault(); if (overlayMode === 'paused') overlayAction(); else pause(); }
  });
  document.querySelectorAll('.move-btn').forEach(button => {
    const dx = Number(button.dataset.dx), dy = Number(button.dataset.dy);
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); button.setPointerCapture(event.pointerId); move(dx, dy);
      clearInterval(buttonRepeat); buttonRepeat = setInterval(() => move(dx, dy), 180);
    });
    const stop = () => { clearInterval(buttonRepeat); buttonRepeat = null; };
    button.addEventListener('pointerup', stop); button.addEventListener('pointercancel', stop); button.addEventListener('lostpointercapture', stop);
  });
  canvas.addEventListener('pointerdown', event => {
    if (!started || paused || overlayMode) return;
    const bounds = canvas.getBoundingClientRect();
    const width = bounds.width, height = bounds.height;
    const unit = Math.min(width / E.WIDTH, height / E.HEIGHT);
    const ox = (width - unit * E.WIDTH) / 2, oy = (height - unit * E.HEIGHT) / 2;
    const x = Math.floor((event.clientX - bounds.left - ox) / unit);
    const y = Math.floor((event.clientY - bounds.top - oy) / unit);
    if (Math.abs(x - state.x) + Math.abs(y - state.y) === 1) move(x - state.x, y - state.y);
  });

  function resizeCanvas() {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(box.width * dpr));
    const height = Math.max(1, Math.round(box.height * dpr));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  }
  function circle(x, y, r, fill) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  }
  function roundedRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.1; ctx.stroke(); }
  }
  function draw(now) {
    resizeCanvas();
    const w = canvas.width, h = canvas.height;
    const level = E.levels[state.level];
    const bg = ctx.createLinearGradient(0, 0, w, h); bg.addColorStop(0, level.palette[0]); bg.addColorStop(.62, level.palette[1]); bg.addColorStop(1, '#071c2b');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    for (const star of stars) {
      const alpha = reducedMotion.matches ? .22 : .2 + .13 * Math.sin(now * .00045 + star.x * 17);
      circle(star.x * w, star.y * h, star.r * Math.min(w / 900, 1.2) + .5, `rgba(215,246,243,${alpha})`);
    }
    const unit = Math.min(w / E.WIDTH, h / E.HEIGHT);
    const ox = (w - unit * E.WIDTH) / 2, oy = (h - unit * E.HEIGHT) / 2;
    const px = x => ox + (x + .5) * unit;
    const py = y => oy + (y + .5) * unit;
    for (let row = 0; row < E.HEIGHT; row++) {
      const yy = py(row);
      ctx.beginPath(); ctx.moveTo(0, yy + unit * .27); ctx.bezierCurveTo(w * .28, yy - unit * .12, w * .67, yy + unit * .47, w, yy + unit * .06);
      ctx.strokeStyle = 'rgba(198,245,237,.055)'; ctx.lineWidth = Math.max(1, unit * .018); ctx.stroke();
    }
    for (const tile of state.tiles.safe) {
      const [x, y] = tile.split(',').map(Number);
      const tx = ox + x * unit + unit * .055, ty = oy + y * unit + unit * .055;
      roundedRect(tx, ty, unit * .89, unit * .89, unit * .19, 'rgba(139,210,201,.18)', 'rgba(179,230,218,.42)');
      roundedRect(tx + unit * .1, ty + unit * .11, unit * .69, unit * .66, unit * .13, 'rgba(117,188,179,.13)');
    }
    for (const tile of state.tiles.bridges) {
      const [x, y] = tile.split(',').map(Number);
      const lit = E.bridgeLit(state, x, y);
      const tx = ox + x * unit + unit * .12, ty = oy + y * unit + unit * .14;
      roundedRect(tx, ty, unit * .76, unit * .72, unit * .15, lit ? 'rgba(232,219,166,.72)' : 'rgba(193,215,214,.045)', lit ? '#f8eabb' : 'rgba(196,225,222,.23)');
      if (lit) { ctx.shadowColor = '#ffeab3'; ctx.shadowBlur = unit * .45; circle(px(x), py(y), unit * .1, '#fff4ca'); ctx.shadowBlur = 0; }
      else circle(px(x), py(y), unit * .04, 'rgba(194,221,223,.38)');
    }
    for (const tile of state.echoes) {
      const [x, y] = tile.split(',').map(Number);
      ctx.save(); ctx.translate(px(x), py(y)); ctx.rotate(Math.PI / 4);
      ctx.shadowColor = '#f8db99'; ctx.shadowBlur = unit * .45;
      roundedRect(-unit * .115, -unit * .115, unit * .23, unit * .23, unit * .035, '#f8db99');
      ctx.restore();
    }
    const goal = level.goal;
    ctx.shadowColor = '#ffe0a0'; ctx.shadowBlur = state.echoes.size ? unit * .35 : unit * .75;
    circle(px(goal[0]), py(goal[1]), unit * .3, state.echoes.size ? '#ab9a7c' : '#ffe6ac');
    ctx.shadowBlur = 0; circle(px(goal[0]), py(goal[1]), unit * .13, state.echoes.size ? '#e0c5a1' : '#fffdf0');
    if (state.pulse) {
      const fraction = 1 - state.pulse.ms / 4800;
      const radius = unit * (1 + fraction * 3.1);
      ctx.beginPath(); ctx.arc(px(state.pulse.x), py(state.pulse.y), radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(248,223,166,${Math.max(0, .55 - fraction * .45)})`;
      ctx.lineWidth = Math.max(1.4, unit * .04); ctx.stroke();
      ctx.beginPath(); ctx.arc(px(state.pulse.x), py(state.pulse.y), radius * .64, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(208,244,226,.14)'; ctx.lineWidth = Math.max(1, unit * .018); ctx.stroke();
    }
    const bob = reducedMotion.matches ? 0 : Math.sin(now * .003) * unit * .035;
    ctx.shadowColor = '#bdf3eb'; ctx.shadowBlur = unit * .9;
    circle(px(state.x), py(state.y) + bob, unit * .32, '#a7e8e1');
    ctx.shadowBlur = 0; circle(px(state.x), py(state.y) + bob, unit * .13, '#f1ffff');
  }
  function frame(now) {
    const dt = Math.min(100, now - lastFrame); lastFrame = now;
    if (started && !paused && !overlayMode) {
      const beforeFalls = state.falls;
      E.tick(state, dt);
      if (state.falls > beforeFalls) setStatus('The wave faded. Try again from the shore');
      if (lastPulseId !== state.pulseId) lastPulseId = state.pulseId;
    }
    updateUI(); draw(now); requestAnimationFrame(frame);
  }
  showOverlay('start'); updateUI(); requestAnimationFrame(frame);
})();

