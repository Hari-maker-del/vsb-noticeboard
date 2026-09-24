const sqlite3=require('sqlite3').verbose(),fs=require('fs'),path=require('path'),{Client}=require('pg');
const sqlitePath=process.env.SQLITE_PATH||path.join(__dirname,'..','data','vsb-noticeboard.sqlite');
const pgUrl=process.env.DATABASE_URL;
if(!pgUrl)throw new Error('DATABASE_URL is required');
const tables=['users','classes','notices','read_receipts','timetable','faculty','events','assignments','materials','exams','attendance','marks','audit_logs'];
const sqlite=new sqlite3.Database(sqlitePath),pg=new Client({connectionString:pgUrl,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false}});
const all=(sql,p=[])=>new Promise((r,j)=>sqlite.all(sql,p,(e,x)=>e?j(e):r(x)));
(async()=>{
  try{
    await pg.connect();
    const schema=fs.readFileSync(path.join(__dirname,'..','database','postgres.sql'),'utf8');
    await pg.query(schema);
    for(const table of tables){
      const rows=await all('SELECT * FROM '+table);
      if(!rows.length){console.log(table+': 0 rows');continue}
      const columns=Object.keys(rows[0]),quoted=columns.map(c=>'"'+c+'"').join(','),placeholders=columns.map((_,i)=>'$'+(i+1)).join(',');
      for(const row of rows)await pg.query('INSERT INTO '+table+' ('+quoted+') VALUES ('+placeholders+') ON CONFLICT DO NOTHING',columns.map(c=>row[c]));
      console.log(table+': '+rows.length+' rows');
    }
    for(const table of tables){
      if(table==='notices')continue;
      try{
        const max=await pg.query('SELECT MAX(id) AS max FROM '+table);
        if(max.rows[0].max!==null)await pg.query("SELECT setval(pg_get_serial_sequence($1,'id'),$2,true)",[table,Number(max.rows[0].max)]);
      }catch{}
    }
    console.log('SQLite to PostgreSQL migration completed');
  }catch(e){console.error(e);process.exitCode=1}
  finally{await pg.end().catch(()=>{});sqlite.close()}
})();