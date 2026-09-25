---
title: Building MediBook AI — A Hackathon in 6 Days
slug: medibook-ai-alibaba-cloud-hackathon-pakistan-2026
date: 2026-09-04
excerpt: A four-person hackathon build of an AI receptionist for small clinics, what broke along the way, and how the chatbot went from rules to RAG to a tool-calling agent afterwards.
tags: [AI, FastAPI, React, PostgreSQL, Docker, Hackathon, Python, RAG, Groq]
category: Project Log
cover: ./images/cover.png
---

<!-- CHECK: the title and intro say "6 days" (the repo description says the same), but the commit history on main runs from late August to Sept 7 and my notes give a build window of Aug 22 - Sept 4. Confirm what the 6 days refers to and adjust the title/intro if needed. -->

## What we built

In August 2026 I led a 4-person team in the **Alibaba Cloud AI Hackathon Pakistan 2026** (theme: *AI for Pakistan's Future*). We built MediBook AI, a 24/7 virtual receptionist for small clinics. A patient describes symptoms in plain language, the system triages urgency, suggests a specialist, checks live doctor availability and books the appointment, all through chat.

This is my log of how it went: what I worked on, what broke, and what the chatbot turned into after the hackathon version. The last part matters, because the version I describe first is not the one in the repo today.

---

## The problem we picked

Small clinics in Pakistan often run on one doctor, one receptionist and a notebook. The receptionist answers the phone, handles walk-ins and keeps a paper appointment book all at once. That gives you:

- double bookings, because there's no real-time availability check
- patients who can't get help after hours
- no-shows, because nothing sends reminders
- the same questions a hundred times a day (*"Is the doctor available tomorrow?"*, *"What's the fee?"*)

We wanted to take that load off the receptionist without asking a clinic to buy enterprise software.

---

## The team

| Name | Role |
|------|------|
| Me (Muhammad Zulqarnain) | Project lead, architecture, Docker, chat integration, seeding, RAG integration |
| Sidra Pervaiz | FastAPI backend: models, appointment engine, tests |
| Aleeza Imran | React frontend: UI, design system, chat interface |
| Ayesha Sajjad | AI service: Groq NLU, symptom triage, conversation flow, integrations |

We split along service boundaries from day one so we weren't editing the same files. I've seen group projects fall apart over that.

---

## The first version

What worked in the hackathon build:

- the full booking flow: symptoms → triage → doctor selection → slot confirmation → saved to PostgreSQL
- Groq-powered chat for understanding what the patient meant
- emergency detection: describe chest pain or trouble breathing and the bot stops the booking flow and tells you to call 1100
- admin and doctor dashboards
- JWT auth with refresh tokens and role-based route guards
- Google Calendar sync and 24h/1h email reminders
- everything in Docker Compose, one command to start

<!-- IMAGE: ./images/chat-booking-flow.png — Screenshot of the patient chat from the first symptom message to the booking confirmation. Show the triage reply, the doctor options and the final confirmation. Place it here, right after the feature list, so the reader sees the product before the internals. -->

Three services talk to each other:

```
Frontend (React, port 3000)
    ↓ /api  →  Backend API (FastAPI, port 8000)
    ↓ /chat →  AI Service  (FastAPI, port 8001)
                    ↓
               Groq LLM API
                    ↓
               Backend API (to fetch doctors, create appointments)
```

The AI service holds the conversation state and calls the backend on the patient's behalf, forwarding the JWT so the backend can authorize the booking. The frontend never books directly through the AI service. Splitting it this way meant the AI service could be restarted or swapped without touching the backend, and the backend stayed the source of truth for data.

<!-- IMAGE: ./images/architecture.png — Architecture diagram: React frontend → FastAPI backend and AI service → Groq, with PostgreSQL behind the backend. Draw the arrows the way the text describes them (AI service calls the backend with the forwarded JWT). Place it after the ASCII diagram above so readers can compare. -->

---

## My part: Docker, seed data, chat integration

### Docker Compose

Getting five services to start in the right order without fighting each other took longer than I expected. The chain is `PostgreSQL → Backend → AI Service → Frontend`. I spent about half of day one getting the health checks right so `docker compose up -d` just worked:

```yaml
backend:
  depends_on:
    db:
      condition: service_healthy
ai-service:
  depends_on:
    backend:
      condition: service_started
```

The Vite dev server proxies `/api` to the backend and `/chat` to the AI service, so the browser only sees one origin and there are no CORS problems in development.

### The seed script

A blank database kills a demo, so I wrote a seed script: 3 clinics, 3 doctors with schedules and holidays, 3 patients and 300+ appointments across past and future dates. There's also a bulk mode (about 19 doctors and 100–150 patients). Two modes because the demo wants a realistic dashboard while the tests want something small and predictable.

### Chat integration

The hard part was wiring the conversation state to the booking API. The patient can drop out at any step:

```
symptoms entered
    → AI asks follow-up questions
    → triage maps symptoms to a specialization
    → fetch matching doctors from the backend
    → fetch availability for each doctor
    → present options
    → patient picks doctor + slot
    → patient confirms ("yes")
    → POST /api/appointments with the patient's JWT
    → return confirmation
```

The subtle bit is that "yes" only means something in context. If no slot has been chosen yet, "yes" must not trigger a booking. Ayesha built the state machine; I made sure the backend calls and the JWT forwarding were right.

---

## How the AI part worked at first

The first version used two layers: a keyword pre-router for obvious cases, and Groq in JSON mode for everything else.

```python
response = groq_client.chat.completions.create(
    model=settings.GROQ_MODEL,
    messages=[{"role": "user", "content": prompt}],
    response_format={"type": "json_object"}
)
intent_data = json.loads(response.choices[0].message.content)
# -> { intent, symptoms, confirms, doctor_name, date, ... }
```

JSON mode made the output reliable to parse. Asking for plain text and using regex broke on edge cases constantly.

Triage in this version was rule-based, not LLM: symptoms mapped to a specialization by keyword.

```python
SYMPTOM_MAP = {
    "chest pain": "Cardiologist",
    "heart": "Cardiologist",
    "sore throat": "ENT Specialist",
    "rash": "Dermatologist",
}
```

The LLM extracts what the patient said, and the rules decide where to route them. Emergency keywords are checked before any LLM call, so a possible emergency doesn't wait on model latency.

<!-- IMAGE: ./images/emergency-detection.png — Screenshot of the chat responding to something like "I have chest pain": the booking flow stops and the emergency numbers are shown. Place it right after this paragraph; it's the clearest demonstration of why the check runs before the LLM. -->

---

## The backend

Sidra built the core. The part I found most interesting was the availability engine. Computing a doctor's free slots means: take the weekly schedule, check clinic holidays, fetch that day's existing appointments, subtract booked slots, respect `max_patients_per_day`, and only return future slots. A bug there means double bookings, which is the exact problem we set out to fix. The backend also validates on insert, so if two requests race for one slot the second gets a 409 and the AI service handles it.

There are 9 tables, all with UUID primary keys. Appointments carry `google_calendar_event_id`, `reminder_sent_24h` and `reminder_sent_1h`, which the scheduler reads to know which reminders are still owed.

<!-- IMAGE: ./images/admin-dashboard.png — Screenshot of the admin dashboard with the seeded data loaded (clinic metrics, appointment counts). Place it after this section; it shows what the seed script and the appointment tables produce. -->

---

## What broke during the build

**JWT forwarding.** The AI service was calling the backend without the patient's token, so appointments were created with no authenticated user. The fix was to pull the token from the incoming chat request and forward it as a header on every outbound backend call.

**Losing state on restart.** Conversation state lived in a Python dict keyed by `conversation_id`. Every container restart during development wiped it mid-conversation. Not a bug, just annoying. Persisting it (Redis or PostgreSQL) was the fix we ran out of time for, and the README still lists in-memory sessions as a known limit.

**Tests and seed data sharing a database.** Test counts were unpredictable because the tests ran against the seeded data. The tests now use in-memory SQLite through `tests/conftest.py`, while the seed targets PostgreSQL.

**Slow Docker builds.** Cold builds took 4–5 minutes because `pip install` ran every time. Copying `requirements.txt` and installing before copying the app code fixed it:

```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt   # cached layer
COPY . .                                              # only this busts cache
```

---

## It didn't stay a rule-based bot

The repo kept going after the hackathon build, and the chatbot now exists in three versions:

- **`baseline`**: what I described above (keyword pre-router, Groq JSON-mode NLU, rule-based triage).
- **`rag`**: a branch that adds retrieval. Medical knowledge is embedded with sentence-transformers, stored in ChromaDB and retrieved to ground the triage answer. It sits behind a `RAG_ENABLED` flag and falls back to the old deterministic triage if retrieval fails. There's a circuit breaker so a broken vector store doesn't take the chat down, and retrieval is filtered by clinic.
- **`main`**: the chat rebuilt as a single tool-calling agent on Groq, with RAG as one tool next to doctor lookup, availability and booking. Changes to appointments go through a propose-then-confirm step (the commit calls them write gates), and the deterministic emergency detection stayed.

<!-- IMAGE: ./images/three-versions.png — Simple diagram of the three versions: baseline (rules + Groq NLU), rag (adds ChromaDB retrieval), main/agentic (tool-calling agent with RAG as a tool). Place it right after this list; a picture makes the branch structure much easier to hold in your head. -->

So the line I wrote at first, that triage is entirely rule-based, is only true of the first version.

I should be clear about what I've verified here: the branches and the README describe these three designs, and the history shows the agentic rebuild, but I haven't benchmarked one against another, so I can't say how much better the agent is.

### Bugs the agent version brought

**Booking the wrong doctor.** A regression test in the repo describes it: a patient has a historical preferred doctor, the assistant recommends a different one in this conversation, the patient says "yes", and the booking should go to the recommended doctor. The fix relabelled the historical one as "past preferred doctor (reference only)" in the prompt and started tracking the doctor selected in this session separately, adding an "active doctor selected for booking" line. My reading is that the old preference was simply too prominent for the model.

**Groq 413 on long conversations.** Long chats started failing with a payload-too-large error. Changes tried in one commit: history cut from 20 to 10 messages, UI-only data stripped from tool results before they go back to the model, slot lists trimmed to a few samples, symptom strings truncated, and a duplicated block removed from the patient context. The commit message says it wasn't fully resolved, and I haven't re-checked whether it is now.

**Model change.** On Sept 3 the Groq model was switched to `openai/gpt-oss-120b`.

**Urdu / RTL layout.** This one took more than one go: the history has the RTL change reverted and then that revert reverted.

---

## What I learned

**Split services by responsibility early.** With clean REST contracts and Pydantic schemas, three people could work in parallel, and we had no major integration bugs when we merged.

**For the first version, rules for routing and an LLM for understanding was more predictable than LLM-only.** We moved past that later, but the deterministic emergency check stayed for the same reason: some decisions shouldn't depend on a model.

**Tool results are prompt too.** The 413 fixes were all about sending the model less. What you return from a tool counts against the same context as everything else.

**Seed data is a feature for demos.** I should have written the seed script on day one, not day three.

**Docker layer ordering is worth five minutes of thought.**

**In-memory state is fine for an MVP** and painful the moment you restart containers a lot.

---

## What's not done

Per the README the project is web-first (no native mobile), English-primary with Urdu/English support planned, and conversation sessions still live in memory and reset when the AI service restarts. WhatsApp reminders aren't implemented because they need WhatsApp Business API approval, and there's no payment gateway.

---

## Repo

| Link | Description |
|------|-------------|
| [GitHub: MediBook AI](https://github.com/Mzaq1559/MEDIBOOK_AI) | Backend, frontend, AI service and Docker. `main` is the agentic version; `baseline` and `rag` are the earlier ones. |

Seeded demo accounts for a local setup are listed in the repo README.
