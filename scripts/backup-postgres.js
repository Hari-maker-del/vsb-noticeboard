const fs=require('fs');
const path=require('path');
const child=require('child_process');
const {S3Client,PutObjectCommand,ListObjectsV2Command,DeleteObjectsCommand}=require('@aws-sdk/client-s3');

const now=new Date();
const stamp=now.toISOString().replace(/[:.]/g,'-');
const backupDir=process.env.BACKUP_DIR||path.join(process.cwd(),'backups');
const retentionDays=Math.max(1,Number(process.env.BACKUP_RETENTION_DAYS||14));
const keepLocal=String(process.env.KEEP_LOCAL_BACKUP||'false').toLowerCase()==='true';

function isOld(date){return (now-new Date(date))>(retentionDays*86400000)}
async function uploadS3(file){
  if(!process.env.S3_BUCKET)return null;
  const client=new S3Client({
    region:process.env.S3_REGION,
    endpoint:process.env.S3_ENDPOINT||undefined,
    forcePathStyle:String(process.env.S3_FORCE_PATH_STYLE||'false').toLowerCase()==='true',
    credentials:process.env.S3_ACCESS_KEY_ID&&process.env.S3_SECRET_ACCESS_KEY?{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}:undefined
  });
  const prefix=(process.env.BACKUP_S3_PREFIX||'vsb-noticeboard/backups').replace(/\/$/,'')+'/'
  const key=prefix+path.basename(file);
  await client.send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,Body:fs.createReadStream(file),ContentType:'application/sql'}));
  const listed=await client.send(new ListObjectsV2Command({Bucket:process.env.S3_BUCKET,Prefix:prefix}));
  const old=(listed.Contents||[]).filter(x=>x.Key!==key&&x.LastModified&&isOld(x.LastModified));
  if(old.length)await client.send(new DeleteObjectsCommand({Bucket:process.env.S3_BUCKET,Delete:{Objects:old.map(x=>({Key:x.Key}))}}));
  return key;
}

(async()=>{
  if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required for PostgreSQL backup');
  fs.mkdirSync(backupDir,{recursive:true});
  const out=process.env.BACKUP_FILE||path.join(backupDir,'vsb-'+stamp+'.sql');
  const result=child.spawnSync('pg_dump',['--no-owner','--no-privileges',process.env.DATABASE_URL,'-f',out],{stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error('pg_dump failed with exit code '+result.status);
  const s3Key=await uploadS3(out);
  const stat=fs.statSync(out);
  console.log(JSON.stringify({ok:true,backup_file:out,bytes:stat.size,retention_days:retentionDays,durable_copy:s3Key?'s3':'local-only',s3_key:s3Key||null,warning:s3Key?null:'No S3_BUCKET configured; local backup is not durable on ephemeral hosts.',timestamp:now.toISOString()}));
  if(!keepLocal&&s3Key)fs.rmSync(out,{force:true});
})().catch(e=>{console.error(JSON.stringify({ok:false,error:e.message,timestamp:new Date().toISOString()}));process.exit(1)});