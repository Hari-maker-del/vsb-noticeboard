const express=require('express');
const originalExpress=express;
const QRCode=require('qrcode');
const {get}=require('./database');
const wrappedExpress=function(){
  const app=originalExpress();
  process.nextTick(()=>{
    const clean=v=>String(v??'').trim().slice(0,100);
    const publicUrl=()=>process.env.PUBLIC_APP_URL||process.env.APP_URL||null;
    app.get('/api/notices/:id/qr',async(req,res)=>{
      try{
        const id=clean(req.params.id);
        const notice=await get('SELECT id,title FROM notices WHERE id=?',[id]);
        if(!notice)return res.status(404).json({error:'Notice not found'});
        const base=publicUrl();
        if(!base)return res.status(503).json({error:'PUBLIC_APP_URL is not configured'});
        const verificationUrl=new URL('/?notice='+encodeURIComponent(id),base.endsWith('/')?base:base+'/').toString();
        const qr=await QRCode.toDataURL(verificationUrl,{errorCorrectionLevel:'H',margin:4,width:640,type:'image/png'});
        res.setHeader('Cache-Control','public, max-age=300');
        res.json({notice_id:notice.id,title:notice.title,verification_url:verificationUrl,qr});
      }catch(e){res.status(500).json({error:'Failed to generate notice QR'})}
    });
    app.get('/api/notices/:id/verify',async(req,res)=>{
      try{
        const id=clean(req.params.id);
        const n=await get('SELECT n.id,n.title,n.category,n.priority,n.class_code,n.publish_at,n.expires_at,n.pinned,n.created_at,u.name creator_name,u.role creator_role FROM notices n LEFT JOIN users u ON u.id=n.created_by WHERE n.id=?',[id]);
        if(!n)return res.status(404).json({verified:false,error:'Notice not found'});
        const now=Date.now();
        const published=!n.publish_at||new Date(n.publish_at).getTime()<=now;
        const active=!n.expires_at||new Date(n.expires_at).getTime()>now;
        res.json({verified:published&&active,notice:{id:n.id,title:n.title,category:n.category,priority:n.priority,class_code:n.class_code,publish_at:n.publish_at,expires_at:n.expires_at,created_at:n.created_at,publisher:n.creator_name||'V.S.B Engineering College',publisher_role:n.creator_role||'OFFICIAL'}});
      }catch(e){res.status(500).json({verified:false,error:'Verification failed'})}
    });
  });
  return app;
};
Object.assign(wrappedExpress,originalExpress);
require.cache[require.resolve('express')].exports=wrappedExpress;
