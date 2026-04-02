---
title: "How Browsers Paint the Web: A Deep Dive into the Rendering Pipeline"
slug: how-browsers-render-html
date: 2025-07-10
tags:
  - Browser
  - Rendering
  - Performance
  - CSS
  - JavaScript
category: Web Development
cover: ./images/cover.png
series: backend-and-apis
seriesOrder: 12
---

# How Browsers Paint the Web: A Deep Dive into the Rendering Pipeline

## Introduction: The Invisible Assembly Line

When you type a URL and press Enter, a sequence of events occurs in milliseconds that transforms a plain text file (HTML) into the rich, interactive visual experience you see on screen. This journey—from network request to rendered pixels—is the **Browser Rendering Pipeline**, and understanding it deeply is the key to building fast, high-performance web applications.

Performance problems like "janky" animations, slow page loads, layout shifts, and unresponsive input are almost always violations of some stage in this pipeline. Knowing where each stage happens, what triggers each stage, and which stages are expensive allows you to diagnose and fix performance issues with surgical precision.

---

## 1. Stage 0: The Network — Fetching the Resources

Before the browser can render anything, it must fetch the HTML document and all its dependencies.

### 1.1 DNS Lookup, TCP Connection, TLS Handshake
The browser asks a DNS resolver for the IP address of the domain, establishes a TCP connection (3-way handshake), and negotiates a TLS session (for HTTPS). This can add 100-200ms before the first byte of HTML is received. **HTTP/3 and QUIC** protocols eliminate the multi-round-trip connection setup, reducing this to near-zero for returning visitors.

### 1.2 The Critical Rendering Path
The **Critical Rendering Path** is the sequence of steps the browser must complete to paint the first frame: HTML → DOM, CSS → CSSOM, DOM + CSSOM → Render Tree, Layout, Paint. Any resource that delays this sequence is "Render-Blocking."

- **Render-Blocking Resources**: `<link rel="stylesheet">` in `<head>` and `<script>` without `async`/`defer` attributes. The browser stops parsing HTML until these files are downloaded and processed.
- **Preloading**: `<link rel="preload" as="font">` tells the browser to fetch critical resources as soon as possible, before the parser encounters them.

---

## 2. Stage 1: Parsing HTML → The DOM

The browser's HTML parser reads the raw bytes of the HTML document and constructs the **DOM (Document Object Model)**—a tree-like data structure representing the document structure.

```
HTML → Bytes → Characters → Tokens → Nodes → DOM Tree
```

The DOM tree represents the semantic content and structure of the document. It is not the same as what is visually rendered—elements with `display: none` are in the DOM but not painted; pseudo-elements (`::before`, `::after`) are painted but not in the DOM.

### 2.1 Parser Blocking
When the HTML parser encounters a `<script>` tag without `async` or `defer`, it **stops parsing and waits** for the script to download and execute. This is because scripts can call `document.write()` which can insert new HTML, fundamentally changing what the parser would encounter next. For external scripts in `<body>`, this causes a measurable delay in page construction.

**Solutions**:
- `<script defer>`: Script downloads in parallel with HTML parsing; executes after DOM is complete.
- `<script async>`: Script downloads in parallel; executes immediately when downloaded (before DOM is complete). Only for scripts with no HTML dependencies.
- Place `<script>` tags at the bottom of `<body>` (old approach, superseded by `defer`).

---

## 3. Stage 2: Parsing CSS → The CSSOM

While parsing HTML, when the browser encounters a `<link rel="stylesheet">`, it downloads and parses the CSS into the **CSSOM (CSS Object Model)**—a tree representing all CSS rules and their computed values.

CSS parsing is **render-blocking**: the browser cannot construct the Render Tree until it has both the DOM and the complete CSSOM. A single slow CSS file can delay the entire first paint.

### 3.1 CSS Specificity and Cascade Computation
The CSSOM computation involves resolving CSS inheritance in order of **Specificity** and **Cascade**:
1. User agent (browser default) styles
2. User styles
3. Author (website) styles 
4. Author `!important` styles
5. User `!important` styles
6. Inline styles

The specificity calculation (`0,0,0,0` for universal → `1,0,0,0` for IDs) determines which rules "win" when multiple rules apply to the same element.

---

## 4. Stage 3: Constructing the Render Tree

The browser combines the DOM and CSSOM to create the **Render Tree**—containing only the visible nodes with their computed styles.

**Differences from DOM**:
- `display: none` elements → excluded from Render Tree
- `visibility: hidden` elements → included (they take up space)
- `<head>` → excluded
- Pseudo-elements (`::before`) → included

