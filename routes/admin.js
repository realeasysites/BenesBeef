const express = require('express');
const path = require('path');
const db = require('../db/database');
const auth = require('../lib/auth');

const router = express.Router();
const VIEWS = path.join(__dirname, '..', 'views');

const TABLES = { inquiries: 'inquiries', challengers: 'challengers' };
const STATUSES = ['new', 'contacted', 'booked', 'done'];

function todayET() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

// ---- login ----
router.get('/login', (req, res) => {
  if (auth.isAuthed(req)) return res.redirect('/admin');
  res.sendFile(path.join(VIEWS, 'login.html'));
});

router.get('/login-status', (req, res) => res.json({ enabled: auth.loginEnabled() }));

const attempts = new Map();
router.post('/login', (req, res) => {
  const now = Date.now();
  const list = (attempts.get(req.ip) || []).filter(t => now - t < 15 * 60 * 1000);
  if (list.length >= 10) return res.status(429).json({ ok: false, error: 'Too many attempts. Try again later.' });
  if (!auth.loginEnabled()) return res.status(503).json({ ok: false, error: 'Login is disabled until ADMIN_PASSWORD is set.' });
  if (!auth.checkPassword(req.body && req.body.password)) {
    list.push(now);
    attempts.set(req.ip, list);
    return res.status(401).json({ ok: false, error: 'Wrong password.' });
  }
  attempts.delete(req.ip);
  auth.issue(res, req);
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  auth.clear(res);
  res.json({ ok: true });
});

// ---- everything below requires auth ----
router.use((req, res, next) => {
  if (auth.isAuthed(req)) return next();
  if (req.path.startsWith('/api')) return res.status(401).json({ ok: false, error: 'Not signed in.' });
  res.redirect('/admin/login');
});

router.get('/', (req, res) => res.sendFile(path.join(VIEWS, 'admin.html')));

router.get('/api/:kind', (req, res) => {
  const table = TABLES[req.params.kind];
  if (!table) return res.status(404).json({ ok: false });
  res.json({ ok: true, rows: db.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all() });
});

router.patch('/api/:kind/:id', (req, res) => {
  const table = TABLES[req.params.kind];
  const status = req.body && req.body.status;
  if (!table || !STATUSES.includes(status)) return res.status(400).json({ ok: false });
  db.prepare(`UPDATE ${table} SET status = ? WHERE id = ?`).run(status, Number(req.params.id));
  res.json({ ok: true });
});

router.delete('/api/:kind/:id', (req, res) => {
  const table = TABLES[req.params.kind];
  if (!table) return res.status(404).json({ ok: false });
  const info = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(Number(req.params.id));
  res.json({ ok: info.changes > 0 });
});

// Sold-out switch + announcement banner
router.get('/api/settings/current', (req, res) => {
  const get = k => (db.prepare('SELECT value FROM settings WHERE key = ?').get(k) || {}).value || '';
  res.json({ ok: true, soldOut: get('sold_out') === '1' && get('sold_out_date') === todayET(), announcement: get('announcement') });
});

router.post('/api/settings/current', (req, res) => {
  const b = req.body || {};
  const set = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  if (typeof b.soldOut === 'boolean') {
    set.run('sold_out', b.soldOut ? '1' : '0');
    set.run('sold_out_date', b.soldOut ? todayET() : '');
  }
  if (typeof b.announcement === 'string') set.run('announcement', b.announcement.trim().slice(0, 200));
  res.json({ ok: true });
});

module.exports = router;
