// Motion for the sections below the hero, carried over from the earlier portfolio and the Builders.mu page.
// One "Pause cover motion" button (.motion-toggle) controls every cover.

(()=>{
 // Two models drawn layer by layer: the full Qwen3-30B, and a maths specialist that keeps only its subject's experts.
 // Each colour stands for an expert. Particles run up the threads while a scan layer rises through the stack and the
 // dots gather into clusters. An illustration, not real weights.
 const cover=document.querySelector('.prune'),canvas=cover.querySelector('canvas'),ctx=canvas.getContext('2d');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),toggle=document.querySelector('.motion-toggle');
 const colors=['#de552e','#ef8f3a','#2f8fd8','#78bfe8','#6a4c9c','#2d3b66','#c4607f','#e3b23c'];
 const LAYERS=12,THREADS=192,KEEP=[0,2,4],SCAN=5.2;
 let seed=2029;const random=()=>(seed=seed*16807%2147483647)/2147483647;
 const gauss=()=>(random()+random()+random()+random()-2)/.58;
 const clamp=v=>Math.max(-.92,Math.min(.92,v));
 const centers=colors.map(()=>[random()*1.3-.65,random()*1.3-.65]);
 const threads=Array.from({length:THREADS},(_,i)=>{
  const k=i%colors.length,[cx,cz]=centers[k],pts=[];let x=cx+gauss()*.07,z=cz+gauss()*.07;
  for(let j=0;j<LAYERS;j++){pts.push([x,z]);x=clamp(x*.92+gauss()*.13);z=clamp(z*.92+gauss()*.13)}
  // Calibration pulls each kept thread back towards its cluster, more in the deeper layers.
  const fit=pts.map(([x,z],j)=>[x+(cx-x)*.4*j/LAYERS,z+(cz-z)*.4*j/LAYERS]),len=Math.hypot(...pts[0])||1;
  return {color:colors[k],pts,fit,cut:!KEEP.includes(k),out:[pts[0][0]/len,pts[0][1]/len],phase:random()*6.283,flow:random(),speed:.16+random()*.12,specks:[[gauss()*.05,gauss()*.05],[gauss()*.05,gauss()*.05]]};
 });
 let W=0,H=0,dpr=1,time=0,last=0,drawn=0,cutAmt=0,fitAmt=0,visible=false,raf=0,cos=1,sin=0;
 const geometry=()=>{const small=W<560;return {small,s:small?Math.min(W*.15,H*.22):Math.min(W*.13,H*.24),gap:H*(small?.042:.052),top:H*(small?.27:.3),towers:[{cx:W*(small?.27:.3),label:'Qwen3-30B',pruned:false},{cx:W*(small?.73:.7),label:'Maths specialist',pruned:true}]}};
 const project=(g,t,x,z,j)=>[t.cx+(x*cos-z*sin)*g.s,g.top+j*g.gap+(x*sin+z*cos)*g.s*.46];
 const dot=(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill()};
 function plane(g,t,j,stroke,fill){
  ctx.beginPath();[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([x,z],i)=>{const [px,py]=project(g,t,x,z,j);i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill()}ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();
 }
 function model(t,th,j){ // a thread's position on layer j, with its sway and the calibration pull
  const f=t.pruned&&!th.cut?fitAmt:0,[x,z]=th.pts[j],[fx,fz]=th.fit[j],sway=(j/LAYERS+.2)*.05;
  return [x+(fx-x)*f+Math.sin(time*.55+th.phase+j*.45)*sway,z+(fz-z)*f+Math.cos(time*.47+th.phase*1.3+j*.5)*sway];
 }
 function curve(p){ // samples along the smooth path through the layer points (quadratics through midpoints)
  const out=[p[0]];
  for(let j=1;j<p.length-1;j++){
   const s=j===1?p[0]:[(p[j-1][0]+p[j][0])/2,(p[j-1][1]+p[j][1])/2],c=p[j],e=[(p[j][0]+p[j+1][0])/2,(p[j][1]+p[j+1][1])/2];
   for(let k=1;k<=4;k++){const u=k/4,a=(1-u)*(1-u),b=2*(1-u)*u,d=u*u;out.push([a*s[0]+b*c[0]+d*e[0],a*s[1]+b*c[1]+d*e[1]])}
  }
  out.push(p[p.length-1]);return out;
 }
 const at=(c,f)=>{const i=Math.min(c.length-2,Math.floor(f)),u=f-i;return [c[i][0]+(c[i+1][0]-c[i][0])*u,c[i][1]+(c[i+1][1]-c[i][1])*u]};
 function draw(){
  const g=geometry(),small=g.small,quiet=reduce.matches,lw=Math.min(.9,Math.max(.45,g.s/190)),r=Math.max(.9,g.s/85);
  const turn=.42+Math.sin(time*.18)*.07;cos=Math.cos(turn);sin=Math.sin(turn); // a slow camera drift
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#f8f5f0');bg.addColorStop(1,'#efe9e0');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // The scan layer rises from the deepest layer to the top, rests, then starts again.
  const rise=(time%SCAN)/(SCAN-.8),scan=quiet||rise>=1?-1:(LAYERS-1)*(1-rise);
  g.towers.forEach(t=>{
   for(let j=LAYERS-1;j>0;j--)plane(g,t,j,`rgba(53,65,79,${.15-j*.008})`);
   const tops=[],scans=[];
   threads.forEach((th,i)=>{
    if(small&&i%2)return; // half the threads on small screens, so the bundle stays airy
    const gone=t.pruned&&th.cut?cutAmt:0,m=th.pts.map((_,j)=>model(t,th,j)),c=curve(m.map(([x,z],j)=>project(g,t,x,z,j)));
    tops.push([m[0],th,gone]);
    ctx.globalAlpha=.3-.27*gone;ctx.strokeStyle=th.color;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(c[0][0],c[0][1]);c.forEach(([x,y])=>ctx.lineTo(x,y));ctx.stroke();
    if(quiet||gone>.98)return;
    if(i%3===0){ // a particle runs up the thread with a short bright tail
     const f=(1-(time*th.speed+th.flow)%1)*(c.length-1),tail=Math.min(c.length-1,f+7),[hx,hy]=at(c,f);
     ctx.globalAlpha=.75*(1-gone);ctx.lineWidth=lw*2;ctx.beginPath();ctx.moveTo(hx,hy);for(let s=Math.ceil(f);s<=tail;s++)ctx.lineTo(c[s][0],c[s][1]);ctx.stroke();
     ctx.globalAlpha=1-gone;ctx.fillStyle=th.color;dot(hx,hy,r*1.2);
    }
    if(scan>=0){const j=Math.floor(scan),u=scan-j,a=m[j],b=m[Math.min(LAYERS-1,j+1)];scans.push([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,th,gone])}
   });
   if(scan>=0){ // during calibration the specialist's scan layer turns accent
    ctx.globalAlpha=1;plane(g,t,scan,t.pruned&&fitAmt>.05?`rgba(222,85,46,${.25+.5*fitAmt})`:'rgba(53,65,79,.32)','rgba(255,255,255,.12)');
    scans.forEach(([x,z,th,gone])=>{const [px,py]=project(g,t,x,z,scan);ctx.globalAlpha=.85*(1-gone);ctx.fillStyle=th.color;dot(px,py,r)});
   }
   ctx.globalAlpha=1;plane(g,t,0,'rgba(53,65,79,.5)','rgba(255,255,255,.3)');
   tops.forEach(([[x,z],th,gone])=>{
    // Experts the subject doesn't use drift off the top layer and fade, leaving an empty slot.
    const dx=th.out[0]*.35*gone,dz=th.out[1]*.35*gone,[px,py]=project(g,t,x+dx,z+dz,0);
    ctx.globalAlpha=.9*(1-gone);ctx.fillStyle=th.color;dot(px,py,r*1.25);
    th.specks.forEach(([sx,sz])=>{const [qx,qy]=project(g,t,x+sx+dx,z+sz+dz,0);dot(qx,qy,r*.85)});
    if(gone){const [ox,oy]=project(g,t,x,z,0);ctx.globalAlpha=.45*gone;ctx.strokeStyle='#7d8792';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(ox,oy,r*1.25,0,6.283);ctx.stroke()}
   });
  });
  ctx.globalAlpha=1;ctx.fillStyle='#7d8792';ctx.font=`500 ${small?10:12}px Inter, Arial, sans-serif`;ctx.textAlign='center';
  if('letterSpacing' in ctx)ctx.letterSpacing=small?'.08em':'.12em';
  const [a,b]=g.towers,fits=(ctx.measureText(a.label.toUpperCase()).width+ctx.measureText(b.label.toUpperCase()).width)/2+12<b.cx-a.cx;
  g.towers.forEach(t=>ctx.fillText((fits||!t.pruned?t.label:'Specialist').toUpperCase(),t.cx,g.top-g.s*.61-(small?10:16)));
  const fade=ctx.createLinearGradient(0,H*.6,0,H);fade.addColorStop(0,'rgba(239,233,224,0)');fade.addColorStop(1,'rgba(239,233,224,1)');ctx.fillStyle=fade;ctx.fillRect(0,H*.6,W,H*.4);
 }
 const running=()=>visible&&!document.hidden&&!reduce.matches&&toggle.getAttribute('aria-pressed')!=='true';
 function frame(now){
  raf=0;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;time+=dt;
  const stage=Number(cover.dataset.stage||0);
  cutAmt+=((stage>=1?1:0)-cutAmt)*Math.min(1,dt*2.2);fitAmt+=((stage===2?1:0)-fitAmt)*Math.min(1,dt*2);
  if(now-drawn>21){drawn=now;draw()} // about 45 frames a second is plenty for this pace
  if(running())raf=requestAnimationFrame(frame);else last=0;
 }
 function still(){const stage=Number(cover.dataset.stage||0);cutAmt=stage>=1?1:0;fitAmt=stage===2?1:0;draw()}
 function start(){if(running()&&!raf)raf=requestAnimationFrame(frame)}
 function resize(){const r=cover.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);if(reduce.matches)still();else draw()}
 new ResizeObserver(resize).observe(cover);
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start()},{threshold:.05}).observe(cover);else{visible=true;start()}
 // The cover script further down flips the toggle and resets stages; let it run first.
 toggle.addEventListener('click',()=>setTimeout(start));document.addEventListener('visibilitychange',start);reduce.addEventListener('change',()=>setTimeout(()=>reduce.matches?still():start()));
 document.fonts?.ready.then(draw);
})();

