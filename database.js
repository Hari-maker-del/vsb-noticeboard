const fs=require('fs'),path=require('path');
const usePostgres=Boolean(process.env.DATABASE_URL);
let db=null,pool=null;
function pgSql(sql){
  let i=0;
  let out=sql.replace(/\?/g,()=>'$'+(++i));
  out=out.replace(/datetime\((["'])now\1\)/gi,'CURRENT_TIMESTAMP');
  out=out.replace(/INSERT OR IGNORE INTO/gi,'INSERT INTO');
  if(/INSERT INTO/i.test(out)&&/read_receipts/i.test(out)) out+=' ON CONFLICT (user_id,notice_id) DO NOTHING';
  if(/INSERT INTO/i.test(out)&&/classes/i.test(out)&&/VALUES/i.test(out)) out+=' ON CONFLICT (code) DO NOTHING';
  return out;
}
async function all(sql,p=[]){
  if(usePostgres){const r=await pool.query(pgSql(sql),p);return r.rows;}
  return new Promise((resolve,reject)=>db.all(sql,p,(e,x)=>e?reject(e):resolve(x)));
}
async function get(sql,p=[]){
  if(usePostgres){const r=await pool.query(pgSql(sql),p);return r.rows[0];}
  return new Promise((resolve,reject)=>db.get(sql,p,(e,x)=>e?reject(e):resolve(x)));
}
async function run(sql,p=[]){
  if(usePostgres){
    const client=await pool.connect();
    try{
      const q=pgSql(sql),r=await client.query(q,p);
      let lastID=null;
      if(/^\s*INSERT\s+/i.test(q)){
        try{const x=await client.query('SELECT LASTVAL() AS id');lastID=x.rows[0]?.id??null;}catch{}
      }
      return {lastID,changes:r.rowCount||0};
    }finally{client.release();}
  }
  return new Promise((resolve,reject)=>db.run(sql,p,function(e){e?reject(e):resolve({lastID:this.lastID,changes:this.changes});}));
}
async function ensureColumn(table,column,definition){
  if(usePostgres) await run(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
  else {const cols=await all(`PRAGMA table_info(${table})`);if(!cols.some(c=>c.name===column))await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);}
}
async function initDb(){
  if(usePostgres){
    pool=new (require('pg').Pool)({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false},max:Number(process.env.DATABASE_POOL_SIZE||10),idleTimeoutMillis:30000});
    await pool.query('SELECT 1');
    const schema=fs.readFileSync(path.join(__dirname,'database/postgres.sql'),'utf8');
    await pool.query(schema);
    await ensureColumn('users','class_code','TEXT');await ensureColumn('users','roll_no','TEXT');await ensureColumn('users','phone','TEXT');await ensureColumn('users','semester','TEXT');await ensureColumn('users','department',"TEXT NOT NULL DEFAULT 'Information Technology'");await ensureColumn('users','active','INTEGER NOT NULL DEFAULT 1');
    await ensureColumn('notices','publish_at','TEXT');await ensureColumn('notices','pinned','INTEGER NOT NULL DEFAULT 0');
    return true;
  }
  const sqlite3=require('sqlite3').verbose(),dir=path.join(__dirname,'data');fs.mkdirSync(dir,{recursive:true});
  db=new sqlite3.Database(path.join(dir,'vsb-noticeboard.sqlite'));
  const schema=fs.readFileSync(path.join(__dirname,'database/schema.sql'),'utf8');
  await new Promise((resolve,reject)=>db.exec(schema,e=>e?reject(e):resolve()));
  await run('PRAGMA foreign_keys = ON');
  await ensureColumn('users','class_code','TEXT');await ensureColumn('users','roll_no','TEXT');await ensureColumn('users','phone','TEXT');await ensureColumn('users','semester','TEXT');await ensureColumn('users','department',"TEXT NOT NULL DEFAULT 'Information Technology'");await ensureColumn('users','active','INTEGER NOT NULL DEFAULT 1');
  await ensureColumn('notices','publish_at','TEXT');await ensureColumn('notices','pinned','INTEGER NOT NULL DEFAULT 0');
  return true;
}
async function closeDb(){if(pool)await pool.end();if(db)await new Promise(r=>db.close(()=>r()));}
module.exports={db:null,initDb,all,get,run,closeDb,isPostgres:()=>usePostgres};
