---
title: Building Context Vault — Turning My Claude History into a Searchable Obsidian Archive
slug: context-vault-claude-history-obsidian-archive
date: 2026-09-30
tags:
  - Python
  - Markdown
  - GitHub
  - Obsidian
  - Automation
  - Project Log
category: project-log
excerpt: "I turned my exported Claude conversation history into a 512-chat Markdown archive for Obsidian, then built and refined a categorization workflow to make the archive actually useful."
cover: ./images/cover.png
---

# Building Context Vault — Turning My Claude History into a Searchable Obsidian Archive

I had accumulated a huge amount of useful work inside Claude conversations: debugging sessions, project discussions, learning notes, application work, technical experiments, setup instructions, and random ideas.

The problem was that all of this information was trapped inside chat history.

I wanted something I could actually own and work with locally.

So I started building **Context Vault** — a GitHub-based archive of my exported Claude conversations, converted into Markdown and organized into categories so I could browse and search them through **Obsidian**.

The goal wasn't simply to export my conversations.

The goal was to turn a large, messy conversation history into a structured knowledge archive.

---

## 1. Starting With the Raw Claude History

The first step was getting my Claude conversation history into a form I could process.

The exported data was essentially a large collection of conversations. That was useful as a backup, but not particularly useful for everyday browsing.

I wanted each conversation to become an individual Markdown file.

The eventual structure was:

```
archive/
└── claude/
    ├── academics/
    ├── career/
    ├── hackathon/
    ├── learning/
    ├── life/
    ├── misc/
    ├── personal/
    └── tech-setup/
```

This immediately made the archive much easier to reason about.

Instead of having hundreds of conversations sitting together, I could navigate them according to their subject.

---

## 2. Converting Conversations to Markdown

The next important part was converting the exported conversations into Markdown notes.

Markdown gave me several advantages:

- The files were human-readable.
- They could be opened directly in Obsidian.
- They could be version-controlled with Git.
- They could be searched with normal filesystem tools.
- The archive was no longer dependent on a proprietary chat interface.

Each conversation became its own `.md` file with a generated filename containing useful information such as the date, readable title, and an identifier.

For example:

```
2026-03-31-0754-sql-server-on-ubuntu-setup-694cc76e.md
```

At this point, I had something much closer to a real personal knowledge archive rather than a raw export.

---

## 3. The First Problem: Categorization

Once the conversations had been converted, the next problem became obvious.

I had hundreds of Markdown files.

Manually sorting every conversation would take too much time.

So I created a category-based sorting system.

The main categories eventually became:

- **academics** — university coursework, exams, and academic material
- **career** — internships, applications, CVs, scholarships, and freelancing
- **hackathon** — hackathon projects and related development work
- **learning** — programming, machine learning, algorithms, concepts, and tutorials
- **life** — travel, entertainment, and everyday-life discussions
- **misc** — conversations that were too vague to confidently classify
- **personal** — personal discussions outside the technical/career categories
- **tech-setup** — Linux, Docker, software installation, development environments, and configuration

The first sorting pass gave me a usable structure, but it definitely wasn't perfect.

---

## 4. Why Keyword-Based Sorting Wasn't Enough

This was where the project became more interesting.

At first, categorization seemed like a simple keyword-matching problem.

But real conversation titles are messy.

One of the obvious problems was a title like:

```
Agent Kim Reactivated
```

A simplistic rule looking for `react` could interpret that as a React-related technical conversation.

But it wasn't.

Another example was:

```
Codebase audit and dependency cleanup
```

A rule looking for a dependency-related substring could place it into an unintended category.

There were also conversations where a generic word such as `website` caused a classification that was technically explainable by the rule but obviously wrong when a human looked at the actual conversation.

This showed me an important limitation of keyword-based classification:

> A word appearing in a title does not necessarily describe the subject of the conversation.

---

## 5. Building a Resorting Workflow

Instead of manually rebuilding the archive from scratch every time I discovered a problem, I worked on a resorting process.

The idea was to keep the archive itself intact while improving the classification rules and rerunning the categorization.

The workflow became:

```
Existing archive
      ↓
Improve classification rules
      ↓
Run resorting process
      ↓
Inspect suspicious results
      ↓
Manually correct obvious mistakes
      ↓
Verify totals
```

This was much safer than blindly moving files around.

It also made the process repeatable. If I discovered a rule problem, I could fix the sorting logic and rerun it instead of manually correcting hundreds of files.

---

## 6. Adding the Life Category

During the reorganization, I recognized that some conversations didn't belong naturally in either `personal` or `misc`.

The **life** category was introduced to separate everyday-life material such as entertainment, travel, and similar discussions from more genuinely personal conversations.

This made the taxonomy more useful because `personal` no longer had to absorb every non-technical conversation.

---

## 7. Inspecting the Suspicious Cases

After the second sorting pass, I didn't simply assume that the result was correct.

I inspected the categories and looked for suspicious classifications.

Some examples included:

```
Agent Kim Reactivated
```

being affected by React-related matching, and:

```
Codebase audit and dependency cleanup
```

being affected by dependency matching.

There were also cross-category cases where the title itself was ambiguous.

For example:

```
SQL Server on Ubuntu setup
```

could look academically related if the sorting system focused on SQL/database learning.

But the actual conversation was primarily about setting up and configuring SQL Server on Ubuntu.

That made **tech-setup** the more appropriate category.

---

## 8. Manual Corrections

Claude's earlier sorting work eventually resulted in a dedicated correction commit:

```
cc5ab51 — Fix 5 misfiled chats
```

This was an important point in the project.

The goal wasn't to claim that an automated classifier would produce a perfect archive.

Instead, the workflow became:

