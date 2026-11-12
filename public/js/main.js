(function () {
  'use strict';

  // Mobile nav
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Current time in Lewiston (Eastern)
  function nowET() {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: days[o.weekday], mins: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
  }

  var t = nowET();
  var openDay = t.day >= 2 && t.day <= 6;
  var isOpen = openDay && t.mins >= 12 * 60 && t.mins < 17 * 60 + 30;

  var todayRow = document.querySelector('#hours tr[data-day="' + t.day + '"]');
  if (todayRow) todayRow.classList.add('today');

  var pill = document.getElementById('statusPill');
  var txt = document.getElementById('statusText');
  function setStatus(cls, label) {
    if (!pill) return;
    pill.classList.remove('open', 'closed', 'soldout');
    pill.classList.add(cls);
    txt.textContent = label;
  }
  if (isOpen) setStatus('open', 'Open now · till 5:30 or sold out');
  else if (openDay && t.mins < 12 * 60) setStatus('closed', 'Opens today at noon');
  else setStatus('closed', 'Closed · Open Tue–Sat 12–5:30');

  // Live sold-out flag + announcement from the owner's dashboard
  fetch('/api/status').then(function (r) { return r.json(); }).then(function (s) {
    if (s.soldOut) setStatus('soldout', 'Sold out today. See you tomorrow!');
    var a = document.getElementById('announce');
    if (a && s.announcement) { a.textContent = s.announcement; a.classList.add('show'); }
  }).catch(function () {});

  // Gallery
  var g = document.getElementById('gallery');
  if (g && window.GALLERY) {
    window.GALLERY.forEach(function (item) {
      var fig = document.createElement('figure');
      if (item.size) fig.className = item.size;
      if (item.src) {
        var img = document.createElement('img');
        img.src = item.src; img.alt = item.alt || ''; img.loading = 'lazy';
        fig.appendChild(img);
      } else {
        var ph = document.createElement('div');
        ph.className = 'ph' + (item.tone ? ' ' + item.tone : '');
        ph.setAttribute('role', 'img');
        ph.setAttribute('aria-label', item.alt || item.label);
        ph.innerHTML = '';
        ph.appendChild(document.createTextNode(item.label));
        var sm = document.createElement('small'); sm.textContent = 'Photo coming soon';
        ph.appendChild(sm);
        fig.appendChild(ph);
      }
      g.appendChild(fig);
    });
  }

  // Forms
  document.querySelectorAll('form[data-endpoint]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.querySelector('.form-msg');
      var btn = form.querySelector('button[type="submit"]');
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (!data.name || !data.phone) {
        msg.className = 'form-msg err'; msg.textContent = 'Name and phone are required.'; return;
      }
      btn.disabled = true;
      var original = btn.textContent;
      btn.textContent = 'Sending…';
      fetch(form.dataset.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            msg.className = 'form-msg ok';
            msg.textContent = form.dataset.endpoint === '/api/challenge'
              ? "You're on the list. We'll reach out to set it up. Come hungry."
              : "Got it! We'll get back to you soon.";
          } else {
            msg.className = 'form-msg err';
            msg.textContent = (res.j && res.j.error) || 'Something went wrong. Give us a call at (207) 241-0679.';
          }
        })
        .catch(function () { msg.className = 'form-msg err'; msg.textContent = 'Network error. Give us a call at (207) 241-0679.'; })
        .finally(function () { btn.disabled = false; btn.textContent = original; });
    });
  });
})();
