---
title: Building job-application-mcp — Turning a Job Application Project into a Real MCP System
slug: job-application-mcp
date: 2026-09-24
excerpt: A detailed development log of building job-application-mcp, from MCP and AI-tool integration to OAuth 2.1, Claude Web, GitHub workflows, CI failures, and learning how to debug AI-assisted code properly.
tags:
  [MCP, AI, Automation, Claude, OAuth, GitHub, Python, CI/CD, Developer Tools]
category: Project Log
cover: ./images/cover.png
---

# Building job-application-mcp — Turning a Job Application Project into a Real MCP System

**Project:** [job-application-mcp](https://github.com/Mzaq1559/job-application-mcp)

> _Cover image: Repository screenshot_

This project started from a simple idea: instead of having a collection of separate scripts and utilities around job applications, I wanted to build something that an AI assistant could actually interact with through structured tools.

That led me to **MCP (Model Context Protocol)**.

What started as an interesting experiment quickly became a much larger engineering project involving an MCP server, authentication, Claude Web integration, GitHub workflows, pull requests, CI, linting, debugging, and a lot of trial and error.

I am keeping this post as a development log rather than a polished "I built this perfectly from day one" article, because the failures were just as useful as the working parts.

---

## Why I Started This

I've been working on job-search automation and application-related tooling, and I wanted to move beyond having individual scripts that solve individual problems.

The idea behind job-application-mcp was to build a more structured system where an AI model could interact with job-application functionality through well-defined MCP tools.

Instead of the model needing to understand every implementation detail, the MCP server could expose capabilities through a consistent interface.

Conceptually, the separation looked like this:

```text
AI Assistant
     |
     v
MCP Tools
     |
     v
job-application-mcp
     |
     v
Application Logic / External Services
```

That made the project interesting for two reasons.

First, I wanted practical experience with MCP rather than just reading about it.

Second, I wanted to see what happens when an AI-oriented project is treated like a real software system instead of a quick demo.

---

## MCP Was the Interesting Part

One of the main things I wanted to understand was what MCP actually changes in an application architecture.

The basic idea is straightforward: instead of an AI model having to know how every external system works, an MCP server can expose structured tools that the model can call.

So the model can reason about an operation such as:

> "Find my applications matching these criteria."

while the MCP layer is responsible for actually implementing that operation.

That separation between the **AI layer** and the **tool/application layer** became one of the most interesting parts of the project for me.

I wasn't simply writing functions anymore.

I was designing an interface that another AI system could interact with.

---

## Turning the Repository Into a Real Project

As the project grew, I started looking at the repository as a complete software system rather than just a collection of Python files.

That meant thinking about:

- application architecture
- configuration
- authentication
- MCP tool interfaces
- external integrations
- error handling
- testing
- linting
- CI/CD
- GitHub workflows
- documentation
- maintainability

This immediately made the project more complicated than the original idea.

But that was exactly what I wanted.

I wasn't trying to build another tiny tutorial project where everything works because the tutorial controls every variable.

I wanted to encounter the problems that appear in an actual repository.

---

## Authentication Became a Major Part of the Work

One of the major pieces of recent work was adding **OAuth 2.1 authentication for Claude Web**.

I didn't want to solve authentication by simply putting a token somewhere and calling the problem finished.

The goal was to build a proper authentication flow around the MCP server and make it usable with Claude Web.

That brought several different concerns into the project:

- OAuth configuration
- authorization flow
- callback handling
- token handling
- authentication middleware
- configuration and environment variables
- Claude Web compatibility
- security considerations

This was one of the points where the project stopped feeling like a simple MCP experiment.

Authentication touches the architecture around it.

A seemingly small feature can require changes across configuration, server behavior, dependencies, tests, and deployment.

---

## GitHub Became Part of the Development Loop

Another major change was treating GitHub as part of the development process rather than simply the place where I stored the code.

I started working with:

- branches
- pull requests
- GitHub Actions
- automated linting
- workflow runs
- repository permissions
- CI validation
- commit history

That introduced a completely different feedback loop.

Instead of only asking:

> "Does this run on my machine?"

I also had to ask:

> "Does this repository pass its automated checks in a clean GitHub environment?"

That distinction became important very quickly.

---

## The OAuth 2.1 Pull Request

The OAuth 2.1 work was developed as a focused feature rather than mixing everything into the main branch.

The feature ended up as a pull request:

**feat: add OAuth 2.1 authentication for Claude Web**

That gave me a chance to work through a more realistic feature-development workflow:

```text
feature work
    ↓
branch
    ↓
pull request
    ↓
automated checks
    ↓
inspect failures
    ↓
fix
    ↓
run checks again
    ↓
review the result
    ↓
merge
```

It sounds simple when written down.

Actually going through the cycle is where the useful lessons appeared.

---

## Then CI Started Fighting Back

The most frustrating part of the recent work was a GitHub Actions workflow failing during linting.

The workflow was running:

```text
ruff check .
```

and the job failed.

At first, the obvious reaction was to look at Ruff's output and change whatever line it complained about.

But after multiple iterations, I realized that this wasn't the right way to approach the problem.

I explicitly stopped the process and changed the debugging approach:

> **"Stop blindly editing files, find root cause and fix it."**

That ended up being one of the most important lessons from the entire project.

---

## The Difference Between Fixing an Error and Fixing a Problem

There is a big difference between these two approaches.

### Approach 1

```text
CI fails
↓
change the code
↓
run CI
↓
another failure
↓
change more code
↓
repeat
```

### Approach 2

```text
CI fails
↓
read the complete output
↓
identify the actual failing component
↓
understand why it is failing
↓
form a hypothesis
↓
make the smallest useful change
↓
verify locally
↓
verify in CI
```

The first approach can make progress quickly when the problem is obvious.

The second approach is much more important when the system becomes complicated.

I want to get better at the second one.

---

## Why CI Failures Are Useful

Before working through this project, it was easy to think of CI as a simple pass/fail gate.

Now I think of CI as another environment.

It has its own:

- Python/runtime version
- dependencies
- configuration
- environment variables
- working directory
- tool versions
- repository state

So when something works locally but fails in GitHub Actions, the correct response isn't automatically:

> "GitHub is broken."

The better question is:

> "What is different between the environment where it works and the environment where it fails?"

That is a much more useful debugging question.

---

## Working With AI Coding Agents

There is another interesting layer to this project.

A lot of the development involved AI coding assistants.

That makes development much faster, but it also creates a new problem: **an AI can modify code faster than I can understand whether the modification is actually correct.**

For example, if a CI job fails and I simply tell an AI:

> "Fix this."

it may make several changes across multiple files.

If the first diagnosis was wrong, the repository can become harder to reason about instead of easier.

That creates a loop like:

```text
failure
  ↓
AI changes code
  ↓
new failure
  ↓
AI changes more code
  ↓
more complexity
  ↓
harder debugging
```

This project made me more careful about that.

AI assistance is useful, but it doesn't remove the need to understand the problem.

---

## What I Started Doing Differently

Instead of treating AI as an automatic fix button, I started treating it more like another developer working alongside me.

That means I still need to ask:

- What exactly failed?
- Where did it fail?
- What changed recently?
- Is the failure deterministic?
- Is the problem in application code or tooling?
- Is CI using a different environment?
- What evidence supports the proposed fix?
- Did the fix actually solve the original problem?

That change in mindset is probably more valuable to me than any single code change in this project.

---

## Pull Requests Made the Process More Structured

The project also gave me more practical experience with a workflow that resembles professional software development.

Instead of:

```text
change code → push → hope
```

the process became:

```text
make a focused change
       ↓
create/update a branch
       ↓
open a PR
       ↓
run automated checks
       ↓
inspect failures
       ↓
debug the root cause
       ↓
fix
       ↓
run checks again
       ↓
review the result
       ↓
merge
```

The important part isn't the diagram.

It's experiencing what happens when the checks don't pass.

That's where you learn whether your development process actually works.

---

## Things That Didn't Go Smoothly

I don't want this post to make the project look cleaner than it actually was.

There were several points where things didn't work.

Some changes solved one problem and exposed another.

Some approaches were simply wrong.

Some CI runs failed after I thought the problem had already been fixed.

There were also situations where an AI-generated change looked reasonable but wasn't addressing the real root cause.

Those failures are staying in this post because they are part of the project.

If I only document the final successful state, I lose a large part of what I actually learned.

---

## What I Learned From the Debugging

The biggest lesson so far hasn't actually been MCP.

It has been **debugging discipline**.

When something fails, I want to follow a process like this.

### 1. Reproduce the failure

Don't assume the error is still the same one.

Run it again.

### 2. Read the complete error

Don't only look at the last line of a traceback or the headline of a failed workflow.

The surrounding context often explains the real problem.

### 3. Identify where the failure originates

Is it:

- application code?
- configuration?
- dependency?
- environment?
- authentication?
- permissions?
- CI tooling?

### 4. Form a hypothesis

Before changing several files, decide what you think is actually wrong.

### 5. Make the smallest meaningful change

Change one thing that tests the hypothesis.

### 6. Verify the fix

A local success is not enough if the actual failure happens in CI.

This process sounds basic.

Actually practicing it on a real project is very different from reading about it.

---

## The Project Is Also Teaching Me About Software Engineering

MCP is the headline feature, but the surrounding engineering is where a lot of the learning is happening.

I have had to think about:

### Authentication

How should an external AI client authenticate with the server?

### Configuration

Which values belong in code, environment variables, or deployment configuration?

### Tool Design

What should an AI actually be able to call, and what should the tool interface look like?

### Testing

How do I verify behavior without depending entirely on manual testing?

### CI

How do I make sure the repository stays healthy as changes accumulate?

### Git

How should feature work be isolated, reviewed, and merged?

### Debugging

How do I find the real cause instead of repeatedly treating symptoms?

These are all skills I want to become comfortable with.

---

## Where the Project Is Now

job-application-mcp has grown significantly beyond the initial idea.

The project now involves several areas I wanted practical experience with:

- MCP server development
- AI-tool integration
- Claude Web integration
- OAuth 2.1
- authentication
- GitHub integration
- pull requests
- GitHub Actions
- CI/CD
- Ruff/linting
- testing
- configuration
- debugging
- AI-assisted development

And it is still being worked on.

That's intentional.

I don't want to call something "finished" just because the main feature works.

I want the surrounding engineering to improve too.

---

## What I Want to Improve Next

There are still several areas I want to work on as the project develops:

- making authentication more robust
- improving test coverage
- making CI more reliable
- keeping the architecture maintainable
- improving documentation
- making MCP tools easier to understand and use
- reducing unnecessary complexity
- improving error handling
- validating external integrations properly
- making the project easier for another developer to set up

Most importantly, I want to continue understanding the code instead of simply generating more of it.

---

## What This Project Taught Me

The biggest thing I've taken away so far is that **building software and making code run are two different things.**

Getting a feature to work is only one part.

You also have to think about:

> How is it authenticated?

> How is it configured?

> How is it tested?

> What happens when it fails?

> How does CI verify it?

> Can someone else understand it?

> Can I debug it six months from now?

> What happens when an external service changes?

Those questions are what turn a collection of working code into an actual software project.

And job-application-mcp has been giving me a practical way to learn that.

---

## From “OAuth Implemented” to an Actually Deployed OAuth System

The next part of the project was where the authentication work became real.

I deployed the MCP server to **Azure Container Apps** and connected it to an **Auth0** tenant. The public MCP endpoint is:

```text
https://job-application-mcp.happygrass-de5f577c.centralindia.azurecontainerapps.io/mcp
```

The server now uses an OAuth 2.1-style resource-server flow:

```text
Claude Web
    |
    | OAuth authorization
    v
Auth0
    |
    | RS256 JWT access token
    v
job-application-mcp
    |
    v
MCP tools
```

The server verifies the token's signature using Auth0's JWKS and checks the issuer, audience, expiry, and required `mcp:access` scope.

That was a useful distinction for me: authentication wasn't just a login screen. The MCP server itself has to verify that the token was actually issued for the resource it is protecting.

---

## Azure CI/CD Was Another Layer I Hadn't Worked With Before

Once the application was containerized, I wanted a push to `main` to mean more than "the code is on GitHub."

The GitHub Actions workflow now does this:

```text
push to main
    ↓
Ruff lint + format check
    ↓
pytest
    ↓
Docker build
    ↓
Azure authentication through GitHub OIDC
    ↓
push image to Azure Container Registry
    ↓
update Azure Container App
    ↓
verify deployed image
    ↓
health check
```

The important part is that GitHub does **not** need a long-lived Azure password stored as a repository secret.

GitHub presents an OIDC identity token, and Azure checks whether that token matches a configured federated identity credential.

That sounded like a very high-level cloud concept when I first encountered it.

Then it broke.

---

## The Azure OIDC Failure

The first deployment attempt passed linting and tests but failed at `azure/login@v2`.

The error was:

```text
AADSTS700213:
No matching federated identity record found for presented assertion subject
```

Instead of changing random configuration values, I compared what GitHub was actually presenting with what Azure had been configured to trust.

GitHub was presenting this subject:

```text
repo:Mzaq1559@187723922/job-application-mcp@1381506495:ref:refs/heads/main
```

while Azure still had the older subject:

```text
repo:Mzaq1559/job-application-mcp:ref:refs/heads/main
```

So the first problem was a subject mismatch.

I updated the federated credential to the exact subject GitHub was presenting.

The next CI run failed again, but this time the error changed:

```text
AADSTS700211:
No matching federated identity record found for presented assertion issuer
```

That second error was actually useful.

The subject now matched, but the issuer didn't.

Azure had:

```text
https://token.actions.githubusercontent.com/
```

while GitHub's assertion contained:

```text
https://token.actions.githubusercontent.com
```

The trailing slash was the difference.

I updated the Azure federated credential again, verified the issuer/subject/audience values, and reran the workflow.

This time the deployment succeeded.

That was probably the clearest cloud debugging lesson from this project so far: **when authentication fails, inspect the actual claims and compare them to the trust configuration instead of guessing.**

---

## The Interesting Part: The MCP Server Isn't Actually Claude-Specific

While working through the Claude connection, I also realized something important about the architecture.

The server is an **MCP server**, not a "Claude API server."

The architecture is closer to:

```text
                 ┌───────────────┐
                 │ MCP Server    │
                 │               │
                 │ Job tools     │
                 │ Profile       │
                 │ Resumes       │
                 │ Applications  │
                 └───────┬───────┘
                         │
                MCP over HTTP
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       Claude        another MCP      my own
         Web           client         AI agent
```

The model and the tool server are separate layers.

Claude Web is the first client I'm connecting to because its remote custom-connector support makes the workflow practical, but the underlying server is designed around the MCP protocol rather than around a Claude-only API.

That changes how I think about the project.

I'm not building one giant application that happens to call an LLM.

I'm building a tool layer that an AI client can consume.

---

## Connecting Claude Web

The final step is to add the public MCP endpoint as a custom connector in Claude.

Anthropic's current documentation says custom remote MCP connectors can be added from **Customize → Connectors → Add custom connector**. The connector can optionally receive an OAuth Client ID and Client Secret in Advanced settings.

For this project, the flow is:

```text
Claude
  ↓
Customize → Connectors
  ↓
Add custom connector
  ↓
https://job-application-mcp.happygrass-de5f577c.centralindia.azurecontainerapps.io/mcp
  ↓
Auth0 login / consent
  ↓
Connector enabled
  ↓
Claude can call the MCP tools
```

The important security detail is that the Auth0 Client Secret is configuration, not application source code. It should never be committed to Git or pasted into chat.

Once connected, the first useful test is deliberately simple:

> "Show my profile summary."

Then I can test the actual application workflow with prompts such as:

> "Here's a job description. Save it and analyze my match."

and:

> "I submitted this application. Mark it as applied."

The second operation doesn't submit anything to an external job platform. It records the fact that I told the system I submitted it.

---

## What This Stage Taught Me

At this point the project has crossed several layers that I didn't fully understand when I started:

- MCP protocol design
- remote Streamable HTTP
- OAuth resource-server authentication
- Auth0
- JWT/JWKS verification
- Docker
- Azure Container Apps
- Azure Container Registry
- GitHub Actions
- GitHub OIDC
- Azure federated credentials
- CI/CD debugging
- Claude remote connectors

I definitely don't have all of these concepts memorized.

What I do have now is a real system where these concepts interact.

That is more useful to me than memorizing definitions in isolation.

The Azure OIDC failure in particular was a good reminder that infrastructure errors often look intimidating because the terminology is unfamiliar. Once I reduced the problem to:

```text
What did GitHub send?
What did Azure expect?
Are issuer, subject, and audience identical?
```

the problem became much smaller.

That's the kind of debugging habit I want to keep developing.

---

## Still Building

This isn't the final version of the project.

I'm still adding features, fixing things, improving the architecture, and learning from the failures along the way.

I'll probably look back at some of the early decisions and change them.

That's fine.

The point of this project isn't to prove that I already know everything.

It's to document how I'm learning to build increasingly complex systems.

And this time, the thing I'm building sits right at the intersection of **AI, automation, developer tooling, and job applications**.

I'll come back to this post as the project evolves and add what I learn next.

More updates as I break it, fix it, and figure out what I'm actually doing.


---

## Debugging the Claude Web Connection

After getting the OAuth deployment in place, the next problem was no longer "can the server authenticate?" It was:

> **Why can Claude authorize successfully but still fail to connect to the MCP server?**

This turned into the most involved debugging session of the project so far.

The important thing was to stop treating every Claude error as an authentication problem.

Claude showed a sequence of connection stages such as:

~~~text
Checking the server
        ↓
Looking up sign-in settings
        ↓
Checking the sign-in provider
~~~

At one point Claude was able to reach the OAuth flow, and the UI explicitly reported:

> "Your account was authorized, but Job Application MCP returned an error when connecting."

That distinction mattered.

OAuth authorization had succeeded, but the subsequent MCP connection was still failing.

---

## First Real Server-Side Root Cause: HTTP 421

I went into Azure Log Analytics instead of continuing to guess from Claude's generic error message.

The logs showed requests like:

~~~text
POST /mcp HTTP/1.1 421 Misdirected Request
~~~

and, more importantly:

~~~text
Invalid Host header:
job-application-mcp.happygrass-de5f577c5.centralindia.azurecontainerapps.io
~~~

This was the first concrete root cause I found.

The failure was happening inside the MCP HTTP transport's host validation rather than inside Auth0 token verification.

The MCP Python SDK's Streamable HTTP transport includes DNS rebinding protection by default. That protection validates the incoming Host header, which is useful locally but needs to be configured appropriately for a deployed service with a real hostname.

That led me to investigate the SDK implementation rather than blindly changing the application.

---

## Testing the Transport Fix

I tried configuring TransportSecuritySettings for the deployed hostname.

The first attempt immediately failed CI because I had added the class without importing it:

~~~text
F821 undefined name 'TransportSecuritySettings'
~~~

I fixed the missing import.

The next CI run then failed Ruff's import-order check:

~~~text
I001
~~~

So I corrected the import ordering and got the workflow clean.

However, Claude still couldn't connect.

That was important evidence: **fixing a real server-side problem did not necessarily fix the entire connection problem.**

I then inspected the deployed SDK itself rather than assuming my understanding of the installed version was correct.

The SDK showed:

~~~python
class TransportSecuritySettings(BaseModel):
    enable_dns_rebinding_protection: bool = True
    allowed_hosts: list[str] = Field(default_factory=list)
    allowed_origins: list[str] = Field(default_factory=list)
~~~

and the Streamable HTTP transport passed those settings into its security middleware.

That confirmed that the 421 behavior was actually coming from the SDK's transport security layer.

---

## More Transport Experiments

I then tested disabling DNS rebinding protection explicitly:

~~~python
transport_security = TransportSecuritySettings(
    enable_dns_rebinding_protection=False,
)
~~~

and passed that into the Streamable HTTP application.

I also tested changing the transport configuration from the original stateless JSON-response mode to the standard stateful Streamable HTTP/SSE behavior.

Neither experiment produced a working Claude connection.

I also pinned the MCP dependency to:

~~~text
mcp==2.2.0
~~~

so that the deployed environment would not silently move between SDK versions.

Again, Claude still returned a generic connection failure.

At that point, continuing to make transport changes without new evidence would have been exactly the kind of blind debugging I had been trying to avoid.

---

## Verifying the Public Endpoint Independently

I went back to fundamentals and tested the deployed service directly.

Requesting:

~~~text
/mcp
~~~

without credentials returned:

~~~text
HTTP 401
~~~

with the expected protected-resource metadata reference.

Then I requested:

~~~text
/.well-known/oauth-protected-resource/mcp
~~~

and received:

~~~json
{
  "resource": "https://job-application-mcp.happygrass-de5f577c5.centralindia.azurecontainerapps.io/mcp",
  "authorization_servers": [
    "https://dev-kuqahsd5izwnclgq.us.auth0.com/"
  ],
  "scopes_supported": [
    "mcp:access"
  ],
  "bearer_methods_supported": [
    "header"
  ]
}
~~~

That was useful because it verified several things independently of Claude:

- the public DNS name worked
- Azure Container Apps was reachable
- the MCP endpoint existed
- protected-resource metadata was being served
- Auth0 was correctly advertised as the authorization server
- the required mcp:access scope was advertised

I also verified Auth0's OpenID Connect discovery endpoint was reachable.

This narrowed the problem considerably.

---

## The Important Lesson: Don't Confuse OAuth With MCP Connection

The debugging showed me that there are several separate stages:

~~~text
Claude discovers MCP endpoint
        ↓
Protected Resource Metadata
        ↓
OAuth authorization server discovery
        ↓
User authorization
        ↓
Access token
        ↓
Authenticated MCP request
        ↓
MCP session / tool discovery
~~~

A successful step does not prove that every later step is working.

In my case, Claude was getting far enough through the OAuth process to authorize the account, while the final MCP connection was still failing.

That is why the generic Claude message was not enough to identify the problem.

---

## Reverting Instead of Accumulating More Changes

After several transport experiments, I made a deliberate decision to stop modifying the working baseline.

The last known-working implementation was commit:

~~~text
26006eb040fe43ba2e4fc8c8d45e88fe0a6b1da6
~~~

I restored main to that exact commit.

I also closed the diagnostic transport experiment rather than leaving experimental changes around just because they had already been made.

This was an important engineering decision for me.

A debugging branch should not become the new production state simply because a lot of work has already been invested in it.

The repository is now back on the known baseline while the remaining Claude Web connection issue is investigated separately.

---

## What I Actually Know Now

After this debugging session, I can separate the confirmed facts from the assumptions.

### Confirmed

- The MCP server is deployed on Azure Container Apps.
- The public MCP endpoint is reachable.
- Protected-resource metadata is available.
- Auth0 discovery is available.
- Auth0 authorization can succeed.
- The server previously produced real HTTP 421 Host-header failures.
- The MCP SDK's transport security was responsible for those 421 responses.
- Multiple transport configuration experiments were deployed and tested.
- The experiments did not produce a working Claude connection.
- The main branch was restored to the known baseline commit.

### Not yet proven

I have not yet proven exactly why Claude's backend still fails the final MCP connection after successful authorization.

That distinction is important.

I don't want to write:

> "I fixed the OAuth problem."

because the evidence doesn't support that.

The evidence says that authentication infrastructure is functioning far enough for authorization to complete, while the end-to-end Claude → MCP connection still has an unresolved problem.

---

## Another Lesson From This

This was probably the best example so far of why debugging needs evidence.

I found a genuine bug:

~~~text
Invalid Host header → 421
~~~

It was tempting to treat that as *the* answer.

But after fixing and testing it, Claude still failed.

So the correct conclusion wasn't:

> "The fix didn't work, therefore the diagnosis was useless."

The correct conclusion was:

> "That was a real problem, but it wasn't the only remaining problem."

That is a much better debugging mindset.

Real systems can have multiple independent failures hidden behind one generic error message.

---

## Where I Left It

For now, I'm intentionally leaving the repository on the known-working OAuth baseline rather than accumulating speculative transport changes.

The next investigation can start from a clean state and focus specifically on the remaining post-authorization Claude Web connection behavior.

This also gives me a clean comparison point:

~~~text
Known baseline
26006eb
     ↓
controlled experiment
     ↓
observe exact behavior
     ↓
keep or revert based on evidence
~~~

That is a much healthier workflow than continuously stacking fixes on top of previous experiments.

---

## Current Status

The project has reached a point where the interesting part isn't just adding another feature.

It is understanding how all of these systems interact:

~~~text
GitHub
   ↓
GitHub Actions
   ↓
Docker
   ↓
Azure Container Apps
   ↓
MCP Streamable HTTP
   ↓
OAuth 2.1
   ↓
Auth0
   ↓
Claude Web
~~~

Every layer can work independently while the complete chain still fails.

That's exactly the kind of engineering problem I wanted this project to expose me to.

The Claude Web connection issue is not completely resolved yet, but the debugging process has already taught me something valuable: **when a system crosses multiple services, isolate each boundary, collect evidence at that boundary, and don't confuse a real intermediate fix with a complete solution.**

The investigation is continuing from the clean baseline.


---

## What This Project Is Teaching Me About My Own Development

There is another lesson I have started noticing while working on this project.

I have been moving across a lot of areas during my degree: web development, .NET, Python, AI/ML, computer vision, RAG, agents, MCP, cloud deployment, and research-oriented work. That breadth has helped me discover what I enjoy, but it also creates an easy trap: learning the vocabulary of many technologies without developing enough depth in any of them.

This project has made that problem more obvious to me.

I can ask an AI assistant to generate an implementation very quickly. I can get a complicated-looking system running much faster than I could have a year ago. But if I cannot explain why the implementation works, reproduce the problem when it breaks, or change the code without the assistant doing all the reasoning for me, then I have built something without fully building the underlying skill.

That is something I want to change.

### Using AI Without Outsourcing the Learning

AI coding assistants are extremely useful in this project. They help me explore unfamiliar APIs, inspect errors, generate initial implementations, and move through repetitive work faster.

But there is a difference between:

> "The AI wrote code that works."

and:

> "I understand the code well enough to maintain, debug, and extend it."

The second is the skill I actually want.

So I am trying to become more deliberate about the role AI plays in my development. Instead of immediately asking for a complete solution, I want to spend more time reading the error, forming a hypothesis, inspecting the relevant code, and understanding the proposed change.

The goal isn't to stop using AI.

The goal is to make sure that **AI increases my capabilities instead of replacing them.**

---

## Breadth Is Useful, But Depth Has to Catch Up

This project also made me think differently about the number of technologies I am trying to learn.

Knowing a little about many areas is useful when building systems like this because the project crosses several boundaries. At the same time, I don't want my development to become a collection of shallow technologies on a CV.

For me, the more useful long-term direction is to build strong fundamentals first and then develop genuine depth in the areas I want to specialize in.

That means becoming comfortable enough with programming that basic Python and software-engineering decisions become automatic, while continuing to build depth around AI/ML and systems that use those technologies.

The projects can still be broad.

My understanding shouldn't be.

---

## Why I'm Keeping the Failures

This is also why I am keeping the messy parts of this project log.

The failed CI runs, incorrect assumptions, OAuth issues, Azure OIDC mismatch, HTTP 421 response, transport experiments, and eventual rollback are not just historical details.

They show the difference between producing code and learning to engineer.

The most useful part of the project may not be the final working configuration.

It may be the gradual shift from:

    "Make it work."

    ↓

    "Understand why it doesn't work."

    ↓

    "Test the hypothesis."

    ↓

    "Make the smallest useful change."

    ↓

    "Verify the result."

That is the engineering habit I want to carry into my next projects.

---

## Still Building, But With a Different Goal

I started this project because MCP was interesting.

Now the project is becoming useful for a larger reason: it is forcing me to practice software engineering across multiple layers while also exposing the weaknesses in my own learning process.

I still want to build more features.

I still want to get the Claude Web connection fully working.

I still want to learn more about MCP, OAuth, cloud deployment, AI systems, and automation.

But I also want to come out of the project being able to build and debug more of the system **without needing an AI to do the thinking for me**.

That is probably the more important milestone.

The project is still unfinished.

So am I.

And that is exactly why I'm keeping the development log.