```
Automation handles the bulk
        +
Human inspection handles edge cases
```

That was a much more realistic approach.

The archive was already mostly correct, so I focused on the remaining obvious mistakes instead of continuously changing the rules.

---

## 9. Taking Over the Repository From Claude

At one point Claude ran out of tokens while working on the repository.

Instead of stopping the project, I continued the inspection using GitHub tooling.

I inspected the repository structure, category documentation, existing files, and commit history.

This was useful because I wasn't relying only on Claude's description of what had happened.

I could independently inspect the actual repository state.

The Git history showed the progression of the project:

```
initial import
      ↓
first sorting pass
      ↓
v2 re-sort
      ↓
manual classification fixes
      ↓
README update
      ↓
additional correction
```

This also gave me confidence that the work Claude had already done was actually present in GitHub.

---

## 10. Finding the Last Clear Misclassification

During my inspection, I found one clear remaining classification problem:

```
SQL Server on Ubuntu setup
```

It was located under:

```
archive/claude/academics/
```

I inspected what the conversation was actually about.

It wasn't primarily an academic discussion.

It was about technical setup:

- SQL Server
- Ubuntu
- configuration
- development environment setup

So I moved the conversation into:

```
archive/claude/tech-setup/
```

The corrected file became:

```
2026-03-31-0754-sql-server-on-ubuntu-setup-694cc76e.md
```

I also removed the old copy from `academics` and updated `CATEGORIES.md`.

The repository recorded the changes as separate commits for creating the corrected file, deleting the old file, and updating the category documentation.

---

## 11. Verifying the Archive

After making the correction, I didn't stop at checking that the file had moved.

I verified the repository state.

The archive contained:

**512 conversations.**

The final category distribution was:

| Category | Chats |
|---|---:|
| Academics | 134 |
| Career | 49 |
| Hackathon | 16 |
| Learning | 55 |
| Life | 49 |
| Misc | 29 |
| Personal | 125 |
| Tech Setup | 55 |
| **Total** | **512** |

The important part was that the total still equaled exactly:

```
512
```

That matters because moving and deleting files during an archive reorganization creates a real risk of accidentally losing or duplicating conversations.

I also verified that:

- the corrected SQL Server file existed under `tech-setup`
- the old `academics` copy was gone
- `CATEGORIES.md` reflected the new counts
- the earlier manual corrections were still present
- `life` was present
- MediBook-related conversations were grouped under `hackathon`
- career-related material was under `career`
- Linux, Docker, Kali, DaVinci, and similar setup material was under `tech-setup`

---

## 12. What I Learned From the Sorting Problems

The biggest lesson from this project wasn't actually about Markdown or Git.

It was about classification.

A simple keyword system looks attractive because it is easy to implement:

```python
if "react" in title:
    category = "learning"
```

But real data quickly exposes the weakness of this approach.

For example, `react` could mean React.js, but it could also be part of a completely unrelated word such as `reactivated`.

Similarly, `website` doesn't automatically mean that a conversation belongs to a particular technical category.

And `SQL` doesn't automatically mean academics.

The actual conversation context matters.

This project therefore became a practical example of why deterministic rules need careful boundaries and why automated classification should be followed by validation.

---

## 13. Why I Eventually Stopped Sorting

At the end, there were still some conversations inside `misc`.

Examples included vague titles such as:

```
Problem-solving guidance needed
untitled
General assistance request
```

I could have continued creating increasingly complicated keyword rules.

But that would have created another problem.

The more aggressive the rules became, the greater the chance of incorrectly moving conversations that were genuinely ambiguous.

At that point, I decided that the archive had reached a useful state.

Instead of optimizing endlessly for theoretical 100% classification accuracy, I kept the remaining genuinely ambiguous conversations in `misc`.

That was a deliberate decision.

---

## 14. Final Structure

The final archive is organized approximately like this:

```
context-vault/
│
├── archive/
│   └── claude/
│       ├── academics/
│       ├── career/
│       ├── hackathon/
│       ├── learning/
│       ├── life/
│       ├── misc/
│       ├── personal/
│       └── tech-setup/
│
├── CATEGORIES.md
└── README.md
```

Each conversation remains an individual Markdown document.

That means I can open the repository directly in Obsidian and treat my old Claude conversations as a personal knowledge archive.

---

## 15. Final Result

What started as a simple idea — "I want my Claude chats outside Claude" — turned into a small data organization project.

I ended up with:

- **512 archived conversations**
- Markdown-based storage
- Obsidian compatibility
- Git version control
- Eight meaningful categories
- Automated classification
- A resorting workflow
- Manual correction of edge cases
- Category documentation
- Verified file counts
- A complete Git history of the transformation

The most useful part is that the archive is now mine.

I'm not just looking at old conversations anymore. I have them as actual files that I can search, organize, edit, version, and use as part of my broader personal knowledge system.

And the project also reminded me of something I keep encountering in software development:

> Automation is excellent at handling the bulk of repetitive work, but the difficult edge cases still require understanding the actual context.

For Context Vault, the right solution wasn't "make the classifier infinitely complicated."

It was:

```
Automate
   ↓
Inspect
   ↓
Fix
   ↓
Verify
   ↓
Stop when the result is good enough
```

That was the point where I considered the archive ready for the next stage.

---

## What's Next

The next step is to make the archive more useful rather than simply making the sorter more complicated.

I want to eventually explore things like:

- better search across conversations
- linking related conversations
- extracting reusable project knowledge
- tagging important conversations
- identifying duplicate or near-duplicate discussions
- privacy auditing before any wider sharing
- using the archive as a real personal knowledge base inside Obsidian

For now, though, the core problem is solved.

I took a large export of conversations and turned it into a structured, version-controlled archive that I can actually work with.
