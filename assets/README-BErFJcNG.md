---
title: "Redoing My Portfolio: Real Stats, Real Projects"
slug: portfolio-real-stats-and-a-deploy-conflict
date: 2026-07-03
tags: [react, typescript, vite, github-actions, github-pages, project-log]
category: Project Log
excerpt: "Two separate passes on my portfolio site — a deploy pipeline that was fighting itself in July, and a content overhaul with real project counts and a Live2D card in September."
cover: ./images/cover.png
---

My portfolio (React 18, TypeScript, Vite, Tailwind, Framer Motion) has had two rounds of real work on it that are worth writing up separately: a deployment fix in early July, and a bigger content and polish pass in September.

## The gh-pages vs. Actions conflict (July 3, 2026)

The site was deploying via the `gh-pages` npm package — the classic approach where a script builds the site locally (or in CI) and force-pushes the output to a `gh-pages` branch. At some point I added a GitHub Actions workflow for deployment instead, the more modern approach where Actions builds and deploys directly through GitHub's own Pages integration.

The problem: I had both configured at once. Two different mechanisms both trying to own the same deployment, which is exactly the kind of thing that produces confusing, hard-to-diagnose deploy failures — a push might trigger the Actions workflow, but the `gh-pages` package's own branch state (or a stray local deploy) could stomp on it, or vice versa.

The commit history from that day shows the cleanup:

- **13:14** — `Add GitHub Actions deployment workflow`
- **13:20** — `modified the deployment type` — this is where `gh-pages` actually came out. The diff removes it from both `package.json` and `package-lock.json` entirely:

```diff
  "devDependencies": {
    "@tailwindcss/vite": "4.1.12",
    "@vitejs/plugin-react": "4.7.0",
-   "gh-pages": "^6.3.0",
    "tailwindcss": "4.1.12",
    "vite": "^6.4.1"
  },
```

- **16:17** — `Trigger workflow rerun`
- **19:54** — `Trigger deploy after queue cleared`

Those last two "trigger" commits suggest the fix wasn't instant — there was at least one rerun and something described as a "queue" to clear before the site was deploying cleanly again. I don't have the actual error output from the failed runs, just the sequence of commits working through it. The same day also had a round of UI fixes (mobile navbar clipping and overlay, hero widget refinement, the timeline component), so this wasn't purely a deploy-debugging day — I was doing regular feature work in between.

## Real stats and new projects (September 18–20, 2026)

The bigger pass came in September. Going by the commit messages, this batch touched:

- **Project count and copy** — `feat(about): update project count to 9 and refresh bio text`, later `Split Computer Vision Suite into Vehicle Vision + DocVision AI; bump Projects Built to 10` — so the "how many projects" number moved at least twice as I split out or added projects, landing at 10.
- **New project cards** — `feat(projects): add SiteFlowAI and Computer Vision Suite cards`, later split into separate Vehicle Vision and DocVision AI cards once those became distinct enough to list separately.
- **Skills tab bug** — `Fix skills tab UI bug and expand skills data`. I don't have the specifics of what was broken in the tab UI, just that it was fixed alongside expanding the underlying skills data.
- **Layout fix** — `fix(audit): add dense grid flow to prevent gaps and update skill tags`, which reads as a CSS grid gap issue (likely an odd number of cards leaving a visible hole in the grid) fixed with `grid-auto-flow: dense` or equivalent.
- **Broken links** — `Fix broken GitHub and live demo URLs in projects.js`.
- **A Live2D companion card** — added to the About page as an interactive element (`Live2DCompanion` component, lazy-loaded with an error fallback), then reworked twice more the same day into a two/three-column layout with the Live2D card alongside bio text and a connect card (GitHub, portfolio, LinkedIn, LeetCode links) and an education card.

## What I'd call confirmed vs. not

**Confirmed:** the gh-pages/Actions conflict and its fix, the project-count changes, the new project cards, the grid-gap fix, the broken-link fix, and the Live2D card addition — all of these come directly from commit messages and, for the deploy conflict, an actual diff.

**Not confirmed:** the exact deploy error messages from July 3, what specifically was wrong with the skills tab UI, and whether the "About Me" rewrite mentioned in earlier notes (accurate stats framing) happened as part of this September pass or separately — the commit messages don't spell out the before/after copy.

## What I learned

Two deploy mechanisms pointed at the same target is a good way to get intermittent, confusing failures rather than a clean error — worth checking for that kind of overlap early rather than debugging symptoms one rerun at a time. On the content side: project counts and "what's featured" are the kind of thing that's easy to let go stale on a portfolio, and it took an explicit pass (twice, in this case — 9 projects, then 10) to keep the number honest as projects got added or reorganized.

---

| Link | Description |
|------|-------------|
| [GitHub: PortFolio](https://github.com/Mzaq1559/PortFolio) | React/TypeScript/Vite portfolio, deployed via GitHub Actions to GitHub Pages |
