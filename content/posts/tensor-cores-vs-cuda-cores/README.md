---
title: "A Comparative Study of Tensor Cores and CUDA Cores"
slug: tensor-cores-vs-cuda-cores
date: 2026-03-23
tags:
  - Tensor Cores
  - CUDA Cores
  - GPU Architecture
  - Deep Learning
  - NVIDIA
category: AI & Machine Learning
cover: ./images/cover.png
series: gpu-and-hardware
seriesOrder: 3
---

# A Comparative Study of Tensor Cores and CUDA Cores

When evaluating NVIDIA GPU specifications for AI workloads, two compute units dominate the discussion: **CUDA Cores** and **Tensor Cores**. These two hardware components are both integral to modern GPU compute, yet they serve fundamentally different roles, operate at different levels of specialization, and deliver dramatically different performance characteristics for neural network operations. Understanding them in depth — not just their specifications but their underlying hardware design, numerical precision trade-offs, software interaction patterns, and real-world performance profiles — is essential knowledge for any practitioner engaged in GPU-accelerated machine learning.

This article provides a complete technical and practical analysis of both compute units, covering their architectural design, the mathematical operations they perform, how modern deep learning frameworks leverage them, how to verify Tensor Core utilization in your code, and how to choose the optimal compute mode for different AI workloads.

---

## 1. Historical Context: How We Got Here

### 1.1 The CUDA Core Era (2007–2016)

When NVIDIA introduced CUDA in 2007 and released the first massively parallel GPU architecture (Tesla/Fermi/Kepler/Maxwell/Pascal), all numerical computation happened on **CUDA Cores** — the standard floating-point and integer ALUs scattered across the GPU's Streaming Multiprocessors. Every multiply-add operation in a neural network — whether in a convolutional layer or a fully connected layer — was computed by CUDA cores handling one scalar operation per clock cycle.

This approach was effective: the thousands of CUDA cores enabled massive parallelism that dramatically outpaced CPUs for deep learning. However, as neural network architectures scaled from AlexNet (60M parameters) to GPT-2 (1.5B parameters) and beyond, the compute demand outpaced what CUDA cores could deliver within a given power envelope. Deeper networks, larger batches, and the emergence of the transformer architecture demanded something more specialized.

### 1.2 The Tensor Core Revolution (2017–Present)

In 2017, NVIDIA's **Volta architecture** (powering the Tesla V100) introduced **Tensor Cores** — purpose-built hardware units designed to perform one specific operation with extraordinary efficiency: **matrix multiply-accumulate (MMA)**. Rather than computing one multiplication per cycle (CUDA cores), a Tensor Core computes an entire 4×4 matrix multiplication per cycle — 64 multiply-add operations simultaneously.

Since neural network training and inference are dominated by matrix multiplication (attention layers, linear projections, convolutions all reduce to GEMM), this specialization unlocked a 12× performance improvement on deep learning workloads over the best CUDA-core-only GPU at the time.

Since Volta, every subsequent NVIDIA architecture (Turing, Ampere, Ada, Hopper) has expanded Tensor Core capabilities, adding new precision formats and increasing the size of matrices handled per cycle.

---

## 2. CUDA Cores: Architecture and Capabilities

### 2.1 What Is a CUDA Core?

A CUDA Core is the basic floating-point processing unit within an NVIDIA GPU's Streaming Multiprocessor (SM). Each CUDA Core:

- Performs one **fused multiply-add (FMA)** per clock cycle: `d = a * b + c`
- Operates on scalar (single) values — one element at a time
- Supports 32-bit single precision (FP32) by default
- On datacenter GPUs: also supports 64-bit double precision (FP64) — but at reduced count
- On all GPUs: also supports 32-bit integer (INT32) operations

### 2.2 CUDA Core Count by GPU

| GPU | Architecture | FP32 CUDA Cores |
|---|---|---|
| GTX 1080 Ti | Pascal | 3,584 |
| RTX 2080 Ti | Turing | 4,352 |
| RTX 3090 | Ampere | 10,496 |
| RTX 4090 | Ada Lovelace | 16,384 |
| A100 SXM4 | Ampere | 6,912 |
| H100 SXM5 | Hopper | 16,896 |

