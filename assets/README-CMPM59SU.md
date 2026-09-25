---
title: Deploying SiteFlowAI to Azure
slug: deploying-siteflowai-to-azure
date: 2026-09-12
tags: [docker, azure, github-actions, fastapi, react, ci-cd, project-log]
category: Project Log
excerpt: "Containerizing a teammate's construction-management app and getting it onto Azure App Service — a hardcoded ACR name and a SQLite database that kept forgetting its own demo users."
cover: ./images/cover.png
---

SiteFlowAI is a construction-project-control platform a teammate (Sidra Pervaiz) has been building — check requests, Interim Payment Certificates, that kind of thing — with a FastAPI backend and a React/Vite frontend. My part was getting it running as a container on Azure. This is what that actually involved, based on the repo's commit history and docs from September 12–13, 2026.

## Packaging it as one container

The app is a Python backend that also serves the built frontend, so the Dockerfile is a two-stage build: build the React app first, then copy the compiled output into the Python image that serves it.

```dockerfile
# --- Stage 1: build the React frontend ---
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Python backend that also serves the built frontend ---
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY --from=frontend-build /app/frontend/dist frontend/dist

RUN mkdir -p backend/storage/uploads backend/storage/documents

ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

One image, one process serving both the API and the compiled frontend — no separate static hosting to wire up.

## The deployment pipeline

The target was Azure App Service, pulling the image from Azure Container Registry. I set up a GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs on every push to `main`:

1. Check out the code
2. Log in to ACR
3. Build the Docker image, tag it `latest` and with the commit SHA, push both tags
4. Log in to Azure with a service principal
5. Restart the App Service (`siteflow`, resource group `siteflow-rg`) so it pulls the new image
6. Wait 60 seconds, then `curl` the deployed URL and fail the job if it isn't a 200

That last step matters — without it, a broken image would deploy "successfully" and just silently 500 in production.

## What actually broke

**The ACR login server wasn't resolving as a secret.** The workflow originally referenced `${{ secrets.ACR_LOGIN_SERVER }}` in both the login step and the build/push commands. I ended up hardcoding it to `siteflow.azurecr.io` instead:

```diff
- login-server: ${{ secrets.ACR_LOGIN_SERVER }}
+ login-server: siteflow.azurecr.io
...
- docker build -t ${{ secrets.ACR_LOGIN_SERVER }}/siteflow:latest ...
+ docker build -t siteflow.azurecr.io/siteflow:latest ...
```

I don't have a record of exactly why the secret reference wasn't working — whether it was unset, misnamed, or something else — just that hardcoding it is what fixed the workflow. Given it's a fixed, non-sensitive value (the registry name isn't a secret the way a password is), hardcoding it was a reasonable trade rather than a workaround I'd want to undo later.

**Demo logins broke every time the container restarted.** This was the more interesting bug. Azure App Service containers use ephemeral storage by default — anything written to disk, including a SQLite database file, disappears the moment the container restarts. Since SiteFlowAI's demo data (and presumably any real data, until a managed database is added) lived in a SQLite file inside the container, every restart wiped the users table and broke login.

The fix, from commit `fdd4f20`: auto-seed the database on startup if it's empty.

```python
# Idempotently seed database on startup
try:
    db = SessionLocal()
    if not db.query(User).first():
        logger.info("No users found in database. Running automatic seed script...")
        seed_database(reset=False)
        logger.info("Automatic seed script completed.")
    else:
        logger.info("Database already seeded. Skipping auto-seed.")
except Exception as e:
    logger.error(f"Error during automatic database seeding: {e}")
finally:
    db.close()
```

This is a patch over the real underlying issue — a container with ephemeral storage isn't a place a real database should live long-term — rather than a permanent fix. It keeps the app usable for a demo, not production-ready for actual persistent data.

## Timeline

Going by the commit history, the whole deploy setup happened in a tight window:

- **Sept 12, 12:59** — Dockerfile added, `main.py` adjusted to work inside it
- **Sept 12, 16:11** — deployment workflow and docs added
- **Sept 12, 16:29** — ACR login server hardcoded after the secret reference didn't work
- **Sept 12, 16:57** — auto-seed fix for the ephemeral-storage login bug
- **Sept 12, 18:57–19:05** — README and docs rewritten to match the actual codebase, workflow diagram redrawn
- **Sept 13, 05:33–05:48** — documentation consolidated into a `docs/` directory

## What I learned

Azure App Service's default ephemeral storage is easy to overlook if you're used to VMs or containers with persistent volumes — it doesn't fail loudly, it just quietly loses data on every restart, which shows up as a confusing intermittent bug (login works, then suddenly doesn't, then works again after a redeploy) rather than an obvious crash. The auto-seed fix solves the symptom for demo purposes; a real fix would mean giving the container a persistent volume or, more likely, moving off SQLite to a managed database service.

---

| Link | Description |
|------|-------------|
| [GitHub: SiteFlowAI](https://github.com/SidraPervaiz1122/SiteFlowAI) | Full backend, frontend, Docker and deployment setup |
