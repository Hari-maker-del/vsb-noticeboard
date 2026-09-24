const sqlite3=require('sqlite3').verbose();
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'data');fs.mkdirSync(dir,{recursive:true});
const db=new sqlite3.Database(path.join(dir,'vsb-noticeboard.sqlite'));
function all(sql,p=[]){return new Promise((r,j)=>db.all(sql,p,(e,x)=>e?j(e):r(x)));}
function get(sql,p=[]){return new Promise((r,j)=>db.get(sql,p,(e,x)=>e?j(e):r(x)));}
function run(sql,p=[]){return new Promise((r,j)=>db.run(sql,p,function(e){e?j(e):r({lastID:this.lastID,changes:this.changes});}));}
async function ensureColumn(table,column,definition){const cols=await all(`PRAGMA table_info(${table})`);if(!cols.some(c=>c.name===column))await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);}
async function initDb(){
  const schema=fs.readFileSync(path.join(__dirname,'database/schema.sql'),'utf8');
  await new Promise((resolve,reject)=>db.exec(schema,e=>e?reject(e):resolve()));
  await run('PRAGMA foreign_keys = ON');
  await ensureColumn('users','class_code','TEXT');await ensureColumn('users','roll_no','TEXT');await ensureColumn('users','phone','TEXT');await ensureColumn('users','semester','TEXT');await ensureColumn('users','department',"TEXT NOT NULL DEFAULT 'Information Technology'");await ensureColumn('users','active','INTEGER NOT NULL DEFAULT 1');
  await ensureColumn('notices','publish_at','TEXT');await ensureColumn('notices','pinned','INTEGER NOT NULL DEFAULT 0');
  return true;
}
module.exports={db,initDb,all,get,run};