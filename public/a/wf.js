// Woven Founders — tracking (VT partner protocol: pv_start/pv_update/pv_end/event via /api/track),
// cookie consent, Meta pixel after consent, 3-step form, seats, report animations.
(function () {
  var EP = '/api/track', K = 'wf_', consent = null;
  try { consent = localStorage.getItem(K + 'consent'); } catch (e) {}
  function rid(p) { return p + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12); }
  var mem = { vid: rid('wf_'), sid: rid('session_') };
  // Without consent nothing is written to the device: ids live in memory for this page view only.
  function vid() { if (consent !== 'yes') return mem.vid; try { var v = localStorage.getItem(K + 'vid'); if (!v) { v = mem.vid; localStorage.setItem(K + 'vid', v); } return v; } catch (e) { return mem.vid; } }
  function sid() { if (consent !== 'yes') return mem.sid; try { var s = sessionStorage.getItem(K + 'sid'); if (!s) { s = mem.sid; sessionStorage.setItem(K + 'sid', s); } return s; } catch (e) { return mem.sid; } }
  function utm() {
    var q = new URLSearchParams(location.search), o = {}, has = false;
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'src'].forEach(function (k) { var v = q.get(k); if (v) { o[k] = v; has = true; } });
    if (!o.utm_source && o.fbclid) { o.utm_source = 'facebook'; o.utm_medium = o.utm_medium || 'paid'; }
    if (!o.utm_source && o.gclid) { o.utm_source = 'google'; o.utm_medium = o.utm_medium || 'ppc'; }
    if (consent === 'yes') { try { if (has) sessionStorage.setItem(K + 'utm', JSON.stringify(o)); else o = JSON.parse(sessionStorage.getItem(K + 'utm') || '{}'); } catch (e) {} }
    return o;
  }
  function br() { var u = navigator.userAgent; return /Edg\//.test(u) ? 'Edge' : /Chrome/.test(u) ? 'Chrome' : /Firefox/.test(u) ? 'Firefox' : /Safari/.test(u) ? 'Safari' : 'Unknown'; }
  function os() { var u = navigator.userAgent; return /Android/.test(u) ? 'Android' : /iPhone|iPad/.test(u) ? 'iOS' : /Windows/.test(u) ? 'Windows' : /Mac OS/.test(u) ? 'macOS' : /Linux/.test(u) ? 'Linux' : 'Unknown'; }
  function send(type, p, beacon) {
    p = p || {}; p.visitor_id = vid(); p.session_id = sid(); p.sessionId = p.session_id;
    var b = JSON.stringify({ type: type, payload: p });
    if (beacon && navigator.sendBeacon) return navigator.sendBeacon(EP, new Blob([b], { type: 'application/json' }));
    return fetch(EP, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: b, keepalive: true }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  var pvId = null, t0 = Date.now(), maxScroll = 0, marks = {};
  var track = window.wfTrack = function (name, params) { return send('event', { name: name, params: params || {}, pageViewId: pvId, at: new Date().toISOString() }); };
  var u = utm();
  var pv = { url: location.pathname + location.search, title: document.title, enteredAt: new Date().toISOString(), referrer: document.referrer, browser: br(), os: os(), language: navigator.language, timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || ''), screenWidth: screen.width, screenHeight: screen.height, landingPage: location.href };
  for (var k in u) pv[k] = u[k];
  send('pv_start', pv).then(function (r) { if (r && r.pageViewId) pvId = r.pageViewId; });
  addEventListener('scroll', function () {
    var h = document.documentElement, d = Math.round((h.scrollTop + innerHeight) / h.scrollHeight * 100);
    if (d > maxScroll) maxScroll = d;
    [25, 50, 75, 100].forEach(function (m) { if (maxScroll >= m && !marks[m]) { marks[m] = 1; track('scroll_depth', { depth: m }); } });
  }, { passive: true });
  setInterval(function () { if (pvId && document.visibilityState === 'visible') send('pv_update', { pageViewId: pvId, timeOnPage: Math.round((Date.now() - t0) / 1000), scrollDepth: maxScroll, updatedAt: new Date().toISOString() }); }, 15000);
  function bye() { if (pvId && !bye.d) { bye.d = 1; send('pv_end', { pageViewId: pvId, durationMs: Date.now() - t0, exitedAt: new Date().toISOString(), scrollDepth: maxScroll }, true); } }
  addEventListener('pagehide', bye);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') bye(); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a,button,summary'); if (!a) return;
    var c = a.getAttribute('data-cta');
    track(c ? 'cta_click' : (a.tagName === 'SUMMARY' ? 'faq_open' : 'button_click'), { text: (a.textContent || '').trim().slice(0, 80), cta: c || undefined, href: a.getAttribute('href') || undefined });
  });

  // Meta pixel (Woven Founders 2134590843821805) — only after consent
  window.wfPixel = function () {
    if (window.fbq) return;
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '2134590843821805'); fbq('track', 'PageView');
  };
  if (consent === 'yes') wfPixel();
  var cb = document.getElementById('cb');
  function setC(x) {
    consent = x;
    try { localStorage.setItem(K + 'consent', x); if (x === 'yes') { localStorage.setItem(K + 'vid', mem.vid); sessionStorage.setItem(K + 'sid', mem.sid); } else { localStorage.removeItem(K + 'vid'); sessionStorage.removeItem(K + 'sid'); } } catch (e) {}
    cb.hidden = true; track('cookie_consent', { choice: x });
    if (x === 'yes') wfPixel();
  }
  if (cb) {
    if (!consent) cb.hidden = false;
    document.getElementById('cby').onclick = function () { setC('yes'); };
    document.getElementById('cbn').onclick = function () { setC('no'); };
    var o = document.getElementById('cbopen'); if (o) o.onclick = function (e) { e.preventDefault(); cb.hidden = false; };
  }

  // Headline: visitors from the reel see the confession continue
  var fromReel = u.src === 'reel' || /^(meta|facebook|instagram|ig)$/i.test(u.utm_source || '');
  var h1 = document.getElementById('h1');
  if (h1 && fromReel) {
    h1.innerHTML = 'Je keek net naar <em>AI</em>.';
    var lead = document.getElementById('lead');
    if (lead) lead.textContent = 'Die AI draait elke dag in onze eigen 3 winkels. Nu bekijkt ze jouw zaak, gratis, voor 3 modezaken in Vlaanderen.';
    var rh = document.getElementById('realh'); if (rh) rh.textContent = 'De man in de video bestaat echt.';
  }

  // Seats + optional hero loop video
  fetch('/api/seats').then(function (r) { return r.json(); }).then(function (s) {
    var t = s.free > 0 ? 'nog ' + s.free + ' van ' + s.total + ' plaatsen' : 'alle plaatsen zijn ingenomen, je komt op de wachtlijst';
    var a = document.getElementById('seats'); if (a) a.textContent = t;
    var b = document.getElementById('seats2'); if (b) b.textContent = s.free > 0 ? '· nog ' + s.free + ' plaatsen' : '· wachtlijst';
    var v = document.getElementById('avvid');
    if (v && s.video && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      v.src = s.video; v.addEventListener('playing', function () { v.classList.add('on'); }, { once: true }); v.play().catch(function () {});
    }
  }).catch(function () {});

  // Report pages + rings + sticky CTA
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target; io.unobserve(el); el.classList.add('in');
      el.querySelectorAll('.ring').forEach(function (r) {
        var b = r.querySelector('b'), n = +b.getAttribute('data-n'), i = 0;
        var st = setInterval(function () { i += .25; if (i >= n) { i = n; clearInterval(st); } r.style.setProperty('--p', i); b.textContent = Math.round(i); }, 40);
      });
      if (el.id === 'pages') track('report_seen', {});
    });
  }, { threshold: .35 }) : null;
  document.querySelectorAll('.page').forEach(function (p) { if (io) io.observe(p); else p.classList.add('in'); });
  if (io) io.observe(document.getElementById('pages'));
  if (!io) document.querySelectorAll('.ring').forEach(function (r) { var b = r.querySelector('b'); r.style.setProperty('--p', b.getAttribute('data-n')); b.textContent = b.getAttribute('data-n'); });
  var sticky = document.querySelector('.sticky'), formEl = document.getElementById('f');
  if (sticky && formEl && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { sticky.classList.toggle('hide', es[0].isIntersecting); }, { threshold: .1 }).observe(formEl);

  // 3-step form
  var f = formEl; if (!f) return;
  var msg = document.getElementById('msg'), leadId = null, ts = Date.now(), started = false, step = 1;
  var bars = f.querySelectorAll('.steps i');
  function val(n) { var el = f.elements[n]; return el && el.value ? el.value.trim() : ''; }
  function err(t, el) { msg.className = 'msg err'; msg.textContent = t; if (el) { el.classList.add('err'); el.focus(); } track('form_error', { step: step, field: el ? el.name : '' }); }
  function clear() { msg.className = 'msg'; msg.textContent = ''; f.querySelectorAll('.err').forEach(function (e) { e.classList.remove('err'); }); }
  function show(n) {
    step = n;
    f.querySelectorAll('.step').forEach(function (s) { s.hidden = +s.getAttribute('data-step') !== n; });
    bars.forEach(function (b, i) { b.classList.toggle('on', i < n); });
    var first = f.querySelector('.step[data-step="' + n + '"] input:not([type=checkbox]):not([type=radio])');
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 50);
    track('form_step', { step: n });
  }
  function payload(stage) {
    var ch = []; f.querySelectorAll('input[name=uitdaging]:checked').forEach(function (c) { ch.push(c.value); });
    var kanaal = (f.querySelector('input[name=kanaal]:checked') || {}).value || 'whatsapp';
    return { stage: stage, lead_id: leadId, zaak: val('zaak'), gemeente: val('gemeente'), online: val('online'), geenweb: !!(f.elements.geenweb && f.elements.geenweb.checked),
      naam: val('naam'), kanaal: kanaal, contact: val('contact'), uitdaging: ch.join(', '), akkoord: !!f.elements.akkoord.checked, bedrijfsfax: val('bedrijfsfax'),
      elapsed: Date.now() - ts, visitor_id: vid(), session_id: sid(), utm: u, page: location.href };
  }
  function post(stage) {
    return fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload(stage)) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); });
  }
  f.addEventListener('focusin', function (e) { if (!started) { started = true; track('form_start', { field: e.target.name }); } track('form_field_focus', { field: e.target.name, step: step }); });
  f.querySelectorAll('input[name=kanaal]').forEach(function (r) {
    r.addEventListener('change', function () {
      var c = f.elements.contact, em = r.value === 'email' && r.checked;
      if (!r.checked) return;
      c.type = em ? 'email' : 'tel'; c.inputMode = em ? 'email' : 'tel'; c.autocomplete = em ? 'email' : 'tel';
      c.placeholder = em ? 'jij@jouwzaak.be' : '+32 4.. .. .. ..'; c.value = '';
    });
  });
  f.querySelectorAll('[data-prev]').forEach(function (b) { b.onclick = function () { clear(); show(+b.getAttribute('data-prev')); }; });
  f.querySelectorAll('[data-next]').forEach(function (b) {
    b.onclick = function () {
      clear();
      var n = +b.getAttribute('data-next');
      if (n === 2) {
        if (!val('zaak')) return err('Hoe heet je zaak?', f.elements.zaak);
        if (!val('gemeente')) return err('In welke gemeente zit je zaak?', f.elements.gemeente);
        post(1).then(function (x) { if (x.ok && x.j.id) leadId = x.j.id; }).catch(function () {});
        track('form_step1_submit', { gemeente: val('gemeente') });
      }
      if (n === 3 && !val('online') && !f.elements.geenweb.checked) return err('Vul je website of Instagram in, of kies "Ik heb nog geen website".', f.elements.online);
      show(n);
    };
  });
  f.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && step < 3) { e.preventDefault(); var b = f.querySelector('.step[data-step="' + step + '"] [data-next]'); if (b) b.click(); }
  });
  f.addEventListener('submit', function (e) {
    e.preventDefault(); clear();
    if (step < 3) return;
    if (!val('naam')) return err('Hoe mogen we je noemen?', f.elements.naam);
    var c = val('contact'), em = (f.querySelector('input[name=kanaal]:checked') || {}).value === 'email';
    if (em ? !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c) : c.replace(/[^0-9]/g, '').length < 8) return err(em ? 'Dat e-mailadres lijkt niet te kloppen.' : 'Vul je GSM-nummer in voor WhatsApp.', f.elements.contact);
    if (!f.elements.akkoord.checked) return err('Vink het vakje aan om de analyse aan te vragen.', f.elements.akkoord);
    var btn = document.getElementById('send'); btn.disabled = true; btn.textContent = 'Bezig…';
    post(2).then(function (x) {
      if (!x.ok) throw new Error('x');
      f.querySelectorAll('.step,.steps,.micro').forEach(function (s) { s.hidden = true; });
      f.querySelector('.done').hidden = false;
      track('form_submit', { lead_id: x.j.id, gemeente: val('gemeente'), kanaal: em ? 'email' : 'whatsapp' });
      if (window.fbq) fbq('track', 'Lead', {}, { eventID: x.j.id });
    }).catch(function () { btn.disabled = false; btn.textContent = 'Vraag mijn analyse aan'; err('Er ging iets mis. Probeer het opnieuw.'); track('form_fail', {}); });
  });
})();
