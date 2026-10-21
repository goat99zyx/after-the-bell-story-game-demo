import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, forecast, autoPlan, step, outcome, TOTAL_TURNS } from './sim.mjs';

test('the same seed produces the same forecasts across a full watch', () => {
  let first = createGame(2026);
  let second = createGame(2026);
  for (let turn = 0; turn < TOTAL_TURNS; turn++) {
    assert.deepEqual(forecast(first), forecast(second));
    first = step(first, autoPlan(first)).state;
    second = step(second, autoPlan(second)).state;
    if (first.done || second.done) break;
  }
});

test('dispatch cannot create power or consume more fuel than owned', () => {
  const game = createGame(7);
  const plan = autoPlan(game, 2, 0);
  plan.allocations.port = forecast(game).demand.port;
  assert.throws(() => step(game, plan), /exceeds available/);
  assert.throws(() => step(game, { ...autoPlan(game), diesel: game.fuel + 1 }), /Invalid diesel/);
  assert.throws(() => step(game, { ...autoPlan(game), discharge: 0.5 }), /Invalid battery/);
});

test('a managed fuel policy can complete a twelve-shift watch without a clinic outage', () => {
  let game = createGame(42);
  for (let i = 0; i < TOTAL_TURNS; i++) {
    const f = forecast(game);
    const diesel = Math.min(4, game.fuel);
    const discharge = Math.min(3, game.battery, Math.max(0, f.totalDemand - f.renewable - diesel));
    const plan = autoPlan(game, diesel, discharge);
    plan.repair = game.fuel < 8 ? 'fuel' : 'none';
    const result = step(game, plan);
    assert.ok(result.report.supplied <= f.totalDemand);
    assert.ok(result.state.fuel >= 0);
    assert.ok(result.state.battery >= 0 && result.state.battery <= result.state.batteryMax);
    game = result.state;
  }
  assert.equal(game.turn, TOTAL_TURNS);
  assert.equal(game.criticalMisses, 0);
  assert.equal(outcome(game).won, true);
});
