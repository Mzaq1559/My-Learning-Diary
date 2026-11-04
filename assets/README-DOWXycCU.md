---
title: "Testing a Multi-Agent Coding Workflow With Copilot, Cursor, and Antigravity"
slug: testing-a-multi-agent-coding-workflow
date: 2026-11-04
tags:
  [
    AI Coding Agents,
    Multi-Agent Systems,
    GitHub Copilot CLI,
    Cursor,
    Antigravity CLI,
    Gemini CLI,
    Agent Skills,
    GitHub Issues,
    GitHub Actions,
    React,
    Express,
    Project Log,
  ]
category: Project Log
excerpt: "I tested whether GitHub Copilot CLI, Cursor Agent, and Antigravity CLI could collaborate on one small application using separate roles, shared project instructions, and a GitHub Issue as their communication board."
---

# Testing a Multi-Agent Coding Workflow With Copilot, Cursor, and Antigravity

I have been building a reusable multi-agent project template, but I wanted to test the idea in a real development task instead of stopping at configuration files and documentation.

The question I wanted to explore was straightforward:

**Can multiple AI coding agents work on the same small application when each agent has a clear responsibility and a shared place to coordinate?**

For this experiment, I used three coding agents:

- **GitHub Copilot CLI — Project Coordinator**
- **Cursor Agent — Frontend Developer**
- **Antigravity CLI — Backend Developer**

The test application was a Mini Project Dashboard. The frontend and backend were intentionally kept small so I could focus on the collaboration workflow: setting up the agents, checking their access, establishing communication, assigning work, and reviewing the integration.

