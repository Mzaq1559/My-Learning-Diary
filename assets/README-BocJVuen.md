---
title: "Building a Reusable Multi-Agent Hackathon Boilerplate"
slug: building-a-reusable-multi-agent-hackathon-boilerplate
date: 2026-11-02
tags:
  [
    AI Coding Agents,
    Multi-Agent Systems,
    GitHub,
    GitHub Actions,
    Agent Skills,
    Gemini CLI,
    GitHub Copilot,
    Cursor,
    Antigravity,
    Developer Tools,
    Project Log,
  ]
category: Project Log
excerpt: "I started with an open-source GitHub Issue board and turned it into a reusable, multi-client hackathon boilerplate, with shared agent instructions, specialist skills, curated component resources, and review-based upstream synchronization."
cover: ./images/cover.png
---

# Building a Reusable Multi-Agent Hackathon Boilerplate

I have been experimenting with AI coding agents for a while, but I kept running into the same problem: every new project meant setting up the instructions, skills, agent roles, and development workflow again.

For a hackathon, that setup time matters. I want to spend more time understanding the problem and building a working product, not recreating the same agent configuration every time.

So I decided to build a repository that I could use as a starting point for future hackathon projects.

The idea was simple:

**Create one reusable project template that works with the coding agents I actually use, gives them a shared set of engineering rules, provides useful skills and specialist roles, and can keep selected upstream resources updated without blindly overwriting my own work.**

The repository is:

