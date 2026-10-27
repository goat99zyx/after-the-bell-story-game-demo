'use strict';
const canvas=document.getElementById('game');
const app=HarborView.create(canvas,{load(){try{return JSON.parse(localStorage.getItem('harbor-dispatch-v1'));}catch{return null;}},save(p){try{localStorage.setItem('harbor-dispatch-v1',JSON.stringify(p));}catch{}}});
function resize(){app.resize(innerWidth,innerHeight,devicePixelRatio);app.draw();}
addEventListener('resize',resize);resize();
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);canvas.focus();app.down(e.pointerId,e.clientX,e.clientY);});canvas.addEventListener('pointermove',e=>app.move(e.pointerId,e.clientX,e.clientY));for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>app.up(e.pointerId));
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter','Escape','KeyP','KeyR','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();if(!e.repeat)app.key(e.code,true);});addEventListener('keyup',e=>app.key(e.code,false));addEventListener('blur',()=>app.pause());document.addEventListener('visibilitychange',()=>{if(document.hidden)app.pause();});
function frame(t){app.tick(t);requestAnimationFrame(frame);}requestAnimationFrame(frame);
// Read-only diagnostics useful to verify the shipped game without mutating gameplay.
window.harborStatus=()=>({mode:app.state.mode,x:app.state.x,y:app.state.y,time:app.state.time,cargo:app.state.cargo,delivered:app.state.delivered,score:app.state.score,boost:app.state.boost});
