import { SIZE, makeGame, rotatePiece, placePiece, fits, cellsFor, dailySeed } from './engine.mjs';

const $ = id => document.getElementById(id);
const boardEl = $('board');
const piecesEl = $('pieces');
const statusEl = $('status');
const backdrop = $('dialog-backdrop');
let mode = 'free';
let state = makeGame();
let selected = 0;
let hover = null;
let sound = true;
let audioContext;
const audioAvailable = Boolean(window.AudioContext || window.webkitAudioContext);

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private browsing */ }
}
function bestKey() {
  return mode === 'daily' ? `tide-tiles-daily-${new Date().toISOString().slice(0, 10)}` : 'tide-tiles-free-best';
}
function bestScore() { return Number(safeGet(bestKey()) || 0); }
function saveBest() { if (state.score > bestScore()) safeSet(bestKey(), String(state.score)); }
function announce(detail) { window.dispatchEvent(new CustomEvent('tidetiles:game', { detail })); }

function tone(frequency, duration = .09, type = 'sine') {
  if (!sound || !audioAvailable || document.hidden || !document.hasFocus()) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.09, audioContext.currentTime + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration + .01);
  } catch { /* audio is optional */ }
}

function showDialog(title, kicker, content, buttonText, action) {
  $('dialog-title').textContent = title;
  $('dialog-kicker').textContent = kicker;
  $('dialog-content').innerHTML = content;
  $('dialog-close').textContent = buttonText;
  $('dialog-close').onclick = () => { closeDialog(); action?.(); };
  backdrop.classList.remove('hidden');
  backdrop.setAttribute('aria-hidden', 'false');
  $('dialog-close').focus();
}
function closeDialog() { backdrop.classList.add('hidden'); backdrop.setAttribute('aria-hidden', 'true'); }
function help() {
  showDialog('Make room for the tide', 'HOW TO PLAY',
    '<p><strong>1.</strong> Pick one of the three shapes and tap the board to place it.</p><p><strong>2.</strong> Complete a row or column to clear it and score a bonus.</p><p><strong>3.</strong> After every five placements, alternating rows shift one space. Plan a line-up for the tide!</p><p>Tap <strong>Rotate</strong> or press <strong>R</strong> to turn a shape. The game ends when none of the three shapes can fit.</p>',
    'Got it', null);
}

function previewSet() {
  if (!hover || !state.pieces[selected] || state.over) return new Map();
  const piece = state.pieces[selected];
  const valid = fits(state, piece, hover.row, hover.col);
  const map = new Map();
  for (const [dr, dc] of cellsFor(piece)) {
    const r = hover.row + dr, c = hover.col + dc;
    if (r < SIZE && c < SIZE) map.set(r * SIZE + c, valid ? 'preview' : 'invalid');
  }
  return map;
}

