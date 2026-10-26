// What the maths specialist could be worn as: glasses, earbuds and a locket, modelled in Three.js.
// One wearable per cover stage (content.js steps them); drag turns it. A prototype render, not a real product.
// Three.js loads from the import map in index.html, only once the section is close to the viewport.
const wear=document.querySelector('.wear');
if(wear){
 const go=()=>boot(wear).catch(err=>{console.warn('wear.js:',err);wear.classList.add('wear--off')});
 if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){io.disconnect();go()}},{rootMargin:'800px 0px'});io.observe(wear)}
 else go();
}

async function boot(cover){
 const [THREE,{RoomEnvironment},{mergeVertices}]=await Promise.all([import('three'),import('three/addons/environments/RoomEnvironment.js'),import('three/addons/utils/BufferGeometryUtils.js')]);
 await document.fonts?.ready;
 const canvas=cover.querySelector('canvas'),notes=[...cover.querySelectorAll('.wear-note')];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),toggle=document.querySelector('.motion-toggle');
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(24,1,.1,200);
 const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;pmrem.dispose();
 const key=new THREE.DirectionalLight('#fff3e8',1.4);key.position.set(-5,9,7);scene.add(key,new THREE.HemisphereLight('#ffffff','#e2d8ca',.5));

 const TAU=Math.PI*2,V2=(x,y)=>new THREE.Vector2(x,y),V3=(x,y,z)=>new THREE.Vector3(x,y,z);
 let seed=7,time=0;const random=()=>(seed=seed*16807%2147483647)/2147483647;
 const loop=(pts,n)=>new THREE.CatmullRomCurve3(pts.map(([x,y])=>V3(x,y,0)),true,'centripetal').getPoints(n).slice(0,-1).map(p=>V2(p.x,p.y));
 const smooth=g=>{g.deleteAttribute('uv');g.deleteAttribute('normal');g=mergeVertices(g,1e-4);g.computeVertexNormals();return g};
 // Wraps a flat front around the face: z -= k·x², with the normals carried through the same bend.
 const bend=(g,k)=>{const p=g.attributes.position,n=g.attributes.normal,v=V3();for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,p.getZ(i)-k*x*x);v.set(n.getX(i)+2*k*x*n.getZ(i),n.getY(i),n.getZ(i)).normalize();n.setXYZ(i,v.x,v.y,v.z)}p.needsUpdate=n.needsUpdate=true;return g};
 const canvasTex=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();return [tex,c.getContext('2d')]};
 const mesh=(geo,mat,parent,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m};
 const anchor=(parent,x,y,z)=>{const o=new THREE.Object3D();o.position.set(x,y,z);parent.add(o);return o};

 const phys=(color,o)=>new THREE.MeshPhysicalMaterial({color,roughness:.4,...o});
 const M={
  acetate:phys('#232a33',{roughness:.3,clearcoat:1,clearcoatRoughness:.12}),
  lens:phys('#c3d0da',{roughness:.04,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide,clearcoat:1}),
  metal:new THREE.MeshStandardMaterial({color:'#d4d7db',metalness:1,roughness:.22}),
  steel:new THREE.MeshStandardMaterial({color:'#e3e5e8',metalness:.8,roughness:.38}),
  glass:phys('#0b0e12',{roughness:.06,clearcoat:1}),
  shell:phys('#f2efe9',{roughness:.28,clearcoat:1,clearcoatRoughness:.15}),
  silicone:phys('#d8d2c8',{roughness:.8}),
  brass:new THREE.MeshStandardMaterial({color:'#e2b873',metalness:1,roughness:.24,envMapIntensity:1.3}),
  chip:phys('#17191d',{roughness:.45}),
  board:phys('#222b34',{roughness:.6}),
 };
 M.brassIn=M.brass.clone();M.brassIn.side=THREE.DoubleSide;
 const DIM=new THREE.Color('#4a2a20'),HOT=new THREE.Color('#ff6a3d');
 const glow=()=>new THREE.MeshBasicMaterial({color:HOT,toneMapped:false}),pulse=(m,v)=>m.color.lerpColors(DIM,HOT,v);

 // The NPU's die: an 8×8 grid of cores that light in waves while it works. Shared by every wearable that shows it.
 const [dieTex,die]=canvasTex(256,256),cores=Array.from({length:64},(_,i)=>({x:i%8,y:i>>3,p:random()*TAU,s:.6+random()*1.4}));
 function paintDie(heat){
  die.fillStyle='#16191d';die.fillRect(0,0,256,256);die.strokeStyle='#c9a35a';die.lineWidth=4;die.strokeRect(10,10,236,236);
  cores.forEach(c=>{const g=heat*Math.max(0,Math.sin(time*c.s*2.2+c.p+c.x*.6))**3;die.fillStyle=`rgb(${60+195*g|0},${36+80*g|0},${30+34*g|0})`;die.fillRect(24+c.x*27,24+c.y*27,22,22)});
  dieTex.needsUpdate=true;
 }
 const dieMat=new THREE.MeshStandardMaterial({map:dieTex,emissiveMap:dieTex,emissive:'#ffffff',roughness:.35});

 function glasses(){
  // A wayfarer front, like the EyeQ drawings: cameras on both corners, the NPU in the right arm,
  // and the working typed into the right lens as the model writes it, 8 tokens a second.
  const root=new THREE.Group(),g=new THREE.Group(),K=.035;root.add(g);g.position.z=2.9;
  const half=[[0,1.08],[1.2,1.12],[2.5,1.18],[3.2,1.16],[3.42,1],[3.42,.62],[3.2,.1],[2.95,-.55],[2.6,-.98],[2,-1.16],[1.4,-1.16],[.85,-1],[.55,-.62],[.4,-.2],[.22,.06],[0,.14]];
  const lens=(cx,s,grow=1)=>Array.from({length:96},(_,i)=>{const t=i/96*TAU,c=Math.cos(t),n=Math.sin(t),x=Math.sign(c)*Math.abs(c)**.59*1.1*grow,y=Math.sign(n)*Math.abs(n)**.59*.84*grow;return V2(cx+x*(1+.1*y/.84),y+.06*x*s)});
  const shape=new THREE.Shape(loop([...half,...half.slice(1,-1).reverse().map(([x,y])=>[-x,y])],240));
  shape.holes.push(new THREE.Path(lens(1.65,1)),new THREE.Path(lens(-1.65,-1)));
  const front=smooth(new THREE.ExtrudeGeometry(shape,{depth:.3,bevelThickness:.05,bevelSize:.045,bevelSegments:3}));front.translate(0,0,-.15);
  mesh(bend(front,K),M.acetate,g);
  [-1,1].forEach(s=>mesh(bend(new THREE.ShapeGeometry(new THREE.Shape(lens(1.65*s,s,1.03))),K),M.lens,g));
  const arm=smooth(new THREE.ExtrudeGeometry(new THREE.Shape(loop([[0,.34],[1.6,.3],[3.6,.2],[4.6,.12],[5.3,-.1],[5.75,-.55],[5.86,-.76],[5.72,-.82],[5.5,-.62],[5.05,-.24],[4.4,-.08],[3.6,-.06],[1.6,-.14],[0,-.18]],180)),{depth:.1,bevelThickness:.035,bevelSize:.035,bevelSegments:3}));
  arm.rotateY(Math.PI/2).translate(-.05,0,0);
  const arms=[],cams=[];
  [-1,1].forEach(s=>{
   const a=mesh(arm,M.acetate,g,s*3.3,.72,-.52);a.rotation.y=-s*.06;arms.push(a);
   mesh(new THREE.BoxGeometry(.16,.18,.26),M.metal,g,s*3.3,.86,-.5);
   const cam=new THREE.Group();cam.position.set(s*2.98,.7,-.1);cam.rotation.y=Math.atan(2*K*s*2.98);g.add(cam);cams.push(cam);
   mesh(new THREE.CylinderGeometry(.2,.2,.07,40).rotateX(Math.PI/2),M.metal,cam,0,0,.02);
   mesh(new THREE.CylinderGeometry(.13,.13,.08,32).rotateX(Math.PI/2),M.glass,cam,0,0,.03);
  });
  const rec=glow();mesh(new THREE.SphereGeometry(.045,16,12),rec,cams[1],0,0,.075);
  const led=glow();mesh(new THREE.BoxGeometry(.02,.06,.34),led,arms[1],.09,.18,-.85);
  const [hudTex,hud]=canvasTex(512,288),LINES=['2x + 6 = 14','2x = 14 − 6','x = 8 ÷ 2','x = 4'].map(l=>l.split(' ')),TOTAL=LINES.flat().length;
  const screen=mesh(new THREE.PlaneGeometry(1.7,.96),new THREE.MeshBasicMaterial({map:hudTex,transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}),g,1.65,.05,-K*1.65*1.65+.03);
  screen.rotation.y=Math.atan(2*K*1.65);
  let clock=0,shown=-1;
  function paintHud(n){
   shown=n;hud.clearRect(0,0,512,288);hud.font='500 50px "IBM Plex Mono", ui-monospace, monospace';
   let left=n,end=null;
   LINES.forEach((words,i)=>{const k=Math.max(0,Math.min(words.length,left));left-=words.length;if(!k)return;const text=words.slice(0,k).join(' ');hud.fillStyle=i===LINES.length-1?'#de552e':'rgba(222,85,46,.85)';hud.fillText(text,20,56+i*66);end=[20+hud.measureText(text).width+8,56+i*66]});
   if(n<TOTAL){hud.fillStyle='#de552e';hud.fillRect(end?end[0]:20,(end?end[1]:56)-38,18,44)}
   hudTex.needsUpdate=true;
  }
  return {root,size:1,view:[7,3.8],yaw:-.5,foot:[7,2.6],notes:[['Camera',cams[0]],['Steps, in the lens',anchor(screen,-.3,-.62,0)],['NPU in the arm',anchor(arms[1],.09,.1,-1.6)]],
   tick(dt,live,on){
    clock=on?clock+dt:0;const n=live?Math.min(TOTAL,Math.floor(Math.max(0,clock-.5)*8)):TOTAL;if(n!==shown)paintHud(n);
    pulse(led,live&&on&&n<TOTAL?.6+.4*Math.sin(time*40):.3);pulse(rec,!live||time%1.4<.7?1:.15);
   }};
 }

 function earbuds(){
  // A pair turned out to show their mics; the rings around them pulse like a voice reading the steps aloud.
  const root=new THREE.Group(),g=new THREE.Group();root.add(g);g.position.y=.5;
  const buds=[-1,1].map(s=>{
   const b=new THREE.Group();b.position.x=s*1.45;b.rotation.set(0,-s*.75,-s*.08);g.add(b);
   mesh(new THREE.SphereGeometry(.55,48,32),M.shell,b).scale.set(1,.85,.8);
   mesh(new THREE.CylinderGeometry(.14,.17,.26,32),M.shell,b,-s*.4,.04,.12).rotation.z=s*Math.PI/2;
   mesh(new THREE.SphereGeometry(.26,40,24),M.silicone,b,-s*.52,.04,.14).scale.set(.7,1,1);
   const stem=mesh(new THREE.CapsuleGeometry(.14,1,8,24),M.shell,b,s*.1,-.82,-.06);stem.rotation.set(.14,0,-s*.06);
   mesh(new THREE.CylinderGeometry(.143,.143,.07,32),M.metal,stem,0,-.57,0);
   mesh(new THREE.SphereGeometry(.1,24,16),M.glass,b,s*.53,0,0).scale.set(.3,1,1);
   const ring=glow(),r=mesh(new THREE.TorusGeometry(.14,.016,12,48),ring,b,s*.522,0,0);r.rotation.y=s*Math.PI/2;
   const waves=[0,1].map(()=>{const w=mesh(new THREE.RingGeometry(.14,.155,48),new THREE.MeshBasicMaterial({color:HOT,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),b,s*.55,0,0);w.rotation.y=s*Math.PI/2;return w});
   return {b,s,ring,waves,stem};
  });
  return {root,size:1.3,view:[4.6,2.5],yaw:0,foot:[4.6,1.4],notes:[['Mic',buds[0].b.children[5]],['NPU in the stem',anchor(buds[1].stem,0,-.2,0)],['Speaker',buds[1].b.children[2]]],
   tick(dt,live,on){
    buds.forEach(({b,s,ring,waves},i)=>{
     b.position.y=Math.sin(time*1.3+i*2)*.05;
     pulse(ring,on?.35+.65*Math.abs(Math.sin(time*9+i)*Math.sin(time*2.3+i*.7)):.3);
     waves.forEach((w,k)=>{const p=(time*.6+k*.5+i*.25)%1;w.scale.setScalar(1+p*2.4);w.position.x=s*(.55+p*.35);w.material.opacity=on&&live?.45*(1-p):0});
    });
   }};
 }

 function locket(){
  // Opens on a hinge to show a round board: the NPU, a coin cell, and a photo in the lid, as a locket should have.
  const root=new THREE.Group(),g=new THREE.Group();root.add(g);
  const P=pts=>pts.map(([x,y])=>V2(x,y));
  mesh(new THREE.LatheGeometry(P([[.001,-.2],[.95,-.2],[1.12,-.16],[1.21,-.08],[1.235,0],[1.235,.03],[1.13,.03],[1.12,-.11],[.001,-.11]]),96).rotateX(Math.PI/2),M.brassIn,g);
  const [pcbTex,pc]=canvasTex(512,512),Y=y=>256*(1-y/1.1);
  pc.fillStyle='#222b34';pc.fillRect(0,0,512,512);pc.lineCap='round';
  // Traces fan out from the chip to the pads round the rim, leaving the bottom clear for the coin cell.
  pc.strokeStyle='#33404d';pc.lineWidth=5;
  for(let i=0;i<22;i++){const a=-3.45+i*.18,cx=256+Math.cos(a)*44,cy=Y(.32)+Math.sin(a)*44;pc.beginPath();pc.moveTo(cx,cy);pc.lineTo(cx+Math.cos(a)*50,cy+Math.sin(a)*50);pc.lineTo(256+Math.cos(a)*226,256+Math.sin(a)*226);pc.stroke()}
  for(let i=0;i<40;i++){const a=i/40*TAU;pc.fillStyle='#c9a24f';pc.beginPath();pc.arc(256+Math.cos(a)*238,256+Math.sin(a)*238,6,0,TAU);pc.fill()}
  pc.fillStyle='#d9d2c4';pc.textAlign='center';pc.font='600 24px Inter, Arial, sans-serif';pc.fillText('AR-01',256,Y(-.06));pc.font='500 14px "IBM Plex Mono", monospace';pc.fillText('MATHS SPECIALIST',256,Y(-.15));
  pcbTex.needsUpdate=true;
  mesh(new THREE.CylinderGeometry(1.1,1.1,.04,64).rotateX(Math.PI/2),M.board,g,0,0,-.09);
  mesh(new THREE.CircleGeometry(1.1,64),new THREE.MeshStandardMaterial({map:pcbTex,roughness:.55}),g,0,0,-.069);
  const chip=mesh(new THREE.BoxGeometry(.6,.06,.6).rotateX(Math.PI/2),[M.chip,M.chip,dieMat,M.chip,M.chip,M.chip],g,0,.32,-.04);
  const cell=mesh(new THREE.CylinderGeometry(.3,.3,.07,48).rotateX(Math.PI/2),M.steel,g,0,-.6,-.035);
  const hinge=new THREE.Group();hinge.position.set(-1.235,0,.03);g.add(hinge);
  mesh(new THREE.LatheGeometry(P([[.001,.05],[1.13,.05],[1.16,.03],[1.235,.03],[1.235,.08],[1.2,.15],[1.08,.22],[.8,.27],[.001,.29]]),96).rotateX(Math.PI/2).translate(1.235,0,-.03),M.brassIn,hinge);
  const photoTex=new THREE.TextureLoader().load('assets/me-portrait.jpg');photoTex.colorSpace=THREE.SRGBColorSpace;
  const photo=mesh(new THREE.CircleGeometry(1,64),new THREE.MeshStandardMaterial({map:photoTex,roughness:.5}),hinge,1.235,0,.018);photo.rotation.y=Math.PI;
  const eye=new THREE.Group();eye.position.set(1.235,0,.26);hinge.add(eye);
  mesh(new THREE.CylinderGeometry(.22,.22,.05,40).rotateX(Math.PI/2),M.metal,eye);
  mesh(new THREE.CylinderGeometry(.15,.15,.06,32).rotateX(Math.PI/2),M.glass,eye,0,0,.01);
  const eyeRing=glow();mesh(new THREE.TorusGeometry(.25,.02,12,48),eyeRing,eye,0,0,.01);
  mesh(new THREE.CylinderGeometry(.06,.06,.5,20),M.metal,g,-1.25,0,.03);
  mesh(new THREE.CylinderGeometry(.07,.07,.2,20),M.brass,g,0,1.3,-.08);
  mesh(new THREE.TorusGeometry(.2,.055,16,40).rotateY(Math.PI/2),M.brass,g,0,1.44,-.08);
  // The chain: oval links along two strands, every other link turned a quarter.
  const strands=[-1,1].map(s=>new THREE.CatmullRomCurve3([V3(0,1.62,-.08),V3(s*.45,2.1,-.12),V3(s*1.2,3.3,-.35),V3(s*2,5.4,-.7)]));
  const per=Math.ceil(strands[0].getLength()/.19),chain=new THREE.InstancedMesh(new THREE.TorusGeometry(.075,.022,8,20).scale(1.5,1,1),M.brass,per*2);
  const m4=new THREE.Matrix4(),t=V3(),a=V3(),b=V3(),Z=V3(0,0,1);let k=0;
  strands.forEach(c=>{for(let i=0;i<per;i++){const u=(i+.5)/per;c.getTangentAt(u,t);a.crossVectors(t,Z).normalize();b.crossVectors(t,a);(i%2?m4.makeBasis(t,b,a.clone().negate()):m4.makeBasis(t,a,b)).setPosition(c.getPointAt(u));chain.setMatrixAt(k++,m4)}});
  g.add(chain);
  // Opened right back, so the lid lies beside the body; the pair slides over to stay centred.
  let open=0;
  return {root,size:1.45,view:[5.6,3.05],yaw:.25,foot:[4.4,1.2],notes:[['NPU',chip],['Battery',cell],['Room for a photo',anchor(hinge,1.235,-.66,.01)]],ready:()=>open>.85,
   tick(dt,live,on){
    open=live?open+((on?1:0)-open)*Math.min(1,dt*2.2):on?1:0;const e=open*open*(3-2*open);hinge.rotation.y=-e*2.6;g.position.x=e*1.08;
    pulse(eyeRing,.4+.6*(.5+.5*Math.sin(time*2.4)));paintDie(.3+.7*open);
   }};
 }

 const devices=[glasses(),earbuds(),locket()];
 devices.forEach(d=>{d.mix=0;d.root.visible=false;scene.add(d.root)});
 const [shTex,sh]=canvasTex(128,128),grd=sh.createRadialGradient(64,64,0,64,64,64);
 grd.addColorStop(0,'rgba(53,65,79,.9)');grd.addColorStop(.5,'rgba(53,65,79,.3)');grd.addColorStop(1,'rgba(53,65,79,0)');sh.fillStyle=grd;sh.fillRect(0,0,128,128);shTex.needsUpdate=true;
 const shadow=mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false,toneMapped:false}),scene);

 // The camera backs off until each wearable's view (half-width, half-height around it) fits, and eases between them.
 let W=1,H=1,tanV=1,tanH=1,dist=0,last=0,raf=0,visible=false,drag=null,spinY=0,spinX=0,idle=0,label=-1;
 const v=V3(),CENTER=1.75;
 const motion=()=>visible&&!document.hidden&&!reduce.matches&&toggle?.getAttribute('aria-pressed')!=='true';
 function step(dt,live){
  const stage=Math.min(devices.length-1,Number(cover.dataset.stage||0));
  // The next wearable waits until the last has mostly shrunk away, then grows in turning.
  devices.forEach((d,i)=>{
   const want=i===stage&&devices.every((o,j)=>j===i||o.mix<.25)?1:0;
   d.mix=live?d.mix+(want-d.mix)*Math.min(1,dt*3.4):i===stage?1:0;if(!want&&d.mix<.003)d.mix=0;
   const e=d.mix*d.mix*(3-2*d.mix);d.root.visible=e>.001;
   d.root.scale.setScalar(d.size*Math.max(.001,e));
   d.root.rotation.y=d.yaw+Math.sin(time*.24)*.22+spinY+(1-e)*1.6;
   d.root.position.y=CENTER+.15+Math.sin(time*.9)*.05-(1-e)*.5;
   if(d.root.visible)d.tick(dt,live,i===stage&&d.mix>.9);
  });
  const fw=devices.reduce((s,d)=>s+d.foot[0]*d.mix,0),fd=devices.reduce((s,d)=>s+d.foot[1]*d.mix,0);
  shadow.scale.set(Math.max(.01,fw),1,Math.max(.01,fd));shadow.material.opacity=.2*Math.max(...devices.map(d=>d.mix));
  const [vw,vh]=devices[stage].view,fit=Math.max(vw/tanH,vh/tanV);dist=live&&dist?dist+(fit-dist)*Math.min(1,dt*2.4):fit;
  // Aim a little below the piece so it clears the status pill.
  const pitch=.2+spinX,aim=CENTER-.14*dist*tanV;camera.position.set(0,aim+Math.sin(pitch)*dist,Math.cos(pitch)*dist);camera.lookAt(0,aim,0);camera.updateMatrixWorld();
  // Notes swap their text only once the old ones have faded, then follow their parts as the piece turns.
  const d=devices[stage];if(label!==stage&&d.mix>.9){label=stage;notes.forEach((n,k)=>n.firstElementChild.textContent=d.notes[k]?.[0]||'')}
  scene.updateMatrixWorld();
  notes.forEach((n,k)=>{const note=label===stage&&d.notes[k],on=!!note&&d.mix>.97&&Math.abs(spinY)<.45&&(d.ready?.()??true);n.classList.toggle('on',on);if(!note)return;note[1].getWorldPosition(v).project(camera);n.style.transform=`translate(${(v.x+1)/2*W}px,${(1-v.y)/2*H}px)`;n.classList.toggle('flip',v.x>.3)});
 }
 function frame(now){
  raf=0;const real=last?Math.min(.05,(now-last)/1000):0;last=now;const live=motion(),dt=live?real:0;time+=dt;
  if(!drag&&(idle+=real)>2.2){const k=Math.min(1,real*2.4);spinY-=spinY*k;spinX-=spinX*k}
  step(dt,live);renderer.render(scene,camera);
  const settling=!drag&&Math.abs(spinY)+Math.abs(spinX)>.002;
  if(visible&&!document.hidden&&(live||drag||settling))raf=requestAnimationFrame(frame);else last=0;
 }
 const kick=()=>{if(!raf)raf=requestAnimationFrame(frame)};
 function resize(){
  W=cover.clientWidth;H=cover.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(W,H,false);
  camera.aspect=W/H;camera.updateProjectionMatrix();
  tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));tanH=tanV*camera.aspect;dist=0;kick();
 }
 cover.addEventListener('pointerdown',e=>{if(e.button)return;drag={x:e.clientX,y:e.clientY,sy:spinY,sx:spinX};cover.setPointerCapture(e.pointerId);cover.classList.add('is-dragging');kick()});
 cover.addEventListener('pointermove',e=>{if(!drag)return;spinY=drag.sy+(e.clientX-drag.x)*.009;spinX=Math.max(-.18,Math.min(.5,drag.sx+(e.clientY-drag.y)*.004));idle=0;kick()});
 const end=()=>{if(!drag)return;drag=null;idle=0;spinY=Math.atan2(Math.sin(spinY),Math.cos(spinY));cover.classList.remove('is-dragging');kick()};
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>cover.addEventListener(type,end));
 new ResizeObserver(resize).observe(cover);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;kick()},{threshold:.02}).observe(cover);
 new MutationObserver(kick).observe(cover,{attributes:true,attributeFilter:['data-stage']});
 toggle?.addEventListener('click',()=>setTimeout(kick));document.addEventListener('visibilitychange',kick);reduce.addEventListener('change',kick);
 cover.classList.add('wear--on');
}
