---
title: "Rental Car Management System — A DBMS Lab Project, Twice"
slug: rcms-rental-car-management-system-dbms-lab
date: 2026-06-09
tags: [FastAPI, Python, SQL Server, Docker, DBMS, JavaScript]
category: Project Log
cover: ./images/cover.png
---

## What I Was Building

For my Database Management Systems lab this semester, the assignment was a full-stack system built around a real relational schema — not just a set of SQL exercises, an actual application with a backend and a UI sitting on top of a database. I picked a car rental system: branches, vehicles, customers, reservations, and invoices. It sounds like a simple CRUD app until you get to the part where a vehicle can't be booked twice for overlapping dates and every reservation needs to produce a correct tax-inclusive invoice automatically.

Stack: **FastAPI** backend, **vanilla HTML/CSS/JS** frontend (no framework — the lab requirements didn't call for one and I didn't want to spend the time budget on tooling instead of the database work), and a SQL Server database running in Docker, connected from Python via `pyodbc`.

<!-- IMAGE: RCMS dashboard/vehicles tab showing the fleet list with status filters -->

---

## First Build: PostgreSQL, Then a Restart

I actually built the first version of this against **PostgreSQL**, since that's what I'd used before and it's what most tutorials default to. Schema, seed data, and the FastAPI routes were all written and working against Postgres.

Then it became clear the lab specifically wanted SQL Server — which, fair, that's the DBMS actually being taught in the course. So partway through I went back and rewrote the schema and every database-facing query for MSSQL and `pyodbc` instead of `psycopg2`. Not a small change: MSSQL and Postgres disagree on things I hadn't had to think about before — identity/auto-increment syntax, quoting rules, and how you get the ID of a row you just inserted. That last one turned into the actual debugging story of this project.

Looking back at the migration commit (June 9), the mechanical changes were bigger than that list suggests. `%s` placeholders became `?`, `SERIAL` became `INT IDENTITY(1,1)`, `BOOLEAN` became `BIT`, `NOW()` became `GETDATE()`, `||` string concatenation became `+`, and `JOIN ... USING (...)` had to be rewritten as explicit `ON` joins. The old code also relied on psycopg2's `RealDictCursor` to get rows back as dictionaries. `pyodbc` returns plain rows, so I wrote two small helpers, `row_to_dict` and `rows_to_list`, that build the dictionaries from `cursor.description`. The `with get_conn() as conn` blocks became `try/finally` with an explicit `conn.close()`.

The same commit also introduced a mismatch. The new schema file split `customers.full_name` into `first_name` and `last_name` and renamed `invoices.issued_at` to `created_at`, while `main.py` in that commit still used the old names. The next three commits removed the old schema and seed files, added an MSSQL seed and updated the schema. The current `main.py` uses `full_name` and `issued_at` again, so the final schema evidently went back to those names. I haven't opened `schema_mssql.sql` to check it line by line.

---

## The Bug: Getting the ID Back After an INSERT

When you create a reservation, the API needs the new reservation's ID immediately afterward — to generate the invoice in the same request. In Postgres this is a non-issue (`RETURNING id`). In SQL Server, the equivalent is `SCOPE_IDENTITY()`, and the first version I wrote wasn't returning what I expected.

The problem was scoping. `SCOPE_IDENTITY()` returns the last identity value inserted **in the current scope** — but depending on how the insert and the follow-up SELECT were structured through `pyodbc`, that scope wasn't always what I assumed it was, and I'd occasionally get back `NULL` or the wrong row's ID instead of the reservation I'd just created.

In the migration commit itself, `RETURNING *` was replaced with a second query after the commit: `SELECT * FROM reservations WHERE reservation_id = SCOPE_IDENTITY()`. My reading of why that misbehaved is that `pyodbc` sends each `execute()` as its own batch, and `SCOPE_IDENTITY()` only sees identity values from the batch that did the insert, so a follow-up statement doesn't see the row. I haven't confirmed that with a minimal repro, so treat it as my best explanation rather than a proven one.

The fix was to stop treating "insert" and "get the new ID" as two separate statements and instead use SQL Server's `OUTPUT INSERTED` clause directly on the `INSERT`:

```sql
INSERT INTO Reservations (vehicle_id, customer_id, start_date, end_date, status)
OUTPUT INSERTED.reservation_id
VALUES (?, ?, ?, ?, 'active');
```

`OUTPUT INSERTED.<column>` hands back the row's value as part of the same statement, no separate round trip and no ambiguity about which scope you're reading from. Once I switched every insert-then-read pattern in the backend to this form, the ID mismatches went away.

