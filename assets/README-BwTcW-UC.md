---
title: "Overview of GPU: What It Is and Why It Matters in AI"
slug: gpu
date: 2026-03-26
tags: []
category: "AI & Machine Learning"
cover: ./images/cover.png
---

# Overview of GPU: What It Is and Why It Matters in AI

The Graphics Processing Unit — commonly known as the **GPU** — is one of the most consequential hardware innovations in the history of computing. Originally engineered to render pixels for video games, it has evolved into the primary engine powering modern artificial intelligence, scientific simulations, cryptocurrency systems, and high-performance data centers worldwide. The meteoric rise of deep learning over the past decade was not merely the result of better algorithms or more data — it was made possible by the GPU's extraordinary ability to parallelize computation at a scale that would have been unimaginable with conventional processors.

This article provides a comprehensive technical and conceptual overview of what a GPU is, how it differs from a CPU, why it is so uniquely suited to AI workloads, how it works internally, what the broader GPU ecosystem looks like, and how practitioners can begin using GPU acceleration in their own machine learning projects.

---

## 1. A Brief History of the GPU

To understand the GPU's role in AI, it helps to trace its origin story. In the early 1990s, graphics-intensive applications like 3D games demanded a dedicated processor capable of handling the repetitive, massively parallel task of shading millions of pixels per frame. Traditional CPUs, built for general-purpose sequential computation, were ill-suited to this task.

The first recognizable GPU emerged in 1999 when **NVIDIA released the GeForce 256**, marketing it as the "world's first GPU." It contained hardware support for **transform and lighting (T&L)** operations, offloading geometric computation from the CPU. Over the next decade, GPUs became increasingly programmable. The advent of **shader programs** — small programs executed in parallel on GPU cores — turned the GPU from a fixed-function chip into a general-purpose parallel processor.

The pivotal moment came in 2007 when NVIDIA launched **CUDA (Compute Unified Device Architecture)**, a programming model that allowed developers to write general-purpose code targeting GPU hardware. For the first time, scientists, researchers, and engineers could harness the GPU's parallelism for non-graphics tasks — simulation, financial modeling, genome sequencing, and eventually, training neural networks.

The deep learning revolution, which accelerated after AlexNet's 2012 win in the ImageNet competition, was largely powered by GPU compute. AlexNet's authors trained their model on **two NVIDIA GTX 580s** — consumer gaming GPUs — in just a few days instead of the weeks a CPU-only cluster would have required. This proved conclusively that GPUs could make previously intractable AI research tractable.

---

## 2. What Is a GPU? The Fundamental Architecture

At its core, a GPU is a **massively parallel processor** optimized for performing the same operation on many data points simultaneously. This distinguishes it fundamentally from the CPU.

### 2.1 The CPU: A Sequential Powerhouse

A modern CPU — such as an AMD Ryzen 9 7950X or Intel Core i9-13900K — contains between 8 and 64 high-performance cores. Each core is exceptionally capable: it features out-of-order execution, branch prediction, deep instruction pipelines, and megabytes of fast cache memory. A single CPU core can handle an enormous variety of tasks with very low latency — making decisions, executing conditional logic, managing memory, running operating system calls.

However, a CPU core does one thing at a time. Even with hyperthreading (2 logical threads per physical core), a 32-core CPU executes at most 64 concurrent operations. For tasks requiring complex sequential logic — running a database transaction, compiling code, parsing JSON — the CPU excels. For tasks requiring repetitive math applied uniformly across thousands or millions of data points, it falls short.

### 2.2 The GPU: A Parallel Throughput Machine

A modern GPU like the NVIDIA A100 contains **6,912 CUDA cores**, arranged in 108 Streaming Multiprocessors (SMs). The H100 contains **16,896 CUDA cores**. Consumer GPUs like the RTX 4090 have 16,384 CUDA cores.

Each CUDA core is far simpler than a CPU core — it has a narrower pipeline, limited branching capability, and smaller cache. But the sheer quantity of them, operating in lockstep (a model called **SIMT — Single Instruction, Multiple Threads**), enables extraordinary throughput for parallelizable workloads.

