// Builds the whole static site into docs/ (GitHub Pages serves /docs of branch main).
//   index.html (intro = /about), join.html, privacy.html, about/index.html (redirect), 404.html, sitemap.xml, robots.txt, assets/*
// Usage: node scripts/build.mjs        (no dependencies; QR code from scripts/qrcode.mjs = the app's vendored qrcode-generator, MIT)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import qrcode from './qrcode.mjs';
import { INTRO, JOIN } from '../src/strings.mjs';
import { LANGS, SOCIAL, makeContent } from '../src/content.mjs';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), SRC = path.join(ROOT, 'src'), OUT = path.join(ROOT, 'docs');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/site.json'), 'utf8'));
for (const k of ['siteUrl', 'packageName', 'groupEmail', 'groupUrl', 'optInUrl', 'installUrl', 'contactEmail', 'operator', 'policyDate']) if (!cfg[k]) throw new Error('config/site.json: missing ' + k);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const L = LANGS.map((x) => x[0]), SITE = cfg.siteUrl;
// ---- completeness: every language has every key / section ----
for (const [name, D] of [['INTRO', INTRO], ['JOIN', JOIN]]) { const keys = Object.keys(D.en); for (const l of L) { if (!D[l]) throw new Error(name + ' lacks ' + l); const miss = keys.filter((k) => !(k in D[l]) || !String(D[l][k]).trim() && D.en[k]); if (miss.length) throw new Error(name + '.' + l + ' misses ' + miss.join()); } }
const C = makeContent({ OPERATOR: cfg.operator, EMAIL: cfg.contactEmail, UPDATED: cfg.policyDate, SITE });
for (const name of ['PRIVACY']) for (const l of L) { if (!C[name][l]) throw new Error(name + ' lacks ' + l); if (C[name][l].length !== C[name].en.length) throw new Error(name + '.' + l + ' has ' + C[name][l].length + ' sections, en has ' + C[name].en.length); }
const I = INTRO, J = JOIN;
// ---- helpers ----
const ICON = { calc: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8.500 7.500h7M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01"/>', ruler: '<path d="M3.500 15.500l12-12 5 5-12 12zM8 11l2.500 2.500M11 8l2.500 2.500M5.500 13.500L7 15"/>', coin: '<circle cx="12" cy="12" r="9"/><path d="M14.800 9c-.4-1-1.400-1.500-2.800-1.500-1.700 0-2.800.8-2.800 2s1 1.700 2.800 2 2.800.8 2.800 2-1.100 2-2.800 2c-1.500 0-2.500-.6-2.900-1.600M12 5.800v1.700M12 16.500v1.700"/>', offline: '<path d="M2 8.800a15 15 0 0 1 20 0M5 12.500a10 10 0 0 1 14 0M8.500 16a5 5 0 0 1 7 0M12 19.500h.01M3 3l18 18"/>', restore: '<path d="M3 12a9 9 0 1 0 3-6.700L3 8M3 3v5h5M12 7.500V12l3 2"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.200 3 14.800 0 18M12 3c-3 3.200-3 14.800 0 18"/>' };
const svg = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
const attr = (tag, key, extra = '', dict = I) => `<${tag} data-t="${key}"${extra ? ' ' + extra : ''}>${esc(dict.en[key])}</${tag}>`;
const LOGO = `<a class="logo" href="index.html" data-int aria-label="AA Calc"><svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2cc386"/><stop offset="1" stop-color="#1fa86b"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#lg)"/><g stroke="#fff" stroke-width="5.400" stroke-linecap="round" fill="none"><path d="M20.600 13.600v14M13.600 20.600h14M36.500 20.500h14M15.500 38.300l10.200 10.200M25.700 38.300L15.500 48.500M36.500 39.200h14M36.500 47.700h14"/></g></svg><span>AA Calc</span></a>`;
const LANGSEL = (dict) => `<label class="lang"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.200 3 14.800 0 18M12 3c-3 3.200-3 14.800 0 18"/></svg><select id="lang" data-aria="langLabel" aria-label="${esc(dict.en.langLabel)}">${LANGS.map(([l, n]) => `<option value="${l}"${l === 'en' ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`;
const HEADER = (dict) => `<header class="hd"><div class="hd-in">${LOGO}${LANGSEL(dict)}</div></header>`;
const FOOTER = (dict, madeKey) => `<footer class="ft"><div class="wrap"><div class="links"><a href="privacy.html" data-int data-t="privacy">${esc(dict.en.privacy)}</a><a href="mailto:${esc(cfg.contactEmail)}" data-t="contact">${esc(dict.en.contact)}</a></div>${madeKey ? `<p data-t="${madeKey}">${esc(dict.en[madeKey])}</p>` : ''}</div></footer>`;
// language chosen BEFORE first paint (no flash): ?lang= > saved > browser primary tag > English. Non-English keeps the page hidden (html.lw) until site.js has swapped the baked English text (fails open after 1.5 s).
const HEAD_SCRIPT = `<script>/* language first: ?lang= > saved choice > browser language (th/en/ko/zh/hi by primary subtag) > English */
(function(){var L=['th','en','ko','zh','hi'],l='en',x=0,d=document.documentElement;try{var m=/[?&]lang=(\\w\\w)/.exec(location.search),s=localStorage.getItem('aacalc.site.lang'),a=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language],p='';if(m&&L.indexOf(m[1])>-1){l=m[1];x=1}else if(L.indexOf(s)>-1){l=s;x=1}else for(var i=0;i<a.length;i++){p=String(a[i]||'').toLowerCase().split(/[-_]/)[0];if(L.indexOf(p)>-1){l=p;break}}}catch(e){}window.__L=l;window.__LX=x;d.lang=l==='zh'?'zh-Hans':l;d.setAttribute('data-lang',l);if(l!=='en'){d.className+=' lw';setTimeout(function(){d.className=d.className.replace(/\\blw\\b/,'')},1500)}})();</script>`;
function shell({ page, file, title, desc, body, dictKey = 'intro', jsonld = '' }) {
  const url = `${SITE}/${file === 'index.html' ? '' : file}`;
  return `<!doctype html>
<html lang="en" data-lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#0d2a1e">
<meta name="color-scheme" content="light dark">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AA Calc">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/assets/img/og.jpg">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${SITE}/assets/img/og.jpg">
<link rel="icon" href="assets/icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
${HEAD_SCRIPT}
<link rel="stylesheet" href="assets/motion.css">
<link rel="stylesheet" href="assets/site.css">
</head>
<body data-page="${page}" data-lang-root>
${body}
<script src="assets/strings.js"></script>
<script src="assets/motion.js"></script>
<script src="assets/site.js"></script>${page === 'join' ? '\n<script src="assets/join.js"></script>' : ''}
</body>
</html>
`;
}
// ---- intro (index.html) ----
const features = [['calc', 'f1'], ['ruler', 'f2'], ['coin', 'f3'], ['offline', 'f4'], ['restore', 'f5'], ['globe', 'f6']];
const indexBody = `${HEADER(I)}
<main id="main">
<section class="hero"><div class="wrap hero-in">
  <div>
    ${attr('p', 'eyebrow', 'class="eyebrow"')}
    ${attr('h1', 'h1')}
    ${attr('p', 'lead', 'class="lead"')}
    <div class="cta"><a class="btn" data-press data-ripple data-int href="join.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg><span data-t="ctaJoin">${esc(I.en.ctaJoin)}</span></a><a class="btn ghost" data-press data-ripple href="#features"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg><span data-t="ctaMore">${esc(I.en.ctaMore)}</span></a></div>
    <ul class="chips" data-stagger>${['chip1', 'chip2', 'chip3'].map((k) => attr('li', k)).join('')}</ul>
  </div>
  <figure class="hero-shot"><img src="assets/img/hero.webp" width="1200" height="960" alt="${esc(I.en.shotAlt)}" data-alt="shotAlt" fetchpriority="high">${attr('figcaption', 'shotCap')}</figure>
</div></section>
<section class="s" id="features"><div class="wrap">
  ${attr('h2', 'featH')}
  <ul class="grid">${features.map(([ic, k], n) => `<li class="card" data-reveal style="--i:${n % 3}"><div class="ic">${svg(ic)}</div>${attr('h3', k + 't')}${attr('p', k + 'd')}</li>`).join('')}</ul>
</div></section>
<section class="s"><div class="wrap">
  ${attr('h2', 'shotsH')}${attr('p', 'shotsD', 'class="sub"')}
  <div class="shots"><figure data-reveal><img src="assets/img/shot-th.webp" width="390" height="844" loading="lazy" alt="${esc(I.en.g1Alt)}" data-alt="g1Alt"></figure><figure data-reveal style="--i:1"><img src="assets/img/shot-ko.webp" width="390" height="844" loading="lazy" alt="${esc(I.en.g2Alt)}" data-alt="g2Alt"></figure><figure data-reveal style="--i:2"><img src="assets/img/shot-hi.webp" width="390" height="844" loading="lazy" alt="${esc(I.en.g3Alt)}" data-alt="g3Alt"></figure><figure data-reveal style="--i:3"><img src="assets/img/shot-dark.webp" width="390" height="844" loading="lazy" alt="${esc(I.en.g4Alt)}" data-alt="g4Alt"></figure></div>
</div></section>
<section class="band"><div class="wrap narrow">
  ${attr('h2', 'trustH')}
  <ul class="trust">${['trust1', 'trust2', 'trust3', 'trust4'].map((k) => attr('li', k)).join('')}</ul>
  <p style="margin-top:16px"><a href="privacy.html" data-int data-t="trustLink">${esc(I.en.trustLink)}</a></p>
</div></section>
<section class="joincta"><div class="wrap">
  ${attr('h2', 'joinH')}${attr('p', 'joinD')}
  <a class="btn" data-press data-ripple data-int href="join.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg><span data-t="joinB">${esc(I.en.joinB)}</span></a>
</div></section>
</main>
${FOOTER(I, 'made')}`;
// ---- join (join.html) ----
const live = !!cfg.optInLive;
const stepIcon = { 1: '<circle cx="9" cy="9" r="3.200"/><circle cx="17" cy="10" r="2.400"/><path d="M3.500 19c0-3.300 2.500-5.500 5.500-5.500s5.500 2.200 5.500 5.500M15 15c3-.6 5.500 1 5.500 4"/>', 2: '<path d="M12 3l2.600 5.300 5.800.8-4.200 4.100 1 5.800L12 16.300 6.800 19l1-5.800L3.600 9.100l5.800-.8z"/>', 3: '<path d="M12 4v11M7.500 10.500L12 15l4.500-4.500M5 19.500h14"/>' };
const stepCard = (n, href, locked) => `<li class="step" id="c${n}" data-step="${n}"${locked ? ' data-locked' : ''}>
      <div class="pic" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${stepIcon[n]}</svg></div>
      <div class="body">
        <div class="head"><button class="num" type="button" data-press data-chk="${n}"><span>${n}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg></button>${attr('h2', 's' + n + 't', '', J)}${n === 1 ? '' : ''}</div>
        ${attr('p', 's' + n + 'd', 'class="desc"', J)}
        <a class="btn" data-press data-ripple data-go="${n}" href="${esc(href)}" target="_blank" rel="noopener"${locked ? ' aria-disabled="true"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>${attr('span', 's' + n + 'b', '', J)}</a>
      </div>
    </li>`;
const q = qrcode(0, 'M'); q.addData(SITE + '/join.html'); q.make(); const qn = q.getModuleCount(), qz = 2; let qd = '';
for (let r = 0; r < qn; r++) for (let c = 0; c < qn; c++) if (q.isDark(r, c)) qd += `M${c + qz} ${r + qz}h1v1h-1z`;
const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qn + 2 * qz} ${qn + 2 * qz}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${qd}" fill="#17150f"/></svg>\n`;
const joinBody = `${HEADER(J)}
<main id="main">
<section class="jhero"><div class="wrap narrow">
  ${attr('h1', 'h1', '', J)}
  <div class="gmail" role="note"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7.500l8 6 8-6"/></svg><div>${attr('b', 'gm', '', J)}${attr('span', 'gmD', '', J)}</div></div>
  <div class="iab" id="iab" role="alert" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.500v5M12 16h.01"/></svg><div><b data-t="iabT">${esc(J.en.iabT)}</b><span data-t="iabD">${esc(J.en.iabD)}</span><div class="iabrow"><a class="btn" id="iabOpen" href="#" data-t="iabB">${esc(J.en.iabB)}</a><button type="button" class="btn ghost" id="iabCopy" data-t="iabC">${esc(J.en.iabC)}</button></div><small id="iabNote" aria-live="polite"></small></div></div>
  <div class="prog"><div class="bar" aria-hidden="true"><i id="barFill"></i></div><p id="progTxt" aria-live="polite"></p></div>
</div></section>
<section class="wrap narrow steps" id="steps">
  <ol class="cards" data-stagger>
    ${stepCard(1, cfg.groupUrl, false)}
    ${stepCard(2, cfg.optInUrl, !live)}
    ${stepCard(3, cfg.installUrl, !live)}
  </ol>
  <p class="pend" id="pend" role="note"${live ? ' hidden' : ''} data-t="pend">${esc(J.en.pend)}</p>
  <p class="remind" data-t="remH">${esc(J.en.remH)}</p>
  <div class="all" id="all" hidden role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg><div>${attr('b', 'allT', '', J)}${attr('p', 'allD', '', J)}</div></div>
  <div class="retry"><b data-t="retryH">${esc(J.en.retryH)}</b><p class="desc" data-t="retryD">${esc(J.en.retryD)}</p><button class="btn soft" id="reset" type="button" data-press><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg><span data-t="retryB">${esc(J.en.retryB)}</span></button></div>
  <div class="two">
    <div class="panel"><h2 data-t="shareH">${esc(J.en.shareH)}</h2><div class="row"><button class="btn" id="share" type="button" data-press data-ripple><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg><span data-t="share">${esc(J.en.share)}</span></button></div><p class="note" id="shareNote" aria-live="polite"></p></div>
    <div class="panel qr"><h2 data-t="qrH">${esc(J.en.qrH)}</h2><p class="note" data-t="qrD">${esc(J.en.qrD)}</p><img src="assets/join-qr.svg" width="168" height="168" alt="${esc(J.en.qrAlt)}" data-alt="qrAlt"></div>
  </div>
  <div class="faq"><h2 data-t="faqH">${esc(J.en.faqH)}</h2><div class="faqs">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<details><summary data-t="q${n}">${esc(J.en['q' + n])}</summary><p data-t="a${n}">${esc(J.en['a' + n])}</p></details>`).join('')}</div></div>
