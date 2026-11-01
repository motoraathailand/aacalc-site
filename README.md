# AA Calc site
Free static site for the AA Calc Android app (GitHub Pages, served from `docs/` on `main`): intro page, tester join page, privacy policy, in 5 languages (th, en, ko, zh, hi). Same pattern as moffee-site.
- Live: https://motoraathailand.github.io/aacalc-site/ · join: .../join.html · privacy: .../privacy.html
- Build: `node scripts/build.mjs` (sources in `src/`, settings in `config/site.json`) · Test: `node tests/site.test.mjs` (needs playwright-core + google-chrome)
- Intro buttons go to `join.html` (shared tester group motoraa-testers@googlegroups.com, then Play opt-in, then install). `optInLive` in `config/site.json` stays false until the closed test is published on Play (then true, rebuild, push).
- No delete-account page: the app has no accounts or sign-in.
- Licences: `LICENSES.md`. Contact: motoraathailand@gmail.com
- **The one switch for the Play opt-in step:** `optInLive` in `config/site.json`. `false` = on `/join` steps 3 (opt-in) and 4 (install) are dimmed, show a "Coming soon" badge and a note, and the status line says testing opens soon. `true` = both become real links (opt-in page, Play page) and the status line says testing is open. Nothing else changes. After flipping: `node scripts/build.mjs`, `node tests/site.test.mjs`, commit, push (`docs/` is what Pages serves). The test suite builds the `true` state into a temp dir (env `SITE_OUT` / `OPTIN_LIVE=1`, never committed) and checks both states.
- Assets: `src/assets/img/play/<lang>-1..6.webp` are the Play screenshots (`/workspace/aacalc/dist/play/<locale>/screenshots`, 480x853), `src/assets/video/promo-{en,ko,th}.mp4` + `img/poster-*.webp` are the 540x960 silent promo (from `dist/promo/*-silent.mp4`), `scripts/og-src/` + `node scripts/make-og.mjs` make the share card.
