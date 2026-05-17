---
name: iris-video
description: AI-first programmatic video compositor. Use when the user asks you to assemble, render, or generate a video from text/images/clips — anything from a course-video edit, a daily review reel, a data-visualisation, or a multi-scene composition. Combines HyperFrames-style HTML/CSS scenes with Remotion's React composition engine. Drives the CLI at ~/ghq/github.com/chiniji777/iris-video; you author a YAML spec and `bun src/cli.ts render <spec.yaml>` produces an MP4. Includes optional Whisper-based filler-word + silence auto-cut for raw footage.
---

# iris-video — programmatic video compositor

`iris-video` (codename **Prism 🌈**) turns a YAML spec into an MP4 by compiling
it through Remotion. It blends two strengths:

- **HyperFrames-style** — write plain HTML/CSS for scenes that are heavy on
  text, data, motion graphics, charts, dashboards. AI-agent-friendly because
  any LLM can already write HTML.
- **Remotion-style** — `<Sequence>` composition, transitions, `<OffthreadVideo>`
  for real footage, h264 render via headless Chrome, optional Lambda for cloud
  scale.

The CLI lives at `~/ghq/github.com/chiniji777/iris-video`. Repo:
<https://github.com/chiniji777/iris-video>.

## When to use this skill

Use `iris-video` when the user asks for:

- "Make a video showing X" / "Render a clip with these scenes"
- Trim a raw recording + add captions or branding
- Daily/weekly review reel for any Iris dashboard (health, finance, garage, …)
- Data-viz video from numbers (chart bars animating)
- Emotional-support video (image + voiceover + soft motion)
- Course intro/outro for math-draft / pd-erp / garage demos
- Any "convert this list of clips/images/text into one MP4"

**Do not** use this skill when:

- The user wants a true non-linear editor (Premiere/FCP) experience — refer
  them to GarageBand/Premiere instead
- The user is recording a screen demo — use `iris-record` (sibling skill)
- The user wants to *stream* — render is offline-only

## Invocation

After `bash skill/install.sh` (or `bun link` in the repo), the CLI is on PATH
globally — call it from any directory:

```bash
iris-video validate <spec.yaml>                      # syntax check only
iris-video render <spec.yaml> -o <out.mp4> --verbose # render to mp4
iris-video --help
```

If `iris-video` is not on PATH (skill installed but bun link skipped), fall
back to:

```bash
bun ~/ghq/github.com/chiniji777/iris-video/src/cli.ts render \
  /path/to/spec.yaml --output /tmp/iris.mp4 --verbose
```

## Authoring workflow

1. **Plan the scenes** with the user — what visuals, what duration, what order.
2. **Write the YAML spec** in a `/tmp/iris-video-<slug>.yaml` (or beside the
   project that the video is about). Use the schema below.
3. **Validate** — run `iris-video validate <spec.yaml>`. Fix any Zod errors.
4. **Render** — `iris-video render` to an MP4 the user can open. Default fps 30,
   resolution 1920×1080.
5. **Deliver** — if the user wants it on Telegram/LINE, attach the MP4 via the
   existing `telegram-reply.ts` `--file` flag or `nutline-send.ts`.

## YAML schema (cheat-sheet)

```yaml
title: my-video                    # used in studio preview
width: 1920                        # default 1920
height: 1080                       # default 1080
fps: 30                            # default 30
background: "#000000"              # fallback bg

scenes:
  - type: title                    # text on solid colour
    durationFrames: 90             # 3s @ 30fps
    text: "Hello"
    subtitle: "optional"
    background: "#1a1a2e"
    color: "#ffffff"
    fontSize: 96                   # px
    fontFamily: "Sarabun, system-ui, sans-serif"
    transition: { type: fade, durationFrames: 15 }

  - type: video                    # real footage
    durationFrames: 300            # 10s
    src: ./clips/raw.mp4           # local path or http(s) URL
    trim: { startSec: 2, endSec: 12, autoFiller: false }
    volume: 1                      # 0..2
    muted: false

  - type: image                    # still image
    durationFrames: 60
    src: ./assets/logo.png
    fit: cover                     # cover | contain | fill
    background: "#000000"

  - type: html                     # HyperFrames-style scene
    durationFrames: 120
    background: "#0f0f23"
    css: |
      .card { padding: 32px; background: #a78bfa; border-radius: 24px; }
    html: |
      <div class="card">
        <h1>Any HTML inside</h1>
        <p>Designer-friendly · AI-agent-friendly</p>
      </div>
```

### Transitions

Per-scene `transition: { type, durationFrames }`. Types: `fade`, `slide`,
`wipe`, `flip`, `clock-wipe`, `none`. Defaults to `none`. Transitions apply
on enter AND exit for the scene (fade-in over first N frames, fade-out over
last N frames).

### Motion presets (v0.3 — 30 presets)

Per-scene `motion: <preset>` or `motion: { preset, intensity, delayFrames, durationFrames }`.

**Entrance** (one-shot): `pop-in` · `bounce-in` · `elastic-in` · `slide-up` ·
`slide-down` · `slide-left` · `slide-right` · `zoom-in` · `zoom-out` ·
`blur-in` · `rotate-in` · `flip-x` · `flip-y` · `swing-in` · `spin-in` ·
`drop-in`

**Cinematic** (whole-scene): `ken-burns` · `ken-burns-reverse`

