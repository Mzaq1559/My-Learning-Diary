---
title: "CUDA Basics: How Programmers Use GPUs for Computing"
slug: cuda-basics
date: 2026-03-24
tags:
  - CUDA
  - GPU Computing
  - Parallel Programming
  - NVIDIA
  - Performance
category: AI & Machine Learning
cover: ./images/cover.png
series: gpu-and-hardware
seriesOrder: 2
---

# CUDA Basics: How Programmers Use GPUs for Computing

For decades, software engineers wrote programs that executed on a single CPU core — or at most, a small handful of them. The logic was sequential: instruction A happens, then B, then C. This mental model broke down in the mid-2000s when GPU computing emerged as a radically different paradigm. **CUDA (Compute Unified Device Architecture)**, introduced by NVIDIA in 2007, made it possible to run thousands of operations simultaneously on GPU hardware with nothing more than an extension to the C programming language.

Today, CUDA is the invisible substrate powering every major deep learning framework. When you call `model.cuda()` in PyTorch, when TensorFlow dispatches a matrix multiplication, when JAX JIT-compiles your function — all of it ultimately translates into CUDA kernel launches and NVIDIA hardware instructions. Understanding CUDA at a conceptual and practical level transforms you from a user of black-box abstractions into an engineer who can reason about GPU performance, write custom operations, and debug mysterious slowdowns.

This article provides a thorough, technically grounded introduction to CUDA: its programming model, thread hierarchy, memory system, synchronization primitives, streams, and how it connects to the Python-based tools researchers and engineers use daily.

---

## 1. The Motivation: Why Not Just Use the CPU?

Before diving into CUDA mechanics, it is worth revisiting exactly why GPUs are necessary for ML workloads. The answer is not simply "GPUs are faster" — it is more precise than that.

### 1.1 Arithmetic Intensity and Compute-Bound vs Memory-Bound Operations

Computer scientists characterize operations by their **arithmetic intensity**: the ratio of floating-point operations to bytes of data transferred:

```
Arithmetic Intensity = FLOPs / Bytes transferred
```

- **High arithmetic intensity** (e.g., large matrix multiplication): Many FLOPs per byte read; dominated by compute throughput
- **Low arithmetic intensity** (e.g., elementwise addition): Few FLOPs per byte read; dominated by memory bandwidth

A modern CPU (Intel i9-13900K) offers:
- ~50 TFLOPS FP32 (with AVX-512)
- ~100 GB/s memory bandwidth
- Bandwidth-compute ratio: 2 FLOP/byte

An A100 GPU offers:
- 312 TFLOPS FP16 Tensor
- 2,000 GB/s HBM2e bandwidth
- Bandwidth-compute ratio: 156 FLOP/byte

For neural network training, which combines enormous matrix multiplications (high arithmetic intensity) with frequent gradient accumulations (moderate intensity), the GPU's combination of high-bandwidth memory AND massive compute is exactly what is needed.

### 1.2 The Parallelism Problem

A neural network layer computing `y = W·x + b` for a minibatch of 512 samples, where W is 4096×4096, requires:

```
512 × 4096 × 4096 × 2 = 17.2 billion multiply-add operations
```

A single CPU core, even at 4 GHz with AVX-512 FMA, can do roughly 512 FLOPs/cycle × 4 GHz = 2 TFLOPS. This layer takes ~8.6 seconds on one core.

On an A100 with 312 TFLOPS FP16: this same operation takes ~55 milliseconds. The GPU applies all those operations in parallel — literally thousands of threads running the same arithmetic on different data elements simultaneously.

---

## 2. The CUDA Programming Model

CUDA extends C/C++ with a small set of qualifiers and built-in variables that control GPU execution. Understanding the core model requires grasping four concepts: kernels, the thread hierarchy, memory spaces, and synchronization.

### 2.1 Kernels: Functions That Run on the GPU

A **kernel** is a C function that is executed on the GPU (the **device**) rather than the CPU (the **host**). It is marked with the `__global__` qualifier:

```cpp
// This function runs on the GPU
__global__ void my_kernel(float* data, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        data[i] = data[i] * 2.0f;  // Double each element
    }
}
```

The CPU launches the kernel using the triple-bracket `<<<...>>>` syntax, specifying how many thread blocks and threads to create:

```cpp
int n = 1024 * 1024;          // 1 million elements
int blockSize = 256;           // 256 threads per block
int gridSize = (n + blockSize - 1) / blockSize;  // Enough blocks

// Launch kernel: gridSize blocks of blockSize threads each
my_kernel<<<gridSize, blockSize>>>(data, n);
```

### 2.2 The Thread Hierarchy: Threads, Warps, Blocks, and Grids

CUDA organizes threads into a strict hierarchy:

```
Grid
└── Blocks (identified by blockIdx.x, blockIdx.y, blockIdx.z)
    └── Threads (identified by threadIdx.x, threadIdx.y, threadIdx.z)
        └── Warps (hardware grouping of 32 threads, handled automatically)
```

**Threads** are the atomic unit of execution. Each thread runs the same kernel code but has unique identifiers (`threadIdx`, `blockIdx`) used to calculate which data element it should process.

**Blocks** contain up to 1,024 threads. All threads in a block can share **shared memory** and synchronize with `__syncthreads()`. Blocks are independent of each other — the GPU scheduler can execute blocks in any order, on any SM.

**Grids** contain the full set of blocks for a kernel launch. A grid can be 1D, 2D, or 3D — convenient for operating on vectors, matrices, or volumetric data:

```cpp
// 2D grid/block for matrix operations
dim3 blockDim(16, 16);     // 16×16 = 256 threads per block
dim3 gridDim((N+15)/16, (N+15)/16);  // Enough blocks for N×N matrix

matrix_kernel<<<gridDim, blockDim>>>(A, B, C, N);

// Inside kernel:
int row = blockIdx.y * blockDim.y + threadIdx.y;
int col = blockIdx.x * blockDim.x + threadIdx.x;
```

**Warps** are the hardware scheduling unit — 32 threads that always execute the same instruction simultaneously. The programmer does not directly manage warps, but understanding them is critical for performance (especially **warp divergence**).

### 2.3 Warp Divergence: The Hidden Performance Killer

When threads within a warp take different paths (branching), the GPU must execute both paths serially:

```cpp
__global__ void bad_kernel(float* data, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    
    // WARP DIVERGENCE: even/odd threads take different paths
    if (i % 2 == 0) {
        data[i] = sinf(data[i]);  // Even threads do this
    } else {
        data[i] = cosf(data[i]);  // Odd threads do this
    }
    // All 32 threads must execute BOTH branches — half the work is wasted
}
```

For optimal performance, all threads in a warp should follow the same execution path — possible when branching is determined by block/grid indices rather than data values.

---

## 3. Memory: The Most Important CUDA Concept

Memory management is where most CUDA performance lives or dies. Misunderstanding CUDA memory leads to programs that are technically correct but 10-50× slower than they need to be.

### 3.1 The Six CUDA Memory Spaces

| Memory Type | Scope | Access Pattern | Size | Latency | Managed By |
|---|---|---|---|---|---|
| Global (VRAM) | All threads | R/W | 8–80 GB | ~700 cycles | Programmer |
| Shared | Block | R/W | 16–228 KB/SM | ~5 cycles | Programmer |
| Registers | Thread | R/W | ~65K 32-bit/SM | 1 cycle | Compiler |
| Constant | All (read-only) | Broadcast | 64 KB | ~5 cycles (cached) | Programmer |
| Texture | All (read-only) | Cached spatial | Virtual | ~5 cycles | Programmer |
| Local | Thread (private) | R/W (spill) | Register file | ~700 cycles (spill) | Compiler |

### 3.2 Global Memory: The Main Storage

Global memory is the large VRAM pool visible to all GPU threads. It is allocated on the host:

