---
name: study-notes-split
description: Build a YouTube study-notes web app with a split-screen layout (video right, notes left), auto-pause on typing, timestamped notes, and markdown export. Use when scaffolding or extending the "study-tube-clone" project.
---

# Study Notes (Split-Screen) — Build Spec

## What this is

A single-page web app: paste a YouTube URL → video loads on the RIGHT →
note-taking panel on the LEFT, side by side (not stacked). Typing a note
auto-pauses the video. Each note can be stamped with the current video
timestamp. Notes export to a `.md` file with clickable timestamp links.

This is a rebuild of study-tube.moonbase.ltd's *concept*, with one explicit,
deliberate layout change: two-column split instead of vertical single-column.
Do not copy their vertical layout under any circumstance — the two-column
split is the entire point of this rebuild.

## Non-negotiable requirements

1. **Layout**: CSS grid, two columns, desktop-first.
   - Left column (~40%): notes panel.
   - Right column (~60%): video player, sticky/fixed height so it never
     scrolls out of view while the user scrolls notes.
   - Below `768px` viewport: stack video on top, notes below (video first,
     since that's the reference point).
2. **No backend, no auth, no paid API.** Client-side only. Persist state to
   `localStorage`. This is a personal tool, not a SaaS product — don't add
   accounts, don't add a database, don't add a paid transcription API.
3. **YouTube IFrame Player API** (free, no API key required for embed +
   playback control) — NOT youtube-dl, NOT scraping, NOT a paid API. Load
   `https://www.youtube.com/iframe_api` and use `YT.Player` with
   `playerVars: { rel: 0 }`.

## Core features

### 1. Session start
- Input field: paste a YouTube URL (accept both `youtube.com/watch?v=` and
  `youtu.be/` short links — write a regex that extracts the 11-char video ID
  from both).
- Optional: a "study goal" text field, shown above the notes panel for the
  session (plain text, no gamification, no streaks — keep it simple).
- On submit, extract video ID, mount the IFrame player on the right column.

### 2. Auto-pause on typing (get this right, it's the core UX)
- Do NOT pause on every keystroke — this creates a jarring, unusable
  experience where the video stutters constantly.
- Correct behavior:
  - On the FIRST keystroke in the note textarea after the video was
    playing, call `player.pauseVideo()` once.
  - Track a "typing active" state. Reset a debounce timer (~2.5s) on every
    keystroke.
  - Do NOT auto-resume on the debounce timeout — auto-resuming without the
    user asking is worse than not pausing at all (user may still be
    thinking). Only resume when the user explicitly clicks a
    "Resume video" button or presses a keyboard shortcut (e.g. `Ctrl+Enter`
    after finishing a note).
  - If the textarea loses focus (`onBlur`) and is empty, do nothing special.

### 3. Timestamped notes
- A "Stamp current time" button (or auto-stamp: capture
  `player.getCurrentTime()` the moment the user starts typing a NEW note
  block, not on every keystroke).
- Each note is a discrete block: `{ id, timestampSeconds, text, createdAt }`.
- Display each note with its timestamp formatted as `MM:SS` or `HH:MM:SS`,
  and make it clickable — clicking calls `player.seekTo(timestampSeconds)`.
- New note = new block. Use a "+ New note" action rather than one giant
  textarea, so timestamps stay meaningfully attached to specific moments.

### 4. Markdown export
- Export format per note:
  ```
  ## [12:34](https://youtu.be/VIDEO_ID?t=754)
  Note text here.
  ```
- File header should include: video title (fetch via YouTube oEmbed
  endpoint `https://www.youtube.com/oembed?url=...&format=json` — free, no
  key), video URL, study goal (if set), and session date.
- Trigger a client-side download (`Blob` + `URL.createObjectURL`), filename
  like `study-notes-{video-id}-{date}.md`. No server round-trip.

### 5. Persistence
- Save session (video ID, notes, goal) to `localStorage` keyed by video ID,
  so reopening the same video restores prior notes.
- Explicitly tell the user in the UI (small footer text) that notes are
  stored locally in-browser only and will be lost if they clear site data —
  don't let this be a silent surprise.

## Tech stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS.
- No state management library needed — `useState`/`useReducer` +
  `localStorage` is sufficient for this scope. Don't add Redux/Zustand.
- No UI kit required; keep styling deliberate and match the visual standard
  used on the existing `htetko.space` portfolio (clean, no gimmicks —
  no particle backgrounds, no cursor trails, substance over decoration).

## File structure to scaffold

```
app/
  page.tsx                 # landing: URL input + goal field
  study/[videoId]/page.tsx # split-screen study session
components/
  VideoPanel.tsx           # YouTube IFrame wrapper, exposes play/pause/seek
  NotesPanel.tsx           # note list + new-note input
  NoteBlock.tsx            # single timestamped note, clickable timestamp
lib/
  youtube.ts                # ID extraction, oEmbed fetch, IFrame API loader
  storage.ts                 # localStorage read/write helpers
  markdownExport.ts          # build + trigger .md download
```

## Explicit anti-goals (do not build these)

- No accounts/auth.
- No cloud sync/database.
- No paid transcription or AI-summary API calls.
- No vertical single-column layout as the desktop default.
- No auto-resume-after-pause without explicit user action.
- No analytics/tracking scripts.

## Definition of done

- Paste a real YouTube URL → video renders on the right, notes panel on
  the left, both visible without scrolling on a standard 1440px viewport.
- Typing a note pauses the video exactly once per note-writing burst, not
  per keystroke.
- Clicking a note's timestamp seeks the video to that point.
- Export button produces a valid `.md` file with clickable timestamp links
  that jump to the correct second when opened in a browser.
- Reloading the same video URL restores previously saved notes from
  `localStorage`.
