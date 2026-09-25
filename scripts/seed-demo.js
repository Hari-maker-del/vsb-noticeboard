require('dotenv').config();
const bcrypt=require('bcryptjs');
const {initDb,get,run,closeDb}=require('../database');
const uuid=require('uuid');

const iso=d=>new Date(d).toISOString();
const plusDays=n=>iso(Date.now()+n*86400000);

async function ensureClass(code,name){
  if(!await get('SELECT id FROM classes WHERE code=?',[code])) await run('INSERT INTO classes(code,name,department) VALUES(?,?,?)',[code,name,'Information Technology']);
}
async function ensureUser({name,email,password,role,class_code,roll_no,semester}){
  const existing=await get('SELECT id FROM users WHERE email=?',[email]);
  if(existing)return existing.id;
  const r=await run('INSERT INTO users(name,email,password_hash,role,class_code,roll_no,semester,department) VALUES(?,?,?,?,?,?,?,?)',
    [name,email,await bcrypt.hash(password,12),role,class_code||null,roll_no||null,semester||null,'Information Technology']);
  return r.lastID;
}
async function seed(){
  await initDb();
  await ensureClass('IT-A','Information Technology A');
  await ensureClass('IT-B','Information Technology B');
  await ensureClass('IT-C','Information Technology C');

  const admin=await get('SELECT id FROM users WHERE email=?',[(process.env.ADMIN_EMAIL||'admin@example.com').toLowerCase()]);
  const studentIds=[];
  for(const s of [
    {name:'Demo Student A',email:'student.a@vsb-demo.local',password:'DemoStudent@2026!',role:'STUDENT',class_code:'IT-A',roll_no:'IT26A001',semester:'4'},
    {name:'Demo Student B',email:'student.b@vsb-demo.local',password:'DemoStudent@2026!',role:'STUDENT',class_code:'IT-B',roll_no:'IT26B001',semester:'4'},
    {name:'Demo Student C',email:'student.c@vsb-demo.local',password:'DemoStudent@2026!',role:'STUDENT',class_code:'IT-C',roll_no:'IT26C001',semester:'4'}
  ]) studentIds.push(await ensureUser(s));

  for(const f of [
    ['Dr. Meena Krishnan','Database Management Systems','IT Block 201'],
    ['Prof. Aravind Kumar','Computer Networks','IT Block 202'],
    ['Prof. Swetha Raj','Web Technology','IT Block 203']
  ]) if(!await get('SELECT id FROM faculty WHERE name=?',[f[0]])) await run('INSERT INTO faculty(name,department,subject,room,availability) VALUES(?,?,?,?,?)',[f[0],'Information Technology',f[1],f[2],'Monday–Friday']);

  for(const n of [
    ['VSB IT Orientation Update','Welcome to the Information Technology department portal. Check your class timetable and upcoming academic activities.','General','high','IT-A'],
    ['Internal Assessment Schedule','Internal assessment details have been published. Students should verify the examinations page.','Exam','medium','IT-B'],
    ['Placement Cell Registration','Placement registration details are now available for eligible students.','Placement','medium',null]
  ]) if(!await get('SELECT id FROM notices WHERE title=?',[n[0]])) await run('INSERT INTO notices(id,title,content,category,priority,class_code,pinned,created_by) VALUES(?,?,?,?,?,?,?,?)',[uuid.v4(),n[0],n[1],n[2],n[3],n[4],n[3]==='high'?1:0,admin?.id||null]);

  for(const t of [
    ['IT-A','Monday','1','Database Management Systems','Dr. Meena Krishnan','IT-201'],
    ['IT-A','Tuesday','2','Computer Networks','Prof. Aravind Kumar','IT-202'],
    ['IT-A','Wednesday','3','Web Technology','Prof. Swetha Raj','IT-203'],
    ['IT-B','Monday','2','Computer Networks','Prof. Aravind Kumar','IT-202'],
    ['IT-C','Thursday','1','Web Technology','Prof. Swetha Raj','IT-203']
  ]) if(!await get('SELECT id FROM timetable WHERE class_code=? AND day=? AND period=?',[t[0],t[1],t[2]])) await run('INSERT INTO timetable(class_code,day,period,subject,faculty,room) VALUES(?,?,?,?,?,?)',t);

  if(!await get('SELECT id FROM assignments WHERE title=?',['Database Management Systems — Normalization Case Study'])) await run('INSERT INTO assignments(class_code,subject,title,description,due_at,created_by) VALUES(?,?,?,?,?,?)',['IT-A','Database Management Systems','Database Management Systems — Normalization Case Study','Prepare a 3NF normalization example with dependency analysis.',plusDays(4),admin?.id||null]);
  if(!await get('SELECT id FROM materials WHERE title=?',['Computer Networks — OSI Model Quick Notes'])) await run('INSERT INTO materials(class_code,subject,title,description,created_by) VALUES(?,?,?,?,?)',['IT-A','Computer Networks','Computer Networks — OSI Model Quick Notes','Seven-layer reference notes for revision.',admin?.id||null]);

  if(!await get('SELECT id FROM exams WHERE subject=? AND class_code=? AND exam_date>?',['Database Management Systems','IT-A',new Date().toISOString().slice(0,10)])) await run('INSERT INTO exams(class_code,exam_type,subject,exam_date,start_time,end_time,room,created_by) VALUES(?,?,?,?,?,?,?,?)',['IT-A','Internal','Database Management Systems',plusDays(7).slice(0,10),'10:00','11:30','IT-201',admin?.id||null]);

  for(const studentId of studentIds) for(const subject of ['Database Management Systems','Computer Networks','Web Technology']){
    const date=new Date(Date.now()-Math.floor(Math.random()*5)*86400000).toISOString().slice(0,10);
    if(!await get('SELECT id FROM attendance WHERE student_id=? AND subject=? AND date=?',[studentId,subject,date])) await run('INSERT INTO attendance(student_id,subject,date,status,remarks,marked_by) VALUES(?,?,?,?,?,?)',[studentId,subject,date,subject==='Web Technology'?'Absent':'Present',null,admin?.id||null]);
    if(!await get('SELECT id FROM marks WHERE student_id=? AND subject=?',[studentId,subject])) await run('INSERT INTO marks(student_id,subject,exam_type,marks,max_marks,exam_date,remarks,marked_by) VALUES(?,?,?,?,?,?,?,?)',[studentId,subject,'Internal',subject==='Web Technology'?72:82,100,new Date().toISOString().slice(0,10),null,admin?.id||null]);
  }
  console.log('V6 demo data seeded. Demo students use the passwords defined in this script; change them after testing.');
}
seed().catch(err=>{console.error(err);process.exitCode=1}).finally(()=>setTimeout(()=>{try{closeDb()}catch{}},300));