---
title: "What Are LLMs and How Do They Work"
slug: llms
date: 2026-03-22
tags:
  - LLM
  - Transformers
  - NLP
  - Deep Learning
  - GPT
category: AI & Machine Learning
cover: ./images/cover.png
series: ai-and-deep-learning
seriesOrder: 1
---

# What Are LLMs and How Do They Work

**Large Language Models (LLMs)** are the most consequential development in artificial intelligence since the introduction of the backpropagation algorithm. They are the technology behind ChatGPT, Claude, Gemini, Llama, Mistral, and dozens of other systems that have begun reshaping knowledge work, programming, scientific research, and human-computer interaction at a global scale. Despite their enormous practical impact, the principles underlying LLMs are grounded in elegant mathematics and well-understood engineering. This article provides a thorough, technically rigorous yet accessible explanation of what LLMs are, how they are built, how they learn, and how they generate text.

---

## 1. Defining the Term: What Is a Language Model?

A **language model** is a statistical model that assigns probabilities to sequences of words or tokens. The fundamental task it solves is:

> Given a sequence of tokens `t₁, t₂, ..., t_{n-1}`, what is the probability distribution over the next token `t_n`?

Formally:

```
P(t_n | t₁, t₂, ..., t_{n-1})
```

By repeatedly sampling from this conditional distribution — predicting the next token given all previous ones — a language model generates text autoregressively.

Language models have existed in various forms since the 1980s (n-gram models, Hidden Markov Models). What makes **modern LLMs** distinctive is:

1. **Scale**: Trained on trillions of tokens (essentially the readable internet, books, code)
2. **Architecture**: Built on the Transformer neural network, which enables efficient parallel processing of long sequences
3. **Parameter count**: Billions to hundreds of billions of learnable parameters
4. **Emergent capabilities**: Abilities that arise unpredictably at scale, including reasoning, instruction-following, coding, and creative writing

The "L" in LLM — **Large** — is specifically what transforms a narrow statistical model into a generally capable system. As parameter count and data scale increase past critical thresholds, qualitatively new capabilities emerge that were absent in smaller models.

---

## 2. The Foundation: Transformer Architecture

Every modern LLM is built upon the **Transformer architecture**, introduced in the landmark 2017 paper "Attention Is All You Need" by Vaswani, Shazeer, Parmar, et al. at Google. Before transformers, sequence models relied on **Recurrent Neural Networks (RNNs)** and **Long Short-Term Memory (LSTM)** networks, which processed tokens sequentially — one at a time. This sequential nature was a fundamental bottleneck: it prevented parallelization and caused difficulty modeling long-range dependencies.

Transformers eliminated recurrence entirely. Instead, they use **self-attention** — a mechanism that allows every token in a sequence to directly compute relationships with every other token in a single, parallelizable operation.

### 2.1 Decoder-Only vs Encoder-Decoder Architectures

Modern LLMs primarily use one of two transformer variants:

**Decoder-only (GPT-style)**: Used by GPT-2/3/4, Llama, Mistral, PaLM, Gemini
- Tokens can only attend to previous tokens (causal masking)
- Optimized for text generation tasks
- Simple left-to-right autoregressive generation

**Encoder-Decoder (T5-style)**: Used by T5, BART, Flan-T5
- Encoder processes the full input bidirectionally
- Decoder generates output autoregressively, attending to the encoder
- Better for conditional generation (translation, summarization)

For the remainder of this article, we focus on **decoder-only** models as they dominate the ChatGPT/Claude/Llama paradigm.

### 2.2 High-Level Architecture

```
Input text → Tokenizer → Token IDs
                              ↓
                   Token Embedding (lookup table)
                              ↓
                   Positional Encoding (added)
                              ↓
              ┌─────────────────────────────────┐
              │        Transformer Block × N     │
              │  ┌──────────────────────────┐   │
              │  │ RMS Norm                  │   │
              │  │ Causal Self-Attention     │   │
              │  │ Residual Connection (+)   │   │
              │  │ RMS Norm                  │   │
              │  │ Feed-Forward Network      │   │
              │  │ Residual Connection (+)   │   │
              │  └──────────────────────────┘   │
              └─────────────────────────────────┘
                              ↓
                   Final RMS Norm
                              ↓
                   Linear Projection (to vocab size)
                              ↓
                   Softmax → Probability Distribution
                              ↓
                   Sample → Next Token → Append → Repeat
```

