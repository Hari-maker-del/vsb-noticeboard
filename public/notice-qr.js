(function(){
  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function verificationUrl(id){return new URL('/?notice='+encodeURIComponent(id),location.origin).toString()}
  window.VSBNoticeQR={verificationUrl,render:function(target,id){
    const el=typeof target==='string'?document.querySelector(target):target;if(!el||!id)return;
    if(window.VSBLocalQR){return window.VSBLocalQR.render(el,id)}
    el.innerHTML='<div style="padding:14px;border:1px solid #eee;border-radius:14px">QR module loading…</div>';
  }};
})();