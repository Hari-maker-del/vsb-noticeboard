const {Client}=require('pg');
const {S3Client,HeadBucketCommand}=require('@aws-sdk/client-s3');

const requiredTables=['users','classes','notices','read_receipts','timetable','faculty','events','assignments','materials','exams','attendance','marks','audit_logs','auth_sessions'];

async function checkS3(){
  const provider=String(process.env.STORAGE_PROVIDER||'local').toLowerCase();
  const result={provider,configured:provider==='s3',reachable:false,missing:[]};
  if(provider!=='s3'){
    result.warning='Object storage is not durable on Render when STORAGE_PROVIDER is local.';
    return result;
  }
  result.missing=['S3_BUCKET','S3_REGION','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY'].filter(k=>!process.env[k]);
  if(result.missing.length){
    result.error='Missing S3 configuration: '+result.missing.join(', ');
    return result;
  }
  const client=new S3Client({
    region:process.env.S3_REGION,
    endpoint:process.env.S3_ENDPOINT||undefined,
    forcePathStyle:process.env.S3_FORCE_PATH_STYLE==='true',
    credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}
  });
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),5000);
  try{
    await client.send(new HeadBucketCommand({Bucket:process.env.S3_BUCKET}),{abortSignal:controller.signal});
    result.reachable=true;
  }catch(e){
    result.error=e?.name==='AbortError'?'S3 storage check timed out':'S3 storage connectivity check failed';
  }finally{
    clearTimeout(timeout);
  }
  return result;
}

async function main(){
  const databaseUrl=process.env.DATABASE_URL;
  const requireS3=String(process.env.REQUIRE_DURABLE_PERSISTENCE||'false').toLowerCase()==='true';
  const result={ok:true,database:{configured:Boolean(databaseUrl),connected:false,tables:[],missing:[]},storage:null};

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

  result.storage=await checkS3();
  if(result.storage.configured&&!result.storage.reachable)result.ok=false;
  if(!result.storage.configured&&requireS3)result.ok=false;

  console.log(JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=1;
}
main().catch(e=>{console.error(JSON.stringify({ok:false,error:e.message}));process.exit(1)});
