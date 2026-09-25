const assert=require('assert');const {spawn}=require('child_process');const path=require('path');const os=require('os');
const base='http://127.0.0.1:5123';
const env={...process.env,NODE_ENV:'test',PORT:'5123',SQLITE_PATH:path.join(os.tmpdir(),'vsb-noticeboard-ci-'+process.pid+'.sqlite'),ADMIN_EMAIL:'ci-admin@example.com',ADMIN_PASSWORD:'ci-password-123',JWT_SECRET:'ci-test-secret-which-is-long-enough-123456',RETURN_LEGACY_TOKEN:'false'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const jar={};
const cookieHeader=()=>Object.entries(jar).map(([k,v])=>k+'='+v).join('; ');
const rememberCookies=headers=>{const lines=headers.getSetCookie?headers.getSetCookie():((headers.get('set-cookie')||'').split(/,(?=[^;,]+=)/));for(const line of lines){const pair=line.split(';')[0];const i=pair.indexOf('=');if(i>0)jar[pair.slice(0,i)]=pair.slice(i+1)}};
async function call(url,options={}){const {skipCsrf=false,...init}=options;init.headers={...(init.headers||{})};const method=String(init.method||'GET').toUpperCase();if(Object.keys(jar).length)init.headers.Cookie=cookieHeader();if(!skipCsrf&&!['GET','HEAD','OPTIONS'].includes(method)&&jar.vsb_csrf)init.headers['X-CSRF-Token']=decodeURIComponent(jar.vsb_csrf);const r=await fetch(base+url,init);rememberCookies(r.headers);let body={};try{body=await r.json()}catch{}return {status:r.status,body,headers:r.headers}};
(async()=>{const child=spawn(process.execPath,['server.js'],{env,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);try{
for(let i=0;i<60;i++){await sleep(100);if(output.includes('VSB Noticeboard on 5123'))break}
assert(output.includes('VSB Noticeboard on 5123'),'server did not start: '+output);

let r=await call('/api/health/live');assert.strictEqual(r.status,200);assert.strictEqual(r.body.ok,true);
r=await call('/api/health');assert.strictEqual(r.status,200);assert.strictEqual(r.body.ok,true);assert(r.body.persistence&&r.body.persistence.database);
r=await call('/api/health/ready');assert([200,503].includes(r.status));assert.strictEqual(typeof r.body.ok,'boolean');

const page=await fetch(base+'/');assert.strictEqual(page.status,200);const csp=page.headers.get('content-security-policy')||'';assert(csp.includes("script-src 'self'"),'strict script CSP missing');assert(csp.includes("object-src 'none'"),'object-src CSP missing');const html=await page.text();assert(html.includes('/bootstrap.js'));assert(!html.includes('Promise.all([fetch(\'/api/classes\')'));

r=await call('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'ci-admin@example.com',password:'ci-password-123'})});assert.strictEqual(r.status,200);assert(r.body.user);assert(!r.body.token);assert(jar.vsb_session);assert(jar.vsb_csrf);

r=await call('/api/me');assert.strictEqual(r.status,200);assert.strictEqual(r.body.user.role,'ADMIN');r=await call('/api/auth/sessions');assert.strictEqual(r.status,200);assert.strictEqual(r.body.items.length,1);assert.strictEqual(r.body.items[0].current,true);
r=await call('/api/notices',{method:'POST',skipCsrf:true,headers:{'content-type':'application/json'},body:JSON.stringify({title:'CSRF blocked notice',content:'Should not be created',category:'General',priority:'low'})});assert.strictEqual(r.status,403);

r=await call('/api/notices',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:'CI integration notice',content:'Automated API test',category:'General',priority:'low'})});assert.strictEqual(r.status,201);assert(r.body.id);

r=await call('/api/assignments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:'CI Assignment',subject:'Testing',due_at:new Date(Date.now()+86400000).toISOString()})});assert.strictEqual(r.status,201);const assignmentId=r.body.id;
r=await call('/api/assignments/'+assignmentId,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({title:'CI Assignment Updated',subject:'Testing',due_at:new Date(Date.now()+172800000).toISOString()})});assert.strictEqual(r.status,200);
r=await call('/api/assignments/'+assignmentId,{method:'DELETE'});assert.strictEqual(r.status,200);

r=await call('/api/profile/password',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({current_password:'ci-password-123',new_password:'ci-password-1234'})});assert.strictEqual(r.status,200);assert.strictEqual(r.body.relogin_required,true);assert(!jar.vsb_session&&!jar.vsb_csrf);
r=await call('/api/me');assert.strictEqual(r.status,401);

r=await call('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'ci-admin@example.com',password:'ci-password-1234'})});assert.strictEqual(r.status,200);assert(jar.vsb_session&&jar.vsb_csrf);r=await call('/api/auth/sessions/revoke-others',{method:'POST'});assert.strictEqual(r.status,200);assert.strictEqual(r.body.success,true);assert.strictEqual(r.body.revoked,0);

r=await call('/api/classes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:'IT-Z',name:'Integration Test Class'})});assert.strictEqual(r.status,201);const classId=r.body.id;
r=await call('/api/classes/'+classId,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({code:'IT-Z',name:'Integration Test Class Updated'})});assert.strictEqual(r.status,200);

r=await call('/api/users',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'CI Student',email:'ci-student@example.com',password:'student-password-123',role:'STUDENT',class_code:'IT-Z',roll_no:'CI001',semester:'4'})});assert.strictEqual(r.status,201);const studentId=r.body.id;
r=await call('/api/users/'+studentId+'/password-reset',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({new_password:'student-reset-123'})});assert.strictEqual(r.status,200);assert.strictEqual(r.body.success,true);r=await call('/api/users/'+studentId+'/revoke-sessions',{method:'POST'});assert.strictEqual(r.status,200);assert.strictEqual(r.body.success,true);assert.strictEqual(typeof r.body.revoked,'number');

