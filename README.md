# SignalLab

An interactive, visual-aided learning site covering **all twelve competency levels
of Competency 6** of the Sri Lankan GCE Advanced Level ICT syllabus: *"Explores
the data communication and computer networking technologies to share information
effectively."*

Every waveform, topology and schematic on the site is computed live from the same
equations students are asked to use in the paper. There are no pre-rendered
diagrams.

## What's covered

| Level | Topic | Interactive pieces |
|---|---|---|
| **6.1** | Signals and their properties | Wave lab (amplitude / frequency / phase, switchable between a time axis and a distance axis), rotating-phasor phase demo, analog-vs-digital quantiser, `v = f λ` solver with worked problems |
| **6.2** | Signal transmission media | Guided / unguided animations, media catalogue, sorting drill, impairment lab (attenuation, noise, distortion, bandwidth, latency) with a live SNR readout, point-to-point link, simplex / half / full duplex animation, and a multiplexing lab covering TDM, FDM, WDM and CDM |
| **6.3** | Encoding digital data | NRZ-L / NRZ-I / Manchester / differential Manchester encoder with a clock lane, baud-vs-bit-rate comparison, clock-drift simulator that produces real bit errors, ASK / FSK / PSK lab, parity workbench |
| **6.4** | PSTN and modems | Switched-circuit and voice-band diagrams, end-to-end modem schematic with a live signal tap at every stage, AM / FM / PM modulation lab, PCM sampling and quantisation |
| **6.5** | Connecting many devices | All-to-all cable-growth demo, a six-way topology explorer (bus / star / ring / mesh / tree / hybrid) with packet animation, bus collision simulator with carrier sense, hub-vs-switch frame forwarding |
| **6.6** | Media Access Control | MAC address anatomy down to the nibble, scale drawing of an Ethernet frame, ALOHA / slotted ALOHA / CSMA-CD event simulator with live throughput against the theoretical curves, unicast / multicast / broadcast delivery |
| **6.7** | Joining networks into the Internet | Gateway animation, the PAN→WAN size ladder, IPv4 octet explorer with binary, class identifier, subnet calculator with a 32-bit network/host ruler, block splitting with FLSM vs VLSM, private-address checker, static vs dynamic addressing, DHCP DORA walkthrough, VPN tunnelling, packet switching with link failure and congestion loss |
| **6.8** | Transport protocols | Port demultiplexing animation, the three port ranges, TCP-vs-UDP trait comparison, and a delivery race that runs both protocols over the same lossy link |
| **6.9** | Applications on the Internet | DNS hierarchy tree with path tracing, step-by-step recursive resolution, URL anatomy, annotated HTTP request and response, FTP, client–server vs peer-to-peer, and the whole page load traced back through every level |
| **6.10** | Reference models | OSI/TCP-IP layer explorer whose geometry *is* the mapping between the two models, an encapsulation diagram drawn to scale from real header sizes with a live efficiency readout, a nine-step data-flow walkthrough down one stack and up the other, and every networking device placed on the layer ladder |
| **6.11** | Security of communication | Eavesdropping demo, symmetric shift cipher, a working RSA key pair (p=5, q=11) that encrypts and decrypts letter by letter, a signature workbench where altering the message in transit breaks verification, a phishing drill with seven clues to find, a first-match firewall rule tester and a password entropy lab |
| **6.12** | ISPs and home networks | ISP tier hierarchy, the ADSL frequency plan against the 4 kHz voice band, a download-time table computed from size ÷ rate, a NAT translation lab that builds the router's table as you send, and a proxy cache hit/miss demo |

Anything that goes beyond the syllabus (the rotating-phasor view of phase, the
Nyquist limit, RSA's key arithmetic, frame padding) carries a dashed
“Beyond the syllabus” marker, so revision can skip it.

Each level ends with a set of checkpoint questions. Answers are stored in
`localStorage` only; there is no account and nothing is uploaded.

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
    signal.ts       6.1–6.5 equations: waves, line codes, keying, modulation,
                    PCM, impairments, parity, topology maths. Pure functions,
                    so one number drives the trace, the readout and the quiz.
    network.ts      6.6–6.9 and 6.12: MAC address parsing, a discrete event
                    simulation of ALOHA / slotted ALOHA / CSMA-CD, IPv4 and CIDR
                    maths, subnet splitting, DHCP and DNS reference data, access
                    link rates and the NAT rewrites.
    models.ts       6.10: the OSI and TCP/IP layer tables, the mapping between
                    them, and encapsulation computed from real header sizes.
    security.ts     6.11: modular exponentiation and a real (tiny) RSA key
                    pair, signing and verification, a first-match firewall
                    evaluator, password entropy, and the threat reference data.
    plot.ts         Plot: data-space drawing over Canvas2D (grid, traces,
                    step waveforms, measurement arrows, direct labels)
    canvas.ts       useCanvas: DPR-correct sizing, ResizeObserver, optional
                    rAF loop that respects prefers-reduced-motion
    theme.tsx       theme choice + the palette bridge that lets canvas read the
                    same CSS custom properties the DOM uses
    progress.tsx    localStorage-backed checkpoint progress
    curriculum.ts   syllabus metadata: outcomes and contents, quoted
  components/       Panel, Slider, Segmented, Toggle, BitTrain, Quiz, Shell,
                    LessonPage: one component vocabulary across all twelve levels
  lessons/          one file per competency level, each lazily loaded so a
                    student downloads only the level they are reading
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

Sweeps all thirteen routes × both themes × 1440/768/390 px, 78 combinations,
and reports horizontal overflow, WCAG AA text-contrast failures (OKLCH-aware and
alpha-composited), unlabelled canvases, unnamed buttons, heading structure, and
console errors. Requires `npx playwright install chromium` once.

Two layout rules the audit exists to catch, both learned the hard way:

- A grid track that declares its columns only at a breakpoint falls back to an
  implicit `auto` track on mobile, whose minimum is *min-content*, so a wide
  scrollable table inside it pushes the whole page sideways. Every such grid
  carries an explicit `grid-cols-[minmax(0,1fr)]` base.
- Canvas cannot parse `var(--s1)`. A colour it cannot parse is silently ignored,
  leaving the previous fill in place, usually black. Canvas code takes colours
  from `usePalette()`, never from a CSS custom property name.
