// Figure library + one entry per question that benefits from a visual.
// FIG[id] = [{ at: "q" | "sol", kind: "static" | "dataviz" | "stepper" | "interactive", teaches, caption, render(el) }]
// NOFIG[id] = reason text and math alone suffice.
(() => {
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const f2 = (x, d = 2) => Number(x).toFixed(d);
const softmax = (z, T = 1) => { const a = z.map(x => x / T), m = Math.max(...a), e = a.map(x => Math.exp(x - m)), s = e.reduce((p, c) => p + c, 0); return e.map(x => x / s); };
const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
let uid = 0;

// ---------- primitives ----------
function tok(t, o = {}) { return `<span class="tk ${o.cls || ""}" ${o.title ? `title="${esc(o.title)}"` : ""}>${o.raw ? t : esc(t)}${o.sub != null ? `<small>${o.sub}</small>` : ""}</span>`; }
function toks(list, o = {}) { return `<div class="tks ${o.cls || ""}">${list.map(x => typeof x === "string" ? tok(x) : tok(x.t, x)).join("")}</div>`; }
function legend(items) { return `<div class="lgd">${items.map(([cls, t]) => `<span><i class="sw ${cls}"></i>${t}</span>`).join("")}</div>`; }
function chip(t, cls = "") { return `<span class="chipf ${cls}">${t}</span>`; }
function shape(t) { return `<span class="shp">${t}</span>`; }
function pipe(nodes, o = {}) {
  return `<div class="pipe ${o.vertical ? "vert" : ""}">${nodes.map((n, i) => (i ? `<span class="pipe-arrow" aria-hidden="true">${n.edge ? `<em>${n.edge}</em>` : ""}</span>` : "") +
    `<div class="pipe-node ${n.cls || ""}"><b>${n.t}</b>${n.s ? `<span>${n.s}</span>` : ""}${n.shape ? shape(n.shape) : ""}</div>`).join("")}</div>`;
}
function bars(items, o = {}) {
  const max = o.max ?? Math.max(...items.map(x => Math.abs(x.v)), 1e-9);
  const fmt = o.fmt || (v => f2(v, 3));
  const diverge = items.some(x => x.v < 0);
  return `<div class="hb ${diverge ? "div" : ""}">${items.map(x => {
    const w = Math.min(100, Math.abs(x.v) / max * (diverge ? 50 : 100));
    const st = diverge ? (x.v < 0 ? `right:50%;width:${w}%` : `left:50%;width:${w}%`) : `width:${w}%`;
    return `<div class="hb-row ${x.cls || ""}"><span class="hb-l">${x.l}</span><span class="hb-t">${diverge ? `<i class="hb-zero"></i>` : ""}<i class="hb-f ${x.fill || ""}" style="${st}"></i>${x.ghost != null ? `<i class="hb-g" style="width:${Math.min(100, x.ghost / max * 100)}%"></i>` : ""}</span><span class="hb-v">${x.vt ?? fmt(x.v)}</span></div>`;
  }).join("")}</div>`;
}
function matrix(o) { // o: rows, cols, cell(i,j)->{t, cls, fill(0..1)}, rowTitle, colTitle, small
  const head = `<tr><th class="mx-corner">${o.corner || ""}</th>${o.cols.map(c => `<th scope="col" class="mx-col">${c}</th>`).join("")}${o.rowNote ? `<th class="mx-note"></th>` : ""}</tr>`;
  const body = o.rows.map((r, i) => `<tr><th scope="row" class="mx-row">${r}</th>${o.cols.map((_, j) => { const c = o.cell(i, j) || {};
    return `<td class="mx-c ${c.cls || ""}" style="${c.fill != null ? `--a:${c.fill.toFixed(3)}` : ""}">${c.t ?? ""}</td>`; }).join("")}${o.rowNote ? `<td class="mx-note">${o.rowNote(i)}</td>` : ""}</tr>`).join("");
  return `<div class="mx-wrap ${o.small ? "small" : ""}">${o.colTitle ? `<div class="mx-ct">${o.colTitle} →</div>` : ""}<div class="mx-inner">${o.rowTitle ? `<div class="mx-rt">${o.rowTitle} ↓</div>` : ""}<table class="mx" ${o.label ? `aria-label="${esc(o.label)}"` : ""}>${head}${body}</table></div></div>`;
}
function arrowSVG(x1, y1, x2, y2, cls = "", w = 1.6) {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 8, s = 4;
  const bx = x2 - L * Math.cos(a), by = y2 - L * Math.sin(a);
  return `<line class="ar ${cls}" x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke-width="${w}"/><polygon class="arh ${cls}" points="${x2},${y2} ${bx - s * Math.sin(a)},${by + s * Math.cos(a)} ${bx + s * Math.sin(a)},${by - s * Math.cos(a)}"/>`;
}
function plot(o) {
  const W = o.w || 540, H = o.h || 260, L = o.padL || 52, Rr = 16, T = 14, B = 40;
  const ax = o.x, ay = o.y;
  const map = (a, v, lo, hi) => a.log ? (Math.log10(v) - Math.log10(a.min)) / (Math.log10(a.max) - Math.log10(a.min)) * (hi - lo) + lo : (v - a.min) / (a.max - a.min) * (hi - lo) + lo;
  const X = v => map(ax, v, L, W - Rr), Y = v => map(ay, v, H - B, T);
  const fx = ax.fmt || (v => v), fy = ay.fmt || (v => v);
  let s = `<rect class="pl-bg" x="${L}" y="${T}" width="${W - L - Rr}" height="${H - T - B}"/>`;
  (ax.grid || ax.ticks).forEach(v => s += `<line class="pl-grid" x1="${X(v)}" x2="${X(v)}" y1="${T}" y2="${H - B}"/>`);
  (ay.grid || ay.ticks).forEach(v => s += `<line class="pl-grid" y1="${Y(v)}" y2="${Y(v)}" x1="${L}" x2="${W - Rr}"/>`);
  ax.ticks.forEach(v => s += `<text class="pl-t" x="${X(v)}" y="${H - B + 16}" text-anchor="middle">${fx(v)}</text>`);
  ay.ticks.forEach(v => s += `<text class="pl-t" x="${L - 7}" y="${Y(v) + 4}" text-anchor="end">${fy(v)}</text>`);
  s += `<line class="pl-axis" x1="${L}" x2="${W - Rr}" y1="${H - B}" y2="${H - B}"/><line class="pl-axis" x1="${L}" x2="${L}" y1="${T}" y2="${H - B}"/>`;
  if (ax.label) s += `<text class="pl-al" x="${(L + W - Rr) / 2}" y="${H - 6}" text-anchor="middle">${ax.label}</text>`;
  if (ay.label) s += `<text class="pl-al" transform="translate(13 ${(T + H - B) / 2}) rotate(-90)" text-anchor="middle">${ay.label}</text>`;
  (o.areas || []).forEach(a => s += `<rect class="pl-area ${a.cls || ""}" x="${X(a.x0)}" y="${T}" width="${X(a.x1) - X(a.x0)}" height="${H - T - B}"/>` + (a.label ? `<text class="pl-note" x="${(X(a.x0) + X(a.x1)) / 2}" y="${T + 13}" text-anchor="middle">${a.label}</text>` : ""));
  (o.hlines || []).forEach(h => s += `<line class="pl-ref ${h.cls || ""}" x1="${L}" x2="${W - Rr}" y1="${Y(h.y)}" y2="${Y(h.y)}"/>` + (h.label ? `<text class="pl-note" x="${W - Rr - 4}" y="${Y(h.y) - 5}" text-anchor="end">${h.label}</text>` : ""));
  (o.vlines || []).forEach(h => s += `<line class="pl-ref ${h.cls || ""}" y1="${T}" y2="${H - B}" x1="${X(h.x)}" x2="${X(h.x)}"/>` + (h.label ? `<text class="pl-note" x="${X(h.x) + 5}" y="${T + 13}">${h.label}</text>` : ""));
  (o.series || []).forEach(se => {
    if (se.bars) se.pts.forEach(([x, y]) => s += `<rect class="pl-bar ${se.cls || ""}" x="${X(x) - (se.bw || 8) / 2}" y="${Math.min(Y(y), Y(0))}" width="${se.bw || 8}" height="${Math.abs(Y(0) - Y(y))}"/>`);
    else s += `<polyline class="pl-line ${se.cls || ""} ${se.dash ? "dash" : ""} ${se.step ? "" : ""}" points="${se.pts.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(" ")}"/>`;
  });
  (o.dots || []).forEach(d => s += `<circle class="pl-dot ${d.cls || ""}" cx="${X(d.x)}" cy="${Y(d.y)}" r="${d.r || 4.5}"/>` + (d.label ? `<text class="pl-lab ${d.cls || ""}" x="${X(d.x) + (d.dx ?? 8)}" y="${Y(d.y) + (d.dy ?? -8)}" text-anchor="${d.anchor || "start"}">${d.label}</text>` : ""));
  const lg = (o.series || []).filter(x => x.label).map(x => [`${x.cls || ""} ${x.dash ? "dash" : ""} line`, x.label]);
  return `<div class="pl-wrap"><svg class="pl" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || "")}">${s}</svg></div>${lg.length ? legend(lg) : ""}`;
}
const range = (a, b, st = 1) => { const r = []; for (let x = a; x <= b + 1e-9; x += st) r.push(+x.toFixed(6)); return r; };

// Stepper: user-controlled steps with reset; reduced-motion users get all steps by default.
function stepper(el, steps, frame, o = {}) {
  const id = "stp" + (++uid);
  el.innerHTML = `<div class="stp">
    <div class="stp-bar" role="group" aria-label="Step controls">
      <button type="button" class="btn sm" data-s="prev" aria-label="Previous step">← Back</button>
      <button type="button" class="btn sm primary" data-s="next" aria-label="Next step">Next step →</button>
      <button type="button" class="btn sm ghost" data-s="reset">Reset</button>
      <label class="stp-all"><input type="checkbox" data-s="all" id="${id}-all"> Show all steps</label>
    </div>
    <ol class="stp-track" aria-hidden="true">${steps.map((s, i) => `<li data-i="${i}">${i + 1}. ${s.t}</li>`).join("")}</ol>
    <div class="stp-stage"></div>
    <p class="stp-cap" aria-live="polite"></p></div>`;
  let i = 0, all = reduce();
  const stage = el.querySelector(".stp-stage"), cap = el.querySelector(".stp-cap");
  el.querySelector('[data-s="all"]').checked = all;
  const draw = () => {
    el.querySelectorAll(".stp-track li").forEach((li, j) => { li.classList.toggle("on", !all && j === i); li.classList.toggle("done", !all && j < i); });
    if (all) { stage.innerHTML = steps.map((s, j) => `<section class="stp-frame"><h5>Step ${j + 1} · ${s.t}</h5>${frame(j)}<p class="stp-c">${s.c}</p></section>`).join(""); cap.textContent = ""; }
    else { stage.innerHTML = frame(i); cap.innerHTML = `<b>Step ${i + 1} of ${steps.length} · ${steps[i].t}.</b> ${steps[i].c}`; }
    el.querySelector('[data-s="prev"]').disabled = all || i === 0;
    el.querySelector('[data-s="next"]').disabled = all || i === steps.length - 1;
    o.after && o.after(stage, all ? -1 : i);
  };
  el.addEventListener("click", e => { const b = e.target.closest("[data-s]"); if (!b || b.dataset.s === "all") return;
    if (b.dataset.s === "next" && i < steps.length - 1) i++; else if (b.dataset.s === "prev" && i > 0) i--; else if (b.dataset.s === "reset") i = 0; draw(); });
  el.querySelector('[data-s="all"]').addEventListener("change", e => { all = e.target.checked; draw(); });
  el.addEventListener("keydown", e => { if (all || e.target.matches("input,textarea")) return; if (e.key === "ArrowRight" && i < steps.length - 1) { i++; draw(); e.preventDefault(); } if (e.key === "ArrowLeft" && i > 0) { i--; draw(); e.preventDefault(); } });
  draw();
}
// Interactive: controls next to the output, a reset button, live readouts (no hover needed).
function interactive(el, controls, render) {
  const id = "ix" + (++uid);
  const init = Object.fromEntries(controls.map(c => [c.k, c.v]));
  el.innerHTML = `<div class="ix"><div class="ix-ctl">${controls.map(c => c.type === "seg"
      ? `<div class="ix-row"><span class="ix-l" id="${id}-${c.k}">${c.l}</span><div class="seg-g" role="radiogroup" aria-labelledby="${id}-${c.k}">${c.opts.map(([v, t]) => `<button type="button" role="radio" class="segb" data-k="${c.k}" data-v="${v}">${t}</button>`).join("")}</div></div>`
      : `<div class="ix-row"><label class="ix-l" for="${id}-${c.k}">${c.l}</label><input type="range" id="${id}-${c.k}" data-k="${c.k}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.v}"><output class="ix-v" for="${id}-${c.k}"></output></div>`).join("")}
      <button type="button" class="btn sm ghost ix-reset">Reset</button></div><div class="ix-out" aria-live="polite"></div></div>`;
  const st = { ...init };
  const draw = () => {
    controls.forEach(c => { if (c.type === "seg") el.querySelectorAll(`[data-k="${c.k}"]`).forEach(b => b.setAttribute("aria-checked", String(b.dataset.v == st[c.k])));
      else { const inp = el.querySelector(`input[data-k="${c.k}"]`); inp.value = st[c.k]; inp.nextElementSibling.textContent = c.fmt ? c.fmt(+st[c.k]) : st[c.k]; } });
    el.querySelector(".ix-out").innerHTML = render(Object.fromEntries(Object.entries(st).map(([k, v]) => [k, isNaN(+v) ? v : +v])));
  };
  el.addEventListener("input", e => { const k = e.target.dataset.k; if (k) { st[k] = e.target.value; draw(); } });
  el.addEventListener("click", e => { const b = e.target.closest(".segb"); if (b) { st[b.dataset.k] = b.dataset.v; draw(); }
    if (e.target.closest(".ix-reset")) { Object.assign(st, init); draw(); } });
  el.addEventListener("keydown", e => { const b = e.target.closest(".segb"); if (!b || !["ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const sib = [...el.querySelectorAll(`.segb[data-k="${b.dataset.k}"]`)]; const j = sib.indexOf(b) + (e.key === "ArrowRight" ? 1 : -1);
    if (sib[j]) { sib[j].focus(); sib[j].click(); e.preventDefault(); } });
  draw();
}
function vecPlot(vectors, o = {}) { // 2D vector diagram with labeled arrows on a fine grid
  const W = o.w || 300, H = o.h || 260, S = o.scale || 60, cx = o.cx || 70, cy = o.cy || H - 60;
  let s = "";
  for (let gx = cx % 20; gx < W; gx += 20) s += `<line class="pl-grid" x1="${gx}" x2="${gx}" y1="0" y2="${H}"/>`;
  for (let gy = cy % 20; gy < H; gy += 20) s += `<line class="pl-grid" y1="${gy}" y2="${gy}" x1="0" x2="${W}"/>`;
  s += `<line class="pl-axis" x1="0" x2="${W}" y1="${cy}" y2="${cy}"/><line class="pl-axis" x1="${cx}" x2="${cx}" y1="0" y2="${H}"/>`;
  vectors.forEach(v => { const x = cx + v.x * S, y = cy - v.y * S; s += arrowSVG(cx, cy, x, y, v.cls, 2.2) + `<text class="pl-lab ${v.cls}" x="${x + (v.dx ?? 6)}" y="${y + (v.dy ?? -6)}">${v.l}</text>`; });
  return `<svg class="pl vec" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || "")}">${s}</svg>`;
}
function unitCircles(angles, labels, o = {}) {
  const R = 46, W = angles.length * 120;
  let s = "";
  angles.forEach((a, i) => { const cx = 60 + i * 120, cy = 62;
    s += `<circle class="uc" cx="${cx}" cy="${cy}" r="${R}"/><line class="pl-grid" x1="${cx - R}" x2="${cx + R}" y1="${cy}" y2="${cy}"/><line class="pl-grid" x1="${cx}" x2="${cx}" y1="${cy - R}" y2="${cy + R}"/>`;
    s += `<path class="uc-arc" d="M ${cx + 16} ${cy} A 16 16 0 ${(a % (2 * Math.PI)) > Math.PI ? 1 : 0} 0 ${cx + 16 * Math.cos(a)} ${cy - 16 * Math.sin(a)}"/>`;
    s += arrowSVG(cx, cy, cx + R * Math.cos(a), cy - R * Math.sin(a), o.cls || "s-acc", 2.2);
    s += `<text class="pl-t" x="${cx}" y="${cy + R + 18}" text-anchor="middle">${labels[i]}</text>`; });
  return `<div class="pl-wrap"><svg class="pl" viewBox="0 0 ${W} ${150}" role="img" aria-label="${esc(o.aria || "rotation of each pair")}">${s}</svg></div>`;
}

// ---------- figures ----------
const FIG = {}, NOFIG = {};
const add = (id, f) => (FIG[id] ||= []).push(f);
const TEDDY = ["a", "cute", "teddy", "bear", "is", "reading"];

// ===== Lecture 1 =====
add("1.1", { at: "q", kind: "static", teaches: "How text maps to subword tokens and IDs", caption: "One sentence through a BPE-style tokenizer: original text, token boundaries and IDs line up. IDs are illustrative.",
  render: el => { const t = [["a", 64], ["▁cute", 13214], ["▁teddy", 50412], ["▁bear", 11358], ["▁is", 318], ["▁un", 555], ["believ", 6447], ["ably", 1346], ["▁reading", 5520]];
    el.innerHTML = `<div class="tokmap"><div class="tm-row"><span class="tm-h">Text</span><span class="tm-text">a cute teddy bear is unbelievably reading</span></div>
      <div class="tm-row"><span class="tm-h">Tokens</span>${toks(t.map(([s, id]) => ({ t: s, sub: id, cls: s === "believ" || s === "▁un" || s === "ably" ? "s-acc" : "" })))}</div>
      <div class="tm-row"><span class="tm-h">IDs</span><code class="tm-ids">[${t.map(x => x[1]).join(", ")}]</code></div></div>
      <p class="fig-note">"▁" marks a token that starts a new word. The rare word "unbelievably" splits into three known pieces (highlighted).</p>`; } });
add("1.1", { at: "sol", kind: "static", teaches: "Trade-off between vocabulary size and sequence length", caption: "The same word under three tokenizers.",
  render: el => el.innerHTML = matrix({ rows: ["Word-level", "Subword (BPE)", "Character"], cols: ["Tokens for “unbelievably”", "Sequence length", "Vocabulary", "Unknown words"],
    cell: (i, j) => ({ t: [[toks([{ t: "[UNK]", cls: "s-bad" }]), "1", "huge (≥ 10⁶)", "<b class='s-bad'>✗ become [UNK]</b>"], [toks(["▁un", "believ", "ably"]), "3", "~32k–200k", "<b class='s-good'>✓ split into pieces</b>"], [toks("unbelievably".split("")), "12", "~100s", "<b class='s-good'>✓ none</b>"]][i][j] }) }) });

add("1.2", { at: "q", kind: "static", teaches: "An embedding lookup is a row selection from a |V| × d table", caption: "Lookup of one token ID in the embedding table E ∈ ℝ^{|V|×d}.",
  render: el => el.innerHTML = `<div class="emb"><div class="emb-in">${toks([{ t: "teddy", sub: "id 3,421", cls: "s-q" }])}<span class="emb-arr">→ row 3,421 →</span></div>
    <div class="emb-table" role="img" aria-label="Embedding table with 50,000 rows and 768 columns; row 3,421 highlighted">
      <div class="emb-dim top">d = 768 columns</div><div class="emb-grid">${range(0, 13).map(r => `<div class="emb-r ${r === 6 ? "on" : ""}">${r === 6 ? "<span>row 3,421</span>" : ""}</div>`).join("")}</div><div class="emb-dim side">|V| = 50,000 rows</div></div>
    <div class="emb-out">${shape("e<sub>teddy</sub> ∈ ℝ<sup>768</sup>")}</div></div>` });

add("1.3", { at: "q", kind: "static", teaches: "What one skip-gram window produces", caption: "Window of 2 around the center word “teddy” gives 4 (center, context) pairs.",
  render: el => el.innerHTML = toks(TEDDY.map((w, i) => ({ t: w, cls: i === 2 ? "s-acc solid" : Math.abs(i - 2) <= 2 ? "s-q" : "" }))) +
    `<p class="fig-note">${["a", "cute", "bear", "is"].map(c => `(teddy, ${c})`).join(" · ")}</p>` + legend([["s-acc", "center"], ["s-q", "context within ±2"]]) });
add("1.3", { at: "sol", kind: "stepper", teaches: "Edge tokens have fewer neighbors; running count reaches 18", caption: "Slide the center across the sentence and count pairs.",
  render: el => { const cnt = TEDDY.map((_, i) => [i - 2, i - 1, i + 1, i + 2].filter(j => j >= 0 && j < 6).length); let run = 0; const cum = cnt.map(c => run += c);
    stepper(el, TEDDY.map((w, i) => ({ t: `center “${w}”`, c: `${cnt[i]} context words in range, running total ${cum[i]}.` })),
      i => toks(TEDDY.map((w, j) => ({ t: w, cls: j === i ? "s-acc solid" : Math.abs(j - i) <= 2 ? "s-q" : "dim" }))) + `<div class="tally">${cnt.map((c, j) => `<span class="${j <= i ? "on" : ""}">${c}</span>`).join(" + ")} = <b>${cum[i]}</b></div>`); } });

add("1.4", { at: "q", kind: "static", teaches: "Backprop through time multiplies one factor per step", caption: "Each backward step through the recurrence scales the gradient by 0.9.",
  render: el => el.innerHTML = `<div class="chain">${["h<sub>t−50</sub>", "…", "h<sub>t−2</sub>", "h<sub>t−1</sub>", "h<sub>t</sub>"].map((h, i) => (i ? `<span class="chain-e">× 0.9</span>` : "") + `<span class="chain-n ${i === 4 ? "s-acc" : ""}">${h}</span>`).join("")}</div><p class="fig-note">Gradient flows right to left; 50 multiplications separate h<sub>t</sub> from h<sub>t−50</sub>.</p>` });
add("1.4", { at: "sol", kind: "dataviz", teaches: "Exponential decay of the gradient signal", caption: "Surviving gradient fraction 0.9^k after k backward steps.",
  render: el => el.innerHTML = plot({ x: { min: 0, max: 50, ticks: [0, 10, 20, 30, 40, 50], label: "steps back k" }, y: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], label: "0.9^k" },
    series: [{ pts: range(0, 50).map(k => [k, 0.9 ** k]), cls: "s-acc" }], dots: [{ x: 50, y: 0.9 ** 50, cls: "s-acc", label: "0.0052", dx: -8, anchor: "end", dy: -10 }, { x: 10, y: 0.9 ** 10, cls: "s-q", label: "k=10: 0.35" }], aria: "Exponential decay curve reaching 0.0052 at 50 steps" }) });

const Q15 = [1, 0], K15 = [[1, 0], [0, 1], [1, 1]], V15 = [[1, 0], [0, 2], [3, 1]];
add("1.5", { at: "q", kind: "static", teaches: "Geometry of the query against each key", caption: "The query and the three keys in 2-D. Dot products measure alignment.",
  render: el => el.innerHTML = `<div class="fig-split">${vecPlot([{ x: 1, y: 0, l: "q", cls: "s-q", dy: 16 }, { x: 1, y: 0, l: "k₁", cls: "s-k", dy: -8, dx: -4 }, { x: 0, y: 1, l: "k₂", cls: "s-k" }, { x: 1, y: 1, l: "k₃", cls: "s-k" }], { aria: "q along x; k1 along x; k2 along y; k3 diagonal" })}
    ${matrix({ rows: ["k₁ / v₁", "k₂ / v₂", "k₃ / v₃"], cols: ["key", "value"], small: true, cell: (i, j) => ({ t: `<span class="${j ? "s-v" : "s-k"}">[${(j ? V15 : K15)[i].join(", ")}]</span>` }) })}</div>` });
add("1.5", { at: "sol", kind: "stepper", teaches: "Order of operations: score, scale, softmax, weighted sum", caption: "The same computation in four steps.",
  render: el => { const raw = K15.map(k => k[0] * Q15[0] + k[1] * Q15[1]), sc = raw.map(x => x / Math.SQRT2), w = softmax(sc), out = [0, 1].map(j => w.reduce((a, wi, i) => a + wi * V15[i][j], 0));
    stepper(el, [{ t: "Dot products", c: "q·k<sub>i</sub> = [1, 0, 1]." }, { t: "Scale by √d<sub>k</sub>", c: "Divide by √2 ≈ 1.414." }, { t: "Softmax", c: "Exponentiate and normalize so the weights sum to 1." }, { t: "Weighted sum of values", c: `Output = [${f2(out[0], 3)}, ${f2(out[1], 3)}].` }],
      i => i < 3 ? bars([0, 1, 2].map(k => ({ l: `<span class="s-k">k${"₁₂₃"[k]}</span>`, v: [raw, sc, w][i][k], fill: i === 2 ? "s-acc" : "s-k" })), { max: i === 2 ? 1 : 1.5 })
        : `<div class="fig-split">${bars([0, 1, 2].map(k => ({ l: `${f2(w[k], 3)} · <span class="s-v">v${"₁₂₃"[k]}</span>`, v: w[k] * V15[k][0], vt: `[${f2(w[k] * V15[k][0], 3)}, ${f2(w[k] * V15[k][1], 3)}]`, fill: "s-v" })), { max: 1.6 })}${vecPlot([...V15.map((v, k) => ({ x: v[0] * w[k], y: v[1] * w[k], l: `${f2(w[k], 2)}v${"₁₂₃"[k]}`, cls: "s-v" })), { x: out[0], y: out[1], l: "output", cls: "s-acc" }], { scale: 70, w: 280, h: 200, cy: 160, cx: 40, aria: "weighted values and their sum" })}</div>`); } });

add("1.6", { at: "sol", kind: "interactive", teaches: "Unscaled scores saturate the softmax as d_k grows", caption: "Five keys whose dot products have standard deviation √d<sub>k</sub>. Compare the weights with and without scaling.",
  render: el => { const z = [1.1, 0.4, -0.3, 0.9, -1.2];
    interactive(el, [{ k: "lg", l: "d<sub>k</sub>", min: 1, max: 9, step: 1, v: 3, fmt: v => 2 ** v }, { k: "sc", type: "seg", l: "Scaling", v: "off", opts: [["off", "No scaling"], ["on", "÷ √d<sub>k</sub>"]] }],
      s => { const dk = 2 ** s.lg, scores = z.map(x => x * Math.sqrt(dk) / (s.sc === "on" ? Math.sqrt(dk) : 1)), p = softmax(scores), m = Math.max(...p);
        return bars(p.map((v, i) => ({ l: `key ${i + 1}`, v, fill: v === m ? "s-acc" : "s-k" })), { max: 1 }) + `<p class="readout">max weight ${f2(m, 3)} · largest softmax gradient p(1−p) on any score ${f2(Math.max(...p.map(x => x * (1 - x))), 3)}</p>`; }); } });

const HEADS = 8, MH_T = TEDDY;
const mhPattern = h => MH_T.map((_, i) => softmax(MH_T.map((_, j) => [j === i - 1, j === i, j === 3, j === 0, j === i + 1, true, j === 2, j === 5][h] ? 3 : 0)));
add("1.7", { at: "q", kind: "stepper", teaches: "Multi-head attention: project, split into heads, attend per head, concatenate, project; shapes at each transition", caption: "The six-token sentence flows through 8 heads. Weights are illustrative patterns; shapes are exact for d<sub>model</sub> = 512, h = 8.",
  render: el => { let head = 2;
    const headPick = () => `<div class="seg-g" role="radiogroup" aria-label="Choose a head">${range(0, 7).map(h => `<button type="button" role="radio" class="segb mh-h" data-h="${h}" aria-checked="${h === head}">head ${h + 1}</button>`).join("")}</div>`;
    const heat = h => matrix({ rows: MH_T, cols: MH_T, rowTitle: "query", colTitle: "key", small: true, label: `Attention weights of head ${h + 1}`, cell: (i, j) => { const v = mhPattern(h)[i][j]; return { t: f2(v, 2), cls: "heat", fill: v }; } });
    const frames = [
      () => pipe([{ t: "X", s: "6 tokens", shape: "6 × 512" }, { t: "W<sub>Q</sub>, W<sub>K</sub>, W<sub>V</sub>", s: "three projections", shape: "512 × 512 each", edge: "multiply" }, { t: "Q, K, V", s: "", shape: "6 × 512 each", cls: "s-q" }]),
      () => `<div class="mh-split">${range(0, 7).map(h => `<span class="mh-chip ${h === head ? "on" : ""}">head ${h + 1}<small>6 × 64</small></span>`).join("")}</div><p class="fig-note">512 columns split into 8 slices of 64. Every head sees the same six tokens.</p>`,
      () => `${headPick()}${heat(head)}`,
      () => pipe([{ t: "8 head outputs", shape: "8 × (6 × 64)" }, { t: "Concat", shape: "6 × 512", edge: "stack columns" }]),
      () => pipe([{ t: "Concat", shape: "6 × 512" }, { t: "W<sub>O</sub>", shape: "512 × 512", edge: "multiply" }, { t: "Output", shape: "6 × 512", cls: "s-acc" }]) ];
    stepper(el, [{ t: "Project", c: "One matrix multiply per projection." }, { t: "Split into heads", c: "Each head works in a 64-dimensional subspace." }, { t: "Attend per head", c: "Choose a head: each one learns a different pattern (previous token, same token, “bear”, first token…)." }, { t: "Concatenate", c: "Head outputs are placed side by side." }, { t: "Output projection", c: "W<sub>O</sub> mixes information across heads." }],
      i => frames[i](), { after: stage => stage.querySelectorAll(".mh-h").forEach(b => b.addEventListener("click", () => { head = +b.dataset.h; const tgt = b.closest(".stp-frame") || stage; const hm = tgt.querySelector(".mx-wrap"); hm.outerHTML = heat(head); tgt.querySelectorAll(".mh-h").forEach(x => x.setAttribute("aria-checked", String(+x.dataset.h === head))); })) }); } });

add("1.8", { at: "sol", kind: "static", teaches: "h separate n × n maps per layer", caption: "Eight heads, each a 7 × 7 map of attention weights.",
  render: el => el.innerHTML = `<div class="minis">${range(0, 7).map(h => `<div class="mini"><div class="mini-g">${range(0, 48).map(c => `<i style="--a:${(0.15 + 0.85 * ((c * (h + 3)) % 7 === h % 7 ? 1 : 0.1)).toFixed(2)}"></i>`).join("")}</div><small>head ${h + 1}</small></div>`).join("")}</div><p class="fig-note">8 × 49 = 392 weights.</p>` });

const CS = [[1.2, 0.4, -0.3, 0.8], [0.5, 1.0, 0.2, -0.6], [0.1, 0.9, 1.3, 0.4], [0.7, -0.2, 1.1, 1.5]], CT = ["a", "cute", "teddy", "bear"];
add("1.9", { at: "q", kind: "stepper", teaches: "Causal attention: score every pair, mask the future, then softmax each row", caption: "A 4-token prefix. Masked cells are hatched and marked −∞, then 0. Scores are illustrative scaled dot products.",
  render: el => stepper(el, [{ t: "Scores", c: "Every query is compared with every key: QKᵀ/√d<sub>k</sub>." }, { t: "Mask", c: "Keys to the right of the query (j > i) get −∞: a token may not look at the future." }, { t: "Softmax", c: "Each row is normalized over its allowed keys only. Masked cells become exactly 0." }],
    i => matrix({ rows: CT.map((t, r) => `${r + 1} · ${t}`), cols: CT.map((t, c) => `${c + 1} · ${t}`), rowTitle: "query i", colTitle: "key j", label: "Causal attention matrix",
      rowNote: i === 2 ? r => `Σ = 1 over ${r + 1}` : null,
      cell: (r, c) => { const masked = c > r; if (i === 0) return { t: f2(CS[r][c], 1), cls: "heat-s", fill: (CS[r][c] + 1) / 3 };
        if (masked) return { t: i === 1 ? "−∞" : "0", cls: "masked" };
        if (i === 1) return { t: f2(CS[r][c], 1), cls: "heat-s", fill: (CS[r][c] + 1) / 3 };
        const p = softmax(CS[r].slice(0, r + 1))[c]; return { t: f2(p, 2), cls: "heat", fill: p }; } }) + legend([["heat-s", "scaled score"], ["masked", "masked (future key)"], ["heat", "attention weight"]])) });
add("1.9", { at: "sol", kind: "static", teaches: "Counting allowed pairs row by row gives n(n+1)/2", caption: "Six tokens: row i keeps i cells.",
  render: el => el.innerHTML = matrix({ rows: TEDDY.map((t, r) => `${r + 1} · ${t}`), cols: TEDDY.map((t, c) => `${c + 1}`), rowTitle: "query", colTitle: "key", small: true, rowNote: r => `${r + 1}`,
    cell: (r, c) => c > r ? { t: "", cls: "masked" } : { t: "✓", cls: "allowed" } }) + `<p class="fig-note">1 + 2 + 3 + 4 + 5 + 6 = 21 allowed of 36.</p>` });

const LS = ["bear", "cub", "toy", "dog", "cat"];
add("1.10", { at: "q", kind: "static", teaches: "The hard one-hot target before smoothing", caption: "One-hot target for the true token “bear”.",
  render: el => el.innerHTML = bars(LS.map((t, i) => ({ l: t, v: i ? 0 : 1, fill: "s-acc" })), { max: 1 }) });
add("1.10", { at: "sol", kind: "static", teaches: "Smoothing moves ε of mass onto the other tokens", caption: "Smoothed target with ε = 0.1 (outline: original one-hot).",
  render: el => el.innerHTML = bars(LS.map((t, i) => ({ l: t, v: i ? 0.025 : 0.9, ghost: i ? 0 : 1, fill: "s-acc" })), { max: 1 }) });

add("1.11", { at: "sol", kind: "static", teaches: "Permutation equivariance: outputs follow the inputs' order", caption: "Without positions, reordering the words only reorders the same output vectors.",
  render: el => { const o = { Teddy: "o<sub>T</sub>", follows: "o<sub>f</sub>", Plushie: "o<sub>P</sub>" }, c = { Teddy: "s-q", follows: "s-v", Plushie: "s-k" };
    const row = ws => `<div class="perm">${toks(ws.map(w => ({ t: w, cls: c[w] })))}<span class="perm-a">attention →</span>${toks(ws.map(w => ({ t: o[w], cls: c[w] + " solid", raw: true })))}</div>`;
    el.innerHTML = row(["Teddy", "follows", "Plushie"]) + row(["Plushie", "follows", "Teddy"]); } });

add("1.12", { at: "sol", kind: "static", teaches: "Path length: n−1 sequential hops versus 1 direct hop", caption: "Left: an RNN passes information step by step. Right: attention links every pair directly.",
  render: el => { const n = 6, W = 520, H = 150; let s = "";
    for (let i = 0; i < n; i++) { const x = 30 + i * 40; s += `<circle class="node" cx="${x}" cy="75" r="11"/><text class="pl-t" x="${x}" y="105" text-anchor="middle">${i + 1}</text>`; if (i) s += arrowSVG(x - 29, 75, x - 12, 75, "s-q"); }
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const xi = 310 + i * 38, xj = 310 + j * 38; s += `<path class="arc s-acc" d="M ${xi} 75 Q ${(xi + xj) / 2} ${75 - (j - i) * 14} ${xj} 75"/>`; }
    for (let i = 0; i < n; i++) { const x = 310 + i * 38; s += `<circle class="node" cx="${x}" cy="75" r="11"/><text class="pl-t" x="${x}" y="105" text-anchor="middle">${i + 1}</text>`; }
    s += `<text class="pl-al" x="130" y="135" text-anchor="middle">RNN: 5 sequential hops from 1 to 6</text><text class="pl-al" x="405" y="135" text-anchor="middle">Attention: 1 hop, all in parallel</text>`;
    el.innerHTML = `<div class="pl-wrap"><svg class="pl" viewBox="0 0 ${W} ${H}" role="img" aria-label="RNN chain versus fully connected attention">${s}</svg></div>`; } });

// ===== Lecture 2 =====
add("2.1", { at: "q", kind: "static", teaches: "The 15% / 80-10-10 masking recipe as proportions", caption: "200 tokens: 30 are selected; 24 become [MASK], 3 random, 3 unchanged.",
  render: el => { const cls = i => i < 24 ? "w-mask" : i < 27 ? "w-rand" : i < 30 ? "w-keep" : ""; const order = range(0, 199).map(i => (i * 37) % 200);
    el.innerHTML = `<div class="waffle" role="img" aria-label="200 squares; 24 mask, 3 random, 3 unchanged">${order.map(k => `<i class="${cls(k)}"></i>`).join("")}</div>` + legend([["w-mask", "[MASK] (80%)"], ["w-rand", "random token (10%)"], ["w-keep", "selected, unchanged (10%)"], ["w-none", "not selected (85%)"]]); } });
NOFIG["2.2"] = "One multiplication; the display equation already splits forward and backward cost.";
add("2.3", { at: "sol", kind: "dataviz", teaches: "Compute-optimal line D = 20N and models trained past it", caption: "Tokens versus parameters on log axes.",
  render: el => el.innerHTML = plot({ x: { min: 1e9, max: 1e12, log: true, ticks: [1e9, 1e10, 1e11, 1e12], fmt: v => ({ 1e9: "1B", 1e10: "10B", 1e11: "100B", 1e12: "1T" })[v], label: "parameters N" },
    y: { min: 1e10, max: 1e14, log: true, ticks: [1e10, 1e11, 1e12, 1e13, 1e14], fmt: v => ({ 1e10: "10B", 1e11: "100B", 1e12: "1T", 1e13: "10T", 1e14: "100T" })[v], label: "training tokens D" },
    series: [{ pts: [[1e9, 2e10], [1e12, 2e13]], cls: "s-acc", label: "D = 20N (Chinchilla)" }],
    dots: [{ x: 7e10, y: 1.4e12, cls: "s-acc", label: "70B → 1.4T", dy: 18 }, { x: 8e9, y: 1.5e13, cls: "s-q", label: "8B on 15T (over-trained)" }], aria: "Chinchilla line with 70B at 1.4T tokens" }) });
add("2.4", { at: "q", kind: "static", teaches: "Total versus active experts in a fine-grained MoE", caption: "64 routed experts plus 1 shared. For this token the router picked 6 (illustrative choice).",
  render: el => { const pick = [3, 17, 22, 40, 51, 60];
    el.innerHTML = `<div class="moe">${toks([{ t: "token “bear”", cls: "s-q solid" }])}<span class="moe-a">router g(x) → top-6</span><div class="moe-g">${range(0, 63).map(i => `<i class="${pick.includes(i) ? "on" : ""}" title="expert ${i + 1}"></i>`).join("")}</div><div class="moe-sh"><i class="on sh"></i> shared</div></div>` + legend([["moe-on", "active for this token"], ["moe-off", "stored but idle"]]); } });
add("2.5", { at: "sol", kind: "dataviz", teaches: "What collapse looks like in expert load, and the balanced target", caption: "Share of tokens per expert (8 experts shown).",
  render: el => el.innerHTML = `<div class="fig-split"><div><h6>Collapsed</h6>${bars([0.52, 0.31, 0.06, 0.04, 0.03, 0.02, 0.01, 0.01].map((v, i) => ({ l: `E${i + 1}`, v, fill: "s-bad" })), { max: 0.6, fmt: v => f2(v, 2) })}</div><div><h6>With load-balancing loss</h6>${bars([0.14, 0.12, 0.13, 0.12, 0.11, 0.13, 0.12, 0.13].map((v, i) => ({ l: `E${i + 1}`, v, fill: "s-good" })), { max: 0.6, fmt: v => f2(v, 2) })}</div></div>` });
add("2.6", { at: "sol", kind: "interactive", teaches: "Each RoPE pair rotates at its own frequency θ_i", caption: "Four pairs of an 8-dimensional head at position m.",
  render: el => { const th = [0, 1, 2, 3].map(i => 10000 ** (-2 * i / 8));
    interactive(el, [{ k: "m", l: "position m", min: 0, max: 12, step: 1, v: 3 }], s => unitCircles(th.map(t => s.m * t), th.map((t, i) => `i=${i}: ${f2(s.m * t, 3)} rad`), { aria: "rotation per pair" }) + `<p class="readout">θ = [${th.map(t => f2(t, 3)).join(", ")}]</p>`); } });
add("2.7", { at: "sol", kind: "interactive", teaches: "Shifting both positions leaves the relative angle and the score unchanged", caption: "q at position m and k at position n, both rotated with θ = 0.4 rad per position.",
  render: el => interactive(el, [{ k: "s", l: "shift both by", min: 0, max: 10, step: 1, v: 0 }], s => { const th = 0.4, m = 5 + s.s, n = 2 + s.s, aq = 0.3 + m * th, ak = 1.2 + n * th, score = Math.cos(aq - ak) * 1.0 * 0.8;
    return `<div class="fig-split">${vecPlot([{ x: Math.cos(aq), y: Math.sin(aq), l: `q at m=${m}`, cls: "s-q" }, { x: 0.8 * Math.cos(ak), y: 0.8 * Math.sin(ak), l: `k at n=${n}`, cls: "s-k" }], { cx: 130, cy: 115, w: 260, h: 230, scale: 80, aria: "rotated q and k" })}<p class="readout">m − n = ${m - n}<br>angle between = ${f2(Math.abs(((aq - ak) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI), 3)} rad<br>score qᵀk = ${f2(score, 4)}</p></div>`; }) });
add("2.8", { at: "sol", kind: "dataviz", teaches: "RMSNorm rescales; LayerNorm also re-centers", caption: "x = [1, 2, 3, 4] before and after each normalization.",
  render: el => { const x = [1, 2, 3, 4], r = Math.sqrt(7.5), mu = 2.5, sd = Math.sqrt(1.25);
    el.innerHTML = plot({ x: { min: 0.4, max: 4.6, ticks: [1, 2, 3, 4], fmt: v => `x${"₁₂₃₄"[v - 1]}`, label: "component" }, y: { min: -2, max: 4.5, ticks: [-2, -1, 0, 1, 2, 3, 4] },
      series: [{ bars: true, pts: x.map((v, i) => [i + 0.75, v]), cls: "s-mute", bw: 14, label: "x" }, { bars: true, pts: x.map((v, i) => [i + 1, v / r]), cls: "s-acc", bw: 14, label: "RMSNorm" }, { bars: true, pts: x.map((v, i) => [i + 1.25, (v - mu) / sd]), cls: "s-q", bw: 14, label: "LayerNorm" }],
      hlines: [{ y: 0 }], aria: "grouped bars" }); } });
add("2.9", { at: "q", kind: "stepper", teaches: "Receptive field grows by w per stacked layer", caption: "Small version: window w = 2 (each position sees itself and 2 back), 3 layers, 12 positions.",
  render: el => stepper(el, [1, 2, 3].map(L => ({ t: `after layer ${L}`, c: `Position 12 can now draw on positions ${12 - 2 * L}…12 (reach ${2 * L} back = L·w).` })),
    i => `<div class="swa">${[3, 2, 1, 0].map(l => `<div class="swa-row"><span>${l ? `layer ${l}` : "input"}</span>${range(1, 12).map(p => `<i class="${l <= i + 1 && p >= 12 - 2 * (i + 1 - l) ? "on" : ""} ${l === i + 1 && p === 12 ? "tip" : ""}">${l === 0 ? p : ""}</i>`).join("")}</div>`).join("")}</div>`) });
add("2.10", { at: "q", kind: "static", teaches: "The raw logits before any temperature", caption: "Logits z = [2, 1, 0] for three candidate tokens.",
  render: el => el.innerHTML = bars([["soft", 2], ["brown", 1], ["small", 0]].map(([l, v]) => ({ l, v, fill: "s-mute", vt: v.toString() })), { max: 2 }) });
add("2.10", { at: "sol", kind: "interactive", teaches: "Temperature sharpens (T<1) or flattens (T>1) the softmax", caption: "Same logits, live temperature.",
  render: el => interactive(el, [{ k: "T", l: "temperature T", min: 0.1, max: 3, step: 0.05, v: 0.5, fmt: v => v.toFixed(2) }], s => { const p = softmax([2, 1, 0], s.T), p1 = softmax([2, 1, 0]);
    return bars(["soft", "brown", "small"].map((l, i) => ({ l, v: p[i], ghost: p1[i], fill: "s-acc" })), { max: 1 }) + `<p class="readout">outline = T 1 · top token ${f2(p[0], 4)}</p>`; }) });
const TP = [["soft", 0.35], ["brown", 0.30], ["small", 0.15], ["cute", 0.10], ["worn", 0.06], ["purple", 0.04]];
add("2.11", { at: "q", kind: "static", teaches: "The ranked next-token distribution", caption: "Next-token probabilities after “My teddy bear is”, ranked.",
  render: el => el.innerHTML = bars(TP.map(([l, v]) => ({ l, v, fill: "s-mute" })), { max: 0.4 }) });
add("2.11", { at: "sol", kind: "interactive", teaches: "Top-p keeps the smallest prefix reaching p; temperature changes which tokens make it", caption: "Adjust top-p and temperature. Excluded tokens are hatched and struck through.",
  render: el => interactive(el, [{ k: "p", l: "top-p", min: 0.05, max: 1, step: 0.05, v: 0.75, fmt: v => v.toFixed(2) }, { k: "T", l: "temperature", min: 0.3, max: 2, step: 0.05, v: 1, fmt: v => v.toFixed(2) }], s => {
    const lg = TP.map(([, v]) => Math.log(v)), q = softmax(lg, s.T); let cum = 0, keep = [];
    for (let i = 0; i < q.length; i++) { if (cum >= s.p - 1e-9 && keep.length) break; keep.push(i); cum += q[i]; }
    const Z = keep.reduce((a, i) => a + q[i], 0); let c2 = 0;
    return bars(TP.map(([l], i) => ({ l: keep.includes(i) ? l : `<s>${l}</s>`, v: keep.includes(i) ? q[i] / Z : 0, ghost: q[i], cls: keep.includes(i) ? "" : "excluded", fill: "s-acc", vt: keep.includes(i) ? f2(q[i] / Z, 3) : "cut" })), { max: 1 }) +
      `<p class="readout">cumulative: ${q.map(v => f2(c2 += v, 2)).join(" → ")} · kept ${keep.length} token${keep.length > 1 ? "s" : ""} (mass ${f2(Z, 2)})</p>`; }) });
add("2.12", { at: "q", kind: "static", teaches: "Where beam search spends its scoring: V at step 1, then k·V per step", caption: "Toy version: V = 3, k = 2. Kept beams are filled; every node is a scored candidate.",
  render: el => { const W = 520, H = 200; let s = ""; const lv = [[0], [0, 1, 2], [0, 1, 2, 3, 4, 5]], keep = [[0], [0, 2], [1, 3]];
    const xs = l => lv[l].map((_, i) => (W / (lv[l].length + 1)) * (i + 1)), y = l => 30 + l * 70;
    for (let l = 1; l < 3; l++) xs(l).forEach((x, i) => { const par = l === 1 ? 0 : keep[1][Math.floor(i / 3)]; const px = xs(l - 1)[l === 1 ? 0 : par]; s += `<line class="tree-e" x1="${px}" y1="${y(l - 1) + 9}" x2="${x}" y2="${y(l) - 9}"/>`; });
    lv.forEach((nodes, l) => xs(l).forEach((x, i) => s += `<circle class="node ${keep[l].includes(i) ? "kept" : ""}" cx="${x}" cy="${y(l)}" r="9"/>`));
    s += `<text class="pl-t" x="8" y="${y(1) + 4}">step 1: 3 scored</text><text class="pl-t" x="8" y="${y(2) + 4}">step 2: 2 × 3 = 6 scored</text>`;
    el.innerHTML = `<div class="pl-wrap"><svg class="pl" viewBox="0 0 ${W} ${H}" role="img" aria-label="beam search tree">${s}</svg></div>`; } });
add("2.13", { at: "sol", kind: "static", teaches: "Reduction order changes float sums, which can flip a near-tie argmax", caption: "Float32 addition with two orders (illustrative).",
  render: el => el.innerHTML = matrix({ rows: ["batch alone", "batch with others"], cols: ["reduction order", "fp32 result"], cell: (i, j) => ({ t: [["(1e8 + 1) − 1e8", "0"], ["(1e8 − 1e8) + 1", "1"]][i][j] }) }) +
    `<p class="fig-note">1e8 + 1 rounds back to 1e8 in float32. If two logits differ by less than such errors, greedy decoding can choose a different token, and the texts diverge from there.</p>` });
add("2.14", { at: "sol", kind: "stepper", teaches: "A grammar masks illegal tokens at every step", caption: "Generating {\"count\": 3} under a JSON schema. Illegal tokens are hatched (logit set to −∞).",
  render: el => { const st = [{ s: '{', ok: ['"count"'], all: ['"count"', 'Sure', '}', '3'] }, { s: '{"count"', ok: [':'], all: [':', ',', '"', 'is'] }, { s: '{"count":', ok: ['3', '12'], all: ['3', '12', '"three"', 'null'] }, { s: '{"count": 3', ok: ['}'], all: ['}', ',', '4', 'bears'] }];
    stepper(el, st.map(x => ({ t: `after ${x.s}`, c: `Legal next: ${x.ok.join(", ")}.` })), i => `<div class="gd"><code>${esc(st[i].s)}▌</code>${toks(st[i].all.map(t => ({ t, cls: st[i].ok.includes(t) ? "s-good" : "masked" })))}</div>` + legend([["s-good", "allowed by grammar"], ["masked", "masked"]])); } });
NOFIG["2.15"] = "Open design question; the model answer is a three-line comparison.";

// ===== Lecture 3 =====
add("3.1", { at: "sol", kind: "static", teaches: "Unit conversions from per-token nats to bits per byte", caption: "From token loss to bits per byte.",
  render: el => el.innerHTML = pipe([{ t: "1,000 tokens × 2.0", s: "nats per token" }, { t: "2,000 nats", edge: "sum" }, { t: "2,885 bits", edge: "÷ ln 2" }, { t: "0.687 BPB", edge: "÷ 4,200 bytes", cls: "s-acc" }]) });
add("3.2", { at: "sol", kind: "static", teaches: "Where mid-training sits in the pipeline", caption: "Training stages in order.",
  render: el => el.innerHTML = pipe([{ t: "Pretraining", s: "web, code, math · trillions of tokens" }, { t: "Mid-training", s: "curated high-quality data · 32K → 200K context", cls: "s-acc" }, { t: "SFT", s: "assistant dialogs" }, { t: "RL", s: "preferences, verifiable rewards" }]) });
add("3.3", { at: "sol", kind: "static", teaches: "Which positions carry loss in SFT", caption: "Prompt tokens are in context but masked from the loss.",
  render: el => el.innerHTML = toks(["Explain", "why", "a", "teddy", "bear", "is", "a", "friend", "→"].map(t => ({ t, cls: "masked" })).concat(["It", "offers", "comfort", "and", "company", "."].map(t => ({ t, cls: "s-acc" })))) + legend([["masked", "prompt: no loss"], ["s-acc", "response: −log p counted"]]) });
const lora = (zero) => `<div class="lora"><div class="lm big"><span>W₀</span><small>4096 × 4096 · frozen</small></div><b>+</b><div class="lm tall s-acc-b"><span>B${zero ? " = 0" : ""}</span><small>4096 × r</small></div><b>×</b><div class="lm wide s-q-b"><span>A</span><small>r × 4096</small></div></div>`;
add("3.4", { at: "q", kind: "static", teaches: "Shapes of the low-rank factors", caption: "W = W₀ + BA with rank r; drawn to relative scale (r exaggerated).", render: el => el.innerHTML = lora(false) });
add("3.5", { at: "sol", kind: "static", teaches: "Zero-initialized B makes the update vanish at step 0", caption: "At initialization BA = 0, so W = W₀ exactly; A is random so B still receives gradient.", render: el => el.innerHTML = lora(true) });
add("3.6", { at: "sol", kind: "dataviz", teaches: "Adapters versus full copies at scale", caption: "Weight storage for 50 tasks.",
  render: el => el.innerHTML = bars([{ l: "base + 50 LoRA", v: 16, vt: "16 GB", fill: "s-good" }, { l: "50 full copies", v: 700, vt: "700 GB", fill: "s-bad" }], { max: 700 }) });
const sig = x => 1 / (1 + Math.exp(-x));
add("3.7", { at: "sol", kind: "dataviz", teaches: "Preference probability as a sigmoid of the reward gap", caption: "σ(r<sub>w</sub> − r<sub>l</sub>).",
  render: el => el.innerHTML = plot({ x: { min: -4, max: 4, ticks: [-4, -2, 0, 2, 4], label: "reward gap r_w − r_l" }, y: { min: 0, max: 1, ticks: [0, 0.5, 1], label: "P(y_w ≻ y_l)" }, series: [{ pts: range(-4, 4, 0.1).map(x => [x, sig(x)]), cls: "s-acc" }], dots: [{ x: 1.5, y: sig(1.5), cls: "s-acc", label: "gap 1.5 → 0.818", dy: 16 }], aria: "sigmoid" }) });
add("3.8", { at: "sol", kind: "dataviz", teaches: "DPO loss decreases with the margin; log 2 at initialization", caption: "−log σ(m) against the margin m.",
  render: el => el.innerHTML = plot({ x: { min: -2, max: 3, ticks: [-2, -1, 0, 1, 2, 3], label: "margin m = β(Δ_w − Δ_l)" }, y: { min: 0, max: 2.2, ticks: [0, 0.5, 1, 1.5, 2], label: "loss" }, series: [{ pts: range(-2, 3, 0.05).map(x => [x, -Math.log(sig(x))]), cls: "s-acc" }],
    dots: [{ x: 0, y: Math.log(2), cls: "s-q", label: "m = 0: 0.693" }, { x: 0.3, y: -Math.log(sig(0.3)), cls: "s-acc", label: "m = 0.3: 0.554", dy: 18 }], aria: "loss curve" }) });
add("3.9", { at: "sol", kind: "static", teaches: "The full RLHF pipeline and where DPO shortcuts it", caption: "Classic RLHF; DPO replaces the last two stages.",
  render: el => el.innerHTML = pipe([{ t: "Pretrain" }, { t: "SFT" }, { t: "Preference pairs" }, { t: "Reward model", s: "Bradley–Terry", cls: "s-q" }, { t: "PPO + KL", cls: "s-q" }]) + `<p class="fig-note"><span class="s-acc">DPO:</span> preference pairs → one supervised loss (no reward model, no RL loop).</p>` });
add("3.10", { at: "sol", kind: "static", teaches: "Who generates the data × how dense the signal is", caption: "The off/on-policy grid from the lecture.",
  render: el => el.innerHTML = matrix({ rows: ["dense (per token)", "sparse (per response)"], cols: ["off-policy (not from the model)", "on-policy (from the model)"], rowTitle: "signal", colTitle: "data", cell: (i, j) => ({ t: [["SFT", "On-policy distillation"], ["—", "RL (RLHF, RLVR)"]][i][j], cls: i === 0 && j === 1 ? "hl" : "" }) }) });
add("3.11", { at: "sol", kind: "dataviz", teaches: "Tails shrink generation after generation", caption: "Illustrative distributions of a model retrained on its own samples.",
  render: el => { const g = s => range(-4, 4, 0.1).map(x => [x, Math.exp(-x * x / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI))]);
    el.innerHTML = plot({ x: { min: -4, max: 4, ticks: [-4, -2, 0, 2, 4], label: "content (rare ← → rare)" }, y: { min: 0, max: 0.9, ticks: [0, 0.3, 0.6, 0.9], label: "density" }, series: [{ pts: g(1), cls: "s-mute", label: "human data" }, { pts: g(0.7), cls: "s-q", label: "generation 3" }, { pts: g(0.47), cls: "s-acc", label: "generation 6" }], aria: "narrowing distributions" }); } });
