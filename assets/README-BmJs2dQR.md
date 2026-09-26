---
title: "Go Assistant: An Android Overlay That Watches a Go Board and Talks to Claude Vision"
slug: go-assistant-android-overlay-claude-vision
date: 2026-03-09
excerpt: A Flutter + Kotlin Android app that screen-captures a Go board, sends it to Claude Vision, and draws the suggested move back over the screen as a floating overlay — plus the foreground-service bugs that showed up six months later.
tags: [Flutter, Kotlin, Android, Claude, Computer Vision, Project Log]
category: Project Log
cover: ./images/cover.png
---

Go Assistant is an Android app that watches whatever Go board is on screen — in another app — and overlays a suggested move on top of it, using Claude's vision capability to read the board rather than a dedicated Go engine. It started as a first/second commit in March 2026 and got a real hardening pass in September.

## Why two languages

The project is Flutter (Dart) for the app-facing UI and Kotlin for the parts that need real Android platform APIs — screen capture, floating overlays, foreground services — because those capabilities aren't available cleanly through Flutter alone. The two sides talk over a Flutter `MethodChannel` (`com.goassistant/overlay`), with Flutter sending commands like `startOverlay`, `stopOverlay`, and `requestScreenCapture` down to a native `OverlayService`.

## The actual pipeline

```
User grants screen-capture permission
    → MediaProjection starts
    → Screen frame captured
    → Bitmap extracted
    → Sent to Claude Vision
    → Structured JSON response (move, win rate, score, reasoning)
    → Rendered by a custom Android View over the screen
```

The AI response is expected as structured JSON — move, board size, column/row fraction (not pixel coordinates, so it survives different screen sizes), win rate, score, reasoning — rather than free text, which is what makes it possible to draw a move marker, a win-rate readout, and a reasoning card directly over whatever app is showing the board.

One deliberate defensive choice: the custom `OverlayCanvasView` clamps and validates the AI's output before rendering it — column/row fractions must fall in 0.0–1.0, win rate in 0.0–1.0, board size in 9–19 — because, as the README puts it directly, AI-generated coordinates can't be blindly trusted as rendering input. A malformed response shouldn't be able to produce an invalid drawing.

## The September hardening pass

The project sat mostly untouched between the March initial commits and a batch of fixes in September, merged as PR #1 with the title "Fix overlay lifecycle and Android foreground service handling," explicitly scoped to stability and Android 14 compatibility. Three real bugs got fixed in that batch:

**1. Duplicate overlay views on service restart.** The original `onStartCommand` always called `addBubble()` and `addOverlayCanvas()` and returned `START_STICKY` — meaning if Android killed and restarted the service (which foreground services are subject to), the overlay views would get added again on top of the existing ones. The fix tracks a `viewsAdded` flag and only creates the views once; a repeat start call now updates state instead of re-adding views, and the service returns `START_NOT_STICKY` instead.

**2. Missing foreground-service type for MediaProjection.** On Android 10+ (API 29, `Build.VERSION_CODES.Q`), starting a foreground service that does screen capture requires declaring `ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION` explicitly:

```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    startForeground(1, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
} else {
    startForeground(1, buildNotification())
}
```

This is exactly the kind of Android-version-specific requirement that works fine on an older test device and silently breaks (or gets rejected outright) on newer OS versions — which lines up with the PR's explicit "Android 14" framing.

**3. Pass/resign incorrectly flipping the turn.** The turn-tracking logic unconditionally flipped `turn` between black and white after every analyzed move:

```kotlin
// before
turn = if (turn == "black") "white" else "black"

// after
if (result.move != "pass" && result.move != "resign") {
    turn = if (turn == "black") "white" else "black"
}
```

A pass or resignation isn't a move that changes whose turn it is (or ends the game), so the unconditional flip was a straightforward game-logic bug rather than an Android-platform one.

The same commit also added an explicit `STOP` action handled by the service (so the notification can cleanly terminate the analysis session) and cleaned up `onDestroy()` to actually release the projection state (`projectionData = null`, `viewsAdded = false`) rather than leaving it stale for the next start.

## What I'd call confirmed vs. not

**Confirmed**, directly from the diffs: the `START_STICKY`-plus-no-flag duplicate-view bug, the missing `FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION` declaration, and the pass/resign turn bug, all fixed in one commit merged as PR #1. **Not confirmed**: what specifically triggered noticing these bugs — whether it was hitting them during testing on a specific Android 14 device, or something else. The commit messages document the fixes, not the incident that led to finding them.

## What I learned

The foreground-service type requirement is a good example of an Android API surface that's easy to miss because it only matters above a specific SDK version — code that "works" during quick testing on an older emulator can still be structurally wrong for what a real device on a current OS version requires. The duplicate-view bug is a different lesson: `START_STICKY` and "the service might restart without a fresh `Intent`" is a real part of the Android service lifecycle that's easy to design around incorrectly the first time, and only shows up once the OS actually kills and restarts the process under memory pressure — not during a clean manual test run.

---

| Link | Description |
|------|-------------|
| [GitHub: Go_Assistant](https://github.com/Mzaq1559/Go_Assistant) | Flutter/Kotlin app, overlay service, Claude Vision integration |