</section>
</main>
${FOOTER(J, '')}`;
// ---- legal pages (privacy.html) ----
const mail = (s) => esc(s).replace(new RegExp(esc(cfg.contactEmail).replace(/\./g, '\\.'), 'g'), `<a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>`);
const blocks = (bs) => bs.map((b) => typeof b === 'string' ? `<p>${mail(b)}</p>` : b.ul ? `<ul>${b.ul.map((x) => `<li>${mail(x)}</li>`).join('')}</ul>` : `<ol>${b.ol.map((x) => `<li>${mail(x)}</li>`).join('')}</ol>`).join('');
function legal({ file, titleKey, content }) {
  const sections = LANGS.map(([l]) => { const U = C.UI[l]; return `<section class="lg" lang="${l === 'zh' ? 'zh-Hans' : l}" id="s-${l}"><h1>${esc(U[titleKey])}</h1><p class="meta">${esc(U.app)} · ${esc(U.updated)}: ${esc(cfg.policyDate)}</p>${content[l].map(([h, b]) => `<h2>${esc(h)}</h2>${blocks(b)}`).join('')}</section>`; }).join('\n');
  const body = `<header class="hd"><div class="hd-in"><a class="back" href="index.html" data-int>← <span data-t="home">${esc(I.en.home)}</span></a>${LANGSEL(I)}</div></header>