```cpp
float *d_data;  // 'd_' prefix convention: device pointer
cudaMalloc(&d_data, 1024 * sizeof(float));

// Transfer from CPU RAM to GPU VRAM
float h_data[1024] = {/* ... */};
cudaMemcpy(d_data, h_data, 1024 * sizeof(float), cudaMemcpyHostToDevice);

// Use in kernels...

// Transfer back to CPU
cudaMemcpy(h_data, d_data, 1024 * sizeof(float), cudaMemcpyDeviceToHost);

// Free
cudaFree(d_data);
```

**Critical rule**: accessing global memory has ~700-cycle latency. The GPU hides this latency through **thread-level parallelism** (while one warp waits for memory, the scheduler runs another warp), but this only works if there are many warps in flight. The key metric is **occupancy**: the ratio of active warps to the maximum number the hardware can hold.

### 3.3 Coalesced Memory Access

The most important global memory optimization is **coalescing**: when 32 threads in a warp access consecutive memory addresses, the hardware handles it in a single transaction. Non-coalesced access (strided, random) generates 32 separate transactions:

```cpp
// GOOD: thread i accesses element i — coalesced
__global__ void coalesced(float* data) {
    int i = blockDim.x * blockIdx.x + threadIdx.x;
    float val = data[i];  // 32 consecutive addresses → 1 transaction
}

// BAD: thread i accesses element i*32 — strided, not coalesced
__global__ void strided(float* data) {
    int i = blockDim.x * blockIdx.x + threadIdx.x;
    float val = data[i * 32];  // 32 addresses, stride 32 → 32 transactions
}
```

The performance difference is dramatic: strided access can be 10-20× slower than coalesced on a modern GPU.

### 3.4 Shared Memory: Your Manual Cache

Shared memory is a fast, on-chip SRAM that threads within a block can use as a **programmer-controlled cache**. The classic pattern is: load from slow global memory into shared memory, compute using fast shared memory, write results back to global memory.

**Example: Tiled Matrix Multiplication**

```cpp
#define TILE_SIZE 16

__global__ void tiled_matmul(float* A, float* B, float* C, int N) {
    // Shared memory tiles
    __shared__ float sA[TILE_SIZE][TILE_SIZE];
    __shared__ float sB[TILE_SIZE][TILE_SIZE];
    
    int row = blockIdx.y * TILE_SIZE + threadIdx.y;
    int col = blockIdx.x * TILE_SIZE + threadIdx.x;
    float sum = 0.0f;
    
    // Loop over tiles
    for (int t = 0; t < N / TILE_SIZE; t++) {
        // Load one tile from global → shared memory
        sA[threadIdx.y][threadIdx.x] = A[row * N + t * TILE_SIZE + threadIdx.x];
        sB[threadIdx.y][threadIdx.x] = B[(t * TILE_SIZE + threadIdx.y) * N + col];
        
        __syncthreads();  // Wait for all threads to load
        
        // Compute using shared memory (fast!)
        for (int k = 0; k < TILE_SIZE; k++) {
            sum += sA[threadIdx.y][k] * sB[k][threadIdx.x];
        }
        
        __syncthreads();  // Prevent overwriting shared memory while others still use it
    }
    
    C[row * N + col] = sum;
}
```

Tiled matmul reduces global memory accesses by a factor of `TILE_SIZE` (16×16 = 256× fewer slow reads). This is how cuBLAS achieves near-peak-theoretical performance on Tensor Cores.

---

## 4. Synchronization and Atomic Operations

### 4.1 `__syncthreads()`: Block-Level Barrier

`__syncthreads()` is a barrier: all threads in a block must reach it before any can proceed past it. It is critical when threads in a block collaborate — one thread's computation depends on what another has written to shared memory:

```cpp
__global__ void prefix_sum(int* data, int n) {
    extern __shared__ int temp[];
    int i = threadIdx.x;
    
    temp[i] = data[i];
    __syncthreads();  // Ensure all loads complete before proceeding
    
    for (int stride = 1; stride < n; stride *= 2) {
        int val = (i >= stride) ? temp[i - stride] : 0;
        __syncthreads();
        temp[i] += val;
        __syncthreads();
    }
    
    data[i] = temp[i];
}
```