function renderBoard() {
  const preview = previewSet();
  const fragment = document.createDocumentFragment();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const index = r * SIZE + c;
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `cell${state.board[index] ? ` filled ${state.board[index]}` : ''}${preview.has(index) ? ` ${preview.get(index)}` : ''}`;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}${state.board[index] ? `, ${state.board[index]} tile` : ', empty'}`);
      cell.dataset.row = r;
      cell.dataset.col = c;
      fragment.appendChild(cell);
    }
  }
  boardEl.replaceChildren(fragment);
}

function renderPreview() {
  const preview = previewSet();
  [...boardEl.children].forEach((cell, index) => {
    cell.classList.remove('preview', 'invalid');
    if (preview.has(index)) cell.classList.add(preview.get(index));
  });
}

function miniGrid(piece) {
  const occupied = new Set(cellsFor(piece).map(([r, c]) => `${r},${c}`));
  const wrapper = document.createElement('span');
  wrapper.className = 'mini-grid';
  wrapper.setAttribute('aria-hidden', 'true');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const cell = document.createElement('span');
    cell.className = `mini-cell ${piece.color}${occupied.has(`${r},${c}`) ? ' on' : ''}`;
    wrapper.appendChild(cell);
  }
  return wrapper;
}

function renderPieces() {
  const fragment = document.createDocumentFragment();
  state.pieces.forEach((piece, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `piece-button${selected === index ? ' selected' : ''}`;
    button.dataset.index = index;
    button.setAttribute('aria-pressed', String(selected === index));
    button.setAttribute('aria-label', `Shape ${index + 1}, ${piece.color}, ${cellsFor(piece).length} tiles${selected === index ? ', selected' : ''}`);
    const name = document.createElement('span');
    name.className = 'piece-name';
    name.textContent = `SHAPE 0${index + 1}`;
    button.append(name, miniGrid(piece));
    fragment.appendChild(button);
  });
  piecesEl.replaceChildren(fragment);
}

function render() {
  renderBoard();
  renderPieces();
  $('score').textContent = state.score.toLocaleString();
  $('best').textContent = bestScore().toLocaleString();
  $('tide-in').textContent = String(state.tideIn);
  $('turns-label').textContent = `${state.turns} MOVE${state.turns === 1 ? '' : 'S'}`;
  $('mode-label').textContent = mode === 'daily' ? 'DAILY TIDE · UTC' : 'FREE PLAY';
  $('free-mode').classList.toggle('active', mode === 'free');
  $('daily-mode').classList.toggle('active', mode === 'daily');
  $('free-mode').setAttribute('aria-pressed', String(mode === 'free'));
  $('daily-mode').setAttribute('aria-pressed', String(mode === 'daily'));
}

function newGame(nextMode = mode) {
  mode = nextMode;
  state = makeGame(mode === 'daily' ? dailySeed() : Date.now(), mode);
  selected = 0;
  hover = null;
  statusEl.textContent = mode === 'daily' ? 'A fresh puzzle for today. Make every move count.' : 'Choose a shape, then choose a square.';
  render();
  announce({ type: 'start', mode, seed: state.seed });
}

function onPlace(row, col) {
  const result = placePiece(state, selected, row, col);
  if (!result.placed) {
    statusEl.textContent = 'That shape needs more room. Rotate it or try another square.';
    tone(180, .12, 'triangle');
    return;
  }
  state = result.state;
  hover = null;
  saveBest();
  render();
  const { lines, tide, earned } = state.last;
  statusEl.textContent = lines ? `${lines} line${lines > 1 ? 's' : ''} cleared! +${earned} points${tide ? ' · The tide shifted.' : ''}` : tide ? `+${earned} points · The tide shifted!` : `+${earned} points. ${state.tideIn} moves until the tide.`;
  tone(lines ? 740 : tide ? 530 : 430, lines ? .16 : .09);
  announce({ type: 'score', mode, score: state.score, earned, lines, turns: state.turns, tide });
  if (state.over) {
    announce({ type: 'gameover', mode, score: state.score, turns: state.turns });
    showDialog('The tide rests', 'GAME OVER',
      `<p>You placed <strong>${state.turns}</strong> shapes and scored <strong>${state.score.toLocaleString()}</strong> points.</p><p>Best ${mode === 'daily' ? 'today' : 'so far'}: <strong>${bestScore().toLocaleString()}</strong>. Try another route through the shifting board.</p>`,
      'Play again', () => newGame());
  }
}

boardEl.addEventListener('pointerover', event => {
  const cell = event.target.closest('.cell');
  if (!cell) return;
  hover = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
  renderPreview();
});
boardEl.addEventListener('pointerleave', () => { hover = null; renderPreview(); });
boardEl.addEventListener('focusin', event => {
  const cell = event.target.closest('.cell');
  if (!cell) return;
  hover = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
  renderPreview();
});
boardEl.addEventListener('click', event => {
  const cell = event.target.closest('.cell');
  if (cell) onPlace(Number(cell.dataset.row), Number(cell.dataset.col));
});
piecesEl.addEventListener('click', event => {
  const button = event.target.closest('.piece-button');
  if (!button) return;
  selected = Number(button.dataset.index);
  render();
  tone(340, .05);
});
$('rotate-button').addEventListener('click', () => { state = rotatePiece(state, selected); render(); tone(500, .07); });
$('restart-button').addEventListener('click', () => newGame());
$('free-mode').addEventListener('click', () => { if (mode !== 'free') newGame('free'); });
$('daily-mode').addEventListener('click', () => { if (mode !== 'daily') newGame('daily'); });
$('help-button').addEventListener('click', help);
$('sound-button').addEventListener('click', () => {
  sound = !sound;
  $('sound-button').classList.toggle('muted', !sound);
  $('sound-button').setAttribute('aria-label', sound ? 'Mute sound' : 'Unmute sound');
  safeSet('tide-tiles-sound', sound ? 'on' : 'off');
  if (sound) tone(520);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) audioContext?.suspend();
  else if (sound) audioContext?.resume();
});
window.addEventListener('blur', () => audioContext?.suspend());
window.addEventListener('focus', () => { if (sound) audioContext?.resume(); });
document.addEventListener('keydown', event => {
  if (!backdrop.classList.contains('hidden')) {
    if (event.key === 'Escape') closeDialog();
    return;
  }
  if (event.key.toLowerCase() === 'r') { state = rotatePiece(state, selected); render(); tone(500, .07); }
  if (['1', '2', '3'].includes(event.key)) { selected = Number(event.key) - 1; render(); }
  if (event.key === 'Escape') { hover = null; renderPreview(); }
});
backdrop.addEventListener('click', event => { if (event.target === backdrop) closeDialog(); });

sound = safeGet('tide-tiles-sound') !== 'off';
$('sound-button').hidden = !audioAvailable;
$('sound-button').classList.toggle('muted', !sound);
$('sound-button').setAttribute('aria-label', sound ? 'Mute sound' : 'Unmute sound');
render();
if (!safeGet('tide-tiles-seen')) { safeSet('tide-tiles-seen', 'yes'); help(); }