add("3.12", { at: "sol", kind: "static", teaches: "Earlier checkpoints teach the student on their own domains", caption: "Multi-teacher on-policy distillation against forgetting.",
  render: el => el.innerHTML = `<div class="fan">${["math-RL checkpoint", "code-RL checkpoint", "chat checkpoint"].map(t => `<div class="pipe-node s-q"><b>${t}</b><span>per-token targets</span></div>`).join("")}</div><div class="fan-arrow" aria-hidden="true">↓</div><div class="pipe-node s-acc center"><b>Student</b><span>generates; matches each teacher on its domain</span></div>` });
add("3.13", { at: "sol", kind: "dataviz", teaches: "Memory budget for LoRA on a 24 GB GPU", caption: "Approximate GPU memory split.",
  render: el => el.innerHTML = `<div class="stack-bar" role="img" aria-label="14 GB base, about 1 GB adapters and optimizer, rest activations"><i class="s-mute-b" style="flex:14">frozen base 14 GB</i><i class="s-acc-b" style="flex:1.2">LoRA+Adam ~1</i><i class="s-q-b" style="flex:8.8">activations + overhead ~9</i></div><p class="fig-note">24 GB total.</p>` });
NOFIG["3.14"] = "The aligned multi-line derivation in the solution is the visual.";

