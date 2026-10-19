export const SIZE = 8;
export const COLORS = ['coral', 'mint', 'gold', 'violet'];

const SHAPES = [
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 0], [2, 1]],
];

function random(state) {
  let x = state.rng >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.rng = x >>> 0;
  return state.rng / 4294967296;
}

function nextPiece(state) {
  const shape = Math.floor(random(state) * SHAPES.length);
  const color = COLORS[Math.floor(random(state) * COLORS.length)];
  return { shape, color, rotation: 0 };
}

export function cellsFor(piece) {
  let cells = SHAPES[piece.shape].map(([r, c]) => [r, c]);
  for (let turn = 0; turn < piece.rotation % 4; turn++) {
    cells = cells.map(([r, c]) => [c, -r]);
    const minR = Math.min(...cells.map(cell => cell[0]));
    const minC = Math.min(...cells.map(cell => cell[1]));
    cells = cells.map(([r, c]) => [r - minR, c - minC]);
  }
  return cells;
}

export function makeGame(seed = Date.now(), mode = 'free') {
  const state = {
    seed: Number(seed) >>> 0,
    rng: (Number(seed) >>> 0) || 0x9e3779b9,
    mode,
    board: Array(SIZE * SIZE).fill(null),
    pieces: [],
    score: 0,
    turns: 0,
    streak: 0,
    tideIn: 5,
    over: false,
    last: null,
  };
  state.pieces = Array.from({ length: 3 }, () => nextPiece(state));
  return state;
}

export function cloneGame(state) {
  return { ...state, board: [...state.board], pieces: state.pieces.map(piece => ({ ...piece })), last: state.last ? { ...state.last } : null };
}

export function rotatePiece(state, index) {
  if (state.over || !state.pieces[index]) return state;
  const next = cloneGame(state);
  next.pieces[index].rotation = (next.pieces[index].rotation + 1) % 4;
  return next;
}

export function fits(state, piece, row, col) {
  return cellsFor(piece).every(([dr, dc]) => {
    const r = row + dr, c = col + dc;
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE && !state.board[r * SIZE + c];
  });
}

function clearLines(next) {
  const clear = new Set();
  let lines = 0;
  for (let r = 0; r < SIZE; r++) {
    if (next.board.slice(r * SIZE, (r + 1) * SIZE).every(Boolean)) {
      lines++;
      for (let c = 0; c < SIZE; c++) clear.add(r * SIZE + c);
    }
  }
  for (let c = 0; c < SIZE; c++) {
    if (Array.from({ length: SIZE }, (_, r) => next.board[r * SIZE + c]).every(Boolean)) {
      lines++;
      for (let r = 0; r < SIZE; r++) clear.add(r * SIZE + c);
    }
  }
  for (const index of clear) next.board[index] = null;
  return { lines, cells: clear.size };
}

function shiftTide(next) {
  const previous = [...next.board];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const direction = r % 2 === 0 ? 1 : -1;
      const target = (c + direction + SIZE) % SIZE;
      next.board[r * SIZE + target] = previous[r * SIZE + c];
    }
  }
}

export function availableMoves(state) {
  if (state.over) return [];
  const moves = [];
  state.pieces.forEach((piece, index) => {
    if (!piece) return;
    for (let turn = 0; turn < 4; turn++) {
      const testPiece = { ...piece, rotation: turn };
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (fits(state, testPiece, r, c)) moves.push({ index, rotation: turn, row: r, col: c });
        }
      }
    }
  });
  return moves;
}

export function placePiece(state, index, row, col) {
  const piece = state.pieces[index];
  if (state.over || !piece || !fits(state, piece, row, col)) return { state, placed: false };
  const next = cloneGame(state);
  for (const [dr, dc] of cellsFor(piece)) next.board[(row + dr) * SIZE + col + dc] = piece.color;
  next.turns++;
  next.tideIn--;
  let cleared = clearLines(next);
  let tide = false;
  if (next.tideIn === 0) {
    tide = true;
    next.tideIn = 5;
    shiftTide(next);
    const afterTide = clearLines(next);
    cleared = { lines: cleared.lines + afterTide.lines, cells: cleared.cells + afterTide.cells };
  }
  next.streak = cleared.lines ? next.streak + 1 : 0;
  const earned = cellsFor(piece).length * 10 + cleared.cells * 30 + cleared.lines * 80 + (cleared.lines ? next.streak * 25 : 0);
  next.score += earned;
  next.pieces[index] = nextPiece(next);
  next.over = availableMoves(next).length === 0;
  next.last = { earned, lines: cleared.lines, cells: cleared.cells, tide, over: next.over };
  return { state: next, placed: true };
}

export function dailySeed(date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  let hash = 2166136261;
  for (const char of `TIDE-TILES-${day}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