<main id="main" class="wrap narrow legal${file === 'privacy.html' ? ' privacy' : ' delete'}">
${sections}
</main>
${FOOTER(I, '')}`;
  const titles = Object.fromEntries(LANGS.map(([l]) => [l, `${C.UI[l][titleKey]} — AA Calc`]));
  return { html: shell({ page: file === 'privacy.html' ? 'privacy' : 'delete', file, title: titles.en, desc: titles.en + '. ' + C.UI.en.updated + ': ' + cfg.policyDate, body }), titles };
}
const priv = legal({ file: 'privacy.html', titleKey: 'privacyTitle', content: C.PRIVACY });
// ---- write ----
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'about'), { recursive: true });
const W = (f, s) => fs.writeFileSync(path.join(OUT, f), s);
W('index.html', shell({ page: 'index', file: 'index.html', title: I.en.title, desc: I.en.desc, body: indexBody }));
W('join.html', shell({ page: 'join', file: 'join.html', title: J.en.title, desc: J.en.desc, body: joinBody }));
W('privacy.html', priv.html);
W('about/index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>AA Calc</title><meta name="robots" content="noindex"><link rel="canonical" href="${SITE}/"><meta http-equiv="refresh" content="0; url=../"><script>location.replace('../'+location.search+location.hash)</script></head><body><p><a href="../">AA Calc</a></p></body></html>\n`);
W('404.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AA Calc — page not found</title><meta name="robots" content="noindex"><style>body{font:18px/1.6 system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#fbf7ee;color:#1b1913;text-align:center}a{color:#7a5a12;font-weight:600}</style></head><body><main><h1>AA Calc</h1><p>Page not found.</p><p><a href="${SITE}/">Home</a> · <a href="${SITE}/join.html">Join the test</a> · <a href="${SITE}/privacy.html">Privacy</a></p></main></body></html>\n`);
W('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
W('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.w3.org/2005/sitemap/0.9">\n${['', 'join.html', 'privacy.html'].map((p) => `  <url><loc>${SITE}/${p}</loc><lastmod>${cfg.policyDate}</lastmod></url>`).join('\n')}\n</urlset>\n`);
W('.nojekyll', '');
fs.writeFileSync(path.join(OUT, 'assets/strings.js'), '/* generated by scripts/build.mjs from src/strings.mjs and src/content.mjs: do not edit */\nwindow.SITE_STR = ' + JSON.stringify({ intro: INTRO, join: JOIN, titles: { index: Object.fromEntries(L.map((l) => [l, INTRO[l].title])), join: Object.fromEntries(L.map((l) => [l, JOIN[l].title])), privacy: priv.titles }, descs: { index: Object.fromEntries(L.map((l) => [l, INTRO[l].desc])), join: Object.fromEntries(L.map((l) => [l, JOIN[l].desc])) } }) + ';\n');
fs.writeFileSync(path.join(OUT, 'assets/join-qr.svg'), qrSvg);
for (const f of ['site.css', 'site.js', 'join.js', 'icon.svg', 'motion.css', 'motion.js']) fs.copyFileSync(path.join(SRC, 'assets', f), path.join(OUT, 'assets', f));
fs.mkdirSync(path.join(OUT, 'app'), { recursive: true }); for (const f of ['version.json']) { JSON.parse(fs.readFileSync(path.join(SRC, 'app', f), 'utf8')); fs.copyFileSync(path.join(SRC, 'app', f), path.join(OUT, 'app', f)); }   // the AA Calc app reads these two files (in-app update notice + notices/changelog)
fs.cpSync(path.join(SRC, 'assets/fonts'), path.join(OUT, 'assets/fonts'), { recursive: true }); fs.cpSync(path.join(SRC, 'assets/img'), path.join(OUT, 'assets/img'), { recursive: true });
console.log(`built docs/: 3 pages x ${L.length} languages (${L.join(', ')}); optInLive=${live}; policy date ${cfg.policyDate}`);
