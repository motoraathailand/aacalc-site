// Tests for the AA Calc static site (run after `node scripts/build.mjs`): node tests/site.test.mjs
// Static checks on docs/ + headless Chrome checks at phone size (needs playwright-core from /workspace/fieldreport and google-chrome).
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import { fileURLToPath, pathToFileURL } from 'node:url'; import { createRequire } from 'node:module';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), DOCS = path.join(ROOT, 'docs');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/site.json'), 'utf8'));
const { INTRO, JOIN } = await import(pathToFileURL(path.join(ROOT, 'src/strings.mjs')));
const { LANGS, makeContent } = await import(pathToFileURL(path.join(ROOT, 'src/content.mjs')));
const L = LANGS.map((x) => x[0]), C = makeContent({ OPERATOR: cfg.operator, EMAIL: cfg.contactEmail, UPDATED: cfg.policyDate, SITE: cfg.siteUrl });
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' :: ' + (x || ''))); };
const read = (f) => fs.readFileSync(path.join(DOCS, f), 'utf8');
for (const f of ['index.html', 'join.html', 'privacy.html', '404.html', 'robots.txt', 'sitemap.xml', 'app/version.json', 'assets/img/og.jpg', 'assets/img/hero.webp', 'assets/join-qr.svg']) ok('exists: ' + f, fs.existsSync(path.join(DOCS, f)));
ok('no delete-account page (no accounts in the app)', !fs.existsSync(path.join(DOCS, 'delete-account.html')));
const all = ['index.html', 'join.html', 'privacy.html', 'assets/strings.js', 'assets/site.js', 'assets/join.js'].map(read).join('\n') + JSON.stringify(INTRO) + JSON.stringify(JOIN);
ok('no leftover Moffee / cafe wording', !/moffee|cafemenu|coffee/i.test(all));
ok('no Samsung / One UI wording in any language (owner rule 2026-11-01)', !/samsung|삼성|ซัมซุง|三星|सैमसंग|one ?ui/i.test(all + ['index.html', 'join.html', 'privacy.html'].map(read).join('') + JSON.stringify(C.PRIVACY)));
ok('no old per-app group names', !/aaai-testers|nammanthuk-testers|moffee-testers|cafemenu-testers|suayshot-testers/.test(all));
ok('config: shared tester group only', cfg.groupEmail === 'motoraa-testers@googlegroups.com' && cfg.groupUrl === 'https://groups.google.com/g/motoraa-testers');
const idx = read('index.html'), join = read('join.html'), priv = read('privacy.html');
const ctas = [...idx.matchAll(/<a class="btn"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
ok('intro: every download/join button goes to join.html (not Play, not an APK)', ctas.length >= 2 && ctas.filter((h) => h === 'join.html').length >= 2 && !/play\.google\.com|\.apk/.test(idx), JSON.stringify(ctas));
ok('join: step 1 = shared group', join.includes(`href="${cfg.groupUrl}"`));
ok('join: step 2/3 = opt-in + store for com.motoraa.aacalc', join.includes(cfg.optInUrl) && join.includes(cfg.installUrl) && cfg.optInUrl.endsWith('com.motoraa.aacalc'));
ok('join: steps 2-3 locked while optInLive=false', cfg.optInLive ? true : (join.match(/data-locked/g) || []).length === 2);
ok('privacy: 5 language sections', L.every((l) => priv.includes(`id="s-${l}"`)));
for (const l of L) { const j = JSON.stringify(C.PRIVACY[l]); ok(`privacy ${l}: names open.er-api.com, AdMob, contact email, no login`, j.includes('open.er-api.com') && j.includes('AdMob') && j.includes(cfg.contactEmail) && j.includes('com.motoraa.aacalc')); }
ok('privacy: operator named', priv.includes(cfg.operator));
ok('intro page: 5-language strings complete', L.every((l) => Object.keys(INTRO.en).every((k) => INTRO[l][k] && String(INTRO[l][k]).trim())));
ok('join page: 5-language strings complete', L.every((l) => Object.keys(JOIN.en).every((k) => JOIN[l][k] !== undefined)));
ok('motion.css / motion.js are byte copies of the shared originals', ['motion.css', 'motion.js'].every((f) => fs.readFileSync(path.join(DOCS, 'assets', f)).equals(fs.readFileSync('/workspace/shared/motion/' + f))));
ok('version.json parses + package', JSON.parse(read('app/version.json')).packageName === 'com.motoraa.aacalc');
ok('sitemap lists 3 pages', (read('sitemap.xml').match(/<loc>/g) || []).length === 3);
ok('storage keys are app-specific (shared github.io origin)', /aacalc\.site\.lang/.test(read('assets/site.js')) && /aacalc\.join\.steps/.test(read('assets/join.js')));

// ---- browser ----
const { chromium } = createRequire('/workspace/fieldreport/package.json')('playwright-core');
const MIME = { html: 'text/html', js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png', json: 'application/json', woff2: 'font/woff2', txt: 'text/plain', xml: 'application/xml' };
const server = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (!p.startsWith('/aacalc-site/')) { r.writeHead(404); return r.end(); } p = p.slice('/aacalc-site'.length); if (p.endsWith('/')) p += 'index.html'; const f = path.join(DOCS, p); if (!f.startsWith(DOCS) || !fs.existsSync(f)) { r.writeHead(404); return r.end('nf'); } r.writeHead(200, { 'content-type': MIME[f.split('.').pop()] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(0, '127.0.0.1');
await new Promise((r) => server.on('listening', r));
const BASE = `http://127.0.0.1:${server.address().port}/aacalc-site/`;
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: true });
async function open(page, { languages = ['en-US'], storage = {}, ua, w = 360 } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: 740 }, locale: languages[0], isMobile: true, hasTouch: true, ...(ua ? { userAgent: ua } : {}) });
  await ctx.addInitScript(([langs, st]) => { Object.defineProperty(navigator, 'languages', { get: () => langs }); for (const k in st) localStorage.setItem(k, st[k]); }, [languages, storage]);
  const p = await ctx.newPage(); p._errs = []; p.on('pageerror', (e) => p._errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && p._errs.push(m.text()));
  await p.goto(BASE + page, { waitUntil: 'networkidle' }); await p.waitForTimeout(400); return p;
}
const langOf = (p) => p.evaluate(() => document.documentElement.getAttribute('data-lang'));
{ const p = await open('index.html', { languages: ['ko-KR'] }); ok('browser language ko -> Korean', (await langOf(p)) === 'ko' && /계산기/.test(await p.textContent('h1') + await p.textContent('.lead'))); ok('no console errors (intro ko)', p._errs.length === 0, p._errs.join('|')); await p.context().close(); }
{ const p = await open('index.html', { languages: ['fr-FR'] }); ok('unsupported language -> English', (await langOf(p)) === 'en'); await p.context().close(); }
{ const p = await open('index.html', { languages: ['zh-TW'] }); ok('zh-TW -> zh', (await langOf(p)) === 'zh'); await p.context().close(); }
{ const p = await open('index.html?lang=hi', { languages: ['th-TH'], storage: { 'aacalc.site.lang': 'ko' } }); ok('?lang beats saved beats browser', (await langOf(p)) === 'hi'); await p.context().close(); }
{ const p = await open('index.html', { languages: ['th-TH'], storage: { 'aacalc.site.lang': 'ko' } }); ok('saved choice beats browser language', (await langOf(p)) === 'ko'); await p.context().close(); }
for (const l of L) for (const pg of ['index.html', 'join.html', 'privacy.html']) {
  const p = await open(`${pg}?lang=${l}`, { w: 360 });
  const sw = await p.evaluate(() => document.documentElement.scrollWidth); ok(`${pg} ${l}: no horizontal overflow at 360px`, sw <= 360, sw);
  ok(`${pg} ${l}: no console errors`, p._errs.length === 0, p._errs.join('|')); await p.context().close();
}
{ const p = await open('index.html?lang=en'); const hrefs = await p.$$eval('a.btn', (a) => a.map((x) => x.getAttribute('href'))); ok('live intro: buttons href join.html?lang=en or join.html', hrefs.filter((h) => h !== '#features').every((h) => /^join\.html(\?lang=en)?$/.test(h)), hrefs.join()); await p.context().close(); }
{ const p = await open('join.html?lang=en'); const locked = await p.$$eval('[data-locked]', (e) => e.length); ok('join: 2 locked steps, group step open', locked === 2 && (await p.$eval('#c1 a.btn', (a) => a.href)) === cfg.groupUrl); ok('join: iab hint hidden in normal browser', await p.$eval('#iab', (e) => e.hidden)); await p.context().close(); }
{ const p = await open('join.html?lang=ko', { ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0]' }); ok('join: in-app browser shows the open-in-Chrome hint (ko)', !(await p.$eval('#iab', (e) => e.hidden)) && /^intent:\/\//.test(await p.$eval('#iabOpen', (a) => a.getAttribute('href'))) && /Chrome/.test(await p.textContent('[data-t=iabT]'))); await p.context().close(); }
{ const p = await open('index.html?lang=en'); await p.emulateMedia({ reducedMotion: 'reduce' }); await p.reload({ waitUntil: 'networkidle' }); const n = await p.evaluate(() => document.getAnimations().length); ok('reduced motion: no running animations', n === 0, n); await p.context().close(); }
{ const p = await open('privacy.html?lang=en'); ok('privacy: all visible English sections, others hidden', (await p.$$eval('section.lg', (s) => s.filter((x) => x.offsetParent !== null).length)) === 1); await p.context().close(); }
await b.close(); server.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
