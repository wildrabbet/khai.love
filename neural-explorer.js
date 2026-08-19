(() => {
  const canvas=document.getElementById('cognitionGraph'); if(!canvas)return;
  const stage=canvas.closest('.neural-stage'),ctx=canvas.getContext('2d');
  const detail=document.getElementById('nodeDetail'),translation=document.getElementById('agentTranslation');
  const resetBtn=document.getElementById('graphReset'),pulseBtn=document.getElementById('graphPulse');
  const presetBtns=[...document.querySelectorAll('.profile-btn')],profileName=document.getElementById('profileName');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const metricEls={reason:[document.getElementById('metricReason'),document.getElementById('metricReasonVal')],speed:[document.getElementById('metricSpeed'),document.getElementById('metricSpeedVal')],verify:[document.getElementById('metricVerify'),document.getElementById('metricVerifyVal')],memory:[document.getElementById('metricMemory'),document.getElementById('metricMemoryVal')]};
  const colors={reasoning:'#f39bc8',memory:'#9b7cff',coordination:'#7be8df',execution:'#f0ca8b',verification:'#8ed7ff'};

  const defs=[
    ['brief','Brief','reasoning','Defines the requested outcome, constraints and evidence before implementation begins.','Problem framing'],
    ['context','Project Context','memory','Carries prior decisions, conventions, discoveries and corrections into the next tranche of work.','Inherited context'],
    ['plans','Independent Plans','reasoning','Senior agents form complete approaches independently before seeing alternatives.','Parallel reasoning'],
    ['review','Decision Review','reasoning','Competing approaches are challenged and one implementation path becomes authoritative.','Decision convergence'],
    ['routing','Specialist Routing','coordination','Work is directed to the role best suited to research, engineering, operations or verification.','Capability routing'],
    ['claims','Claims','coordination','Shared work surfaces are claimed before editing so parallel agents do not collide invisibly.','Ownership control'],
    ['comms','Comms','coordination','Assignments, findings, handoffs and proof move between agents through the shared communications layer.','Coordination bus'],
    ['execution','Implementation','execution','The selected owner changes the bounded work surface using the agreed plan.','Code and artifact change'],
    ['tools','Tools & Runtime','execution','Repositories, builds, APIs and local tools connect reasoning to the real project environment.','External capability'],
    ['tests','Tests & Checks','verification','Targeted tests, builds, hashes and inspections challenge the implementation.','Local verification'],
    ['artifact','Authoritative Artifact','verification','The real running or authoritative artifact decides whether the change actually worked.','Ground truth'],
    ['correction','Corrections','verification','Disproved claims are superseded visibly and fed back into future decisions.','Error recovery'],
    ['handoff','Handoff','coordination','Evidence, remaining risks and state are packaged so another agent can continue without reconstruction.','Continuity transfer'],
    ['memory','Durable Memory','memory','Accepted decisions, handoffs and corrections become organisational knowledge beyond one session.','Long-term continuity']
  ];
  const nodes=defs.map(([id,label,layer,desc,agent],i)=>({id,label,layer,desc,agent,r:id==='artifact'||id==='memory'?24:19,x:0,y:0,vx:0,vy:0}));
  const by=id=>nodes.find(n=>n.id===id);
  const baseEdges=[['brief','plans'],['context','plans'],['plans','review'],['review','routing'],['routing','claims'],['routing','comms'],['claims','execution'],['tools','execution'],['execution','tests'],['tests','artifact'],['artifact','correction'],['artifact','handoff'],['correction','memory'],['handoff','memory'],['memory','context'],['handoff','comms'],['comms','claims'],['context','routing']];
  const baseSet=new Set(baseEdges.map(e=>e.slice().sort().join('|')));
  const compatibility={reasoning:['memory','coordination'],memory:['reasoning','coordination','verification'],coordination:['reasoning','memory','execution','verification'],execution:['coordination','verification'],verification:['execution','coordination','memory']};

  const presets={
    balanced:{brief:[-310,-170],context:[-320,35],plans:[-150,-190],review:[25,-175],routing:[170,-120],claims:[300,-55],comms:[235,80],execution:[285,190],tools:[115,215],tests:[120,335],artifact:[-45,330],correction:[-210,305],handoff:[-315,210],memory:[-350,125]},
    research:{brief:[-300,-160],context:[-250,-30],plans:[-120,-150],review:[20,-110],routing:[160,-40],claims:[300,40],comms:[240,145],execution:[320,210],tools:[125,250],tests:[100,350],artifact:[-45,350],correction:[-185,300],handoff:[-260,205],memory:[-285,80]},
    delivery:{brief:[-320,-190],context:[-360,20],plans:[-155,-155],review:[-20,-100],routing:[130,-65],claims:[230,-20],comms:[245,90],execution:[245,190],tools:[110,190],tests:[175,300],artifact:[30,335],correction:[-190,335],handoff:[-290,220],memory:[-355,125]},
    assurance:{brief:[-300,-190],context:[-300,-15],plans:[-135,-180],review:[20,-135],routing:[165,-75],claims:[285,-15],comms:[255,95],execution:[255,185],tools:[115,190],tests:[155,260],artifact:[35,285],correction:[-90,330],handoff:[-235,270],memory:[-300,155]}
  };
  const presetNames={balanced:'Balanced company',research:'Research-heavy',delivery:'Delivery-biased',assurance:'High-assurance'};
  const pairEffects={
    'context|plans':'Planning inherits more prior project knowledge, so senior agents spend less time rediscovering constraints and more time extending what is already known.',
    'memory|plans':'Independent planners are strongly informed by accepted history. This improves continuity, but too much coupling can reduce fresh approaches.',
    'plans|review':'Independent proposals reach decision review quickly. Agents converge faster, but very tight coupling can shorten the period in which alternatives remain genuinely independent.',
    'review|execution':'Decision authority sits close to implementation. Engineers start sooner after convergence, reducing coordination latency.',
    'routing|execution':'Specialist selection directly shapes implementation. Work reaches the agent with the right skill set before generic execution takes over.',
    'claims|execution':'Ownership and editing become tightly coupled. Agents are less likely to touch shared files without visible responsibility.',
    'comms|routing':'Routing decisions are strongly informed by current team state and handoffs, making reassignment and collaboration easier.',
    'tools|execution':'Agents can turn decisions into real repository, runtime and build actions with very little translation overhead.',
    'execution|tests':'Testing follows implementation closely. Engineers get faster feedback and defects are cheaper to correct.',
    'artifact|tests':'Local checks stay anchored to the authoritative artifact, reducing the chance that a green test is mistaken for a successful deployment.',
    'artifact|correction':'Runtime evidence immediately feeds correction. Failed assumptions are less likely to survive into later work.',
    'correction|memory':'Disproved claims become durable lessons. Future agents inherit the correction instead of repeating the same mistake.',
    'handoff|memory':'Completion evidence is converted directly into future context, so later sessions can resume with less reconstruction.',
    'context|routing':'Specialist assignment uses historical knowledge about the project, not just the current prompt.'
  };

  let w=0,h=0,dpr=1,scale=1,tx=0,ty=0,drag=false,dragNode=null,lastX=0,lastY=0,hover=null,active=by('brief'),flow=!reduce,phase=0,currentPreset='balanced',lastMetrics=null;
  const pairKey=(a,b)=>[a.id||a,b.id||b].sort().join('|');
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const coupling=(a,b)=>Math.max(0,1-dist(a,b)/285);
  const avg=(pairs)=>pairs.reduce((s,[a,b])=>s+coupling(by(a),by(b)),0)/pairs.length;
  function metrics(){
    const reason=avg([['brief','plans'],['context','plans'],['plans','review'],['review','routing']]);
    const speed=avg([['routing','claims'],['routing','execution'],['claims','execution'],['tools','execution'],['execution','tests']]);
    const verify=avg([['execution','tests'],['tests','artifact'],['artifact','correction'],['artifact','handoff']]);
    const memory=avg([['context','plans'],['correction','memory'],['handoff','memory'],['memory','context']]);
    const coordination=avg([['routing','comms'],['comms','claims'],['comms','handoff'],['routing','claims']]);
    return {reason:Math.round(reason*100),speed:Math.round(speed*100),verify:Math.round(verify*100),memory:Math.round(memory*100),coordination:Math.round(coordination*100)};
  }
  function classify(m){
    if(m.verify>78&&m.memory>70)return'High-assurance company';
    if(m.reason>80&&m.memory>68)return'Research-intensive company';
    if(m.speed>80&&m.verify<62)return'Fast-delivery company';
    if(m.coordination<48)return'Fragmented organisation';
    if(Math.max(m.reason,m.speed,m.verify,m.memory)-Math.min(m.reason,m.speed,m.verify,m.memory)<18)return'Balanced company';
    const top=Object.entries({reason:m.reason,speed:m.speed,verify:m.verify,memory:m.memory}).sort((a,b)=>b[1]-a[1])[0][0];
    return ({reason:'Deliberation-heavy company',speed:'Execution-heavy company',verify:'Verification-heavy company',memory:'Memory-heavy company'})[top];
  }
  function updateMetrics(){
    const m=metrics();lastMetrics=m;
    for(const k of ['reason','speed','verify','memory']){const [bar,val]=metricEls[k];if(bar)bar.style.width=m[k]+'%';if(val)val.textContent=m[k];}
    if(profileName)profileName.textContent=classify(m);
  }
  function nearest(n){return nodes.filter(x=>x!==n).map(x=>[x,dist(n,x)]).sort((a,b)=>a[1]-b[1]).slice(0,3);}
  function explainMove(n){
    const near=nearest(n),strong=near.filter(([,d])=>d<220); let text='';
    if(strong.length){
      const [other,d]=strong[0],specific=pairEffects[pairKey(n,other)];
      text=specific||`${n.label} is now tightly coupled to ${other.label}. In agent terms, ${n.agent.toLowerCase()} would influence ${other.agent.toLowerCase()} earlier and more strongly in the work cycle.`;
      if(strong[1])text+=` It is also pulling toward ${strong[1][0].label}, creating a three-way dependency rather than a simple pipeline.`;
    }else text=`${n.label} is relatively isolated. In practice, ${n.agent.toLowerCase()} would become a weaker constraint on neighbouring agent behaviour, increasing local autonomy but reducing shared context.`;
    const m=lastMetrics||metrics();
    const low=Object.entries({reason:m.reason,speed:m.speed,verify:m.verify,memory:m.memory}).sort((a,b)=>a[1]-b[1])[0];
    if(low[1]<48)text+=` The current configuration is weakest in ${{reason:'reasoning depth',speed:'execution velocity',verify:'verification rigor',memory:'memory continuity'}[low[0]]}, so that is where the organisation would feel the trade-off first.`;
    if(translation)translation.textContent=text;
  }
  function setDetail(n){
    active=n; const near=nearest(n);
    if(detail)detail.innerHTML=`<div class="node-class">${n.layer}</div><h4>${n.label}</h4><p>${n.desc}</p><ul><li><span>Agent translation</span><b>${n.agent}</b></li><li><span>Strongest coupling</span><b>${near[0][0].label}</b></li><li><span>Influence</span><b>${Math.round(coupling(n,near[0][0])*100)}%</b></li></ul>`;
    explainMove(n);
  }
  function applyPreset(name,animate=true){
    currentPreset=name; const target=presets[name];
    nodes.forEach(n=>{const [x,y]=target[n.id]; if(animate&&!reduce){n.vx=(x-n.x)/14;n.vy=(y-n.y)/14;n._target=[x,y];}else{n.x=x;n.y=y;n._target=null;}});
    presetBtns.forEach(b=>b.classList.toggle('active',b.dataset.preset===name)); if(profileName)profileName.textContent=presetNames[name]; setDetail(active);updateMetrics();
  }
  function emergentEdges(){
    const out=[];
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j],key=pairKey(a,b),c=coupling(a,b),compatible=compatibility[a.layer]?.includes(b.layer)||a.layer===b.layer;
      if(baseSet.has(key))out.push({a,b,w:.56+c*.44,base:true}); else if(compatible&&c>.43)out.push({a,b,w:(c-.43)/.57*.62,base:false});
    }
    return out;
  }
  function resize(){const r=stage.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);tx=w/2;ty=h/2;scale=Math.min(1,Math.max(.62,w/770));}
  const screen=n=>({x:n.x*scale+tx,y:n.y*scale+ty,r:n.r*scale});
  function hit(x,y){for(let i=nodes.length-1;i>=0;i--){const n=nodes[i],s=screen(n);if(Math.hypot(x-s.x,y-s.y)<s.r+9)return n;}return null;}
  function stepTargets(){nodes.forEach(n=>{if(!n._target)return;n.x+=n.vx;n.y+=n.vy;const [x,y]=n._target;if(Math.hypot(x-n.x,y-n.y)<8){n.x=x;n.y=y;n._target=null;}else{n.vx*=.86;n.vy*=.86;n.vx+=(x-n.x)*.015;n.vy+=(y-n.y)*.015;}});}
  function draw(t){stepTargets();ctx.clearRect(0,0,w,h);phase=t||0;const edges=emergentEdges();
    edges.forEach((e,i)=>{const a=screen(e.a),b=screen(e.b),mx=(a.x+b.x)/2,sel=e.a===active||e.b===active;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(mx,a.y,mx,b.y,b.x,b.y);ctx.strokeStyle=sel?`rgba(243,155,200,${.18+e.w*.42})`:`rgba(255,255,255,${.025+e.w*.13})`;ctx.lineWidth=sel?1.3:Math.max(.45,e.w);ctx.stroke();if(flow&&e.w>.32){const p=((phase/1300)+i*.083)%1,q=1-p,px=q*q*q*a.x+3*q*q*p*mx+3*q*p*p*mx+p*p*p*b.x,py=q*q*q*a.y+3*q*q*p*a.y+3*q*p*p*b.y+p*p*p*b.y;ctx.beginPath();ctx.arc(px,py,sel?2.3:1.35,0,Math.PI*2);ctx.fillStyle=colors[e.a.layer];ctx.fill();}});
    nodes.forEach(n=>{const s=screen(n),isA=n===active,isH=n===hover;ctx.save();ctx.shadowBlur=isA?30:isH?18:9;ctx.shadowColor=colors[n.layer];ctx.beginPath();ctx.arc(s.x,s.y,s.r+(isA?3:0),0,Math.PI*2);ctx.fillStyle=isA?'rgba(20,18,27,.98)':'rgba(8,8,13,.96)';ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=isA?colors[n.layer]:'rgba(255,255,255,.16)';ctx.lineWidth=isA?1.6:1;ctx.stroke();ctx.beginPath();ctx.arc(s.x,s.y,3.1,0,Math.PI*2);ctx.fillStyle=colors[n.layer];ctx.fill();ctx.font=`${Math.max(8,9.4*scale)}px Inter,system-ui`;ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle=isA?'#fff':'#9e97a3';ctx.fillText(n.label,s.x,s.y+s.r+7);ctx.restore();});requestAnimationFrame(draw);}

  stage.addEventListener('pointerdown',e=>{stage.setPointerCapture(e.pointerId);lastX=e.offsetX;lastY=e.offsetY;dragNode=hit(lastX,lastY);drag=true;stage.classList.add('dragging');if(dragNode){dragNode._target=null;setDetail(dragNode);}});
  stage.addEventListener('pointermove',e=>{const x=e.offsetX,y=e.offsetY;hover=hit(x,y);if(!drag)return;const dx=x-lastX,dy=y-lastY;lastX=x;lastY=y;if(dragNode){dragNode.x+=dx/scale;dragNode.y+=dy/scale;currentPreset='custom';updateMetrics();setDetail(dragNode);}else{tx+=dx;ty+=dy;}});
  const end=()=>{drag=false;dragNode=null;stage.classList.remove('dragging');};stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
  stage.addEventListener('wheel',e=>{e.preventDefault();const old=scale,f=Math.exp(-e.deltaY*.0011);scale=Math.min(1.8,Math.max(.45,scale*f));const wx=(e.offsetX-tx)/old,wy=(e.offsetY-ty)/old;tx=e.offsetX-wx*scale;ty=e.offsetY-wy*scale;},{passive:false});
  stage.addEventListener('click',e=>{const n=hit(e.offsetX,e.offsetY);if(n)setDetail(n);});
  resetBtn?.addEventListener('click',()=>{applyPreset('balanced',true);tx=w/2;ty=h/2;scale=Math.min(1,Math.max(.62,w/770));});
  pulseBtn?.addEventListener('click',()=>{flow=!flow;pulseBtn.textContent=flow?'Pause flow':'Resume flow';});
  presetBtns.forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.preset,true)));
  resize();applyPreset('balanced',false);addEventListener('resize',resize,{passive:true});requestAnimationFrame(draw);
})();