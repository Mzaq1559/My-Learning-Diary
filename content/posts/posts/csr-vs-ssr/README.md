---
title: "CSR vs SSR vs SSG: An Architectural Analysis of Rendering Strategies"
slug: csr-vs-ssr
date: 2025-07-05
tags:
  - SSR
  - CSR
  - Next.js
  - Performance
  - Web
category: Web Development
cover: ./images/cover.png
series: backend-and-apis
seriesOrder: 6
---

# CSR vs SSR vs SSG: An Architectural Analysis of Rendering Strategies

## Introduction: Where Does the HTML Come From?

Every web page is ultimately HTML delivered to a browser. The fundamental question of modern web architecture is: **where and when is that HTML generated?** The answer defines your application's performance characteristics, SEO behavior, developer experience, and infrastructure requirements.

Three primary rendering strategies dominate the modern web ecosystem: **Client-Side Rendering (CSR)**, **Server-Side Rendering (SSR)**, and **Static Site Generation (SSG)**. Understanding the trade-offs between them is one of the most important architectural decisions you will make for any web project.

---

## 1. Client-Side Rendering (CSR): The SPA Model

**CSR** is the model introduced by frameworks like Angular (2010), React (2013), and Vue (2014). The server delivers a minimal "shell" HTML file (essentially just a `<div id="root"></div>` and a JavaScript bundle). The browser downloads the JavaScript, executes it, and the framework generates all the HTML dynamically in the browser.

### 1.1 The CSR Request Flow
1. Browser requests `https://app.example.com`
2. Server responds instantly with a near-empty HTML file + JS bundle URLs
3. Browser downloads JS bundle (can be 500KB–5MB+)
4. Browser parses and executes the JS bundle
5. Framework fetches API data
6. Framework renders the HTML into the DOM
7. **User sees content** ← This can be 2-5 seconds after step 1

### 1.2 CSR Advantages
- **Smooth navigation**: After the initial load, page transitions are instant (no server round-trips)—the framework just re-renders the component tree
- **Rich interactivity**: The entire application state lives in memory, enabling complex, real-time interfaces
- **Simple deployment**: Just static files on any CDN
- **Strong separation of concerns**: Backend is a pure API; frontend is a pure consumer

### 1.3 CSR Disadvantages
- **Slow Time-to-First-Byte (TTFB)** and **Slow Time-to-Interactive (TTI)**: Users stare at a blank screen while JS downloads and executes. On slow networks or low-end devices, this can be 5+ seconds.
- **Poor SEO**: Googlebot can execute JavaScript, but other crawlers (social media, news aggregators) often see an empty page. The `og:description` meta tag populated by JavaScript won't be visible to Facebook's scraper.
- **Expensive client-side JavaScript**: Every user's device pays the computational cost of rendering.

**Best for**: Admin dashboards, SaaS applications behind a login (no SEO needed), real-time collaborative tools, anything requiring complex client-side state.

---

## 2. Server-Side Rendering (SSR): Dynamic HTML on Every Request

**SSR** generates the HTML on the server for each request. When a user requests a page, the server fetches the data, renders the React/Vue component tree to HTML, and sends the complete HTML to the browser. React/Vue then "hydrates" the HTML (attaching event listeners) to make it interactive.

### 2.1 The SSR Request Flow
1. Browser requests `https://app.example.com/product/123`
2. **Server** fetches product data from database (~50ms)
3. **Server** renders complete HTML (~10ms)
4. Server responds with fully-formed HTML (~60ms total)
5. **User sees content immediately** ← TTFB is fast
6. Browser downloads JS bundle
7. React hydrates the HTML → fully interactive

### 2.2 SSR Advantages
- **Excellent TTFB**: Content is visible as soon as the server responds (60-200ms vs. 2-5s for CSR)
- **SEO-friendly**: All metadata and content is in the initial HTML, visible to all crawlers
- **Works without JavaScript**: The page is readable even before JS loads
- **Better LCP scores**: The Largest Contentful Paint happens from the server-rendered HTML

### 2.3 SSR Disadvantages
- **Server cost**: Every page view requires server computation. At scale, this is expensive.
- **Higher TTFB variance**: If the database is slow, every user waits. CSR isolates the slow API call to the client.
- **Hydration complexity**: Mismatches between server-rendered HTML and client-rendered React output cause hydration errors (a common and frustrating bug).

**Best for**: E-commerce product pages, news articles, any content that is dynamic but must be SEO-indexed.

---

## 3. Static Site Generation (SSG): Pre-Built at Deploy Time

**SSG** pre-renders all pages at **build time** into static HTML files. These files are then deployed to a CDN and served instantly with no server computation required.

### 3.1 The SSG Flow
- **At build time**: Framework fetches all data, renders all pages to static HTML files
- **At request time**: CDN serves pre-built HTML in ~10ms, regardless of traffic

### 3.2 SSG Advantages
- **Fastest possible TTFB**: Content is served from CDN in milliseconds
- **Infinitely scalable**: A CDN can handle 10 million concurrent requests with no backend scaling
- **Zero server cost per request**: You pay only for build time, not per-request computation
- **Perfect security**: No server-side code means no server-side vulnerabilities

### 3.3 SSG Disadvantages
- **Stale content**: Data fetched at build time ages. A news site built with SSG shows yesterday's articles until the next rebuild.
- **Slow build times**: A site with 100,000 pages can take 30+ minutes to build
- **Not suitable for dynamic, personalized content**: User-specific pages (e.g., "Your Profile") cannot be statically generated

**Best for**: Marketing sites, documentation, personal blogs, landing pages, product catalogs with infrequent updates.

---

## 4. Incremental Static Regeneration (ISR): The Hybrid

Next.js introduced **ISR** to address SSG's stale content problem. A page is statically generated, but it automatically re-generates in the background at a configurable interval.

```javascript
// pages/product/[id].js (Next.js)
export async function getStaticProps({ params }) {
  const product = await fetchProduct(params.id);
  return {
    props: { product },
    revalidate: 60 // Regenerate this page in the background every 60 seconds
  };
}
```

With ISR, page content is at most 60 seconds stale, but every request is served from CDN speed.

---

## 5. Streaming SSR: The Next Frontier

React 18 introduced **Streaming SSR**, which allows the server to send HTML to the browser in chunks as it becomes available, rather than waiting for all data fetching to complete before sending anything. Combined with `<Suspense>` boundaries, critical above-the-fold content (like a product title) is streamed first, while slower content (like product reviews) streams in later—each piece appearing as soon as its data is ready.

---

## 6. Decision Framework

| Use case | Strategy |
|---|---|
| Marketing / blog / docs | SSG (Astro, Next.js static) |
| E-commerce product pages | ISR or SSR (Next.js) |
| News, real-time dashboards | SSR |
| SaaS behind login, admin | CSR (React SPA) |
| High-traffic, near-static content | SSG + ISR |

---

## 7. Conclusion

The evolution from CSR to SSR to SSG to ISR to Streaming SSR represents the industry's ongoing refinement of the answer to "where does HTML come from?" The modern answer is: **it depends on the content's dynamism, personalization requirements, and performance targets**. Frameworks like Next.js and SvelteKit allow you to mix strategies within a single application—static for the marketing homepage, SSR for product pages, and CSR for the logged-in dashboard. This "hybrid rendering" approach represents the current state of the art in web architecture.

---

*Next reading: The DOM: The Browser's Programming Interface →*
