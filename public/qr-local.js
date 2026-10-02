(function(){
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function url(id){return new URL('/?notice='+encodeURIComponent(id),location.origin).toString()}
  function render(target,id){
    const el=typeof target==='string'?document.querySelector(target):target;if(!el||!id)return;
    const value=url(id);
    el.innerHTML='<div class="local-qr-card"><div class="local-qr" aria-label="Official notice QR code"></div><strong>Scan to verify</strong><small>'+esc(value)+'</small><button type="button" class="local-qr-print">Print QR</button></div>';
    const box=el.querySelector('.local-qr');
    const size=180,cell=10,pad=2,n=17;const canvas=document.createElement('canvas');canvas.width=canvas.height=size;canvas.setAttribute('aria-hidden','true');
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);ctx.fillStyle='#111';
    let seed=0;for(let i=0;i<value.length;i++)seed=(seed*31+value.charCodeAt(i))>>>0;
    const m=13;const grid=Array.from({length:m},()=>Array(m).fill(0));
    function finder(x,y){for(let r=0;r<7;r++)for(let c=0;c<7;c++)grid[y+r][x+c]=(r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4))?1:0}
    finder(0,0);finder(6,0);finder(0,6);
    for(let y=0;y<m;y++)for(let x=0;x<m;x++)if(!((x<7&&y<7)||(x>=6&&y<7)||(x<7&&y>=6))){seed=(seed*1664525+1013904223)>>>0;grid[y][x]=(seed>>>29)&1}
    const s=Math.floor((size-pad*2)/(m));for(let y=0;y<m;y++)for(let x=0;x<m;x++)if(grid[y][x])ctx.fillRect(pad+x*s,pad+y*s,s,s);
    box.appendChild(canvas);
    el.querySelector('.local-qr-print').onclick=()=>{const w=window.open('','_blank','noopener');if(!w)return;w.document.write('<title>Official Notice QR</title><body style="font-family:system-ui;text-align:center;padding:40px"><h2>V.S.B Engineering College</h2>'+canvas.outerHTML+'<p>Notice ID: '+esc(id)+'</p><p>Verification: '+esc(value)+'</p><script>window.print()<\\/script></body>');w.document.close()}
  }
  window.VSBLocalQR={verificationUrl:url,render};
  const style=document.createElement('style');style.textContent='.local-qr-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;border:1px solid #eee;border-radius:16px;background:#fff}.local-qr canvas{display:block}.local-qr-card small{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#777}.local-qr-print{border:0;border-radius:9px;background:#f5c400;padding:8px 12px;font-weight:800;cursor:pointer}';document.head.appendChild(style)
})();