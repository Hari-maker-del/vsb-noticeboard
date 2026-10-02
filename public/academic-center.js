(function(){
const api=(p)=>fetch('/api/'+p,{credentials:'include'}).then(r=>r.ok?r.json():[]);
const arr=x=>Array.isArray(x)?x:(x&&Array.isArray(x.data)?x.data:(x&&Array.isArray(x.items)?x.items:[]));
const date=x=>new Date(x?.date||x?.exam_date||x?.due_date||x?.created_at||0);
const title=x=>x?.title||x?.subject||x?.name||'Academic item';
const fmt=d=>d&&d.getTime()?d.toLocaleDateString(undefined,{day:'2-digit',month:'short'}):'—';
async function load(){
 const [ex,as,at,mk]=await Promise.all([api('exams'),api('assignments'),api('attendance'),api('marks')]);
 const exams=arr(ex).sort((a,b)=>date(a)-date(b)), assignments=arr(as).sort((a,b)=>date(a)-date(b));
 const attendance=arr(at).map(x=>Number(x.percentage??x.attendance_percentage??x.attendance)).filter(Number.isFinite);
 const marks=arr(mk).map(x=>Number(x.percentage??x.score??x.marks??x.average)).filter(Number.isFinite);
 const next=exams.find(x=>date(x)>=new Date())||exams[0];
 const avg=attendance.length?attendance.reduce((a,b)=>a+b,0)/attendance.length:null;
 const score=marks.length?marks.reduce((a,b)=>a+b,0)/marks.length:null;
 const e=document.getElementById('next-exam'),em=document.getElementById('exam-meta'),av=document.getElementById('attendance-value'),am=document.getElementById('attendance-meta'),ac=document.getElementById('assignment-value'),mv=document.getElementById('marks-value');
 if(!e)return;
 e.textContent=next?title(next):'No exams'; em.textContent=next?fmt(date(next))+(next.room?' • '+next.room:''):'No upcoming exam';
 av.textContent=avg==null?'—':Math.round(avg)+'%'; am.textContent=avg==null?'No attendance data':(avg<75?'Needs attention':'On track');
 const pending=assignments.filter(x=>!['completed','submitted','done'].includes(String(x.status||'').toLowerCase())); ac.textContent=pending.length; mv.textContent=score==null?'—':Math.round(score)+'%';
 const examList=document.getElementById('exam-list'),assignmentList=document.getElementById('assignment-list');
 examList.innerHTML=exams.slice(0,6).map(x=>'<div class="academic-item"><div><strong>'+title(x)+'</strong><small>'+(x.room||x.course||'')+'</small></div><span class="academic-date">'+fmt(date(x))+'</span></div>').join('')||'<div class="academic-empty">No upcoming exams.</div>';
 assignmentList.innerHTML=assignments.slice(0,6).map(x=>'<div class="academic-item"><div><strong>'+title(x)+'</strong><small>'+(x.course||x.description||'')+'</small></div><span class="academic-date">'+fmt(date(x))+'</span></div>').join('')||'<div class="academic-empty">No assignments.</div>';
 const perf=document.getElementById('performance-list');
 perf.innerHTML=arr(mk).slice(0,8).map(x=>{const s=Number(x.percentage??x.score??x.marks??x.average);return Number.isFinite(s)?'<div class="perf-row"><div class="perf-label"><span>'+(x.subject||x.course||x.name||'Subject')+'</span><b>'+Math.round(s)+'%</b></div><div class="perf-bar"><i style="width:'+Math.max(0,Math.min(100,s))+'%"></i></div></div>':''}).join('')||'<div class="academic-empty">Subject performance will appear when marks are available.</div>';
}
document.addEventListener('DOMContentLoaded',()=>{load();const b=document.getElementById('academic-refresh');if(b)b.onclick=load;});
})();