**Warning**: `__syncthreads()` inside a conditional branch (where some threads skip it) leads to deadlock. All threads must execute the same sync points.

### 4.2 Atomic Operations

When multiple threads write to the same memory location, **race conditions** occur — the final value depends on which thread wrote last. Atomic operations prevent this:

```cpp
__global__ void histogram(int* pixels, int* hist, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        atomicAdd(&hist[pixels[i]], 1);  // Thread-safe increment
    }
}
```

Available atomics: `atomicAdd`, `atomicMax`, `atomicMin`, `atomicExch`, `atomicCAS` (compare-and-swap), and more.

**Performance note**: Heavy contention on one atomic location serializes threads. Prefer reducing within shared memory first, then one atomic per block:

```cpp
__global__ void fast_sum(int* data, int* result, int n) {
    extern __shared__ int sdata[];
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    
    sdata[threadIdx.x] = (i < n) ? data[i] : 0;
    __syncthreads();
    
    // Reduce within block using shared memory
    for (int s = blockDim.x / 2; s > 0; s >>= 1) {
        if (threadIdx.x < s) sdata[threadIdx.x] += sdata[threadIdx.x + s];
        __syncthreads();
    }
    
    // Only one atomic per block
    if (threadIdx.x == 0) atomicAdd(result, sdata[0]);
}
```

---

## 5. CUDA Streams: Overlapping Compute and Data Transfer

By default, all CUDA operations on a device are executed in order on the **default stream**. CUDA streams allow **concurrent** execution:

```cpp
cudaStream_t stream1, stream2;
cudaStreamCreate(&stream1);
cudaStreamCreate(&stream2);

// These operations overlap:
cudaMemcpyAsync(d_a, h_a, bytes, cudaMemcpyHostToDevice, stream1);
kernel_b<<<grid, block, 0, stream2>>>(d_b, d_c, n);  // Runs concurrently

cudaStreamSynchronize(stream1);
cudaStreamSynchronize(stream2);

cudaStreamDestroy(stream1);
cudaStreamDestroy(stream2);
```

Streams enable **pipelining**: while the GPU computes batch N on stream1, the CPU can transfer batch N+1 to GPU on stream2 — hiding data transfer latency behind compute.

This pattern is fundamental to high-throughput inference servers and data-loading pipelines in deep learning.

---

## 6. The CUDA Ecosystem: Libraries and Tools

### 6.1 Core Libraries (NVIDIA)

| Library | Purpose | Used By |
|---|---|---|
| cuBLAS | General Matrix Multiply (GEMM) | Dense layers, attention |
| cuDNN | Conv, pooling, RNN, softmax | CNNs, transformers |
| cuFFT | Fast Fourier Transform | Audio/signal processing |
| cuSPARSE | Sparse linear algebra | Pruned models |
| NCCL | Multi-GPU collective comms | Distributed training |
| Thrust | High-level GPU algorithms | Preprocessing |
| cuRAND | GPU random number generation | Dropout, sampling |

### 6.2 Profiling with Nsight

NVIDIA's **Nsight Compute** (`ncu`) provides cycle-accurate profiling:

```bash
# Profile a CUDA application
ncu --set full python train.py

# Key metrics to examine:
# - sm__throughput.avg.pct_of_peak: SM utilization
# - l1tex__t_bytes.sum / sm__cycles_elapsed: L1 bandwidth
# - dram__bytes.sum.per_second: DRAM bandwidth utilization
# - gpu__time_duration: Kernel execution time
```

**Nsight Systems** (`nsys`) provides system-level timeline visualization — showing GPU kernel execution, CPU overhead, data transfers, and stream interactions:

```bash
nsys profile --trace=cuda,nvtx python train.py
nsys-ui report.nsys-rep  # Open in GUI
```

### 6.3 NVTX: Annotating Timeline

Add markers to your Python code for cleaner profiling:

```python
import torch
from torch.cuda import nvtx

with nvtx.range("data_loading"):
    batch = next(dataloader_iter)

with nvtx.range("forward_pass"):
    output = model(batch)

with nvtx.range("backward_pass"):
    loss = criterion(output, targets)
    loss.backward()
```

---

## 7. CUDA in Python: From Low-Level to High-Level

Most AI practitioners interact with CUDA through Python libraries rather than writing C++ kernels directly.

### 7.1 PyTorch: The Standard Interface

```python
import torch

# Device management
device = torch.device('cuda:0')
print(torch.cuda.get_device_name(0))  # "NVIDIA A100"
print(torch.cuda.memory_allocated() / 1e9, "GB used")

# Tensor operations on GPU
x = torch.randn(1000, 1000, device=device, dtype=torch.float16)
y = torch.randn(1000, 1000, device=device, dtype=torch.float16)

# This dispatches to cuBLAS GEMM → Tensor Cores
z = torch.matmul(x, y)

# Automatic Mixed Precision
from torch.cuda.amp import autocast, GradScaler
scaler = GradScaler()

with autocast():
    output = model(inputs)
    loss = criterion(output, targets)

scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()
```

### 7.2 Writing Custom CUDA Extensions for PyTorch

When the built-in operations are insufficient, you can write custom CUDA kernels and integrate them directly into PyTorch:

```cpp
// custom_op.cu
#include <torch/extension.h>

__global__ void my_relu_kernel(float* data, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        data[i] = fmaxf(0.0f, data[i]);
    }
}

torch::Tensor my_relu(torch::Tensor input) {
    auto output = input.clone();
    const int n = input.numel();
    const int threads = 256;
    const int blocks = (n + threads - 1) / threads;
    
    my_relu_kernel<<<blocks, threads>>>(
        output.data_ptr<float>(), n
    );
    return output;
}

PYBIND11_MODULE(TORCH_EXTENSION_NAME, m) {
    m.def("my_relu", &my_relu, "Custom ReLU (CUDA)");
}
```

```python
# setup.py
from setuptools import setup
from torch.utils.cpp_extension import BuildExtension, CUDAExtension

setup(name='custom_op', ext_modules=[
    CUDAExtension('custom_op', ['custom_op.cu'])
], cmdclass={'build_ext': BuildExtension})
```

```bash
python setup.py install
```

```python
import custom_op
import torch

x = torch.randn(1000, device='cuda')
y = custom_op.my_relu(x)
```

### 7.3 Triton: PyTorch's New Custom Kernel Language

OpenAI's **Triton** allows writing GPU kernels in pure Python with nearly cuBLAS-level performance:

```python
import triton
import triton.language as tl

@triton.jit
def add_kernel(x_ptr, y_ptr, output_ptr, n_elements, BLOCK_SIZE: tl.constexpr):
    pid = tl.program_id(axis=0)
    offsets = pid * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE)
    mask = offsets < n_elements
    
    x = tl.load(x_ptr + offsets, mask=mask)
    y = tl.load(y_ptr + offsets, mask=mask)
    output = x + y
    tl.store(output_ptr + offsets, output, mask=mask)

# Launch
import torch
x = torch.randn(1024, device='cuda')
y = torch.randn(1024, device='cuda')
output = torch.empty_like(x)

grid = (triton.cdiv(x.numel(), 256),)
add_kernel[grid](x, y, output, x.numel(), BLOCK_SIZE=256)
```

Triton is the language behind **FlashAttention**, **xFormers**, and many other performance-critical components in modern LLM infrastructure.

### 7.4 CuPy: GPU NumPy

```python
import cupy as cp
import numpy as np

# Drop-in GPU replacement for NumPy
a = cp.random.randn(10000, 10000)  # Allocated on GPU

# Runs entirely on GPU
b = cp.fft.fft2(a)
c = cp.linalg.eigvalsh(a[:100, :100])

# Transfer back
c_cpu = cp.asnumpy(c)   # = cp.array(c).get()
```

