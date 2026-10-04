# Working on this site

Static site for albright-innovations.com, deployed by Cloudflare Pages straight from this repo (no build step on their side).

- **Edit `src/`, then run the build.** `index.html`, `answers/**`, `about/`, `how-we-work/`, `sitemap.xml`, `llms.txt` and `llms-full.txt` are generated. Never hand-edit them.
- Build with the full Python path on this machine: `C:/Users/jsalb/AppData/Local/Programs/Python/Python310/python.exe build.py` (or `py -3 build.py`). Standard library only. A pre-commit hook in `.githooks/` runs it too.
- The build fails on brand-rule violations it can detect: the word "AI" in visible copy, a sentence starting with "And", a link that isn't a full `https://` address, a link to an answer slug that doesn't exist. Fix the source, don't bypass the check.
- Keep the design system: Archivo only, the color tokens in `css/site.css` only, no new colors. "We" voice everywhere except About ("I"). No emojis, guarantees, competitor names, jargon or invented testimonials/stats. Approved bio facts are listed in `README.md` and the original brief; don't name Josh's former employer.
- Every statistic needs a primary source link that returns 200. CallRail's 2025 survey numbers are deliberately absent (no primary page found); see the TODO in `src/home.html`.
- Calculator math lives only in `js/calc.js`; `tests/calc.html` runs its tests in a browser (open it on the local preview and read `document.title`). Node is not installed here.
- Preview locally with the `site` entry in `.claude/launch.json` (serves the repo root on port 8000).
- Share images come from `make_og.py` (needs Pillow and `src/fonts/Archivo-variable.ttf`); only rerun it if the wording changes.
