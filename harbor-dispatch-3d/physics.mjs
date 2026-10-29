export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const depot={x:-24,z:15},destination={x:24,z:-16};
export function createState(){return {mode:'intro',stage:'collect',x:-24,z:15,y:0,vy:0,vx:0,vz:0,angle:-Math.PI/2,steer:0,speed:0,time:180,integrity:100,cargo:0,boost:100,docking:0,dockDuration:2.4,cooldown:0,impact:0,elapsed:0,travel:0,drift:0,score:0,reason:'',notice:'',noticeTime:0,recoveries:0};}
export function terrainHeight(x,z){if(Math.abs(x)<4&&z>-16&&z<12)return -6;if(x>=-12&&x<=-4&&Math.abs(z)<3.5)return (x+12)*.275;return 0;}
export function target(s){return s.stage==='collect'?depot:destination;}
export function canInteract(s){const t=target(s);return s.mode==='play'&&!s.docking&&s.integrity>0&&Math.hypot(s.x-t.x,s.z-t.z)<4&&Math.hypot(s.vx,s.vz)<1.2&&s.y<.3;}
export function interact(s){if(!canInteract(s))return false;s.docking=.001;s.vx=s.vz=s.speed=0;return true;}
export function recover(s){if(s.mode!=='play')return;s.x=depot.x;s.z=depot.z;s.y=s.vy=s.vx=s.vz=s.speed=0;s.angle=-Math.PI/2;s.time=Math.max(0,s.time-8);s.docking=0;s.recoveries++;s.notice='救援完成 · 用时 +8 秒';s.noticeTime=3;if(s.stage==='deliver')s.integrity=Math.max(0,s.integrity-8);}
function damage(s,force){if(s.cooldown>0||force<2)return;s.impact++;s.cooldown=.65;if(s.stage==='deliver')s.integrity=Math.max(0,s.integrity-(force-1.5)*2.1);s.notice=s.stage==='deliver'?'瓷器易碎，请减速过弯':'小心路边障碍';s.noticeTime=2;}
export function step(s,i={},dt=1/60,world={}){
 if(s.mode!=='play')return;dt=clamp(dt,0,1/30);s.elapsed+=dt;s.time=Math.max(0,s.time-dt);s.cooldown=Math.max(0,s.cooldown-dt);s.noticeTime=Math.max(0,s.noticeTime-dt);
 if(s.integrity<=0||s.time<=0){s.mode='lost';s.reason=s.integrity<=0?'货物已损坏':'未赶上花店的开业时间';s.vx=s.vz=s.speed=0;return;}
 if(s.docking){s.docking+=dt;s.vx=s.vz=s.speed=0;if(s.docking>=s.dockDuration){s.docking=0;if(s.stage==='collect'){s.stage='deliver';s.cargo=3;s.notice='装车完成 · 前往运河对岸的 ATELIER';s.noticeTime=5;}else{s.stage='done';s.cargo=0;s.score=Math.round(s.integrity*10+s.time*4);s.mode='won';}}return;}
 let throttle=clamp(i.throttle||0,-1,1),steer=clamp(i.steer||0,-1,1);s.steer+=(steer*.55-s.steer)*(1-Math.exp(-9*dt));
 const fx=-Math.sin(s.angle),fz=-Math.cos(s.angle),rx=Math.cos(s.angle),rz=-Math.sin(s.angle);let forward=s.vx*fx+s.vz*fz,lateral=s.vx*rx+s.vz*rz;
 const boosted=!!i.boost&&throttle>0&&s.boost>0&&!i.brake;s.boost=clamp(s.boost+(boosted?-26:10)*dt,0,100);
 forward+=throttle*(boosted?15:10)*dt;forward*=Math.exp(-(i.brake?5:throttle?.32:1.15)*dt);forward=clamp(forward,-6.5,boosted?23:16);
 lateral*=Math.exp(-(i.brake?1.2:8)*dt);s.drift=Math.abs(lateral);s.angle-=s.steer*forward/3.4*dt*(i.brake?1.5:1);
 const nfx=-Math.sin(s.angle),nfz=-Math.cos(s.angle);s.vx=nfx*forward+rx*lateral;s.vz=nfz*forward+rz*lateral;
 // Lateral inertia in sharp turns; handbrake lets the rear step out.
 if(i.brake&&Math.abs(forward)>3){s.vx+=rx*s.steer*Math.abs(forward)*dt*2;s.vz+=rz*s.steer*Math.abs(forward)*dt*2;}
 const oldX=s.x,oldZ=s.z,oldGround=terrainHeight(s.x,s.z);s.x+=s.vx*dt;s.z+=s.vz*dt;
 for(const b of world.colliders||[]){if(Math.abs(s.x-b.x)<b.w/2+1.05&&Math.abs(s.z-b.z)<b.d/2+1.05&&s.y<(b.h||8)){const impact=Math.hypot(s.vx,s.vz);s.x=oldX;s.z=oldZ;s.vx*=-.22;s.vz*=-.22;damage(s,impact);break;}}
 if(Math.abs(s.x)>39||Math.abs(s.z)>29){damage(s,Math.hypot(s.vx,s.vz));s.x=clamp(s.x,-39,39);s.z=clamp(s.z,-29,29);s.vx*=.2;s.vz*=.2;}
 for(const p of world.props||[]){const dx=p.x-s.x,dz=p.z-s.z,d=Math.hypot(dx,dz),r=(p.r||.6)+1;if(d<r&&s.y<1){const nx=d>.01?dx/d:1,nz=d>.01?dz/d:0;const hit=Math.max(0,s.vx*nx+s.vz*nz);p.vx=(p.vx||0)+nx*(hit*.8+1);p.vz=(p.vz||0)+nz*(hit*.8+1);p.x=s.x+nx*r;p.z=s.z+nz*r;s.vx*=.82;s.vz*=.82;damage(s,hit*.4);}}
 for(const p of world.props||[]){p.x=clamp(p.x+(p.vx||0)*dt,-38,38);p.z=clamp(p.z+(p.vz||0)*dt,-28,28);p.vx=(p.vx||0)*Math.exp(-3*dt);p.vz=(p.vz||0)*Math.exp(-3*dt);p.spin=(p.spin||0)+Math.hypot(p.vx,p.vz)*dt*.3;}
 const ground=terrainHeight(s.x,s.z);if(oldGround>ground+.2&&s.y>=oldGround-.1&&oldGround>1)s.vy=Math.max(s.vy,3.8);
 s.vy-=15*dt;s.y+=s.vy*dt;if(s.y<ground){if(s.vy<-5)damage(s,-s.vy);s.y=ground;s.vy=0;}if(s.y<-1.5){recover(s);s.notice='落水救援 · 易碎货物受损';s.noticeTime=3;}
 s.speed=s.vx*nfx+s.vz*nfz;s.travel+=Math.hypot(s.vx,s.vz)*dt;
}

