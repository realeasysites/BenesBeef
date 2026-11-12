// Password-only admin auth. Set ADMIN_PASSWORD (required) and SESSION_SECRET (recommended).
const crypto = require('crypto');

const COOKIE = 'bb_admin';
const MAX_AGE_MS = 1000 * 60 * 60 * 12; // 12 hours

function secret() {
  return process.env.SESSION_SECRET || ('bb-' + (process.env.ADMIN_PASSWORD || ''));
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function loginEnabled() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function checkPassword(pw) {
  if (!loginEnabled()) return false;
  return safeEqual(pw || '', process.env.ADMIN_PASSWORD);
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

function issue(res, req) {
  const expires = String(Date.now() + MAX_AGE_MS);
  res.cookie(COOKIE, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: MAX_AGE_MS,
    path: '/admin',
  });
}

function clear(res) {
  res.clearCookie(COOKIE, { path: '/admin' });
}

function isAuthed(req) {
  if (!loginEnabled()) return false;
  const raw = req.cookies && req.cookies[COOKIE];
  if (!raw) return false;
  const [expires, sig] = raw.split('.');
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  return safeEqual(sig, sign(expires));
}

module.exports = { loginEnabled, checkPassword, issue, clear, isAuthed };