---

## 3. Tokenization: Converting Text to Numbers

Before any neural network processing can occur, text must be converted into a sequence of integers. This is the job of the **tokenizer**.

### 3.1 Byte Pair Encoding (BPE)

Most modern LLMs use **BPE (Byte Pair Encoding)** or its variant **SentencePiece**, which is a subword tokenization algorithm:

1. Start with individual characters as the vocabulary
2. Iteratively merge the most frequent adjacent pair of tokens into a single new token
3. Repeat until the vocabulary reaches the target size (typically 32K–100K tokens)

The result: common words become single tokens, rare words are split into subword pieces:

```
"tokenization" → ["token", "ization"]       # Common prefix merged
"supercalifragilistic" → ["super", "cal", "if", "rag", "il", "istic"]  # Split
"GPT" → ["G", "PT"]                         # Rare acronym, kept small
```

### 3.2 Vocabulary Size and Token Efficiency

| Model | Tokenizer | Vocab Size | Avg tokens/word |
|---|---|---|---|
| GPT-2 | BPE | 50,257 | ~1.3 |
| GPT-4 | cl100k_base | 100,277 | ~1.1 |
| Llama 2 | SentencePiece | 32,000 | ~1.4 |
| Gemma | SentencePiece | 256,000 | ~1.2 |

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-hf")
text = "The quick brown fox jumps over the lazy dog"

tokens = tokenizer.encode(text)
decoded = tokenizer.convert_ids_to_tokens(tokens)

print(f"Token IDs: {tokens}")
print(f"Tokens: {decoded}")
print(f"Token count: {len(tokens)}")
# Token count: 11 for 9 words → ratio ≈ 1.2
```

---

## 4. Token Embeddings and Positional Encoding

### 4.1 Embedding Table

Each token ID is mapped to a dense vector through a learned **embedding table** `E ∈ ℝ^{vocab_size × d_model}`:

```python
import torch.nn as nn

# GPT-2 style: 50,257 vocab, 768-dimensional embeddings
embedding = nn.Embedding(50257, 768)

token_ids = torch.tensor([464, 3797, 3332])  # ["The", "cat", "sat"]
embeddings = embedding(token_ids)            # Shape: [3, 768]
```

The embedding table is learned during pre-training. Similar tokens end up with similar vectors — the model encodes semantic relationships directly into the embedding space.

### 4.2 Positional Encoding

Unlike RNNs, transformers process all tokens in parallel with no inherent ordering. Positional information must be injected explicitly.

**Absolute Positional Embeddings** (original transformer, GPT-2):
```
token_embedding = token_embed[id] + positional_embed[position]
```

**RoPE (Rotary Positional Embeddings)** (Llama, Mistral, GPT-NeoX):
Rather than adding position embeddings to token vectors, RoPE rotates Query and Key vectors in attention by position-dependent angles. This gives the model a relative sense of position that **extrapolates better to longer sequences** than absolute positional embeddings:

```
RoPE rotates Q and K vectors:
Q'_pos = R(pos) · Q    where R(pos) is a rotation matrix
K'_pos = R(pos) · K

Attention score for relative position δ = pos_q - pos_k:
Q'_{pos_q} · K'_{pos_k} = Q · R(δ) · K  ← depends only on relative distance
```

This is why Llama models can be extended to longer context windows via **RoPE scaling** without full re-training.

---

## 5. Self-Attention: The Heart of the Transformer

Self-attention is the mechanism that allows every token to gather information from every other token in the sequence — capturing long-range dependencies that RNNs struggled with.

### 5.1 Computing Attention

Given an input sequence of `T` tokens with embedding dimension `d_model`, self-attention:

1. Projects each token embedding into three vectors via learned weight matrices:
   - **Q (Query)**: What am I looking for?
   - **K (Key)**: What do I have to offer to other tokens?
   - **V (Value)**: What information do I actually convey?

```python
W_Q = nn.Linear(d_model, d_head, bias=False)
W_K = nn.Linear(d_model, d_head, bias=False)
W_V = nn.Linear(d_model, d_head, bias=False)

Q = W_Q(x)  # [T, d_head]
K = W_K(x)  # [T, d_head]
V = W_V(x)  # [T, d_head]
```

2. Computes attention scores via scaled dot-product:

```python
import math

