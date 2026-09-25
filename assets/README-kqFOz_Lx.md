---
title: Building AutoVision — Vehicle Tracking and Speed Estimation on a CPU
slug: building-autovision-vehicle-tracking-on-a-cpu
date: 2026-09-14
excerpt: A Streamlit app that detects, tracks and estimates the speed of vehicles in traffic video. Most of what I learned came from the playback and timing bugs in the first three days.
tags: [Computer Vision, YOLO, Streamlit, Python, Debugging, Performance]
category: Project Log
cover: ./images/cover.png
---

<!-- COVER IMAGE: ./images/cover.png — One frame from a traffic clip with YOLO boxes, track IDs and speed labels visible (crop it from the running dashboard). Used as the hero image, so pick a frame with several clearly labelled vehicles. -->

## What I wanted to build

I wanted to see how far I could get with a traffic video, YOLO and no GPU: detect vehicles, follow each one across frames, estimate its speed, count them, and show it all live in a dashboard. The stack is Ultralytics YOLOv8 (the small `yolov8n.pt` weights) with ByteTrack through `model.track()`, OpenCV for frames, and Streamlit + Plotly for the UI.

The pipeline is deliberately boring:

```
video → detect + track → speed estimate → analytics (counts, violations) → render → Streamlit
```

Each stage is its own module under `app/`, and the unit tests only cover the pure logic (calibration, speed, direction, counting). CI installs just `pytest` and `pyyaml`, so there's no model download and no video in the tests. The catch, which the README admits, is that the tracker, the renderer and the Streamlit UI have no tests. Several of the bugs below lived in exactly those parts.

I used AI tools a lot on this project. What I want to record here is what the problems actually were and what changed.

<!-- IMAGE: ./images/dashboard.png — Full screenshot of the Streamlit dashboard mid-run: annotated video on the left, metric cards (total, currently visible, avg/max speed, violations) and at least one Plotly chart. Place it here so the reader sees the finished shape of the app before the debugging story. -->

### How the speed number is made

Speed comes from a single calibration: two pixel points and the real-world distance between them give a meters-per-pixel scale. For each tracked vehicle I take how far its foot-point (bottom-centre of the box) moved between frames, multiply by the scale, divide by the time between frames, and average over a window of 5 samples. It's a linear approximation, not a homography, so every speed it shows is approximate. That's in the README too, because it matters.

---

## Sept 13: the video that jumped to the end

The first real problem wasn't detection, it was playback. The commit message says the video looked like it jumped straight to the end. My reading of the code is that the loop pushed each processed frame into the Streamlit placeholder as soon as it was ready, with nothing tying it to the video's own frame rate.

The fix was the obvious one: work out a target interval from the video's FPS (`1 / fps`), measure how long the frame took to process, and sleep for whatever time was left.

## Sept 14: taking the sleep back out

The next day's performance commit deletes that pacing logic again. I don't have a note on the reasoning, so I'll describe what the diff shows instead of pretending I remember it.

The important change is in how time is measured. Speed was being computed from wall-clock time (`time.time()`). If processing is slower than the video, the wall-clock gap between two frames is longer than the gap that actually existed in the video, so a car looks slower than it was. The commit message calls it speed-estimation drift when processing is slower than real time. The fix was to pass a video timestamp (`frame_index / fps`) down into the tracker and analytics, so the speed maths uses video time and doesn't care how fast the CPU is. The staleness check that decides which tracks are still "active" moved to video time as well.

The same commit went after everything else that made the UI heavy:

- metrics, the vehicle table and a diagnostics line refresh every N processed frames (`ui_update_interval`, default 5), while the annotated video frame still updates on every processed frame
- a `frame_skip` option and a separate inference width (`processing_width`), so YOLO can run on a smaller copy of the frame than the one displayed
- the display width cap dropped from 1280 to 960 as a CPU-friendly default
- redundant frame copies in the renderer cleaned up
- sidebar controls for all of it. The config file warns that skipping too many frames can make ByteTrack lose IDs, so `frame_skip` defaults to 0.

