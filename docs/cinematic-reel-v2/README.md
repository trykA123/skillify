# From signal to certainty

An original Skillify film for developers who use AI coding agents. A red signal moves
through eleven engineering instruments, becomes a connected method, and passes between
four roles. Graphite, machined forms, clear typography, and restrained motion define
the direction. The visual metaphors explain each brief; they are not product screenshots.

The source was created from `skills/*/SKILL.md` and `agents/*.md` at revision `4402a1f`.
No existing reel, showcase asset, or earlier film source was inspected or reused.

## Deliverables

- `skillify-cinematic.mp4`: complete 130-second film, 1920 × 1080, 30fps, stereo sound.
- `player.html`: viewer-controlled playback, English captions, and a readable transcript.
- `preview.mp4`: silent 24-second, 960 × 540 montage of six representative shots.
- `poster.jpg` and `contact-sheet.jpg`: compact still previews.
- `stills/`: each scene, each agent, and every scene boundary from the source renderer.
- `verification/`: decoded film frames, browser screenshots, audio measurements, and reports.

## Render

Requires Node.js, FFmpeg with libx264 and AAC, and a Chromium-compatible browser.
Playwright Core 1.63.0 is pinned. The local render used Helium at
`/opt/helium-browser-bin/helium`.

```bash
cd docs/cinematic-reel-v2
npm install
BROWSER_PATH=/path/to/chromium npm run render
npm run verify
BROWSER_PATH=/path/to/chromium node browser-check.mjs
```

The exact commands used in the provided environment were:

```bash
cd /mnt/Sabrent/homelab/skillify-cinematic-reel/docs/cinematic-reel-v2
PLAYWRIGHT_MODULE=/tmp/musique-audit-2026-09-30/node_modules/playwright-core/index.mjs node render.mjs
node verify.mjs
PLAYWRIGHT_MODULE=/tmp/musique-audit-2026-09-30/node_modules/playwright-core/index.mjs node browser-check.mjs
```

`PLAYWRIGHT_MODULE` can point to an existing Playwright Core module. Without that
variable, the scripts use the locally installed dependency. `REEL_CACHE` defaults to
`/tmp/skillify-cinematic-v2`. Cached WAV and intermediate video files are not tracked.
`REEL_PORT` defaults to 5921 for rendering and 5922 for browser checks. Both scripts
close their own server and browser when finished. The permitted port range is 5920-5939.

For an inexpensive source-frame pass, run `npm run frames`. For playback:

```bash
python3 -m http.server 5923 --bind 127.0.0.1
```

Open `http://127.0.0.1:5923/player.html`. The source preview at `index.html` provides
manual seeking. It remains static when reduced motion is requested. The finished
film never autoplays and uses native playback controls.

## Source and score

`timeline.mjs` contains the narrative, exact timing, and pointers to every product
brief. `film.mjs` draws deterministic projected geometry, typography, and transitions.
`render.mjs` captures all 3,900 frames, encodes H.264, creates previews, and writes the
captions. `score.mjs` synthesizes the original 48kHz stereo composition: 88 BPM,
evolving harmonic pads, plucked notes, low percussion, air transitions, and a resolved
ending. No samples, external audio, paid service, or generation API was used.

## Verification

`render-stats.json` records render speed, frame count, score events, and final size.
`verification/report.json` records the measured media properties and acceptance checks.
`verification/browser-report.json` records 390px and 1440px player checks, seeking,
playback, caption loading, audio-track decoding, and reduced-motion keyboard seeking.

The verifier decodes every frame at 160 × 90. It measures consecutive-frame luminance
changes and large full-frame brightness reversals. Its thresholds are a pixel change
of at least 51/255 over less than 25% of the frame, and a consecutive mean brightness
change below 10%. This is a reproducible check for the requested lack of flashing and
abrupt full-frame high-contrast changes, not a clinical photosensitivity certification.

Sound is mastered toward -16 LUFS and -1.5 dB true peak. The verifier measures the
encoded audio with FFmpeg's EBU R128 analyser and writes a waveform for inspection.
Perceptual listening was unavailable in the text-only rendering environment. The
browser check verifies that an audio track decodes and playback advances.

Measured final outputs:

| Property | Result |
| --- | --- |
| Film duration / frames | 130.000000 seconds / 3,900 |
| Picture | 1920 × 1080 / 30fps / H.264 |
| Film size | 29,020,481 bytes (29.0 MB) |
| Audio | AAC stereo / 48kHz / -14.6 LUFS / -1.5 dB true peak |
| Preview | 24 seconds / 960 × 540 / 806,008 bytes |
| Picture render | 283.91 seconds / 13.74 rendered fps |
| Largest high-contrast changed area | 0.160% between consecutive frames |
| Largest consecutive mean brightness change | 0.408% |
| Large full-frame brightness reversals | 0 |

Decoded contact sheets cover every scene, each agent role, and all sixteen scene
transitions. The waveform and all five browser screenshots were visually inspected.

## Fonts and rights

The film geometry, motion, words adapted from the product briefs, and synthesized
score are original to this deliverable. No third-party footage, photographs, or samples
are included. Bundled fonts retain their own SIL Open Font License 1.1 terms:

- Rubik: Copyright 2015 The Rubik Project Authors. See `fonts/Rubik-OFL.txt`.
- JetBrains Mono: Copyright 2020 The JetBrains Mono Project Authors. See `fonts/JetBrainsMono-OFL.txt`.

## Shot map

| Time | Subject |
| --- | --- |
| 0:00-0:16 | Power becomes a method |
| 0:16-0:22 | orientify: a real path through a lattice |
| 0:22-0:28 | undumbify: uncertain signals become explicit decisions |
| 0:28-0:34 | researchify: independent sources meet at a lens |
| 0:34-0:40 | traceify: hypotheses converge on a cause |
| 0:40-0:46 | audify: a scanning plane measures a condition |
| 0:46-0:52 | shapeify: an exploded plan aligns its dependencies |
| 0:52-0:58 | promptify: an aperture fits outcome, scope, and stop rules |
| 0:58-1:06 | shipify: assembly reaches a verified result |
| 1:06-1:12 | reviewify: inspection produces one verdict |
| 1:12-1:18 | releaseify: rollout retains a rollback path |
| 1:18-1:24 | teachify: understanding grows through practice |
| 1:24-1:36 | Eleven disciplines form a connected method |
| 1:36-1:50 | Scout, researcher, worker, and reviewer pass the signal |
| 1:50-2:00 | Intent, evidence, and judgment |
| 2:00-2:10 | Skillify resolves into its final statement |
