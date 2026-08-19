(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const opening = document.getElementById('opening');
  if (!reduce && opening) {
    window.addEventListener('load', () => setTimeout(() => opening.classList.add('hide'), 1550), {once:true});
  } else if (opening) opening.classList.add('hide');

  const bar = document.getElementById('topbar');
  const setBar = () => bar && bar.classList.toggle('scrolled', window.scrollY > 18);
  setBar();
  addEventListener('scroll', setBar, {passive:true});

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, {threshold:.12, rootMargin:'0px 0px -7% 0px'});
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('in'));

  const light = document.getElementById('cursorLight');
  if (light && !reduce) addEventListener('pointermove', e => {
    light.style.left = e.clientX + 'px';
    light.style.top = e.clientY + 'px';
  }, {passive:true});

  const canvas = document.getElementById('network');
  if (!canvas || reduce) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, points = [];
  function resize(){
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = Math.floor(w*dpr); canvas.height = Math.floor(h*dpr);
    canvas.style.width = w+'px'; canvas.style.height = h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count = Math.min(52, Math.max(24, Math.floor(w/28)));
    points = Array.from({length:count}, () => ({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.12,vy:(Math.random()-.5)*.12,r:Math.random()*1.2+.35}));
  }
  function frame(){
    ctx.clearRect(0,0,w,h);
    for (const p of points){
      p.x += p.vx; p.y += p.vy;
      if (p.x < -30) p.x = w+30; if (p.x > w+30) p.x = -30;
      if (p.y < -30) p.y = h+30; if (p.y > h+30) p.y = -30;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle='rgba(238,220,235,.22)'; ctx.fill();
    }
    for (let i=0;i<points.length;i++) for (let j=i+1;j<points.length;j++){
      const a=points[i],b=points[j],dx=a.x-b.x,dy=a.y-b.y,dist=Math.hypot(dx,dy);
      if(dist<135){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(213,166,208,${(1-dist/135)*.09})`;ctx.lineWidth=.6;ctx.stroke();}
    }
    requestAnimationFrame(frame);
  }
  resize(); addEventListener('resize', resize, {passive:true}); frame();
})();