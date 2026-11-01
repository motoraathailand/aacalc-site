/* AA Calc site: language + text swap (all pages). No tracking, no network calls.
   Start language: ?lang= > saved choice (localStorage aacalc.site.lang) > browser language (primary tag among th/en/ko/zh/hi) > English. */
(function () {
  'use strict';
  var LANGS = ['th', 'en', 'ko', 'zh', 'hi'], KEY = 'aacalc.site.lang';
  var S = window.SITE_STR || {}, page = document.body.getAttribute('data-page') || 'index';
  var dict = S[page === 'join' ? 'join' : 'intro'] || {};
  var M = window.Motion;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var lang = window.__L || 'en', explicit = !!window.__LX;
  function t(k) { var d = dict[lang]; return d && d[k] != null ? d[k] : (dict.en || {})[k] || ''; }
  window.SiteT = t; window.SiteLang = function () { return lang; };
  function metaSet(sel, v) { var m = $(sel); if (m && v) m.setAttribute('content', v); }
  function paint() {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang; document.documentElement.setAttribute('data-lang', lang);
    $$('[data-t]').forEach(function (e) { var v = t(e.getAttribute('data-t')); if (v && e.textContent !== v) e.textContent = v; });
    $$('[data-alt]').forEach(function (e) { e.setAttribute('alt', t(e.getAttribute('data-alt'))); });
    $$('[data-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-aria'))); });
    var title = (S.titles && S.titles[page] && S.titles[page][lang]) || t('title');
    if (title) { document.title = title; metaSet('meta[property="og:title"]', title); metaSet('meta[name="twitter:title"]', title); }
    var desc = (S.descs && S.descs[page] && S.descs[page][lang]) || t('desc');
    if (desc) { metaSet('meta[name=description]', desc); metaSet('meta[property="og:description"]', desc); metaSet('meta[name="twitter:description"]', desc); }
    var sel = $('#lang'); if (sel) sel.value = lang;
    if (explicit) $$('a[data-int]').forEach(function (a) { var h = a.getAttribute('data-href') || a.getAttribute('href'); a.setAttribute('data-href', h); var p = h.split('#'), q = p[0].replace(/[?&]lang=\w+/, ''); a.setAttribute('href', q + (q.indexOf('?') < 0 ? '?' : '&') + 'lang=' + lang + (p[1] ? '#' + p[1] : '')); });
    if (typeof window.onSitePaint === 'function') window.onSitePaint(lang);
  }
  function setLang(l, fade) {
    if (LANGS.indexOf(l) < 0) return; lang = l; explicit = true;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    paint(); if (fade && M) M.langFade($('main'));
  }
  var sel = $('#lang'); if (sel) sel.addEventListener('change', function () { setLang(this.value, true); });
  paint();
  document.documentElement.classList.remove('lw');   // text is final: show the page
})();
