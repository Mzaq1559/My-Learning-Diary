---
title: Learning FastAPI by Building an Issue Tracker
slug: learning-fastapi-issue-tracker
date: 2026-08-04
tags: [fastapi, python, learning, project-log]
category: Project Log
excerpt: "Following a YouTube tutorial to build a small issue-tracker API in FastAPI — routes, schemas, CRUD, a timing middleware, and CORS, one commit at a time."
cover: ./images/cover.png
---

I built a small issue-tracker API to actually learn FastAPI, rather than just reading about it — following [this tutorial](https://www.youtube.com/watch?v=8TMQcRcBnW8) and typing the code out myself instead of copy-pasting. This is a straightforward build log rather than a "here's the dramatic bug" post — the commit history doesn't record a specific incident, just a steady progression, so that's what I'm writing up.

## How it went, commit by commit

The repo history lays out the build almost like a syllabus:

- **July 13** — first commit, project scaffolded
- **July 14** — a root endpoint returning a dictionary serialized to JSON — the "hello world" of a FastAPI app
- **July 19** — `storage.py`: load and save data functions, the persistence layer before there was anything to persist yet
- **August 4, 17:40** — `schemas.py` edited — getting the Pydantic models right before wiring up real routes
- **August 4, 19:06** — endpoints for viewing all issues, creating an issue, and getting one by ID
- **August 4, 19:59** — an endpoint to update an issue by ID
- **August 4, 20:08** — the delete-by-ID endpoint, completing full CRUD
- **August 4, 20:19** — a custom timing middleware
- **August 4, 20:24** — CORS configuration, specifying allowed methods and domains
- **August 4, 20:27** — `requirements.txt` added
- **August 4, 20:40** — README updated

What jumps out is that most of the actual API work — full CRUD, middleware, and CORS — landed in about a three-hour window on August 4, after the groundwork (scaffolding, storage, schemas) had been laid down over the previous few weeks in shorter sessions.

## What each piece was for

Following the routes in order tells a reasonably clear story about what FastAPI actually needs to become a working API:

1. **Schemas first.** Getting the Pydantic request/response models defined before writing the routes that use them — the tutorial's structure, and a sensible order regardless.
2. **Read-only routes before writes.** List-all, create, and get-by-ID landed together, before update or delete — so I had something I could inspect and confirm was working before adding the routes that mutate state.
3. **Full CRUD, then the supporting pieces.** Update and delete completed the basic API; the timing middleware and CORS configuration came after, once there was an actual API worth instrumenting and exposing to a frontend.

## What I don't have a record of

The route/response-model bugs I remember running into aren't specifically documented in the commit messages — they're commits like "edited schemas.py" and "modified," not "fix: response model was returning the wrong shape." So I can't honestly reconstruct what those bugs were beyond knowing (from my own memory, not the repo) that response-model mismatches were part of what I was debugging while learning FastAPI's `response_model` parameter and how it differs from just returning a dict.

## What I learned

Following a tutorial by typing the code myself, rather than copying it, is where actually understanding *why* a piece of FastAPI works comes from — the parts I remember being genuinely confusing at the time (response models specifically) were the parts where FastAPI does something slightly different from what you'd expect coming from a framework where you just return whatever you want from a route. Building the storage layer and schemas before the routes that use them, rather than routes-first, also made way more sense once the API had all of CRUD in place — every route had exactly one job, because the shape of the data was already settled.

---

| Link | Description |
|------|-------------|
| [GitHub: FastAPI-issue_tracker-](https://github.com/Mzaq1559/FastAPI-issue_tracker-) | Full CRUD issue tracker API built while learning FastAPI |
