// Optional email alerts. If SMTP_* and NOTIFY_EMAIL aren't set, alerts are skipped (leads still save to the dashboard).
const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_PORT || 465) === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

async function notify(subject, fields) {
  if (!transporter || !process.env.NOTIFY_EMAIL) return;
  const rows = Object.entries(fields)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:bold">${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join('');
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL,
      subject,
      html: `<h2 style="font-family:sans-serif">${esc(subject)}</h2><table style="font-family:sans-serif">${rows}</table>`,
    });
  } catch (err) {
    console.error('Email notify failed:', err.message);
  }
}

module.exports = { notify };