Note: The RTX 4090 has more CUDA cores than the A100, yet the A100 is dramatically faster for AI training. This illustrates why raw CUDA core count is a poor predictor of AI performance — what matters is Tensor Core count, memory bandwidth, and supported precision formats.

### 2.3 What CUDA Cores Are Good At

1. **Arbitrary computation with complex control flow**: Branching, loops, function calls, recursion
2. **Transcendental functions**: sin, cos, exp, log (via Special Function Units adjacent to CUDA cores)
3. **FP64 scientific computing**: Simulations, physics engines requiring full double precision
4. **Small, non-matrix operations**: Element-wise activations (ReLU, GELU), normalization statistics, indexing

### 2.4 CUDA Core Performance Formulas

```
FP32 TFLOPS = CUDA Cores × 2 (for FMA) × Boost Clock (GHz)

Example — RTX 4090:
16,384 × 2 × 2.52 GHz = 82.6 TFLOPS FP32

Example — A100 SXM4:
6,912 × 2 × 1.41 GHz = 19.5 TFLOPS FP32
```

Despite the RTX 4090 having 4× more CUDA cores and running at a higher clock speed — giving it 4× the FP32 throughput — the A100 is still preferred for AI training due to its Tensor Cores, HBM2e memory bandwidth, and NVLink interconnect.

---

## 3. Tensor Cores: Architecture and Capabilities

### 3.1 The Matrix Multiply-Accumulate Operation

A Tensor Core's defining operation is the **fused matrix multiply-accumulate (MMA)**:

```
D = A × B + C
```

Where A, B, C, D are small matrices (tiles). In a single Tensor Core operation across one SM cycle:

| Generation | Architecture | Input Shape | Precision | FMAs per Cycle |
|---|---|---|---|---|
| 1st Gen | Volta | 4×4×4 | FP16 in, FP32 acc | 64 |
| 2nd Gen | Turing | 8×8 tiles | FP16, INT8, INT4 | 128+ |
| 3rd Gen | Ampere | 8×4×16 | FP16, BF16, TF32, INT8 | 256+ |
| 4th Gen | Ada/Hopper | 16×8×16 | FP16, BF16, TF32, FP8, INT8 | 512+ |

To perform a large matrix multiplication (e.g., 4096×4096), the GPU decomposes it into many small tiles, each handled by a Tensor Core MMA instruction via the **WMMA (Warp Matrix Multiply-Accumulate) API** or cuBLAS.

### 3.2 Tensor Core Count by GPU

| GPU | Architecture | Tensor Cores | Generation |
|---|---|---|---|
| V100 | Volta | 640 | 1st |
| T4 | Turing | 320 | 2nd |
| RTX 2080 Ti | Turing | 544 | 2nd |
| A100 SXM4 | Ampere | 432 | 3rd |
| RTX 3090 | Ampere | 328 | 3rd |
| RTX 4090 | Ada Lovelace | 512 | 4th |
| H100 SXM5 | Hopper | 528 | 4th + TE |

### 3.3 Precision Modes — The Full Picture

Tensor Cores support a menu of numerical precision formats. Understanding each is critical for choosing the right training and inference strategy:

#### FP32 (Standard Single Precision)
- **Range**: ±3.4 × 10³⁸
- **Mantissa bits**: 23
- **Standard for**: Legacy code, scientific computing, situations requiring full precision
- **Tensor Core**: NOT natively used — goes through CUDA cores

#### TF32 (TensorFloat-32) — Ampere and Later
- **Range**: Same as FP32 (8-bit exponent)
- **Mantissa bits**: 10 (same as FP16)
- **Tensor Core**: Yes — enabled automatically by PyTorch on Ampere+
- **Speed vs FP32**: ~10× faster training
- **Accuracy vs FP32**: Negligible loss — mantissa reduction causes minimal model quality degradation

TF32 is NVIDIA's most impactful "invisible" optimization: code written for FP32 automatically uses Tensor Cores on Ampere+ without any code changes.