**Loop / continuous**: `glow-pulse` · `float` · `breathe` · `tilt-loop` ·
`pulse` · `shake` · `wave` · `drift` · `pendulum` · `shimmer` · `glitch`

**HTML grid stagger** (children animate one-by-one, ~150ms apart):
`cards-stagger` (slide-up) · `cards-cascade` (slide-left + tilt) ·
`cards-zoom-stagger` (scale-up)

**Defaults**: `title` → `pop-in`, `image` → `ken-burns`, others → `none`.

### Background FX (v0.3 — 15 components)

Per-scene `backgroundFx: { ... }`. All deterministic (render-safe), can
combine multiple in one scene. Render order is fixed (gradient → blobs →
particles → overlays → noise).

| Key | Use case | Params |
|-----|----------|--------|
| `gradient` | smooth shifting bg | `colors[], angle, speed` |
| `aurora` | northern-lights blobs | `colors[]` (3+ recommended) |
| `bokeh` | DOF circles drifting | `count, colors[]` |
| `stars` | twinkling stars | `count, color` |
| `sparkles` | floating dust + glow | `count, color` |
| `grid` | cyberpunk lines | `color, spacing, speed` |
| `lightRays` | conic light beams | `color, speed` |
| `waves` | sine waves at bottom | `color, amplitude` |
| `confetti` | falling rectangles | `count, colors[]` |
| `hearts` | rising hearts ♥ | `count, color` |
| `snow` | falling flakes | `count, color` |
| `rain` | slanted rain lines | `count, color` |
| `scanlines` | CRT horizontal lines | `color, spacing` |
| `vignette` | edge darkening | `strength (0–1)` |
| `noise` | film grain | `opacity (0–1)` |

### Showcase reference

`examples/showcase.yaml` renders one short scene per preset/FX (~2 min total)
as a visual reference. Render with:

```bash
cd ~/ghq/github.com/chiniji777/iris-video
bun src/cli.ts render examples/showcase.yaml --output out/showcase.mp4
```

### Filler-word auto-cut

Set `trim.autoFiller: true` on a video scene. Requires either:

- `whisper-cli` on PATH with `WHISPER_MODEL=models/ggml-base.bin` (preferred,
  free, local)
- or `OPENAI_API_KEY` env var (fallback, paid Whisper API)

Drops `เอ่อ`, `อ่า`, `อืม`, `um`, `uh`, `like`, plus silences > 0.8s by default.
Implementation in `src/effects/filler-cut.ts`.

## Brand presets (Iris rainbow theme)

When the video is *for the Iris family* (emotional support, daily reviews,
course videos for พี่นัท), default to:

- background gradient `#1a1a2e → #312e81 → #1e3a8a`
- accent colours: `#a78bfa` (Iris purple), `#38bdf8` (sky), `#f472b6` (pink),
  `#fbbf24` (gold) — five rainbow stops
- font family `Sarabun, system-ui, sans-serif` for Thai
- title fontSize 96, subtitle 0.4× of title
- always include an intro title scene + outro `"— Iris 🌈"` sign-off

## Examples in this skill repo

- `~/ghq/github.com/chiniji777/iris-video/examples/hello-iris.yaml` —
  title + html grid + outro (smoke test)

After rendering, **always open the file** so the user can preview it:

```bash
open out/<name>.mp4
```

## Troubleshooting

- **"Reading from 'node:fs' is not handled"** — webpack tried to bundle a node
  built-in for the browser. Do not import node modules from `remotion-entry.tsx`
  or any file under `src/compiler/`. Read files from `src/render.ts` (Node-side)
  and pass data into the composition through `inputProps`.
- **`OffthreadVideo` deprecation warnings about `startFrom`/`endAt`** — Remotion
  4 renamed them to `trimBefore`/`trimAfter` (already wired in `scenes.tsx`).
- **Render hangs at "Downloading Chrome Headless Shell"** — first-run only,
  ~94 MB. Cached at `~/.cache/remotion`.
- **Thai text doesn't render** — set `fontFamily: "Sarabun, system-ui,
  sans-serif"` and ensure Sarabun is installed (`brew install
  --cask font-sarabun`) or use a Google Fonts `<link>` inside an `html` scene.
- **CPU pegged during render** — pass `--concurrency 2` to limit parallel
  workers (default = CPU cores).

## Delivery integration

Once rendered, you typically want to send the MP4 to the user:

```bash
# Telegram
bun ~/ghq/github.com/chiniji777/iris-oracle/scripts/telegram-reply.ts \
  7841476738 "วิดีโอเสร็จแล้วค่ะพี่นัท 💕" --file out/<name>.mp4

# LINE (via NutLINE — uploads to chat)
NUTLINE_BASE_URL=https://nutline.mytestingserver.tech \
  curl -X POST "${NUTLINE_BASE_URL}/ext-api/chats/<chat_id>/upload" \
  -H "X-API-Key: nl-iris-2026-secret" \
  -F "file=@out/<name>.mp4"
```

## Roadmap (not yet implemented)

- Remotion Lambda render (cloud scale)
- Multi-track audio mixing
- Whisper-driven caption track (auto-burned subtitles)
- Music/SFX library presets
- Stable Diffusion image generation hook for scene assets

If the user asks for any of the above, acknowledge as "Phase 2 / not yet
shipped" and offer a workaround (e.g. pre-render audio, manual subtitle, etc.).
