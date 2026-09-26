---
title: "job-application-mcp: Building the Tools, Then Hitting the First Deploy Blockers"
slug: job-application-mcp-tools-and-first-deploy-blockers
date: 2026-09-22
excerpt: Before OAuth and Azure ever entered the picture, job-application-mcp needed its actual MCP tools built — profile, resumes, jobs, applications — and its first transport bug fixed, a silent 307 redirect that would have broken any real client.
tags: [MCP, Python, FastAPI, Testing, Developer Tools, Project Log]
category: Project Log
cover: ./images/cover.png
---

The main job-application-mcp post covers the OAuth/Azure/Claude Web saga in detail, but that saga started from an earlier, quieter phase: actually building the MCP tools themselves and getting a bare server running reliably. This post covers that earlier stretch — September 22–23, 2026 — before Auth0 or Azure Container Apps were part of the picture.

## Building the tools, one domain at a time

The commit history from September 22 shows the tools going in as a clean, layered build — schemas first, then services, then the MCP tool wrappers around them:

- **16:41** — Pydantic schemas for the MCP tool boundary (profile, job, application)
- **17:41** — profile service and document-extraction utilities
- **17:42** — resume service (upload, versioning, keyword-based selection)
- **17:42** — job service (create/list, duplicate check, "transparent analysis")
- **17:42** — application service (status workflow, duplicate check, history) and an interview service
- **17:42–17:44** — the actual MCP tool wrappers: profile tools, resume tools (list, get, upload, update, delete, select_for_job), job tools (create with duplicate check, get, list, analyze, status), and application/interview tools

So the shape of the system, per the commit messages themselves: a service layer that does the real work (duplicate-checking jobs before creating them, tracking application status as a workflow, versioning resumes), with a thin MCP tool layer on top that exposes those services to an AI client. That mirrors the general MCP design idea from the main post — model calls a tool, the tool layer does the actual work — but this is where it actually got implemented rather than just described.

## The first real bug: a silent redirect

Once there was a server to actually run, the first infrastructure problem showed up. The original `create_app()` mounted the MCP ASGI app under `/mcp` using Starlette's `Mount`:

```python
return Starlette(
    routes=[
        Route("/health", health),
        Route("/ready", ready),
        Mount("/mcp", app=mcp_asgi_app),
    ],
    ...
)
```

That `Mount` caused a 307 redirect from `/mcp` to `/mcp/` — Starlette's default behavior when a mounted sub-app doesn't get an exact-prefix match. That's the kind of thing that's easy to miss testing locally with a browser or curl (both follow redirects transparently) but breaks a client that doesn't automatically follow a 307 on a POST.

The fix, per the commit message, was to stop mounting the MCP app as a sub-application at all: register `/health` and `/ready` directly on the MCP server itself via `@mcp.custom_route`, so they're sibling routes rather than routes on a separate outer app with a mount boundary in between.

The same commit also switched the bearer-auth middleware from Starlette's `BaseHTTPMiddleware` to pure ASGI:

```python
# before: BaseHTTPMiddleware, which buffers the request/response
class BearerAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        ...

# after: pure ASGI, so it doesn't interfere with the
# streamable-HTTP transport's request/response streaming
class BearerAuthMiddleware:
    async def __call__(self, scope, receive, send):
        ...
```

The comment left in the code is explicit about why: `BaseHTTPMiddleware` buffers the request and response, which doesn't play well with a streaming transport like Streamable HTTP.

## Auth, before Auth0

At this stage, auth wasn't OAuth yet — it was a static shared-secret bearer token (`MCP_AUTH_TOKENS`), checked against the `Authorization` header on any request under `/mcp`. The code explicitly refuses to serve `/mcp` at all if no token is configured, rather than silently allowing open access — a deliberate fail-closed default. A comment in the source is direct about the reasoning: this was a personal, single-user server, so a full OAuth 2.1 authorization server was more than the situation needed at the time. That changed later — the main post covers the actual move to Auth0 and OAuth 2.1 — but the bearer-token version was the real starting point.

## Getting persistence right

A few smaller but real fixes landed the same stretch:

- `fix: wrap streamable-http app's own lifespan to run init_db() on startup` — making sure the database tables actually get created when the app starts, rather than assuming they already exist.
- `feat: add Dockerfile and docker-compose.yml (Postgres + app, non-root, healthcheck)` — the containerized setup uses Postgres for the app itself, running as a non-root user with a healthcheck.
- `test: add pytest fixtures (isolated per-test SQLite database)` — the test suite runs against SQLite specifically so each test gets a clean, isolated database, separate from the Postgres setup used for the real deployment.

Worth being precise about that distinction: the production/dev setup runs on Postgres via Docker Compose; SQLite shows up specifically in the test fixtures, for isolation and speed, not as the production database.

## What I learned

The 307 redirect bug is a good example of something that looks completely fine when you test it casually (curl and browsers just follow redirects) and only shows up once a real, stricter client is in the loop. It's the same category of lesson as the later 421 Host-header issue documented in the main post: transport-layer behavior that's invisible until something other than a forgiving manual test hits it. Building the tools themselves was comparatively straightforward — it was standing the server up as something a real client could actually talk to that surfaced the first genuine problems.

---

| Link | Description |
|------|-------------|
| [GitHub: job-application-mcp](https://github.com/Mzaq1559/job-application-mcp) | Full MCP server, tools, and deployment history |
| [job-application-mcp: OAuth, Azure, and the Claude Web connection](./job-application-mcp) | The later OAuth 2.1 / Auth0 / Azure Container Apps phase of this project |
