---
title: "From MIT to Source-Available: Licensing job-application-mcp for v1.0.0"
slug: job-application-mcp-licensing-and-v1
date: 2026-09-24
excerpt: The last stretch before tagging v1.0.0 wasn't more debugging — it was deciding what license the project should actually carry, and setting up the templates that let other people contribute to it.
tags: [Licensing, Open Source, MCP, Project Log]
category: Project Log
cover: ./images/cover.png
---

The OAuth/Azure/Claude Web debugging documented in the main job-application-mcp post happened earlier on September 24. Later the same day, the work shifted from "does it work" to "what is this project, legally and to other people." That's a genuinely different kind of decision than anything else in this project's log so far, so it gets its own entry.

## Preparing for a v1.0.0 tag

Two commits, back to back: `chore: prepare v1.0.0 release`, twice. Then `chore: prepare v1.0.0 release` again — the commit history shows this happened more than once in close succession, which reads as getting the release state right on a second attempt rather than one clean pass, though the commit messages don't say what changed between them.

## Replacing MIT with a source-available commercial license

The most consequential single change of this stretch: `chore: replace MIT with commercial source-available license`, alongside `docs: add v1 architecture and commercial licensing`. The new `LICENSE` file lays out a specific set of terms rather than the permissive MIT default:

- Anyone can view, fork, study, and contribute to the code for personal evaluation, learning, or non-commercial development.
- Commercial use — deploying it, hosting it, offering it as a service, or folding it into a paid product — requires a separate commercial license from the author.
- Redistribution of unmodified or modified source is allowed for non-commercial purposes, as long as the license and copyright notice stay attached.
- Anyone who contributes agrees the project can use, modify, and license their contribution under this same license or under separate commercial terms.

I don't have a documented record of the reasoning behind this specific choice — the commit message states the change, not the motivation. What's confirmed is the shape of the decision: keep the code genuinely readable and forkable for learning purposes, while reserving the right to commercialize it later without someone else's competing deployment undercutting that option. That's a different posture from most of my other repos, which don't carry this kind of restriction.

## Getting ready for other contributors

The same evening, a run of commits added the standard scaffolding a project needs before it can reasonably take outside contributions:

- `docs: add community contribution guide`
- `docs: add community code of conduct`
- `docs: add security policy`
- `docs: add pull request template`
- `docs: explain community contribution workflow`
- `docs: add bug report template`
- `docs: add feature request template`
- merged as PR #5, `docs: establish community contribution workflow`

None of these are code changes — they're the governance layer that makes a repository legible to someone who isn't the author. Given the license explicitly anticipates outside contributions (point 4 above), this wasn't incidental; the templates and the license update are part of the same "what happens when someone else wants to work on this" question.

## A last Docker fix on the way out

Two small, closely-timed fixes closed out the day: `fix: include license in Docker build context` and `fix: keep Dockerfile comment valid`, followed by `chore: trigger CI after Docker license fix`. Read together, the first suggests the Docker build was excluding the newly-added `LICENSE` file from its build context — likely because it wasn't accounted for in `.dockerignore` or a similar exclusion — which is a small but easy mistake right after adding a file that's supposed to ship with the project. I don't have the actual diff confirming that explanation, so it's a reasonable reading of the sequence rather than a confirmed one.

## What I learned

This stretch is a useful reminder that "finishing" a project for a v1 release isn't just the last bug fix — it's also the non-code decisions: what license it carries, what happens when someone else wants to contribute, and what governance a repository needs before it's ready to be looked at by people other than me. Compared to the OAuth/Azure debugging earlier the same day, this was a completely different kind of work, and it's easy to undervalue it because it doesn't produce a dramatic before/after the way a bug fix does.

---

| Link | Description |
|------|-------------|
| [GitHub: job-application-mcp](https://github.com/Mzaq1559/job-application-mcp) | Full MCP server, tools, and deployment history |
| [job-application-mcp: OAuth, Azure, and the Claude Web connection](./job-application-mcp) | The OAuth 2.1 / Auth0 / Azure Container Apps phase earlier the same day |
