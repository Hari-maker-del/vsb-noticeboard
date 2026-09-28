(()=>{const cls=document.getElementById('class');const hero=document.getElementById('heroClass');const live=document.getElementById('liveClass');if(cls){const sync=()=>{if(hero)hero.textContent=cls.value;if(live)live.textContent=cls.value};cls.addEventListener('change',sync);sync();Promise.all([fetch('/api/classes').then(r=>r.json()),fetch('/api/notices?class_code='+encodeURIComponent(cls.value)+'&limit=1').then(r=>r.json())]).then(([classes,notices])=>{const mc=document.getElementById('metricClasses'),mn=document.getElementById('metricNotices');if(mc)mc.textContent=Array.isArray(classes)?classes.length:'—';if(mn)mn.textContent=typeof notices.total==='number'?notices.total:Array.isArray(notices)?notices.length:'—'}).catch(()=>{})}

const logo='/vsb-logo.webp';
const applyVsbBranding=()=>{
  document.querySelectorAll('.side-logo').forEach(el=>{
    el.textContent='';
    const img=document.createElement('img');
    img.src=logo;img.alt='V.S.B Engineering College';img.loading='eager';
    img.style.cssText='width:100%;height:100%;object-fit:contain;border-radius:10px;display:block';
    el.style.cssText+=';padding:3px;overflow:hidden;background:#fff;';
    el.appendChild(img);
  });
  document.querySelectorAll('.hero-badge').forEach(el=>{
    el.textContent='';
    const img=document.createElement('img');
    img.src=logo;img.alt='V.S.B Engineering College';img.loading='eager';
    img.style.cssText='width:100%;height:100%;object-fit:contain;border-radius:50%;display:block';
    el.style.cssText+=';padding:3px;overflow:hidden;background:#fff;';
    el.appendChild(img);
  });
  let favicon=document.querySelector('link[data-vsb-favicon]');
  if(!favicon){favicon=document.createElement('link');favicon.rel='icon';favicon.dataset.vsbFavicon='true';document.head.appendChild(favicon)}
  favicon.type='image/webp';favicon.href=logo;
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyVsbBranding);else applyVsbBranding();
})();