In the current `main.py`, both inserts (customers and reservations) use `OUTPUT INSERTED.<id>` and read the ID from `fetchone()`. The invoice insert and the vehicle status update then happen before a single `commit()`, so if the invoice insert fails the reservation isn't left behind.

<!-- IMAGE: Swagger/OpenAPI docs (/docs) showing the POST /reservations endpoint and response schema with the returned reservation_id -->

---

## Preventing Double-Booking

The other piece that had to be correct, not just working: two overlapping reservations should never both succeed for the same vehicle. Before inserting a new reservation, the backend checks for any existing active reservation on that vehicle whose date range overlaps the requested one, and rejects the booking if it finds one. The vehicle's `status` column also flips to `rented` on booking and back to `available` on cancellation, so the fleet view in the UI always reflects what's actually bookable without a manual refresh cycle.

Reading it back now, a few things stand out. The vehicle has to be `available` before the overlap check even runs, so a car with a reservation next month can't be booked for the week before it; the status flag and the date-range check overlap in what they do. There's no locking between the check and the insert, so two simultaneous requests could both pass it. And the check that `end_date` is after `start_date` runs after the overlap query instead of before it. None of that matters for a single-user lab demo, but it means "prevents double-booking" is true only under those conditions.

---

## Automated Invoicing

Every reservation generates an invoice in the same transaction: rental days × the vehicle's daily rate for the subtotal, then an 18% tax on top for the total. Doing this at booking time instead of on-demand meant the invoice numbers stayed consistent with the reservation history, which mattered once I started generating the project report and needed the numbers in the report to match what the database actually held.

---

## Building Out the Frontend: the Add Customer Modal

The frontend is one `index.html` file — a single-page app with tabs for Vehicles, Customers, Reservations, and Invoices, talking to the FastAPI backend over `fetch`. Customer registration started as a bare form at the bottom of the Customers tab, which worked but didn't match the rest of the UI. I rebuilt it as a proper modal — same dark theme as the rest of the app, opens on top of the customer list instead of pushing it down the page, and clears/validates its own fields on close. Small change, but it's the difference between something that works for a lab demo and something that feels like part of one coherent app instead of a form bolted onto the end of a page.

<!-- IMAGE: Add Customer modal open over the customer list -->

---

## Seed Data

`sql/seed_mssql.sql` populates the database with branches, 50 vehicles, 100 customers, and a spread of historical reservations — enough that the fleet and invoice views actually look like a system with real usage instead of three test rows, which matters a lot when you're demoing this for a grade.

<!-- IMAGE: Entity-relationship diagram of the final SQL Server schema (locations, vehicles, customers, reservations, invoices, maintenance) with the foreign keys, drawn from the real schema file rather than from memory. Place it here, in the Seed Data section, since it shows what the seed script is populating. -->

---

## Writing the Report

Part of the lab deliverable was a formal project report with an embedded ER diagram. Instead of hand-assembling that in Word, I generated it programmatically using Node.js's `docx` library — same approach I used for a separate MTH603 report later in the semester. Feeding the ERD image and the schema documentation through a script instead of formatting it by hand in Word saved a lot of the tedious part and made it trivial to regenerate if the schema changed.

---

## What I'd Do Differently

Picking the database engine before writing a single line of schema, instead of defaulting to whatever I already knew, would have saved the migration entirely. It wasn't wasted time exactly — rewriting the data layer for MSSQL is what forced me to actually understand `SCOPE_IDENTITY()` versus `OUTPUT INSERTED`, instead of just copying a Postgres pattern that happened to work — but I'd rather learn that lesson on purpose next time, not because I picked the wrong DB first.

The other honest gap: there's no auth on any endpoint. For a lab project graded on the data model and the booking logic, that was an acceptable scope cut. It wouldn't be if this were going anywhere near a real deployment.

One more habit I'd like to drop: the migration commit also contains `backend/.env` and `__pycache__` files, so I'd committed both. It's a local lab database, but that shouldn't become a habit.

---

## Stack

| Piece | Choice |
|---|---|
| Backend | FastAPI + Pydantic |
| Database driver | pyodbc |
| Database | Microsoft SQL Server (Docker) |
| Frontend | Vanilla HTML/CSS/JS, no framework |
| Report generation | Node.js `docx` library |

---

*Source on [GitHub](https://github.com/Mzaq1559/IDBS-Lab_Project)*