(()=>{
 // Sections rise in as they scroll into view.
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const targets=document.querySelectorAll('.story,.hats,.section-head,.project,.shelf,.next .prose,.wear,.next-beats,.stopper');
 let observer;
 if(!reduced.matches && 'IntersectionObserver' in window){
  targets.forEach(el=>el.setAttribute('data-reveal',''));
  observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}
  }),{threshold:.08,rootMargin:'0px 0px -18px 0px'});
  targets.forEach(el=>observer.observe(el));
  document.documentElement.classList.add('motion-ready');
 }
 reduced.addEventListener('change',()=>{if(reduced.matches){observer?.disconnect();targets.forEach(el=>el.classList.add('in-view'))}});
})();

(()=>{
 // Covers step through their stages every 4s (or data-hold) while on screen: image cross-fades, the status pill, and the pruning stages.
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const button=document.querySelector('.motion-toggle');
 const covers=[...document.querySelectorAll('[data-cover]')].map(el=>({el,slides:[...el.querySelectorAll('.cover-slide')],labels:JSON.parse(el.dataset.labels),bars:[...el.querySelectorAll('.cover-bars i')],rest:Number(el.dataset.rest||0),hold:Number(el.dataset.hold||4000),index:0,visible:false,time:0}));
 let paused=false;
 // Covers without image slides (the pruning grid) are driven by data-stage alone.
 function show(c,i){c.slides[c.index]?.classList.remove('active');c.bars[c.index].classList.remove('active');c.index=i;c.slides[i]?.classList.add('active');c.bars[i].classList.add('active');c.el.dataset.stage=i;c.el.querySelector('.cover-stage').textContent=c.labels[i]}
 function animate(){covers.forEach(c=>c.el.querySelectorAll('.review-pointer,.sync-orbit').forEach(el=>el.style.animationPlayState=c.visible&&!paused&&!reduce.matches?'running':'paused'))}
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(entry=>{const cover=covers.find(c=>c.el===entry.target);cover.visible=entry.isIntersecting;animate()}),{threshold:.15}):null;
 covers.forEach(c=>{show(c,reduce.matches?c.rest:0);if(observer)observer.observe(c.el);else c.visible=true});
 button.addEventListener('click',()=>{paused=!paused;document.documentElement.classList.toggle('covers-paused',paused);button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Play cover motion':'Pause cover motion';animate()});
 setInterval(()=>{
  if(paused||reduce.matches||document.hidden)return;
  covers.forEach(c=>{if(!c.visible)return;c.time+=500;if(c.time<c.hold)return;c.time=0;show(c,(c.index+1)%c.labels.length)});
 },500);
 reduce.addEventListener('change',()=>{if(reduce.matches)covers.forEach(c=>{c.time=0;show(c,c.rest)});animate()});
})();

(()=>{
 // Meme stickers loop only while on screen; the motion toggle and reduced motion leave them on their first frame.
 const control=document.querySelector('.motion-toggle');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const memes=[...document.querySelectorAll('.meme video')].map(video=>({video,visible:false}));
 function update(){memes.forEach(m=>{const run=m.visible&&!document.hidden&&!reduced.matches&&control.getAttribute('aria-pressed')!=='true';if(run)m.video.play().catch(()=>{});else m.video.pause()})}
 if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{memes.find(m=>m.video===entry.target).visible=entry.isIntersecting});update()},{threshold:.2});memes.forEach(m=>io.observe(m.video))}
 else{memes.forEach(m=>m.visible=true);update()}
 control.addEventListener('click',()=>setTimeout(update));document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
})();

(()=>{
 // The drifting walls (social posts, slides) only run while on screen and not paused.
 const control=document.querySelector('.motion-toggle');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('.social-wall-cover,.ppt-collage').forEach(cover=>{
  const lanes=cover.querySelectorAll('.post-column,.slide-row');
  let visible=false;
  function update(){const running=visible&&!document.hidden&&!reduced.matches&&control.getAttribute('aria-pressed')!=='true';lanes.forEach(lane=>lane.style.animationPlayState=running?'running':'paused')}
  lanes.forEach(lane=>lane.style.animationPlayState='paused');
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update()},{threshold:.15}).observe(cover);
  else{visible=true;update()}
  control.addEventListener('click',update);document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
 });
})();