scores = torch.matmul(Q, K.transpose(-1, -2)) / math.sqrt(d_head)
# scores shape: [T, T] — every token vs every other token
```

3. Applies causal mask (decoder-only: no looking at future tokens):

```python
mask = torch.triu(torch.ones(T, T), diagonal=1).bool()
scores = scores.masked_fill(mask, float('-inf'))
```

4. Softmax and weighted sum:

```python
weights = torch.softmax(scores, dim=-1)  # [T, T] — attention weights
output = torch.matmul(weights, V)         # [T, d_head] — context vectors
```

The output for each token is a **weighted average of all Value vectors**, where the weights come from how relevant each key is to the current query.

### 5.2 Multi-Head Attention (MHA)

Rather than computing attention once, the model computes `H` attention operations in parallel ("heads"), each learning to attend to different aspects of the sequence:

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, n_heads):
        super().__init__()
        self.n_heads = n_heads
        self.d_head = d_model // n_heads
        
        self.W_Q = nn.Linear(d_model, d_model, bias=False)
        self.W_K = nn.Linear(d_model, d_model, bias=False)
        self.W_V = nn.Linear(d_model, d_model, bias=False)
        self.W_O = nn.Linear(d_model, d_model, bias=False)
    
    def forward(self, x, mask=None):
        B, T, C = x.shape
        
        Q = self.W_Q(x).view(B, T, self.n_heads, self.d_head).transpose(1, 2)
        K = self.W_K(x).view(B, T, self.n_heads, self.d_head).transpose(1, 2)
        V = self.W_V(x).view(B, T, self.n_heads, self.d_head).transpose(1, 2)
        # Q, K, V shape: [B, n_heads, T, d_head]
        
        scale = self.d_head ** -0.5
        attn = (Q @ K.transpose(-2, -1)) * scale
        if mask is not None:
            attn = attn.masked_fill(mask, float('-inf'))
        attn = torch.softmax(attn, dim=-1)
        
        out = attn @ V  # [B, n_heads, T, d_head]
        out = out.transpose(1, 2).contiguous().view(B, T, C)
        return self.W_O(out)
```

GPT-3 uses 96 attention heads with `d_head = 128` for a total `d_model = 12288`. Each head independently learns different relational patterns — syntactic agreement, coreference, semantic similarity.

### 5.3 Grouped Query Attention (GQA) and Multi-Query Attention (MQA)

To reduce the memory footprint of the **KV cache** (the cached K and V vectors for all previous tokens during generation), modern models like Llama 2, Gemma, and Mistral use **Grouped Query Attention**:

- Instead of H independent K/V heads, use G groups (G < H) where multiple Q heads share one K/V head
- Reduces KV cache size by factor H/G
- Minimal quality degradation — queries can still be expressive even with shared keys/values

```
Standard MHA: H Q heads, H K heads, H V heads → KV cache ∝ H
GQA:          H Q heads, G K heads, G V heads → KV cache ∝ G
MQA:          H Q heads, 1 K head,  1 V head  → KV cache ∝ 1
```

---

## 6. Feed-Forward Network (FFN) Layer

Each transformer block contains a position-wise **feed-forward network** applied identically to each token's representation:

```python
class FeedForward(nn.Module):
    def __init__(self, d_model, d_ff=None, activation=nn.GELU()):
        super().__init__()
        d_ff = d_ff or 4 * d_model  # Standard: 4× expansion
        self.net = nn.Sequential(
            nn.Linear(d_model, d_ff),
            activation,
            nn.Linear(d_ff, d_model)
        )
    
    def forward(self, x):
        return self.net(x)
```

The FFN acts as the model's "memory" — research suggests attention layers identify **which** information is relevant, while FFN layers perform the actual fact recall and knowledge transformation. In GPT-3, the FFN intermediate dimension is 4× the attention dimension: `d_ff = 4 × 12288 = 49152`.

**SwiGLU FFN** (Llama, PaLM, Gemma): A gated variant with better empirical performance:

```python
class SwiGLU(nn.Module):
    def __init__(self, d_model, d_ff):
        super().__init__()
        self.w1 = nn.Linear(d_model, d_ff, bias=False)
        self.w2 = nn.Linear(d_ff, d_model, bias=False)
        self.w3 = nn.Linear(d_model, d_ff, bias=False)
    
    def forward(self, x):
        return self.w2(F.silu(self.w1(x)) * self.w3(x))
        # SiLU gate × input gate = SwiGLU
```

