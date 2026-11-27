"""Lab 7: Evaluation. Cohen's kappa, pass@k, BLEU, and Elo ratings.
Run: python lab7.py   (needs numpy)"""
import numpy as np
from collections import Counter
from math import comb

def cohens_kappa(a, b):
    """a, b: equal-length lists of labels from two raters."""
    # BEGIN SOLUTION
    n = len(a)
    po = sum(x == y for x, y in zip(a, b)) / n
    ca, cb = Counter(a), Counter(b)
    pe = sum(ca[l] * cb[l] for l in set(a) | set(b)) / n ** 2
    return (po - pe) / (1 - pe)
    # END SOLUTION

def pass_at_k(n, c, k):
    """Unbiased estimator: n samples, c correct. 1 - C(n-c, k) / C(n, k)."""
    # BEGIN SOLUTION
    if n - c < k:
        return 1.0
    return 1.0 - comb(n - c, k) / comb(n, k)
    # END SOLUTION

def clipped_precision(cand, ref, n):
    """Modified n-gram precision: each candidate n-gram counts at most as often as it appears in ref."""
    # BEGIN SOLUTION
    grams = lambda t: Counter(tuple(t[i:i+n]) for i in range(len(t) - n + 1))
    c, r = grams(cand), grams(ref)
    total = sum(c.values())
    return sum(min(v, r[g]) for g, v in c.items()) / total if total else 0.0
    # END SOLUTION

def bleu(cand, ref, max_n=2):
    """Geometric mean of clipped precisions 1..max_n times brevity penalty exp(1 - r/c) if c < r."""
    # BEGIN SOLUTION
    ps = [clipped_precision(cand, ref, n) for n in range(1, max_n + 1)]
    if min(ps) == 0:
        return 0.0
    c, r = len(cand), len(ref)
    bp = 1.0 if c >= r else np.exp(1 - r / c)
    return float(bp * np.exp(np.mean(np.log(ps))))
    # END SOLUTION

def elo_expected(r_a, r_b):
    """Expected score of A against B: 1 / (1 + 10 ** ((r_b - r_a) / 400))."""
    # BEGIN SOLUTION
    return 1.0 / (1.0 + 10 ** ((r_b - r_a) / 400))
    # END SOLUTION

def elo_update(r_a, r_b, score_a, k=32):
    """score_a: 1 win, 0.5 tie, 0 loss. Return the new (r_a, r_b)."""
    # BEGIN SOLUTION
    e_a = elo_expected(r_a, r_b)
    return r_a + k * (score_a - e_a), r_b + k * ((1 - score_a) - (1 - e_a))
    # END SOLUTION

if __name__ == "__main__":
    a = ["y"] * 40 + ["n"] * 30 + ["y"] * 10 + ["n"] * 20
    b = ["y"] * 40 + ["n"] * 30 + ["n"] * 10 + ["y"] * 20
    assert np.isclose(cohens_kappa(a, b), 0.4)
    assert np.isclose(pass_at_k(10, 3, 1), 0.3) and np.isclose(pass_at_k(10, 3, 5), 0.9167, atol=1e-4)
    assert pass_at_k(10, 8, 5) == 1.0
    assert np.isclose(clipped_precision("the the the cat".split(), "the cat sat".split(), 1), 0.5)
    ref = "a cute teddy bear is reading".split()
    assert np.isclose(bleu(ref, ref), 1.0)
    assert np.isclose(bleu("a cute teddy bear".split(), ref), np.exp(1 - 6 / 4))
    assert np.isclose(elo_expected(1600, 1400), 0.7597, atol=1e-4)
    ra, rb = elo_update(1600, 1400, 0.0)
    assert np.isclose(ra, 1575.69, atol=0.01) and np.isclose(ra + rb, 3000), "Elo is zero-sum"
    print("All Lab 7 tests passed.")
