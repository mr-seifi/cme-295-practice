"""Lab 4: RL for LLMs. Advantages from a value function, PPO clipping, GRPO, and forward vs reverse KL.
Run: python lab4.py   (needs numpy)"""
import numpy as np

def value_advantages(values_after, values_before):
    """Token-level advantage estimate A_t = V(prefix incl. token t) - V(prefix before token t)."""
    # BEGIN SOLUTION
    return np.asarray(values_after, float) - np.asarray(values_before, float)
    # END SOLUTION

def ppo_clip_objective(ratio, advantage, eps=0.2):
    """Per-sample min(ratio * A, clip(ratio, 1-eps, 1+eps) * A). (To be maximized.)"""
    # BEGIN SOLUTION
    ratio, advantage = np.asarray(ratio, float), np.asarray(advantage, float)
    return np.minimum(ratio * advantage, np.clip(ratio, 1 - eps, 1 + eps) * advantage)
    # END SOLUTION

def ppo_clip_grad_wrt_ratio(ratio, advantage, eps=0.2):
    """d objective / d ratio for one sample: A if the unclipped term is the one selected, else 0."""
    # BEGIN SOLUTION
    unclipped, clipped = ratio * advantage, np.clip(ratio, 1 - eps, 1 + eps) * advantage
    return float(advantage) if unclipped <= clipped else 0.0
    # END SOLUTION

def grpo_advantages(rewards, eps=1e-8):
    """(r - mean) / (std + eps) within one group of samples for the same prompt (population std)."""
    # BEGIN SOLUTION
    r = np.asarray(rewards, dtype=float)
    return (r - r.mean()) / (r.std() + eps)
    # END SOLUTION

def kl(p, q):
    """KL(p || q) for discrete distributions, in nats. Terms with p_i = 0 contribute 0."""
    # BEGIN SOLUTION
    p, q = np.asarray(p, float), np.asarray(q, float)
    m = p > 0
    return float(np.sum(p[m] * np.log(p[m] / q[m])))
    # END SOLUTION

if __name__ == "__main__":
    assert np.allclose(value_advantages([0.55, 0.9], [0.5, 0.55]), [0.05, 0.35])
    assert np.allclose(ppo_clip_objective([0.75, 1.25, 1.5], [3.0, -2.0, 1.0]), [2.25, -2.5, 1.2])
    assert ppo_clip_grad_wrt_ratio(1.5, 1.0) == 0.0, "ratio already above 1+eps with A > 0: no push"
    assert ppo_clip_grad_wrt_ratio(1.25, -2.0) == -2.0, "pessimistic term still active: keep pushing down"
    assert ppo_clip_grad_wrt_ratio(1.0, 1.0) == 1.0
    adv = grpo_advantages([1, 0, 0, 1, 1, 0, 0, 0])
    assert np.isclose(adv[0], 1.2910, atol=1e-4) and np.isclose(adv[1], -0.7746, atol=1e-4)
    assert np.allclose(grpo_advantages([1, 1, 1, 1]), 0), "all-equal group gives no signal"
    teacher, student = [0.5, 0.5], [0.9, 0.1]
    assert np.isclose(kl(teacher, student), 0.5108, atol=1e-4)   # forward KL(T || S)
    assert np.isclose(kl(student, teacher), 0.3681, atol=1e-4)   # reverse KL(S || T)
    print("All Lab 4 tests passed.")
