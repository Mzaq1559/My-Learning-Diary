---
title: Building MediBook AI — A Hackathon in 6 Days
slug: medibook-ai-alibaba-cloud-hackathon-pakistan-2026
date: 2026-09-04
tags: [AI, FastAPI, React, PostgreSQL, Docker, Hackathon, Python]
category: Project Log
cover: ./images/cover.png
---

## We Built an AI Clinic Receptionist in 6 Days

In August 2026 I led a 4-person team in the **Alibaba Cloud AI Hackathon Pakistan 2026** — theme: *AI for Pakistan's Future*. We had 6 days. We built MediBook AI: a 24/7 AI-powered virtual receptionist for small clinics in Pakistan. Patients describe symptoms in plain language, the system triages urgency, recommends a specialist, checks live doctor availability, and books an appointment — all through chat.

This is my log of how we did it, what I personally worked on, and what I'd do differently.

---

## The Problem We Picked

Small clinics in Pakistan — the kind with one doctor, one receptionist, and a notebook — have a brutal operational problem. The receptionist answers the phone, handles walk-ins, takes notes, and manages a paper appointment book, all at once. The result:

- Double bookings because there's no real-time availability check
- Patients who can't get help after hours
- No-shows because there are no automated reminders
- The same questions asked and answered a hundred times a day: *"Is the doctor available tomorrow?"*, *"What's the consultation fee?"*

We wanted to build something that solved the receptionist overload without requiring the clinic to buy expensive enterprise software.

---

## The Team

| Name | Role |
|------|------|
| Me (Muhammad Zulqarnain) | Project lead, architecture, Docker, chat integration, seeding |
| Sidra Pervaiz | FastAPI backend — models, appointment engine, tests |
| Aleeza Imran | React frontend — UI, design system, page layouts |
| Ayesha Sajjad | AI microservice — Groq NLU, symptom triage, conversation flow |

We split cleanly along service boundaries from day one, which saved us from stepping on each other's code. That was intentional — I've seen group projects fall apart because two people are editing the same file.

---

## What We Shipped

Before I get into the technical details, here's what actually works in the final build:

- Full patient booking flow: symptoms → AI triage → doctor selection → slot confirmation → saved to PostgreSQL
- Groq LLM-powered chat for natural language understanding
- Emergency detection — if you describe chest pain or difficulty breathing, the bot immediately stops the booking flow and tells you to call 1100
- Admin dashboard with live clinic metrics
- Doctor dashboard with appointment management
- JWT auth with refresh tokens, role-based route guards
- Google Calendar sync + 24h/1h email reminders
- Everything containerised in Docker Compose — 5 services, one command to start

![MediBook AI — patient chat booking flow](./images/chat-booking-flow.png)

---

## The Architecture

Three separate services talk to each other:

```
Frontend (React, port 3000)
    ↓ /api  →  Backend API (FastAPI, port 8000)
    ↓ /chat →  AI Service  (FastAPI, port 8001)
                    ↓
               Groq LLM API
                    ↓
               Backend API (to fetch doctors, create appointments)
```

The frontend never talks to the AI service directly for booking — the AI service holds the conversation state and calls the backend API on the patient's behalf, forwarding the JWT so the backend can authorize the appointment creation.

This separation was my call and it was the right one. The AI service can be restarted, scaled, or swapped without touching the backend or frontend. The backend is the source of truth for all data.

![System architecture diagram](./images/architecture.png)

---

## My Part: Architecture, Docker, and Chat Integration

### Docker Compose

Getting five services to start in the right order with the right environment variables and not fight each other is harder than it sounds. The dependency chain is:

```
PostgreSQL → Backend → AI Service → Frontend
```

The backend can't start until the database is healthy. The AI service can't do bookings until the backend is up. I spent half of day one getting the health checks right so `docker compose up -d` just works.

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

The Vite dev server proxies `/api` to the backend and `/chat` to the AI service. This means the frontend uses a single origin — no CORS headaches in development or through dev tunnels.

### The Seed Script

For a hackathon demo, you need data that looks real. I wrote the seed script that populates:

- 3 clinics
- 3 doctors with schedules and holidays
- 3 patients
- 300+ appointments spread across past and future dates

The bulk test mode generates ~19 doctors and 100–150 patients. The reason for two modes: judges want to see a realistic dashboard during the demo, but the test suite needs a lean, predictable dataset.

### Chat Integration

The trickiest part I worked on was wiring the conversation state in the AI service to the actual booking API. The flow has several steps and the patient can drop out at any point:

```
symptoms entered
    → AI asks follow-up questions
    → triage maps symptoms to specialization
    → fetch matching doctors from backend
    → fetch availability for each doctor
    → present options to patient
    → patient selects doctor + slot
    → patient confirms ("yes")
    → POST /api/appointments with patient's JWT
    → return confirmation
```

The hard part is that "yes" needs to be interpreted in context. If the patient hasn't selected a slot yet, "yes" shouldn't trigger a booking. Ayesha built the conversation state machine; my job was making sure the backend calls were correct and the JWT forwarding worked.

![Appointment booking — confirmed in DB](./images/booking-confirmed.png)

---

## The AI Pipeline

Ayesha built this part but I spent enough time debugging it to understand it well.

The AI service uses a two-layer approach: a **keyword pre-router** for obvious cases, and **Groq LLM in JSON mode** for everything else.

```python
# Simplified NLU call
response = groq_client.chat.completions.create(
    model=settings.GROQ_MODEL,
    messages=[{"role": "user", "content": prompt}],
    response_format={"type": "json_object"}
)
intent_data = json.loads(response.choices[0].message.content)
# → { intent, symptoms, confirms, doctor_name, date, ... }
```