// ===== Lecture 4 =====
add("4.1", { at: "sol", kind: "static", teaches: "Two reward sources side by side", caption: "Learned reward model versus a program.",
  render: el => el.innerHTML = `<div class="lanes"><div><h6>RLHF (subjective)</h6>${pipe([{ t: "response" }, { t: "reward model", s: "learned from preferences", cls: "s-q" }, { t: "score", s: "hackable" }])}</div><div><h6>RLVR (verifiable)</h6>${pipe([{ t: "response" }, { t: "checker", s: "exact match / tests", cls: "s-good" }, { t: "0 or 1", s: "deterministic" }])}</div></div>` });
add("4.2", { at: "sol", kind: "dataviz", teaches: "Subtracting a baseline turns two similar pushes into opposite ones", caption: "Weight on ∇log π for each response.",
  render: el => el.innerHTML = `<div class="fig-split"><div><h6>No baseline</h6>${bars([{ l: "good (100.5)", v: 100.5, fill: "s-mute" }, { l: "bad (99.5)", v: 99.5, fill: "s-mute" }], { max: 101, fmt: v => v.toFixed(1) })}</div><div><h6>Baseline b = 100</h6>${bars([{ l: "good", v: 0.5, fill: "s-good" }, { l: "bad", v: -0.5, fill: "s-bad" }], { max: 0.5, fmt: v => (v > 0 ? "+" : "") + v.toFixed(1) })}</div></div>` });
