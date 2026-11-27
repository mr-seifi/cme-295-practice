"""Check every matrix and written-out sum of the multi-head playground.
Reference 1: NumPy, straight from MultiHead(X) = Concat(head_1..h) W_O, head_i = softmax(X W_Q^(i) (X W_K^(i))^T / sqrt(d_k)) X W_V^(i).
Reference 2 (when h*d_k = d_model): torch.nn.MultiheadAttention with the same weights."""
import json, re, sys, numpy as np, torch
torch.set_grad_enabled(False)
D = json.load(open(sys.argv[1]))
num = lambda s: -np.inf if s == "−∞" else float(s.replace("−", "-"))
M = lambda t: np.array([[num(x) for x in r] for r in t])
worst, fails, cfgs, torch_runs = {}, [], [], 0
def cmp(name, shown, ref, tol=0.0051):
    shown, ref = np.asarray(shown, float), np.asarray(ref, float)
    if shown.shape != ref.shape: fails.append(f"{tag} {name}: shape {shown.shape} vs {ref.shape}"); return
    fin = np.isfinite(ref)
    if not np.array_equal(fin, np.isfinite(shown)): fails.append(f"{tag} {name}: mask pattern differs"); return
    e = float(np.max(np.abs(shown[fin] - ref[fin]), initial=0)); worst[name] = max(worst.get(name, 0), e)
    if e > tol: fails.append(f"{tag} {name}: err {e:.4f}")