| Feature | CPU | GPU |
|---|---|---|
| Core Count | 4–64 | 2,000–16,000+ |
| Core Optimization | Complex logic, low latency | High throughput, math operations |
| Cache | 32–64 MB L3 | 40 MB L2 (A100) |
| Memory | 32–512 GB RAM | 8–80 GB VRAM |
| Memory Bandwidth | ~100 GB/s (DDR5) | 900 GB/s – 3.35 TB/s (HBM3) |
| Instruction Model | Sequential / OoO | SIMT (many parallel threads) |
| Best For | Logic, branching, OS tasks | Linear algebra, tensor math |

### 2.3 The SIMT Execution Model

GPUs execute threads in groups of 32 called **warps**. All threads in a warp execute the same instruction simultaneously — but on different data. This is the **SIMT (Single Instruction, Multiple Threads)** model.

If threads within a warp diverge (e.g., some take the `if` branch and others take the `else` branch), the GPU must serialize those paths — a performance penalty called **warp divergence**. Well-optimized GPU code minimizes branching to ensure threads within a warp always follow the same execution path.

---

## 3. Why GPUs Are Ideal for Deep Learning

Deep learning is built almost entirely on one operation: **matrix multiplication**. Every linear layer, every attention matrix, every convolutional operation reduces to multiplying large matrices together and accumulating the results.

### 3.1 Matrix Multiplication as the Core Primitive

Consider training a single transformer layer with hidden dimension `d = 4096`:
- The query projection: `Q = X · W_Q` where `X` is [batch × seq × 4096] and `W_Q` is [4096 × 4096]
- A single such operation requires `4096 × 4096 × (2 × batch × seq)` multiply-add operations

For a GPT-3 scale model (96 transformer layers, 175B parameters), a single training step involves on the order of **3.14 × 10²³ floating-point operations** (FLOPs). A modern CPU running at 10 TFLOPS (10 × 10¹² FLOPS) would need:

```
3.14 × 10²³ / (10 × 10¹²) = 31,400 seconds ≈ 8.7 hours per training step
```

An A100 GPU delivering 312 TFLOPS (FP16) completes the same step in:

```
3.14 × 10²³ / (312 × 10¹²) ≈ 1,000 seconds ≈ 16.7 minutes
```

A cluster of 128 A100s (used for GPT-3 training) reduces this further to under 10 seconds per step.

### 3.2 High Memory Bandwidth

Beyond raw compute, **memory bandwidth** is critical. During inference with batch size 1, every token generation requires loading all model weights from VRAM into compute units. A 7B parameter model in FP16 weighs ~14 GB. Generating one token requires reading those 14 GB:

- CPU DDR5 bandwidth: ~100 GB/s → 140ms per token
- GPU GDDR6X bandwidth: ~1 TB/s → 14ms per token
- H100 HBM3 bandwidth: 3.35 TB/s → 4.2ms per token

This is why inference speed is almost entirely determined by **memory bandwidth**, not FLOPS, for small batch sizes.

### 3.3 Tensor Cores: The AI-Specific Accelerator

Starting with the Volta architecture (2017), NVIDIA introduced **Tensor Cores** — dedicated hardware units for matrix multiply-accumulate (MMA) operations. A single Tensor Core performs:

```
D[4×4] = A[4×4] × B[4×4] + C[4×4]
```

in a single clock cycle — 64 multiply-add operations simultaneously. This is dramatically faster than using standard CUDA cores (which would take 64 cycles for the same computation). The A100's 432 Tensor Cores deliver **312 TFLOPS** in FP16, compared to just **19.5 TFLOPS** from its CUDA cores alone.

---

## 4. Internal GPU Architecture in Depth

### 4.1 Streaming Multiprocessors (SMs)

The GPU is organized into **Streaming Multiprocessors (SMs)** — autonomous compute blocks, each containing:

- **CUDA Cores**: For FP32/INT32 scalar arithmetic
- **Tensor Cores**: For matrix math (FP16, BF16, TF32, FP8)
- **RT Cores** (on Turing+): For ray-tracing intersection tests
- **Warp Schedulers**: Issue instructions to 4 warps per cycle
- **Shared Memory / L1 Cache**: 128–256 KB configurable scratchpad
- **Register File**: 65,536 32-bit registers per SM

On an A100 (108 SMs × 64 CUDA cores = 6,912 total CUDA cores):