const V43 = [0.5, 0.55, 0.9, 1.0];
const v43 = ann => plot({ x: { min: -0.5, max: 3.5, ticks: [0, 1, 2, 3], fmt: v => ["start", "“In”", "“the”", "“box”"][v], label: "prefix ends with" }, y: { min: 0.4, max: 1.05, ticks: [0.4, 0.6, 0.8, 1], label: "V(prefix)" },
  series: [{ pts: V43.map((v, i) => [i, v]), cls: "s-q" }], dots: V43.map((v, i) => ({ x: i, y: v, cls: ann && i === 2 ? "s-acc" : "s-q", label: ann && i ? `Δ = ${f2(v - V43[i - 1], 2)}` : f2(v, 2), dy: ann && i ? 16 : -8 })), aria: "value after each prefix" });
add("4.3", { at: "q", kind: "dataviz", teaches: "The value model's estimate along the response", caption: "Expected final reward after each prefix.", render: el => el.innerHTML = v43(false) });
add("4.3", { at: "sol", kind: "dataviz", teaches: "Token advantage = change in value", caption: "Each token's advantage is the jump it causes.", render: el => el.innerHTML = v43(true) });
const ppo = (r0, a0) => el => interactive(el, [{ k: "r", l: "ratio ρ", min: 0.5, max: 1.5, step: 0.01, v: r0, fmt: v => v.toFixed(2) }, { k: "A", l: "advantage A", min: -3, max: 3, step: 0.5, v: a0, fmt: v => (v > 0 ? "+" : "") + v }], s => {
  const J = r => Math.min(r * s.A, Math.min(Math.max(r, 0.8), 1.2) * s.A), un = s.r * s.A, cl = Math.min(Math.max(s.r, 0.8), 1.2) * s.A, sel = un <= cl ? "unclipped ρA" : "clipped", g = un <= cl ? s.A : 0;
  const vals = range(0.5, 1.5, 0.05).flatMap(r => [J(r), r * s.A]), lo = Math.min(-0.5, ...vals) - 0.3, hi = Math.max(0.5, ...vals) + 0.3;
  return plot({ x: { min: 0.5, max: 1.5, ticks: [0.5, 0.8, 1, 1.2, 1.5], label: "ρ" }, y: { min: lo, max: hi, ticks: [-4, -2, 0, 2, 4].filter(v => v >= lo && v <= hi), label: "J" }, areas: [{ x0: 0.8, x1: 1.2, cls: "trust", label: "1 ± ε" }],
    series: [{ pts: range(0.5, 1.5, 0.01).map(r => [r, r * s.A]), cls: "s-mute", dash: true, label: "ρA" }, { pts: range(0.5, 1.5, 0.01).map(r => [r, J(r)]), cls: "s-acc", label: "J = min(ρA, clip·A)" }],
    dots: [{ x: s.r, y: J(s.r), cls: "s-acc", label: f2(J(s.r), 2) }], hlines: [{ y: 0 }], aria: "PPO clipped objective" }) +
    `<p class="readout">ρA = ${f2(un, 3)} · clipped term = ${f2(cl, 3)} · min selects <b>${sel}</b> · ∂J/∂ρ = ${g}${g === 0 ? " (flat: no push)" : ""}</p>`; });
