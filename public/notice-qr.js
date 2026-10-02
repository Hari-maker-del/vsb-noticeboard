(function(){
  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function verificationUrl(id){return new URL('/?notice='+encodeURIComponent(id),location.origin).toString()}
  async function render(target,id){
    const el=typeof target==='string'?document.querySelector(target):target;if(!el||!id)return;
    el.innerHTML='<div style="padding:14px;border:1px solid #eee;border-radius:14px;text-align:center">Generating official QR…</div>';
    try{
      const r=await fetch('/api/notices/'+encodeURIComponent(id)+'/qr',{credentials:'include',headers:{Accept:'application/json'}});
      const data=r.ok?await r.json():null;if(!data?.qr)throw new Error(data?.error||'QR generation failed');
      el.innerHTML='<div class="official-qr-card"><div class="official-qr-badge">OFFICIAL NOTICE</div><img width="240" height="240" alt="QR code to verify official notice '+esc(id)+'" src="'+data.qr+'"><strong>Scan to verify</strong><small>Notice ID: '+esc(id)+'</small><button type="button" class="official-qr-print">Print QR</button></div>';
      el.querySelector('.official-qr-print').onclick=()=>{const w=window.open('','_blank','noopener');if(!w)return;w.document.write('<title>Official Notice QR</title><body style="font-family:system-ui;text-align:center;padding:40px"><h2>V.S.B Engineering College</h2><img width="480" height="480" src="'+data.qr+'"><p>Notice ID: '+esc(id)+'</p><p>'+esc(data.verification_url)+'</p><script>window.print()<\\/script></body>');w.document.close()};
    }catch(e){el.innerHTML='<div style="padding:14px;border:1px solid #fecaca;border-radius:14px;color:#b91c1c">Official QR is temporarily unavailable.</div>'}
  }
  window.VSBNoticeQR={verificationUrl,render};
  const style=document.createElement('style');style.textContent='.official-qr-card{display:flex;flex-direction:column;align-items:center;gap:9px;padding:18px;border:1px solid #eee;border-radius:18px;background:#fff}.official-qr-card img{image-rendering:auto}.official-qr-badge{font-size:11px;font-weight:800;color:#806300;background:#fff8cf;border-radius:999px;padding:6px 10px}.official-qr-card small{color:#777}.official-qr-print{border:0;border-radius:9px;background:#f5c400;color:#171717;padding:9px 14px;font-weight:800;cursor:pointer}';document.head.appendChild(style);
})();