const express = require('express');
const db = require('../db/database');
const { notify } = require('../lib/mailer');

const router = express.Router();

// Simple per-IP rate limit for form posts.
const hits = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip;
  const list = (hits.get(key) || []).filter(t => now - t < 10 * 60 * 1000);
  if (list.length >= 8) return res.status(429).json({ ok: false, error: 'Too many submissions. Give us a call instead!' });
  list.push(now);
  hits.set(key, list);
  next();
}

const clip = (v, n) => (v == null ? '' : String(v).trim().slice(0, n));

function todayET() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

// Live status: open/closed + "sold out" flag the owner flips from the dashboard (auto-resets next day).
router.get('/status', (req, res) => {
  const get = k => (db.prepare('SELECT value FROM settings WHERE key = ?').get(k) || {}).value || '';
  const soldOut = get('sold_out') === '1' && get('sold_out_date') === todayET();
  res.json({ soldOut, announcement: get('announcement') });
});

router.post('/inquiry', rateLimit, (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot
  const name = clip(b.name, 100);
  const phone = clip(b.phone, 40);
  const type = clip(b.type, 40) || 'General';
  if (!name || !phone) return res.status(400).json({ ok: false, error: 'Name and phone are required.' });

  const row = {
    name, phone, type,
    email: clip(b.email, 120),
    event_date: clip(b.event_date, 40),
    headcount: clip(b.headcount, 20),
    message: clip(b.message, 2000),
  };
  db.prepare(`INSERT INTO inquiries (name, phone, email, type, event_date, headcount, message)
              VALUES (@name, @phone, @email, @type, @event_date, @headcount, @message)`).run(row);

  notify(`New ${type} inquiry — ${name}`, {
    Name: name, Phone: phone, Email: row.email, Type: type,
    'Event date': row.event_date, Headcount: row.headcount, Message: row.message,
  });
  res.json({ ok: true });
});

router.post('/challenge', rateLimit, (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true });
  const name = clip(b.name, 100);
  const phone = clip(b.phone, 40);
  if (!name || !phone) return res.status(400).json({ ok: false, error: 'Name and phone are required.' });

  const row = { name, phone, hometown: clip(b.hometown, 80), preferred_day: clip(b.preferred_day, 40), hype: clip(b.hype, 500) };
  db.prepare(`INSERT INTO challengers (name, phone, hometown, preferred_day, hype)
              VALUES (@name, @phone, @hometown, @preferred_day, @hype)`).run(row);

  notify(`New Nephilim challenger — ${name}`, {
    Name: name, Phone: phone, Hometown: row.hometown, 'Preferred day': row.preferred_day, 'Trash talk': row.hype,
  });
  res.json({ ok: true });
});

module.exports = router;
