const express=require('express');
const originalExpress=express;
const bcrypt=require('bcryptjs');
const rateLimit=require('express-rate-limit');
const {get,run}=require('./database');
const wrappedExpress=function(){
  const app=originalExpress();
  process.nextTick(()=>{
    const signupLimiter=rateLimit({windowMs:15*60*1000,limit:5,standardHeaders:true,legacyHeaders:false,message:{error:'Too many registration attempts. Please try again later.'}});
    const clean=(v,max)=>String(v??'').trim().slice(0,max);
    app.post('/api/auth/signup',signupLimiter,async(req,res)=>{
      try{
        const name=clean(req.body.name,100),email=clean(req.body.email,254).toLowerCase(),password=String(req.body.password||''),phone=clean(req.body.phone,20),classCode=clean(req.body.class_code,10),rollNo=clean(req.body.roll_no,30),semester=clean(req.body.semester,10);
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
  });
  return app;
};
Object.assign(wrappedExpress,originalExpress);
require.cache[require.resolve('express')].exports=wrappedExpress;
