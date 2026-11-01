# AA Calc site
Free static site for the AA Calc Android app (GitHub Pages, served from `docs/` on `main`): intro page, tester join page, privacy policy, in 5 languages (th, en, ko, zh, hi). Same pattern as moffee-site.
- Live: https://motoraathailand.github.io/aacalc-site/ · join: .../join.html · privacy: .../privacy.html
- Build: `node scripts/build.mjs` (sources in `src/`, settings in `config/site.json`) · Test: `node tests/site.test.mjs` (needs playwright-core + google-chrome)
- Intro buttons go to `join.html` (shared tester group motoraa-testers@googlegroups.com, then Play opt-in, then install). `optInLive` in `config/site.json` stays false until the closed test is published on Play (then true, rebuild, push).
- No delete-account page: the app has no accounts or sign-in.
- Licences: `LICENSES.md`. Contact: motoraathailand@gmail.com
