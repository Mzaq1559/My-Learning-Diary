---
title: "Generative AI Models You Should Know"
slug: generative-ai-models
date: 2026-03-21
tags:
  - Generative AI
  - GAN
  - Diffusion Models
  - VAE
  - LLM
category: AI & Machine Learning
cover: ./images/cover.png
series: ai-and-deep-learning
seriesOrder: 5
---

# Generative AI Models You Should Know

Generative AI refers to a family of machine learning models capable of producing new data — synthesizing text, images, audio, video, code, and structured data — by learning the underlying statistical structure of training examples. Unlike discriminative models (which answer "what class does this input belong to?"), generative models answer a more ambitious question: "how is data like this structured, and how can I create more of it?"

The practical impact of generative AI has been extraordinary: DALL-E and Stable Diffusion created the AI image generation revolution; GPT-4 and Claude are reshaping knowledge work; Sora generates cinematic video from text prompts; AlphaCode competes with professional programmers. Behind all of these systems are a handful of core model families, each with distinct mathematical foundations, training procedures, strengths, and limitations.

This article provides a comprehensive survey of the major families of generative AI models — GANs, VAEs, Diffusion Models, Flow-based Models, Autoregressive Models, and the emerging generation of unified multimodal systems — covering their architecture, training objectives, practical applications, and the trade-offs that make each appropriate for different problems.

---

## 1. Why Generative Models Are Hard

Before surveying individual model families, it is worth understanding the core challenge that all generative models must solve.

### 1.1 The Intractable Distribution Problem

Real-world data — natural images, human text, speech waveforms — lives on a complex, high-dimensional manifold within an even higher-dimensional space. An image of 256×256 pixels in RGB has `256³ × 256² ≈ 4.3 billion` dimensions if we treat each pixel value independently. But the space of "realistic-looking photographs" is an infinitesimally small subset of that space — the vast majority of random pixel arrays look like noise, not images.

A generative model must learn to sample efficiently from the tiny slice of this high-dimensional space that corresponds to realistic data — without access to an analytical description of that distribution, only samples from it.

Different model families solve this problem in fundamentally different ways:
- **GANs**: Learn by adversarial competition — a generator and discriminator are trained against each other
- **VAEs**: Learn a compressed latent space with explicit probabilistic structure
- **Diffusion Models**: Learn to reverse a gradual noising process
- **Flow Models**: Learn an explicit invertible transformation between data and a simple distribution
- **Autoregressive Models**: Factorize the joint distribution into a product of conditionals

---

## 2. Generative Adversarial Networks (GANs)

### 2.1 Core Concept and Training Objective

Introduced by Ian Goodfellow et al. in 2014, **GANs** consist of two neural networks engaged in a minimax game:

- **Generator G**: Takes random noise vector z ∼ p(z) as input and produces synthetic data: `G(z) ≈ x_real`
- **Discriminator D**: Receives either a real data sample x or a generated sample G(z) and outputs the probability that the input is real: `D(x) ∈ [0, 1]`

**Training Objective (Minimax):**

```
min_G max_D V(G, D) = E_{x ~ p_data}[log D(x)] + E_{z ~ p_z}[log(1 - D(G(z)))]
```

