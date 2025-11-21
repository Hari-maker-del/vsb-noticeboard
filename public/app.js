/* public/app.js - improved noticeboard client
   - polling
   - add, edit, delete
   - simple client-side password gate (for convenience only)
*/

const apiRoot = '/api/notices';
const POLL_INTERVAL_MS = 5000;

let lastFetchedAt = null;
let pollingHandle = null;
let noticesCache = [];

// Small helpers
function el(id){ return document.getElementById(id); }
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

async function fetchNotices(){
  const r = await fetch(apiRoot);
  if (!r.ok) throw new Error('Failed to fetch notices: ' + r.status);
  const json = await r.json();
  lastFetchedAt = Date.now();
  noticesCache = json;
  return json;
}

function render(notices){
  const root = el('list');
  if (!root) return;
  root.innerHTML = '';

  const meta = el('lastUpdated');
  if (lastFetchedAt && meta) meta.textContent = 'Last updated: ' + new Date(lastFetchedAt).toLocaleTimeString();
  else if (meta) meta.textContent = '';

  if (!notices || notices.length === 0) {
    root.innerHTML = '<p>No notices.</p>';
    return;
  }

  // newest first
  notices.slice().reverse().forEach(n => {
    const card = document.createElement('div');
    card.className = 'notice card';
    card.style = 'padding:12px;margin:10px 0;border-radius:8px;background:#0b1220;color:#e6eef8;border:1px solid rgba(255,255,255,0.04);';

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="flex:1">
          <strong>${escapeHtml(n.title)}</strong>
          <div style="font-size:12px;color:#b9c6d8">${new Date(n.createdAtISO || n.createdAt).toLocaleString()} — duration: ${n.duration}s</div>
        </div>
        <div style="margin-left:12px">
          <button class="editBtn" data-id="${n.id}" style="margin-right:6px">Edit</button>
          <button class="delBtn"  data-id="${n.id}">Delete</button>
        </div>
      </div>
      <p style="margin-top:8px">${escapeHtml(n.content)}</p>
    `;
    root.appendChild(card);
  });

  // handlers
  document.querySelectorAll('.delBtn').forEach(btn=>{
    btn.onclick = onDeleteClick;
  });
  document.querySelectorAll('.editBtn').forEach(btn=>{
    btn.onclick = onEditClick;
  });
}

function onDeleteClick(ev){
  const id = ev.currentTarget.dataset.id;
  if (!confirm('Delete this notice?')) return;
  ev.currentTarget.disabled = true;
  fetch(`${apiRoot}/${id}`, { method:'DELETE' })
    .then(r=>{
      if (!r.ok) throw new Error('Delete failed: ' + r.status);
      return fetchNotices().then(render);
    })
    .catch(e=> alert('Delete error: ' + e.message))
    .finally(()=> ev.currentTarget.disabled = false);
}

function onEditClick(ev){
  const id = ev.currentTarget.dataset.id;
  const n = noticesCache.find(x=>x.id===id);
  if (!n) return alert('Notice not found');
  // password prompt (simple)
  const pw = prompt('Enter admin password to edit:');
  if (pw !== '3551') return alert('Wrong password');
  // fill form (we will use a modal-like small form area)
  el('noticeTitle').value = n.title;
  el('noticeContent').value = n.content;
  el('noticeDuration').value = n.duration;
  el('addBtn').textContent = 'Save changes';
  el('addBtn').dataset.editId = id;
  window.scrollTo({top:0,behavior:'smooth'});
}

function resetAddForm(){
  el('addNoticeForm').reset();
  el('addBtn').textContent = 'Add Notice';
  delete el('addBtn').dataset.editId;
}

document.addEventListener('DOMContentLoaded', ()=> {
  // form submit
  const form = el('addNoticeForm');
  if (form) {
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      const title = el('noticeTitle').value.trim() || 'No title';
      const content = el('noticeContent').value.trim() || '';
      const duration = parseInt(el('noticeDuration').value || '10', 10) || 10;

      // if edit present
      const editId = el('addBtn').dataset.editId;
      // client-side password gate (convenience only)
      const pw = prompt('Enter admin password:');
      if (pw !== '3551') return alert('Wrong password');

      const payload = { title, content, duration };

      try {
        if (editId) {
          const res = await fetch(`${apiRoot}/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error('Edit failed: ' + res.status);
        } else {
          const res = await fetch(apiRoot, {
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error('Add failed: ' + res.status);
        }
        await fetchNotices().then(render);
        resetAddForm();
      } catch(err) {
        alert('Save failed: ' + err.message);
      }
    });
  }

  // initial fetch and start polling
  fetchNotices().then(render).catch(err => {
    console.error('Initial fetch failed', err);
    const root = el('list');
    if (root) root.innerHTML = '<p style="color:#f88">Failed to load notices — open console for details</p>';
  });
  pollingHandle = setInterval(()=> fetchNotices().then(render).catch(()=>{}), POLL_INTERVAL_MS);
});