add("4.4", { at: "sol", kind: "interactive", teaches: "Which term the min selects, and where the gradient goes flat", caption: "PPO objective for one action. Preset: ρ = 0.75, A = +3.", render: ppo(0.75, 3) });
add("4.5", { at: "sol", kind: "interactive", teaches: "With A < 0 the pessimistic unclipped term keeps pushing ρ down", caption: "Preset: ρ = 1.25, A = −2.", render: ppo(1.25, -2) });
add("4.6", { at: "q", kind: "static", teaches: "The two distributions being compared", caption: "Teacher T and student S over two tokens.",
  render: el => el.innerHTML = matrix({ rows: ["teacher T", "student S"], cols: ["token 1", "token 2"], small: true, cell: (i, j) => { const v = [[0.5, 0.5], [0.9, 0.1]][i][j]; return { t: f2(v, 1), cls: "heat", fill: v }; } }) });
const klTerms = (P, Q) => P.map((p, i) => p * Math.log(p / Q[i]));
add("4.6", { at: "sol", kind: "dataviz", teaches: "Per-token terms of the forward KL", caption: "KL(T ‖ S) = Σ T<sub>i</sub> log(T<sub>i</sub>/S<sub>i</sub>).",
  render: el => el.innerHTML = bars(klTerms([0.5, 0.5], [0.9, 0.1]).map((v, i) => ({ l: `token ${i + 1}`, v, fill: v < 0 ? "s-q" : "s-acc" })), { max: 0.9 }) + `<p class="readout">sum = 0.511 — dominated by token 2, where the student under-covers the teacher.</p>` });
add("4.7", { at: "sol", kind: "dataviz", teaches: "Reverse KL weights terms by the student's own mass", caption: "Forward and reverse KL, term by term.",
  render: el => el.innerHTML = `<div class="fig-split"><div><h6>forward KL(T‖S) = 0.511</h6>${bars(klTerms([0.5, 0.5], [0.9, 0.1]).map((v, i) => ({ l: `token ${i + 1}`, v, fill: "s-q" })), { max: 0.9 })}</div><div><h6>reverse KL(S‖T) = 0.368</h6>${bars(klTerms([0.9, 0.1], [0.5, 0.5]).map((v, i) => ({ l: `token ${i + 1}`, v, fill: "s-acc" })), { max: 0.9 })}</div></div>` });
const R48 = [1, 0, 0, 1, 1, 0, 0, 0];
add("4.8", { at: "q", kind: "static", teaches: "One GRPO group of outcomes", caption: "Eight sampled answers to one prompt.", render: el => el.innerHTML = toks(R48.map((r, i) => ({ t: `o${i + 1} ${r ? "✓" : "✗"}`, cls: r ? "s-good" : "s-bad" }))) });
add("4.8", { at: "sol", kind: "dataviz", teaches: "Group-normalized advantages", caption: "(r − mean)/std with mean 0.375, std 0.484.",
  render: el => { const m = 0.375, sd = Math.sqrt(0.375 * 0.625); el.innerHTML = bars(R48.map((r, i) => ({ l: `o${i + 1} ${r ? "✓" : "✗"}`, v: (r - m) / sd, fill: r ? "s-good" : "s-bad" })), { max: 1.4, fmt: v => (v > 0 ? "+" : "") + f2(v, 3) }); } });
add("4.9", { at: "sol", kind: "static", teaches: "Components each algorithm keeps in memory", caption: "PPO needs a learned critic; GRPO uses the group.",
  render: el => el.innerHTML = `<div class="lanes"><div><h6>PPO</h6>${pipe([{ t: "policy", s: "samples 1 response" }, { t: "reward" }, { t: "value model", s: "same size as policy", cls: "s-bad" }, { t: "advantage", s: "token-level" }])}</div><div><h6>GRPO</h6>${pipe([{ t: "policy", s: "samples G responses" }, { t: "rewards" }, { t: "group mean / std", s: "no critic", cls: "s-good" }, { t: "advantage", s: "same for all tokens" }])}</div></div><p class="fig-note">Both: ratio + clipping. KL to the reference: in the reward (PPO) or in the loss (GRPO).</p>` });
add("4.10", { at: "sol", kind: "interactive", teaches: "Dividing by |o| shrinks per-token penalties for long wrong answers", caption: "Two wrong answers, both with advantage Â = −1.",
  render: el => interactive(el, [{ k: "L", l: "long answer |o|", min: 20, max: 1000, step: 20, v: 400 }, { k: "n", type: "seg", l: "Normalization", v: "len", opts: [["len", "÷ |o| (GRPO)"], ["none", "none (Dr. GRPO)"]] }], s => {
    const w = L => s.n === "len" ? -1 / L : -1 / 100; const a = w(20), b = w(s.L);
    return bars([{ l: "short wrong (20 tok)", v: a, fill: "s-bad" }, { l: `long wrong (${s.L} tok)`, v: b, fill: "s-bad" }], { max: Math.max(Math.abs(a), Math.abs(b)), fmt: v => v.toExponential(1) }) +
      `<p class="readout">per-token penalty ratio long/short = ${f2(b / a, 3)}${s.n === "none" ? " (constant scale shown as 1/100)" : ""}</p>`; }) });
add("4.11", { at: "q", kind: "static", teaches: "The response split into steps, with the faulty step marked", caption: "A correct answer reached through a false step.",
  render: el => el.innerHTML = toks([{ t: "Step 1: Teddy climbs out of the box.", cls: "s-bad" }, { t: "Step 2: Teddy walks to the kitchen." }, { t: "Answer: Kitchen ✓", cls: "s-good" }]) });
add("4.11", { at: "sol", kind: "static", teaches: "Outcome advantage is copied to every token", caption: "Every token gets the response's positive advantage, the false step included.",
  render: el => el.innerHTML = toks("Step 1: Teddy climbs out of the box . Step 2: Teddy walks to the kitchen . Answer: Kitchen".split(" ").map((t, i) => ({ t, sub: "+Â", cls: i < 9 ? "s-good outlined-bad" : "s-good" }))) + legend([["s-good", "same positive advantage"], ["outlined-bad", "false step, still reinforced"]]) });
NOFIG["4.12"] = "Open design question; the answer is a reward specification in words.";
add("4.13", { at: "sol", kind: "static", teaches: "Per-token reverse KL locates where the student's text goes wrong", caption: "Teacher scores the student's own rollout; heat = per-token KL (illustrative).",
  render: el => { const t = "Teddy is in the box , so he ends up in the garden".split(" "), k = [0.02, 0.01, 0.03, 0.02, 0.05, 0.02, 0.04, 0.03, 0.06, 0.05, 0.08, 0.04, 1.9];
    el.innerHTML = pipe([{ t: "student", s: "samples a response" }, { t: "teacher", s: "scores every position", cls: "s-q" }, { t: "loss", s: "Σ<sub>t</sub> KL(π<sub>S</sub> ‖ π<sub>T</sub>)", cls: "s-acc" }]) + `<div class="tks heatrow">${t.map((w, i) => `<span class="tk heat" style="--a:${Math.min(1, k[i] / 1.9).toFixed(2)}">${esc(w)}<small>${f2(k[i], 2)}</small></span>`).join("")}</div>`; } });

