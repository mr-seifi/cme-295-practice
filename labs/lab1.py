"""Lab 1: Scaled dot-product attention and multi-head attention from scratch.
Run: python lab1.py   (needs numpy)"""
import numpy as np

def softmax(x, axis=-1):
    # BEGIN SOLUTION
    x = x - x.max(axis=axis, keepdims=True)  # subtract max for numerical stability
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)
    # END SOLUTION

def attention(Q, K, V, causal=False):
    """Q: (n, d_k), K: (m, d_k), V: (m, d_v). Returns (output (n, d_v), weights (n, m)).
    If causal, position i may only attend to positions j <= i."""
    # BEGIN SOLUTION
    d_k = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)
    if causal:
        n, m = scores.shape
        mask = np.triu(np.ones((n, m), dtype=bool), k=1)
        scores = np.where(mask, -np.inf, scores)
    w = softmax(scores, axis=-1)
    return w @ V, w
    # END SOLUTION

def multi_head_attention(X, W_q, W_k, W_v, W_o, h, causal=False):
    """X: (n, d_model). Each W: (d_model, d_model). Split into h heads of size d_model // h,
    run attention per head, concatenate, project with W_o."""
    # BEGIN SOLUTION
    n, d = X.shape
    dh = d // h
    Q, K, V = X @ W_q, X @ W_k, X @ W_v
    heads = [attention(Q[:, i*dh:(i+1)*dh], K[:, i*dh:(i+1)*dh], V[:, i*dh:(i+1)*dh], causal)[0]
             for i in range(h)]
    return np.concatenate(heads, axis=-1) @ W_o
    # END SOLUTION

if __name__ == "__main__":
    # Hand-checkable case from Exercise 1.4
    q = np.array([[1., 0.]]); K = np.array([[1, 0], [0, 1], [1, 1.]]); V = np.array([[1, 0], [0, 2], [3, 1.]])
    out, w = attention(q, K, V)
    assert np.allclose(w, [[0.4011, 0.1978, 0.4011]], atol=1e-4), w
    assert np.allclose(out, [[1.6044, 0.7967]], atol=1e-4), out
    # Rows of weights sum to 1; causal mask zeroes the future
    rng = np.random.default_rng(0)
    X = rng.normal(size=(6, 8))
    _, w = attention(X, X, X, causal=True)
    assert np.allclose(w.sum(-1), 1)
    assert np.allclose(np.triu(w, 1), 0), "future positions must get zero weight"
    # Causality check: changing the last token must not change earlier outputs
    Ws = [rng.normal(size=(8, 8)) for _ in range(4)]
    y1 = multi_head_attention(X, *Ws, h=2, causal=True)
    X2 = X.copy(); X2[-1] += 10
    y2 = multi_head_attention(X2, *Ws, h=2, causal=True)
    assert np.allclose(y1[:-1], y2[:-1]), "outputs before the last position leaked future info"
    assert y1.shape == (6, 8)
    print("All Lab 1 tests passed.")
