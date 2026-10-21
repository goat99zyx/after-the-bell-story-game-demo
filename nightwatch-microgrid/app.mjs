import { DISTRICTS, SHIFTS, TOTAL_TURNS, createGame, forecast, capacity, autoPlan, step, outcome, score } from './sim.mjs';

const KEY = 'nightwatch-microgrid-v1';
const root = document.getElementById('game');
const help = document.getElementById('helpDialog');
let game;
try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  game = saved && Number.isInteger(saved.turn) && saved.turn >= 0 && saved.turn <= TOTAL_TURNS ? saved : createGame();
} catch { game = createGame(); }
let plan = game.done ? null : autoPlan(game, 2, 0);
let statusText = '';

function save() { try { localStorage.setItem(KEY, JSON.stringify(game)); } catch {} }
function num(n) { return Number(n).toFixed(n % 1 === 0 ? 0 : 1); }
function meter(value, max) { return `<div class="bar" aria-hidden="true"><i style="width:${Math.max(0,Math.min(100,value/max*100))}%"></i></div>`; }
function stepper(id, value, max, min = 0, district = '') {
  return `<div class="stepper" role="group" aria-label="${district || id}"><button type="button" data-action="decrease" data-target="${id}" aria-label="Decrease ${district || id}" ${value <= min ? 'disabled' : ''}>−</button><strong>${value}</strong><button type="button" data-action="increase" data-target="${id}" aria-label="Increase ${district || id}" ${value >= max ? 'disabled' : ''}>+</button></div>`;
}
function render() {
  if (game.done) { renderEnd(); return; }
  const f = forecast(game);
  const c = capacity(game, plan);
  const allocated = Object.values(plan.allocations).reduce((a,b)=>a+b,0);
  root.innerHTML = `
    <section class="metrics" aria-label="Grid status">
      <div class="metric ${game.trust < 35 ? 'danger' : 'good'}"><small>PUBLIC TRUST</small><strong>${game.trust}%</strong><em>minimum 35%</em></div>
      <div class="metric"><small>FUNDS</small><strong>$${num(game.funds)}</strong><em>maintenance reserve</em></div>
      <div class="metric"><small>DIESEL FUEL</small><strong>${game.fuel}</strong><em>units remaining</em></div>
      <div class="metric"><small>BATTERY</small><strong>${game.battery}/${game.batteryMax}</strong><em>stored power</em></div>
    </section>
    <div class="layout">
      <section class="panel" aria-label="Generation forecast">
        <div class="panel-head"><div><p class="eyebrow">LIVE CONDITIONS</p><h2>Harbor forecast</h2></div><span class="pill ${f.weather==='STORM'?'storm':''}">${f.weather}</span></div>
        <div class="weather-scene" data-weather="${f.weather}" data-shift="${SHIFTS[f.shift]}" role="img" aria-label="Illustrated harbor under ${f.weather.toLowerCase()} weather at ${SHIFTS[f.shift].toLowerCase()}"><div class="scene-sun"></div><div class="hill"></div><div class="sea"></div><div class="turbine"></div><div class="lighthouse"></div><span class="scene-caption">DAY ${f.day} / ${SHIFTS[f.shift]} SHIFT</span></div>
        <div class="source-row"><span class="source-icon">✳</span><span class="source-label">Wind turbine <small>· ${game.windHealth}% condition</small></span><strong>${f.wind} MW</strong></div>${meter(f.wind,4)}
        <div class="source-row"><span class="source-icon">☼</span><span class="source-label">Solar array <small>· ${game.solarHealth}% condition</small></span><strong>${f.solar} MW</strong></div>${meter(f.solar,5)}
        <p class="tip">Forecast demand: <strong>${f.totalDemand} MW</strong>. Renewable generation: <strong>${f.renewable} MW</strong>. Extra renewable power charges the battery after the shift.</p>
      </section>
      <section class="panel" aria-label="Power dispatch">
        <div class="panel-head"><div><p class="eyebrow">DISPATCH DESK</p><h2>Choose your supply</h2></div><span class="pill">SHIFT ${game.turn+1}/${TOTAL_TURNS}</span></div>
        <div class="control"><div class="control-top"><div><label>Diesel generators</label><br><small>2 dollars + 1 fuel per MW</small></div>${stepper('diesel',c.diesel,Math.min(4,game.fuel))}</div></div>
        <div class="control"><div class="control-top"><div><label>Battery discharge</label><br><small>Stored clean power</small></div>${stepper('discharge',c.discharge,Math.min(3,game.battery))}</div></div>
        <div class="supply-band ${allocated > c.available?'over':''}"><span>POWER ASSIGNED</span><strong>${allocated} / ${c.available} MW</strong></div>
        <p class="eyebrow">DISTRICT ALLOCATION</p>
        ${DISTRICTS.map(d=>`<div class="district"><div class="district-top"><div><div class="district-name"><span aria-hidden="true">${d.icon}</span>${d.name}</div><div class="district-meta">Needs ${f.demand[d.id]} MW${d.id==='clinic'?' · critical':''}</div></div>${stepper(d.id,plan.allocations[d.id],f.demand[d.id],0,d.name)}</div>${meter(plan.allocations[d.id],f.demand[d.id])}</div>`).join('')}
        <button type="button" class="textbutton" data-action="auto">Auto assign: clinic first</button>
      </section>
      <section class="panel" aria-label="Maintenance and shift log">
        <div class="panel-head"><div><p class="eyebrow">FIELD ORDERS</p><h2>One maintenance action</h2></div></div>
        <div class="maintenance">
          ${[['none','No work','Free'],['wind','Repair wind','−$6 · +30%'],['solar','Repair solar','−$6 · +30%'],['fuel','Buy fuel','−$8 · +6 units']].map(([id,label,detail])=>`<button type="button" data-action="repair" data-target="${id}" class="${plan.repair===id?'selected':''}" aria-pressed="${plan.repair===id}" ${id!=='none'&&game.funds<(id==='fuel'?8:6)?'disabled':''}><strong>${label}</strong>${detail}</button>`).join('')}
        </div>
        <button class="primary execute" type="button" data-action="run">RUN THIS SHIFT →</button>
        <div class="status" role="status">${statusText}</div>
        <p class="eyebrow" style="margin-top:18px">WATCH LOG</p>
        <ol class="history">${game.history.length ? game.history.map(r=>`<li><b>DAY ${r.day} / ${r.shift}</b> · ${r.supplied}/${r.demanded} MW served · <span class="${r.trustChange<0?'bad':''}">${r.trustChange>=0?'+':''}${r.trustChange} trust</span>${r.critical?' · clinic outage':''}</li>`).join('') : '<li>The first shift is yours to plan.</li>'}</ol>
        <p class="tip">The grid survives if trust stays above 35, the clinic loses power on at most two shifts, and funds remain nonnegative after shift 12.</p>
      </section>
    </div>`;
}
function renderEnd() {
  const result = outcome(game);
  root.innerHTML = `<div class="endcard"><p class="eyebrow ${result.won?'':'amber'}">FOUR-DAY WATCH COMPLETE</p><h2>${result.title}</h2><div class="score">${score(game)} POINTS</div><p>${game.served} of ${game.totalDemand} MW served · ${game.criticalMisses} clinic outage shifts · ${game.emissions} diesel units emitted · ${game.trust}% public trust.</p><button type="button" class="primary" data-action="new">START A NEW WATCH</button><button type="button" class="ghost" data-action="same">RETRY SAME WEATHER</button></div>`;
}
function adjust(target, delta) {
  const f = forecast(game);
  if (target === 'diesel' || target === 'discharge') {
    const limit = target === 'diesel' ? Math.min(4,game.fuel) : Math.min(3,game.battery);
    plan[target] = Math.max(0,Math.min(limit,plan[target]+delta));
    const cap = capacity(game,plan).available;
    for (const d of [...DISTRICTS].reverse()) {
      const over = Object.values(plan.allocations).reduce((a,b)=>a+b,0)-cap;
      if (over>0) plan.allocations[d.id]=Math.max(0,plan.allocations[d.id]-over);
    }
  } else if (target in plan.allocations) {
    const current=plan.allocations[target];
    const total=Object.values(plan.allocations).reduce((a,b)=>a+b,0);
    if (delta>0 && total>=capacity(game,plan).available) { statusText='No spare power. Lower another district or add supply.';return; }
    plan.allocations[target]=Math.max(0,Math.min(f.demand[target],current+delta));
  }
  statusText='';
}
root.addEventListener('click', event=>{
  const button=event.target.closest('button[data-action]');if(!button)return;
  const {action,target}=button.dataset;
  try {
    if(action==='increase'||action==='decrease') adjust(target,action==='increase'?1:-1);
    else if(action==='auto') plan=autoPlan(game,plan.diesel,plan.discharge);
    else if(action==='repair') plan.repair=target;
    else if(action==='run') { const result=step(game,plan);game=result.state;save();plan=game.done?null:autoPlan(game,2,0);statusText=`${result.report.supplied}/${result.report.demanded} MW served. ${result.report.trustChange>=0?'+':''}${result.report.trustChange} trust.`; }
    else if(action==='new'||action==='same') { const seed=action==='same'?game.seed:Math.floor(Math.random()*0xffffffff);game=createGame(seed);plan=autoPlan(game,2,0);statusText='';save(); }
  } catch(error) {statusText=error.message;}
  render();
});
document.getElementById('helpButton').addEventListener('click',()=>help.showModal());
document.getElementById('closeHelp').addEventListener('click',()=>help.close());
help.addEventListener('click',event=>{if(event.target===help)help.close();});
save();render();
