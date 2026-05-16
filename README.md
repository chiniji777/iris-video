# iris-video (Prism 🌈)

> AI-first programmatic video compositor — combines the strongest points of
> [HyperFrames](https://github.com/heygen-com/hyperframes) (HTML/CSS authoring,
> agent-friendly, filler-word auto-cut) and [Remotion](https://www.remotion.dev/)
> (React composition, transitions, serverless render).

```
YAML spec ─► Zod validation ─► React composition ─► Remotion bundle ─► MP4
                                                     │
                                                     └─ Lambda / Cloud Run (planned)
```

## Why both?

| from HyperFrames | from Remotion |
|---|---|
| Plain HTML/CSS scenes (designer-friendly) | `<Sequence>` / `<OffthreadVideo>` composition |
| AI-agent first authoring | 7 built-in transitions |
| Filler-word + silence auto-cut | Mature ecosystem + cloud render |
| Deterministic | React tooling |

## Quick start

```bash
bun install
bun src/cli.ts validate examples/hello-iris.yaml
bun src/cli.ts render examples/hello-iris.yaml --output out/hello-iris.mp4 --verbose
```

Studio preview (live edit):

```bash
bun run preview
```

## YAML DSL

```yaml
title: my-video
width: 1920
height: 1080
fps: 30

scenes:
  - type: title
    durationFrames: 90
    text: "Hello world"
    subtitle: "subtitle text"
    background: "#1a1a2e"
    color: "#ffffff"
    fontSize: 96
    transition: { type: fade, durationFrames: 15 }

  - type: video
    durationFrames: 300
    src: ./clips/raw.mp4
    trim: { startSec: 2, endSec: 12, autoFiller: true }
    volume: 1

  - type: image
    durationFrames: 60
    src: ./assets/logo.png
    fit: cover

  - type: html
    durationFrames: 120
    background: "#0f0f23"
    css: ".card { padding: 32px; background: #a78bfa; border-radius: 24px; }"
    html: '<div class="card">Any HTML lives here</div>'
```

### Scene types

- **`title`** — text + optional subtitle on a solid background
- **`video`** — clip with optional trim + auto-filler removal
- **`image`** — single image, `cover` / `contain` / `fill`
- **`html`** — arbitrary HTML + scoped CSS (HyperFrames-style authoring)

### Transitions

`fade`, `slide`, `wipe`, `flip`, `clock-wipe`, `none`. Configure per-scene with
`transition.type` and `transition.durationFrames`.

## Filler-word auto-cut

Set `trim.autoFiller: true` on a video scene. The renderer will:

1. Extract 16kHz mono audio via `ffmpeg`
2. Transcribe with `whisper-cli` (preferred, local) or OpenAI Whisper API
   (fallback, requires `OPENAI_API_KEY`)
3. Drop `เอ่อ`, `อ่า`, `อืม`, `um`, `uh`, `like`, plus silences longer than
   `silenceThresholdSec` (default 0.8s)
4. Emit kept segments — the compiler splits the video into N sub-sequences

The detection logic lives in `src/effects/filler-cut.ts` and is fully unit-test-friendly
(`detectKeepSegments(words[], threshold)` is pure).

## CLI

```
iris-video render <spec.yaml> [--output path.mp4] [--verbose] [--concurrency n]
iris-video validate <spec.yaml>
```

## Project layout

```
src/
├── dsl/
│   └── schema.ts          # Zod schema + types
├── compiler/
│   ├── scenes.tsx         # one component per scene type
│   ├── transitions.tsx    # fade/slide/wipe/flip overlays
│   └── composition.tsx    # root composition (Sequence wiring)
├── effects/
│   └── filler-cut.ts      # Whisper transcribe + filler/silence detection
├── remotion-entry.tsx     # registerRoot for Remotion
├── render.ts              # bundle + selectComposition + renderMedia
└── cli.ts                 # commander CLI

examples/
└── hello-iris.yaml        # demo: title + html grid + outro
```

## Status

**v0.1.0 — MVP Phase 1** (this commit)

- [x] DSL schema (Zod)
- [x] DSL → Remotion compiler
- [x] Title / video / image / html scenes
- [x] fade / slide / wipe / flip transitions
- [x] CLI (`render`, `validate`)
- [x] Bundle + render pipeline (h264 MP4)
- [x] Filler-word + silence auto-cut (Whisper)

**Roadmap Phase 2**

- [ ] Remotion Lambda render (AWS)
- [ ] Claude Code skill (`/iris-video`)
- [ ] Iris brand preset (rainbow theme)
- [ ] LINE / Telegram delivery integration
- [ ] Multi-track audio mixing
- [ ] Subtitle/caption track from Whisper

## License

MIT — built for the Iris family of agents.
