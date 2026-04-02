# 📝 My Learning Diary

> A serverless, Git-backed blog CMS — write in Markdown, publish to GitHub, deploy automatically.

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=for-the-badge&logo=github&logoColor=white)](https://pages.github.com/)

**[🚀 Live Demo](https://Mzaq1559.github.io/My-Learning-Diary)** · **[📂 Build Code](https://github.com/Mzaq1559/My-Learning-Diary)**

---

## Overview

My Learning Diary is a personal blog platform with a built-in CMS — no backend, no database. Content lives as Markdown files directly in the GitHub repository. The admin panel lets you write, preview, and publish posts from the browser, with each commit triggering an automatic rebuild and deploy via GitHub Actions.

![Live Blog Homepage](images/hero-full-site.png)

---

## Features

### For Readers
- **Glassmorphic UI** — "Ivy-Neko" aesthetic with soft gradients and teal accents
- **Project Timeline** — chronological learning journey with read-status badges
- **Fully Responsive** — optimized across desktop, tablet, and mobile

![Mobile Responsive Views](images/mobile-responsive.png)
![Published Post](images/published-post-example.png)

### For Authors
- **No Database** — content is stored as Markdown files in the repo itself
- **Tabbed Editor** — write Markdown with a live GitHub-style preview side by side
- **Hierarchical Asset Management** — VS Code-inspired file tree with recursive folder support, inline renaming, and instant file previews (Eye icon)
- **One-Click Publish** — commits directly to GitHub via Octokit; CI handles the rest

![Admin Dashboard](images/admin-dashboard.png)
![Tabbed Markdown Editor](images/editor-tabs.png)
![Hierarchical File Tree](images/hierarchical-file-tree.png)
![Asset Preview Modal](images/asset-preview-modal.png)

---

## Architecture

The app runs entirely in the browser. There is no server — GitHub is both the database and the deployment pipeline.

```mermaid
graph TD
    Reader((Reader))   -->|Views site|     Pages[GitHub Pages]
    Author((Author))   -->|Manages posts|  App[Vite + React CMS]
    App                -->|Octokit REST|   Repo[(GitHub Repository)]
    Repo               -->|Markdown files| Content[src/content/posts]
    Repo               -->|GitHub Actions| Pages
```

![Architecture Diagram](images/architecture-diagram.png)

---

## Project Structure

```
.
└── src/
    ├── app/             # App shell and routing
    ├── components/      # Shared UI — Editor, FileManager, Renderer
    ├── content/
    │   ├── posts/
    │   │   └── [slug]/
    │   │       ├── README.md     # Post content (Markdown + frontmatter)
    │   │       └── images/       # Post-specific assets
    │   └── images/               # Global/shared assets
    ├── pages/           # Dashboard, Home, Wiki
    ├── services/        # GitHub API client, Auth service
    └── styles/          # Global styles, Tailwind config
```

Each post is a self-contained folder — move or delete the folder and the post goes with it.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A GitHub account with a Personal Access Token (repo scope)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/Mzaq1559/Blog_Website-My-Learning-Diary-.git
cd Blog_Website-My-Learning-Diary-/Blog

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
VITE_GITHUB_TOKEN=ghp_your_token_here
VITE_GITHUB_REPO_OWNER=your_username
VITE_GITHUB_REPO_NAME=Blog_Website-My-Learning-Diary-
```

```bash
# 4. Start the dev server
npm run dev
```

![Terminal Quick Start](images/quick-start-terminal.png)

---

## Writing a Post

1. **Create** — click "New Post" in the Dashboard and fill in the title, slug, and metadata
2. **Add Images** — drag and drop assets into the Content tab; they're saved to the post's `images/` folder
3. **Write** — use the tabbed Markdown editor with live preview
4. **Publish** — click Save; the commit triggers an automatic site rebuild

### Post Format

Posts use YAML frontmatter followed by standard Markdown:

```markdown
---
title: My New Post
slug: my-new-post
date: 2026-03-29
tags: [react, typescript]
category: Guides
cover: ./images/cover.jpg
---

# Hello World

Your content here.

![An image](./images/photo.png)
```

---

## Deployment

The repo is pre-configured for GitHub Pages via GitHub Actions. Push to `main` and the site builds and deploys automatically. No additional configuration needed beyond the initial Pages setup in your repo settings.

---

*Built with TypeScript and too much coffee by [Muhammad Zulqarnain](https://github.com/Mzaq1559).*
