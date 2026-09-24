const fs=require('fs'),path=require('path'),crypto=require('crypto');
const localDir=process.env.UPLOAD_DIR||path.join(__dirname,'public','uploads');
const provider=(process.env.STORAGE_PROVIDER||'local').toLowerCase();
let s3=null;
if(provider==='s3'){
  const {S3Client,PutObjectCommand,GetObjectCommand}=require('@aws-sdk/client-s3');
  s3=new S3Client({region:process.env.S3_REGION||'us-east-1',endpoint:process.env.S3_ENDPOINT||undefined,forcePathStyle:process.env.S3_FORCE_PATH_STYLE==='true',credentials:process.env.S3_ACCESS_KEY_ID?{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY||''}:undefined});
}
async function getUploadUrl(key){if(provider==='s3'){if(!process.env.S3_BUCKET)throw new Error('S3_BUCKET is required when STORAGE_PROVIDER=s3');const {getSignedUrl}=require('@aws-sdk/s3-request-presigner');return getSignedUrl(s3,new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:key}),{expiresIn:900});}const safe=path.resolve(localDir,key);if(!safe.startsWith(path.resolve(localDir)+path.sep))throw new Error('Invalid upload key');return '/uploads/'+encodeURIComponent(path.basename(safe));}\nasync function saveUpload(file){
  const ext=path.extname(file.originalname).toLowerCase(),key=`uploads/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}${ext}`;
  if(provider==='s3'){
    if(!process.env.S3_BUCKET)throw new Error('S3_BUCKET is required when STORAGE_PROVIDER=s3');
    await s3.send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,Body:file.buffer,ContentType:file.mimetype,Metadata:{originalname:file.originalname}}));
    const base=(process.env.S3_PUBLIC_BASE_URL||'').replace(/\/$/,'');
    return {url:base?base+'/'+key:`s3://${process.env.S3_BUCKET}/${key}`,key,provider:'s3'};
  }
  fs.mkdirSync(localDir,{recursive:true});const filename=crypto.randomUUID()+ext,full=path.join(localDir,filename);
  fs.writeFileSync(full,file.buffer);return {url:'/uploads/'+filename,key:filename,provider:'local'};
}
module.exports={saveUpload,getUploadUrl,provider};