[github.com/Mzaq1559/agent-board-test](https://github.com/Mzaq1559/agent-board-test)

This post follows the process from the initial clone to the first real test of the upstream synchronization scripts.

---

## 1. Starting With an Existing Agent Communication Project

I didn't want to build every part from scratch. I first looked for an existing project that already solved one of the problems I cared about: communication between coding agents.

I found [azizu06/hackathon-agent-board](https://github.com/azizu06/hackathon-agent-board).

The project uses a pinned GitHub Issue as a shared message board. Agents can post messages, check unread messages, and read recent communication through a small command-line helper.

That was an interesting starting point because it uses something teams already have: GitHub Issues. It doesn't require a separate messaging server just to leave a note for another agent.

I cloned the upstream repository into a temporary directory and copied the relevant project configuration into my own working repository.

![Cloning the original hackathon agent board and copying its files](./images/1.png)

I also opened the original repository in the browser to understand how the board was intended to work before adapting it.

![The original hackathon-agent-board repository and its documentation](./images/2.png)

I wanted to reuse the useful communication mechanism, not blindly turn my repository into a copy of someone else's project. The goal was to build a broader starter template around it.

---

## 2. Inspecting What I Had Actually Copied

After copying the files, I inspected the directory structure instead of immediately asking an agent to start changing things.

I used:

```bash
find . -maxdepth 4 -type f | sort
```

The initial structure included files and directories such as:

- `.claude/hooks/` for the original Claude-specific hooks.
- `AGENTS.md` for shared agent instructions.
- `.github/ISSUE_TEMPLATE/` for the message-board issue template.
- `tools/board` for interacting with the GitHub Issue board.
- `.gitignore` and the repository documentation.

![Inspecting the copied repository structure in the terminal](./images/3.png)

This inspection also made one thing clear: the original project had Claude-specific pieces. I didn't want the new boilerplate to depend on Claude Code, because the tools I planned to use were GitHub Copilot, Gemini CLI, Antigravity CLI, and Cursor CLI.

I kept the useful shared idea and treated the original Claude-specific integration as optional legacy material rather than a requirement for the new setup.

---

## 3. Changing the Goal: One Shared Engineering Contract

At this point, I had to decide what this repository was actually supposed to become.

I didn't want four separate sets of instructions that slowly drifted apart. If I told one agent to use a particular API contract or testing convention, another agent working in the same repository should follow the same engineering rules.

That led to the decision to make `AGENTS.md` the canonical project-wide instruction file.

The host-specific files would point back to it:

- `GEMINI.md` for Gemini CLI.
- `.cursor/rules/00-project.mdc` for Cursor.
- `.github/copilot-instructions.md` for GitHub Copilot.
- `.github/agents/` for specialist Copilot agent profiles.

The important distinction is that the shared engineering rules live in one place, while each client gets the configuration it needs to discover or use those rules.

![Planning the move from a Claude-specific setup to a shared multi-client boilerplate](./images/4.png)

I also wanted to avoid claiming that every client discovers every file automatically. Agent configuration and skill discovery vary between tools and versions. The repository therefore tells agents to explicitly read the shared instructions and relevant skills when automatic discovery isn't available.

---

## 4. Turning the Repository Into a GitHub Template

Once the basic structure was in place, I pushed it to my GitHub repository:

[github.com/Mzaq1559/agent-board-test](https://github.com/Mzaq1559/agent-board-test)

I also enabled GitHub's **Template repository** setting.

![The agent-board-test repository configured as a GitHub Template repository](./images/6.png)

This is an important part of the idea. I don't want to clone the boilerplate and manually remove old project code every time. I want to create a fresh repository from the template and then customize it for the next hackathon.

The template is intended to provide the development workflow and agent configuration, not a fixed application architecture. The actual frontend, backend, database, and deployment choices should depend on the hackathon project.

The GitHub repository view shows the main structure that started taking shape:

- `.agents/skills/` for reusable skill instructions.
- `.cursor/rules/` for Cursor-specific rules.
- `GEMINI.md` for Gemini CLI.
- `.github/agents/` for specialist agent profiles.
- `config/` and `scripts/` for upstream tracking and synchronization.
- `tools/board` for optional agent communication.

![The repository structure on GitHub](./images/5.png)

---

## 5. Giving Agents Reusable Skills and Specialist Roles

Shared instructions are useful, but they aren't enough on their own.

I also wanted the repository to include practical playbooks for recurring engineering tasks. These are stored as Agent Skills, with each skill having a `SKILL.md` file.

The initial project included skills for areas such as:

- API contracts.
- Implementation planning.
- Documentation writing.
- Frontend quality.
- Hackathon MVP planning.
- Demo preparation.
- Parallel-agent coordination.
- Quality gates.
- Security review.

I also added four Copilot specialist profiles:

- Hackathon Planner.
- Frontend Engineer.
- Test Engineer.
- Code Reviewer.

I think the distinction is worth keeping clear:

**A skill describes how to perform a type of work. An agent profile describes the role responsible for doing that work.**

For example, a Frontend Engineer can use the frontend-quality skill, while the planner can use implementation planning and API contract guidance.

I didn't want to fill the repository with dozens of agents just to make it look impressive. A small set of useful roles with clear responsibilities is more practical than a large collection of overlapping profiles.

The upstream skills from [GitHub's awesome-copilot repository](https://github.com/github/awesome-copilot) are selectively included, with their source and license tracked in the repository. The rest of the baseline skills are maintained as part of this boilerplate.

---

## 6. Making Upstream Updates Safe

This became one of the more important parts of the project.

Agent tooling changes quickly. New skills appear, existing instructions get updated, and CLI projects add new integrations. I wanted to benefit from those improvements without manually checking every repository all the time.

But there is a problem with automatically copying upstream content: an upstream update can overwrite local changes, introduce incompatible instructions, or bring in code that hasn't been reviewed.

I decided to use a small allowlist-based synchronization approach instead.

The repository has three important configuration files:

- `config/upstream-sources.json` — the repositories being monitored.
- `config/upstream-lock.json` — the commit currently recorded for each upstream.
- `config/upstream-files.json` — the specific files that are allowed to be synchronized.

The monitored ecosystem includes projects such as:

- [azizu06/hackathon-agent-board](https://github.com/azizu06/hackathon-agent-board)
- [github/awesome-copilot](https://github.com/github/awesome-copilot)
- [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)
- [obra/superpowers](https://github.com/obra/superpowers)
- [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)
- [Piebald-AI/awesome-gemini-cli](https://github.com/Piebald-AI/awesome-gemini-cli)

Not every monitored repository is automatically copied into my project. Some are tracked as discovery sources, while only explicitly allowlisted files are synchronized.

The workflow is handled by two scripts:

```bash
python3 scripts/check-upstreams.py
python3 scripts/sync-upstream-files.py
```

The first script checks the latest commit on each upstream's default branch and updates the lockfile when it detects a new revision.

The second script downloads only the files listed in the allowlist, using the pinned commit. It doesn't clone and execute arbitrary upstream scripts or copy entire repositories into my boilerplate.

The GitHub Actions workflow is designed to run this process on a schedule or through manual dispatch. When tracked content changes, it can prepare a pull request for review. The intention is to keep updates visible and reviewable rather than silently modifying the template.

---

## 7. Testing the Upstream Scripts Without Touching My Main Working Tree

I didn't want to test the scripts directly in my main checkout and risk leaving generated changes mixed with my ongoing work.

Before that isolated test, I also checked the state of my main checkout and synchronized it with the remote using a fast-forward-only pull. I kept my existing backup stash untouched rather than applying it blindly.

![Checking the stash and fast-forward synchronization of the main working tree](./images/7.png)

So I used a temporary detached Git worktree.

The commands were:

```bash
cd ~/Project1/agent-board-test

git worktree add --detach /tmp/agent-board-upstream-test HEAD

cd /tmp/agent-board-upstream-test

python3 scripts/check-upstreams.py
python3 scripts/sync-upstream-files.py

git status --short

cd ~/Project1/agent-board-test
git worktree remove --force /tmp/agent-board-upstream-test
```

A detached worktree gave me a separate checkout at the current commit. That meant I could run the update scripts and inspect their changes without mixing the test with my main working directory.

![Running the upstream detection and allowlisted synchronization scripts in a temporary worktree](./images/8.png)

The output was useful because it showed both cases I wanted to test.

Most of the upstream repositories were unchanged. But the checker detected a new commit for:

`Piebald-AI/awesome-gemini-cli`

It reported:

```text
UPSTREAM UPDATE: Piebald-AI/awesome-gemini-cli be7776e772d0 -> da609cdefe0c
Updated upstream lockfile.
```

That confirmed that the checker could detect a changed upstream revision and update the lockfile.

The synchronization script then checked the three currently allowlisted files:

```text
UNCHANGED: .agents/skills/documentation-writer/SKILL.md
UNCHANGED: .agents/skills/create-implementation-plan/SKILL.md
UNCHANGED: third_party/github-awesome-copilot/LICENSE

Upstream file sync complete; 0 file(s) changed.
```

This was expected. The monitored Gemini CLI collection had a new commit, but none of the three allowlisted Awesome Copilot files had changed.

The temporary worktree showed one modified file:

```text
M config/upstream-lock.json
```

After removing the worktree, I checked my main repository again:

```bash
git status --short
git stash list
git log -1 --oneline
```

The main working tree was clean, and my earlier backup stash was still present.

That was the result I wanted: the test detected an upstream update, recorded it in the isolated checkout, and left my main working tree untouched.

This test verifies the scripts' detection and allowlist behavior. It does **not** by itself prove that the scheduled GitHub Actions workflow can successfully create a pull request. That still needs to be tested on GitHub with the required Actions permissions enabled.

---

## 8. Adding a Component and Backend Resource Catalog

While shaping the boilerplate, I realized that agent instructions should do more than tell agents how to write code. They should also encourage agents to look for existing solutions before rebuilding common functionality.

For hackathons, this can save a lot of time.

Why write every animation, form, table, authentication flow, storage integration, or API service from scratch if there are maintained components and services that already solve the problem?

I added a curated resource catalog covering both frontend and backend options.

For frontend work, it includes resources such as:

- [shadcn/ui](https://ui.shadcn.com/) for customizable React components.
- [React Bits](https://reactbits.dev/) for animated and interactive components.
- [Magic UI](https://magicui.design/) and [Aceternity UI](https://ui.aceternity.com/) for visual sections and effects.
- [21st.dev](https://21st.dev/) for discovering community-built components.
- [Mantine](https://mantine.dev/) and [HeroUI](https://www.heroui.com/) for broader component systems.

For backend work, it covers options such as:

- [Supabase](https://supabase.com/) for PostgreSQL, authentication, storage, and realtime features.
- [Convex](https://convex.dev/) for TypeScript-first reactive applications.
- [Appwrite](https://appwrite.io/) and [Firebase](https://firebase.google.com/) for integrated backend capabilities.
- [FastAPI](https://fastapi.tiangolo.com/) for Python APIs and AI/ML services.
- [Hono](https://hono.dev/), [Express](https://expressjs.com/), and [NestJS](https://nestjs.com/) for TypeScript and Node.js backends.

I also added a dedicated `component-and-service-discovery` skill and connected it to the shared instructions, frontend quality guidance, and hackathon planner.

The workflow I want agents to follow is:

```text
Inspect the existing project
          |
          v
Identify the missing capability
          |
          v
Search reusable components/services
          |
          v
Check docs, compatibility and license
          |
          v
Evaluate security and pricing
          |
          v
Integrate only what is needed
          |
          v
Test the actual user flow
```

I don't want agents to install every popular library they find. The catalog is a discovery guide, not a shopping list. For example, a React project shouldn't automatically combine four different component systems.

Community discussions on Reddit and DEV are useful for discovering tools and understanding developer experiences, but I still want agents to verify technical details against official documentation.

---

## 9. The Architecture Behind the Boilerplate

The overall structure is now easier to understand when viewed as a few connected layers.

![Architecture diagram showing coding agent clients, shared instructions, skills, GitHub board, and upstream synchronization](./images/9.png)

At the top are the coding clients I use:

- GitHub Copilot.
- Gemini CLI.
- Antigravity CLI.
- Cursor CLI.

They share the same project-level engineering contract through `AGENTS.md`, with host-specific configuration files helping each tool use it.

The skills directory provides reusable playbooks. Specialist agent profiles define focused roles. The optional GitHub Issue board provides a place for agents to leave messages and coordinate.

Separately, the upstream update workflow monitors selected repositories, checks pinned commits, synchronizes only allowlisted files, and prepares reviewable updates.

The development cycle I want to encourage is:

```text
             Plan
              |
              v
             Build
              |
              v
             Test
              |
              v
            Review
              |
              v
             Demo
```

One important clarification: the GitHub Issue board is a communication mechanism, not a complete multi-agent orchestrator. It doesn't automatically schedule agents, resolve file conflicts, or guarantee that one agent will immediately receive another agent's message. I still need to launch and supervise the coding clients and define clear ownership when work is parallelized.

The repository is a starter kit for a disciplined workflow, not a system that magically makes agents collaborate correctly.

---

## 10. What I Have Now — and What Still Needs Testing

The boilerplate now has:

- Shared project-wide engineering instructions.
- Configuration for Copilot, Gemini CLI, Antigravity CLI, and Cursor CLI.
- Four specialist Copilot agent profiles.
- Reusable skills for planning, APIs, frontend quality, security, testing, documentation, parallel work, and demo preparation.
- A component and service discovery skill.
- A curated catalog of frontend components, backend services, AI tools, testing tools, and deployment platforms.
- An optional GitHub Issue-based communication board.
- Upstream repository tracking with commit pins and explicit file allowlists.
- GitHub Actions workflows for validation and upstream update pull requests.
- A README and architecture documentation.

The local checks I ran included Python syntax compilation, shell syntax checks, JSON parsing, and the isolated upstream script test. The upstream checker successfully detected a new commit, and the allowlisted sync completed without changing any files.

There are still things I want to verify before treating this as a finished template:

1. Run the GitHub Actions workflows on GitHub and confirm the update workflow can open a pull request.
2. Test the setup process from a fresh repository created using the template.
3. Check how each of my four coding clients discovers and follows the shared instructions and skills.
4. Test the message board with multiple agents using the same GitHub account and separate agent identities.
5. Keep reviewing the upstream resources instead of automatically importing every new skill or agent.

I would rather verify these pieces one by one than claim that the entire workflow is production-ready just because the files are present.

---

# Final Thoughts

This started with me looking for a way to let coding agents communicate through GitHub Issues. It gradually turned into a bigger project: a reusable engineering environment for hackathons.

The part I care about most is not the number of agent profiles or the number of tools listed in the README. It's having a repeatable starting point.

For the next hackathon, I want to create a repository from this template, give the agents the project requirements, let them inspect the codebase, plan the MVP, reuse suitable components and services, and then work through implementation and testing with clear responsibilities.

I also want to keep control of what gets added. Upstream skills and templates should be reviewed, external services should be chosen for a reason, and generated code should still be tested.

The goal isn't to make agents do everything without supervision.

**The goal is to build a workflow where I can use multiple coding agents productively without losing control of the engineering decisions.**

There is still work left to do, but I now have a proper foundation to build on.