The Render Tree contains all the information needed to determine what to paint, but not yet *where* or *how big*.

---

## 5. Stage 4: Layout (Reflow)

**Layout** (also called "Reflow") is the process of calculating the exact position and size of every element in the Render Tree, based on the browser's viewport dimensions, the box model, and CSS geometry rules.

This is an expensive operation, especially for complex layouts. The browser has to solve a constraint satisfaction problem: given all the CSS rules, what is the final size and position of every element?

### 5.1 What Triggers a Layout?

Layout is triggered whenever the browser needs to recalculate element geometry:
- Changing element dimensions (`width`, `height`, `padding`, `margin`, `border`)
- Adding or removing DOM elements
- Changing font size
- Resizing the viewport
- Reading certain DOM properties from JavaScript (e.g., `element.offsetWidth`, `element.getBoundingClientRect()`)—this forces the browser to flush any pending layout calculations immediately (a "Forced Synchronous Layout")

---

## 6. Stage 5: Paint

**Paint** converts the Render Tree (with layout information) into actual pixels on a "layer." The browser determines which visual properties to paint in which order: backgrounds, borders, text, outlines, images.

Some CSS properties are cheap to change (they only trigger paint, not layout):
- Background color/image
- Color
- `box-shadow`

Some are extremely expensive (they trigger layout → paint):
- `width`, `height`, `position`, `display`

---

## 7. Stage 6: Compositing and the GPU

Modern browsers use **GPU-accelerated compositing** to combine multiple painted layers into the final screen image. By promoting certain elements to their own "compositor layer," the browser can animate them using the GPU without retouching the CPU-rendered layers.

### 7.1 Compositor-Only Properties: The Fast Path
Two CSS properties are handled **entirely by the GPU compositor** without triggering layout or paint:
- **`transform`**: Translating, rotating, scaling
- **`opacity`**: Fading

This is why the performance best practice for animations is: **always use `transform` and `opacity`**, never `left`/`top` (triggers layout) or `background-color` (triggers paint).

```css
/* BAD: Triggers layout on every frame */
.element { left: var(--x); top: var(--y); }

/* GOOD: GPU-composited, no layout/paint */
.element { transform: translate(var(--x), var(--y)); }
```

### 7.2 `will-change`: Promoting to Compositor Layers
`will-change: transform` tells the browser to promote an element to its own compositing layer *before* the animation starts, eliminating the "first frame stutter" where the browser has to re-composite on the first animation frame.

**Warning**: Every compositor layer consumes GPU memory. Promoting every element with `will-change` can exhaust VRAM and cause worse performance. Use it only for elements that will visually change.

---

## 8. Browser Performance APIs

### 8.1 The Performance Timeline API
```javascript
// Measure how long a specific operation takes
performance.mark('start');
doExpensiveWork();
performance.mark('end');
performance.measure('expensive-work', 'start', 'end');

const entries = performance.getEntriesByName('expensive-work');
console.log(entries[0].duration); // Time in milliseconds
```

### 8.2 `requestAnimationFrame`: Synchronizing with the Browser
Always use `requestAnimationFrame` for animations. The browser calls your callback at the right time in the rendering pipeline (before painting), ensuring your animations are smooth and don't cause unnecessary extra frames:

```javascript
function animate() {
  // This runs before each paint
  element.style.transform = `translateX(${x}px)`;
  x += 1;
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

---

## 9. Core Web Vitals: Measuring Rendering Performance

Google's **Core Web Vitals** are a set of standardized metrics that directly map to rendering pipeline stages:

- **LCP (Largest Contentful Paint)**: When is the largest visible element painted? Target: < 2.5s.
- **CLS (Cumulative Layout Shift)**: How much do elements unexpectedly move? Target: < 0.1. (Caused by images without size attributes, late-loading fonts, ads injected above content.)
- **INP (Interaction to Next Paint)**: How long after a user interaction is the next frame painted? Target: < 200ms. (The successor to FID.)

---

## 10. Conclusion: Pixel-Perfect Performance

The browser rendering pipeline is a beautifully engineered assembly line. Understanding each stage—DOM construction, CSSOM computation, Render Tree creation, Layout, Paint, and Compositing—gives you a mental model for diagnosing any rendering performance issue. 

The fastest code is code that avoids triggering expensive pipeline stages unnecessarily. Move animations to the GPU with `transform` and `opacity`. Use `requestAnimationFrame` for frame-synchronous updates. Minimize DOM and CSSOM changes. Eliminate render-blocking resources. And measure everything with the Performance API and Chrome DevTools.

---

*Next reading: The Virtual DOM: How React Optimizes Rendering →*