---

## 7. Pre-Training: How LLMs Learn

### 7.1 The Next-Token Prediction Objective

LLMs are trained using **self-supervised learning** on the **causal language modeling** objective — given all preceding tokens, predict the next one:

```python
# Pseudo-code for GPT pre-training
for batch in dataloader:
    inputs = batch[:, :-1]   # All tokens except the last
    targets = batch[:, 1:]   # All tokens except the first (shifted)
    
    logits = model(inputs)   # [B, T, vocab_size]
    loss = F.cross_entropy(
        logits.view(-1, vocab_size),
        targets.view(-1)
    )
    
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()
```

This objective is remarkable: it requires **no human-labeled data whatsoever**. Every sentence in the training corpus is simultaneously the input (all but the last token) and the supervision signal (all but the first token). Training on the internet becomes training on an implicit curriculum of human knowledge.

### 7.2 Training Data at Scale

| Model | Training Tokens | Approximate Data Sources |
|---|---|---|
| GPT-2 | 40B | WebText (Reddit upvoted links) |
| GPT-3 | 300B | Common Crawl, Books, Wikipedia, WebText |
| Llama 2 | 2T | Common Crawl, C4, Wikipedia, Stack Overflow, GitHub |
| PaLM 2 | ~3.6T | Web, books, code, multilingual |
| GPT-4 | ~10T+ (est.) | Undisclosed |

### 7.3 The Scaling Laws

Empirical research (Kaplan et al., 2020; Hoffmann et al., "Chinchilla" 2022) has established that LLM performance follows precise **power law relationships** with compute, data, and model size:

```
Loss ∝ (N_params / C₁)^{-α} + (D_tokens / C₂)^{-β} + L₀
```

The Chinchilla paper showed that prior models (including GPT-3) were **undertrained** — for a given compute budget, you should scale model size and data roughly equally. Llama models were influenced by this insight, using smaller but compute-optimally trained models.

---

## 8. Alignment: From Text Predictor to Useful Assistant

A raw pre-trained LLM is a text completion engine — given "The capital of France is", it outputs "Paris" because that's statistically likely. But it will also complete harmful prompts, generate fictional "facts", and ignore instructions. **Alignment training** transforms this into a helpful assistant.

### 8.1 Supervised Fine-Tuning (SFT)

Fine-tune the model on high-quality (prompt, response) pairs written or curated by humans demonstrating desired behavior:

```python
from transformers import AutoModelForCausalLM, Trainer, TrainingArguments

model = AutoModelForCausalLM.from_pretrained("base-llm")
trainer = Trainer(
    model=model,
    args=TrainingArguments(output_dir="./sft", num_train_epochs=3),
    train_dataset=instruction_dataset  # (prompt, ideal_response) pairs
)
trainer.train()
```

### 8.2 RLHF (Reinforcement Learning from Human Feedback)

After SFT, the model is further refined using human preference signals:

1. **Reward Modeling**: Train a separate model to predict which response humans prefer
2. **PPO (Proximal Policy Optimization)**: Use the reward model as a reward signal to fine-tune the LLM via RL, encouraging responses humans rate highly

```
Pre-trained LLM → SFT → RM Training → PPO Optimization → ChatGPT-style assistant
```

### 8.3 DPO (Direct Preference Optimization)

A simpler, more stable alternative to PPO that directly optimizes on preference data without a separate reward model:

```python
from trl import DPOTrainer, DPOConfig

dpo_trainer = DPOTrainer(
    model=model,
    args=DPOConfig(beta=0.1),
    train_dataset=preference_dataset,  # (prompt, chosen, rejected) triples
)
dpo_trainer.train()
```

DPO is increasingly preferred for open-source fine-tuning (Llama fine-tunes, Mistral instruct variants) due to its simplicity and competitive performance.

---

## 9. Inference: Generating Text

### 9.1 Autoregressive Decoding

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b-chat-hf")
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-chat-hf")
model = model.cuda().half()  # FP16 for efficiency

prompt = "[INST] Explain backpropagation in simple terms. [/INST]"
inputs = tokenizer(prompt, return_tensors="pt").to("cuda")

