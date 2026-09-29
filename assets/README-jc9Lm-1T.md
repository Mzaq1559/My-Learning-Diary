---
title: Building Context Vault — Turning My Claude History into a Searchable Obsidian Archive
slug: context-vault-claude-history-obsidian-archive
date: 2026-09-30
tags: [Python, Markdown, GitHub, Obsidian, Automation, Project Log]
category: project-log
excerpt: How I turned my exported Claude history into a structured 512-chat Markdown archive, debugged automatic categorization, and cleaned up the final repository.
cover: ./images/cover.png
---

# Building Context Vault — Turning My Claude History into a Searchable Obsidian Archive

I had accumulated a large amount of useful work inside Claude: debugging sessions, learning notes, project discussions, setup instructions, application-related conversations, and random technical experiments.

The problem was that this history was useful only while it lived inside the chat interface. I wanted a local, Git-based archive that I could search, organize, open in Obsidian, and continue building on over time.

That became **Context Vault**.

The goal was simple:

> Turn my exported Claude conversations into a structured Markdown archive that I could actually own and work with.

---

## 1. Starting With the Raw Claude History

The first step was getting my Claude conversation history into a form that I could process locally.

The exported data contained hundreds of conversations, but it was not organized in the way I wanted to work with it.

I wanted each conversation to become an individual Markdown file with a predictable structure.

The eventual repository structure looked roughly like this:

~~~text
context-vault/
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
├── CATEGORIES.md
└── scripts/
~~~

This immediately made the archive much easier to inspect and process with normal Git and filesystem tooling.

---

## 2. Converting the Conversations to Markdown

The next step was turning the exported conversations into individual Markdown notes.

Markdown was a deliberate choice because it is:

- human-readable
- easy to version with Git
- supported by Obsidian
- easy to process with Python
- portable across editors and platforms

Instead of keeping one huge export file, every conversation became a separate note.

This gave me a much more practical archive: I could open a single conversation, search filenames, use Git history, and later add links or tags without having to deal with the original export format.

---

## 3. Designing the Categories

I initially organized the archive into eight categories:

| Category | Conversations |
|---|---:|
| academics | 134 |
| career | 49 |
| hackathon | 16 |
| learning | 55 |
| life | 49 |
| misc | 29 |
| personal | 125 |
| tech-setup | 55 |
| **Total** | **512** |

The categories were intentionally broad.

I did not want hundreds of tiny folders. I wanted enough structure to make the archive navigable while still keeping related conversations together.

---

## 4. The First Sorting Attempt

The first version of the categorization logic was based heavily on keywords.

That was fast, but it exposed an obvious problem:

**keywords do not understand context.**

A conversation containing the word `react` does not necessarily belong to a React/web-development category.

A conversation mentioning a `website` does not automatically mean it is a personal or web-development conversation.

Some of the mistakes made this very clear.

For example:

- `Agent Kim Reactivated` was incorrectly matched because of the `react` substring.
- `Codebase audit and dependency cleanup` was affected by overly broad dependency matching.
- `IBCC website holiday...` ended up in the wrong category because the classifier saw `website`.
- Some vague titles simply fell through because there was not enough information for the keyword rules.

This was the point where the project stopped being a simple export-and-sort script and became an actual data-cleaning problem.

---

## 5. Building a Resorting Workflow

Instead of manually rebuilding everything, I created a workflow around a sorting script and a patch/resort process.

The idea was:

1. inspect the generated archive
2. identify suspicious classifications
3. adjust the rules
4. rerun the sorting process
5. manually inspect the remaining edge cases

This was much safer than repeatedly moving hundreds of files by hand.

I also kept the category information documented in `CATEGORIES.md`, so the final repository had an explicit record of how the archive was organized.

---

## 6. Manually Correcting the Obvious Mistakes

Automation got the bulk of the work done, but it was not reasonable to trust the classifier blindly.

Claude later identified and corrected five clearly misfiled conversations.

That was useful, but it also reinforced an important lesson:

**a classifier can be good enough to reduce manual work without being good enough to make the final decision on every item.**

