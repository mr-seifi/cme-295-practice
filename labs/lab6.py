"""Lab 6: Retrieval. BM25 scoring, cosine similarity, and the metrics MRR and NDCG@k.
Run: python lab6.py   (needs numpy)"""
import numpy as np
from collections import Counter

def cosine(a, b):
    # BEGIN SOLUTION
    a, b = np.asarray(a, float), np.asarray(b, float)
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))
    # END SOLUTION

def bm25_scores(query, docs, k1=1.5, b=0.75):
    """query: list of terms; docs: list of lists of terms. Return one score per doc.
    idf(t) = ln((N - n_t + 0.5) / (n_t + 0.5) + 1)."""
    # BEGIN SOLUTION
    N = len(docs)
    avgdl = sum(len(d) for d in docs) / N
    df = Counter(t for d in docs for t in set(d))
    scores = []
    for d in docs:
        tf = Counter(d)
        s = 0.0
        for t in query:
            if t not in tf:
                continue
            idf = np.log((N - df[t] + 0.5) / (df[t] + 0.5) + 1)
            s += idf * tf[t] * (k1 + 1) / (tf[t] + k1 * (1 - b + b * len(d) / avgdl))
        scores.append(s)
    return scores
    # END SOLUTION

def mrr(first_relevant_ranks):
    """List of 1-based ranks of the first relevant result per query; None if none found."""
    # BEGIN SOLUTION
    return float(np.mean([0.0 if r is None else 1.0 / r for r in first_relevant_ranks]))
    # END SOLUTION

def ndcg_at_k(relevances, k):
    """Graded relevances in ranked order. Linear gain: DCG = sum rel_i / log2(i + 1), i from 1."""
    # BEGIN SOLUTION
    dcg = lambda rel: sum(g / np.log2(i + 2) for i, g in enumerate(rel[:k]))
    ideal = dcg(sorted(relevances, reverse=True))
    return float(dcg(relevances) / ideal) if ideal > 0 else 0.0
    # END SOLUTION

if __name__ == "__main__":
    assert np.isclose(cosine([1, 2, 2], [2, 1, 2]), 8 / 9)
    docs = [s.split() for s in [
        "the teddy bear is reading a book",
        "a cute cat is sleeping",
        "bear markets and bull markets",
        "the cute teddy bear reads every night"]]
    s = bm25_scores(["cute", "teddy", "bear"], docs)
    assert np.argmax(s) in (0, 3) and s[1] < s[3] and s[2] < s[0], s
    assert np.isclose(mrr([1, 3, None, 2]), 0.4583, atol=1e-4)
    assert np.isclose(ndcg_at_k([1, 3, 2], 3), 0.8175, atol=1e-4)
    assert np.isclose(ndcg_at_k([3, 2, 1], 3), 1.0)
    print("All Lab 6 tests passed.")
