// Pre-render all $...$ / $$...$$ math in the question bank with KaTeX (HTML + MathML), output JSON.
const fs = require('fs'), vm = require('vm'), path = require('path');
const katex = require('katex');
const src = fs.readFileSync(process.argv[2], 'utf8');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(src + '\nthis.LECTURES = LECTURES; this.PLAYGROUND_FOR = PLAYGROUND_FOR;', ctx);
const opts = (display) => ({ displayMode: display, throwOnError: true, output: 'htmlAndMathml', strict: 'ignore',
  trust: c => c.command === '\\htmlClass', macros: {} });
let count = 0;
function tex(s, display) { count++; return katex.renderToString(s.trim(), opts(display)); }
function md(s) {
  if (typeof s !== 'string') return s;
  const DOLLAR = '\u0000D';
  s = s.replace(/\\\$/g, DOLLAR);
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => `<div class="eq eq-inline-display">${tex(m, true)}</div>`);
  s = s.replace(/\$([^$]+?)\$/g, (_, m) => tex(m, false));
  return s.replace(/\u0000D/g, '$');
}
const out = JSON.parse(JSON.stringify(ctx.LECTURES));
for (const L of out) for (const e of L.ex) {
  for (const k of ['q', 'sol', 'hint', 'unit']) if (e[k]) e[k] = md(e[k]);
  if (e.opts) e.opts = e.opts.map(md);
  if (e.rubric) e.rubric = e.rubric.map(md);
  if (e.eq) e.eq = e.eq.map(x => tex(x, true));
}
fs.writeFileSync(process.argv[3], JSON.stringify({ LECTURES: out, PLAYGROUND_FOR: ctx.PLAYGROUND_FOR }));
console.error(`rendered ${count} formulas`);
