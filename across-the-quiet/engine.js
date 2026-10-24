const WIDTH = 15;
const HEIGHT = 9;

const levels = [
  {
    title: 'A small beginning', line: 'One light can make a little path.',
    palette: ['#081f32', '#123c52', '#8de5d5'],
    islands: [[3, 5, 2, 4], [8, 10, 2, 4]],
    bridges: [[6, 3], [7, 3]],
    start: [4, 3], goal: [9, 3], echoes: [[8, 2]],
  },
  {
    title: 'The distance grows', line: 'Rest when you reach a shore. Then send another wave.',
    palette: ['#102543', '#315373', '#d5a8ec'],
    islands: [[1, 3, 5, 7], [6, 8, 2, 4], [11, 13, 5, 7]],
    bridges: [[4, 5], [5, 5], [5, 4], [6, 4], [9, 4], [10, 4], [10, 5], [11, 5]],
    start: [2, 6], goal: [12, 6], echoes: [[7, 2], [12, 7]],
  },
  {
    title: 'All the waves at once', line: 'The water is wider now. Find your own rhythm.',
    palette: ['#172345', '#6d5190', '#ffd3a4'],
    islands: [[1, 3, 2, 4], [6, 8, 5, 7], [11, 13, 2, 4]],
    bridges: [[4, 4], [5, 4], [5, 5], [6, 5], [9, 5], [10, 5], [10, 4], [11, 4]],
    start: [2, 3], goal: [12, 3], echoes: [[7, 7], [11, 2]],
  },
  {
    title: 'The quiet returns', line: 'There is still a way to reach someone.',
    palette: ['#102b40', '#21545b', '#f6e8ba'],
    islands: [[1, 3, 5, 7], [6, 8, 5, 7], [11, 13, 5, 7]],
    bridges: [[4, 6], [5, 6], [9, 6], [10, 6]],
    start: [2, 6], goal: [12, 6], echoes: [[7, 5]],
  },
];

function key(x, y) { return `${x},${y}`; }
function makeTiles(level) {
  const safe = new Set();
  for (const [x1, x2, y1, y2] of level.islands) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) safe.add(key(x, y));
  }
  const bridges = new Set(level.bridges.map(([x, y]) => key(x, y)));
  return { safe, bridges };
}

function startLevel(index = 0) {
  const level = levels[index];
  if (!level) throw new RangeError('Unknown level');
  const tiles = makeTiles(level);
  return {
    level: index, x: level.start[0], y: level.start[1],
    checkpoint: [...level.start], energy: 1, restMs: 0,
    pulse: null, pulseId: 0, steps: 0, falls: 0,
    completed: false, finished: false, tiles,
    echoes: new Set(level.echoes.map(([x, y]) => key(x, y))),
  };
}

function isSafe(state, x = state.x, y = state.y) { return state.tiles.safe.has(key(x, y)); }
function isBridge(state, x, y) { return state.tiles.bridges.has(key(x, y)); }
function bridgeLit(state, x, y) {
  if (!state.pulse) return false;
  return Math.hypot(x - state.pulse.x, y - state.pulse.y) <= 4.15;
}
function pulse(state) {
  if (state.finished || state.completed || !isSafe(state) || state.energy < 1) return false;
  state.energy = 0;
  state.restMs = 0;
  state.pulse = { x: state.x, y: state.y, ms: 4800 };
  state.pulseId++;
  return true;
}
function fall(state) {
  state.x = state.checkpoint[0];
  state.y = state.checkpoint[1];
  state.pulse = null;
  state.energy = 1;
  state.restMs = 0;
  state.falls++;
}
function move(state, dx, dy) {
  if (state.finished || state.completed || Math.abs(dx) + Math.abs(dy) !== 1) return false;
  const nx = state.x + dx;
  const ny = state.y + dy;
  if (nx < 0 || nx >= WIDTH || ny < 0 || ny >= HEIGHT) return false;
  if (!isSafe(state, nx, ny) && !(isBridge(state, nx, ny) && bridgeLit(state, nx, ny))) return false;
  state.x = nx; state.y = ny; state.steps++;
  if (isSafe(state)) {
    state.checkpoint = [nx, ny];
    state.echoes.delete(key(nx, ny));
    const goal = levels[state.level].goal;
    if (nx === goal[0] && ny === goal[1] && state.echoes.size === 0) {
      state.completed = true;
      state.pulse = null;
      return true;
    }
  }
  return true;
}
function tick(state, dt) {
  if (state.finished || state.completed) return;
  const elapsed = Math.max(0, Math.min(dt, 250));
  if (state.pulse) {
    state.pulse.ms -= elapsed;
    if (state.pulse.ms <= 0) {
      state.pulse = null;
      if (!isSafe(state)) fall(state);
    }
  }
  if (isSafe(state) && state.energy < 1) {
    state.restMs += elapsed;
    if (state.restMs >= 1000) { state.energy = 1; state.restMs = 1000; }
  }
}
function nextLevel(state) {
  if (!state.completed) return null;
  if (state.level === levels.length - 1) { state.finished = true; return state; }
  return startLevel(state.level + 1);
}

const api = { WIDTH, HEIGHT, levels, startLevel, isSafe, isBridge, bridgeLit, pulse, move, tick, nextLevel };
if (typeof module !== 'undefined') module.exports = api;
if (typeof window !== 'undefined') window.QuietEngine = api;