// ===== Lecture 5 =====
add("5.1", { at: "sol", kind: "dataviz", teaches: "Weights alone exceed one GPU's memory", caption: "FP16 weights of a 100B model against typical GPU memory.",
  render: el => el.innerHTML = bars([{ l: "100B weights", v: 200, vt: "200 GB", fill: "s-acc" }, { l: "141 GB GPU", v: 141, vt: "141 GB", fill: "s-mute" }, { l: "80 GB GPU", v: 80, vt: "80 GB", fill: "s-mute" }], { max: 200 }) });
add("5.2", { at: "q", kind: "static", teaches: "Where the 16 bytes per parameter go", caption: "Bytes per parameter in mixed-precision Adam.",
  render: el => el.innerHTML = `<div class="stack-bar" role="img" aria-label="2 bytes weights, 2 gradients, 12 optimizer"><i class="s-q-b" style="flex:2">weights 2</i><i class="s-k-b" style="flex:2">grads 2</i><i class="s-v-b" style="flex:12">fp32 master + Adam m, v = 12</i></div>` });
add("5.3", { at: "sol", kind: "interactive", teaches: "What each ZeRO stage shards across 8 GPUs", caption: "Per-GPU memory for a 7B model.",
  render: el => interactive(el, [{ k: "z", type: "seg", l: "ZeRO stage", v: "2", opts: [["0", "none"], ["1", "ZeRO-1"], ["2", "ZeRO-2"], ["3", "ZeRO-3"]] }], s => {
    const z = +s.z, w = z >= 3 ? 2 / 8 : 2, g = z >= 2 ? 2 / 8 : 2, o = z >= 1 ? 12 / 8 : 12, tot = 7 * (w + g + o);
    return `<div class="gpus">${range(1, 8).map(i => `<div class="gpu"><div class="gpu-col"><i class="s-v-b" style="height:${o / 16 * 100}%"></i><i class="s-k-b" style="height:${g / 16 * 100}%"></i><i class="s-q-b" style="height:${w / 16 * 100}%"></i></div><small>GPU ${i}</small></div>`).join("")}</div>` +
      legend([["s-q-b", "weights"], ["s-k-b", "gradients"], ["s-v-b", "optimizer state"]]) + `<p class="readout">per GPU: ${f2(w, 2)} + ${f2(g, 2)} + ${f2(o, 2)} = ${f2(w + g + o, 3)} B/param → <b>${f2(tot, 2)} GB</b></p>`; }) });
add("5.4", { at: "q", kind: "static", teaches: "The score row arrives in blocks", caption: "Scores processed in two blocks.", render: el => el.innerHTML = `<div class="blocks"><span class="blk">${toks(["1", "3"])}<small>block 1</small></span><span class="blk">${toks(["2"])}<small>block 2</small></span></div>` });
add("5.4", { at: "sol", kind: "stepper", teaches: "Running max and rescaled running sum", caption: "Online softmax denominator.",
  render: el => stepper(el, [{ t: "Block 1", c: "m = max(1, 3) = 3; ℓ = e^{1−3} + e^{3−3} = 0.1353 + 1 = 1.1353." }, { t: "Block 2", c: "m stays 3, so the rescale factor e^{3−3} = 1; add e^{2−3} = 0.3679 → ℓ = 1.5032." }, { t: "Check", c: "Same as computing Σ e^{s−3} over the full row at once: 0.1353 + 1 + 0.3679." }],
    i => matrix({ rows: ["running max m", "rescale factor", "running ℓ"], cols: ["start", "after block 1", "after block 2"], small: true, cell: (r, c) => ({ t: [["−∞", "3", "3"], ["—", "—", "1"], ["0", "1.1353", "1.5032"]][r][c], cls: c === Math.min(i + 1, 2) ? "hl" : c > Math.min(i + 1, 2) ? "dim" : "" }) })) });
add("5.5", { at: "sol", kind: "static", teaches: "Memory hierarchy and the traffic Flash Attention removes", caption: "Orders of magnitude from the lecture.",
  render: el => el.innerHTML = `<div class="lanes"><div><h6>Standard attention</h6>${pipe([{ t: "HBM", s: "~100 GB · ~1 TB/s", cls: "s-bad" }, { t: "SRAM", s: "compute S", edge: "read Q, K" }, { t: "HBM", s: "write S, P (n × n)", edge: "write", cls: "s-bad" }])}</div><div><h6>Flash Attention</h6>${pipe([{ t: "HBM", s: "Q, K, V tiles" }, { t: "SRAM", s: "~100 MB · fast; compute S, P, O per tile", cls: "s-good", edge: "load tiles" }, { t: "HBM", s: "write O only", edge: "write" }])}</div></div>` });
add("5.6", { at: "sol", kind: "static", teaches: "What each parallelism strategy splits", caption: "Four ways to split work across devices.",
  render: el => el.innerHTML = `<div class="par">${[["TP", "one weight matrix split by columns", "W → [W₁ | W₂]"], ["PP", "consecutive layers per device", "L1–8 | L9–16"], ["CP", "the sequence split across devices", "tokens 1–4k | 4k–8k"], ["EP", "different experts on different devices", "E1–8 | E9–16"]].map(([a, b, c]) => `<div class="par-c"><b>${a}</b><span>${b}</span>${shape(c)}<div class="par-dev"><i>GPU 0</i><i>GPU 1</i></div></div>`).join("")}</div>` });
const timeline = (pre, n, tpot, total, lbl) => `<div class="tl"><span class="tl-l">${lbl}</span><div class="tl-t"><i class="tl-pre" style="width:${pre / total * 100}%"></i>${n <= 60 ? range(1, n).map(k => `<i class="tl-tick" style="left:${(pre + k * tpot) / total * 100}%"></i>`).join("") : `<i class="tl-dense" style="left:${pre / total * 100}%;width:${Math.min(100, n * tpot / total * 100)}%"></i>`}</div><span class="tl-v">${f2(pre + n * tpot, 1)} s</span></div>`;
add("5.7", { at: "sol", kind: "dataviz", teaches: "Decode time dominates end-to-end latency", caption: "One request on a time axis.",
  render: el => el.innerHTML = timeline(0.5, 500, 0.02, 11, "request") + legend([["tl-pre", "prefill (TTFT 0.5 s)"], ["tl-dense", "500 decode steps × 20 ms"]]) });
add("5.8", { at: "sol", kind: "dataviz", teaches: "Parallel prefill versus sequential decode", caption: "Illustrative timings: prefill ~0.05 ms/token in parallel, decode 20 ms/token.",
  render: el => el.innerHTML = timeline(0.5, 10, 0.02, 201, "10k in → 10 out") + timeline(0.01, 10000, 0.02, 201, "10 in → 10k out") + legend([["tl-pre", "prefill"], ["tl-dense", "decode"]]) });
add("5.9", { at: "sol", kind: "dataviz", teaches: "Roofline: memory-bound below the ridge, compute-bound above", caption: "Attainable throughput versus arithmetic intensity.",
  render: el => el.innerHTML = plot({ x: { min: 0.1, max: 1e5, log: true, ticks: [0.1, 1, 10, 100, 1e3, 1e4, 1e5], fmt: v => v >= 1e3 ? `${v / 1e3}k` : v, label: "arithmetic intensity (FLOP/byte)" }, y: { min: 0.1, max: 3000, log: true, ticks: [0.1, 1, 10, 100, 1000], label: "attainable TFLOP/s" },
    series: [{ pts: [[0.1, 0.1], [1000, 1000], [1e5, 1000]], cls: "s-acc" }], vlines: [{ x: 1000, label: "ridge 1,000" }], dots: [{ x: 1, y: 1, cls: "s-bad", label: "decode, batch 1" }, { x: 256, y: 256, cls: "s-q", label: "batch 256", dy: 16 }], aria: "roofline" }) });
add("5.10", { at: "q", kind: "static", teaches: "The KV cache as a tensor and its dimensions", caption: "One sequence's KV cache, dimension by dimension.",
  render: el => el.innerHTML = `<div class="tensor">${[["2", "K and V"], ["32", "layers L"], ["32", "KV heads"], ["4,096", "tokens T"], ["128", "head dim"], ["2 B", "fp16"]].map(([n, l], i) => (i ? `<b>×</b>` : "") + `<div class="tdim"><span>${n}</span><small>${l}</small></div>`).join("")}</div>` });
add("5.11", { at: "q", kind: "static", teaches: "How GQA maps many query heads onto few KV heads", caption: "24 query heads share 2 key/value heads (12 each).",
  render: el => { const W = 540, H = 150; let s = "";
    for (let i = 0; i < 24; i++) { const x = 18 + i * 21.5, g = i < 12 ? 0 : 1, gx = g ? 400 : 140; s += `<line class="tree-e" x1="${x}" y1="34" x2="${gx}" y2="108"/><rect class="qh" x="${x - 7}" y="18" width="14" height="16"/>`; }
    [140, 400].forEach((x, g) => s += `<rect class="kvh" x="${x - 30}" y="108" width="60" height="22"/><text class="pl-t" x="${x}" y="123" text-anchor="middle">KV ${g + 1}</text>`);
    s += `<text class="pl-t" x="4" y="12">query heads (24)</text>`;
    el.innerHTML = `<div class="pl-wrap"><svg class="pl" viewBox="0 0 ${W} ${H}" role="img" aria-label="24 query heads grouped into 2 KV heads">${s}</svg></div>`; } });
add("5.12", { at: "sol", kind: "interactive", teaches: "Block size trades wasted slots against table entries", caption: "Three sequences of 37, 9 and 22 tokens stored in fixed-size blocks. Hatched slots are reserved but unused.",
  render: el => interactive(el, [{ k: "b", type: "seg", l: "Block size", v: "16", opts: [["1", "1"], ["4", "4"], ["16", "16"], ["64", "64"]] }], s => {
    const B = +s.b, seqs = [37, 9, 22]; let blocks = 0, waste = 0;
    const rows = seqs.map((n, k) => { const nb = Math.ceil(n / B); blocks += nb; waste += nb * B - n; const cap = nb * B; const cells = Math.min(cap, 80);
      return `<div class="pg-row"><span>seq ${k + 1} (${n})</span><div class="pg-cells">${range(0, cells - 1).map(c => `<i class="${c < n ? "used" : "waste"} ${c % B === 0 ? "start" : ""}"></i>`).join("")}${cap > 80 ? `<em>+${cap - 80}</em>` : ""}</div></div>`; }).join("");
    return rows + `<p class="readout">table entries (blocks) ${blocks} · wasted slots ${waste}</p>`; }) });
add("5.13", { at: "sol", kind: "static", teaches: "Accept probability as the target/draft ratio", caption: "One drafted token.",
  render: el => el.innerHTML = bars([{ l: "p<sub>draft</sub>(x)", v: 0.5, fill: "s-q" }, { l: "p<sub>target</sub>(x)", v: 0.3, fill: "s-acc" }], { max: 0.6, fmt: v => f2(v, 2) }) + `<p class="readout">accept with probability 0.3 / 0.5 = 0.6; otherwise resample from max(0, p<sub>target</sub> − p<sub>draft</sub>)</p>` });
add("5.14", { at: "q", kind: "stepper", teaches: "One speculative round: draft, verify in one pass, accept a prefix, add a token", caption: "Illustrative round with γ = 4.",
  render: el => { const d = ["is", "cute", "and", "warm"]; const ok = [1, 1, 0];
    stepper(el, [{ t: "Draft", c: "The small model proposes 4 tokens one by one (cheap)." }, { t: "Verify", c: "The target scores all 4 positions in a single forward pass." }, { t: "Accept prefix", c: "“is”, “cute” accepted; “and” rejected, so “warm” is discarded." }, { t: "Correct", c: "The target resamples position 3 (“so”): 3 tokens from one target pass." }],
      i => toks([{ t: "my teddy bear", cls: "dim" }, ...d.map((t, j) => ({ t: i >= 3 && j === 2 ? "so" : t, cls: i === 0 ? "s-q" : i === 1 ? "s-q outlined" : j < 2 ? "s-good" : j === 2 ? (i >= 3 ? "s-acc" : "s-bad") : "masked" }))])); } });
add("5.14", { at: "sol", kind: "dataviz", teaches: "Expected tokens per target pass rises steeply with acceptance rate", caption: "γ = 4.",
  render: el => el.innerHTML = plot({ x: { min: 0, max: 1, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1], label: "acceptance α" }, y: { min: 1, max: 5, ticks: [1, 2, 3, 4, 5], label: "tokens per target pass" }, series: [{ pts: range(0, 0.99, 0.01).map(a => [a, (1 - a ** 5) / (1 - a)]), cls: "s-acc" }], dots: [{ x: 0.8, y: 3.3616, cls: "s-acc", label: "α 0.8 → 3.36", dx: -8, anchor: "end" }], aria: "speedup curve" }) });
NOFIG["5.15"] = "Open design question; the answer is a list of optimizations and metrics.";

// ===== Lecture 6 =====
const chunks = (n, all) => { const W = 540, H = all ? 120 : 92, X = v => 20 + v / 10000 * 500; let s = `<line class="pl-axis" x1="20" x2="520" y1="${H - 26}" y2="${H - 26}"/>`;
  [0, 2500, 5000, 7500, 10000].forEach(v => s += `<text class="pl-t" x="${X(v)}" y="${H - 8}" text-anchor="middle">${v}</text>`);
  for (let k = 0; k < n; k++) { const a = 448 * k, b = Math.min(10000, a + 512); s += `<rect class="chunk ${k % 2 ? "alt" : ""}" x="${X(a)}" y="${all ? 10 + (k % 3) * 22 : 14 + (k % 2) * 22}" width="${X(b) - X(a)}" height="16"/>`; if (!all) s += `<text class="pl-t" x="${X(b) + 4}" y="${26 + (k % 2) * 22}">[${a}, ${b})</text>`; }
  return `<div class="pl-wrap"><svg class="pl" viewBox="0 0 ${W} ${H}" role="img" aria-label="chunks along a 10,000-token document">${s}</svg></div>`; };