with torch.no_grad():
    output_ids = model.generate(
        **inputs,
        max_new_tokens=512,
        temperature=0.7,
        top_p=0.9,
        do_sample=True,
        repetition_penalty=1.1,
    )

response = tokenizer.decode(output_ids[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
print(response)
```

### 9.2 The KV Cache

During autoregressive generation, the attention K and V matrices for all previously generated tokens are **cached** to avoid recomputing them:

```
Without KV cache: Each new token requires computing K,V for ALL previous tokens
                   → Cost grows as O(n²) per step → impractical

With KV cache:    Only compute K,V for the New token; reuse cached K,V for previous
                   → Cost is O(n) per step → linear scaling
```

KV cache size in bytes:
```
cache_bytes = 2 × n_layers × n_kv_heads × d_head × sequence_length × 2 (bytes per element, FP16)

For Llama-2-7B (32 layers, 32 heads, d_head=128):
cache_bytes per token = 2 × 32 × 32 × 128 × 2 = 524 KB/token
For 4K context: ≈ 2 GB of KV cache
```

### 9.3 Decoding Strategies

| Strategy | Behavior | Use Case |
|---|---|---|
| Greedy | Always pick highest-probability token | Deterministic but repetitive |
| Beam Search | Maintain top-k sequences; pick best overall | Translation, fixed-format output |
| Temperature Sampling | Scale logits by 1/T before softmax | Creativity control |
| Top-k Sampling | Sample from top k tokens only | Good default |
| Top-p / Nucleus | Sample from smallest set summing to probability p | Most practical |
| Min-p | Newer method; filter by ratio to top probability | Often better than top-p |

---

## 10. Scale, Emergent Abilities, and the Future

### 10.1 Emergent Capabilities

Among the most surprising findings in LLM research is the phenomenon of **emergent abilities** — capabilities that appear suddenly and unpredictably as model scale crosses certain thresholds:

| Capability | Emerged Around |
|---|---|
| 3-digit arithmetic | ~7B parameters |
| Chain-of-thought reasoning | ~62B-540B parameters |
| Instruction following (zero-shot) | ~100B+ parameters |
| Analogical reasoning | ~280B parameters |

Below the threshold, models fail completely. Above it, performance jumps sharply. This discontinuous scaling behavior is not fully understood theoretically but has profound implications for resource planning.

### 10.2 Notable Models and Milestones

| Year | Model | Params | Key Innovation |
|---|---|---|---|
| 2018 | BERT | 340M | Bidirectional pre-training |
| 2019 | GPT-2 | 1.5B | Large-scale decoder-only |
| 2020 | GPT-3 | 175B | In-context learning emerges |
| 2022 | ChatGPT (GPT-3.5) | ~175B | RLHF for conversational AI |
| 2023 | Llama 2 | 7B-70B | Open-weight optimally-trained |
| 2023 | GPT-4 | ~1.8T est | Multimodal, reasoning |
| 2024 | Llama 3 | 8B-405B | Best open-weight to date |
| 2024 | Gemini 1.5 Pro | ~1T est | 1M token context |

### 10.3 Efficient LLMs: Smaller and Better

The field has increasingly focused on **compute-efficient LLMs**:
- **Mistral 7B**: Outperforms Llama-2-13B despite 2× fewer parameters
- **Phi-3 Mini (3.8B)**: Matches GPT-3.5 class performance via high-quality synthetic data
- **Gemma 2B**: Competitive with 7B models
- **Quantized LLMs**: GGUF format allows running Llama-3-8B on consumer CPUs

---

## 11. Summary

Large Language Models are deep neural networks trained with self-supervised next-token prediction on internet-scale text, reaching billions or trillions of parameters through the Transformer architecture. Their power emerges from four interlocking elements:

1. **Tokenization** converts arbitrary text into a discrete sequence of integer IDs
2. **Self-attention** allows every token to contextually relate to every other, capturing long-range dependencies efficiently
3. **Scale** — in both parameters and training data — causes emergent reasoning and world-modelling capabilities
4. **Alignment** (SFT, RLHF, DPO) transforms a raw text predictor into a helpful, safe, instruction-following assistant

Understanding LLMs at this level empowers practitioners to make informed decisions about model selection, fine-tuning strategies, prompt engineering, deployment infrastructure, context length management, and the appropriate evaluation of model capabilities and limitations.

---

*Next reading: Generative AI Models You Should Know →*
