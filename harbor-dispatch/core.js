(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HarborCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const stops=[{x:-22,y:22,name:'集散仓',en:'DEPOT',color:'#fac768'}, {x:22,y:22,name:'海风咖啡',en:'CAFÉ',color:'#f18a72'}, {x:22,y:-22,name:'灯塔邮局',en:'LIGHTHOUSE',color:'#99d1cb'}, {x:-22,y:-22,name:'花园市场',en:'MARKET',color:'#bdd692'}, {x:0,y:0,name:'中央书屋',en:'BOOKSHOP',color:'#bcb5e5'}];
 const blocks=[{x:-13,y:-13,w:10,d:10,h:7,c:'#e3ab81',roof:'#d17758'}, {x:13,y:-13,w:10,d:10,h:10,c:'#eed6a2',roof:'#407d80'}, {x:-13,y:13,w:10,d:10,h:6,c:'#9fbdad',roof:'#396f70'}, {x:13,y:13,w:10,d:10,h:5,c:'#e4b0a1',roof:'#b96755'}];
 const contracts=[{name:'晨间快递',en:'MORNING RUN',time:210,mult:1,grip:7,desc:'宽裕时间 · 熟悉港口'}, {name:'午间高峰',en:'LUNCH RUSH',time:150,mult:1.4,grip:7,desc:'紧张时限 · 更高报酬'}, {name:'雨后急件',en:'WET STREETS',time:180,mult:1.6,grip:3.2,desc:'湿滑转向 · 易碎货物'}];
 const routes=[[1,3,2,4,1,2],[4,2,3,1,4,2],[3,1,2,4,3,1]];
 function safeProfile(p){p=p||{};return {coins:Math.max(0,Math.floor(Number(p.coins)||0)),best:Math.max(0,Math.floor(Number(p.best)||0)),skin:clamp(Math.floor(Number(p.skin)||0),0,2),unlocked:[true,!!(p.unlocked&&p.unlocked[1]),!!(p.unlocked&&p.unlocked[2])]};}
 function create(profile){return {mode:'menu',contract:0,profile:safeProfile(profile),x:-22,y:22,vx:0,vy:0,heading:0,time:210,elapsed:0,score:0,delivered:0,cargo:false,health:100,target:0,dock:0,cooldown:0,boost:100,notice:'',noticeTime:0,particles:[],skids:[],finished:false};}
 function start(s,i){const profile=s.profile;Object.assign(s,create(profile),{mode:'play',contract:clamp(i,0,2),time:contracts[clamp(i,0,2)].time,notice:'停在光圈内装货，再开往目的地',noticeTime:4});}
 function finish(s){if(s.finished)return;s.finished=true;s.mode='result';s.profile.coins+=s.score;s.profile.best=Math.max(s.profile.best,s.score);s.vx=s.vy=0;}
 function recover(s){if(s.mode!=='play')return;s.x=-22;s.y=22;s.vx=s.vy=0;s.time=Math.max(0,s.time-5);s.health=Math.max(20,s.health-10);s.notice='已回仓 · 耗时 5 秒';s.noticeTime=2;s.dock=0;}
 function collides(x,y){return blocks.some(b=>Math.abs(x-b.x)<b.w/2+1.25&&Math.abs(y-b.y)<b.d/2+1.25);}
 function step(s,input,dt){if(s.mode!=='play')return;dt=clamp(dt,0,.05);s.time=Math.max(0,s.time-dt);s.elapsed+=dt;s.cooldown=Math.max(0,s.cooldown-dt);s.noticeTime=Math.max(0,s.noticeTime-dt);if(s.time<=0){finish(s);return;}
  input=input||{};let ix=clamp(input.x||0,-1,1),iy=clamp(input.y||0,-1,1);let len=Math.hypot(ix,iy);if(len>1){ix/=len;iy/=len;}
  const moving=len>.06, boosted=input.boost&&moving&&s.boost>0&&!input.brake;
  s.boost=clamp(s.boost+(boosted?-28:14)*dt,0,100);
  // Screen-space steering converted to world axes, equally responsive on touch and keyboard.
  let dx=(ix+iy)/Math.SQRT2,dy=(iy-ix)/Math.SQRT2;const maxSpeed=boosted?21:13;
  let rate=input.brake?15:contracts[s.contract].grip;
  const blend=1-Math.exp(-rate*dt);s.vx+=(dx*maxSpeed*(input.brake?.22:1)-s.vx)*blend;s.vy+=(dy*maxSpeed*(input.brake?.22:1)-s.vy)*blend;
  if(!moving){s.vx*=Math.exp(-3*dt);s.vy*=Math.exp(-3*dt);}
  const oldX=s.x,oldY=s.y;s.x=clamp(s.x+s.vx*dt,-29,29);s.y=clamp(s.y+s.vy*dt,-29,29);
  let hit=false;if(collides(s.x,s.y)){s.x=oldX;s.y=oldY;s.vx*=-.28;s.vy*=-.28;hit=true;}if(Math.abs(s.x)===29||Math.abs(s.y)===29)hit=true;
  if(hit&&s.cooldown===0&&Math.hypot(s.vx,s.vy)>1){s.health=Math.max(0,s.health-(s.cargo?12:3));s.cooldown=.7;s.notice=s.cargo?'轻点！包裹受到碰撞':'道路边缘，换个方向';s.noticeTime=1.5;}
  if(Math.hypot(s.vx,s.vy)>.4)s.heading=Math.atan2(s.vy,s.vx);
  const t=stops[s.target],near=Math.hypot(s.x-t.x,s.y-t.y)<3.4,speed=Math.hypot(s.vx,s.vy);
  if(near&&speed<3.5){s.dock+=dt;if(s.dock>=.8){s.dock=0;if(!s.cargo){s.cargo=true;s.health=100;s.target=routes[s.contract][s.delivered];s.notice='装货完成 → '+stops[s.target].name;}else{let pay=Math.round((80+s.health*.7)*contracts[s.contract].mult);s.score+=pay;s.delivered++;s.cargo=false;s.target=0;s.notice='送达！ +'+pay+' 配送积分';if(s.delivered===6){s.score+=Math.floor(s.time)*2;finish(s);}}s.noticeTime=2.8;}}else s.dock=0;
 }
 function buySkin(s,i){const cost=[0,350,700][i];if(cost===undefined)return false;if(!s.profile.unlocked[i]){if(s.profile.coins<cost)return false;s.profile.coins-=cost;s.profile.unlocked[i]=true;}s.profile.skin=i;return true;}
 return {clamp,stops,blocks,contracts,create,start,step,recover,finish,buySkin};
});