#### FP16 (Half Precision)
- **Range**: ±65,504 (5-bit exponent)
- **Mantissa bits**: 10
- **Risk**: Gradient overflow for large models → requires **loss scaling**
- **Speed**: ~2× vs FP32 CUDA cores, but also benefits from Tensor Core units
- **PyTorch**: `torch.float16` with `GradScaler`

```python
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()
with autocast(dtype=torch.float16):
    loss = model(inputs)
scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()
```

#### BF16 (Brain Float 16)
- **Range**: Same as FP32 (8-bit exponent) — no overflow risk
- **Mantissa bits**: 7 (less precision than FP16's 10 bits)
- **Best for**: LLM training — gradient stability more important than precision
- **Available on**: Ampere (A100), Ada, Hopper — NOT on Turing/RTX 20-series

```python
with autocast(dtype=torch.bfloat16):  # No GradScaler needed!
    loss = model(inputs)
loss.backward()
optimizer.step()
```

#### INT8
- **Range**: −128 to 127 (signed) or 0–255 (unsigned)
- **Bits**: 8
- **Use case**: Post-training quantization for inference only (typically)
- **Speed**: ~4× vs FP32 on INT8 Tensor Cores

```python
# Using TensorRT for INT8 inference
import tensorrt as trt
config.set_flag(trt.BuilderFlag.INT8)
config.int8_calibrator = EntropyCalibrator2(calibration_data)
```

#### INT4
- **Range**: −8 to 7 (4 bits)
- **Use case**: Aggressive inference quantization (GPTQ, AWQ for LLMs)
- **Speed**: ~8× vs FP32 on INT4 Tensor Cores
- **Required Libraries**: bitsandbytes, GPTQ

```python
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.bfloat16
)
```

#### FP8 (E4M3 / E5M2) — Hopper and Ada (partial)
- Newest format; two variants for different precision/range trade-offs
- At H100 scale: **3,958 TFLOPS** vs 989 TFLOPS FP16
- Requires the **Transformer Engine** library for automatic per-layer calibration

---

## 4. Side-by-Side Performance Comparison

### 4.1 Theoretical Peak Throughput

| Operation | A100 (CUDA Cores) | A100 (Tensor Cores) | Speedup |
|---|---|---|---|
| FP32 GEMM | 19.5 TFLOPS | 156 TFLOPS (TF32) | 8× |
| FP16 GEMM | 77.6 TFLOPS | 312 TFLOPS | 4× |
| INT8 | — | 624 TOPS | — |

### 4.2 Empirical Benchmark: Matrix Multiplication

```python
import torch
import time

N = 4096
dtype_fp32 = torch.float32
dtype_fp16 = torch.float16

a_fp32 = torch.randn(N, N, device='cuda', dtype=dtype_fp32)
b_fp32 = torch.randn(N, N, device='cuda', dtype=dtype_fp32)
a_fp16 = a_fp32.half()
b_fp16 = b_fp32.half()

torch.cuda.synchronize()

def benchmark(fn, name, n_runs=200):
    for _ in range(10): fn()  # Warm-up
    torch.cuda.synchronize()
    t0 = time.perf_counter()
    for _ in range(n_runs): fn()
    torch.cuda.synchronize()
    elapsed = (time.perf_counter() - t0) / n_runs * 1000
    print(f"{name}: {elapsed:.2f} ms/op")

# FP32 with TF32 disabled (CUDA cores only)
torch.backends.cuda.matmul.allow_tf32 = False
benchmark(lambda: a_fp32 @ b_fp32, "FP32 (CUDA Cores)")

# FP32 with TF32 enabled (Tensor Cores)
torch.backends.cuda.matmul.allow_tf32 = True
benchmark(lambda: a_fp32 @ b_fp32, "TF32 (Tensor Cores)")

# FP16 (Tensor Cores)
benchmark(lambda: a_fp16 @ b_fp16, "FP16 (Tensor Cores)")
```

Expected results on A100:
```
FP32 (CUDA Cores): 18.4 ms/op
TF32 (Tensor Cores): 1.9 ms/op   ← 9.7× speedup
FP16 (Tensor Cores): 1.0 ms/op   ← 18× speedup
```

### 4.3 Real Training Benchmark: ResNet-50 on ImageNet

| Config | GPU | Throughput (images/sec) | Training Time/Epoch |
|---|---|---|---|
| FP32, CUDA Cores | A100 | 1,850 | 48 min |
| TF32, Tensor Cores | A100 | 8,200 | 11 min |
| FP16, AMP, Tensor Cores | A100 | 17,300 | 5 min |

The 9× difference between FP32 CUDA cores and FP16 Tensor Cores for the same model demonstrates how critical it is to use Tensor Core-eligible operations.

---

## 5. How to Ensure Your Code Uses Tensor Cores

Tensor Cores are not automatically used for all operations — they activate only when specific conditions are met.

### 5.1 Requirements for Tensor Core Activation

1. **Data type must be FP16, BF16, TF32 (FP32 with flag), INT8, or FP8** — not raw FP32 without TF32 enabled
2. **Matrix dimensions must be multiples of 8** (for FP16/BF16) or 16 (for FP16 on Volta) — enforced automatically by cuBLAS when possible
3. **Operation must be a GEMM** — matrix multiplication, batched GEMM, or convolution (cuDNN handles this)
4. **Memory must be aligned** — 16-byte aligned for FP16

### 5.2 Verifying Tensor Core Usage with Nsight Compute

```bash
# Profile a single training step
ncu --metrics sm__pipe_tensor_cycles_active.avg.pct_of_peak_sustained_active \
    python -c "
import torch
a = torch.randn(4096, 4096, device='cuda', dtype=torch.float16)
b = torch.randn(4096, 4096, device='cuda', dtype=torch.float16)
c = a @ b
torch.cuda.synchronize()
"
```

Look for `sm__pipe_tensor_cycles_active` — values above 60-70% indicate good Tensor Core utilization.

### 5.3 PyTorch Settings Checklist

```python
import torch

# 1. Enable TF32 for matmul (on by default in PyTorch >= 1.7)
torch.backends.cuda.matmul.allow_tf32 = True

# 2. Enable TF32 for cuDNN convolutions
torch.backends.cudnn.allow_tf32 = True

# 3. Use AMP for FP16/BF16 training
from torch.cuda.amp import autocast
with autocast(dtype=torch.bfloat16):  # or torch.float16
    output = model(input)

# 4. Verify settings
print(torch.backends.cuda.matmul.allow_tf32)  # True
print(torch.get_default_dtype())               # torch.float32

# 5. Use dimensions divisible by 8 in model architecture
# ✅ nn.Linear(512, 256)   — both divisible by 16
# ⚠️ nn.Linear(513, 257)   — Tensor Cores may not activate
```

---

## 6. Structured Sparsity: Extending Tensor Core Throughput

Ampere and later GPUs support **2:4 structured sparsity** in Tensor Cores — a hardware-accelerated compression format where exactly 2 out of every 4 consecutive values are non-zero. This allows the hardware to skip zero multiplications, effectively **doubling Tensor Core throughput**:

```
Dense: 312 TFLOPS FP16 → 624 TFLOPS FP16 (sparse)
```

This is achieved by storing only the non-zero values (50% compression) along with a compact bitmask indicating which positions they occupy, then using hardware decompressor circuits within the Tensor Core units.

```python
# PyTorch structured pruning for sparse Tensor Cores
import torch.nn.utils.prune as prune

# Apply 2:4 structured sparsity to linear layer
layer = torch.nn.Linear(4096, 4096).cuda()
prune.l1_unstructured(layer, name='weight', amount=0.5)

# Convert to sparse format for hardware acceleration
# (requires Apex or TransformerEngine library)
```

In practice, 2:4 sparsity achieves near-dense model quality with fine-tuning after pruning, making it a viable path to doubling inference throughput on compatible hardware.

---

## 7. Tensor Cores vs CUDA Cores: When to Use Each

| Scenario | Optimal Compute Unit | Reason |
|---|---|---|
| Large matrix multiply (GEMM) | Tensor Cores | High arithmetic intensity; Tensor Cores deliver 10–20× speedup |
| LLM training (attention, FFN) | Tensor Cores (BF16/FP16) | Transformer layers are overwhelmingly GEMM |
| Inference (INT8/INT4) | Tensor Cores | Maximum throughput for quantized models |
| Element-wise ops (ReLU, add) | CUDA Cores | Not matrix ops; must use CUDA cores |
| Custom control flow | CUDA Cores | Branching, conditional logic unsupported by Tensor Cores |
| FP64 scientific computing | CUDA Cores (FP64 variant) | Tensor Cores use reduced mantissa; FP64 CUDA cores give full precision |
| RNG, indexing, sorting | CUDA Cores | Non-arithmetic irregular operations |
| Small matmuls (< 256 elements) | CUDA Cores | Tensor Core overhead not worth it for tiny matrices |

The practical implication: **the vast majority of the compute time in modern neural network training and inference should run on Tensor Cores**. Any time your profiler shows low Tensor Core utilization, you are leaving performance on the table.

---

## 8. The Transformer Engine and FP8 on H100

The Hopper H100 GPU introduced the **Transformer Engine (TE)** — hardware and software co-designed specifically for transformer neural network layers. It dynamically scales FP8 precision per-tensor per-layer in real time:

- Computes forward pass in FP8 (maximum throughput: 3,958 TFLOPS)
- Monitors activation statistics and adjusts scaling factors automatically
- Falls back to BF16 for layers where FP8 causes instability
- Achieves FP8-level speed with BF16-level quality — automatically

```python
import transformer_engine.pytorch as te
import torch

# Replace standard PyTorch Linear with TE version
linear = te.Linear(4096, 4096, bias=True)

# FP8 autocast
with te.fp8_autocast(enabled=True):
    y = linear(x)  # Runs at 3,958 TFLOPS FP8 on H100
```

This represents the current frontier of Tensor Core utilization — and explains why H100 clusters are ~4× faster than A100 clusters for the same LLM training run, wall-clock time.

---

## 9. Practical Decision Framework

When selecting precision strategy for your project, use this decision tree:

```
Training a new model from scratch?
├── Large LLM or Transformer? 
│   ├── GPU is A100+ → Use BF16 with autocast
│   ├── GPU is H100 → Use FP8 with Transformer Engine
│   └── GPU is RTX 3090/4090 (Ampere/Ada) → Use BF16 or FP16 with GradScaler
└── CNN or smaller model?
    └── Use FP16 with GradScaler, or TF32 for simplicity

Deploying for inference?
├── Need maximum throughput?
│   ├── GPU supports INT8 Tensor Cores? → Quantize to INT8 via TensorRT
│   ├── H100 available? → FP8 with Transformer Engine
│   └── Consumer GPU → FP16 inference
└── Need maximum accuracy?
    └── Use FP32 or BF16
```

---

## 10. Summary

CUDA Cores and Tensor Cores are complementary, not competing, compute units within NVIDIA GPUs. CUDA Cores handle the general-purpose, flexible, scalar computation that neural networks need for control flow, indexing, and element-wise operations. Tensor Cores handle the dominant compute workload — large matrix multiplications — with 10–20× greater efficiency through hardware-level matrix arithmetic.

The key takeaways for practitioners:

1. **Tensor Cores are the performance multiplier that makes AI feasible at scale** — from training transformers to deploying quantized LLMs
2. **Enable TF32, BF16, or FP16 in your training code** — it takes 2 lines of code and can make your training 8-18× faster
3. **Verify Tensor Core utilization** using Nsight Compute — theoretical speedups only materialize with proper precision settings and aligned matrix dimensions
4. **Layer dimensions divisible by 8** (preferably 16 or 64) are critical for Tensor Core efficiency
5. **FP8 on H100** is the current frontier — 4× faster than BF16 with minimal quality loss using the Transformer Engine
6. **INT8/INT4 quantization** enables production inference to run at 4-8× higher throughput on compatible Tensor Cores

With these principles, you can systematically extract the maximum performance from NVIDIA GPU hardware for both research training runs and production inference deployments.

---

*Next reading: What Are LLMs and How Do They Work →*