The diagnostics line shows processing FPS, processed and skipped frames and the source FPS, which is how I'd measure real throughput. The repo doesn't record any of those numbers.

So the sleep was a fix for how the video *looked*. The timestamp change was the fix for what the numbers *meant*. Those turned out to be two separate problems that I'd first treated as one.

---

## A pile of smaller bugs (Sept 14)

A large commit with the message "modified" (not a great message, I know) fixed several things that only show up once you actually watch the dashboard for a while:

- **Counting.** `total_counted` and the per-type counts now go up when a track is first created. The line-crossing check still runs, but it only sets `counted` and `crossed_zone` flags on the track, so the counting line no longer changes the total. The README still describes line-crossing counting, so it's out of date here.
- **State leaking between runs.** Analytics and the per-track speed estimators are now reset at the start of each run, each run gets a `processing_run_id`, and a timestamp that goes backwards (a restarted video) clears a track's history. This is the Streamlit rerun problem in practice: state that survives when you don't want it to.
- **Calibration after resizing.** The frames are downscaled for display, but the calibration points were in the original resolution. The code now rescales the reference points to the resolution being processed, with a test (1920×1080 down to 960×540 doubles meters-per-pixel).
- **Impossible speeds.** Speeds above 250 km/h, or measured over a gap longer than 1.5 seconds, are thrown away. I'd guess this is mostly ID switches (a new track picking up a different car), but I haven't verified that.
- **Bad FPS values.** Some video sources report an FPS above 120; anything like that now falls back to the default.
- **Trajectory streaks.** The trajectory drawing now skips gaps longer than 0.5 s and jumps longer than 150 px, so one ID switch doesn't draw a line across the whole frame.

---

## The last commit

The most recent commit is titled "Removing Vehicle Trajectory Lines", but the diff is mostly a new Accuracy/Demo processing mode (trajectories are now a sidebar checkbox that defaults to off). In Demo mode the model runs only every N source frames (`inference_interval`), and in between the app redraws the last boxes at interpolated positions so the video looks smooth. Those interpolated boxes are display-only: the code says they're never written back into tracking, speed or counting. Demo mode also caps the thread counts so the machine stays responsive. In Accuracy mode every processed frame goes through the model.

<!-- IMAGE: ./images/performance-controls.png — Screenshot of the sidebar performance settings (processing mode, inference width, inference interval, UI update interval, frame skip) with the diagnostics line visible under the video. Place it after this section; it shows the knobs the whole story led to. -->

---

## Where it stands

- I haven't measured throughput. The README's "5–15 FPS on CPU" is explicitly an estimate, not a benchmark, and the repo has no benchmark results or bundled screenshots.
- The README is behind the code: it doesn't mention the video-timestamp change, the Demo/Accuracy modes or the new counting rule.
- Some wall-clock time is still in there. The snapshots that feed the charts are stamped with `time.time()`, so the charts' time axis isn't video time, and the final UI refresh after the loop falls back to wall-clock time if the video timestamp isn't defined.
- Speed is still a single-scale linear approximation. The README's own list of next steps starts with a proper perspective transform (homography), then data export, a headless CLI, and tests for the tracker and UI.

<!-- IMAGE: ./images/tracking-result.png — A close crop of the annotated video showing several tracked vehicles with IDs, class labels and speed estimates, including one flagged as a violation (red box). Place it here as the concrete result of everything above. -->

What I take from the history is mostly about time: video time and wall-clock time are different things, and a UI that redraws on every rerun can hide that for a while.

## Repo

| Link | Description |
|------|-------------|
| [GitHub: AutoVision](https://github.com/Mzaq1559/autovision-vehicle-intelligence) | Streamlit app, tracker, speed estimator, analytics and tests |
