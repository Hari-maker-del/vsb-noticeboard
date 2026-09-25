const assert=require('assert');
const fs=require('fs');
const {initDb,get}=require('../database');
(async()=>{
  await initDb();
  const classes=await get('SELECT COUNT(*) count FROM classes');
  assert(Number(classes.count)>=3);
  for(const name of ['users','classes','notices','read_receipts','timetable','faculty','events','assignments','materials','exams','attendance','marks','audit_logs','auth_sessions']){
    const row=await get("SELECT name FROM sqlite_master WHERE type='table' AND name=?",[name]);
    assert(row,'Missing table: '+name)
  }
  const app=fs.readFileSync('public/app.js','utf8');
  assert(app.includes('async function formModal'),'V11 modal form helper missing');
  assert(app.includes('async function confirmModal'),'V11 confirmation modal helper missing');
  assert(!/prompts*(/.test(app),'Legacy browser prompt() remains in admin UI');
  assert(!/confirms*(/.test(app),'Legacy browser confirm() remains in admin UI');
  console.log('Smoke tests passed');
  process.exit(0)
})().catch(e=>{console.error(e);process.exit(1)});