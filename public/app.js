/* public/app.js — polling-enabled noticeboard frontend */
const apiRoot = '/api/notices';
const POLL_INTERVAL_MS = 5000; // change this value to adjust refresh frequency

let lastFetchedAt = null;
let pollingHandle = null;

async function fetchNotices(){
  const r = await fetch(apiRoot);
  if (!r.ok) throw new Error('Failed to fetch');
  return r.json();
}

function render(notices){
  const root = document.getElementById('list');
  root.innerHTML = '';

  // last updated
  const meta = document.getElementById('lastUpdated');
  if (lastFetchedAt) meta.textContent = 'Last updated: ' + new Date(lastFetchedAt).toLocaleTimeString();
  else meta.textContent = '';

  if (!notices || notices.length === 0) {
    root.innerHTML = '<p>No notices.</p>';
    return;
  }
  notices.slice().reverse().forEach(n => {
    const el = document.createElement('div');
    el.className = 'notice';
    el.innerHTML = `
      <strong>${escapeHtml(n.title)}</strong>
      <div class="meta">${new Date(n.createdAtISO || n.createdAt).toLocaleString()} — duration: ${n.duration}s</div>
      <p>${escapeHtml(n.content)}</p>
      <button data-id="${n.id}" class="delBtn">Delete</button>
    `;
    root.appendChild(el);
  });

  // attach delete handlers
  document.querySelectorAll('.delBtn').forEach(btn => {
    btn.removeEventListener('click', onDeleteClick);
    btn.addEventListener('click', onDeleteClick);
  });
}

function onDeleteClick(ev) {
  const btn = ev.currentTarget;
  const id = btn.dataset.id;
  if (!confirm('Delete this notice?')) return;
  btn.disabled = true;
  fetch(`${apiRoot}/${id}`, { method: 'DELETE' })
    .then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(()=>({error: res.status}));
        alert('Error: ' + (err.error || res.status));
      }
    })
    .catch(e => alert('Failed to delete: ' + e.message))
    .finally(() => {
      btn.disabled = false;
      load(); // refresh after DELETE
    });
}

function escapeHtml(s = '') {
  return (''+s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

async function load(){
  try {
    const data = await fetchNotices();
    lastFetchedAt = Date.now();
    render(data);
  } catch (e){
    document.getElementById('list').innerText = 'Failed to load notices: ' + e.message;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Add last-updated element if missing
  if (!document.getElementById('lastUpdated')) {
    const header = document.querySelector('header') || document.body;
    const el = document.createElement('div');
    el.id = 'lastUpdated';
    el.style.fontSize = '0.9em';
    el.style.color = '#666';
    el.style.marginTop = '6px';
    header.appendChild(el);
  }

  document.getElementById('createForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const duration = Number(document.getElementById('duration').value);

    try {
      const res = await fetch(apiRoot, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ title, content, duration })
      });
      if (!res.ok) {
        const err = await res.json();
        alert('Error: ' + (err.error || res.status));
        return;
      }
      document.getElementById('title').value = '';
      document.getElementById('content').value = '';
      document.getElementById('duration').value = '';
      load(); // immediate refresh after create
    } catch (e) {
      alert('Failed to create: ' + e.message);
    }
  });

  document.getElementById('refreshBtn').addEventListener('click', load);
  document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    document.getElementById('duration').value = '';
  });

 