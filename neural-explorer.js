(() => {
  const canvas=document.getElementById('cognitionGraph'); if(!canvas)return;
  const stage=canvas.closest('.neural-stage'),ctx=canvas.getContext('2d');
  const detail=document.getElementById('nodeDetail'),translation=document.getElementById('agentTranslation');
  const profileName=document.getElementById('profileName');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const metricsBox=document.querySelector('.lab-metrics');
  const controls=document.querySelector('.profile-controls');
  const pulseBtn=document.getElementById('graphPulse'),resetBtn=document.getElementById('graphReset');
  [controls,pulseBtn,resetBtn].forEach(el=>{if(el)el.style.display='none'});

  const link=document.createElement('link');link.rel='stylesheet';link.href='neural-puzzle-v2.css';document.head.appendChild(link);

  const colors={reasoning:'#f29dcc',memory:'#a98cff',coordination:'#75e9df',execution:'#ffd08a',verification:'#86d9ff'};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const sigmoid=x=>1/(1+Math.exp(-x));
  const defs=[
    ['brief','Brief','reasoning','Input','Turns the customer outcome into a bounded objective signal.','Problem framing'],
    ['context','Project Context','memory','Memory','Carries accepted project history into the current problem.','Inherited context'],
    ['plans','Independent Plans','reasoning','Reasoning','Creates competing approaches before convergence.','Parallel reasoning'],
    ['review','Decision Review','reasoning','Reasoning','Challenges candidate plans and selects an authoritative path.','Decision convergence'],
    ['routing','Specialist Routing','coordination','Routing','Matches work to the agent or department best suited to perform it.','Capability routing'],
    ['claims','Claims','coordination','Control','Prevents invisible collisions on shared work surfaces.','Ownership control'],
    ['comms','Comms','coordination','Coordination','Moves assignments, evidence, corrections and handoffs between agents.','Coordination bus'],
    ['execution','Implementation','execution','Execution','Turns the chosen plan into real edits, code or artifacts.','Artifact change'],
    ['tools','Tools & Runtime','execution','Capability','Connects agents to repositories, builds, APIs and project runtime.','External capability'],
    ['tests','Tests & Checks','verification','Verification','Challenges implementation before completion can be claimed.','Local verification'],
    ['artifact','Authoritative Artifact','verification','Output','The real deployed or authoritative artifact decides whether work succeeded.','Ground truth'],
    ['correction','Corrections','verification','Feedback','Feeds disproved assumptions back into future decisions.','Error recovery'],
    ['handoff','Handoff','coordination','Continuity','Packages evidence, state and risk for the next agent.','Continuity transfer'],
    ['memory','Durable Memory','memory','Memory','Preserves accepted decisions, corrections and handoffs beyond one session.','Long-term continuity']
  ];
  const nodes=defs.map(([id,label,layer,kind,desc,agent])=>({id,label,layer,kind,desc,agent,x:0,y:0,r:(id==='artifact'||id==='memory')?22:18,act:id==='brief'?1:.04,targetX:0,targetY:0}));
  const by=id=>nodes.find(n=>n.id===id);

  const relations=[
    ['brief','plans','reason',112,'Goal definition enters planning'],
    ['context','plans','reason',116,'Planning inherits project history'],
    ['plans','review','reason',120,'Competing plans reach decision review'],
    ['review','routing','reason',114,'Chosen direction reaches specialist routing'],
    ['routing','claims','speed',105,'Ownership is assigned before editing'],
    ['routing','comms','speed',112,'Assignments propagate through Comms'],
    ['claims','execution','speed',108,'Claimed work reaches implementation'],
    ['tools','execution','speed',100,'Agents can act on the real environment'],
    ['execution','tests','verify',105,'Implementation receives immediate challenge'],
    ['tests','artifact','verify',112,'Checks resolve against the authoritative artifact'],
    ['artifact','correction','verify',112,'Runtime evidence creates corrections'],
    ['artifact','handoff','verify',118,'Completion evidence is packaged for handoff'],
    ['correction','memory','memory',108,'Failures become durable lessons'],
    ['handoff','memory','memory',110,'Handoff becomes future context'],
    ['memory','context','memory',115,'Durable memory feeds project context'],
    ['handoff','comms','memory',120,'State reaches the next agent through Comms'],
    ['comms','claims','speed',110,'Team state constrains ownership'],
    ['context','routing','reason',128,'Routing uses historical project knowledge']
  ].map(([a,b,metric,ideal,why])=>({a:by(a),b:by(b),metric,ideal,why,key:a+'>'+b}));

  // The important gameplay rule: closer is not always better. Each relationship has an ideal band.
  // Too far means weak context. Too close means over-coupling, bottlenecks and groupthink.
  const linkScore=e=>{const d=Math.hypot(e.a.x-e.b.x,e.a.y-e.b.y),sigma=32;return Math.exp(-((d-e.ideal)*(d-e.ideal))/(2*sigma*sigma));};
  const crowdPenalty=n=>{let p=0;for(const o of nodes){if(o===n)continue;const d=Math.hypot(n.x-o.x,n.y-o.y);if(d<60)p+=((60-d)/60);}return clamp(p,0,1)};
  const allScores=()=>relations.map(e=>({...e,score:linkScore(e)}));

  // A hand-designed solvable topology. The user is not shown these coordinates, only magnetic behavior.
  const solution={
    brief:[-315,-175],context:[-325,10],plans:[-205,-120],review:[-82,-155],routing:[35,-110],claims:[145,-95],comms:[135,20],execution:[235,-30],tools:[230,78],tests:[225,185],artifact:[112,215],correction:[5,245],handoff:[-5,145],memory:[-115,205]
  };
  const start={
    brief:[-315,-175],context:[-340,80],plans:[-170,-210],review:[20,-205],routing:[185,-120],claims:[310,-65],comms:[270,70],execution:[310,190],tools:[95,235],tests:[155,320],artifact:[-25,330],correction:[-205,310],handoff:[-320,220],memory:[-355,145]
  };
  nodes.forEach(n=>{const p=start[n.id];n.x=p[0];n.y=p[1]});

  if(metricsBox){metricsBox.insertAdjacentHTML('beforebegin',`<div class="neural-objective"><div><span>OBJECTIVE</span><strong>Synchronise the Hive-Mind</strong><p>Every axis must reach 100%. Nodes want the right partners at the right distance. Overlap them and the network collapses.</p></div><div class="neural-unlock" id="neuralUnlock"><small>LOCKED OUTPUT</small><b>••••••••••</b></div></div><div class="neural-feedback" id="neuralFeedback"><span id="neuralHint">Drag a node. Compatible pathways will magnetise and wire themselves.</span><strong id="neuralProgress">0%</strong></div>`)}
  const unlock=document.getElementById('neuralUnlock'),hint=document.getElementById('neuralHint'),progress=document.getElementById('neuralProgress');
  const metricEls={reason:[document.getElementById('metricReason'),document.getElementById('metricReasonVal')],speed:[document.getElementById('metricSpeed'),document.getElementById('metricSpeedVal')],verify:[document.getElementById('metricVerify'),document.getElementById('metricVerifyVal')],memory:[document.getElementById('metricMemory'),document.getElementById('metricMemoryVal')]};

  let w=0,h=0,dpr=1,scale=1,tx=0,ty=0,drag=false,dragNode=null,lastX=0,lastY=0,hover=null,active=by('brief'),particles=[],rings=[],beams=[],wired=new Set(),solved=false,hold=0,lastMetric={reason:0,speed:0,verify:0,memory:0};
  const screen=n=>({x:n.x*scale+tx,y:n.y*scale+ty,r:n.r*scale});
  function resize(){const r=stage.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);tx=w/2;ty=h/2;scale=Math.min(1,Math.max(.64,w/760));}
  function hit(x,y){for(let i=nodes.length-1;i>=0;i--){const n=nodes[i],s=screen(n);if(Math.hypot(x-s.x,y-s.y)<=s.r+10)return n}return null}
  function burst(x,y,color,count=24,power=3.4){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=.6+Math.random()*power;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:.7+Math.random()*1.8,color})}}
  function wireFx(e){const a=screen(e.a),b=screen(e.b),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;rings.push({x:mx,y:my,r:4,life:1,color:colors[e.a.layer]});beams.push({a:e.a,b:e.b,life:1});burst(mx,my,colors[e.b.layer],34,4.8)}
  function unwireFx(e){const a=screen(e.a),b=screen(e.b);burst((a.x+b.x)/2,(a.y+b.y)/2,'#ff8fa8',12,2.2)}

  function category(metric){const arr=allScores().filter(e=>e.metric===metric);const min=Math.min(...arr.map(e=>e.score));const avg=arr.reduce((s,e)=>s+e.score,0)/arr.length;const crowd=nodes.reduce((s,n)=>s+crowdPenalty(n),0)/nodes.length;return clamp((min*.72+avg*.28-crowd*.55)*100,0,100)}
  function metrics(){return{reason:Math.round(category('reason')),speed:Math.round(category('speed')),verify:Math.round(category('verify')),memory:Math.round(category('memory'))}}
  function updateWires(){for(const e of relations){const s=linkScore(e),on=s>.72;if(on&&!wired.has(e.key)){wired.add(e.key);wireFx(e)}else if(!on&&wired.has(e.key)){wired.delete(e.key);unwireFx(e)}}}
  function closestRelation(n){return relations.filter(e=>e.a===n||e.b===n).map(e=>({e,score:linkScore(e),d:Math.hypot(e.a.x-e.b.x,e.a.y-e.b.y)})).sort((a,b)=>b.score-a.score)[0]}
  function explain(n){const c=closestRelation(n),crowd=crowdPenalty(n);if(crowd>.18){hint.textContent=`${n.label} is over-coupled. Real agents would lose independence, create contention and amplify the same context. Separate the cluster.`;return}if(!c){hint.textContent='Move a node to discover a compatible pathway.';return}const delta=c.d-c.e.ideal;if(c.score>.93)hint.textContent=`Excellent: ${c.e.why}. In KHAI, this means ${n.agent.toLowerCase()} is strongly connected without becoming a bottleneck.`;else if(delta>0)hint.textContent=`${n.label} is too isolated from ${c.e.a===n?c.e.b.label:c.e.a.label}. Bring them closer to strengthen ${c.e.why.toLowerCase()}.`;else hint.textContent=`${n.label} is too tightly coupled to ${c.e.a===n?c.e.b.label:c.e.a.label}. Give them breathing room. KHAI preserves separation so agents do not collapse into groupthink.`}
  function setDetail(n){active=n;const c=closestRelation(n);if(detail)detail.innerHTML=`<div class="node-class">${n.layer}</div><h4>${n.label}</h4><p>${n.desc}</p><ul><li><span>Agent translation</span><b>${n.agent}</b></li><li><span>Best pathway</span><b>${c?(c.e.a===n?c.e.b.label:c.e.a.label):'None'}</b></li><li><span>Coupling quality</span><b>${c?Math.round(c.score*100):0}%</b></li></ul>`;explain(n)}
  function updateMetrics(){const m=metrics();lastMetric=m;for(const k of Object.keys(m)){const [bar,val]=metricEls[k]||[];if(bar)bar.style.width=m[k]+'%';if(val)val.textContent=m[k]}const overall=Math.min(m.reason,m.speed,m.verify,m.memory);if(progress)progress.textContent=overall+'%';if(profileName)profileName.textContent=overall===100?'Perfectly synchronised':overall>88?'Near convergence':overall>60?'Coherent network':'Fragmented organisation';const done=Object.values(m).every(v=>v===100);if(done){hold+=1/60;if(hint)hint.textContent=`Perfect architecture. Hold the network stable ${Math.max(0,1.2-hold).toFixed(1)}s…`;if(hold>1.2&&!solved)solve()}else hold=0}
  function solve(){solved=true;document.querySelector('.hero-cognition')?.classList.add('neural-solved');if(unlock){unlock.classList.add('unlocked');unlock.innerHTML='<small>UNLOCKED CODE</small><b>wildrabbet</b>'}if(hint)hint.textContent='100% across every axis. The network is balanced, specialised, verifiable and continuous.';for(const n of nodes){const s=screen(n);rings.push({x:s.x,y:s.y,r:2,life:1.4,color:colors[n.layer]});burst(s.x,s.y,colors[n.layer],28,4.2)}for(const e of relations)beams.push({a:e.a,b:e.b,life:1.6})}

  function repel(){for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,min=54;if(d<min){const f=(min-d)*.16,ux=dx/d,uy=dy/d;if(a!==dragNode){a.x-=ux*f;a.y-=uy*f}if(b!==dragNode){b.x+=ux*f;b.y+=uy*f}}}}
  function magnetise(n){let best=null;for(const e of relations){if(e.a!==n&&e.b!==n)continue;const o=e.a===n?e.b:e.a,d=Math.hypot(n.x-o.x,n.y-o.y),err=Math.abs(d-e.ideal);if(err<22&&(!best||err<best.err))best={e,o,d,err}}if(best){const dx=n.x-best.o.x,dy=n.y-best.o.y,d=Math.hypot(dx,dy)||1,snap=.18;n.x+=(best.o.x+dx/d*best.e.ideal-n.x)*snap;n.y+=(best.o.y+dy/d*best.e.ideal-n.y)*snap}}
  function networkActivation(){const scores=allScores();for(const n of nodes){if(n.id==='brief'){n.act=1;continue}const incoming=scores.filter(e=>e.b===n);let sum=-1.8;for(const e of incoming)sum+=e.a.act*e.score*2.2;if(n.id==='memory')sum+=n.act*.5;n.act=n.act*.8+sigmoid(sum)*.2}}

  stage.addEventListener('pointerdown',e=>{stage.setPointerCapture(e.pointerId);lastX=e.offsetX;lastY=e.offsetY;dragNode=hit(lastX,lastY);drag=true;stage.classList.add('dragging');if(dragNode)setDetail(dragNode)});
  stage.addEventListener('pointermove',e=>{const x=e.offsetX,y=e.offsetY;hover=hit(x,y);if(!drag)return;const dx=(x-lastX)/scale,dy=(y-lastY)/scale;lastX=x;lastY=y;if(dragNode){dragNode.x+=dx;dragNode.y+=dy;magnetise(dragNode);setDetail(dragNode)}else{tx+=dx*scale;ty+=dy*scale}});
  const end=()=>{drag=false;dragNode=null;stage.classList.remove('dragging')};stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
  stage.addEventListener('wheel',e=>{e.preventDefault();const old=scale,fac=Math.exp(-e.deltaY*.001);scale=clamp(scale*fac,.55,1.7);const wx=(e.offsetX-tx)/old,wy=(e.offsetY-ty)/old;tx=e.offsetX-wx*scale;ty=e.offsetY-wy*scale},{passive:false});

  function draw(t){repel();networkActivation();updateWires();updateMetrics();ctx.clearRect(0,0,w,h);const scores=allScores();
    // subtle potential fields show where the player can form a useful connection
    if(dragNode){for(const e of relations){if(e.a!==dragNode&&e.b!==dragNode)continue;const o=e.a===dragNode?e.b:e.a,s=screen(o),rad=e.ideal*scale;ctx.beginPath();ctx.arc(s.x,s.y,rad,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,.045)';ctx.setLineDash([3,8]);ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([])}}
    for(const e of scores){const a=screen(e.a),b=screen(e.b),s=e.score,mx=(a.x+b.x)/2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(mx,a.y,mx,b.y,b.x,b.y);ctx.strokeStyle=s>.72?`rgba(255,255,255,${.1+s*.33})`:`rgba(255,255,255,${.018+s*.07})`;ctx.lineWidth=s>.9?1.8:s>.72?1.2:.65;ctx.shadowBlur=s>.92?12:0;ctx.shadowColor=colors[e.a.layer];ctx.stroke();ctx.shadowBlur=0;if(s>.72&&!reduce){const p=((t/900)+relations.indexOf(e)*.067)%1,q=1-p,px=q*q*q*a.x+3*q*q*p*mx+3*q*p*p*mx+p*p*p*b.x,py=q*q*q*a.y+3*q*q*p*a.y+3*q*p*p*b.y+p*p*p*b.y;ctx.beginPath();ctx.arc(px,py,1.1+s*1.6,0,Math.PI*2);ctx.fillStyle=colors[e.a.layer];ctx.shadowBlur=14;ctx.shadowColor=colors[e.a.layer];ctx.fill();ctx.shadowBlur=0}}
    for(const beam of beams){const a=screen(beam.a),b=screen(beam.b);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(255,255,255,${beam.life*.5})`;ctx.lineWidth=1+beam.life*3;ctx.shadowBlur=24;ctx.shadowColor=colors[beam.a.layer];ctx.stroke();ctx.shadowBlur=0;beam.life-=.035}beams=beams.filter(b=>b.life>0);
    for(const n of nodes){const s=screen(n),isA=n===active,isH=n===hover,c=colors[n.layer],crowd=crowdPenalty(n);ctx.save();ctx.shadowBlur=12+n.act*26;ctx.shadowColor=c;ctx.beginPath();ctx.arc(s.x,s.y,s.r+(isA?2:0),0,Math.PI*2);ctx.fillStyle=crowd>.2?'rgba(35,9,15,.98)':'rgba(8,8,14,.98)';ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=crowd>.2?'#ff7188':isA?c:`rgba(255,255,255,${.16+n.act*.24})`;ctx.lineWidth=isA?1.8:1;ctx.stroke();ctx.beginPath();ctx.arc(s.x,s.y,3+n.act*2.2,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();ctx.font=`${Math.max(8,9.2*scale)}px Inter,system-ui`;ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle=isA?'#fff':'#aaa2af';ctx.fillText(n.label,s.x,s.y+s.r+7);ctx.restore()}
    for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vx*=.975;p.vy*=.975;p.life-=.025;ctx.beginPath();ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2);ctx.fillStyle=p.color;ctx.globalAlpha=clamp(p.life,0,1);ctx.fill();ctx.globalAlpha=1}particles=particles.filter(p=>p.life>0);
    for(const r of rings){r.r+=5.8;r.life-=.026;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.strokeStyle=r.color;ctx.globalAlpha=clamp(r.life,0,1);ctx.lineWidth=1.5;ctx.stroke();ctx.globalAlpha=1}rings=rings.filter(r=>r.life>0);
    requestAnimationFrame(draw)}

  resize();addEventListener('resize',resize,{passive:true});setDetail(active);requestAnimationFrame(draw);
})();