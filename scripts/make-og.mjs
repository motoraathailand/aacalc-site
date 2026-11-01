// Dev tool (not run by the build): renders src/assets/img/og.jpg (1200x630 share card) with headless Chrome.
//   needs: playwright-core (from /workspace/fieldreport) + google-chrome.   Usage: node scripts/make-og.mjs
import { createRequire } from 'node:module'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import fs from 'node:fs';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), A = path.join(ROOT, 'src/assets');
const { chromium } = createRequire('/workspace/fieldreport/package.json')('playwright-core');
const css = fs.readFileSync(path.join(A, 'site.css'), 'utf8').split('\n').filter((l) => l.startsWith('@font-face')).join('\n').replace(/url\(fonts\//g, 'url(file://' + A + '/fonts/');
const html = `<!doctype html><meta charset=utf-8><style>${css}
body{margin:0;width:1200px;height:630px;background:radial-gradient(700px 400px at 90% -10%,rgba(61,220,151,.30),transparent 65%),#0d2a1e;color:#f2fbf6;font-family:'IBM Plex Sans','IBM Plex Sans Thai',sans-serif;display:flex;align-items:center;gap:10px;padding:0 0 0 70px;box-sizing:border-box;overflow:hidden}
.t{flex:1}.k{color:#3ddc97;font-weight:600;letter-spacing:.06em;text-transform:uppercase;font-size:22px}h1{font-size:104px;line-height:1;margin:14px 0 18px;letter-spacing:-.03em}p{font-size:36px;line-height:1.3;margin:0;color:rgba(242,251,246,.88)}
.i{display:flex;gap:14px;margin-top:34px}.i b{padding:8px 20px;border-radius:99px;background:rgba(255,255,255,.1);color:#3ddc97;font-size:24px;font-weight:600}
img{width:640px;height:512px;margin-right:-40px}</style>
<div class=t><div class=k>Calculator · Units · Currency</div><h1>AA Calc</h1><p>Offline currency &amp;<br>unit converter</p><div class=i><b>No login</b><b>Works offline</b></div></div>
<img src="file://${A}/img/hero.webp">`;
fs.writeFileSync('/tmp/og.html', html);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--allow-file-access-from-files'], headless: true });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } }); await p.goto('file:///tmp/og.html'); await p.waitForTimeout(600);
await p.screenshot({ path: path.join(A, 'img/og.jpg'), type: 'jpeg', quality: 86 }); await b.close(); console.log('og.jpg written');
