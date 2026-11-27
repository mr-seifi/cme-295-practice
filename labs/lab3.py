"""Lab 3: Post-training building blocks. LoRA, bits per byte, Bradley-Terry and DPO losses.
Run: python lab3.py   (needs numpy)"""
import numpy as np

class LoRALinear:
    """y = x W^T + (alpha / r) * x A^T B^T, with W (d_out, d_in) frozen,
    A (r, d_in) random small, B (d_out, r) zeros so training starts at the base model."""
    def __init__(self, W, r, alpha, rng):
        # BEGIN SOLUTION
        self.W = W
        d_out, d_in = W.shape
        self.A = rng.normal(scale=0.01, size=(r, d_in))
        self.B = np.zeros((d_out, r))
        self.scale = alpha / r
        # END SOLUTION

    def forward(self, x):
        # BEGIN SOLUTION
        return x @ self.W.T + self.scale * (x @ self.A.T) @ self.B.T
        # END SOLUTION

    def trainable_params(self):
        # BEGIN SOLUTION
        return self.A.size + self.B.size
        # END SOLUTION

    def merged_weight(self):
        """Return a single (d_out, d_in) matrix so inference costs nothing extra."""
        # BEGIN SOLUTION
        return self.W + self.scale * self.B @ self.A
        # END SOLUTION

def bits_per_byte(token_losses_nats, n_bytes):
    """Total cross-entropy (nats) converted to bits, divided by the text's length in bytes."""
    # BEGIN SOLUTION
    return float(np.sum(token_losses_nats) / np.log(2) / n_bytes)
    # END SOLUTION

def log_sigmoid(z):
    # BEGIN SOLUTION
    return -np.logaddexp(0, -z)   # stable log(1 / (1 + e^-z))
    # END SOLUTION

def reward_model_loss(r_chosen, r_rejected):
    """Mean of -log sigma(r_chosen - r_rejected) over a batch."""
    # BEGIN SOLUTION
    return float(np.mean(-log_sigmoid(np.asarray(r_chosen) - np.asarray(r_rejected))))
    # END SOLUTION

def dpo_loss(pi_logp_w, pi_logp_l, ref_logp_w, ref_logp_l, beta=0.1):
    """Inputs are sequence log-probs under policy and reference for chosen (w) and rejected (l)."""
    # BEGIN SOLUTION
    margin = beta * ((np.asarray(pi_logp_w) - ref_logp_w) - (np.asarray(pi_logp_l) - ref_logp_l))
    return float(np.mean(-log_sigmoid(margin)))
    # END SOLUTION

if __name__ == "__main__":
    rng = np.random.default_rng(2)
    W = rng.normal(size=(4096, 4096))
    lora = LoRALinear(W, r=8, alpha=16, rng=rng)
    assert lora.trainable_params() == 65536
    x = rng.normal(size=(3, 4096))
    assert np.allclose(lora.forward(x), x @ W.T), "with B = 0 the adapter must be a no-op"
    lora.B = rng.normal(size=lora.B.shape)  # pretend we trained
    assert np.allclose(lora.forward(x), x @ lora.merged_weight().T)
    assert np.isclose(bits_per_byte(np.full(1000, 2.0), 4200), 0.6870, atol=1e-4)
    assert np.isclose(reward_model_loss([2.0], [0.5]), 0.2014, atol=1e-4)
    assert np.isclose(log_sigmoid(-1000.0), -1000.0), "must be numerically stable"
    assert np.isclose(dpo_loss(-10.0, -21.0, -12.0, -20.0), 0.5544, atol=1e-4)
    assert np.isclose(dpo_loss(-5.0, -6.0, -5.0, -6.0), np.log(2)), "policy == reference gives log 2"
    print("All Lab 3 tests passed.")
