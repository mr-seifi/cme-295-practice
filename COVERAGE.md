# Figure coverage

110 questions · 99 with visuals · 11 text-and-math · figures by kind: static figure 69, step-through 9, data visualization 31, interactive 12

| Q | Title | Visual (where) | What it teaches |
|---|---|---|---|
| 1.1 | Tokenizer trade-offs | static figure (question) + static figure (solution) | How text maps to subword tokens and IDs; Trade-off between vocabulary size and sequence length |
| 1.2 | Size of the embedding table | static figure (question) | An embedding lookup is a row selection from a /V/ × d table |
| 1.3 | Word2vec training pairs | static figure (question) + step-through (solution) | What one skip-gram window produces; Edge tokens have fewer neighbors; running count reaches 18 |
| 1.4 | Vanishing gradients in an RNN | static figure (question) + data visualization (solution) | Backprop through time multiplies one factor per step; Exponential decay of the gradient signal |
| 1.5 | One step of scaled dot-product attention | static figure (question) + step-through (solution) | Geometry of the query against each key; Order of operations: score, scale, softmax, weighted sum |
| 1.6 | Why divide by √d_k? | interactive (solution) | Unscaled scores saturate the softmax as d_k grows |
| 1.7 | Counting attention parameters | step-through (question) | Multi-head attention: project, split into heads, attend per head, concatenate, project; shapes at each transition |
| 1.8 | Size of the attention maps | static figure (solution) | h separate n × n maps per layer |
| 1.9 | The causal mask | step-through (question) + static figure (solution) | Causal attention: score every pair, mask the future, then softmax each row; Counting allowed pairs row by row gives n(n+1)/2 |
| 1.10 | Label smoothing targets | static figure (question) + static figure (solution) | The hard one-hot target before smoothing; Smoothing moves ε of mass onto the other tokens |
| 1.11 | Where position information is needed | static figure (solution) | Permutation equivariance: outputs follow the inputs' order |
| 1.12 | Attention vs recurrence | static figure (solution) | Path length: n−1 sequential hops versus 1 direct hop |
| 2.1 | BERT masking budget | static figure (question) | The 15% / 80-10-10 masking recipe as proportions |
| 2.2 | Training compute | text and math only | One multiplication; the display equation already splits forward and backward cost. |
| 2.3 | Chinchilla-optimal data | data visualization (solution) | Compute-optimal line D = 20N and models trained past it |
| 2.4 | Active parameters in a sparse MoE | static figure (question) | Total versus active experts in a fine-grained MoE |
| 2.5 | Routing collapse | data visualization (solution) | What collapse looks like in expert load, and the balanced target |
| 2.6 | A RoPE rotation angle | interactive (solution) | Each RoPE pair rotates at its own frequency θ_i |
| 2.7 | How RoPE encodes relative position | interactive (solution) | Shifting both positions leaves the relative angle and the score unchanged |
| 2.8 | RMSNorm by hand | data visualization (solution) | RMSNorm rescales; LayerNorm also re-centers |
| 2.9 | Reach of sliding window attention | step-through (question) | Receptive field grows by w per stacked layer |
| 2.10 | Temperature | static figure (question) + interactive (solution) | The raw logits before any temperature; Temperature sharpens (T<1) or flattens (T>1) the softmax |
| 2.11 | Nucleus (top-p) sampling | static figure (question) + interactive (solution) | The ranked next-token distribution; Top-p keeps the smallest prefix reaching p; temperature changes which tokens make it |
| 2.12 | Cost of beam search | static figure (question) | Where beam search spends its scoring: V at step 1, then k·V per step |
| 2.13 | Determinism at temperature 0 | static figure (solution) | Reduction order changes float sums, which can flip a near-tie argmax |
| 2.14 | Guided decoding | step-through (solution) | A grammar masks illegal tokens at every step |
| 2.15 | Pick a decoding strategy | text and math only | Open design question; the model answer is a three-line comparison. |
| 3.1 | Bits per byte | static figure (solution) | Unit conversions from per-token nats to bits per byte |
| 3.2 | What mid-training is for | static figure (solution) | Where mid-training sits in the pipeline |
| 3.3 | SFT loss masking | static figure (solution) | Which positions carry loss in SFT |
| 3.4 | LoRA parameter count | static figure (question) | Shapes of the low-rank factors |
| 3.5 | Why B starts at zero | static figure (solution) | Zero-initialized B makes the update vanish at step 0 |
| 3.6 | Serving many adapters | data visualization (solution) | Adapters versus full copies at scale |
| 3.7 | Bradley–Terry probability | data visualization (solution) | Preference probability as a sigmoid of the reward gap |
| 3.8 | DPO loss | data visualization (solution) | DPO loss decreases with the margin; log 2 at initialization |
| 3.9 | Classic RLHF pipeline | static figure (solution) | The full RLHF pipeline and where DPO shortcuts it |
| 3.10 | On-policy or off-policy? | static figure (solution) | Who generates the data × how dense the signal is |
| 3.11 | Model collapse | data visualization (solution) | Tails shrink generation after generation |
| 3.12 | Catastrophic forgetting during RL | static figure (solution) | Earlier checkpoints teach the student on their own domains |
| 3.13 | Plan a fine-tune on one GPU | data visualization (solution) | Memory budget for LoRA on a 24 GB GPU |
| 3.14 | Where DPO comes from | text and math only | The aligned multi-line derivation in the solution is the visual. |
| 4.1 | Subjective vs verifiable rewards | static figure (solution) | Two reward sources side by side |
| 4.2 | Why REINFORCE needs a baseline | data visualization (solution) | Subtracting a baseline turns two similar pushes into opposite ones |
| 4.3 | Advantage from a value function | data visualization (question) + data visualization (solution) | The value model's estimate along the response; Token advantage = change in value |
| 4.4 | PPO: when clipping does not apply | interactive (solution) | Which term the min selects, and where the gradient goes flat |
| 4.5 | PPO: negative advantage, large ratio | interactive (solution) | With A < 0 the pessimistic unclipped term keeps pushing ρ down |
| 4.6 | Forward KL | static figure (question) + data visualization (solution) | The two distributions being compared; Per-token terms of the forward KL |
| 4.7 | Reverse KL | data visualization (solution) | Reverse KL weights terms by the student's own mass |
| 4.8 | GRPO advantage | static figure (question) + data visualization (solution) | One GRPO group of outcomes; Group-normalized advantages |
| 4.9 | GRPO vs PPO | static figure (solution) | Components each algorithm keeps in memory |
| 4.10 | The increasing-length phenomenon | interactive (solution) | Dividing by /o/ shrinks per-token penalties for long wrong answers |
| 4.11 | Credit assignment in GRPO | static figure (question) + static figure (solution) | The response split into steps, with the faulty step marked; Outcome advantage is copied to every token |
| 4.12 | Design a verifiable reward | text and math only | Open design question; the answer is a reward specification in words. |
| 4.13 | On-policy distillation in practice | static figure (solution) | Per-token reverse KL locates where the student's text goes wrong |
| 5.1 | Weights alone | data visualization (solution) | Weights alone exceed one GPU's memory |
| 5.2 | Training memory with Adam | static figure (question) | Where the 16 bytes per parameter go |
| 5.3 | ZeRO-2 | interactive (solution) | What each ZeRO stage shards across 8 GPUs |
| 5.4 | Online softmax | static figure (question) + step-through (solution) | The score row arrives in blocks; Running max and rescaled running sum |
| 5.5 | More FLOPs, less time | static figure (solution) | Memory hierarchy and the traffic Flash Attention removes |
| 5.6 | Which parallelism splits what? | static figure (solution) | What each parallelism strategy splits |
| 5.7 | Time to last token | data visualization (solution) | Decode time dominates end-to-end latency |
| 5.8 | Prefill vs decode | data visualization (solution) | Parallel prefill versus sequential decode |
| 5.9 | Ridge point | data visualization (solution) | Roofline: memory-bound below the ridge, compute-bound above |
| 5.10 | Size of the KV cache | static figure (question) | The KV cache as a tensor and its dimensions |
| 5.11 | GQA savings | static figure (question) | How GQA maps many query heads onto few KV heads |
| 5.12 | PagedAttention block size | interactive (solution) | Block size trades wasted slots against table entries |
| 5.13 | Speculative decoding acceptance | static figure (solution) | Accept probability as the target/draft ratio |
| 5.14 | Expected speedup | step-through (question) + data visualization (solution) | One speculative round: draft, verify in one pass, accept a prefix, add a token; Expected tokens per target pass rises steeply with acceptance rate |
| 5.15 | Make a chatbot cheaper to serve | text and math only | Open design question; the answer is a list of optimizations and metrics. |
| 6.1 | Chunking a document | static figure (question) + static figure (solution) | Stride = chunk size − overlap; All chunks, with a short final chunk |
| 6.2 | Cosine similarity | text and math only | Three-dimensional vectors; the formula and arithmetic are the point. |
| 6.3 | BM25 IDF | data visualization (solution) | IDF falls as a term becomes common |
| 6.4 | Two retrieval stages | static figure (solution) | Recall first, precision second |
| 6.5 | Reciprocal rank | static figure (question) + static figure (solution) | Where the first relevant result lands per query; Reciprocal rank per query |
| 6.6 | NDCG@3 | data visualization (solution) | Discounted gains of the actual versus ideal order |
| 6.7 | HyDE vs contextual retrieval | static figure (solution) | When each technique runs and what it embeds |
| 6.8 | A tool call, step by step | static figure (solution) | Who does what in a tool round trip |
| 6.9 | Prompt ordering and caching | interactive (solution) | Prefix caching only works when the fixed part comes first |
| 6.10 | Too many tools | static figure (solution) | A router narrows the tools the model sees |
| 6.11 | MCP roles | static figure (solution) | Host, clients and servers in MCP |
| 6.12 | Context compaction | static figure (solution) | Three compaction strategies on a full context window |
| 6.13 | Write a tool definition | text and math only | The answer is a JSON schema; the code block is the representation. |
| 7.1 | Cohen's kappa | static figure (question) + static figure (solution) | Rater agreement as a contingency table; Chance agreement from the marginals |
| 7.2 | pass@5 | static figure (question) + data visualization (solution) | The sample pool pass@k draws from; pass@k grows with k for a fixed pool |
| 7.3 | Why not 1 − (1 − p̂)^k? | data visualization (solution) | The plug-in estimate sits below the unbiased one |
| 7.4 | pass@k vs cons@k | static figure (solution) | pass@k and cons@k can disagree on the same samples |
| 7.5 | Clipped unigram precision | static figure (question) + static figure (solution) | Candidate and reference tokens side by side; Clipping caps each word at its reference count |
| 7.6 | ROUGE-1 recall | static figure (solution) | Recall counts reference words that are covered |
| 7.7 | Judge best practices | text and math only | A list of practices; no structure to inspect. |
| 7.8 | Name the bias | text and math only | Naming a bias; the solution pairs each bias with its remedy in text. |
| 7.9 | Agent failure mode I | static figure (solution) | Locating a hallucinated tool in the agent loop |
| 7.10 | Agent failure mode II | static figure (solution) | Locating an empty tool response |
| 7.11 | Penalized knowledge scoring | data visualization (solution) | How abstention changes a penalized score |
| 7.12 | Elo expected score | data visualization (solution) | Expected score as a logistic function of the rating gap |
| 7.13 | Elo update after an upset | interactive (solution) | Elo updates scale with surprise |
| 7.14 | Pareto frontier | data visualization (question) + data visualization (solution) | Plot the four models before judging dominance; The frontier and the dominated point |
| 7.15 | Build an eval for an agent | text and math only | Open design question; the answer is a structured list. |
| 8.1 | Why look beyond autoregression? | static figure (solution) | Sequential left-to-right decoding versus parallel refinement |
| 8.2 | Continuous diffusion on text | static figure (solution) | Noisy embeddings fall between valid tokens |
| 8.3 | Survival under absorbing-state masking | static figure (question) + data visualization (solution) | Absorbing-state transitions; α_t decays geometrically |
| 8.4 | Expected masked tokens | static figure (solution) | Expected masked count = n(1 − α) |
| 8.5 | One training step | static figure (solution) | One masked-diffusion training step |
| 8.6 | The weighted loss | static figure (question) + static figure (solution) | Which positions contribute to the loss; Sum over masked positions, then weight by 1/t |
| 8.7 | Isn't this just BERT? | text and math only | The comparison is three short contrasts; the options already state them. |
| 8.8 | The parallel sampling problem | step-through (solution) | Independent per-position sampling can produce inconsistent pairs |
| 8.9 | Remasking strategies | data visualization (solution) | Stale commit-time confidence versus confidence in the current context |
| 8.10 | Who wins on speed? | data visualization (solution) | Fixed step count versus one pass per token |
| 8.11 | Block diffusion | static figure (solution) | Block-causal attention mask |
| 8.12 | The training-signal gap | static figure (solution) | Targets per training pass in each paradigm |
| 8.13 | Best of both worlds | static figure (solution) | A diffusion drafter with an autoregressive verifier |