Interpretation:
- The discriminator maximizes V — getting better at telling real from fake
- The generator minimizes V — getting better at fooling the discriminator
- At Nash equilibrium: D(x) = 0.5 for all x (can't distinguish real from fake)

**Training Loop:**

```python
import torch
import torch.nn as nn

# Hyperparameters
latent_dim = 128
lr = 0.0002
betas = (0.5, 0.999)

generator = Generator(latent_dim).cuda()
discriminator = Discriminator().cuda()
optimizer_G = torch.optim.Adam(generator.parameters(), lr=lr, betas=betas)
optimizer_D = torch.optim.Adam(discriminator.parameters(), lr=lr, betas=betas)
criterion = nn.BCELoss()

for epoch in range(num_epochs):
    for real_images, _ in dataloader:
        real_images = real_images.cuda()
        batch_size = real_images.size(0)
        
        # 1. Train Discriminator
        optimizer_D.zero_grad()
        
        real_labels = torch.ones(batch_size, 1).cuda()
        fake_labels = torch.zeros(batch_size, 1).cuda()
        
        real_loss = criterion(discriminator(real_images), real_labels)
        
        z = torch.randn(batch_size, latent_dim).cuda()
        fake_images = generator(z).detach()
        fake_loss = criterion(discriminator(fake_images), fake_labels)
        
        d_loss = (real_loss + fake_loss) / 2
        d_loss.backward()
        optimizer_D.step()
        
        # 2. Train Generator
        optimizer_G.zero_grad()
        z = torch.randn(batch_size, latent_dim).cuda()
        fake_images = generator(z)
        g_loss = criterion(discriminator(fake_images), real_labels)  # Fool discriminator
        g_loss.backward()
        optimizer_G.step()
```

### 2.2 DCGAN: Convolutional GANs

The Deep Convolutional GAN (DCGAN, Radford et al. 2015) established the standard architectural template for image GANs:

```python
class Generator(nn.Module):
    def __init__(self, latent_dim=100, img_channels=3, features=64):
        super().__init__()
        self.net = nn.Sequential(
            # Input: latent_dim × 1 × 1
            self._block(latent_dim, features * 16, 4, 1, 0),  # 4×4
            self._block(features * 16, features * 8, 4, 2, 1),  # 8×8
            self._block(features * 8, features * 4, 4, 2, 1),   # 16×16
            self._block(features * 4, features * 2, 4, 2, 1),   # 32×32
            nn.ConvTranspose2d(features * 2, img_channels, 4, 2, 1),  # 64×64
            nn.Tanh()
        )
    
    def _block(self, in_ch, out_ch, kernel, stride, pad):
        return nn.Sequential(
            nn.ConvTranspose2d(in_ch, out_ch, kernel, stride, pad, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(True)
        )
    
    def forward(self, z):
        return self.net(z.view(-1, z.size(1), 1, 1))
```

### 2.3 Notable GAN Variants

| Model | Innovation | Key Application |
|---|---|---|
| DCGAN (2015) | ConvNet generator/discriminator | Image synthesis |
| Wasserstein GAN (2017) | Stable training via Wasserstein distance | Training stability |
| Progressive GAN (2018) | Start low-res, progressively add layers | 1024px face synthesis |
| StyleGAN2 (2019) | Style injection via AdaIN normalization | Photorealistic faces (thispersondoesnotexist.com) |
| CycleGAN (2017) | Unpaired image-to-image translation | Horse→zebra, summer→winter |
| Pix2Pix (2017) | Paired image-to-image translation | Sketch→photo, map→satellite |
| BigGAN (2018) | Class-conditional synthesis at scale | ImageNet generation |
| StyleGAN3 (2021) | Alias-free synthesis | Animation-friendly faces |

### 2.4 GAN Challenges

**Mode Collapse**: The generator learns to produce a small variety of outputs that fool the discriminator, ignoring most of the real data distribution. Solution: Minibatch discrimination, Wasserstein loss.

**Training Instability**: Loss oscillation, vanishing gradients in the discriminator. Solution: Gradient penalty (WGAN-GP), spectral normalization.

**Evaluation Metrics**: No simple loss metric for generation quality. Common metrics include:
- **FID (Fréchet Inception Distance)**: Compares statistics of real vs generated feature distributions
- **IS (Inception Score)**: Diversity and quality combined
- **Precision/Recall**: Separate quality and coverage

---

## 3. Variational Autoencoders (VAEs)

### 3.1 The Latent Space Approach

Introduced by Kingma & Welling (2013), **VAEs** learn a **structured probabilistic latent space** from which new samples can be drawn. The core idea: map data to a latent distribution (rather than a specific point), force that distribution to be approximately Gaussian, then decode from sampled latent points to generate new data.

### 3.2 Architecture

```
Encoder:  x → μ(x), σ(x)       # Maps data to Gaussian distribution params
Sampling: z = μ + σ ⊙ ε, ε ~ N(0,I)  # Reparameterization trick
Decoder:  z → x̂                 # Reconstructs data from latent sample
```

```python
class VAE(nn.Module):
    def __init__(self, input_dim, latent_dim, hidden_dim=256):
        super().__init__()
        # Encoder
        self.encoder_base = nn.Sequential(
            nn.Linear(input_dim, hidden_dim), nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim), nn.ReLU()
        )
        self.fc_mu = nn.Linear(hidden_dim, latent_dim)
        self.fc_log_var = nn.Linear(hidden_dim, latent_dim)
        
        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, hidden_dim), nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim), nn.ReLU(),
            nn.Linear(hidden_dim, input_dim), nn.Sigmoid()
        )
    
    def encode(self, x):
        h = self.encoder_base(x)
        return self.fc_mu(h), self.fc_log_var(h)
    
    def reparameterize(self, mu, log_var):
        std = torch.exp(0.5 * log_var)
        eps = torch.randn_like(std)
        return mu + eps * std  # z = μ + ε·σ (differentiable!)
    
    def decode(self, z):
        return self.decoder(z)
    
    def forward(self, x):
        mu, log_var = self.encode(x)
        z = self.reparameterize(mu, log_var)
        x_hat = self.decode(z)
        return x_hat, mu, log_var
```

### 3.3 The ELBO Loss Function

```python
def vae_loss(x, x_hat, mu, log_var):
    # Reconstruction: how well does the decoder reproduce the input?
    recon_loss = F.binary_cross_entropy(x_hat, x, reduction='sum')
    
    # KL divergence: how far is q(z|x) from the prior N(0, I)?
    # KL(N(μ,σ²) || N(0,I)) = -0.5 * Σ(1 + log σ² - μ² - σ²)
    kl_loss = -0.5 * torch.sum(1 + log_var - mu.pow(2) - log_var.exp())
    
    return recon_loss + kl_loss
```

The **ELBO (Evidence Lower Bound)** trades reconstruction quality for latent space regularity — forces the latent space to be smooth and well-behaved, enabling interpolation between samples.

### 3.4 VAE Strengths and Use Cases

✅ **Explicit likelihood estimation**: Can compute exact ELBO for any data point  
✅ **Smooth, structured latent space**: Enables meaningful interpolation  
✅ **Stable training**: Simple loss, no adversarial dynamics  
✅ **Anomaly detection**: Unusual data → high reconstruction error  

Applications:
- **Drug molecule generation**: Sample new molecules from Gaussian prior
- **Image compression/editing**: Latent space interpolation
- **Representation learning**: Learned embeddings for downstream tasks
- **Anomaly detection**: Flag inputs with unexpectedly high reconstruction cost

---

## 4. Diffusion Models

### 4.1 The Key Insight: Learning to Denoise

**Diffusion models** (Ho et al., DDPM 2020; Song et al., score matching) have become the dominant paradigm for high-fidelity image, audio, and video generation. Their insight: rather than directly learning to generate data, learn to **reverse a gradual noising process**.

**Forward Process** (fixed, not learned): Gradually corrupt data by adding Gaussian noise over T steps:

```
q(x_t | x_{t-1}) = N(x_t; √(1-β_t) x_{t-1}, β_t I)

After T steps (T=1000 typically), x_T ≈ N(0, I)  — pure noise
```

Using the reparameterization, we can sample any noisy level directly:

```
x_t = √ᾱ_t x_0 + √(1-ᾱ_t) ε,  where ε ~ N(0,I)
```

**Reverse Process** (learned): Train a U-Net `ε_θ(x_t, t)` to predict the noise that was added:

```python
# DDPM Training (simplified)
for x_0, _ in dataloader:
    t = torch.randint(0, T, (batch_size,), device=device)
    noise = torch.randn_like(x_0)
    
    # Add noise: x_t = sqrt_alpha_bar[t] * x_0 + sqrt_one_minus_alpha_bar[t] * noise
    x_t = (sqrt_alpha_bar[t, None, None, None] * x_0 + 
           sqrt_one_minus_alpha_bar[t, None, None, None] * noise)
    
    # Predict the noise
    noise_pred = model(x_t, t)
    
    # Simple MSE loss on noise prediction
    loss = F.mse_loss(noise_pred, noise)
    loss.backward()
    optimizer.step()
```

### 4.2 Sampling: Reversing the Diffusion

```python
@torch.no_grad()
def sample_ddpm(model, img_size, T=1000):
    x = torch.randn(1, 3, img_size, img_size).cuda()
    
    for t in reversed(range(T)):
        t_tensor = torch.full((1,), t, device='cuda', dtype=torch.long)
        
        # Predict noise
        noise_pred = model(x, t_tensor)
        
        # Reverse step: remove predicted noise
        alpha = alphas[t]
        alpha_bar = alpha_bars[t]
        beta = betas[t]
        
        if t > 0:
            noise = torch.randn_like(x)
        else:
            noise = 0
        
        x = (1 / alpha.sqrt()) * (x - (1 - alpha) / (1 - alpha_bar).sqrt() * noise_pred)
        x = x + beta.sqrt() * noise
    
    return x
```

### 4.3 Latent Diffusion Models (Stable Diffusion)

Running diffusion in pixel space is expensive (1024×1024 images = 3M pixels). **Latent Diffusion Models** (Rombach et al., 2022) compress images to a small latent space via a VAE encoder first:

```
Image (512×512×3) → VAE Encoder → Latent (64×64×4) → Diffusion → VAE Decoder → Image
```

**Text conditioning** via CLIP text encoder:

```python
from diffusers import StableDiffusionPipeline
import torch

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16
).to("cuda")

# Text-to-image generation
image = pipe(
    prompt="A serene mountain lake at sunset, oil painting style, 8k",
    negative_prompt="blurry, low quality, distorted",
    num_inference_steps=50,
    guidance_scale=7.5,
    width=512, height=512
).images[0]

image.save("mountain_lake.png")
```

The `guidance_scale` controls **classifier-free guidance (CFG)** — how strongly the image is steered toward the text prompt vs unconditional generation.

### 4.4 SDXL, Stable Diffusion 3, and FLUX

The Stable Diffusion ecosystem has evolved rapidly:

| Model | Architecture | Key Feature | Resolution |
|---|---|---|---|
| SD 1.5 | UNet LDM | Baseline | 512×512 |
| SDXL | UNet LDM (larger) | Two text encoders, 2-stage | 1024×1024 |
| SD3 | Diffusion Transformer (DiT) | Flow matching, MMDiT | 1024×1024 |
| FLUX.1 | DiT based | Open source, highest quality | 1024×1024+ |

---

## 5. Flow-Based Models

### 5.1 Exact Likelihood via Invertible Transformations

**Normalizing Flows** (NICE, 2014; RealNVP, 2016; Glow, 2018) learn an **exact, invertible** transformation `f` between the data distribution `p(x)` and a simple prior `p(z)` (typically Gaussian):

```
z = f(x)   → encoding direction (data to latent)
x = f⁻¹(z) → generation direction (latent to data)
```

The key property: because `f` is invertible, we can compute the **exact log-likelihood** of any sample using the change-of-variables formula:

```
log p(x) = log p(z) + log |det J_f(x)|
```

where J_f is the Jacobian of f.

### 5.2 Coupling Layers (RealNVP)

The challenge: design network layers that are both expressive and invertible. RealNVP uses **affine coupling layers**:

```python
class AffineCouplingLayer(nn.Module):
    def __init__(self, split_dim, net):
        super().__init__()
        self.net = net  # Any neural network
        self.split_dim = split_dim
    
    def forward(self, x):
        x1, x2 = x[:, :self.split_dim], x[:, self.split_dim:]
        
        # x2 is conditioned on x1 — but x1 passes through unchanged
        log_scale, shift = self.net(x1).chunk(2, dim=1)
        scale = torch.exp(log_scale)
        
        y1 = x1  # Identity
        y2 = x2 * scale + shift  # Affine transform conditioned on x1
        
        log_det = log_scale.sum(dim=1)  # Exact log-det Jacobian!
        return torch.cat([y1, y2], dim=1), log_det
    
    def inverse(self, y):
        y1, y2 = y[:, :self.split_dim], y[:, self.split_dim:]
        log_scale, shift = self.net(y1).chunk(2, dim=1)
        scale = torch.exp(log_scale)
        
        x1 = y1
        x2 = (y2 - shift) / scale  # Exact inverse!
        return torch.cat([x1, x2], dim=1)
```

Flow models are strongest for **audio generation** (WaveGlow, WaveFlow) where exact likelihood is important.

---

## 6. Autoregressive Models

### 6.1 Factorizing Joint Distributions

**Autoregressive models** factorize the joint distribution into a product of conditionals:

```
p(x₁, x₂, ..., x_n) = p(x₁) · p(x₂|x₁) · p(x₃|x₁,x₂) · ... · p(x_n|x₁,...,x_{n-1})
```

**For text**: This is exactly what LLMs do — they model language as an autoregressive probability distribution over token sequences.

**For images**:
- **PixelCNN** (Van den Oord et al., 2016): Generates images pixel-by-pixel, conditioning each pixel on all previous pixels via masked convolutions
- **ImageGPT**: Applies GPT-style transformers to sequences of pixel values

**For audio**:
- **WaveNet** (DeepMind, 2016): Generates raw audio waveform samples at 24kHz, 16 bits per sample, conditioning each sample on all previous ones via dilated causal convolutions

```python
# WaveNet-style dilated causal convolution
class DilatedCausalConv(nn.Module):
    def __init__(self, channels, dilation):
        super().__init__()
        self.conv = nn.Conv1d(channels, channels, kernel_size=2, 
                              dilation=dilation, padding=dilation)
    
    def forward(self, x):
        # Causal: only relies on past samples
        return self.conv(x)[:, :, :-self.conv.dilation[0]]
```

### 6.2 Strengths and Limitations

✅ **Tractable exact likelihood**  
✅ **High-quality samples** (especially for text and audio)  
✅ **Stable, well-understood training**  
❌ **Slow sequential generation** — must generate one element at a time  
❌ **No natural latent space** for interpolation/editing  

---

## 7. Modern Multimodal Generative Systems

The frontier has moved beyond single-modality generation toward **unified multimodal architectures**:

### 7.1 Text-to-Image
- **DALL-E 3** (OpenAI): GPT-4 as caption writer + diffusion backbone; extremely prompt-adherent
- **Midjourney**: Closed diffusion-based system; best aesthetic quality
- **FLUX.1 [dev]** (Black Forest Labs): Open-weight DiT; best open-source quality

### 7.2 Text-to-Video
- **Sora** (OpenAI): Diffusion Transformer operating on video patches; cinematic coherence
- **Stable Video Diffusion**: Open-source video from images
- **Runway Gen-3**: Production-quality video generation as a service

### 7.3 Audio and Music
- **AudioCraft (MusicGen, AudioGen)**: Meta's open-source music and sound generation
- **Suno / Udio**: Full song generation with lyrics and music
- **Eleven Labs**: State-of-the-art text-to-speech with voice cloning

### 7.4 Code Generation
- **GitHub Copilot** (GPT-4 based): Line/block completion in the IDE
- **Claude for Code**: Full file and multi-file refactoring
- **Devin / SWE-agent**: Autonomous software engineering agents

---

## 8. Comparative Summary

| Model Family | Training | Sampling Speed | Sample Quality | Likelihood | Latent Space |
|---|---|---|---|---|---|
| GAN | Adversarial | Very Fast (1 forward pass) | High | No | Implicit |
| VAE | ELBO minimization | Fast | Medium | Approximate | Explicit |
| Diffusion | Score matching / noise prediction | Slow (50-1000 steps) | Highest | Approximate | None |
| Flow | Exact MLE | Very Fast | Good | Exact | Explicit |
| Autoregressive | MLE (next token) | Slow (sequential) | High | Exact | None |

---

## 9. Summary

Generative AI is not a single technology but a family of distinct mathematical frameworks, each with its own set of properties and optimal use cases. GANs deliver fast, photorealistic image synthesis through adversarial training. VAEs provide structured latent spaces for interpolation and anomaly detection. Diffusion models have achieved state-of-the-art image and video quality through iterative denoising. Flow models enable exact likelihood computation. Autoregressive models power the LLM revolution in text, and increasingly image and audio.

The current generation of multimodal generative systems — combining large language models with diffusion backbones and cross-modal attention — represents a convergence of these paradigms. Understanding the mathematical foundations of each family empowers practitioners to evaluate commercial systems, adapt open-source models, design evaluation pipelines, and reason about failure modes. As the field continues its rapid evolution, this foundational knowledge remains essential context for navigating the expanding landscape of generative AI.

---

*Next reading: Fundamental Principles of Neural Network Layers →*