r=await call('/api/attendance',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({student_id:studentId,subject:'Testing',date:'2026-09-25',present:true})});assert.strictEqual(r.status,201);const attendanceId=r.body.id;
r=await call('/api/attendance/'+attendanceId,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({student_id:studentId,subject:'Testing',date:'2026-09-25',present:false})});assert.strictEqual(r.status,200);
r=await call('/api/attendance/'+attendanceId,{method:'DELETE'});assert.strictEqual(r.status,200);

r=await call('/api/marks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({student_id:studentId,subject:'Testing',marks:88,max_marks:100,exam_type:'Internal'})});assert.strictEqual(r.status,201);const marksId=r.body.id;
r=await call('/api/marks/'+marksId,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({student_id:studentId,subject:'Testing',marks:90,max_marks:100,exam_type:'Internal'})});assert.strictEqual(r.status,200);
r=await call('/api/marks/'+marksId,{method:'DELETE'});assert.strictEqual(r.status,200);

r=await call('/api/classes/'+classId,{method:'DELETE'});assert.strictEqual(r.status,200);
r=await call('/api/admin/audit-logs?limit=10&entity=user');assert.strictEqual(r.status,200);assert(Array.isArray(r.body.items));assert(r.body.items.some(x=>x.action==='ADMIN_PASSWORD_RESET'));r=await call('/api/admin/audit-logs?limit=10&search=ci-admin');assert.strictEqual(r.status,200);r=await call('/api/admin/stats');assert.strictEqual(r.status,200,JSON.stringify(r.body));

r=await call('/api/auth/logout',{method:'POST'});assert.strictEqual(r.status,200);console.log('V10 audit and session-control integration tests passed');
}catch(e){console.error(e);console.error(output);process.exitCode=1}finally{child.kill('SIGTERM')}})().catch(e=>{console.error(e);process.exitCode=1});