---

## 8. Common CUDA Performance Anti-Patterns

### 8.1 CPU-GPU Synchronization Overhead

```python
# BAD: Check GPU output after every batch → forces sync
for batch in dataloader:
    output = model(batch.cuda())
    loss = criterion(output, targets)
    print(f"Loss: {loss.item()}")  # .item() forces GPU→CPU sync!

# GOOD: Accumulate, sync rarely
total_loss = 0
for batch in dataloader:
    output = model(batch.cuda())
    loss = criterion(output, targets)
    total_loss += loss.detach()  # No sync

print(f"Avg loss: {(total_loss / len(dataloader)).item()}")  # One sync
```

### 8.2 Launching Too Many Small Kernels

Each kernel launch has ~5-10 μs overhead. Chaining many tiny operations creates pipeline bubbles:

```python
# BAD: Many separate small operations
for i in range(100):
    x = x + 1
    x = torch.relu(x)
    x = x * 0.5
    # Each line → separate kernel launch

# GOOD: torch.compile fuses these into one kernel
import torch
model = torch.compile(model, mode="reduce-overhead")
```

### 8.3 Memory Fragmentation

Allocating and freeing VRAM repeatedly fragments the memory pool. Use PyTorch's `torch.cuda.empty_cache()` sparingly — it clears the allocator cache but fragmentation persists. Better: pre-allocate buffers and reuse them.

---

## 9. Understanding CUDA Error Handling

CUDA errors are asynchronous by default — an error in a kernel shows up at the next synchronization point. In production code, always check errors:

```cpp
// C++ error checking
#define CUDA_CHECK(call) \
    do { \
        cudaError_t err = call; \
        if (err != cudaSuccess) { \
            fprintf(stderr, "CUDA error in %s at line %d: %s\n", \
                    __FILE__, __LINE__, cudaGetErrorString(err)); \
            exit(EXIT_FAILURE); \
        } \
    } while(0)

CUDA_CHECK(cudaMalloc(&d_data, bytes));
CUDA_CHECK(cudaMemcpy(d_data, h_data, bytes, cudaMemcpyHostToDevice));
```

```python
# Python: enable CUDA error detection
import os
os.environ['CUDA_LAUNCH_BLOCKING'] = '1'  # Makes errors synchronous
# Now stack traces show the actual failing operation
```

---

## 10. Summary and Key Principles

CUDA is the foundational programming model that enables GPU-accelerated AI computation. Mastering it — even at a conceptual level without writing raw kernels — makes you a dramatically more effective ML engineer. The key principles are:

1. **The thread hierarchy** (thread → warp → block → grid) is the organizational unit of all GPU computation. Each thread processes one data element; warps of 32 execute in lockstep SIMT fashion.

2. **Memory is everything**. Global memory is large but slow. Shared memory is small but fast. The performance difference between naive and optimized CUDA code is almost always a memory access pattern problem.

3. **Coalesced access** — consecutive threads accessing consecutive addresses — is the single most impactful optimization for global memory performance.

4. **CUDA streams** enable overlapping compute and data transfer, essential for high-throughput production pipelines.

5. **Don't synchronize unnecessarily**. Every `.item()` call, every `cudaDeviceSynchronize()`, every `loss.item()` in a training loop forces a GPU→CPU sync and breaks the asynchronous execution pipeline.

6. **The CUDA ecosystem** (cuBLAS, cuDNN, NCCL, Triton) does the hard work. Custom kernels are usually only needed for novel operations not covered by existing libraries.

7. **Profile before optimizing**. Use `ncu` for kernel-level analysis, `nsys` for system-level timeline, PyTorch Profiler for framework-level attribution. Guess-and-check optimization is ineffective on GPU code.

With this foundation, you are equipped to understand what PyTorch is doing under the hood, write custom operations when needed, profile and optimize GPU utilization, and reason clearly about the hardware requirements of your AI workloads.

---

*Next reading: A Comparative Study of Tensor Cores and CUDA Cores →*
