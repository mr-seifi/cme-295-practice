# CME 295 Practice

An independent practice companion for Stanford's **[CME 295: Transformers & Large Language Models](https://cme295.stanford.edu/)** (Fall 2026), taught by Afshine and Shervine Amidi. The course material is excellent but has little practice, so this site adds:

- **110 questions** across the 8 lectures (calculations graded instantly, concept checks, ordering tasks, open questions with model answers), 99 of them with a figure, step-through or interactive illustration
- **5 playgrounds**: attention, multi-head attention, decoding, pass@k and masked diffusion
- **8 NumPy labs** with starter code, built-in tests and reference solutions

**Live site:** https://aminseifi.com/cme295/

> Not affiliated with or endorsed by Stanford University or the course staff. Questions follow the topics and running examples of the public course slides; no slide content is redistributed here.

## Repository layout

| Path | What it is |
| --- | --- |
| `src/questions.js` | The question bank: text, LaTeX equations, answers, tolerances, hints and worked solutions |
| `src/figures.js` | Figure toolkit and the per-question figures |
| `src/reader.html` | Page template: styles, routing, grading, review queue, playgrounds, lab pages |
| `labs/lab1.py` … `lab8.py` | Labs. Code between `# BEGIN SOLUTION` / `# END SOLUTION` is the reference; the build turns it into `raise NotImplementedError("TODO")` for the starter |
| `tools/render-math.js` | Pre-renders all math with KaTeX at build time |
| `tools/coverage.js` | Regenerates `COVERAGE.md`, the question-by-question figure table |
| `build.py` | Builds `site/standalone/` (the deployable site) |
| `tests/` | Browser tests (`verify.js`) and a cell-by-cell check of the multi-head playground against NumPy and PyTorch |

## Build locally

Requires Node 18+ and Python 3.9+ with NumPy.

```bash
npm ci
python3 build.py                       # writes site/standalone/
cd site/standalone && python3 -m http.server 8765
# open http://127.0.0.1:8765/
```

Run the tests:

```bash
npm run test:labs                      # every lab's reference solution passes its tests
npx playwright-core install chromium-headless-shell
node tests/verify.js http://127.0.0.1:8765/
```

## Deployment

Every push to `main` runs `.github/workflows/pages.yml`: it checks the labs, builds the site, runs the browser tests and publishes `site/standalone/` to GitHub Pages. One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Contributing

Found a wrong answer, unclear wording or a missing topic? Open an issue or a pull request. For a new question, add it to `src/questions.js` (and a figure in `src/figures.js` if it helps), then run the build and tests.

## License

Code and original exercise content: MIT (see `LICENSE`). Course names belong to their owners.
