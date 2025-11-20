/**
 * index.js - Noticeboard backend (file-persistence)
 * Replace any existing broken file with this working server.
 */
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- ADMIN PASSWORD PROTECTION (simple) ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '3551';
app.use((req, res, next) => {
  // protect only POST, PUT, DELETE on /api/notices
  if (['POST','PUT','DELETE'].includes(req.method) && req.path.startsWith('/api/notices')) {
    // check header first, then query param as fallback
    const pass = req.get('x-admin-password') || req.query.admin_password || (req.body && req.body.admin_password);
    if (!pass || pass !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // optional: strip admin_password from body so it doesn't get saved
    if (req.body && req.body.admin_password) delete req.body.admin_password;
  }
  next();
});
// --- end admin middleware ---

const DB_PATH = path.join(__dirname, 'db.json');

async function readDB(){
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeDB(data){
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/notices', async (req, res) => {
  try {
    const notices = await readDB();
    res.json(notices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read DB' });
  }
});

app.get('/api/notices/:id', async (req, res) => {
  try {
    const notices = await readDB();
    const n = notices.find(x => x.id === req.params.id);
    if (!n) return res.status(404).json({ error: 'Not found' });
    res.json(n);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read DB' });
  }
});

app.post('/api/notices', async (req, res) => {
  try {
    const { title, content, duration } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'content is required' });
    }
    const durNum = Number(duration);
    if (Number.isNaN(durNum) || durNum <= 0) {
      return res.status(400).json({ error: 'duration must be a positive number' });
    }

    const nowMs = Date.now();
    const notice = {
      id: uuidv4(),
      title: title.trim(),
      content: content.trim(),
      duration: durNum,
      createdAt: nowMs,
      createdAtISO: new Date(nowMs).toISOString()
    };

    const notices = await readDB();
    notices.push(notice);
    await writeDB(notices);

    res.status(201).json(notice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create notice' });
  }
});

app.delete('/api/notices/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let notices = await readDB();
    const beforeLen = notices.length;
    notices = notices.filter(n => n.id !== id);
    if (notices.length === beforeLen) {
      return res.status(404).json({ error: 'Not found' });
    }
    await writeDB(notices);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete notice' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Noticeboard API running on http://localhost:${port}`);
});
