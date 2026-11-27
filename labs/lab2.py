"""Lab 2: RoPE, RMSNorm, and decoding (temperature, top-k, top-p, beam search).
Run: python lab2.py   (needs numpy)"""
import numpy as np

def rope(x, pos, base=10000.0):
    """Rotate vector x (shape (d,), d even) for position `pos`.
    Pair (x[2i], x[2i+1]) is rotated by angle pos * theta_i with theta_i = base ** (-2i/d)."""
    # BEGIN SOLUTION
    d = x.shape[-1]
    theta = base ** (-2 * np.arange(d // 2) / d)
    c, s = np.cos(pos * theta), np.sin(pos * theta)
    x1, x2 = x[0::2], x[1::2]
    out = np.empty_like(x, dtype=float)
    out[0::2] = x1 * c - x2 * s
    out[1::2] = x1 * s + x2 * c
    return out
    # END SOLUTION

def rmsnorm(x, gamma, eps=1e-6):
    """x: (..., d). Divide by root-mean-square over the last axis, then scale by gamma."""
    # BEGIN SOLUTION
    return x / np.sqrt((x ** 2).mean(-1, keepdims=True) + eps) * gamma
    # END SOLUTION

def probs_from_logits(logits, temperature=1.0):
    # BEGIN SOLUTION
    z = np.asarray(logits, dtype=float) / temperature
    z -= z.max()
    p = np.exp(z)
    return p / p.sum()
    # END SOLUTION

def top_k_filter(p, k):
    """Keep the k most likely tokens, zero the rest, renormalize."""
    # BEGIN SOLUTION
    keep = np.argsort(p)[::-1][:k]
    out = np.zeros_like(p); out[keep] = p[keep]
    return out / out.sum()
    # END SOLUTION

def top_p_filter(p, top_p):
    """Keep the smallest set of most likely tokens whose cumulative probability >= top_p."""
    # BEGIN SOLUTION
    order = np.argsort(p)[::-1]
    cutoff = np.searchsorted(np.cumsum(p[order]), top_p - 1e-12) + 1
    keep = order[:cutoff]
    out = np.zeros_like(p); out[keep] = p[keep]
    return out / out.sum()
    # END SOLUTION

def beam_search(next_probs, beam_width, steps):
    """next_probs(prefix: tuple) -> dict token->prob. Returns (best_sequence, prob)."""
    # BEGIN SOLUTION
    beams = [((), 1.0)]
    for _ in range(steps):
        cand = [(seq + (t,), pr * q) for seq, pr in beams for t, q in next_probs(seq).items()]
        beams = sorted(cand, key=lambda c: -c[1])[:beam_width]
    return beams[0]
    # END SOLUTION

if __name__ == "__main__":
    rng = np.random.default_rng(1)
    q, k = rng.normal(size=16), rng.normal(size=16)
    assert np.isclose(np.linalg.norm(rope(q, 7)), np.linalg.norm(q)), "rotation must preserve norm"
    assert np.allclose(rope(q, 0), q)
    assert np.isclose(rope(q, 10) @ rope(k, 3), rope(q, 107) @ rope(k, 100)), "score must depend only on m - n"
    e = np.zeros(8); e[2] = 1.0
    r = rope(e, 3)
    assert np.isclose(np.arctan2(r[3], r[2]), 0.3)
    assert np.allclose(rmsnorm(np.array([1, 2, 3, 4.]), 1.0, eps=0), [0.3651, 0.7303, 1.0954, 1.4606], atol=1e-4)
    assert np.allclose(probs_from_logits([2, 1, 0]), [0.6652, 0.2447, 0.0900], atol=1e-4)
    assert np.isclose(probs_from_logits([2, 1, 0], 0.5)[0], 0.8668, atol=1e-4)
    p = np.array([0.35, 0.30, 0.15, 0.10, 0.06, 0.04])
    assert np.isclose(top_k_filter(p, 2)[0], 0.35 / 0.65)
    f = top_p_filter(p, 0.75)
    assert (f > 0).sum() == 3 and np.isclose(f[0], 0.4375), f
    tree = {(): {"soft": .55, "brown": .45},
            ("soft",): {"bear": .4, "toy": .35, "cub": .25},
            ("brown",): {"bear": .8, "toy": .2}}
    nxt = lambda s: tree[s]
    assert beam_search(nxt, 1, 2) == (("soft", "bear"), 0.55 * 0.4)
    seq, pr = beam_search(nxt, 2, 2)
    assert seq == ("brown", "bear") and np.isclose(pr, 0.36)
    print("All Lab 2 tests passed.")
