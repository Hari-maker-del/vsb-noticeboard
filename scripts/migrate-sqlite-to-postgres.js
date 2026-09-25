const sqlite3=require('sqlite3').verbose(),fs=require('fs'),path=require('path'),{Client}=require('pg');

const sqlitePath=process.env.SQLITE_PATH||path.join(__dirname,'..','data','vsb-noticeboard.sqlite');
const pgUrl=process.env.DATABASE_URL;
if(!pgUrl)throw new Error('DATABASE_URL is required');
const dryRun=process.argv.includes('--dry-run');
const tables=['users','classes','notices','read_receipts','timetable','faculty','events','assignments','materials','exams','attendance','marks','audit_logs'];
const skippedTables=['auth_sessions']; // Sessions are intentionally not migrated; users must re-authenticate after cutover.

const sqlite=new sqlite3.Database(sqlitePath);
const pg=new Client({connectionString:pgUrl,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false}});

const all=(sql,p=[])=>new Promise((resolve,reject)=>sqlite.all(sql,p,(e,x)=>e?reject(e):resolve(x)));
const sourceCount=table=>all('SELECT COUNT(*) AS count FROM '+table).then(r=>Number(r[0].count));
const destCount=async table=>Number((await pg.query('SELECT COUNT(*) AS count FROM '+table)).rows[0].count);

async function syncSequence(table){
  if(table==='notices')return;
  await pg.query("SELECT setval(pg_get_serial_sequence($1,'id'),COALESCE((SELECT MAX(id) FROM "+table+"),1),true)",[table]);
}

async function migrateTable(table){
  const rows=await all('SELECT * FROM '+table);
  const source=rows.length;
  const before=await destCount(table);
  if(dryRun)return {table,source,before,after:before,migrated:0,skipped:source};
  if(!source)return {table,source,before,after:before,migrated:0,skipped:0};

  const columns=Object.keys(rows[0]);
  const quoted=columns.map(c=>'"'+c+'"').join(',');
  const placeholders=columns.map((_,i)=>'$'+(i+1)).join(',');
  const sql='INSERT INTO '+table+' ('+quoted+') VALUES ('+placeholders+') ON CONFLICT DO NOTHING';
  let inserted=0;
  for(const row of rows){
    const r=await pg.query(sql,columns.map(c=>row[c]));
    inserted+=r.rowCount||0;
  }
  await syncSequence(table);
  const after=await destCount(table);
  if(after<source)throw new Error(table+' migration verification failed: source='+source+', destination='+after);
  return {table,source,before,after,migrated:inserted,skipped:source-inserted};
}

(async()=>{
  try{
    await pg.connect();
    const schema=fs.readFileSync(path.join(__dirname,'..','database','postgres.sql'),'utf8');
    await pg.query(schema);

    const sourceSummary={};
    for(const table of tables)sourceSummary[table]=await sourceCount(table);

    if(dryRun){
      const plan=[];
      for(const table of tables)plan.push(await migrateTable(table));
      console.log(JSON.stringify({ok:true,dry_run:true,source:sourceSummary,plan,skipped_tables:skippedTables},null,2));
      return;
    }

    await pg.query('BEGIN');
    const results=[];
    try{
      for(const table of tables)results.push(await migrateTable(table));
      await pg.query('COMMIT');
    }catch(e){
      await pg.query('ROLLBACK').catch(()=>{});
      throw e;
    }

    const verification={};
    for(const table of tables)verification[table]={source:sourceSummary[table],destination:await destCount(table)};
    console.log(JSON.stringify({ok:true,dry_run:false,results,verification,skipped_tables:skippedTables,note:'All existing sessions were intentionally skipped; users must sign in again after PostgreSQL cutover.'},null,2));
  }catch(e){
    console.error(JSON.stringify({ok:false,error:e.message}));
    process.exitCode=1;
  }finally{
    await pg.end().catch(()=>{});
    sqlite.close();
  }
})();
