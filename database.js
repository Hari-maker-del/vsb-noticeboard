const sqlite3=require('sqlite3').verbose();
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'data');fs.mkdirSync(dir,{recursive:true});
const db=new sqlite3.Database(path.join(dir,'vsb-noticeboard.sqlite'));
function initDb(){const schema=fs.readFileSync(path.join(__dirname,'database/schema.sql'),'utf8');return new Promise((resolve,reject)=>db.exec(schema,e=>e?reject(e):resolve()));}
function all(sql,p=[]){return new Promise((r,j)=>db.all(sql,p,(e,x)=>e?j(e):r(x)));}
function get(sql,p=[]){return new Promise((r,j)=>db.get(sql,p,(e,x)=>e?j(e):r(x)));}
function run(sql,p=[]){return new Promise((r,j)=>db.run(sql,p,function(e){e?j(e):r({lastID:this.lastID,changes:this.changes});}));}
module.exports={db,initDb,all,get,run};
