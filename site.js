(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const opening = document.getElementById('opening');
  document.documentElement.classList.add('js');

  document.querySelectorAll('.nav-links').forEach(nav => {
    if (!nav.querySelector('a[href="services.html"]')) {
      const home = nav.querySelector('a[href="index.html"]');
      const link = document.createElement('a');
      link.href = 'services.html';
      link.textContent = 'Services';
      if (home && home.nextSibling) nav.insertBefore(link, home.nextSibling);
      else nav.insertBefore(link, nav.firstChild);
    }
  });
  document.querySelectorAll('.footer-links').forEach(nav => {
    if (!nav.querySelector('a[href="services.html"]')) {
      const link = document.createElement('a');
      link.href = 'services.html';
      link.textContent = 'Services';
      nav.insertBefore(link, nav.firstChild);
    }
  });

  if (opening) {
    if (reduce) opening.classList.add('hide');
    else addEventListener('load', () => setTimeout(() => opening.classList.add('hide'), 2450), {once:true});
  }

  const bar = document.getElementById('topbar');
  const setBar = () => bar && bar.classList.toggle('scrolled', scrollY > 22);
  setBar(); addEventListener('scroll', setBar, {passive:true});

  const reveals = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), {threshold:.1, rootMargin:'0px 0px -6% 0px'});
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('in'));

  const light = document.getElementById('cursorLight');
  let mouseX = innerWidth/2, mouseY = innerHeight/3;
  if (!reduce) addEventListener('pointermove', e => {
    mouseX=e.clientX; mouseY=e.clientY;
    if(light){ light.style.left=mouseX+'px'; light.style.top=mouseY+'px'; }
  }, {passive:true});

  if (!reduce && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.project,.flow-card,.command-deck,.service-card,.cap-card,.engagement-card,.executive-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
        card.style.transform=`perspective(900px) rotateX(${-y*1.6}deg) rotateY(${x*2.2}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => card.style.transform='');
    });
  }

  const canvas = document.getElementById('network');
  if (!canvas || reduce) return;
  const ctx = canvas.getContext('2d');
  let w=0,h=0,dpr=1,points=[];
  function resize(){
    dpr=Math.min(devicePixelRatio||1,2); w=innerWidth; h=innerHeight;
    canvas.width=Math.floor(w*dpr); canvas.height=Math.floor(h*dpr); canvas.style.width=w+'px'; canvas.style.height=h+'px'; ctx.setTransform(dpr,0,0,dpr,0,0);
    const count=Math.min(70,Math.max(28,Math.floor(w/22)));
    points=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.16,vy:(Math.random()-.5)*.16,r:Math.random()*1.25+.3,p:Math.random()*6.28}));
  }
  function frame(){
    ctx.clearRect(0,0,w,h);
    for(const p of points){
      const dx=mouseX-p.x,dy=mouseY-p.y,dist=Math.hypot(dx,dy);
      if(dist<230&&dist>1){p.vx+=dx/dist*.0015;p.vy+=dy/dist*.0015}
      p.vx*=.999;p.vy*=.999;p.x+=p.vx;p.y+=p.vy;p.p+=.012;
      if(p.x<-40)p.x=w+40;if(p.x>w+40)p.x=-40;if(p.y<-40)p.y=h+40;if(p.y>h+40)p.y=-40;
      const glow=.15+Math.sin(p.p)*.06;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(244,224,239,${glow})`;ctx.fill();
    }
    for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
      const a=points[i],b=points[j],dx=a.x-b.x,dy=a.y-b.y,dist=Math.hypot(dx,dy);
      if(dist<145){const alpha=(1-dist/145)*.105;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(219,165,209,${alpha})`;ctx.lineWidth=.55;ctx.stroke();}
    }
    requestAnimationFrame(frame);
  }
  resize();addEventListener('resize',resize,{passive:true});requestAnimationFrame(frame);
})();