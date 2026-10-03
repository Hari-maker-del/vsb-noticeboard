const express=require('express');
const originalExpress=express;
const QRCode=require('qrcode');
const bcrypt=require('bcryptjs');
const rateLimit=require('express-rate-limit');
const {get,run}=require('./database');
const wrappedExpress=function(){
  const app=originalExpress();
  process.nextTick(()=>{
    const clean=v=>String(v??'').trim().slice(0,100);
    const publicUrl=()=>process.env.PUBLIC_APP_URL||process.env.APP_URL||null;
    const signupLimiter=rateLimit({windowMs:15*60*1000,limit:5,standardHeaders:true,legacyHeaders:false,message:{error:'Too many registration attempts. Please try again later.'}});
    app.post('/api/auth/signup',signupLimiter,async(req,res)=>{
      try{
        const name=clean(req.body.name),email=String(req.body.email??'').trim().toLowerCase().slice(0,254),password=String(req.body.password||''),phone=clean(req.body.phone),classCode=clean(req.body.class_code,10),rollNo=clean(req.body.roll_no,30),semester=clean(req.body.semester,10);
        if(name.length<2)return res.status(400).json({error:'Please enter your full name.'});
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Please enter a valid email address.'});
        if(password.length<8)return res.status(400).json({error:'Password must be at least 8 characters.'});
        if(!/[A-Za-z]/.test(password)||!/[0-9]/.test(password))return res.status(400).json({error:'Password must contain letters and numbers.'});
        if(!['IT-A','IT-B','IT-C'].includes(classCode))return res.status(400).json({error:'Please select a valid IT class.'});
        const existing=await get('SELECT id FROM users WHERE email=?',[email]);
        if(existing)return res.status(409).json({error:'An account with this email already exists. Please sign in.'});
        const hash=await bcrypt.hash(password,12);
        const r=await run('INSERT INTO users(name,email,password_hash,role,class_code,roll_no,phone,semester,department,active) VALUES(?,?,?,?,?,?,?,?,?,?)',[name,email,hash,'STUDENT',classCode,rollNo||null,phone||null,semester||null,'Information Technology',1]);
        res.status(201).json({success:true,user:{id:r.lastID,name,email,role:'STUDENT',class_code:classCode,roll_no:rollNo||null,semester:semester||null,department:'Information Technology'}});
      }catch(e){
        if(e?.code==='23505'||/unique/i.test(String(e?.message||'')))return res.status(409).json({error:'An account with this email already exists. Please sign in.'});
        console.error(JSON.stringify({type:'signup_error',error:e.message}));
        res.status(500).json({error:'Registration failed. Please try again.'});
      }
    });
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
