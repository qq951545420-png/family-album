'use strict';
(() => {
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero=document.querySelector('.hero'),progress=document.querySelector('.reading-progress'),backTop=document.getElementById('back-top');
  let observer=null,frame=0,heroHeight=600,pageHeight=1;
  const measure=()=>{heroHeight=hero.offsetHeight;pageHeight=Math.max(1,document.documentElement.scrollHeight-innerHeight);};
  const paint=()=>{
    frame=0;
    const y=window.scrollY;
    document.body.classList.toggle('is-scrolled',y>28);
    progress.style.transform=`scaleX(${Math.min(1,Math.max(0,y/pageHeight))})`;
    backTop.hidden=y<600;
    const drift=reduce.matches?0:Math.min(y,heroHeight)*.13;
    hero.style.setProperty('--hero-drift',`${drift.toFixed(1)}px`);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint);};
  const observe=(root)=>{
    root.querySelectorAll('[data-reveal]').forEach(el=>{
      if(!observer){el.classList.add('is-visible');return;}
      // Content already above the viewport should not disappear after filtering.
      if(el.getBoundingClientRect().bottom<=0)el.classList.add('is-visible');
      else observer.observe(el);
    });
  };
  const setup=()=>{
    observer?.disconnect();observer=null;
    if(!reduce.matches&&'IntersectionObserver' in window){
      observer=new IntersectionObserver(entries=>{
        entries.forEach(({target,isIntersecting})=>{if(isIntersecting){target.classList.add('is-visible');observer.unobserve(target);}});
      },{threshold:.06,rootMargin:'0px 0px -24px 0px'});
      document.documentElement.dataset.motion='ready';
    }else{delete document.documentElement.dataset.motion;}
    observe(document);measure();schedule();
  };
  window.AlbumMotion={
    clearGallery(){document.querySelectorAll('#gallery [data-reveal]').forEach(el=>observer?.unobserve(el));},
    refreshGallery(){observe(document.getElementById('gallery'));measure();schedule();},
    openMedia(el,sourceRect){
      if(reduce.matches||!el.animate)return;
      const show=()=>requestAnimationFrame(()=>{
        if(!el.isConnected||!document.getElementById('viewer').open||reduce.matches)return;
        const to=el.getBoundingClientRect();
        if(!to.width||!to.height)return;
        const scale=sourceRect?Math.max(.12,Math.min(.8,sourceRect.width/to.width,sourceRect.height/to.height)):.975;
        const x=sourceRect?sourceRect.left+sourceRect.width/2-to.left-to.width/2:0;
        const y=sourceRect?sourceRect.top+sourceRect.height/2-to.top-to.height/2:12;
        el.animate([{transform:`translate(${x}px,${y}px) scale(${scale})`,opacity:.2},{transform:'translate(0,0) scale(1)',opacity:1}],{duration:sourceRect?570:340,easing:'cubic-bezier(.2,.75,.2,1)'});
      });
      if(el.tagName==='IMG'&&!el.complete)el.addEventListener('load',show,{once:true});else show();
    }
  };
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',()=>{measure();schedule();},{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(()=>{measure();schedule();}).observe(document.body);
  backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:reduce.matches?'instant':'smooth'}));
  if(reduce.addEventListener)reduce.addEventListener('change',setup);
  setup();
})();
