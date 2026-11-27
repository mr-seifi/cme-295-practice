"""Lab 5: Efficiency. Online softmax (the Flash Attention trick), KV-cache sizing, and the
speculative-decoding acceptance rule.
Run: python lab5.py   (needs numpy)"""
import numpy as np

def online_softmax_weighted_sum(scores, values, block=2):
    """Compute softmax(scores) @ values by streaming over blocks of keys, keeping only a running
    max m, running denominator l and running numerator acc. Never hold all exp(scores) at once."""
    # BEGIN SOLUTION
    scores, values = np.asarray(scores, float), np.asarray(values, float)
    m, l = -np.inf, 0.0
    acc = np.zeros(values.shape[1:])
    for s in range(0, len(scores), block):
        sb, vb = scores[s:s+block], values[s:s+block]
        m_new = max(m, sb.max())
        scale = np.exp(m - m_new)          # rescale what we accumulated so far
        e = np.exp(sb - m_new)
        l = l * scale + e.sum()
        acc = acc * scale + e @ vb
        m = m_new
    return acc / l
    # END SOLUTION

def kv_cache_bytes(layers, kv_heads, head_dim, tokens, bytes_per_value=2, batch=1):
    # BEGIN SOLUTION
    return 2 * layers * kv_heads * head_dim * tokens * bytes_per_value * batch
    # END SOLUTION

def accept_prob(p_target, p_draft):
    """Probability of keeping a token the draft proposed."""
    # BEGIN SOLUTION
    return min(1.0, p_target / p_draft)
    # END SOLUTION

def residual_distribution(p_target, p_draft):
    """Distribution to resample from after a rejection: normalized max(0, p_target - p_draft)."""
    # BEGIN SOLUTION
    r = np.maximum(0.0, np.asarray(p_target, float) - np.asarray(p_draft, float))
    return r / r.sum()
    # END SOLUTION

if __name__ == "__main__":
    rng = np.random.default_rng(5)
    s, V = rng.normal(size=7) * 5, rng.normal(size=(7, 3))
    w = np.exp(s - s.max()); w /= w.sum()
    assert np.allclose(online_softmax_weighted_sum(s, V, block=2), w @ V)
    assert np.allclose(online_softmax_weighted_sum(s + 1000, V, block=3), w @ V), "must be stable for huge scores"
    assert kv_cache_bytes(32, 32, 128, 4096) == 2 * 2**30
    assert kv_cache_bytes(32, 8, 128, 4096) == 2**29
    assert np.isclose(accept_prob(0.3, 0.5), 0.6) and accept_prob(0.5, 0.3) == 1.0
    # Key property: draft-then-accept/resample reproduces the target distribution exactly
    p_t, p_d = np.array([0.5, 0.3, 0.2]), np.array([0.2, 0.6, 0.2])
    acc = np.minimum(p_t, p_d)                       # P(draft proposes i and it is accepted)
    rej = 1 - acc.sum()
    assert np.allclose(acc + rej * residual_distribution(p_t, p_d), p_t)
    print("All Lab 5 tests passed.")