The JSON mode forces the model to return structured data, which makes it reliable to parse. The alternative — asking the model to return plain text and parsing it with regex — breaks on edge cases constantly.

The symptom triage is entirely rule-based, not LLM. Symptoms map to specializations via keyword matching:

```python
SYMPTOM_MAP = {
    "chest pain": "Cardiologist",
    "heart": "Cardiologist",
    "sore throat": "ENT Specialist",
    "rash": "Dermatologist",
    ...
}
```

The LLM extracts what the patient said. The rules decide where to route them. This is the right split — LLMs are bad at consistently following routing rules, but good at understanding what a patient means when they describe their symptoms in their own words.

### Emergency Detection

Before anything else, the AI service checks for emergency keywords:

```python
EMERGENCY_KEYWORDS = [
    "chest pain", "can't breathe", "heart attack",
    "stroke", "unconscious", "severe bleeding", ...
]
```

If any match, the bot immediately exits the booking flow and returns emergency contact numbers. This runs before the LLM call — we don't want a 300ms latency on a potential emergency.

![Emergency detection output](./images/emergency-detection.png)

---

## The Backend

Sidra built the core backend. The thing I found most interesting technically was the availability engine.

Computing available slots for a doctor is not trivial:

1. Get the doctor's weekly schedule (which days, what hours)
2. Check clinic holidays for that date
3. Fetch all existing appointments for that day
4. Subtract booked slots from the schedule
5. Respect `max_patients_per_day`
6. Return only future slots

A bug here means double bookings, which is the exact problem we were trying to solve. The backend validates on insert — if two requests race to book the same slot, the second one fails with a 409 and the AI service handles it gracefully.

### The Database

9 tables. The key ones:

```
users → patients / doctors (one-to-one via user_id)
clinics → doctors (one-to-many)
doctors → appointments (one-to-many)
patients → appointments (one-to-many)
appointments → prescriptions (one-to-one)
```

All PKs are UUIDs. Appointments carry `google_calendar_event_id`, `reminder_sent_24h`, and `reminder_sent_1h` fields — the scheduler background task reads these to know what reminders still need to go out.

![Admin dashboard — live clinic metrics](./images/admin-dashboard.png)

---

## What Actually Broke

**Day 2 — JWT forwarding.** The AI service was making backend calls without the patient's token, so appointments were being created without an authenticated user. Fixed by extracting the token from the incoming chat request and forwarding it as a header on every outbound backend call.

**Day 3 — conversation state.** The AI service stores conversation state in memory (a Python dict keyed by `conversation_id`). During development we kept restarting the container and losing state mid-conversation. Not a bug, just an annoying workflow issue. Production fix is Redis or PostgreSQL — we ran out of time.

**Day 4 — the seed script and test isolation.** The test suite was running against the same database as the seeded data, which made test counts unpredictable. Fixed by making tests use an in-memory SQLite instance via `tests/conftest.py` while the seed targets PostgreSQL.

**Day 5 — Docker build times.** Cold builds were taking 4–5 minutes because `pip install` was running every time. Fixed with proper layer ordering — copy `requirements.txt` and install dependencies before copying application code, so the dependency layer is cached unless requirements change.

```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt   # cached layer
COPY . .                                              # only this busts cache
```

---

## What I Learned

**Split services by responsibility from day one.** When the backend, AI service, and frontend have clean contracts (REST APIs with Pydantic schemas), three people can work in parallel without conflicts. We merged with zero major integration bugs on day 5.

**Rule-based triage + LLM NLU is better than LLM-only.** Asking the LLM to both understand *and* route is unreliable. Use the LLM for what it's good at — understanding messy natural language — and keep the routing logic deterministic.

**Seed data is a first-class feature for demos.** A blank database kills a hackathon demo. I should have written the seed script on day one, not day three.

**Docker layer caching is worth five minutes of thought.** Five minutes understanding `COPY requirements.txt` before `COPY .` saved us hours of waiting.

**In-memory state is fine for an MVP.** We shipped. Persisting chat sessions to Redis is a post-hackathon problem.

---

## Screenshots

![Patient login page](./images/patient-login.png)
![AI chat — symptom triage in action](./images/chat-booking-flow.png)
![Booking confirmed — patient dashboard](./images/booking-confirmed.png)
![Admin dashboard](./images/admin-dashboard.png)
![Doctor dashboard](./images/doctor-dashboard.png)
![Emergency detection response](./images/emergency-detection.png)
![System architecture](./images/architecture.png)

---

## Repo & Demo

| Link | Description |
|------|-------------|
| [GitHub — MediBook AI](https://github.com/Mzaq1559/MEDIBOOK_AI) | Full source — backend, frontend, AI service, Docker |
| [Alibaba Cloud Hackathon Pakistan 2026](https://github.com/Mzaq1559/MEDIBOOK_AI) | Event page |

**Demo credentials (local setup):**

| Role | Email | Password |
|------|-------|----------|
| Patient | `ali.khan@example.com` | `BulkSeed123!` |
| Doctor | `ahmed.khan@primecare.pk` | `BulkSeed123!` |
| Admin | `admin@medibook.com` | `Admin@123` |

---

## What's Next

Post-hackathon priorities if we keep building this:

1. WhatsApp reminders — needs WhatsApp Business API approval, which takes time
2. Persist chat sessions to Redis so container restarts don't break conversations
3. Urdu/English bilingual NLU — the patients who need this most often communicate in Urdu
4. Multi-clinic admin panel — the current admin view is single-clinic

The core architecture holds for all of these. The hard part of the hackathon was building a working foundation fast. That part is done.