---
title: Building AutoSolver — A Delivery Dispatch Simulator for the Meituan Hackathon
slug: building-autosolver-delivery-dispatch-simulator
date: 2026-05-17
excerpt: A one-week hackathon build of a delivery dispatch simulator with a React map dashboard and a FastAPI simulation engine, what I had to change to handle 10,000 orders, and what the code does and doesn't optimize.
tags: [FastAPI, React, WebSocket, SQLite, Hackathon, Simulation, Leaflet]
category: Project Log
cover: ./images/cover.png
---

<!-- COVER IMAGE: ./images/cover.png — The owner dashboard on the dark map: driver markers, a few coloured routes and the stats bar at the top. Used as the hero image. -->

## What this was

AutoSolver was my entry for Track 04 (delivery dispatch optimisation) of the Meituan 2026 International AI Hackathon. The idea was a simulated food-delivery city: orders arrive, drivers get assigned, and an owner dashboard shows what's happening on a map in real time. The repo history runs from May 11 to May 17, and the first working prototype is the May 17 commit.

The stack is React with TypeScript, Leaflet and Recharts on the frontend, and FastAPI with SQLAlchemy and SQLite on the backend. A teammate wrote the SQLite order service and the assignment API (that came in as PR #1); the frontend and the simulation loop are in my commits.

## The order things happened in

The frontend came first. May 11 was project setup and getting a map on the screen (and fixing the first CORS error). Then a landing page, then login/register and separate driver, customer and owner pages. The backend, auth and dashboards followed, and on May 16 the simulation engine and WebSocket updates went in.

One small thing shows how early it started. The first seeded drivers in the backend were three hardcoded ones in Lahore, and the map was centred on Lahore. A commit on May 16 is titled "Standardizing Map Coordinates to Xinzhou", because the hackathon dataset was a city in Shanxi, China. The data generator creates Xinzhou coordinates with Chinese names and addresses, and the seeded drivers in `main.py` are now Xinzhou coordinates too. The README currently says the simulation is set in Lahore, which doesn't match the code, so treat the code as the truth.

<!-- IMAGE: ./images/owner-dashboard.png — Screenshot of the owner dashboard with the simulation running: map with clustered driver markers over Xinzhou, the stats bar, the simulation controls (play/pause/speed) and the charts panel. Place it here, after the paragraph about the dataset, so the reader knows what the map is showing. -->

## What the simulation actually does

The generator script produces 50 restaurants, 5,000 customers, 100 drivers and 10,000 orders, all scheduled inside one simulated hour (12:00 to 13:00 on 2026-06-01) with a triangular distribution that peaks at 12:30. Estimated delivery times are clamped between 15 and 45 minutes.

The engine (`simulation_engine.py`) ticks once per real second, and each tick advances the clock by `speed_multiplier` simulated seconds (12 by default). One tick does this, in order:

1. move orders whose scheduled time has arrived to `pending`
2. assign pending orders to drivers
3. move busy drivers towards their next target (pickup, then drop-off)
4. complete deliveries whose time has passed
5. randomly put about 15% of busy drivers "in traffic" (half speed and a 5–15 minute delay added to their ETAs)
6. commit, then broadcast the state to the dashboard

Step 2 is the part the track was about, and I should be honest about it: the assignment is greedy nearest-driver by haversine distance. There's a second greedy assigner too, the manual `/assignments/run` endpoint, which scores drivers by distance to pickup and respects their capacity. Its name, `fallback_assign_orders`, tells you how I thought of it. An earlier version of that code had a comment describing it as a temporary baseline until a final optimisation algorithm replaced it. I've read the engine and `main.py`, and neither has anything beyond greedy assignment. So this is a dispatch *simulator* with a simple baseline policy. It doesn't do batching, route planning across multiple orders, or anything you could call optimisation.

There are a couple of things I'd check if I came back to it. The assignment loop re-queries the available drivers for every pending order, and the stats query runs on every tick. I haven't measured either, but they're the obvious places for it to get slow.

## 10,000 orders made the dashboard fall over

Rendering 10,000 orders and 100 drivers on a live map was the first serious performance problem. A commit on May 16 called "Optimizing Frontend for 10k Orders" was my first attempt:

- **Map markers:** only markers inside the current map bounds are drawn, with the bounds update debounced by 500 ms, and clustering with chunked loading
- **Routes:** only the 100 routes nearest the map centre are drawn
- **Orders list:** a virtualised list with `react-window`, plus search and status filters
- **Charts:** the stats history is only updated every two seconds
- **Payload:** at the time, coordinates were rounded to five decimals and the Socket.IO message was compressed
- **Orders endpoint:** that version of `GET /orders` touched each order's customer, restaurant and driver one by one in a loop. The current version eager-loads them with `joinedload`, which is the standard fix for that pattern.

Two things about that commit are worth being honest about. First, the state message got an `is_delta` flag, but nothing computes a delta (the flag is just `not full`), so it still sends the full state each time. Second, `react-window` is still in `package.json`, but it isn't used in `OrdersPanel.tsx` any more. That component is a plain scrolling list with the filters. I don't have a note on why the virtualised list went away. The repo installed `react-window` 2.x while the code was written against the older `FixedSizeList` API, which may be the reason, but that's a guess.

The way state gets pushed to the browser also changed. The May 16 version used a Socket.IO server in `main.py`. The current `main.py` has no Socket.IO at all, only a plain `/ws` endpoint that sends the full state every two seconds per connected client, while the engine separately broadcasts each tick through its own connection manager. That's two push paths for the same state, and I haven't checked which one the current dashboard listens to.

## The bugs with boring names

The rest of May 16–17 has a run of commits with names like "Fixing Pydantic Schema Mismatches", "Fixing OrdersPanel And WebSocket", a Recharts responsive fix, a driver dashboard coordinates fix, and "Replacing Owner Dashboard Polylines". I haven't opened the diffs for all of these, so I won't invent stories for them. One thing I can see in the data: the generated JSON uses field names like `current_lat` and `delivery_lat`, while the database models use `lat` and `dropoff_lat`. That's exactly the kind of gap a schema-mismatch fix has to close.

One shortcut is still in the code: registration stores the password as given in a field called `password_hash`, and login compares plain text. An earlier version had a comment saying "in a real app, use hashing". Fine for a hackathon prototype, not something to copy.

<!-- IMAGE: ./images/dispatch-flow.png — Diagram of one simulation tick: scheduled orders → pending → nearest-driver assignment → driver movement → delivery completion, with the arrow from the FastAPI engine to the React dashboard over WebSocket. Place it after the tick list above. -->

## What I'd take from it

- A map with thousands of live objects needs a plan for what *not* to draw. Filtering by bounds and capping routes helped, and I know the virtualised list didn't survive.
- Decide on the dataset and the coordinates on day one. Moving from Lahore to Xinzhou halfway through touched the seed data, the map centre and the driver coordinates.
- Say what a system does. This one simulates a dispatch policy; it doesn't optimise one yet.

## Repo

| Link | Description |
|------|-------------|
| [GitHub: Autosolver-dispatch](https://github.com/Mzaq1559/Autosolver-dispatch) | React dashboard, FastAPI simulation engine, data generator |
