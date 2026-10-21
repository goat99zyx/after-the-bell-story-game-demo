export const DISTRICTS = [
  { id: 'clinic', name: 'Harbor Clinic', icon: '✚', priority: 4 },
  { id: 'pumps', name: 'Flood Pumps', icon: '◈', priority: 3 },
  { id: 'homes', name: 'Old Town', icon: '⌂', priority: 2 },
  { id: 'port', name: 'Cargo Pier', icon: '⚓', priority: 1 },
];
export const SHIFTS = ['DAWN', 'DAY', 'NIGHT'];
export const TOTAL_TURNS = 12;

function random(seed, index) {
  let n = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  n ^= n >>> 16;
  n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15;
  n = Math.imul(n, 0x846ca68b);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}

export function createGame(seed = Math.floor(Math.random() * 0xffffffff)) {
  return {
    seed: seed >>> 0, turn: 0, trust: 70, funds: 28, fuel: 20,
    battery: 4, batteryMax: 7, windHealth: 100, solarHealth: 100,
    emissions: 0, criticalMisses: 0, served: 0, totalDemand: 0,
    history: [], done: false,
  };
}

export function forecast(state) {
  const shift = state.turn % 3;
  const day = Math.floor(state.turn / 3) + 1;
  const roll = random(state.seed, state.turn);
  const weather = roll < .18 ? 'STORM' : roll < .38 ? 'CALM' : roll < .61 ? 'FOG' : 'CLEAR';
  const windRaw = weather === 'CALM' ? 1 : weather === 'STORM' ? 4 : 3;
  const solarRaw = [1, 5, 0][shift] - (weather === 'FOG' ? 2 : weather === 'STORM' ? 1 : 0);
  const wind = Math.max(0, Math.round(windRaw * state.windHealth / 100));
  const solar = Math.max(0, Math.round(Math.max(0, solarRaw) * state.solarHealth / 100));
  const demand = {
    clinic: 3,
    pumps: weather === 'STORM' ? 4 : 2,
    homes: shift === 2 ? 4 : shift === 0 ? 3 : 2,
    port: shift === 1 ? 3 : 2,
  };
  return { shift, day, weather, wind, solar, renewable: wind + solar, demand,
    totalDemand: Object.values(demand).reduce((a, b) => a + b, 0) };
}

export function capacity(state, plan) {
  const f = forecast(state);
  const diesel = Math.min(Math.max(0, Number(plan.diesel) || 0), 4, state.fuel);
  const discharge = Math.min(Math.max(0, Number(plan.discharge) || 0), 3, state.battery);
  return { ...f, diesel, discharge, available: f.renewable + diesel + discharge };
}

export function autoPlan(state, diesel = 2, discharge = 0) {
  const f = capacity(state, { diesel, discharge });
  let left = f.available;
  const allocations = {};
  for (const d of DISTRICTS) {
    allocations[d.id] = Math.min(f.demand[d.id], left);
    left -= allocations[d.id];
  }
  return { diesel: f.diesel, discharge: f.discharge, allocations, repair: 'none' };
}

export function step(state, plan) {
  if (state.done) throw new Error('The watch is over');
  if (!Number.isInteger(plan.diesel) || plan.diesel < 0 || plan.diesel > 4 || plan.diesel > state.fuel) throw new Error('Invalid diesel order');
  if (!Number.isInteger(plan.discharge) || plan.discharge < 0 || plan.discharge > 3 || plan.discharge > state.battery) throw new Error('Invalid battery order');
  const f = capacity(state, plan);
  const allocations = {};
  for (const d of DISTRICTS) {
    const raw = Number(plan.allocations?.[d.id]);
    if (!Number.isInteger(raw) || raw < 0 || raw > f.demand[d.id]) throw new Error(`Invalid allocation for ${d.id}`);
    allocations[d.id] = raw;
  }
  const supplied = Object.values(allocations).reduce((a, b) => a + b, 0);
  if (supplied > f.available) throw new Error('Power allocation exceeds available supply');
  const repair = plan.repair || 'none';
  const repairCost = repair === 'none' ? 0 : repair === 'fuel' ? 8 : 6;
  if (!['none', 'fuel', 'wind', 'solar'].includes(repair)) throw new Error('Invalid maintenance choice');
  if (repairCost > state.funds) throw new Error('Not enough funds for maintenance');

  const misses = Object.fromEntries(DISTRICTS.map(d => [d.id, f.demand[d.id] - allocations[d.id]]));
  const unmet = Object.values(misses).reduce((a, b) => a + b, 0);
  const trustChange = (unmet === 0 ? 5 : 1) - misses.clinic * 6 - misses.pumps * 3 - misses.homes - misses.port;
  const earned = supplied * 1.6;
  const spent = f.diesel * 2 + repairCost;
  const renewableSpare = Math.max(0, f.renewable - supplied);
  const charged = Math.min(2, state.batteryMax - (state.battery - f.discharge), renewableSpare);
  const stormWear = f.weather === 'STORM' ? 8 : 0;
  const next = {
    ...state,
    turn: state.turn + 1,
    trust: Math.max(0, Math.min(100, state.trust + trustChange)),
    funds: Math.round((state.funds + earned - spent) * 10) / 10,
    fuel: state.fuel - f.diesel + (repair === 'fuel' ? 6 : 0),
    battery: state.battery - f.discharge + charged,
    windHealth: Math.max(35, Math.min(100, state.windHealth - 2 - stormWear + (repair === 'wind' ? 30 : 0))),
    solarHealth: Math.max(35, Math.min(100, state.solarHealth - 2 - (f.weather === 'STORM' ? 4 : 0) + (repair === 'solar' ? 30 : 0))),
    emissions: state.emissions + f.diesel,
    criticalMisses: state.criticalMisses + (misses.clinic > 0 ? 1 : 0),
    served: state.served + supplied,
    totalDemand: state.totalDemand + f.totalDemand,
    done: state.turn + 1 >= TOTAL_TURNS || state.trust + trustChange <= 0,
  };
  const report = { day: f.day, shift: SHIFTS[f.shift], weather: f.weather, supplied,
    demanded: f.totalDemand, unmet, trustChange, earned, spent, charged, repair,
    critical: misses.clinic > 0, misses };
  next.history = [report, ...state.history].slice(0, 8);
  return { state: next, report };
}

export function score(state) {
  return Math.max(0, Math.round(state.trust * 8 + state.funds * 3 + state.battery * 4
    + state.served * 2 - state.emissions * 3 - state.criticalMisses * 30));
}

export function outcome(state) {
  if (!state.done) return null;
  const safe = state.turn >= TOTAL_TURNS && state.trust >= 35 && state.criticalMisses <= 2 && state.funds >= 0;
  return { won: safe, title: safe ? 'THE LIGHTS STAY ON' : 'THE GRID WENT DARK', score: score(state) };
}
