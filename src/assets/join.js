/* AA Calc /join: 3 progress ticks (remembered on this device only), locked steps while the closed test is not live, share/copy, reset. No network calls. */
(function () {
  'use strict';
  var KEY = 'aacalc.join.steps', M = window.Motion, t = window.SiteT;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var done = { 1: false, 2: false, 3: false };
  try { var s = JSON.parse(localStorage.getItem(KEY) || '{}'); [1, 2, 3].forEach(function (n) { done[n] = !!s[n]; }); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} }
  function count() { return [1, 2, 3].filter(function (n) { return done[n]; }).length; }
  function paintState() {
    var n = count();
    $$('.step').forEach(function (c) {
      var k = +c.getAttribute('data-step'); c.classList.toggle('done', done[k]);
      var b = $('.num', c); b.setAttribute('aria-pressed', done[k] ? 'true' : 'false'); b.setAttribute('aria-label', t('step').replace('{n}', k) + ' — ' + t(done[k] ? 'doneLab' : 'todoLab'));
    });
    $('#progTxt').textContent = t('prog').replace('{n}', n);
    $('#barFill').style.transform = 'scaleX(' + (n / 3) + ')';
    $('#all').hidden = n < 3;
  }
  window.onSitePaint = paintState;
  function mark(k, v) { var was = done[k]; done[k] = v; save(); paintState(); if (v && !was && M) M.pop($('#c' + k + ' .num')); }
  $$('.num').forEach(function (b) { b.addEventListener('click', function () { var k = +b.getAttribute('data-chk'); mark(k, !done[k]); }); });
  $$('[data-go]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var c = a.closest('.step');
      if (c && c.hasAttribute('data-locked')) { e.preventDefault(); var p = $('#pend'); if (p) { p.classList.remove('nudge'); void p.offsetWidth; p.classList.add('nudge'); if (M) M.scrollTo(p, 'center'); } return; }
      setTimeout(function () { mark(+a.getAttribute('data-go'), true); }, 600);   // the link opens in a new tab; on return the step is ticked (untick with the number)
    });
  });
  $('#reset').addEventListener('click', function () { done = { 1: false, 2: false, 3: false }; save(); paintState(); if (M) M.scrollTo($('#steps'), 'start'); });
  var url = location.origin + location.pathname.replace(/[^/]*$/, '') + 'join.html', note = $('#shareNote');
  function say(k) { note.textContent = t(k); clearTimeout(say._t); say._t = setTimeout(function () { note.textContent = ''; }, 3500); }
  $('#share').addEventListener('click', function () {
    var data = { title: t('shareTitle'), text: t('shareText'), url: url };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { say('copied'); }, function () { say('copyFail'); });
    else say('copyFail');
  });
  // Facebook / Instagram / LINE / Messenger in-app browser (or any Android WebView): Google Groups / Play often fail there, so ask to open the page in Chrome first (rule: AA-common-rules, tester recruiting).
  var ua = navigator.userAgent || '', iab = $('#iab');
  if (iab && /Android/i.test(ua) && /FBAN|FBAV|FB_IAB|Instagram|\bLine\/|MessengerLite|; wv\)/i.test(ua)) {
    var pageUrl = location.href.split('#')[0];
    iab.hidden = false;
    $('#iabOpen').setAttribute('href', 'intent://' + pageUrl.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(pageUrl) + ';end');
    $('#iabCopy').addEventListener('click', function () {
      var n = $('#iabNote'), ok = function () { n.textContent = t('iabOk'); }, bad = function () { n.textContent = t('copyFail'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pageUrl).then(ok, bad); else bad();
    });
  }
  paintState();
})();
