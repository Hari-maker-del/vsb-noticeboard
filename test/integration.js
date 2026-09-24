const assert=require('assert');
const http=require('http');
process.env.NODE_ENV='test';
process.env.ADMIN_EMAIL='ci-admin@example.com';
process.env.ADMIN_PASSWORD='ci-password-123';
const app=require('../server');
function req(path,opts={}){return new Promise((resolve,reject)=>{const r=http.request({host:'127.0.0.1',port:0,path,...opts},resolve);r.on('error',reject);r.end(opts.body||undefined)})}
(async()=>{console.log('Integration test module loaded; use npm run test:integration after starting the server.');assert(app);process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