add("6.1", { at: "q", kind: "static", teaches: "Stride = chunk size − overlap", caption: "First three chunks of the document (stride 448, overlap 64).", render: el => el.innerHTML = chunks(3, false) });
add("6.1", { at: "sol", kind: "static", teaches: "All chunks, with a short final chunk", caption: "23 chunks; the last covers [9856, 10000).", render: el => el.innerHTML = chunks(23, true) });
NOFIG["6.2"] = "Three-dimensional vectors; the formula and arithmetic are the point.";
add("6.3", { at: "sol", kind: "dataviz", teaches: "IDF falls as a term becomes common", caption: "BM25 IDF against document frequency (N = 1,000).",
  render: el => el.innerHTML = plot({ x: { min: 1, max: 1000, log: true, ticks: [1, 10, 100, 1000], label: "documents containing the term n_t" }, y: { min: 0, max: 7, ticks: [0, 2, 4, 6], label: "IDF" }, series: [{ pts: [1, 2, 3, 5, 7, 10, 20, 30, 50, 70, 100, 200, 300, 500, 700, 1000].map(n => [n, Math.log((1000 - n + 0.5) / (n + 0.5) + 1)]), cls: "s-acc" }], dots: [{ x: 10, y: 4.557, cls: "s-acc", label: "“Cuddly”: 4.56" }, { x: 900, y: Math.log(100.5 / 900.5 + 1), cls: "s-q", label: "“the”", anchor: "end", dx: -8 }], aria: "IDF curve" }) });
add("6.4", { at: "sol", kind: "static", teaches: "Recall first, precision second", caption: "Two-stage retrieval funnel.",
  render: el => el.innerHTML = `<div class="funnel"><div style="width:100%">knowledge base · millions of chunks</div><div style="width:72%" class="s-q-b">stage 1: bi-encoder / BM25 → top 100 · <b>recall</b></div><div style="width:42%" class="s-acc-b">stage 2: cross-encoder → top 5 · <b>precision</b></div></div>` });
const rr = ann => `<div class="rr">${[1, 3, null, 2].map((r, q) => `<div class="rr-q"><b>q${q + 1}</b><div>${range(1, 5).map(k => `<i class="${k === r ? "rel" : ""}">${k}</i>`).join("")}</div>${ann ? `<span>${r ? `1/${r} = ${f2(1 / r, 3)}` : "0"}</span>` : ""}</div>`).join("")}</div>` + legend([["rel", "first relevant result"]]);
add("6.5", { at: "q", kind: "static", teaches: "Where the first relevant result lands per query", caption: "Top-5 results for four queries.", render: el => el.innerHTML = rr(false) });
add("6.5", { at: "sol", kind: "static", teaches: "Reciprocal rank per query", caption: "Average of 1/rank.", render: el => el.innerHTML = rr(true) });
add("6.6", { at: "sol", kind: "dataviz", teaches: "Discounted gains of the actual versus ideal order", caption: "rel<sub>i</sub>/log₂(i+1) at each rank.",
  render: el => { const g = r => r.map((v, i) => v / Math.log2(i + 2));
    el.innerHTML = `<div class="fig-split"><div><h6>actual [1, 3, 2] · DCG 3.893</h6>${bars(g([1, 3, 2]).map((v, i) => ({ l: `rank ${i + 1}`, v, fill: "s-q" })), { max: 3 })}</div><div><h6>ideal [3, 2, 1] · IDCG 4.762</h6>${bars(g([3, 2, 1]).map((v, i) => ({ l: `rank ${i + 1}`, v, fill: "s-acc" })), { max: 3 })}</div></div>`; } });
add("6.7", { at: "sol", kind: "static", teaches: "When each technique runs and what it embeds", caption: "Query-time versus index-time fixes.",
  render: el => el.innerHTML = `<div class="lanes"><div><h6>HyDE · query time</h6>${pipe([{ t: "query" }, { t: "LLM writes fake answer" }, { t: "embed fake answer", cls: "s-acc" }, { t: "search" }])}</div><div><h6>Contextual retrieval · index time</h6>${pipe([{ t: "chunk + whole doc" }, { t: "LLM writes context line" }, { t: "embed context + chunk", cls: "s-acc" }])}</div></div>` });
add("6.8", { at: "sol", kind: "static", teaches: "Who does what in a tool round trip", caption: "Sequence across the three parties.",
  render: el => { const lanes = ["App", "Model", "Backend"], X = [80, 270, 460], steps = [[0, 1, "1 · message + tool schemas"], [1, 0, "2 · find_teddy_bear(location)"], [0, 2, "3 · execute"], [2, 0, "4 · {\"name\": \"Teddy\"}"], [0, 1, "4 · result into context"], [1, 0, "5 · final answer"]]; let s = "";
    lanes.forEach((l, i) => s += `<text class="pl-al" x="${X[i]}" y="16" text-anchor="middle">${l}</text><line class="pl-grid strong" x1="${X[i]}" x2="${X[i]}" y1="24" y2="${36 + steps.length * 30}"/>`);
    steps.forEach(([a, b, t], k) => { const y = 44 + k * 30; s += arrowSVG(X[a], y, X[b], y, b === 2 || a === 2 ? "s-v" : "s-acc") + `<text class="pl-t" x="${(X[a] + X[b]) / 2}" y="${y - 5}" text-anchor="middle">${esc(t)}</text>`; });
    el.innerHTML = `<div class="pl-wrap"><svg class="pl" viewBox="0 0 540 ${50 + steps.length * 30}" role="img" aria-label="tool call sequence diagram">${s}</svg></div>`; } });
add("6.9", { at: "sol", kind: "interactive", teaches: "Prefix caching only works when the fixed part comes first", caption: "10,000 input tokens per request; cached tokens cost 10%.",
  render: el => interactive(el, [{ k: "o", type: "seg", l: "Prompt order", v: "fixed", opts: [["fixed", "fixed parts first"], ["ts", "timestamp first"]] }], s => { const ok = s.o === "fixed";
    return `<div class="stack-bar">${ok ? `<i class="s-good-b" style="flex:9">9,000 cached · ×0.1</i><i class="s-acc-b" style="flex:1">1,000</i>` : `<i class="s-acc-b" style="flex:0.3">ts</i><i class="s-bad-b" style="flex:9.7">10,000 uncached (prefix changed)</i>`}</div><p class="readout">relative cost ${ok ? "(900 + 1,000)/10,000 = 0.19" : "1.00"}</p>`; }) });
add("6.10", { at: "sol", kind: "static", teaches: "A router narrows the tools the model sees", caption: "Tool selection before the LLM call.",
  render: el => el.innerHTML = pipe([{ t: "80 tools", s: "overlapping, costly context" }, { t: "router", s: "conversation, profile, memory", cls: "s-q" }, { t: "5 relevant tools" }, { t: "LLM", cls: "s-acc" }]) });
add("6.11", { at: "sol", kind: "static", teaches: "Host, clients and servers in MCP", caption: "One host, one client per server.",
  render: el => el.innerHTML = `<div class="mcp"><div class="mcp-host"><b>MCP host</b><span>e.g. a desktop app</span><div>${chip("client 1")}${chip("client 2")}</div></div><div class="mcp-links" aria-hidden="true">⇄<br>⇄</div><div class="mcp-srv">${["Book provider", "Personal collection"].map(t => `<div class="pipe-node"><b>MCP server: ${t}</b><span>tools · resources · prompts</span></div>`).join("")}</div></div>` });
add("6.12", { at: "sol", kind: "static", teaches: "Three compaction strategies on a full context window", caption: "What stays in the window after compaction.",
  render: el => { const row = (l, cells) => `<div class="ctx"><span>${l}</span><div>${cells}</div></div>`, c = (n, cls) => range(1, n).map(() => `<i class="${cls}"></i>`).join("");
    el.innerHTML = row("full", c(12, "")) + row("deletion", c(3, "") + c(2, "gone") + c(4, "") + c(3, "gone")) + row("selection (sliding window)", c(7, "gone") + c(5, "")) + row("generation (summary)", `<i class="sum">summary: progress · constraints · remaining work · references</i>` + c(3, "")) + legend([["gone", "removed"], ["sum", "model-written summary"]]); } });
NOFIG["6.13"] = "The answer is a JSON schema; the code block is the representation.";

// ===== Lecture 7 =====
add("7.1", { at: "q", kind: "static", teaches: "Rater agreement as a contingency table", caption: "Counts out of 100.",
  render: el => el.innerHTML = matrix({ rows: ["A: yes", "A: no", "B total"], cols: ["B: yes", "B: no", "A total"], rowTitle: "rater A", colTitle: "rater B", cell: (i, j) => ({ t: [[40, 10, 50], [20, 30, 50], [60, 40, 100]][i][j], cls: i === j && i < 2 ? "hl" : i === 2 || j === 2 ? "dim" : "" }) }) });
add("7.1", { at: "sol", kind: "static", teaches: "Chance agreement from the marginals", caption: "Observed agreement versus agreement expected by chance.",
  render: el => el.innerHTML = `<div class="fig-split">${matrix({ rows: ["A yes", "A no"], cols: ["B yes", "B no"], small: true, corner: "expected", cell: (i, j) => ({ t: [[30, 20], [20, 30]][i][j], cls: i === j ? "hl" : "" }) })}${bars([{ l: "p<sub>o</sub> observed", v: 0.7, fill: "s-acc" }, { l: "p<sub>e</sub> by chance", v: 0.5, fill: "s-mute" }], { max: 1, fmt: v => f2(v, 2) })}</div>` });
add("7.2", { at: "q", kind: "static", teaches: "The sample pool pass@k draws from", caption: "Ten sampled solutions; three pass.", render: el => el.innerHTML = toks([1, 0, 0, 1, 0, 0, 0, 1, 0, 0].map((r, i) => ({ t: `#${i + 1} ${r ? "✓" : "✗"}`, cls: r ? "s-good" : "s-bad" }))) });
const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }, pk = (n, c, k) => n - c < k ? 1 : 1 - C(n - c, k) / C(n, k);
add("7.2", { at: "sol", kind: "dataviz", teaches: "pass@k grows with k for a fixed pool", caption: "n = 10, c = 3.",
  render: el => el.innerHTML = plot({ x: { min: 1, max: 10, ticks: range(1, 10), label: "k" }, y: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], label: "pass@k" }, series: [{ pts: range(1, 10).map(k => [k, pk(10, 3, k)]), cls: "s-acc" }], dots: [{ x: 5, y: pk(10, 3, 5), cls: "s-acc", label: "k = 5: 0.917", dy: 18 }, { x: 1, y: 0.3, cls: "s-q", label: "k = 1: 0.3" }], aria: "pass at k curve" }) });
add("7.3", { at: "sol", kind: "dataviz", teaches: "The plug-in estimate sits below the unbiased one", caption: "n = 10, c = 3.",
  render: el => el.innerHTML = plot({ x: { min: 1, max: 10, ticks: range(1, 10), label: "k" }, y: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], label: "estimate" }, series: [{ pts: range(1, 10).map(k => [k, pk(10, 3, k)]), cls: "s-acc", label: "unbiased" }, { pts: range(1, 10).map(k => [k, 1 - 0.7 ** k]), cls: "s-mute", dash: true, label: "plug-in 1 − (1 − p̂)^k" }], dots: [{ x: 5, y: 0.9167, cls: "s-acc", label: "0.917" }, { x: 5, y: 1 - 0.7 ** 5, cls: "s-mute", label: "0.832", dy: 18 }], aria: "two estimator curves" }) });
add("7.4", { at: "sol", kind: "static", teaches: "pass@k and cons@k can disagree on the same samples", caption: "Five answers to a problem whose correct answer is 12.",
  render: el => el.innerHTML = toks([12, 15, 12, 15, 15].map(a => ({ t: String(a), cls: a === 12 ? "s-good" : "s-bad" }))) + `<p class="readout">pass@5: a 12 is present → ✓ · cons@5: majority says 15 → ✗</p>` });
const bleu = ann => `<div class="align"><div><span class="al-l">candidate</span>${toks(["the", "the", "the", "bear"].map((t, i) => ({ t, sub: ann ? (i === 0 || i === 3 ? "✓" : "clipped") : null, cls: ann ? (i === 0 || i === 3 ? "s-good" : "masked") : "s-q" })))}</div><div><span class="al-l">reference</span>${toks(["the", "bear", "sat"].map(t => ({ t, cls: "s-k" })))}</div></div>`;
add("7.5", { at: "q", kind: "static", teaches: "Candidate and reference tokens side by side", caption: "Unigram counts: “the” ×3 in the candidate, ×1 in the reference.", render: el => el.innerHTML = bleu(false) });
add("7.5", { at: "sol", kind: "static", teaches: "Clipping caps each word at its reference count", caption: "Only one “the” can match.", render: el => el.innerHTML = bleu(true) });
add("7.6", { at: "sol", kind: "static", teaches: "Recall counts reference words that are covered", caption: "Matched reference unigrams.",
  render: el => el.innerHTML = `<div class="align"><div><span class="al-l">reference</span>${toks(TEDDY.map(t => ({ t, cls: ["a", "teddy", "bear", "is"].includes(t) ? "s-good" : "masked" })))}</div><div><span class="al-l">candidate</span>${toks(["a", "teddy", "bear", "is", "sleeping"].map(t => ({ t, cls: t === "sleeping" ? "masked" : "s-q" })))}</div></div><p class="readout">4 of 6 reference words matched</p>` });
