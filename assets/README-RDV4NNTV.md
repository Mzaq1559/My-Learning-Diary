---
title: I Leaked My GitHub Token — and Fixed It
slug: leaking-and-fixing-a-github-token
date: 2026-06-25
tags: [react, typescript, vite, github-actions, security, project-log]
category: Project Log
excerpt: "VITE_GITHUB_TOKEN was sitting right there in my blog's public JavaScript bundle. Here's what was actually happening, and the fix that moved it out."
cover: ./images/cover.png
---

<!-- CHECK: I don't have a record of how I first noticed the token was exposed — whether I spotted it myself while poking around the built bundle, or something flagged it. Leaving that part out rather than guessing. -->

I built this blog's CMS (that's a separate post) so I could publish by committing straight to a GitHub repo through the Octokit API. That meant the app needed a GitHub token to talk to the API — and for a while, I had that token going in through `import.meta.env.VITE_GITHUB_TOKEN`.

The problem: anything prefixed `VITE_` in a Vite project gets inlined into the client bundle at build time. That's the whole point of the prefix — it's Vite's way of saying "this is safe to expose to the browser." I hadn't fully internalized that. My token wasn't safe to expose. It was going out with every page load, sitting in plain text in the JavaScript anyone could view-source on my public blog.

## How it was wired

Before the fix, `vite.config.ts` was reading a token out of my local `.env` file and baking it into the build with `define`:

```ts
// Read GITHUB_TOKEN from .env file (first line)
let githubToken = '';
try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/GITHUB_TOKEN=(.*)/);
    githubToken = (match?.[1] || envContent.split('\n')[0] || '').trim();
  }
} catch (e) {
  console.warn('Failed to read .env file:', e);
}

// ...
define: {
  'import.meta.env.VITE_GITHUB_TOKEN': JSON.stringify(process.env.VITE_GITHUB_TOKEN || githubToken || ""),
},
```

And the GitHub Actions deploy workflow was passing the same token in as a build-time env var, which meant it got inlined during CI builds too:

```yaml
- name: Build
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    VITE_GITHUB_TOKEN: ${{ secrets.VITE_GITHUB_TOKEN }}
  run: npm run build
```

Several places in the app — `githubApi.ts`, `postDiscovery.ts` — were also falling back to `import.meta.env.VITE_GITHUB_TOKEN` whenever there wasn't a user-provided token, as a kind of default auth. So the token wasn't a one-off leak; it was structurally part of how the app authenticated.

## The fix

On June 25, 2026, I moved the token out of the client build entirely. The core change: generate the posts index — the thing that actually needs GitHub API access — as a separate, server-side prebuild step in CI, using the token only in that step, and never pass it into the actual `vite build`:

```yaml
# 5. Generate posts index using the token server-side
- name: Generate Posts Index
  env:
    VITE_GITHUB_TOKEN: ${{ secrets.VITE_GITHUB_TOKEN }}
  run: node scripts/generate-posts-index.js

# 6. Build the application
- name: Build
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: npm run build
```

Then I stripped every `import.meta.env.VITE_GITHUB_TOKEN` fallback out of `githubApi.ts` and `postDiscovery.ts`, so the client only ever uses a token the user explicitly provides through the app itself:

```ts
// before
const env = import.meta.env.VITE_GITHUB_TOKEN?.trim() ?? "";
return new Octokit({ auth: user || env || undefined });

// after
return new Octokit({ auth: user || undefined });
```

And I deleted the `.env`-reading block and the `define` injection from `vite.config.ts` altogether — there was nothing left that needed to bake a token into the bundle.

To make sure the client still had *something* to read without hitting the GitHub API on every visit, `generate-posts-index.js` now writes a `posts-index.json` at build time (using the token, server-side), and the app reads that bundled file first, only falling back to live API calls when it needs something the index doesn't have.

## The same evening, two related fixes

Two other fixes landed the same evening as part of the same cleanup: `Fixing GitHub API Rate Limits` and `fix: mobile layout improvements across all pages`. I don't have detail beyond the commit messages themselves on what the rate-limit fix specifically did differently, or what the mobile layout issues were, but they're clearly part of the same push to make the blog work reliably outside of my own dev environment — mobile visitors hitting the (until then) unauthenticated GitHub API were presumably a big part of why the rate limit was showing up at all.

## What I learned

Vite's `VITE_` prefix convention is a contract, not a suggestion — if a variable has that prefix, assume it *will* end up in the browser. Anything that shouldn't be public shouldn't get that prefix, full stop. The actual fix wasn't complicated once I saw the shape of the problem: separate the thing that needs a secret (a server-side or CI-side prebuild step) from the thing that gets shipped to the browser (the static build).

---

*I don't have a record of whether the token was ever actually exposed in a live production deploy, or caught before it went out — the repo history shows the fix, not the incident report. Worth treating this as "here's the mistake in the code and the fix," not "here's a public breach story."*
