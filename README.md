# SignalLab

An interactive, visual-aided learning site for **Competency 6** of the Sri Lankan
GCE Advanced Level ICT syllabus — *"Explores the data communication and computer
networking technologies to share information effectively."*

Every waveform, topology and schematic on the site is computed live from the same
equations students are asked to use in the paper. There are no pre-rendered
diagrams.

## What's covered

| Level | Topic | Interactive pieces |
|---|---|---|
| **6.1** | Signals and their properties | Wave lab (amplitude / frequency / phase, switchable between a time axis and a distance axis), rotating-phasor phase demo, analog-vs-digital quantiser, `v = f λ` solver with worked problems |
| **6.2** | Signal transmission media | Guided / unguided animations, media catalogue, sorting drill, impairment lab (attenuation, noise, distortion, bandwidth, latency) with a live SNR readout, point-to-point link |
| **6.3** | Encoding digital data | NRZ-L / NRZ-I / Manchester / differential Manchester encoder with a clock lane, baud-vs-bit-rate comparison, clock-drift simulator that produces real bit errors, ASK / FSK / PSK lab, parity workbench |
| **6.4** | PSTN and modems | Switched-circuit and voice-band diagrams, end-to-end modem schematic with a live signal tap at every stage, AM / FM / PM modulation lab, PCM sampling and quantisation |
| **6.5** | Connecting many devices | All-to-all cable-growth demo, bus / star / ring / mesh explorer with packet animation, bus collision simulator with carrier sense, hub-vs-switch frame forwarding |

Each level ends with a set of checkpoint questions. Answers are stored in
`localStorage` only — there is no account and nothing is uploaded.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle into dist/
npm run preview  # serve the built bundle
```

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4** with a token layer in `src/index.css`
- **Canvas 2D** for every visualisation, via a small plotting layer

No charting or animation library: the visualisations are specific enough that a
thin `Plot` helper over Canvas2D is both smaller and more precise than a generic
library.

## How it fits together

```
src/
  lib/
    signal.ts       every equation — waves, line codes, keying, modulation,
                    PCM, impairments, parity, topology maths. Pure functions,
                    so one number drives the trace, the readout and the quiz.
    plot.ts         Plot: data-space drawing over Canvas2D (grid, traces,
                    step waveforms, measurement arrows, direct labels)
    canvas.ts       useCanvas — DPR-correct sizing, ResizeObserver, optional
                    rAF loop that respects prefers-reduced-motion
    theme.tsx       theme choice + the palette bridge that lets canvas read the
                    same CSS custom properties the DOM uses
    progress.tsx    localStorage-backed checkpoint progress
    curriculum.ts   syllabus metadata: outcomes and contents, quoted
  components/       Panel, Slider, Segmented, Toggle, BitTrain, Quiz, Shell,
                    LessonPage — one component vocabulary across all five levels
  lessons/          one file per competency level
```

### Colour

Tokens are authored in OKLCH in `src/index.css`, with light and dark defined
independently rather than by flipping one another.

The five data-series colours (`--s1`…`--s5`) are validated for the lightness
band, chroma floor, colour-vision-deficiency separation across all pairs, and
contrast against the plot surface, in both themes. Because a colour tuned for a
2px stroke on the scope is not the same colour that should carry small UI text,
each hue also has a text-safe step (`--s1-ink`…`--s5-ink`) that clears 4.5:1 on
every panel background. Anything painting a hue onto text goes through
`textInk()` in `src/components/ui.tsx`.

Canvas code never hard-codes a colour. It reads the live custom properties
through `usePalette()`, so a theme switch can't leave a plot on stale colours.

## Checking it

```bash
node scripts/audit.mjs   # needs the dev server running
```

Sweeps every route × both themes × 1440/768/390 px and reports horizontal
overflow, WCAG AA text-contrast failures (OKLCH-aware, alpha-composited),
unlabelled canvases, unnamed buttons, heading structure, and console errors.
Requires `npx playwright install chromium` once.