NOFIG["7.7"] = "A list of practices; no structure to inspect.";
NOFIG["7.8"] = "Naming a bias; the solution pairs each bias with its remedy in text.";
const fail = hi => `<div class="fails">${[["Tool prediction", "no tool · hallucinated tool · wrong tool · wrong argument"], ["Tool call", "wrong response · no response"], ["Response generation", "answer misstates the result"]].map(([t, s], i) => `${i ? `<span class="pipe-arrow" aria-hidden="true"></span>` : ""}<div class="pipe-node ${i === hi ? "s-bad fail-hi" : ""}"><b>${i === hi ? "✗ " : ""}${t}</b><span>${s}</span></div>`).join("")}</div>`;
add("7.9", { at: "sol", kind: "static", teaches: "Locating a hallucinated tool in the agent loop", caption: "The failure happens before any tool runs.", render: el => el.innerHTML = fail(0) });
add("7.10", { at: "sol", kind: "static", teaches: "Locating an empty tool response", caption: "The root cause is the tool call stage; the made-up answer is downstream.", render: el => el.innerHTML = fail(1) });
add("7.11", { at: "sol", kind: "dataviz", teaches: "How abstention changes a penalized score", caption: "Contributions to the score out of 100 questions.",
  render: el => el.innerHTML = `<div class="fig-split"><div><h6>Model A · score 0.35</h6>${bars([{ l: "correct", v: 0.6, fill: "s-good" }, { l: "incorrect", v: -0.25, fill: "s-bad" }, { l: "abstain", v: 0, fill: "s-mute" }], { max: 0.7, fmt: v => (v > 0 ? "+" : "") + f2(v, 2) })}</div><div><h6>Model B (guesses) · 0.40</h6>${bars([{ l: "correct", v: 0.7, fill: "s-good" }, { l: "incorrect", v: -0.3, fill: "s-bad" }, { l: "abstain", v: 0, fill: "s-mute" }], { max: 0.7, fmt: v => (v > 0 ? "+" : "") + f2(v, 2) })}</div></div>` });
const eloE = d => 1 / (1 + 10 ** (-d / 400));
add("7.12", { at: "sol", kind: "dataviz", teaches: "Expected score as a logistic function of the rating gap", caption: "E<sub>A</sub> against R<sub>A</sub> − R<sub>B</sub>.",
  render: el => el.innerHTML = plot({ x: { min: -600, max: 600, ticks: [-600, -300, 0, 300, 600], label: "R_A − R_B" }, y: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], label: "E_A" }, series: [{ pts: range(-600, 600, 10).map(d => [d, eloE(d)]), cls: "s-acc" }], dots: [{ x: 200, y: eloE(200), cls: "s-acc", label: "+200 → 0.760", dy: 18 }], aria: "Elo curve" }) });
add("7.13", { at: "sol", kind: "interactive", teaches: "Elo updates scale with surprise", caption: "Change ratings, outcome and K.",
  render: el => interactive(el, [{ k: "a", l: "R<sub>A</sub>", min: 1200, max: 1800, step: 10, v: 1600 }, { k: "b", l: "R<sub>B</sub>", min: 1200, max: 1800, step: 10, v: 1400 }, { k: "K", l: "K", min: 8, max: 64, step: 8, v: 32 }, { k: "s", type: "seg", l: "A's result", v: "0", opts: [["1", "win"], ["0.5", "tie"], ["0", "loss"]] }], s => {
    const E = eloE(s.a - s.b), d = s.K * (s.s - E);
    return bars([{ l: "E<sub>A</sub> expected", v: E, fill: "s-q" }, { l: "S<sub>A</sub> actual", v: s.s, fill: "s-acc" }], { max: 1, fmt: v => f2(v, 3) }) + `<p class="readout">R<sub>A</sub>′ = ${s.a} + ${s.K}·(${s.s} − ${f2(E, 3)}) = <b>${f2(s.a + d, 2)}</b> · R<sub>B</sub>′ = ${f2(s.b - d, 2)}</p>`; }) });
const pareto = fr => plot({ x: { min: 0.7, max: 30, log: true, ticks: [1, 2, 5, 10, 20], fmt: v => `$${v}`, label: "cost per task (log)" }, y: { min: 50, max: 76, ticks: [50, 55, 60, 65, 70, 75], label: "intelligence score" },
  series: fr ? [{ pts: [[1, 60], [5, 70], [20, 72]], cls: "s-acc", label: "Pareto frontier" }] : [], dots: [["P", 1, 60], ["Q", 2, 55], ["R", 5, 70], ["S", 20, 72]].map(([l, x, y]) => ({ x, y, label: l, cls: fr ? (l === "Q" ? "s-bad" : "s-acc") : "s-q" })), aria: "cost versus score scatter" });
add("7.14", { at: "q", kind: "dataviz", teaches: "Plot the four models before judging dominance", caption: "Score versus cost.", render: el => el.innerHTML = pareto(false) });
add("7.14", { at: "sol", kind: "dataviz", teaches: "The frontier and the dominated point", caption: "Q sits below and to the right of P.", render: el => el.innerHTML = pareto(true) });
NOFIG["7.15"] = "Open design question; the answer is a structured list.";

// ===== Lecture 8 =====
add("8.1", { at: "sol", kind: "static", teaches: "Sequential left-to-right decoding versus parallel refinement", caption: "Forward passes for a 6-token answer.",
  render: el => el.innerHTML = `<div class="lanes"><div><h6>Autoregressive · 6 passes</h6>${range(1, 6).map(k => toks(TEDDY.map((t, j) => ({ t: j < k ? t : "·", cls: j === k - 1 ? "s-acc" : j < k ? "" : "dim" })), { cls: "tight" })).join("")}</div><div><h6>Diffusion · T = 3 passes</h6>${[[1, 3], [0, 1, 3, 5], [0, 1, 2, 3, 4, 5]].map(on => toks(TEDDY.map((t, j) => ({ t: on.includes(j) ? t : "[M]", cls: on.includes(j) ? "" : "masked" })), { cls: "tight" })).join("")}</div></div>` });
add("8.2", { at: "sol", kind: "static", teaches: "Noisy embeddings fall between valid tokens", caption: "Continuous diffusion must round back to the nearest token embedding.",
  render: el => el.innerHTML = vecPlot([{ x: 1.4, y: 1.2, l: "teddy", cls: "s-k" }, { x: 2.6, y: 0.5, l: "bear", cls: "s-k" }, { x: 0.6, y: 2.3, l: "toy", cls: "s-k" }, { x: 2.0, y: 1.7, l: "noisy point (no token)", cls: "s-bad", dx: 6 }], { scale: 70, w: 360, h: 230, cx: 30, cy: 200, aria: "token embeddings with a noisy point between them" }) });
add("8.3", { at: "q", kind: "static", teaches: "Absorbing-state transitions", caption: "Per-step transition for one position.",
  render: el => el.innerHTML = `<div class="states"><span class="st s-k">token</span><span class="st-e">→ stays: 0.9<br>→ [MASK]: 0.1</span><span class="st masked">[MASK]</span><span class="st-e">→ stays: 1.0 (absorbing)</span></div>` });
add("8.3", { at: "sol", kind: "dataviz", teaches: "α_t decays geometrically", caption: "Probability a token is still unmasked.",
  render: el => el.innerHTML = plot({ x: { min: 0, max: 20, ticks: [0, 5, 10, 15, 20], label: "step t" }, y: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], label: "α_t = 0.9^t" }, series: [{ pts: range(0, 20).map(t => [t, 0.9 ** t]), cls: "s-acc" }], dots: [{ x: 5, y: 0.9 ** 5, cls: "s-acc", label: "t = 5: 0.590" }], aria: "decay curve" }) });
add("8.4", { at: "sol", kind: "static", teaches: "Expected masked count = n(1 − α)", caption: "One random draw of 20 positions (8 masked); the expectation is 8.19.",
  render: el => el.innerHTML = `<div class="cells20">${[0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1].map(m => `<i class="${m ? "masked" : "s-k-b"}">${m ? "M" : ""}</i>`).join("")}</div>` });
add("8.5", { at: "sol", kind: "static", teaches: "One masked-diffusion training step", caption: "Training loop.",
  render: el => el.innerHTML = pipe([{ t: "sample t ∈ [0, 1]" }, { t: "mask each token w.p. t" }, { t: "bidirectional model" }, { t: "CE on masked · × 1/t", cls: "s-acc" }, { t: "backprop" }]) });
const L86 = [["A", null], ["teddy", 0.5], ["bear", null], ["is", 1.0], ["reading", 1.5], ["[EOS]", null]];
add("8.6", { at: "q", kind: "static", teaches: "Which positions contribute to the loss", caption: "Three masked positions with their −log p.",
  render: el => el.innerHTML = toks(L86.map(([t, v]) => v == null ? { t } : { t: "[MASK]", sub: `−log p = ${v}`, cls: "masked" })) });
add("8.6", { at: "sol", kind: "static", teaches: "Sum over masked positions, then weight by 1/t", caption: "Loss at t = 0.25.",
  render: el => el.innerHTML = pipe([{ t: "0.5 + 1.0 + 1.5", s: "masked positions only" }, { t: "3.0" , edge: "sum" }, { t: "12", edge: "× 1/t = × 4", cls: "s-acc" }]) });
NOFIG["8.7"] = "The comparison is three short contrasts; the options already state them.";
add("8.8", { at: "sol", kind: "stepper", teaches: "Independent per-position sampling can produce inconsistent pairs", caption: "Two masked positions decided in one step versus one at a time.",
  render: el => { const ctx = ["The", "teddy"], m = { a: [["bears", 0.55], ["bear", 0.45]], b: [["is", 0.55], ["are", 0.45]] };
    const row = (x, y) => toks([...ctx, x, y, "reading"].map(t => ({ t, cls: t === "[MASK]" ? "masked" : ["bears", "is", "are", "bear"].includes(t) ? "s-acc" : "" })));
    stepper(el, [{ t: "Masked input", c: "Two positions to fill." }, { t: "Per-position predictions", c: "Each position sees the same context and its own marginal." }, { t: "Commit both at once", c: "argmax per position gives “bears is”: each fine alone, inconsistent together." }, { t: "One at a time", c: "Commit “bears” first; position 4 now conditions on it and picks “are”." }],
      i => [row("[MASK]", "[MASK]"), row("[MASK]", "[MASK]") + `<div class="fig-split"><div><h6>position 3</h6>${bars(m.a.map(([l, v]) => ({ l, v, fill: "s-q" })), { max: 1, fmt: v => f2(v, 2) })}</div><div><h6>position 4</h6>${bars(m.b.map(([l, v]) => ({ l, v, fill: "s-q" })), { max: 1, fmt: v => f2(v, 2) })}</div></div>`,
        row("bears", "is") + `<p class="readout s-bad">✗ “bears is”</p>`, row("bears", "are") + `<p class="readout">p(are | bears) ≈ 0.9 → ✓ “bears are”</p>`][i]); } });
add("8.9", { at: "sol", kind: "dataviz", teaches: "Stale commit-time confidence versus confidence in the current context", caption: "Confidence per token of “The teddy bears is reading” (illustrative).",
  render: el => { const t = ["The", "teddy", "bears", "is", "reading"];
    el.innerHTML = `<div class="fig-split"><div><h6>at commit time (ReMDM-conf)</h6>${bars([0.97, 0.9, 0.8, 0.75, 0.95].map((v, i) => ({ l: t[i], v, fill: i === 3 ? "s-acc" : "s-mute" })), { max: 1, fmt: v => f2(v, 2) })}<p class="fig-note">lowest = “is”</p></div><div><h6>given current context (PRISM)</h6>${bars([0.95, 0.95, 0.02, 0.4, 0.9].map((v, i) => ({ l: t[i], v, fill: i === 2 ? "s-acc" : "s-mute" })), { max: 1, fmt: v => f2(v, 2) })}<p class="fig-note">lowest = “bears”, the real error</p></div></div>`; } });
add("8.10", { at: "sol", kind: "dataviz", teaches: "Fixed step count versus one pass per token", caption: "Sequential forward passes needed.",
  render: el => el.innerHTML = plot({ x: { min: 0, max: 1000, ticks: [0, 250, 500, 750, 1000], label: "output length (tokens)" }, y: { min: 0, max: 1000, ticks: [0, 250, 500, 750, 1000], label: "forward passes" }, series: [{ pts: [[0, 0], [1000, 1000]], cls: "s-q", label: "autoregressive" }, { pts: [[0, 64], [1000, 64]], cls: "s-acc", label: "dLLM, T = 64" }], dots: [{ x: 64, y: 64, cls: "s-mute", label: "crossover at 64" }, { x: 5, y: 5, cls: "s-q", label: "5-token answer", dy: 16 }], aria: "passes versus output length" }) });
add("8.11", { at: "sol", kind: "static", teaches: "Block-causal attention mask", caption: "8 positions in blocks of 4: full attention inside a block and to earlier blocks; future blocks masked.",
  render: el => el.innerHTML = matrix({ rows: range(1, 8).map(String), cols: range(1, 8).map(String), rowTitle: "query", colTitle: "key", small: true, cell: (i, j) => Math.floor(j / 4) > Math.floor(i / 4) ? { cls: "masked" } : { t: "✓", cls: Math.floor(j / 4) === Math.floor(i / 4) ? "allowed hl" : "allowed" } }) + legend([["hl", "within block (bidirectional)"], ["allowed", "earlier block (cacheable)"], ["masked", "future block"]]) });
add("8.12", { at: "sol", kind: "static", teaches: "Targets per training pass in each paradigm", caption: "Positions that receive a loss in one pass.",
  render: el => el.innerHTML = `<div class="align"><div><span class="al-l">AR (teacher forcing)</span>${toks(TEDDY.map(t => ({ t, sub: "target", cls: "s-good" })))}</div><div><span class="al-l">diffusion (t ≈ 0.33)</span>${toks(TEDDY.map((t, i) => [1, 4].includes(i) ? { t: "[MASK]", sub: "target", cls: "s-good masked" } : { t, cls: "dim" }))}</div></div>` });
add("8.13", { at: "sol", kind: "static", teaches: "A diffusion drafter with an autoregressive verifier", caption: "One DFlash-style round.",
  render: el => el.innerHTML = pipe([{ t: "dLLM drafter", s: "fills a block of 4 in 2 steps", cls: "s-q" }, { t: "AR target", s: "verifies all 4 in one pass", cls: "s-acc" }, { t: "accept prefix + resample", s: "output follows the target" }]) });

window.FIGS = { FIG, NOFIG };
})();