```
Streaming Multiprocessor (A100)
├── 64 FP32 CUDA Cores
├── 64 INT32 CUDA Cores
├── 4 3rd-Gen Tensor Core Units
├── 4 Warp Schedulers (process 32-thread warps)
├── 192 KB Shared Memory / L1 Cache
├── 65,536 Registers
└── 4 Load/Store Units, 16 SFUs
```

### 4.2 Memory Hierarchy

| Level | Size | Bandwidth | Latency | Scope |
|---|---|---|---|---|
| Registers | 256 KB / SM | Unlimited | 1 cycle | Per thread |
| Shared Memory | 128–228 KB / SM | ~20 TB/s effective | 5–10 cycles | Per block |
| L2 Cache | 40 MB (A100) | ~7 TB/s | 100–200 cycles | Entire GPU |
| HBM2e VRAM | 80 GB (A100) | 2 TB/s | 400–800 cycles | Entire GPU |
| PCIe / NVLink | Up to 900 GB/s (NVLink 3.0) | — | Milliseconds | GPU ↔ GPU/CPU |

The key insight for optimization: **avoid going to global VRAM whenever possible**. Load data into shared memory (user-managed L1), compute there, write results back. This is the principle behind **tiled matrix multiplication** — the foundation of cuBLAS and Flash Attention implementations.

### 4.3 NVLink and Multi-GPU Interconnect

For models too large for one GPU, NVIDIA provides **NVLink** — a high-bandwidth GPU-to-GPU interconnect:

| Version | Bandwidth | Architecture |
|---|---|---|
| NVLink 2.0 | 300 GB/s total | Volta (V100) |
| NVLink 3.0 | 600 GB/s per GPU | Ampere (A100) |
| NVLink 4.0 | 900 GB/s per GPU | Hopper (H100) |

