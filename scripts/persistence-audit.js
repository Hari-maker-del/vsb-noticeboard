const {Client}=require('pg');

const requiredTables=['users','classes','notices','read_receipts','timetable','faculty','events','assignments','materials','exams','attendance','marks','audit_logs','auth_sessions'];

async function main(){
  const databaseUrl=process.env.DATABASE_URL;
  const storage=String(process.env.STORAGE_PROVIDER||'local').toLowerCase();
  const requireS3=String(process.env.REQUIRE_DURABLE_PERSISTENCE||'false').toLowerCase()==='true';
  const result={ok:true,database:{configured:Boolean(databaseUrl),connected:false,tables:[],missing:[]},storage:{provider:storage,configured:storage==='s3'}};

  if(!databaseUrl){
    result.ok=false;
    result.database.error='DATABASE_URL is required for durable PostgreSQL persistence';
  }else{
    const client=new Client({connectionString:databaseUrl,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false},connectionTimeoutMillis:10000});
    try{
      await client.connect();
      result.database.connected=true;
      const rows=await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1)",[requiredTables]);
      result.database.tables=rows.rows.map(x=>x.table_name);
      result.database.missing=requiredTables.filter(x=>!result.database.tables.includes(x));
      if(result.database.missing.length)result.ok=false;
    }catch(e){
      result.ok=false;
      result.database.error=e.message;
    }finally{await client.end().catch(()=>{})}
  }

  if(storage==='s3'){
    const missing=['S3_BUCKET','S3_REGION','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY'].filter(k=>!process.env[k]);
    result.storage.missing=missing;
    if(missing.length){result.ok=false;result.storage.error='Missing S3 configuration: '+missing.join(', ')}
  }else{
    result.storage.warning='Object storage is not durable on Render when STORAGE_PROVIDER is local.';
    if(requireS3){result.ok=false;result.storage.error='REQUIRE_DURABLE_PERSISTENCE=true requires STORAGE_PROVIDER=s3'}
  }

  console.log(JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=1;
}
main().catch(e=>{console.error(JSON.stringify({ok:false,error:e.message}));process.exit(1)});
