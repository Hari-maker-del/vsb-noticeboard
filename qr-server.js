const QRCode=require('qrcode');

module.exports=function registerNoticeQr({app,get,clean}){
  const origin=()=>process.env.PUBLIC_APP_URL||process.env.APP_URL||null;
  const verificationUrl=id=>{
    const base=origin();
    if(!base) return null;
    return new URL('/?notice='+encodeURIComponent(id),base.endsWith('/')?base:base+'/').toString();
  };

  app.get('/api/notices/:id/qr',async(req,res)=>{
    try{
      const id=clean(req.params.id,100);
      const notice=await get('SELECT id,title FROM notices WHERE id=?',[id]);
      if(!notice)return res.status(404).json({error:'Notice not found'});
      const target=verificationUrl(id);
      if(!target)return res.status(503).json({error:'PUBLIC_APP_URL is not configured'});
      const dataUrl=await QRCode.toDataURL(target,{errorCorrectionLevel:'H',margin:4,width:640,type:'image/png'});
      res.setHeader('Cache-Control','public, max-age=300');
      res.json({notice_id:notice.id,title:notice.title,verification_url:target,qr:dataUrl});
    }catch(e){
      console.error(JSON.stringify({type:'notice_qr_error',error:e.message}));
      res.status(500).json({error:'Failed to generate notice QR'});
    }
  });

  app.get('/api/notices/:id/verify',async(req,res)=>{
    try{
      const id=clean(req.params.id,100);
      const notice=await get(`SELECT n.id,n.title,n.category,n.priority,n.class_code,n.publish_at,n.expires_at,n.pinned,n.created_at,u.name creator_name,u.role creator_role FROM notices n LEFT JOIN users u ON u.id=n.created_by WHERE n.id=?`,[id]);
      if(!notice)return res.status(404).json({verified:false,error:'Notice not found'});
      const now=Date.now();
      const published=!notice.publish_at||new Date(notice.publish_at).getTime()<=now;
      const active=!notice.expires_at||new Date(notice.expires_at).getTime()>now;
      res.json({verified:published&&active,notice:{id:notice.id,title:notice.title,category:notice.category,priority:notice.priority,class_code:notice.class_code,publish_at:notice.publish_at,expires_at:notice.expires_at,created_at:notice.created_at,publisher:notice.creator_name||'V.S.B Engineering College',publisher_role:notice.creator_role||'OFFICIAL'}});
    }catch(e){res.status(500).json({verified:false,error:'Verification failed'})}
  });
};
