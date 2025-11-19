require('dotenv').config();
});
});


// GET placement stats
app.get('/api/placement', (req, res) => {
const row = db.prepare('SELECT placement_rate, highest_package, companies_visited FROM placement_stats LIMIT 1').get();
res.json(row || { placement_rate: 0, highest_package: 0, companies_visited: 0 });
});


/* ----------------- Admin / Protected Endpoints ----------------- */


// Login
app.post('/api/auth/login', (req, res) => {
const { email, password } = req.body;
if (!email || !password) return res.status(400).json({ message: 'Missing fields' });


const admin = db.prepare('SELECT id, email, password_hash FROM admins WHERE email = ?').get(email);
if (!admin) return res.status(401).json({ message: 'Invalid credentials' });


bcrypt.compare(password, admin.password_hash)
.then(match => {
if (!match) return res.status(401).json({ message: 'Invalid credentials' });
const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '8h' });
res.json({ token });
})
.catch(err => {
console.error(err);
res.status(500).json({ message: 'Server error' });
});
});


// Update announcements
app.put('/api/admin/classes/:code/announcements', authenticateToken, (req, res) => {
const code = req.params.code;
const list = req.body.announcements;
if (!Array.isArray(list)) return res.status(400).json({ message: 'announcements must be array' });


const del = db.prepare('DELETE FROM announcements WHERE class_code = ?');
del.run(code);


const insert = db.prepare('INSERT INTO announcements (class_code, title, content, priority, icon, time, "order") VALUES (?, ?, ?, ?, ?, ?, ?)');
const insertMany = db.transaction((items) => {
items.forEach((a, i) => {
insert.run(code, a.title || '', a.content || '', a.priority || 'low', a.icon || 'fa-info-circle', a.time || '', i);
});
});


insertMany(list);
res.json({ message: 'Saved' });
});


// Update placement stats
app.put('/api/admin/placement', authenticateToken, (req, res) => {
const { placement_rate, highest_package, companies_visited } = req.body;
const row = db.prepare('SELECT id FROM placement_stats LIMIT 1').get();
if (row) {
db.prepare('UPDATE placement_stats SET placement_rate = ?, highest_package = ?, companies_visited = ? WHERE id = ?')
.run(placement_rate || 0, highest_package || 0, companies_visited || 0, row.id);
} else {
db.prepare('INSERT INTO placement_stats (placement_rate, highest_package, companies_visited) VALUES (?, ?, ?)')
.run(placement_rate || 0, highest_package || 0, companies_visited || 0);
}
res.json({ message: 'Saved' });
});


// Update performance
app.put('/api/admin/classes/:code/performance', authenticateToken, (req, res) => {
const code = req.params.code;
const { values } = req.body;
if (!Array.isArray(values)) return res.status(400).json({ message: 'values must be array' });


db.prepare('DELETE FROM performance WHERE class_code = ?').run(code);
const insert = db.prepare('INSERT INTO performance (class_code, metric_index, value) VALUES (?, ?, ?)');
const insTx = db.transaction((vals) => {
vals.forEach((v, i) => insert.run(code, i, v));
});
insTx(values);
res.json({ message: 'Saved' });
});


// Serve static frontend if placed into /public
app.use(express.static(path.join(__dirname, 'public')));


app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});