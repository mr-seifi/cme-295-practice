// Usage: node tests/multihead-dump.js http://127.0.0.1:8765/ .tmp/mh.json && python3 tests/multihead-check.py .tmp/mh.json
// Dump every matrix and readout the multi-head playground shows, across configurations.
const { chromium } = require('playwright-core'); const fs = require('fs');
(async () => { const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1360, height: 1000 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.argv[2] + '#play-multihead'); await p.waitForTimeout(200);
  const tbl = sel => p.$$eval(sel + ' table', ts => ts.map(t => [...t.querySelectorAll('tr')].map(r => [...r.querySelectorAll('td')].map(td => td.textContent.trim())).filter(r => r.length)));
  const readouts = async (st, proj) => { const out = []; const cells = await p.$$(`[data-st="${st}"]`);
    for (let n = 0; n < cells.length; n++) { const c = (await p.$$(`[data-st="${st}"]`))[n]; await c.click(); const i = await c.getAttribute('data-i'), j = await c.getAttribute('data-j');
      out.push({ st, proj, i: +i, j: +j, cell: (await c.textContent()).trim(), text: await p.textContent('#pm-r' + st) }); } return out; };
  const runs = [];
  const capture = async label => {
    const h = +(await p.getAttribute('#pm-h [aria-checked="true"]', 'data-h')), causal = await p.isChecked('#pm-causal'), d = +(await p.inputValue('#pm-d')), dk = +(await p.textContent('#pm-kv')), dkSlider = +(await p.inputValue('#pm-k')); if (dk !== dkSlider) console.log('SLIDER MISMATCH', label, dk, dkSlider);
    const X = await p.$$eval('[data-x]', es => es.map(e => e.value));
    for (let f = 0; f < h; f++) { await p.click(`#pm-f [data-f="${f}"]`);
      const r = { label, h, d, dk, causal, f, X, proj: {}, reads: [] };
      for (const k of ['Q', 'K', 'V']) { await p.click(`#pm-proj [data-proj="${k}"]`); const [Xs, W, P] = await tbl('#pm-s1'); r.proj[k] = { W, P }; r.Xshown = Xs; r.reads.push(...await readouts(1, k)); }
      [r.Qs, r.KT, r.S] = await tbl('#pm-s2'); [r.S3, r.A] = await tbl('#pm-s3'); [r.A3, r.V3, r.H] = await tbl('#pm-s4'); [r.Cat, r.WO, r.Out] = await tbl('#pm-s5');
      for (const st of [2, 3, 4, 5]) r.reads.push(...await readouts(st));
      r.params = await p.textContent('#pm-params'); runs.push(r); } };
  await capture('default');
  await p.click('#pm-h [data-h="4"]'); await capture('h4');
  await p.click('#pm-h [data-h="1"]'); await capture('h1');
  await p.click('#pm-h [data-h="2"]'); await p.check('#pm-causal'); await capture('h2-causal');
  await p.click('#pm-h [data-h="4"]'); await capture('h4-causal');
  await p.uncheck('#pm-causal'); await p.click('#pm-h [data-h="2"]'); await p.click('#pm-rand'); await capture('rand1');
  await p.click('#pm-rand'); await p.click('#pm-h [data-h="4"]'); await capture('rand2-h4');
  for (const [i, j, v] of [[0, 0, '2'], [1, 2, '-1.5'], [2, 3, '0.25'], [0, 3, '3']]) await p.fill(`[data-x="${i}"][data-j="${j}"]`, v);
  await p.check('#pm-causal'); await capture('editX-causal');
  const setR = async (id, v) => { await p.$eval(id, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, String(v)); };
  await setR('#pm-d', 6); await p.click('#pm-h [data-h="3"]'); await capture('d6-h3');
  await p.click('#pm-h [data-h="2"]'); await capture('d6-h2-causal');
  await setR('#pm-d', 5); await capture('d5 (h snaps)');
  await setR('#pm-d', 2); await p.uncheck('#pm-causal'); await capture('d2');
  await p.uncheck('#pm-tie'); await setR('#pm-d', 3); await p.click('#pm-h [data-h="2"]'); await setR('#pm-k', 4); await capture('untied d3 h2 dk4');
  await p.click('#pm-h [data-h="4"]'); await setR('#pm-k', 1); await p.check('#pm-causal'); await capture('untied d3 h4 dk1 causal');
  await setR('#pm-d', 6); await p.click('#pm-h [data-h="1"]'); await setR('#pm-k', 3); await p.click('#pm-rand'); await capture('untied d6 h1 dk3');
  await p.check('#pm-tie'); await capture('retied');
  await p.click('.pg-reset'); await capture('after-reset');
  fs.writeFileSync(process.argv[3], JSON.stringify({ runs, errs })); console.log('runs', runs.length, 'readouts', runs.reduce((a, r) => a + r.reads.length, 0), 'page errors', errs.length);
  await b.close(); })();