Repository: [Mzaq1559/agent-board-test](https://github.com/Mzaq1559/agent-board-test)

---

## 1. Preparing the Agent Development Environment

Before launching the agents, I spent some time reviewing the tools and projects that make up the current agent-development ecosystem.

I looked at Google's official [Gemini CLI](https://github.com/google-gemini/gemini-cli) repository and [awesome-gemini-cli](https://github.com/Piebald-AI/awesome-gemini-cli), a community-curated directory of Gemini CLI extensions and resources.

![Image 3 — awesome-gemini-cli repository](./images/3.png)

![Image 4 — official Gemini CLI repository](./images/4.png)

I also reviewed a few broader resources for agentic development and reusable skills:

- [obra/superpowers](https://github.com/obra/superpowers), a skills framework and development methodology for structured agent workflows.
- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills), a large index of reusable skills for AI coding agents.
- [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills), Vercel's collection of agent skills.
- [github/awesome-copilot](https://github.com/github/awesome-copilot), a collection of community-contributed instructions, agents, and skills for GitHub Copilot.

![Image 5 — obra/superpowers repository](./images/5.png)

![Image 6 — awesome-agent-skills repository](./images/6.png)

![Image 7 — Vercel agent-skills repository](./images/7.png)

![Image 8 — GitHub awesome-copilot repository](./images/8.png)

I was not trying to install everything I found. The purpose was to understand the available approaches and reuse ideas that could make the workflow more consistent.

I then checked where the command-line tools were installed on my machine. This helped confirm that the expected executables were available in the shell environment.

![Image 9 — Local executable paths for copilot, gemini, agent, and agy](./images/9.png)

---

## 2. Checking the GitHub Actions Validation Workflow

The repository also has a GitHub Actions workflow named `validate-template.yml`. I wanted the project template to be checked automatically rather than relying only on a manual review.

The workflow validates repository configuration and scripts. Its steps include:

1. Checking out the repository.
2. Setting up Python.
3. Validating JSON manifests.
4. Compiling or syntax-checking the relevant scripts.
5. Checking shell-script syntax.

The first screenshot shows a successful workflow run triggered by a push. It completed in approximately 14 seconds.

![Image 1 — Successful GitHub Actions validation workflow summary](./images/1.png)

The next screenshot shows the individual job steps and their execution results.

![Image 2 — Detailed GitHub Actions validation job steps](./images/2.png)

The run completed successfully, although GitHub displayed deprecation and migration warnings related to Node.js versions and future Ubuntu runner changes. These warnings did not fail the workflow, but they are worth revisiting before the affected runtime versions are retired.

I also captured another successful validation run while working through the setup.

![Additional validation workflow run](./images/1_2.jpg)

---

## 3. Starting Each Coding Agent and Verifying Access

With the tools installed, I moved on to the most important part of the experiment: checking whether each agent could access the repository and understand the shared project setup.

I did not want to assume that an agent was ready just because its CLI launched successfully. Each client needed to inspect the working directory, read the project instructions, and verify the communication setup.

### Antigravity CLI

I launched Antigravity CLI and checked its startup configuration. In this session, it was running version 1.4.12 with Claude Sonnet 4.6 (Thinking), using the available starter quota.

![Image 10 — Antigravity CLI startup and model configuration](./images/10.png)

### GitHub Copilot CLI

I launched GitHub Copilot CLI and gave it an access-verification task. It inspected the repository, checked the Git working tree, looked for the communication-board instructions, and checked its available GitHub connection.

![Image 11 — GitHub Copilot CLI access verification](./images/11.png)

### Cursor Agent

Cursor Agent completed browser authentication and then presented a workspace-trust prompt. This is an important step because the agent needs permission to read files and execute commands in the selected project directory.

![Image 12 — Cursor Agent workspace trust prompt](./images/12.png)

### Gemini CLI

I also launched Gemini CLI and checked its authentication and startup state. The session was running version 0.66.0 and authenticated using an API key.

![Image 13 — Gemini CLI startup and authentication](./images/13.png)

Gemini CLI was part of the wider environment review, while the actual application-building roles in this experiment were assigned to Copilot, Cursor, and Antigravity.

---

## 4. Verifying Repository Access and the Shared Setup

After startup, I asked the agents to report what they could access instead of immediately assigning implementation work.

Cursor produced a structured verification report covering repository access, whether it could read `AGENTS.md`, and the status of the communication board. At that point, the `BOARD_ISSUE` and `BOARD_AGENT` environment variables were not configured in its session.

![Image 14 — Cursor Agent repository and communication-board verification report](./images/14.png)

Copilot's terminal log showed the commands it used to inspect the Git working tree, search for the board specification, read the README, and verify its GitHub authentication scopes.

![Image 15 — GitHub Copilot CLI verification log](./images/15.png)

Antigravity also produced a verification summary. It confirmed the GitHub CLI authentication and keyring integration, while identifying the same missing board environment configuration.

![Image 16 — Antigravity verification dashboard](./images/16.png)

This was useful because it exposed a setup issue before development began. The agents could inspect the repository, but the shared communication-board configuration still needed to be supplied to their sessions.

---

## 5. Creating a Shared GitHub Issue as the Communication Board

I wanted the agents to have a common place to leave updates without introducing another messaging service.

For this experiment, I used a GitHub Issue as a lightweight message board.

The setup script was:

```bash
bash scripts/setup-board.sh
```

The script creates the shared issue, pins it in the repository, and prints the configuration needed by each agent, including the issue number.

![Image 22 — Running the shared GitHub message-board setup script](./images/22.png)

The board was created as GitHub Issue #2.

Instead of relying on separate terminal sessions to keep track of everything, each agent could post a message with its identity and current status. The other agents could then inspect the same thread.

The following screenshots show the issue being used as a shared communication channel by Cursor CLI, Copilot CLI, and Antigravity CLI.

![Image 17 — Shared GitHub Message Board Issue #2](./images/17.png)

![Image 18 — Agent messages posted to the shared GitHub Issue](./images/18.png)

This approach is deliberately simple. GitHub Issues are already part of the development workflow, so they provide a convenient place to record handoffs, progress updates, and integration notes.

The board does not automatically schedule agents or resolve code conflicts. It gives them a shared communication channel; I still need to launch the agents, define ownership, and supervise the work.

---

## 6. Assigning Separate Responsibilities

Once the repository access and communication setup were ready, I assigned a specific role to each agent.

I wanted to avoid having all three agents independently modify the same parts of the project.

### Antigravity CLI — Backend Developer

Antigravity was responsible for the backend. Its task was to create a small Express REST API, implement an in-memory task store, and provide the endpoints required by the dashboard.

The requested operations included:

- `GET` to retrieve tasks.
- `POST` to create a task.
- `PATCH` to update a task.

![Image 19 — Antigravity CLI assigned the Backend Developer role](./images/19.png)

### GitHub Copilot CLI — Project Coordinator

Copilot was assigned the coordinator role. Its responsibility was to oversee the implementation plan, keep track of progress through the shared issue, and review the work delivered by the other agents.

![Image 20 — GitHub Copilot CLI assigned the Project Coordinator role](./images/20.png)

### Cursor Agent — Frontend Developer

Cursor was responsible for the frontend. I asked it to build a responsive Vite and React interface with summary cards, task filters, and interactive forms.

![Image 21 — Cursor Agent assigned the Frontend Developer role](./images/21.png)

The separation was intentional:

| Agent | Responsibility | Main deliverable |
| --- | --- | --- |
| Antigravity CLI | Backend Developer | Express API and task data store |
| Cursor Agent | Frontend Developer | React dashboard and UI |
| GitHub Copilot CLI | Project Coordinator | Planning, progress tracking, and integration review |

The agents had different areas of ownership, but they still needed to agree on the API contract. That was one of the reasons I wanted the coordinator to review the integration rather than treating each implementation as an isolated result.

---

## 7. Building the Backend and Frontend

After assigning the roles, I let the agents work on their respective parts.

### Backend implementation

Antigravity created the Express backend, configured CORS, and implemented the in-memory task store and REST endpoints.

It also ran the backend tests. The test output showed that the task-related tests passed, and the development server was configured to run on port `3001`.

![Image 23 — Antigravity backend implementation and passing tests](./images/23.png)

### Frontend implementation

Cursor worked on the Vite and React dashboard. Its verification report covered the production build, component tests, linting, and readiness to connect to the backend API.

![Image 24 — Cursor frontend build, tests, and lint verification](./images/24.png)

At this stage, both sides had their own implementation and verification results. That was a useful milestone, but I did not want to treat two individually successful builds as proof that the complete application was integrated correctly.

---

## 8. Reviewing the Integration

This is where the coordinator role became important.

Copilot inspected the files delivered by the frontend and backend agents, reviewed the API contract, and ran the project-level checks.

![Image 25 — Copilot reviewing the frontend, backend, API contract, and tests](./images/25.png)

I wanted this review step because parallel development can create integration problems even when each agent reports success independently.

For example:

- The frontend may expect a different response shape from the backend.
- The API route or HTTP method may not match.
- The frontend may use a different port or endpoint.
- The task fields may have inconsistent names.
- Tests may pass in one part of the project while the combined application still has problems.

A separate review pass helps catch these issues before considering the work complete.

The shared GitHub Issue also provided a record of the agents' final updates and contract acknowledgements.

![Image 26 — Final coordination updates on GitHub Message Board Issue #2](./images/26.png)

The final board updates showed that the frontend and backend agents had completed their work and that the coordinator had the information needed for integration review.

---

## 9. What This Experiment Demonstrated

This was a small application, but it let me test several parts of a multi-agent workflow in one place.

### What worked

- I could launch multiple coding-agent CLIs in the same project environment.
- Each agent could be assigned a focused responsibility.
- Repository access and project-instruction checks could be performed before implementation.
- A GitHub Issue could serve as a shared communication board.
- The frontend and backend could be developed in parallel with separate ownership.
- The coordinator could inspect the delivered work and review the integration.
- GitHub Actions could validate the reusable template automatically.

### What still needs attention

This experiment does not mean that multi-agent development is automatically reliable.

There are still practical concerns:

1. **Shared context:** Each agent needs the right project instructions and enough context to understand the work.
2. **Environment configuration:** Board identifiers and agent identity variables must be configured consistently in each session.
3. **API contracts:** Agents need to agree on request and response formats before implementing against them.
4. **File ownership:** Parallel agents should avoid editing the same files unless the work is deliberately coordinated.
5. **Integration testing:** Individual build and test results are not a substitute for testing the combined application.
6. **Human supervision:** I still need to inspect the changes, review decisions, and decide whether the result is correct.

The GitHub Issue board is a coordination aid, not a full orchestration engine. It does not remove the need for clear task boundaries, integration checks, or human review.

---

## Final Thoughts

This experiment helped me move one step beyond using AI coding tools individually.

Instead of asking one agent to handle every part of a project, I gave different agents specific responsibilities and used a shared GitHub Issue to keep their work visible.

The most useful part was not simply that three agents could generate code. It was being able to establish a process around them:

**Verify access → Configure communication → Assign roles → Build in parallel → Review integration → Test the result.**

I still see this as an experiment rather than a finished autonomous development system. There is plenty more to improve, especially around orchestration, shared context, conflict handling, and end-to-end verification.

But it gave me a practical starting point for exploring how multiple coding agents can work together in a structured development workflow.

**The goal is not to remove the developer from the process. It is to make collaboration between coding agents more organized, observable, and easier to review.**

---

## Project Links

- **Demo repository:** [Mzaq1559/agent-board-test](https://github.com/Mzaq1559/agent-board-test)
- **Reusable boilerplate project log:** [Building a Reusable Multi-Agent Hackathon Boilerplate](https://mzaq1559.github.io/My-Learning-Diary/blog/building-a-reusable-multi-agent-hackathon-boilerplate)