The archive was now mostly correct, but I wanted to do another inspection rather than assuming the previous cleanup had caught everything.

---

## 7. Taking Over When Claude Ran Out of Tokens

At this stage, Claude had already done a significant amount of the repository work, but the available context/tokens ran out while I was still checking the final state.

So I switched to GitHub inspection and continued the cleanup myself.

I did not want to restart the whole process.

Instead, I treated the existing repository as the source of truth and inspected the generated files and category counts.

This turned out to be useful because I was now looking specifically for **remaining suspicious cases**, rather than trying to redesign the entire classifier.

---

## 8. Finding One Remaining Misclassification

One conversation immediately stood out:

~~~text
archive/claude/academics/
2026-03-31-0754-sql-server-on-ubuntu-setup-694cc76e.md
~~~

The title was about setting up SQL Server on Ubuntu.

It was sitting inside `academics`, but the actual subject was clearly system/setup work.

I moved it into:

~~~text
archive/claude/tech-setup/
2026-03-31-0754-sql-server-on-ubuntu-setup-694cc76e.md
~~~

I also updated `CATEGORIES.md` so the documented category counts stayed synchronized with the actual archive.

This was a small change, but it was exactly the kind of edge case that keyword-based classification can miss.

---

## 9. Verifying the Final Counts

After the final correction, I did not just assume the repository was correct.

I checked the category counts again.

The final distribution was:

~~~text
academics    134
career        49
hackathon     16
learning      55
life          49
misc          29
personal     125
tech-setup    55
-------------------
total        512
~~~

The important part was that the total still matched the original archive:

**512 conversations in, 512 conversations out.**

No conversations had silently disappeared during the resorting and cleanup process.

---

## 10. Why I Stopped Sorting

At this point I deliberately stopped trying to make the automatic classifier perfect.

The remaining `misc` conversations were generally vague enough that forcing them into another category could actually make the archive worse.

This was an important decision.

A classification system does not have to eliminate every ambiguous case.

Sometimes the correct behavior is:

> "I don't have enough information to confidently classify this."

That is better than confidently putting a conversation into the wrong folder.

---

## 11. What I Learned

The biggest lesson from Context Vault was that **data organization is harder than data conversion**.

Converting hundreds of conversations into Markdown was mostly an engineering task.

Organizing them correctly required judgment.

I learned a few things from the process:

### Keyword matching is useful, but limited

Simple rules are excellent for handling obvious cases, but substring matches can create surprising false positives.

### Automation should reduce manual work, not hide uncertainty

The sorting script handled the repetitive part. Manual inspection handled the ambiguous part.

### Counts are an important sanity check

The final total of 512 gave me a simple way to detect accidental loss or duplication.

### Git makes this kind of cleanup much safer

Because the archive lives in Git, I can inspect exactly what changed, revert mistakes, and continue improving the organization later.

### Obsidian changes the usefulness of the archive

Once the conversations are Markdown files, they are no longer just an export.

They become raw material for a personal knowledge base.

---

## 12. Final Result

The final Context Vault contains:

- **512 Claude conversations**
- Markdown files for individual conversations
- eight broad categories
- documented category counts
- a Git-based history of the cleanup
- an archive that can be opened and searched in Obsidian

More importantly, I now have the conversations in a format that I control.

Instead of relying on an old chat interface to find something I remember discussing months ago, I can work with the actual files.

---

## 13. What I Want to Build Next

The current archive is only the foundation.

Some things I want to explore next are:

- better full-text search
- Obsidian links between related conversations
- automatic tags
- duplicate detection
- extracting reusable knowledge from old conversations
- project-level indexes
- better handling of ambiguous conversations
- privacy/security checks before syncing the archive
- turning recurring solutions into permanent documentation

The long-term idea is bigger than simply storing old chats.

I want Context Vault to become a **personal knowledge archive** where old conversations can be searched, connected, and turned into something reusable.

For now, the important milestone is complete:

**512 conversations are now organized, version-controlled Markdown instead of being trapped inside an export.**
