(()=>{
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const api=async(url)=>{const r=await fetch(url,{credentials:'same-origin'});if(!r.ok)throw Error('Request failed');try{return await r.json()}catch{return []}};
  const arr=d=>Array.isArray(d)?d:(d?.items||d?.data||d?.results||[]);
  const firstDate=x=>new Date(x?.due_date||x?.deadline||x?.event_date||x?.exam_date||x?.date||x?.created_at||'');
  const fmt=d=>isNaN(d)?'—':d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  const days=d=>{const n=firstDate(d);return isNaN(n)?999:Math.ceil((n-new Date())/86400000)};
  async function load(){
    if(window.currentView&&window.currentView!=='student-home-overview')return;
    const main=document.querySelector('#appMain'); if(!main||document.querySelector('#smartCampusBrief'))return;
    let notices=[],assignments=[],exams=[],attendance=[],events=[];
    try{[notices,assignments,exams,attendance,events]=await Promise.all([
      api('/api/notices?class_code='+encodeURIComponent(window.currentClass||'IT-A')+'&limit=100').then(arr).catch(()=>[]),
      api('/api/assignments').then(arr).catch(()=>[]),api('/api/exams').then(arr).catch(()=>[]),api('/api/attendance').then(arr).catch(()=>[]),api('/api/events').then(arr).catch(()=>[])
    ]);}catch{}
    const urgent=notices.filter(n=>n.priority==='high'||n.pinned).length;
    const unread=notices.filter(n=>!n.is_read).length;
    const upcomingExams=exams.filter(e=>days(e)<30).sort((a,b)=>firstDate(a)-firstDate(b));
    const upcomingAssignments=assignments.filter(a=>days(a)>=0&&days(a)<14).sort((a,b)=>firstDate(a)-firstDate(b));
    const nextExam=upcomingExams[0], nextAssignment=upcomingAssignments[0], nextEvent=events.filter(e=>days(e)>=0).sort((a,b)=>firstDate(a)-firstDate(b))[0];
    let attendancePct=null;
    if(attendance.length){const nums=attendance.map(x=>Number(x.percentage??x.attendance_percentage??x.percent)).filter(Number.isFinite);if(nums.length)attendancePct=Math.round(nums.reduce((a,b)=>a+b,0)/nums.length)}
    const el=document.createElement('section');el.id='smartCampusBrief';el.className='mb-6';
    el.innerHTML=`<div class="rounded-2xl border border-yellow-200 bg-gradient-to-br from-white to-yellow-50/70 p-5 md:p-6 shadow-sm">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></span><span class="text-xs font-extrabold tracking-[.16em] uppercase text-yellow-700">Smart Campus Brief</span></div><h2 class="mt-2 text-xl md:text-2xl font-extrabold text-slate-900">What needs your attention today?</h2><p class="mt-1 text-sm text-slate-500">A quick view of the academic updates that matter to you.</p></div>
        <button id="smartCampusRefresh" class="rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-yellow-300 transition">Refresh brief</button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
        <div class="rounded-xl bg-white border p-4"><div class="text-xs text-slate-500">Urgent notices</div><div class="mt-1 text-2xl font-extrabold ${urgent?'text-red-600':'text-slate-900'}">${urgent}</div></div>
        <div class="rounded-xl bg-white border p-4"><div class="text-xs text-slate-500">Unread updates</div><div class="mt-1 text-2xl font-extrabold text-slate-900">${unread}</div></div>
        <div class="rounded-xl bg-white border p-4"><div class="text-xs text-slate-500">Next exam</div><div class="mt-1 text-sm font-extrabold text-slate-900">${nextExam?esc(nextExam.subject||nextExam.title||'Exam'):'None'}</div><div class="text-xs text-slate-500">${nextExam?fmt(firstDate(nextExam)):'No upcoming exam'}</div></div>
        <div class="rounded-xl bg-white border p-4"><div class="text-xs text-slate-500">Next deadline</div><div class="mt-1 text-sm font-extrabold text-slate-900">${nextAssignment?esc(nextAssignment.title||nextAssignment.subject||'Assignment'):'None'}</div><div class="text-xs text-slate-500">${nextAssignment?fmt(firstDate(nextAssignment)):'No nearby deadline'}</div></div>
        <div class="rounded-xl bg-white border p-4"><div class="text-xs text-slate-500">Attendance</div><div class="mt-1 text-2xl font-extrabold ${attendancePct!==null&&attendancePct<75?'text-red-600':'text-slate-900'}">${attendancePct!==null?attendancePct+'%':'—'}</div></div>
      </div>
      <div class="mt-4 flex flex-wrap gap-2 text-sm">
        ${nextEvent?`<span class="rounded-full bg-yellow-100 px-3 py-1.5 font-semibold text-yellow-800">📅 Next event: ${esc(nextEvent.title)} • ${fmt(firstDate(nextEvent))}</span>`:''}
        ${urgent?'<span class="rounded-full bg-red-50 px-3 py-1.5 font-semibold text-red-700">⚠ '+urgent+' priority item'+(urgent>1?'s':'')+' need attention</span>':''}
        ${!urgent&&!unread?'<span class="rounded-full bg-green-50 px-3 py-1.5 font-semibold text-green-700">✓ You are all caught up</span>':''}
      </div>
    </div>`;
    const target=main.firstElementChild;main.insertBefore(el,target||null);
    document.querySelector('#smartCampusRefresh')?.addEventListener('click',()=>{el.remove();load()});
  }
  window.addEventListener('load',()=>setTimeout(load,700));
  const originalNav=window.nav;
  if(typeof originalNav==='function')window.nav=async function(v){const r=await originalNav.apply(this,arguments);if(v==='student-home-overview')setTimeout(load,250);return r};
})();
