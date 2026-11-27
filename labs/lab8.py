"""Lab 8: Masked diffusion LLMs. Forward masking process, the weighted training loss, and
confidence-based unmasking at inference with a toy "model".
Run: python lab8.py   (needs numpy)"""
import numpy as np
MASK = -1

def forward_mask(tokens, t, rng):
    """Absorbing-state corruption: with linear schedule alpha_t = 1 - t, each token independently
    stays itself with probability 1 - t and becomes MASK with probability t."""
    # BEGIN SOLUTION
    tokens = np.asarray(tokens)
    m = rng.random(tokens.shape) < t
    return np.where(m, MASK, tokens)
    # END SOLUTION

def mdlm_loss(x0, xt, log_probs, t):
    """x0: clean tokens (L,), xt: corrupted (L,), log_probs: (L, V) model log-probs given xt.
    Loss = (1/t) * sum over MASKED positions of -log p(x0_i | xt). Unmasked positions contribute 0."""
    # BEGIN SOLUTION
    masked = np.asarray(xt) == MASK
    nll = -log_probs[np.arange(len(x0)), x0]
    return float(nll[masked].sum() / t)
    # END SOLUTION

def generate(model, length, steps):
    """Start fully masked. At each step, query model(x) -> (L, V) probabilities, and commit the
    `length // steps` masked positions where the model is most confident (argmax token).
    Committed tokens are never remasked. Returns the final sequence."""
    # BEGIN SOLUTION
    x = np.full(length, MASK)
    per_step = length // steps
    for _ in range(steps):
        p = model(x)
        conf, tok = p.max(-1), p.argmax(-1)
        conf = np.where(x == MASK, conf, -np.inf)
        pick = np.argsort(conf)[::-1][:per_step]
        x[pick] = tok[pick]
    return x
    # END SOLUTION

if __name__ == "__main__":
    rng = np.random.default_rng(8)
    x0 = rng.integers(0, 50, size=20000)
    xt = forward_mask(x0, 0.3, rng)
    assert abs((xt == MASK).mean() - 0.3) < 0.01, "about t of the tokens should be masked"
    assert np.all((xt == MASK) | (xt == x0)), "unmasked tokens must be unchanged"
    V = 5
    x0 = np.array([0, 1, 2, 3])
    xt = np.array([0, MASK, 2, MASK])
    lp = np.log(np.full((4, V), 1 / V))
    assert np.isclose(mdlm_loss(x0, xt, lp, t=0.5), 2 * np.log(5) / 0.5)
    target = np.array([3, 1, 4, 1, 5, 9, 2, 6])
    calls = []
    def toy_model(x):
        """Knows the target; is more confident about later positions."""
        calls.append(1)
        p = np.full((len(target), 10), 0.01)
        p[np.arange(len(target)), target] = 0.5 + 0.05 * np.arange(len(target))
        return p / p.sum(-1, keepdims=True)
    out = generate(toy_model, 8, steps=4)
    assert np.array_equal(out, target) and len(calls) == 4, "8 tokens in 4 forward passes"
    print("All Lab 8 tests passed.")
