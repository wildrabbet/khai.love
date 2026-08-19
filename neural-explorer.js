(() => {
  const canvas = document.getElementById('cognitionGraph');
  if (!canvas) return;
  const stage = canvas.closest('.neural-stage');
  const detail = document.getElementById('nodeDetail');
  const resetBtn = document.getElementById('graphReset');
  const pulseBtn = document.getElementById('graphPulse');
  const layerBtns = [...document.querySelectorAll('.layer-btn')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');

  const palette = {
    reasoning:'#f39bc8', memory:'#9b7cff', coordination:'#7be8df', execution:'#f0ca8b', verification:'#8ed7ff'
  };

  const nodes = [
    {id:'brief',x:-430,y:-210,r:22,layer:'reasoning',label:'Brief',desc:'The requested outcome is defined before implementation begins. Scope, evidence and constraints become the first shared object.',facts:[['Role','Problem definition'],['Feeds','Independent planning'],['Persists','Project context']]},
    {id:'context',x:-435,y:55,r:20,layer:'memory',label:'Project Context',desc:'Durable project knowledge keeps prior decisions, conventions, findings and corrections available across sessions.',facts:[['Role','Long-term continuity'],['Stores','Decisions + findings'],['Feeds','Every new tranche']]},
    {id:'plans',x:-250,y:-235,r:25,layer:'reasoning',label:'Independent Plans',desc:'Senior agents form complete approaches independently before seeing alternatives, reducing anchoring and shallow consensus.',facts:[['Role','Parallel reasoning'],['Input','Brief + context'],['Output','Competing plans']]},
    {id:'review',x:-60,y:-225,r:26,layer:'reasoning',label:'Review & Decision',desc:'Plans are compared, objections are surfaced, and one implementation path becomes authoritative.',facts:[['Role','Decision convergence'],['Receives','Competing plans'],['Emits','Chosen plan']]},
    {id:'decompose',x:130,y:-220,r:22,layer:'coordination',label:'Task Decomposition',desc:'The chosen plan becomes bounded work units with clear ownership and evidence expectations.',facts:[['Role','Work partitioning'],['Output','Bounded tranches'],['Protects','Scope clarity']]},
    {id:'claim',x:305,y:-205,r:20,layer:'coordination',label:'Claims',desc:'Shared work surfaces are claimed before editing so parallel agents can work without invisible collisions.',facts:[['Role','Ownership lock'],['Protects','Shared files'],['Visible to','Other agents']]},
    {id:'comms',x:420,y:-65,r:22,layer:'coordination',label:'Comms',desc:'The shared communications layer carries assignments, handoffs, findings and completion evidence between agents.',facts:[['Role','Coordination bus'],['Carries','Status + findings'],['Links','Specialists']]},
    {id:'implement',x:320,y:95,r:28,layer:'execution',label:'Implementation',desc:'Agents edit the claimed work surface, reuse registered tools where possible and keep changes inside the agreed scope.',facts:[['Role','Execution'],['Requires','Claim + plan'],['Produces','Changed artifact']]},
    {id:'tools',x:150,y:165,r:20,layer:'execution',label:'Tools & Runtime',desc:'Local tools, repositories, build systems and connected services extend each agent into the real project environment.',facts:[['Role','External capability'],['Includes','Git, builds, APIs'],['Boundary','Permissioned access']]},
    {id:'tests',x:355,y:260,r:22,layer:'verification',label:'Tests & Checks',desc:'Builds, tests, hashes and targeted checks inspect whether the intended change behaves correctly.',facts:[['Role','Local verification'],['Receives','Changed artifact'],['Feeds','Runtime proof']]},
    {id:'runtime',x:170,y:315,r:27,layer:'verification',label:'Authoritative Artifact',desc:'Completion is checked against the actual running or authoritative artifact, not merely the source file that was edited.',facts:[['Role','Ground truth'],['Examples','Runtime / live file'],['Decides','Done or not done']]},
    {id:'correction',x:-45,y:315,r:21,layer:'verification',label:'Corrections',desc:'Disproved claims are superseded visibly rather than silently erased, preserving why the project changed course.',facts:[['Role','Error recovery'],['Persists','Correction history'],['Feeds','Durable memory']]},
    {id:'handoff',x:-250,y:285,r:22,layer:'coordination',label:'Handoff',desc:'Completed work, remaining risks and evidence are packaged so another agent or later session can continue without reconstruction.',facts:[['Role','Continuity transfer'],['Contains','Evidence + state'],['Feeds','Comms + memory']]},
    {id:'memory',x:-405,y:270,r:29,layer:'memory',label:'Durable Memory',desc:'The Hive-Mind retains accepted decisions, handoffs, lessons and project state so the organisation can continue beyond one conversation.',facts:[['Role','Organisational memory'],['Receives','Handoffs + corrections'],['Feeds','Future work']]},
    {id:'audit',x:40,y:80,r:18,layer:'verification',label:'Audit Trail',desc:'Important operations are attributable and reviewable, preserving what changed, who changed it and what evidence proved the result.',facts:[['Role','Accountability'],['Tracks','Mutations + evidence'],['Supports','Review']]},
    {id:'specialist',x:-95,y:80,r:23,layer:'coordination',label:'Specialist Routing',desc:'Work is routed to specialised roles instead of treating every agent as interchangeable. Engineering, research, operations and verification remain distinct functions.',facts:[['Role','Capability routing'],['Benefit','Specialisation'],['Output','Best-fit owner']]}
  ];

  const edgePairs = [
    ['brief','plans'],['context','plans'],['plans','review'],['review','decompose'],['decompose','claim'],['decompose','specialist'],['specialist','claim'],['claim','implement'],['comms','claim'],['comms','handoff'],['tools','implement'],['implement','tests'],['implement','audit'],['tests','runtime'],['runtime','correction'],['runtime','handoff'],['correction','memory'],['handoff','memory'],['handoff','comms'],['memory','context'],['audit','runtime'],['review','audit'],['specialist','comms'],['context','specialist']
  ];
  const edges = edgePairs.map(([a,b]) => ({a:nodes.find(n=>n.id===a), b:nodes.find(n=>n.id===b)}));

  let w=0,h=0,dpr=1,scale=1,tx=0,ty=0,dragging=false,dragNode=null,lastX=0,lastY=0,hover=null,active=nodes[0],filter='all',pulse=0;
  function resize(){
    const rect=stage.getBoundingClientRect(); w=rect.width; h=rect.height; dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
    if(!tx&&!ty){tx=w/2;ty=h/2;scale=Math.min(1.05,Math.max(.72,w/980));}
  }
  const screen=(n)=>({x:n.x*scale+tx,y:n.y*scale+ty,r:n.r*scale});
  const world=(x,y)=>({x:(x-tx)/scale,y:(y-ty)/scale});
  const visible=n=>filter==='all'||n.layer===filter;

  function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function draw(){
    ctx.clearRect(0,0,w,h);
    const time=performance.now();
    edges.forEach((e,i)=>{
      if(!visible(e.a)||!visible(e.b))return;
      const a=screen(e.a),b=screen(e.b); const dx=b.x-a.x,dy=b.y-a.y;
      const selected=e.a===active||e.b===active;
      ctx.beginPath();ctx.moveTo(a.x,a.y);
      const mx=(a.x+b.x)/2;ctx.bezierCurveTo(mx,a.y,mx,b.y,b.x,b.y);
      ctx.strokeStyle=selected?'rgba(243,155,200,.32)':'rgba(255,255,255,.075)';ctx.lineWidth=selected?1.35:.8;ctx.stroke();
      if(pulse>0){const t=((time/900)+(i*.071))%1; const px=a.x+dx*t, py=a.y+dy*t;ctx.beginPath();ctx.arc(px,py,selected?2.4:1.5,0,Math.PI*2);ctx.fillStyle=selected?palette[e.a.layer]:'rgba(200,190,205,.25)';ctx.fill();}
    });
    nodes.forEach(n=>{
      if(!visible(n))return; const s=screen(n); const isA=n===active,isH=n===hover;
      const glow=isA?32:isH?22:14;
      ctx.save();ctx.shadowBlur=glow;ctx.shadowColor=palette[n.layer];
      ctx.beginPath();ctx.arc(s.x,s.y,s.r+(isA?3:0),0,Math.PI*2);ctx.fillStyle=isA?'rgba(19,17,25,.98)':'rgba(10,10,15,.94)';ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=isA?palette[n.layer]:'rgba(255,255,255,.16)';ctx.lineWidth=isA?1.6:1;ctx.stroke();
      ctx.beginPath();ctx.arc(s.x,s.y,3.3*scale,0,Math.PI*2);ctx.fillStyle=palette[n.layer];ctx.fill();
      ctx.font=`${Math.max(9,10*scale)}px Inter,system-ui`;ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle=isA?'#fff':'#aaa2ad';ctx.fillText(n.label,s.x,s.y+s.r+9);
      ctx.restore();
    });
    requestAnimationFrame(draw);
  }
  function hit(x,y){for(let i=nodes.length-1;i>=0;i--){const n=nodes[i];if(!visible(n))continue;const s=screen(n);if(Math.hypot(x-s.x,y-s.y)<=s.r+8)return n;}return null;}
  function setDetail(n){active=n;if(!detail)return;detail.innerHTML=`<div class="node-class">${n.layer}</div><h4>${n.label}</h4><p>${n.desc}</p><ul>${n.facts.map(([a,b])=>`<li><span>${a}</span><b>${b}</b></li>`).join('')}</ul>`;}

  stage.addEventListener('pointerdown',e=>{stage.setPointerCapture(e.pointerId);lastX=e.offsetX;lastY=e.offsetY;dragNode=hit(lastX,lastY);dragging=true;stage.classList.add('dragging');if(dragNode)setDetail(dragNode);});
  stage.addEventListener('pointermove',e=>{const x=e.offsetX,y=e.offsetY;hover=hit(x,y);if(!dragging)return;const dx=x-lastX,dy=y-lastY;lastX=x;lastY=y;if(dragNode){dragNode.x+=dx/scale;dragNode.y+=dy/scale;}else{tx+=dx;ty+=dy;}});
  const end=()=>{dragging=false;dragNode=null;stage.classList.remove('dragging');};stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
  stage.addEventListener('wheel',e=>{e.preventDefault();const old=scale;const factor=Math.exp(-e.deltaY*.0012);scale=Math.min(2.25,Math.max(.42,scale*factor));const wx=(e.offsetX-tx)/old,wy=(e.offsetY-ty)/old;tx=e.offsetX-wx*scale;ty=e.offsetY-wy*scale;},{passive:false});
  stage.addEventListener('dblclick',e=>{const n=hit(e.offsetX,e.offsetY);if(n){active=n;setDetail(n);tx=w/2-n.x*scale;ty=h/2-n.y*scale;}});
  resetBtn?.addEventListener('click',()=>{scale=Math.min(1.05,Math.max(.72,w/980));tx=w/2;ty=h/2;filter='all';layerBtns.forEach(b=>b.classList.toggle('active',b.dataset.layer==='all'));});
  pulseBtn?.addEventListener('click',()=>{pulse=pulse?0:1;pulseBtn.textContent=pulse?'Pause signal flow':'Trace signal flow';});
  layerBtns.forEach(btn=>btn.addEventListener('click',()=>{filter=btn.dataset.layer;layerBtns.forEach(b=>b.classList.toggle('active',b===btn));}));

  resize(); addEventListener('resize',resize,{passive:true}); setDetail(active); if(!reduce)pulse=1; draw();
})();