Combined with **NVSwitch** (NVIDIA's high-speed crossbar), up to 8 GPUs can communicate with all-to-all bandwidth in an NVLink mesh — the basis of the **DGX A100** and **DGX H100** servers used to train the largest AI models.

---

## 5. The GPU Software Ecosystem

Hardware alone does not make a GPU useful for AI. The richness of the **software ecosystem** is equally important — and NVIDIA currently dominates this layer too.

### 5.1 CUDA

**CUDA** is the programming language/API that exposes GPU parallelism. A CUDA program consists of sequential host code (CPU) and parallel **kernels** (GPU functions), written in a superset of C/C++:

```cpp
__global__ void matmul_kernel(float* A, float* B, float* C, int N) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    
    float sum = 0.0f;
    for (int k = 0; k < N; k++) {
        sum += A[row * N + k] * B[k * N + col];
    }
    C[row * N + col] = sum;
}

// Launch: N/16 × N/16 blocks, each 16×16 threads
dim3 blockDim(16, 16);
dim3 gridDim((N + 15) / 16, (N + 15) / 16);
matmul_kernel<<<gridDim, blockDim>>>(d_A, d_B, d_C, N);
```

### 5.2 cuDNN and cuBLAS

Rather than writing CUDA kernels by hand, deep learning frameworks use NVIDIA's optimized libraries:

- **cuBLAS**: Highly optimized BLAS (Basic Linear Algebra Subroutines) — `GEMM` (General Matrix Multiply) for dense layers
- **cuDNN**: Convolution, pooling, RNN, softmax, batch normalization — all optimized for Tensor Cores
- **cuSPARSE**: Sparse matrix operations for pruned/quantized models
- **NCCL**: NVIDIA Collective Communications Library for distributed training (AllReduce, AllGather)

These libraries are what make PyTorch's `.cuda()` call actually fast — it dispatches to hand-optimized assembly kernels developed by NVIDIA's CUDA library teams.

### 5.3 Deep Learning Frameworks

```python
# PyTorch — most popular in research
import torch
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = MyTransformerModel().to(device)

# TensorFlow / Keras
import tensorflow as tf
tf.config.list_physical_devices('GPU')  # Check available GPUs

# JAX — Google's NumPy on accelerators
import jax
import jax.numpy as jnp
jax.devices()  # [CudaDevice(id=0)]

x = jnp.array([1.0, 2.0, 3.0])
y = jnp.dot(x, x)  # Runs on GPU automatically
```

### 5.4 OpenCL and ROCm (AMD)

NVIDIA's CUDA is proprietary. AMD's **ROCm (Radeon Open Compute platform)** is its open-source equivalent:

- **HIP**: AMD's CUDA-like kernel language (most CUDA code can be ported)
- **ROCm libraries**: hipBLAS, MIOpen (equivalent to cuBLAS, cuDNN)

PyTorch now officially supports AMD GPUs via ROCm, though the ecosystem maturity still lags NVIDIA's.

---

## 6. GPU Performance Metrics and How to Read Specifications

When evaluating a GPU for AI work, the following metrics matter:

### 6.1 TFLOPS (Tera Floating-Point Operations Per Second)

The raw compute throughput — but context matters:

| GPU | FP32 TFLOPS | FP16 TFLOPS | FP8 TFLOPS |
|---|---|---|---|
| RTX 3090 | 35.6 | 71 | — |
| A100 SXM4 | 19.5 | 312 | — |
| RTX 4090 | 82.6 | 165 | — |
| H100 SXM5 | 67 | 989 | 3,958 |

Note that **FP16/BF16/FP8 Tensor Core numbers are what matter for AI** — the FP32 CUDA core number is misleading for deep learning benchmarks.

### 6.2 Memory Bandwidth (GB/s)

Critical for inference and any memory-bound operations:

| GPU | Memory Type | Bandwidth |
|---|---|---|
| RTX 4090 | GDDR6X 24 GB | 1,008 GB/s |
| A100 80GB | HBM2e | 2,000 GB/s |
| H100 SXM5 | HBM3 | 3,350 GB/s |

### 6.3 VRAM Capacity

Determines maximum model size:

| VRAM | Max Model Size (FP16) |
|---|---|
| 24 GB (RTX 4090) | ~12B params (inference) |
| 80 GB (A100) | ~40B params |
| 8× 80 GB (DGX A100) | ~320B params |

### 6.4 PCIe vs SXM Form Factor

- **PCIe**: Consumer slot; PCIe 4.0 offers ~64 GB/s to CPU RAM
- **SXM**: NVIDIA's proprietary mezzanine; enables NVLink at 600–900 GB/s GPU-to-GPU

---

## 7. Practical GPU Usage for AI Practitioners

### 7.1 Checking GPU Status

```bash
# Check NVIDIA GPU status
nvidia-smi

# Real-time monitoring
watch -n1 nvidia-smi

# In Python
import torch
print(torch.cuda.is_available())
print(torch.cuda.get_device_name(0))
print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

### 7.2 Basic GPU Tensor Operations

```python
import torch

# Create tensors on GPU
a = torch.randn(1000, 1000, device='cuda')
b = torch.randn(1000, 1000, device='cuda')

# Matrix multiplication (uses Tensor Cores)
c = torch.matmul(a, b)

# Move data between CPU and GPU
cpu_tensor = torch.randn(100)
gpu_tensor = cpu_tensor.to('cuda')      # CPU → GPU
back_to_cpu = gpu_tensor.cpu()           # GPU → CPU

# Check device
print(a.device)   # cuda:0
```

### 7.3 Multi-GPU Training with PyTorch DDP

```python
import torch
import torch.distributed as dist
import torch.nn as nn
from torch.nn.parallel import DistributedDataParallel as DDP

def main(rank, world_size):
    dist.init_process_group("nccl", rank=rank, world_size=world_size)
    
    model = MyModel().to(rank)
    ddp_model = DDP(model, device_ids=[rank])
    
    optimizer = torch.optim.Adam(ddp_model.parameters())
    
    for batch in dataloader:
        output = ddp_model(batch.to(rank))
        loss = criterion(output, targets.to(rank))
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()
    
    dist.destroy_process_group()

# Launch: torchrun --nproc_per_node=4 train.py
```

### 7.4 Monitoring GPU Memory Usage

```python
# Check memory usage
print(f"Allocated: {torch.cuda.memory_allocated(0) / 1e9:.2f} GB")
print(f"Reserved:  {torch.cuda.memory_reserved(0) / 1e9:.2f} GB")

# Clear unused cache
torch.cuda.empty_cache()

# Context manager to measure peak memory
with torch.cuda.amp.autocast():
    output = model(inputs)
    
print(f"Peak memory: {torch.cuda.max_memory_allocated() / 1e9:.2f} GB")
```

### 7.5 Cloud GPU Options for Practitioners

| Platform | Top GPUs Available | Notes |
|---|---|---|
| Google Colab | T4, A100 (Pro+) | Free tier; limited session time |
| AWS EC2 (p4d) | 8× A100 | Production-grade; expensive |
| Lambda Labs | H100, A100 | Affordable dedicated GPU cloud |
| Vast.ai | Various (RTX 3090, A100) | Community marketplace; cheapest |
| RunPod | RTX 4090, A100, H100 | Per-hour billing |
| Paperspace Gradient | A100 | Notebook-friendly |

---

## 8. The GPU in the Modern AI Infrastructure Stack

The GPU does not operate in isolation — it is embedded in a complex hardware and software stack:

```
Application (PyTorch / TensorFlow / JAX)
        ↓
Framework Operator Dispatch
        ↓
CUDA Kernels (cuBLAS, cuDNN, custom ops)
        ↓
GPU Driver (NVIDIA Driver)
        ↓
GPU Hardware (CUDA Cores, Tensor Cores, HBM)
        ↑
Host System: CPU, PCIe Bus, System RAM
```

Understanding this stack enables practitioners to:
- Identify bottlenecks (is the GPU underutilized? Is PCIe bandwidth the bottleneck?)
- Write custom CUDA extensions for PyTorch
- Profile and optimize model execution
- Reason about deployment architectures for production inference

### 8.1 Emerging Alternatives to NVIDIA GPUs

NVIDIA's dominance, while overwhelming, is being challenged:

- **AMD MI300X**: 192 GB HBM3, excellent memory capacity for large LLMs; supported by PyTorch via ROCm
- **Google TPU v5**: Custom ASIC; superior for JAX-based models; available only on Google Cloud
- **AWS Trainium / Inferentia**: Amazon's custom AI chips for training and inference on EC2
- **Intel Gaudi 2**: Open architecture; challenges CUDA lock-in
- **Groq LPU**: Deterministic, ultra-low latency inference accelerator

Each alternative has trade-offs — none yet matches NVIDIA's full-stack maturity and ecosystem breadth.

---

## 9. Common Misconceptions

### "More CUDA cores = better for AI"
Not necessarily. A consumer GPU with 16,384 CUDA cores may be slower for deep learning than a data-center GPU with fewer cores but better Tensor Cores, higher memory bandwidth, and larger VRAM.

### "You need a high-end GPU to do AI"
For learning and small-scale experiments, an RTX 3060 (12 GB) or even Google Colab's free T4 is perfectly adequate. Many research papers were produced on single GPU setups.

### "GPU memory and system RAM are the same"
VRAM (GPU memory) is a separate resource. Data must be explicitly transferred via PCIe (or NVLink). A model that is "too big to fit in RAM" usually means too big for VRAM, not system RAM.

---

## 10. Summary and Key Takeaways

The GPU's rise from a graphics chip to the engine of the AI revolution is one of the most remarkable stories in the history of computing. Its architectural strengths — massive parallelism through thousands of cores, high-bandwidth memory systems, dedicated Tensor Cores for matrix arithmetic, and a rich software ecosystem via CUDA — make it uniquely suited to the mathematical demands of deep learning.

For AI practitioners, the key takeaways are:

1. **GPUs excel at parallelizable math** — specifically the matrix operations that power neural networks
2. **Memory bandwidth is often the binding constraint**, not raw FLOPS, especially during inference
3. **Tensor Cores deliver 10-20× speedups** over standard CUDA cores for deep learning — always use mixed precision (AMP)
4. **NVIDIA's CUDA ecosystem** remains the industry standard, though AMD ROCm is a growing alternative
5. **Cloud GPU options** like Colab, Lambda Labs, and RunPod make GPU access affordable for individuals
6. **The GPU is part of a broader stack** — understanding the CUDA programming model helps diagnose bottlenecks and write efficient code

As AI models grow larger and AI applications more pervasive, the GPU — and its successors — will remain at the foundation of the discipline for the foreseeable future.

---

*Next reading: A Comprehensive Analysis of NVIDIA GPU Architectures — Pascal, Turing, Ampere, and Ada →*