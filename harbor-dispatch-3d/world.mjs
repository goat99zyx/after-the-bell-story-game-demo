import * as T from './vendor/three.module.js';
export function buildWorld(scene){
 const colliders=[],props=[],animated=[],markers=[],materials=new Map();
 const mat=(c,roughness=.85)=>{let key=c+':'+roughness;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color:c,roughness}));return materials.get(key);};
 const mesh=(geo,m,x,y,z,parent=scene)=>{let o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;o.userData.bake=true;parent.add(o);return o;};
 const box=(x,y,z,w,h,d,c,parent=scene)=>mesh(new T.BoxGeometry(w,h,d),typeof c==='string'?mat(c):c,x,y,z,parent);
 const cyl=(x,y,z,r1,r2,h,c,parent=scene,n=12)=>mesh(new T.CylinderGeometry(r1,r2,h,n),mat(c),x,y,z,parent);
 function sign(label,x,y,z,w=5,h=1,c='#244e50',ink='#f5e9ca',parent=scene){let canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;let g=canvas.getContext('2d');g.fillStyle=c;g.fillRect(0,0,768,192);g.strokeStyle=ink;g.lineWidth=3;g.strokeRect(12,12,744,168);g.fillStyle=ink;g.textAlign='center';g.textBaseline='middle';g.font='bold '+Math.min(95,650/label.length*1.55)+'px Georgia,serif';g.fillText(label,384,103);const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;let o=mesh(new T.BoxGeometry(w,h,.12),new T.MeshStandardMaterial({map:tx,roughness:.9}),x,y,z,parent);return o;}
 function roof(x,y,z,w,d,color='#ae604a'){
 const slope=Math.atan2(2.2,w/2),length=Math.hypot(w/2,2.2);
 for(const side of [-1,1]){
 const panel=box(x+side*w/4,y+1.1,z,length,.18,d,color);panel.rotation.z=-side*slope;
 for(let a=-d/2;a<d/2;a+=.65){const rib=box(x+side*w/4,y+1.22,z+a,length,.075,.07,'#c58b6b');rib.rotation.z=-side*slope;}
 }box(x,y+2.25,z,.2,.18,d+.15,'#d09a78');
 }
 function windowAt(x,y,z,w=1.3,h=1.7){box(x,y,z,w+.25,h+.25,.12,'#e8dcc2');box(x,y,z+.08,w,h,.08,'#36565d');box(x,y,z+.14,.08,h,.08,'#d9c8a6');box(x,y,z+.14,w,.08,.08,'#d9c8a6');for(const side of [-1,1]){box(x+side*(w/2+.3),y,z+.18,.42,h+.08,.13,'#386d69');for(let q=-.6;q<.7;q+=.23)box(x+side*(w/2+.3),y+q,z+.27,.36,.05,.06,'#54817a');}box(x,y-h/2-.12,z+.2,w+.65,.17,.45,'#f0dfbb');}
 function building(x,z,w,d,h,color,roofColor,name){box(x,h/2,z,w,h,d,color);box(x,.3,z,w+.4,.6,d+.4,'#bca78a');box(x,h-.3,z,w+.3,.32,d+.3,'#e9d8b8');colliders.push({x,z,w,d,h});roof(x,h,z,w+.8,d+.8,roofColor);for(let xx=x-w/2+2;xx<x+w/2-1;xx+=3.4){windowAt(xx,h*.7,z+d/2+.02);if(h>8)windowAt(xx,3,z+d/2+.03);}if(name)sign(name,x,2.4,z+d/2+.2,Math.min(w-2,8),1);}
 function awning(x,y,z,w,c='#cf795c'){for(let a=0;a<8;a++){let o=box(x-w/2+w/16+a*w/8,y,z,w/8,.12,2.2,a%2?'#f5e5c5':c);o.rotation.x=.18;box(x-w/2+w/16+a*w/8,y-.24,z+1.08,w/8,.35,.09,a%2?'#f5e5c5':c);}for(let side of [-1,1])cyl(x+side*w*.47,y/2,z+.9,.045,.045,y,'#394e49');}
 function crate(x,z,size=1.2,dynamic=false){let group=new T.Group();group.position.set(x,0,z);scene.add(group);group.userData.skipBake=dynamic;box(0,size/2,0,size,size,size,'#ba8d59',group);for(let side of [-1,1]){for(let a of [-.32,.32])box(a*size,size/2,side*(size/2+.025),.11,size,.07,'#e0b378',group);box(0,size+.02,0,size,.08,.12,'#d6aa70',group);}if(dynamic)props.push({x,z,r:size*.6,vx:0,vz:0,mesh:group});return group;}
 function barrel(x,z){cyl(x,.58,z,.43,.4,1.15,'#af7952');for(let y of [.18,.87])cyl(x,y,z,.445,.445,.1,'#4c5a55');cyl(x,1.17,z,.38,.38,.045,'#d4a16c');}
 function pot(x,z,c='#d07a5a',flowers=false){cyl(x,.45,z,.48,.32,.9,c);for(let i=0;i<7;i++){let a=i*2.4,xx=x+Math.cos(a)*.3,zz=z+Math.sin(a)*.3;let o=mesh(new T.IcosahedronGeometry(flowers?.23:.5,0),mat(flowers?['#e7b88f','#d58b83','#eddaaa'][i%3]:'#6d8c57'),xx,1+(i%3)*.17,zz);o.scale.y=flowers?1:1.5;}}
 function tree(x,z,scale=1){cyl(x,2*scale,z,.2*scale,.32*scale,4*scale,'#8a7555');for(let i=0;i<5;i++){const a=i*2.3;let o=mesh(new T.IcosahedronGeometry(1.6*scale,1),mat(['#698466','#829673','#536e59'][i%3]),x+Math.cos(a)*.8*scale,4.1*scale+(i%2)*.8,z+Math.sin(a)*.8*scale);o.scale.y=1.2;}colliders.push({x,z,w:.5,d:.5,h:4});}
 function lamp(x,z){cyl(x,2.5,z,.07,.1,5,'#365253');box(x,5,z,.7,.15,.5,'#365253');cyl(x,4.7,z,.28,.19,.65,'#f4df9e');box(x,5.15,z,.9,.13,.7,'#365253');}
 function bench(x,z,rot=0){const group=new T.Group();group.position.set(x,0,z);group.rotation.y=rot;scene.add(group);for(let n=0;n<4;n++){box(0,.8,(n-1.5)*.16,2.2,.12,.13,'#ae8355',group);box(0,1.3+n*.14,-.4,2.2,.1,.1,'#ae8355',group);}for(let a of [-.8,.8])box(a,.4,0,.1,.8,.7,'#43534a',group);}
 // Water and raised sandstone banks.
 const water=mesh(new T.PlaneGeometry(300,300,65,65),new T.MeshStandardMaterial({color:'#3b8f94',roughness:.3,metalness:.25,flatShading:true}),0,-1.25,0);water.rotation.x=-Math.PI/2;water.castShadow=false;water.userData.bake=false;animated.push({kind:'water',mesh:water});
 for(let side of [-1,1]){box(side*22,-1,0,36,2,62,'#ad9c7e');box(side*22,-.04,0,36,.12,60,'#cfbb98');box(side*22,.02,0,31,.08,57,'#9e9e86');}
 // Road loop connects the loading bay and atelier across two bridges.
 for(let x of [-17,17])box(x,.04,0,8,.06,55,'#677a76');for(let z of [-20,16])box(0,.055,z,76,.08,8,'#677a76');
 for(let x of [-22.3,-11.7,11.7,22.3])box(x,.12,0,.35,.24,55,'#e4d2ad');
 for(let z of [-24.2,-15.8,11.8,20.2]){box(-22,.1,z,35,.2,.3,'#e4d2ad');box(22,.1,z,35,.2,.3,'#e4d2ad');}
 for(let x=-36;x<38;x+=4)for(let z of [-20,16])if(Math.abs(x)>5)box(x,.11,z,1.5,.025,.1,'#d4c5a1');
 for(let z=-26;z<28;z+=4)for(let x of [-17,17])if(Math.abs(z+20)>5&&Math.abs(z-16)>5)box(x,.11,z,.1,.025,1.4,'#d4c5a1');
 // Two stone bridges, rail openings preserved for driving.
 for(let z of [-20,16]){box(0,-.2,z,9,.5,8,'#bba98a');box(0,.05,z,9,.1,7.7,'#7f8a7b');for(let zz of [z-4,z+4]){box(0,.6,zz,9,1.1,.3,'#c5b292');for(let x=-4;x<=4;x+=2)box(x,.85,zz,.5,1.7,.5,'#d5c3a3');colliders.push({x:0,z:zz,w:9,d:.3,h:1.5});}}
 // Canal edging, quay ropes and ladders.
 for(let side of [-1,1])for(let z=-29;z<30;z+=3){if(Math.abs(z+20)<5||Math.abs(z-16)<5||Math.abs(z)<4)continue;box(side*4.25,.12,z,.45,.5,2.8,'#e4cfaa');cyl(side*5,.5,z,.18,.24,1,'#3c5553');}
 // A clearly marked launch ramp is an optional risky shortcut.
 const rampGeo=new T.BufferGeometry();rampGeo.setAttribute('position',new T.Float32BufferAttribute([-12,0,-3.5,-4,2.2,-3.5,-4,2.2,3.5,-12,0,-3.5,-4,2.2,3.5,-12,0,3.5],3));rampGeo.computeVertexNormals();mesh(rampGeo,new T.MeshStandardMaterial({color:'#b38858',side:T.DoubleSide}),0,.05,0);for(let x=-11;x<-4;x+=.6)box(x,(x+12)*.275+.08,0,.08,.1,7,'#e0b67b');sign('SHORTCUT ↗',-9,1.4,4.8,4.2,.7,'#c88845');
 building(-29,25,17,8,6,'#b4bcac','#547974','HARBOR / 09');
 // Corrugated warehouse doors and gantry.
 for(let x of [-34,-27]){box(x,2,20.93,4,3.9,.2,'#486d67');for(let y=.3;y<4;y+=.35)box(x,y,20.78,3.8,.045,.06,'#7c9690');}box(-24,.15,16,9,.25,6,'#a7a491');
 building(-29,-3,13,15,10,'#dfcbae','#ad6552','MAISON DU PORT');building(-28,-27,15,6,7,'#e5d6ba','#bd765a','CAFÉ MISTRAL');awning(-28,2.8,-22.6,9,'#bb6e50');
 building(29,1,14,17,9,'#d3be98','#8e6052','ATELIER / FLORA');awning(29,3.2,10.6,10,'#467e71');
 building(28,-26,16,6,7,'#e9d7b6','#b77558','LA POSTE');
 // Destination forecourt faces the street, flowers in ceramic planters.
 sign('ATELIER · OPENING 17:00',27,2.3,-11,9,.85,'#325f55');for(let x of [23,25,29,31,33])pot(x,-10.4,'#b87559',true);for(let x of [24,28,32]){pot(x,11.8);pot(x+1.1,11.8,'#debd80',true);}bench(35,-14,Math.PI/2);
 // Roof features: chimneys, pots, balcony ironwork and climbing plants.
 box(-31,12,-5,1,3,1,'#b69b7a');box(-31,13.4,-5,1.35,.3,1.35,'#dfcdb0');box(30,11.5,2,1,3,1,'#b69b7a');
 for(let x of [-32,-28]){box(x,4.5,5.3,2.7,.2,1.2,'#bda78b');for(let n=-1;n<=1;n++)box(x+n*.9,5,5.9,.06,1,.06,'#3e5954');box(x,5.55,5.9,2.7,.08,.06,'#3e5954');pot(x,6.3);}
 for(let x of [-36,-9,10,36])for(let z of [-11,8,26])tree(x,z,.75+(x===36?.2:0));for(let x of [-10,10])for(let z of [-26,-10,8,25])lamp(x,z);
 // Café terrace tables, chairs and umbrellas.
 for(let x of [-35,-30]){cyl(x,.85,-17,.9,.9,.12,'#ede0c1');cyl(x,.42,-17,.08,.08,.85,'#425b55');for(let dx of [-1.2,1.2]){box(x+dx,.5,-17,.6,.1,.7,'#8d7857');box(x+dx,1,-17.3,.6,.8,.08,'#8d7857');}cyl(x,2.1,-17,.04,.04,4.1,'#b5a582');mesh(new T.ConeGeometry(1.9,.6,8),mat('#dec69a'),x,4.1,-17);}
 for(let i=0;i<9;i++)crate(-35+(i%3)*1.5,12+Math.floor(i/3)*1.5,1.1);for(let i=0;i<5;i++)barrel(-36+i*1.1,19.6);for(let p of [[-10,5],[-8,4],[7,-2],[9,1],[13,-8],[-19,-13]])crate(...p,1,true);
 for(let z of [-28,28])for(let x=-37;x<=37;x+=5){if(Math.abs(x)<5)continue;box(x,.5,z,.18,1,.18,'#6b7b6b');box(x+2.5,.85,z,4.8,.08,.1,'#8e9d84');}
 // Original small harbor boats, bobbing on the canal and outer sea.
 function boat(x,z,scale,angle){let group=new T.Group();group.position.set(x,-.8,z);group.rotation.y=angle;group.scale.setScalar(scale);group.userData.skipBake=true;scene.add(group);let hull=mesh(new T.CylinderGeometry(1,1.3,4,5),mat('#e7dac0'),0,0,0,group);hull.rotation.x=Math.PI/2;hull.scale.y=1;hull.scale.x=.7;box(0,.6,0,1.5,.5,2.7,'#386d70',group);box(0,1.1,-.4,1.2,.8,1.3,'#e8dcc1',group);box(0,1.3,.28,1,.4,.02,'#496978',group);cyl(0,2,0,.03,.03,3,'#7e6950',group);animated.push({kind:'boat',mesh:group,phase:x});}boat(0,-5,.8,.2);boat(0,7,.65,Math.PI);boat(-46,10,1.6,.5);boat(48,-22,2,-.3);
 // Beacon at the end of the quay.
 cyl(36,4.8,24,1.3,2,9.6,'#e8d9b7');cyl(36,7.6,24,1.4,1.5,.65,'#bb715a');cyl(36,10,24,1.5,1.5,1.3,'#49696b');mesh(new T.ConeGeometry(2,1,12),mat('#b56950'),36,11.2,24);cyl(36,10.1,24,1.2,1.2,.7,'#f7d99a');
 // Gull silhouettes orbit overhead.
 for(let i=0;i<5;i++){let group=new T.Group();group.userData.skipBake=true;scene.add(group);const left=box(-.38,0,0,.8,.05,.2,'#f5e9d0',group),right=box(.38,0,0,.8,.05,.2,'#f5e9d0',group);animated.push({kind:'gull',mesh:group,left,right,phase:i*1.4});}
 function marker(x,z,c){let group=new T.Group();group.position.set(x,.16,z);group.userData.skipBake=true;scene.add(group);const ring=new T.Mesh(new T.RingGeometry(2.7,2.9,48),new T.MeshBasicMaterial({color:c,side:T.DoubleSide,transparent:true,opacity:.85}));ring.rotation.x=-Math.PI/2;group.add(ring);const beam=new T.Mesh(new T.CylinderGeometry(2.8,2.8,3,48,1,true),new T.MeshBasicMaterial({color:c,transparent:true,opacity:.055,depthWrite:false,side:T.DoubleSide}));beam.position.y=1.5;group.add(beam);markers.push(group);}marker(-24,15,'#ffd37d');marker(24,-16,'#aee4c6');
 bakeStatic(scene);
 return {colliders,props,animated,markers,water,update(t){for(const a of animated){if(a.kind==='boat'){a.mesh.position.y=-.8+Math.sin(t*.8+a.phase)*.09;a.mesh.rotation.z=Math.sin(t+a.phase)*.025;}else if(a.kind==='gull'){a.mesh.position.set(Math.sin(t*.13+a.phase)*28,14+Math.sin(t*.4+a.phase),Math.cos(t*.13+a.phase)*22);a.mesh.rotation.y=-t*.13-a.phase;a.left.rotation.z=Math.sin(t*4+a.phase)*.25;a.right.rotation.z=-a.left.rotation.z;}}for(const p of props){p.mesh.position.x=p.x;p.mesh.position.z=p.z;p.mesh.rotation.y=p.spin||0;p.mesh.position.y=Math.abs(p.x)<4&&Math.abs(p.z)<15?-.7:0;}}};
}
function bakeStatic(scene){scene.updateMatrixWorld(true);const groups=new Map(),remove=[];scene.traverse(o=>{if(!o.isMesh||!o.userData.bake||Array.isArray(o.material))return;let p=o;while(p){if(p.userData.skipBake)return;p=p.parent;}let geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);let list=groups.get(o.material)||[];list.push(geo);groups.set(o.material,list);remove.push(o);});for(const o of remove)o.parent.remove(o);for(const [material,geos]of groups){let total=geos.reduce((n,g)=>n+g.attributes.position.count,0),pos=new Float32Array(total*3),norm=new Float32Array(total*3),uv=new Float32Array(total*2),offset=0;for(const g of geos){pos.set(g.attributes.position.array,offset*3);if(g.attributes.normal)norm.set(g.attributes.normal.array,offset*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,offset*2);offset+=g.attributes.position.count;g.dispose();}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('normal',new T.BufferAttribute(norm,3));geo.setAttribute('uv',new T.BufferAttribute(uv,2));const m=new T.Mesh(geo,material);m.castShadow=m.receiveShadow=true;scene.add(m);}}
