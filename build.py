"""Build the CME 295 practice reader.

  src/questions.js  -> math pre-rendered with KaTeX (tools/render-math.js)
  src/figures.js    -> figure library + per-question figures (inlined)
  src/reader.html   -> page template
  labs/lab*.py      -> labs split into tasks (starter = solution with BEGIN/END SOLUTION blocks removed)

Outputs:
  site/index.html                artifact build (KaTeX CSS + woff2 fonts inlined as data URIs)
  site/standalone/index.html     self-hosted build (links ./katex/katex.min.css)
  site/standalone/katex/         KaTeX stylesheet + woff2 fonts
"""
import ast, base64, json, pathlib, py_compile, re, shutil, subprocess

ROOT = pathlib.Path(__file__).parent
TMP = ROOT / ".tmp"; TMP.mkdir(exist_ok=True)
KATEX = ROOT / "node_modules" / "katex" / "dist"  # npm ci
META = {
 1: ("Attention from scratch", "Implement a stable softmax, scaled dot-product attention with a causal mask, and multi-head attention, then verify that causal outputs never see the future."),
 2: ("RoPE, RMSNorm and decoding", "Rotate queries and keys with RoPE and check the relative-position identity, write RMSNorm, then build temperature, top-k, top-p and beam search."),
 3: ("LoRA and preference losses", "Build a LoRA layer that starts as a no-op and merges into one matrix, convert loss to bits per byte, and write numerically stable Bradley–Terry and DPO losses."),
 4: ("PPO, GRPO and KL", "Compute token advantages from a value function, the PPO clipped objective and when its gradient vanishes, GRPO group advantages, and forward vs reverse KL."),
 5: ("Online softmax and serving math", "Reproduce the Flash Attention trick with a streaming softmax, size a KV cache, and prove that speculative decoding's accept/resample rule recovers the target distribution."),
 6: ("A tiny retrieval stack", "Score chunks with BM25 and cosine similarity, and evaluate rankings with MRR and NDCG@k."),
 7: ("Evaluation metrics", "Implement Cohen's kappa, the unbiased pass@k estimator, BLEU with clipping and brevity penalty, and Elo updates."),
 8: ("A masked diffusion LM in miniature", "Write the absorbing-state forward process, the 1/t-weighted masked diffusion loss, and confidence-based parallel unmasking with a toy model."),
}

def split(src):
    starter, solution, lines, i = [], [], src.splitlines(), 0
    while i < len(lines):
        ln = lines[i]
        if ln.strip() == "# BEGIN SOLUTION":
            ind = ln[: len(ln) - len(ln.lstrip())]
            starter.append(f'{ind}raise NotImplementedError("TODO")')
            i += 1
            while lines[i].strip() != "# END SOLUTION":
                solution.append(lines[i]); i += 1
            i += 1; continue
        starter.append(ln); solution.append(ln); i += 1
    return "\n".join(starter) + "\n", "\n".join(solution) + "\n"

def segments(code):
    tree = ast.parse(code); out = {}; tests = ""
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
            out[node.name] = (ast.get_source_segment(code, node), ast.get_docstring(node) or "")
        elif isinstance(node, ast.If):
            tests = ast.get_source_segment(code, node)
    return out, tests

labs = {}
for n in range(1, 9):
    src = (ROOT / "labs" / f"lab{n}.py").read_text()
    st, so = split(src)
    for kind, txt in (("starter", st), ("solution", so)):
        p = TMP / f"lab{n}_{kind}.py"; p.write_text(txt); py_compile.compile(str(p), doraise=True)
    s_seg, _ = segments(st); k_seg, tests = segments(so)
    tasks = []
    for name, (code, doc) in k_seg.items():
        sig = code.splitlines()[0].rstrip(":")
        tasks.append({"name": name, "sig": sig, "doc": doc or "Helper used by the other tasks.", "starter": s_seg[name][0], "solution": code})
    labs[n] = {"title": META[n][0], "blurb": META[n][1], "starter": st, "solution": so, "tasks": tasks, "tests": tests}

subprocess.run(["node", str(ROOT / "tools" / "render-math.js"), str(ROOT / "src" / "questions.js"), str(TMP / "questions.json")], check=True)
data = (TMP / "questions.json").read_text()
figs = (ROOT / "src" / "figures.js").read_text()
tpl = (ROOT / "src" / "reader.html").read_text()
safe = lambda s: s.replace("</script", "<\\/script")

# KaTeX CSS: keep woff2 only.
css = (KATEX / "katex.min.css").read_text()
css = re.sub(r'src:url\((fonts/[^)]+\.woff2)\) format\("woff2"\)(,url\([^)]+\) format\("[^"]+"\))*', r'src:url(\1) format("woff2")', css)
def inline_fonts(c):
    return re.sub(r'url\((fonts/[^)]+\.woff2)\)', lambda m: "url(data:font/woff2;base64," + base64.b64encode((KATEX / m.group(1)).read_bytes()).decode() + ")", c)

def page(katex_tag):
    return (tpl.replace("__KATEX_CSS__", katex_tag).replace("__DATA__", safe(data))
               .replace("__LABS__", safe(json.dumps(labs))).replace("__FIGURES__", safe(figs)))

out = ROOT / "site"; out.mkdir(exist_ok=True)
html = page("<style>" + inline_fonts(css) + "</style>")
(out / "index.html").write_text(html)

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Independent practice reader for Stanford CME 295, Transformers & Large Language Models (Fall 2026): questions with figures, interactive playgrounds and NumPy labs.">
<meta property="og:title" content="CME 295 Practice Companion">
<meta property="og:description" content="110 questions with figures, 5 playgrounds and 8 NumPy labs for Stanford CME 295 (Fall 2026).">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='5' fill='%238F1B1F'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-family='Georgia,serif' font-size='15' font-weight='700' fill='%23FBF8F1'%3E295%3C/text%3E%3C/svg%3E">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font-size:14px;font-family:system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
"""
body = page('<link rel="stylesheet" href="katex/katex.min.css">')
i = body.index("</style>") + len("</style>")
sdir = out / "standalone"; sdir.mkdir(exist_ok=True)
(sdir / "index.html").write_text(HEAD + body[:i] + "\n</head>\n<body>\n" + body[i:] + "\n</body>\n</html>\n")
kdir = sdir / "katex"; (kdir / "fonts").mkdir(parents=True, exist_ok=True)
(kdir / "katex.min.css").write_text(css)
for f in (KATEX / "fonts").glob("*.woff2"): shutil.copy(f, kdir / "fonts" / f.name)

scripts = re.findall(r"<script>(.*?)</script>", html, flags=re.S)
(TMP / "page.js").write_text("\n;\n".join(scripts))
print(f"built site/index.html ({len(html)//1024} KB), site/standalone/ ({len(body)//1024} KB + katex/)")