NUM = r"\(?(-?\d+(?:\.\d+)?)\)?"
for r in D["runs"]:
    h, f, causal, d, dk = r["h"], r["f"], r["causal"], r["d"], r["dk"]; w = h * dk; tag = f'[{r["label"]} f={f}]'
    if f == 0: cfgs.append(f'{r["label"]}: d_model={d} h={h} d_k={dk} causal={causal}')
    X = np.array([float(v) for v in r["X"]]).reshape(3, d)
    W = {k: M(r["proj"][k]["W"]) for k in "QKV"}; WO = M(r["WO"])
    cmp("X", M(r["Xshown"]), X)
    for k in "QKV":
        if W[k].shape != (d, w): fails.append(f"{tag} W_{k} shape {W[k].shape}")
    if WO.shape != (w, d): fails.append(f"{tag} W_O shape {WO.shape}")
    def head(g):
        c = slice(g * dk, (g + 1) * dk); q, k, v = (X @ W[n][:, c] for n in "QKV")
        S = q @ k.T / np.sqrt(dk)
        if causal: S = np.where(np.triu(np.ones((3, 3)), 1) > 0, -np.inf, S)
        A = np.exp(S - S.max(1, keepdims=True)); A /= A.sum(1, keepdims=True)
        return q, k, v, S, A, A @ v
    q, k, v, S, A, H = head(f)
    for n, P in zip("QKV", (q, k, v)): cmp(f"{n} head proj", M(r["proj"][n]["P"]), P)
    cmp("Q (st2)", M(r["Qs"]), q); cmp("K^T", M(r["KT"]), k.T); cmp("scores", M(r["S"]), S); cmp("scores (st3)", M(r["S3"]), S)
    cmp("A", M(r["A"]), A); cmp("A (st4)", M(r["A3"]), A); cmp("V (st4)", M(r["V3"]), v); cmp("head", M(r["H"]), H)
    cat = np.concatenate([head(g)[5] for g in range(h)], 1); out = cat @ WO
    cmp("concat", M(r["Cat"]), cat); cmp("output", M(r["Out"]), out)
    if w == d:
        torch_runs += 1
        mha = torch.nn.MultiheadAttention(d, h, bias=False, batch_first=True).double()
        mha.in_proj_weight.copy_(torch.tensor(np.concatenate([W["Q"].T, W["K"].T, W["V"].T]))); mha.out_proj.weight.copy_(torch.tensor(WO.T))
        x = torch.tensor(X)[None]; mask = torch.triu(torch.ones(3, 3, dtype=torch.bool), 1) if causal else None
        o, aw = mha(x, x, x, attn_mask=mask, need_weights=True, average_attn_weights=False)
        cmp("A vs torch", M(r["A"]), aw[0, f].numpy()); cmp("output vs torch", M(r["Out"]), o[0].numpy())
    if f"Total = 4 · dmodel · h · dk = {4 * d * w}" not in r["params"].replace("​", ""): fails.append(f"{tag} params: {r['params'][:120]}")
    for rd in r["reads"]:
        t = rd["text"].replace("−", "-"); cell = num(rd["cell"]); i, j, s = rd["i"], rd["j"], rd["st"]
        if s == 2 and "masked" in t:
            if not (causal and j > i and cell == -np.inf): fails.append(f"{tag} bogus mask readout {rd}")
            continue
        bold = float(re.findall(r"(?:=|≈) (-?\d+\.\d{3})", t.split("By head")[0])[-1]) if s != 3 else None
        if s == 1:
            prods = re.findall(NUM + "×" + NUM, t); exp = list(zip(X[i], W[rd["proj"]][:, f * dk + j]))
            if len(prods) != d or any(abs(float(a) - x) > 1e-9 or abs(float(b) - y) > 1e-9 for (a, b), (x, y) in zip(prods, exp)): fails.append(f"{tag} st1 operands {t[:120]}")
            if f"column {f*dk+j+1} of W" not in t: fails.append(f"{tag} st1 column label")
            tot = sum(float(a) * float(b) for a, b in prods)
            if abs(tot - bold) > 0.0006: fails.append(f"{tag} st1 sum {tot} vs {bold}")
        elif s == 2:
            prods = re.findall(NUM + "×" + NUM, t); tot = sum(float(a) * float(b) for a, b in prods) / np.sqrt(dk)
            if abs(tot - bold) > 0.003 or abs(bold - S[i, j]) > 0.0006: fails.append(f"{tag} st2 {tot:.4f} {bold} {S[i,j]:.4f}")
        elif s == 3:
            line2 = t.split("<br>")[0] if "<br>" in t else t
            m = re.search(r"= ([-\d.e]+) / \(([^)]*)\) ≈ (-?\d+\.\d+)", t)
            if not m: fails.append(f"{tag} st3 unparsed {t[:160]}"); continue
            nume, den, res = float(m.group(1)), [float(x) for x in m.group(2).split(" + ")], float(m.group(3))
            if abs(nume / sum(den) - res) > 0.002 or abs(res - A[i, j]) > 0.0006 or len(den) != 3: fails.append(f"{tag} st3 {nume}/{den} {res} {A[i,j]:.4f}")
            if "sums to 1.000" not in t: fails.append(f"{tag} st3 row sum")
        elif s == 4:
            prods = re.findall(NUM + "×" + NUM, t); tot = sum(float(a) * float(b) for a, b in prods)
            if len(prods) != 3 or abs(tot - bold) > 0.004 or abs(bold - H[i, j]) > 0.0006: fails.append(f"{tag} st4 {tot:.4f} {bold} {H[i,j]:.4f}")
        elif s == 5:
            first = t.split("By head")[0]; prods = re.findall(NUM + "×" + NUM, first); tot = sum(float(a) * float(b) for a, b in prods)
            if len(prods) != w or abs(tot - bold) > 0.004 or abs(bold - out[i, j]) > 0.0006: fails.append(f"{tag} st5 {tot:.4f} {bold} {out[i,j]:.4f}")
            if h > 1:
                parts = [float(x) for x in re.findall(r"contributes (-?\d+\.\d+)", t)]
                exp = [cat[i, g*dk:(g+1)*dk] @ WO[g*dk:(g+1)*dk, j] for g in range(h)]
                if len(parts) != h or max(abs(a - b) for a, b in zip(parts, exp)) > 0.0006: fails.append(f"{tag} per-head split {parts} vs {exp}")
print("configurations:", *cfgs, sep="\n  ")
print(f"runs (config × followed head): {len(D['runs'])} | also checked against torch: {torch_runs} | readouts checked: {sum(len(r['reads']) for r in D['runs'])} | page errors: {len(D['errs'])}")
for k, v in worst.items(): print(f"  {k:16s} max |shown − reference| = {v:.4f}")
print("FAILURES:" if fails else "ALL CHECKS PASSED", *fails[:30], sep="\n")
