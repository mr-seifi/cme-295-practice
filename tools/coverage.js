const fs = require('fs'), vm = require('vm');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/figures.js', 'utf8'), ctx);
const q = {}; vm.createContext(q); vm.runInContext(fs.readFileSync('src/questions.js', 'utf8') + ';this.L=LECTURES', q);
const { FIG, NOFIG } = ctx.window.FIGS;
const kind = { static: 'static figure', dataviz: 'data visualization', stepper: 'step-through', interactive: 'interactive' };
const clean = s => s.replace(/<\/?[a-z][^>]*>/g, '').replace(/\|/g, '/');
const rows = ['| Q | Title | Visual (where) | What it teaches |', '|---|---|---|---|'];
let withFig = 0, n = 0; const counts = {};
for (const L of q.L) for (const e of L.ex) { n++;
  const f = FIG[e.id] || [];
  if (f.length) { withFig++; f.forEach(x => counts[x.kind] = (counts[x.kind] || 0) + 1);
    rows.push(`| ${e.id} | ${clean(e.title)} | ${f.map(x => `${kind[x.kind]} (${x.at === 'q' ? 'question' : 'solution'})`).join(' + ')} | ${f.map(x => clean(x.teaches)).join('; ')} |`); }
  else rows.push(`| ${e.id} | ${clean(e.title)} | text and math only | ${NOFIG[e.id] || 'MISSING REASON'} |`); }
const summary = `${n} questions · ${withFig} with visuals · ${n - withFig} text-and-math · figures by kind: ${Object.entries(counts).map(([k, v]) => `${kind[k]} ${v}`).join(', ')}`;
fs.writeFileSync('COVERAGE.md', `# Figure coverage\n\n${summary}\n\n${rows.join('\n')}\n`);
console.log(summary); console.log('missing reasons:', rows.filter(r => r.includes('MISSING')).length);
