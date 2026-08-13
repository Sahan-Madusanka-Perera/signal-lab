import { useMemo, useState } from "react";
import clsx from "clsx";
import { Section } from "../components/LessonPage";
import { ScopeCanvas } from "../components/ScopeCanvas";
import { Quiz, type Question } from "../components/Quiz";
import {
  Badge,
  Button,
  Callout,
  Legend,
  Panel,
  Readout,
  Scope,
  Segmented,
  Slider,
  Toggle,
} from "../components/ui";
import {
  MULTIPLEXING,
  MUX_CONS,
  MUX_PROS,
  TAU,
  TRANSMISSION_MODES,
  impair,
  peakOf,
  sampleSum,
  snrDb,
  type Mode,
  type Muxing,
} from "../lib/signal";

export function MediaLesson() {
  return (
    <>
      <GuidedVsUnguided />
      <MediaCatalogue />
      <SortingDrill />
      <ImpairmentLab />
      <PointToPoint />
      <ModesSection />
      <MuxSection />
      <Section id="check" title="Check yourself">
        <Quiz lessonId="media" questions={QUESTIONS} />
      </Section>
    </>
  );
}

/* ================================================================== *
 * 1. Guided vs unguided
 * ================================================================== */

function GuidedVsUnguided() {
  return (
    <Section
      id="guided"
      title="Two families of medium"
      lead="Every transmission medium either confines the signal to a physical path or lets it spread out into the surroundings. That single distinction, guided or unguided, decides most of what follows: who can overhear it, how far it reaches, and how badly it degrades."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
        <Panel title="Guided media: wires" subtitle="The signal is steered along a physical conductor or fibre.">
          <Scope height={116} caption="The wave is confined: it can only go where the cable goes.">
            <ScopeCanvas
              label="A signal confined inside a cable, travelling from left to right"
              animate
              bounds={{ x0: 0, x1: 10, y0: -1.6, y1: 1.6 }}
              insets={{ left: 12, right: 12, top: 10, bottom: 10 }}
              draw={({ plot, ctx, palette, time }) => {
                const yTop = plot.sy(1.15);
                const yBot = plot.sy(-1.15);
                ctx.save();
                ctx.fillStyle = palette.surface;
                ctx.fillRect(plot.left, yTop, plot.plotW, yBot - yTop);
                ctx.strokeStyle = palette.gridMajor;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(plot.left, yTop);
                ctx.lineTo(plot.right, yTop);
                ctx.moveTo(plot.left, yBot);
                ctx.lineTo(plot.right, yBot);
                ctx.stroke();
                ctx.restore();

                const N = 700;
                const d = new Float64Array(N);
                for (let i = 0; i < N; i++) {
                  const u = (i / (N - 1)) * 10;
                  d[i] = 0.8 * Math.sin(TAU * 0.9 * u - time * 3.2);
                }
                plot.trace(d, palette.series[1], { glow: 10 });
                plot.text(plot.left + 6, yTop - 14, "cable wall", palette.inkFaint, { size: 9 });
              }}
            />
          </Scope>
          <ul className="mt-3 grid gap-1.5 text-sm text-ink-2">
            {[
              "Twisted pair (UTP and STP)",
              "Coaxial cable",
              "Optical fibre",
            ].map((x) => (
              <li key={x} className="flex gap-2">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--s2)" }} />
                {x}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Unguided media: free space" subtitle="The signal is radiated and spreads in every direction.">
          <Scope height={116} caption="No physical path: anything in range receives it, wanted or not.">
            <ScopeCanvas
              label="A signal radiating outwards in all directions from an antenna"
              animate
              bounds={{ x0: 0, x1: 10, y0: -1.6, y1: 1.6 }}
              insets={{ left: 12, right: 12, top: 10, bottom: 10 }}
              draw={({ plot, ctx, palette, time }) => {
                const cx = plot.left + 26;
                const cy = (plot.top + plot.bottom) / 2;
                const maxR = plot.plotW - 40;

                ctx.save();
                for (let k = 0; k < 5; k++) {
                  const phase = (time * 0.42 + k / 5) % 1;
                  const r = phase * maxR;
                  ctx.globalAlpha = Math.max(0, 1 - phase) * 0.85;
                  ctx.strokeStyle = palette.series[3];
                  ctx.lineWidth = 1.8;
                  ctx.beginPath();
                  ctx.arc(cx, cy, r, -Math.PI / 2.1, Math.PI / 2.1);
                  ctx.stroke();
                }
                ctx.globalAlpha = 1;
                ctx.strokeStyle = palette.ink;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(cx, cy + 14);
                ctx.lineTo(cx, cy - 14);
                ctx.moveTo(cx, cy - 14);
                ctx.lineTo(cx - 6, cy - 22);
                ctx.moveTo(cx, cy - 14);
                ctx.lineTo(cx + 6, cy - 22);
                ctx.stroke();
                ctx.restore();
              }}
            />
          </Scope>
          <ul className="mt-3 grid gap-1.5 text-sm text-ink-2">
            {["Radio transmission", "Microwave links", "Satellite transmission", "Infrared"].map((x) => (
              <li key={x} className="flex gap-2">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--s4)" }} />
                {x}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Callout kind="exam">
        Guided media are sometimes called <strong>bounded</strong> media and unguided media <strong>unbounded</strong>.
        A common exam trap: the medium is classified by whether the signal is <em>physically guided</em>, not by
        whether the signal is analog or digital. Fibre carries light and copper carries electricity, but both are
        guided.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * 2. Media catalogue
 * ================================================================== */

type MediumCard = {
  id: string;
  name: string;
  family: "guided" | "unguided";
  carries: string;
  bandwidth: string;
  distance: string;
  strengths: string[];
  weaknesses: string[];
  series: number;
};

const MEDIA: MediumCard[] = [
  {
    id: "utp",
    name: "Twisted pair (UTP)",
    family: "guided",
    carries: "Electrical signals on copper",
    bandwidth: "Up to ~1 Gbit/s over 100 m",
    distance: "100 m per run",
    strengths: ["Cheapest cable to buy and terminate", "Flexible and easy to install", "The twist itself cancels much of the interference"],
    weaknesses: ["Attenuates quickly", "Picks up noise more than the alternatives", "Easily tapped"],
    series: 1,
  },
  {
    id: "stp",
    name: "Shielded twisted pair (STP)",
    family: "guided",
    carries: "Electrical signals on copper, inside a foil or braid screen",
    bandwidth: "Similar to UTP",
    distance: "100 m per run",
    strengths: ["Screen keeps external noise out", "Useful near motors and heavy machinery"],
    weaknesses: ["Costlier and stiffer than UTP", "Needs proper earthing to work"],
    series: 1,
  },
  {
    id: "coax",
    name: "Coaxial cable",
    family: "guided",
    carries: "Electrical signals on a central core inside a braided shield",
    bandwidth: "Higher than twisted pair",
    distance: "Hundreds of metres",
    strengths: ["Good noise immunity from the braid", "Was the original bus cable for Ethernet", "Still used for cable television"],
    weaknesses: ["Bulky and harder to bend", "More expensive than twisted pair"],
    series: 3,
  },
  {
    id: "fibre",
    name: "Optical fibre",
    family: "guided",
    carries: "Pulses of light inside a glass core",
    bandwidth: "Extremely high: tens of Gbit/s and beyond",
    distance: "Kilometres without a repeater",
    strengths: ["Immune to electrical noise entirely", "Very low attenuation", "Very hard to tap without detection"],
    weaknesses: ["Most expensive", "Fragile; splicing needs skill and equipment"],
    series: 2,
  },
  {
    id: "radio",
    name: "Radio and microwave",
    family: "unguided",
    carries: "Electromagnetic waves through the air",
    bandwidth: "Shared between everyone in range",
    distance: "Metres to tens of kilometres",
    strengths: ["No cable to lay", "Mobility", "Reaches places cable cannot"],
    weaknesses: ["Interference from other transmitters", "Blocked or weakened by walls and weather", "Anyone in range can receive it"],
    series: 4,
  },
  {
    id: "satellite",
    name: "Satellite",
    family: "unguided",
    carries: "Microwaves relayed via a spacecraft",
    bandwidth: "Moderate, shared",
    distance: "Intercontinental",
    strengths: ["Covers oceans and remote regions", "One hop reaches an enormous area"],
    weaknesses: ["Very high latency: the signal travels ~72 000 km", "Expensive", "Affected by heavy rain"],
    series: 4,
  },
];

function MediaCatalogue() {
  const [openId, setOpenId] = useState<string>("utp");
  const open = MEDIA.find((m) => m.id === openId)!;

  return (
    <Section
      id="cables"
      title="The media in detail"
      lead="Pick one to see what it carries, how much it can carry, and what it costs you."
    >
      <Panel bodyClassName="p-0">
        <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[236px_minmax(0,1fr)]">
          <ul className="border-b border-line lg:border-r lg:border-b-0" role="tablist" aria-label="Transmission media">
            {MEDIA.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={m.id === openId}
                  onClick={() => setOpenId(m.id)}
                  className={clsx(
                    "flex w-full items-center gap-2.5 border-b border-line px-4 py-2.5 text-left transition-colors last:border-b-0",
                    m.id === openId ? "bg-surface-2" : "hover:bg-surface-2",
                  )}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: `var(--s${m.series})` }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{m.name}</span>
                    <span className="text-2xs text-ink-3">{m.family === "guided" ? "Guided" : "Unguided"}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="p-4" role="tabpanel">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-ink">{open.name}</h3>
              <Badge tone={open.family === "guided" ? "brand" : "neutral"}>
                {open.family === "guided" ? "Guided / bounded" : "Unguided / unbounded"}
              </Badge>
            </div>
            <p className="mt-1 max-w-[64ch] text-sm text-ink-2">{open.carries}</p>

            <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
              <Readout label="Typical bandwidth" value={<span className="text-sm">{open.bandwidth}</span>} />
              <Readout label="Typical reach" value={<span className="text-sm">{open.distance}</span>} />
            </div>

            <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
              <div>
                <p className="text-2xs font-semibold text-ok">Strengths</p>
                <ul className="mt-1.5 grid gap-1.5">
                  {open.strengths.map((s) => (
                    <li key={s} className="flex gap-2 text-sm text-ink-2">
                      <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ok" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-2xs font-semibold text-bad">Trade-offs</p>
                <ul className="mt-1.5 grid gap-1.5">
                  {open.weaknesses.map((s) => (
                    <li key={s} className="flex gap-2 text-sm text-ink-2">
                      <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-bad" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * 3. Sorting drill
 * ================================================================== */

const DRILL_ITEMS = [
  { id: "d1", label: "Cat 6 UTP cable", answer: "guided" },
  { id: "d2", label: "Bluetooth link", answer: "unguided" },
  { id: "d3", label: "Single-mode optical fibre", answer: "guided" },
  { id: "d4", label: "Satellite downlink", answer: "unguided" },
  { id: "d5", label: "TV aerial cable (coax)", answer: "guided" },
  { id: "d6", label: "Wi-Fi in a classroom", answer: "unguided" },
  { id: "d7", label: "Infrared remote control", answer: "unguided" },
  { id: "d8", label: "Telephone drop wire", answer: "guided" },
] as const;

function SortingDrill() {
  const [placed, setPlaced] = useState<Record<string, "guided" | "unguided">>({});
  const remaining = DRILL_ITEMS.filter((i) => !placed[i.id]);
  const correct = DRILL_ITEMS.filter((i) => placed[i.id] === i.answer).length;
  const wrong = DRILL_ITEMS.filter((i) => placed[i.id] && placed[i.id] !== i.answer).length;
  const done = remaining.length === 0;

  const put = (id: string, box: "guided" | "unguided") => setPlaced((p) => ({ ...p, [id]: box }));

  return (
    <Section
      id="sort"
      title="Sorting drill"
      lead="Classify each example. This is the single most commonly asked question on this competency level."
    >
      <Panel
        title="Guided or unguided?"
        subtitle={done ? undefined : `${remaining.length} left`}
        actions={
          <div className="flex items-center gap-2">
            {done && (
              <Badge tone={wrong === 0 ? "ok" : "warn"}>
                {correct} / {DRILL_ITEMS.length} correct
              </Badge>
            )}
            <Button size="sm" onClick={() => setPlaced({})}>
              Reset
            </Button>
          </div>
        }
      >
        <div className="min-h-[52px] rounded-lg border border-dashed border-line-strong bg-surface-2 p-3">
          {remaining.length ? (
            <ul className="flex flex-wrap gap-2">
              {remaining.map((item) => (
                <li key={item.id} className="flex items-center gap-1 rounded-lg border border-line bg-surface pl-3">
                  <span className="py-1.5 text-sm text-ink">{item.label}</span>
                  <span className="flex items-center gap-0.5 border-l border-line py-0.5 pr-0.5 pl-0.5">
                    <button
                      type="button"
                      onClick={() => put(item.id, "guided")}
                      className="rounded-md px-2 py-1 text-2xs font-semibold transition-colors hover:bg-surface-3"
                      style={{ color: "var(--s2-ink)" }}
                    >
                      Guided
                    </button>
                    <button
                      type="button"
                      onClick={() => put(item.id, "unguided")}
                      className="rounded-md px-2 py-1 text-2xs font-semibold transition-colors hover:bg-surface-3"
                      style={{ color: "var(--s4-ink)" }}
                    >
                      Unguided
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-sm text-ink-3">
              {wrong === 0
                ? "All eight sorted, all correct."
                : `${wrong} in the wrong column, the red ones. Reset and try again.`}
            </p>
          )}
        </div>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          {(["guided", "unguided"] as const).map((box) => (
            <div key={box} className="rounded-lg border border-line bg-surface-2 p-3">
              <p
                className="text-2xs font-semibold"
                style={{ color: box === "guided" ? "var(--s2-ink)" : "var(--s4-ink)" }}
              >
                {box === "guided" ? "Guided (wires)" : "Unguided (free space)"}
              </p>
              <ul className="mt-2 grid gap-1.5">
                {DRILL_ITEMS.filter((i) => placed[i.id] === box).map((i) => {
                  const ok = i.answer === box;
                  return (
                    <li
                      key={i.id}
                      className={clsx(
                        "flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm",
                        ok ? "border-ok bg-ok-wash text-ink" : "border-bad bg-bad-wash text-ink",
                      )}
                      style={{ animation: "rise var(--dur) var(--ease-out-quart)" }}
                    >
                      {i.label}
                      <span className={clsx("shrink-0 text-2xs font-semibold", ok ? "text-ok" : "text-bad")}>
                        {ok ? "correct" : `it is ${i.answer}`}
                      </span>
                    </li>
                  );
                })}
                {DRILL_ITEMS.filter((i) => placed[i.id] === box).length === 0 && (
                  <li className="py-2 text-center text-2xs text-ink-3">Nothing here yet</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * 4. Impairment lab: the centrepiece of 6.2
 * ================================================================== */

type Carried = "digital" | "analog";

function ImpairmentLab() {
  const [attenuation, setAttenuation] = useState(0.3);
  const [noise, setNoise] = useState(0.12);
  const [distortion, setDistortion] = useState(0.25);
  const [latencyKm, setLatencyKm] = useState(120);
  const [bandwidth, setBandwidth] = useState(6);
  const [carried, setCarried] = useState<Carried>("digital");
  const [live, setLive] = useState(true);

  const N = 1000;
  const source = useMemo(() => {
    const d = new Float64Array(N);
    if (carried === "digital") {
      const bits = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1];
      for (let i = 0; i < N; i++) {
        const t = (i / (N - 1)) * bits.length;
        d[i] = bits[Math.min(bits.length - 1, Math.floor(t))] ? 1 : -1;
      }
      // A perfect square has infinite bandwidth. Limit it so the "bandwidth"
      // control has something honest to act on.
      return d;
    }
    return sampleSum(
      [
        { amplitude: 0.75, frequency: 1.2, phase: 0 },
        { amplitude: 0.22, frequency: 3.4, phase: 40 },
      ],
      1,
      N,
    );
  }, [carried]);

  /** Bandwidth acts as a hard limit on how sharp an edge can be. */
  const bandLimited = useMemo(() => {
    const k = Math.max(1, Math.round(28 - bandwidth * 2.4));
    const out = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      let s = 0;
      let c = 0;
      for (let j = -k; j <= k; j++) {
        const idx = i + j;
        if (idx < 0 || idx >= N) continue;
        s += source[idx];
        c++;
      }
      out[i] = s / c;
    }
    return out;
  }, [source, bandwidth]);

  const received = useMemo(
    () => impair(bandLimited, { attenuation, noise, distortion }, 7),
    [bandLimited, attenuation, noise, distortion],
  );

  const peak = peakOf(received);
  const snr = snrDb(source, received);
  /** Propagation delay at 2 × 10⁸ m/s, the usual copper/fibre figure. */
  const latencyMs = (latencyKm * 1000) / 2e8 * 1000;
  const readable = peak > 0.28 && (snr === null || snr > 6);

  return (
    <Section
      id="impair"
      title="What the medium does to your signal"
      lead="A medium is never a perfect pipe. Five named effects appear in the syllabus, and each one damages the signal in a different way. Turn them up one at a time and watch which part of the picture suffers."
    >
      <Panel
        title="Impairment lab"
        subtitle="The top trace is what the transmitter sent. The bottom trace is what arrives after the medium has had its way."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              label="Signal carried"
              size="sm"
              value={carried}
              onChange={setCarried}
              options={[
                { value: "digital", label: "Digital" },
                { value: "analog", label: "Analog" },
              ]}
            />
            <Toggle checked={live} onChange={setLive} label="Live noise" />
          </div>
        }
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_248px]">
          <div className="min-w-0">
            <Scope height={132} caption="Transmitted">
              <ScopeCanvas
                label="The clean transmitted signal"
                deps={[carried, bandwidth]}
                bounds={{ x0: 0, x1: 1, y0: -1.5, y1: 1.5 }}
                insets={{ left: 34, right: 60, top: 12, bottom: 14 }}
                draw={({ plot, palette }) => {
                  plot.grid({ yEvery: 0.5, xEvery: 1 / 12 });
                  plot.zeroLine();
                  plot.trace(source, palette.series[2], { width: 2, glow: 8 });
                  plot.yTicks([-1, 0, 1], (v) => `${v}`);
                  plot.text(plot.right + 8, plot.top + 4, "Sent", palette.series[2], { size: 10, weight: 700 });
                }}
              />
            </Scope>

            <div className="my-2 flex items-center gap-2 pl-[34px]">
              <span className="h-px flex-1 bg-line" />
              <span className="text-2xs text-ink-3">
                {latencyKm} km of medium · arrives {latencyMs.toFixed(2)} ms later
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <Scope height={132} caption="Received">
              <ScopeCanvas
                label={`The received signal after attenuation, noise and distortion. It is ${readable ? "still readable" : "no longer readable"}.`}
                animate={live && noise > 0}
                deps={[carried, bandwidth, attenuation, noise, distortion, live]}
                bounds={{ x0: 0, x1: 1, y0: -1.5, y1: 1.5 }}
                insets={{ left: 34, right: 60, top: 12, bottom: 14 }}
                draw={({ plot, palette, time }) => {
                  plot.grid({ yEvery: 0.5, xEvery: 1 / 12 });
                  plot.zeroLine();

                  const shown =
                    live && noise > 0
                      ? impair(bandLimited, { attenuation, noise, distortion }, 7 + Math.floor(time * 14))
                      : received;

                  // Decision threshold: what the receiver must still be able to tell apart.
                  if (carried === "digital") {
                    plot.hLine(0, palette.inkFaint, { dash: [3, 4], alpha: 0.9 });
                    plot.text(plot.left + 6, plot.sy(0) - 14, "decision threshold", palette.inkFaint, { size: 9 });
                  }

                  plot.trace(shown, readable ? palette.series[0] : palette.series[4], { width: 2, glow: 8 });
                  plot.yTicks([-1, 0, 1], (v) => `${v}`);
                  plot.text(
                    plot.right + 8,
                    plot.top + 4,
                    readable ? "Received" : "Unreadable",
                    readable ? palette.series[0] : palette.series[4],
                    { size: 10, weight: 700 },
                  );
                }}
              />
            </Scope>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <Legend
                items={[
                  { color: "var(--s3)", label: "Transmitted" },
                  { color: readable ? "var(--s1)" : "var(--s5)", label: "Received" },
                ]}
              />
              <div className="flex flex-wrap gap-4">
                <Readout
                  label="Amplitude left"
                  value={`${Math.round(peak * 100)}%`}
                  tone={peak > 0.5 ? "ok" : peak > 0.28 ? "warn" : "bad"}
                />
                <Readout
                  label="Signal-to-noise"
                  value={snr === null ? "clean" : `${snr.toFixed(1)} dB`}
                  tone={snr === null || snr > 20 ? "ok" : snr > 6 ? "warn" : "bad"}
                />
                <Readout label="Latency" value={`${latencyMs.toFixed(2)} ms`} sub="propagation only" />
              </div>
            </div>

            <p
              className={clsx(
                "mt-3 rounded-lg px-3.5 py-2.5 text-sm",
                readable ? "bg-surface-2 text-ink-2" : "bg-bad-wash text-ink",
              )}
            >
              {verdict(carried, { attenuation, noise, distortion, bandwidth, readable })}
            </p>
          </div>

          <div className="grid content-start gap-4 lg:border-l lg:border-line lg:pl-4">
            <ImpairmentSlider
              name="Attenuation"
              value={attenuation}
              onChange={setAttenuation}
              accent="var(--s1)"
              readout={`${Math.round(attenuation * 100)}% lost`}
              hint="Energy leaks away as heat, so the wave gets smaller with distance. Fixed by a repeater or amplifier."
            />
            <ImpairmentSlider
              name="Noise"
              value={noise}
              onChange={setNoise}
              accent="var(--s5)"
              readout={`${Math.round(noise * 100)}%`}
              hint="Unwanted energy added by the surroundings: motors, other cables, lightning. A received signal that makes no sense."
            />
            <ImpairmentSlider
              name="Distortion"
              value={distortion}
              onChange={setDistortion}
              accent="var(--s4)"
              readout={`${Math.round(distortion * 100)}%`}
              hint="The cable's capacitance and inductance round off sharp edges, changing the shape of the signal."
            />
            <Button
              size="sm"
              onClick={() => {
                setAttenuation(0);
                setNoise(0);
                setDistortion(0);
                setBandwidth(10);
              }}
            >
              Perfect medium
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-4 border-t border-line pt-4 sm:grid-cols-2">
          <Slider
            label="Bandwidth of the medium"
            value={bandwidth}
            onChange={setBandwidth}
            min={1}
            max={10}
            step={0.5}
            readout={`${bandwidth.toFixed(1)} units`}
            accent="var(--s2)"
            hint="The range of frequencies the medium will pass, measured in hertz. A narrow bandwidth cannot carry sharp edges, however clean the line is."
          />
          <Slider
            label="Cable length"
            value={latencyKm}
            onChange={setLatencyKm}
            min={1}
            max={1000}
            step={1}
            readout={`${latencyKm} km`}
            accent="var(--s3)"
            hint="Latency is how long a unit of data takes to get there. It is set by distance and propagation speed, not by bandwidth."
          />
        </div>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
        <Callout kind="exam" title="Latency and bandwidth are not the same thing">
          <strong>Bandwidth</strong> is a range of frequencies, measured in hertz: how much can be in flight at
          once. <strong>Latency</strong> is a delay, measured in milliseconds: how long one unit takes to arrive.
          A satellite link can have plenty of bandwidth and terrible latency; a short thin wire can have low
          latency and almost no bandwidth. Widening the pipe does not shorten it.
        </Callout>
        <Callout kind="warn" title="Noise and distortion are different faults">
          <strong>Distortion</strong> is the medium changing the shape of your own signal; nothing was added.
          <strong> Noise</strong> is extra energy from outside being added on top. Distortion is predictable and
          can often be equalised out; noise is random and cannot.
        </Callout>
      </div>

      <Panel title="Bandwidth is the promise; throughput is what you get">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="max-w-[64ch] text-sm text-ink-2">
              <strong className="font-semibold text-ink">Throughput</strong> is the amount of data that actually
              gets through in a given time, and it is measured, not advertised. Every impairment above eats into it:
              noise forces retransmissions, a narrow bandwidth limits how fast symbols can be sent, and the
              protocol's own headers take a share of whatever is left.
            </p>
            <p className="mt-2 max-w-[64ch] text-sm text-ink-2">
              A link sold as 100 Mbps might carry only 70 Mbps of your data. The 100 is the capacity of the
              channel; the 70 is what arrived. Throughput is never higher than bandwidth, and in practice it is
              always lower.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 md:border-l md:border-line md:pl-4">
            <Readout label="Bandwidth" value="100 Mbps" sub="the channel's capacity" />
            <Readout label="Throughput" value="70 Mbps" tone="warn" sub="what actually arrives" />
            <Readout label="Lost to overhead" value="30 %" sub="noise, retries, headers" />
          </div>
        </div>
      </Panel>
    </Section>
  );
}

function ImpairmentSlider({
  name,
  value,
  onChange,
  accent,
  readout,
  hint,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
  accent: string;
  readout: string;
  hint: string;
}) {
  return (
    <Slider
      label={name}
      value={value}
      onChange={onChange}
      min={0}
      max={0.9}
      step={0.01}
      readout={readout}
      accent={accent}
      hint={hint}
    />
  );
}

function verdict(
  carried: Carried,
  s: { attenuation: number; noise: number; distortion: number; bandwidth: number; readable: boolean },
): string {
  if (!s.readable) {
    return carried === "digital"
      ? "The received levels no longer sit clearly either side of the decision threshold. The receiver will read some bits wrongly. This is a bit error, and it is what parity in level 6.3 is designed to catch."
      : "The original waveform can no longer be picked out of the damage. An analog receiver has no threshold to fall back on, so the error is passed straight through to whatever is listening.";
  }
  const worst = Math.max(s.attenuation, s.noise, s.distortion);
  if (worst < 0.05) return "A near-perfect medium: what arrives is what was sent. No real cable behaves like this.";
  if (worst === s.attenuation)
    return "Attenuation dominates. The shape is intact but the wave is smaller. Put a repeater partway along the run and the signal is restored.";
  if (worst === s.noise)
    return "Noise dominates. The signal is the right size but is riding on unwanted energy. Shielding, twisting the pair, or moving to fibre would help.";
  if (s.bandwidth < 4)
    return "Bandwidth is the limit here: the medium simply cannot pass the sharp edges, so the corners have been rounded off before anything else happened.";
  return "Distortion dominates. The medium has changed the shape of the signal; the edges are no longer square, so the receiver has less margin when it decides each bit.";
}

/* ================================================================== *
 * 5. Point-to-point
 * ================================================================== */

function PointToPoint() {
  return (
    <Section
      id="p2p"
      title="The simplest topology of all"
      lead="A point-to-point connection joins exactly two devices with one dedicated length of cable. The whole capacity belongs to those two, nothing has to be shared, and no addressing is needed, since whatever goes in one end comes out the other."
    >
      <Panel title="Point-to-point link">
        <Scope height={150}>
          <ScopeCanvas
            label="Two computers joined by a single dedicated cable, with data flowing between them"
            animate
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, time, w, h }) => {
              const y = h / 2;
              const xa = 76;
              const xb = w - 76;

              ctx.save();
              ctx.strokeStyle = palette.gridMajor;
              ctx.lineWidth = 3;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(xa, y);
              ctx.lineTo(xb, y);
              ctx.stroke();

              // Packet travelling back and forth.
              const cycle = (time * 0.36) % 2;
              const p = cycle < 1 ? cycle : 2 - cycle;
              const px = xa + (xb - xa) * p;
              ctx.fillStyle = palette.series[0];
              if (palette.isDark) {
                ctx.shadowColor = palette.series[0];
                ctx.shadowBlur = 14;
              }
              ctx.beginPath();
              ctx.roundRect(px - 9, y - 5, 18, 10, 3);
              ctx.fill();
              ctx.shadowBlur = 0;
              ctx.restore();

              drawHost(ctx, palette, xa - 34, y - 22, "PC A");
              drawHost(ctx, palette, xb - 34, y - 22, "PC B");

              plot.text(w / 2, y + 26, "one dedicated cable · full capacity for these two", palette.inkFaint, {
                size: 10,
                align: "center",
              });
            }}
          />
        </Scope>
        <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-1.5 text-sm text-ink-2 sm:grid-cols-2">
          {[
            "The full bandwidth of the cable belongs to the two devices.",
            "No contention: neither device has to wait for the other to finish.",
            "Simple, but it needs a separate cable for every pair you want to join.",
            "That last point is exactly the problem competency level 6.5 solves.",
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand" />
              {t}
            </li>
          ))}
        </ul>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * 6. Direction of flow
 * ================================================================== */

function ModesSection() {
  const [mode, setMode] = useState<Mode>("half");
  const info = TRANSMISSION_MODES[mode];

  return (
    <Section
      id="modes"
      title="Which way can it go?"
      lead="A link is described not only by what it carries but by which directions it can carry it in. There are three arrangements, and the difference between the last two is whether the two ends may talk at the same time or must take turns."
    >
      <Panel
        title={`${info.name} transmission`}
        subtitle={info.how}
        actions={
          <Segmented
            label="Transmission mode"
            value={mode}
            onChange={setMode}
            options={(Object.keys(TRANSMISSION_MODES) as Mode[]).map((m) => ({
              value: m,
              label: TRANSMISSION_MODES[m].name,
            }))}
          />
        }
      >
        <Scope height={168}>
          <ScopeCanvas
            label={`${info.name}: ${info.how}`}
            animate
            deps={[mode]}
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, time, w, h }) => {
              const y = h * 0.46;
              const xa = 82;
              const xb = w - 82;
              const colour = palette.series[info.series];

              ctx.save();
              ctx.strokeStyle = palette.gridMajor;
              ctx.lineWidth = 3;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(xa, y);
              ctx.lineTo(xb, y);
              ctx.stroke();
              ctx.restore();

              const chip = (px: number, py: number, text: string, c: string) => {
                ctx.save();
                ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                const tw = ctx.measureText(text).width + 14;
                if (palette.isDark) {
                  ctx.shadowColor = c;
                  ctx.shadowBlur = 12;
                }
                ctx.fillStyle = c;
                ctx.beginPath();
                ctx.roundRect(px - tw / 2, py - 8, tw, 16, 4);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = palette.bg;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(text, px, py + 0.5);
                ctx.restore();
              };

              // One cycle of the conversation, drawn differently per mode.
              const cyc = (time * 0.34) % 2;
              if (mode === "simplex") {
                const p = cyc / 2;
                chip(xa + (xb - xa) * p, y - 18, "data", colour);
                plot.text(w / 2, y + 30, "one direction, always: B can never reply", palette.inkFaint, {
                  size: 10,
                  align: "center",
                });
              } else if (mode === "half") {
                // A sends for the first half of the cycle, then B replies.
                const forward = cyc < 1;
                const p = forward ? cyc : cyc - 1;
                const px = forward ? xa + (xb - xa) * p : xb - (xb - xa) * p;
                chip(px, y - 18, forward ? "A → B" : "B → A", colour);
                plot.text(
                  w / 2,
                  y + 30,
                  forward ? "A is sending, so B must wait its turn" : "now B sends, so A must wait",
                  palette.inkFaint,
                  { size: 10, align: "center" },
                );
              } else {
                const p = cyc / 2;
                chip(xa + (xb - xa) * p, y - 20, "A → B", colour);
                chip(xb - (xb - xa) * p, y + 20, "B → A", palette.series[3]);
                plot.text(w / 2, y + 44, "both directions at once, on separate paths", palette.inkFaint, {
                  size: 10,
                  align: "center",
                });
              }

              drawHost(ctx, palette, xa - 34, y - 22, "A");
              drawHost(ctx, palette, xb - 34, y - 22, "B");
            }}
          />
        </Scope>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="text-2xs font-semibold text-ink-3">Where the capacity goes</p>
            <p className="mt-1 max-w-[56ch] text-sm text-ink-2">{info.capacity}</p>
          </div>
          <div className="sm:w-[240px] sm:border-l sm:border-line sm:pl-4">
            <p className="text-2xs font-semibold text-ink-3">Examples</p>
            <ul className="mt-1.5 grid gap-1">
              {info.examples.map((e) => (
                <li key={e} className="flex gap-2 text-sm text-ink-2">
                  <span
                    className="mt-[9px] h-1 w-1 shrink-0 rounded-full"
                    style={{ background: `var(--s${info.series + 1})` }}
                  />
                  {e}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>

      <Callout kind="exam" title="Half duplex is not half speed">
        Both half and full duplex allow two-way communication; the difference is <em>simultaneity</em>. In half
        duplex the whole channel is given to whichever end is talking, and the line is turned round between
        turns. A hub forces half duplex on everything plugged into it; a switch gives every port full duplex,
        which is one of the reasons switches replaced hubs.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * 7. Multiplexing
 * ================================================================== */

const MUX_CHANNELS = [
  { label: "A", series: 0 },
  { label: "B", series: 1 },
  { label: "C", series: 3 },
];

function MuxSection() {
  const [kind, setKind] = useState<Muxing>("tdm");
  const info = MULTIPLEXING[kind];

  return (
    <Section
      id="mux"
      title="Several conversations down one wire"
      lead="Laying a cable is expensive and one conversation rarely fills it. Multiplexing puts several channels onto the same medium at once: a multiplexer combines them at the sending end and a demultiplexer separates them again at the far end. What differs between the four techniques is which resource gets divided up."
    >
      <Panel
        title={info.long}
        subtitle={info.how}
        actions={
          <Segmented
            label="Technique"
            value={kind}
            onChange={setKind}
            options={(Object.keys(MULTIPLEXING) as Muxing[]).map((m) => ({
              value: m,
              label: MULTIPLEXING[m].name,
              title: MULTIPLEXING[m].long,
            }))}
          />
        }
      >
        <Scope height={244}>
          <ScopeCanvas
            label={`${info.long}: three channels share one medium, divided by ${info.divides}`}
            animate
            deps={[kind]}
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, time, w, h }) => {
              const muxX = Math.max(74, w * 0.17);
              const demuxX = Math.min(w - 74, w * 0.83);
              const midY = h * 0.46;
              const rowY = (i: number) => midY - 46 + i * 46;

              // The three channels in and out.
              MUX_CHANNELS.forEach((c, i) => {
                const colour = palette.series[c.series];
                [true, false].forEach((left) => {
                  const x0 = left ? 22 : demuxX + 18;
                  const x1 = left ? muxX - 18 : w - 22;
                  ctx.save();
                  ctx.strokeStyle = colour;
                  ctx.lineWidth = 1.8;
                  ctx.beginPath();
                  ctx.moveTo(x0, rowY(i));
                  ctx.lineTo(x1 - 8, rowY(i));
                  ctx.lineTo(left ? muxX - 18 : w - 22, left ? midY : rowY(i));
                  ctx.stroke();
                  ctx.restore();
                  plot.text(left ? 22 : w - 22, rowY(i) - 12, `Channel ${c.label}`, colour, {
                    size: 9,
                    weight: 700,
                    align: left ? "left" : "right",
                  });
                });
              });

              // MUX and DEMUX, drawn as the trapezoids they are in every textbook.
              const trapezoid = (x: number, flip: boolean, label: string) => {
                ctx.save();
                ctx.fillStyle = palette.bg;
                ctx.strokeStyle = palette.brand;
                ctx.lineWidth = 2;
                ctx.beginPath();
                const wide = 56;
                const narrow = 26;
                ctx.moveTo(x - 16, midY - (flip ? narrow : wide));
                ctx.lineTo(x + 16, midY - (flip ? wide : narrow));
                ctx.lineTo(x + 16, midY + (flip ? wide : narrow));
                ctx.lineTo(x - 16, midY + (flip ? narrow : wide));
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = palette.brand;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(label, x, midY);
                ctx.restore();
              };
              trapezoid(muxX, false, "MUX");
              trapezoid(demuxX, true, "DEMUX");

              // The shared medium, and how this technique divides it.
              const x0 = muxX + 18;
              const x1 = demuxX - 18;
              const span = x1 - x0;

              if (kind === "tdm") {
                // Time slots, repeating as frames, with a guard gap between them.
                const slots = 9;
                const sw = span / slots;
                const guard = sw * 0.14;
                const shift = (time * 0.5) % 3;
                for (let s = 0; s < slots; s++) {
                  const c = MUX_CHANNELS[(s + Math.floor(shift)) % 3];
                  const colour = palette.series[c.series];
                  const sx = x0 + s * sw;
                  ctx.save();
                  ctx.fillStyle = colour;
                  ctx.globalAlpha = 0.85;
                  ctx.beginPath();
                  ctx.roundRect(sx + guard / 2, midY - 13, sw - guard, 26, 3);
                  ctx.fill();
                  ctx.globalAlpha = 1;
                  ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                  ctx.fillStyle = palette.bg;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(c.label, sx + sw / 2, midY + 0.5);
                  ctx.restore();
                }
                // One frame = one slot for every channel.
                ctx.save();
                ctx.strokeStyle = palette.axis;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(x0, midY + 20);
                ctx.lineTo(x0 + sw * 3, midY + 20);
                ctx.stroke();
                ctx.restore();
                plot.text(x0 + sw * 1.5, midY + 24, "one frame", palette.inkFaint, { size: 9, align: "center" });
                plot.text(x0 + span / 2, midY - 30, "time →", palette.inkFaint, { size: 9, align: "center" });
              } else if (kind === "fdm" || kind === "wdm") {
                // Stacked bands: frequency for FDM, wavelength for WDM.
                MUX_CHANNELS.forEach((c, i) => {
                  const colour = palette.series[c.series];
                  const by = midY - 30 + i * 22;
                  ctx.save();
                  ctx.globalAlpha = 0.22;
                  ctx.fillStyle = colour;
                  ctx.fillRect(x0, by - 8, span, 16);
                  ctx.globalAlpha = 1;
                  ctx.strokeStyle = colour;
                  ctx.lineWidth = 1.8;
                  ctx.beginPath();
                  // A carrier wave inside each band, faster for the higher band.
                  const cycles = 6 + i * 4;
                  for (let px = 0; px <= span; px += 2) {
                    const yy = by + Math.sin((px / span) * TAU * cycles + time * 2.4) * 5;
                    if (px === 0) ctx.moveTo(x0 + px, yy);
                    else ctx.lineTo(x0 + px, yy);
                  }
                  ctx.stroke();
                  ctx.restore();
                  plot.text(x0 + 4, by - 16, kind === "fdm" ? `band ${c.label}` : `${c.label}: one colour`, colour, {
                    size: 8,
                    weight: 700,
                  });
                });
                plot.text(
                  x0 + span / 2,
                  midY + 40,
                  kind === "fdm" ? "guard bands keep the neighbours apart" : "one fibre, several wavelengths at once",
                  palette.inkFaint,
                  { size: 9, align: "center" },
                );
              } else {
                // CDM: everybody transmits over everything, all the time.
                MUX_CHANNELS.forEach((c, i) => {
                  const colour = palette.series[c.series];
                  ctx.save();
                  ctx.globalAlpha = 0.3;
                  ctx.strokeStyle = colour;
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  for (let px = 0; px <= span; px += 2) {
                    const u = px / span;
                    const yy =
                      midY + Math.sin(u * TAU * (7 + i * 3) + time * 2 + i) * 16 * Math.sin(u * TAU * 0.5 + i);
                    if (px === 0) ctx.moveTo(x0 + px, yy);
                    else ctx.lineTo(x0 + px, yy);
                  }
                  ctx.stroke();
                  ctx.restore();
                  plot.text(x0 + 6 + i * 62, midY + 34, `code ${c.label}`, colour, { size: 9, weight: 700 });
                });
                plot.text(x0 + span / 2, midY - 34, "all channels, all the time, told apart by their code", palette.inkFaint, {
                  size: 9,
                  align: "center",
                });
              }

              plot.text(w / 2, h - 14, `one medium · divided by ${info.divides}`, palette.inkFaint, {
                size: 10,
                align: "center",
              });
            }}
          />
        </Scope>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <p className="text-2xs font-semibold text-ink-3">Terms this technique brings with it</p>
            <ul className="mt-1.5 grid gap-1.5">
              {info.key.map((k) => (
                <li key={k.term} className="flex gap-2 text-sm text-ink-2">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                  <span className="max-w-[58ch]">
                    <span className="font-medium text-ink">{k.term}</span>: {k.what}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:border-l lg:border-line lg:pl-4">
            <Readout label="What gets divided" value={info.divides} tone="brand" />
            <p className="mt-3 text-2xs font-semibold text-ink-3">Where you meet it</p>
            <p className="mt-1 max-w-[38ch] text-sm text-ink-2">{info.used}</p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Panel title="Why bother">
          <ul className="grid gap-1.5">
            {MUX_PROS.map((t) => (
              <li key={t} className="flex gap-2 text-sm text-ink-2">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--ok)" }} />
                <span className="max-w-[44ch]">{t}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="What it costs">
          <ul className="grid gap-1.5">
            {MUX_CONS.map((t) => (
              <li key={t} className="flex gap-2 text-sm text-ink-2">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--bad)" }} />
                <span className="max-w-[44ch]">{t}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Callout kind="exam" title="Telling the four apart in one line each">
        <strong>TDM</strong> divides time into slots. <strong>FDM</strong> divides the bandwidth into frequency
        bands. <strong>WDM</strong> is FDM in fibre, dividing light by wavelength. <strong>CDM</strong> divides
        nothing: every channel uses the whole medium at once and is separated by its code.
      </Callout>
    </Section>
  );
}

/** Small computer glyph shared by the topology drawings. */
export function drawHost(
  ctx: CanvasRenderingContext2D,
  palette: { ink: string; line: string; surface: string; inkStrong: string },
  x: number,
  y: number,
  label?: string,
  active?: string,
) {
  ctx.save();
  ctx.fillStyle = palette.surface;
  ctx.strokeStyle = active ?? palette.ink;
  ctx.lineWidth = active ? 2 : 1.4;
  ctx.beginPath();
  ctx.roundRect(x, y, 68, 44, 6);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = active ?? palette.ink;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x + 12, y + 9, 44, 22, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 36);
  ctx.lineTo(x + 44, y + 36);
  ctx.stroke();

  if (label) {
    ctx.font = '600 10px "JetBrains Mono Variable", ui-monospace, monospace';
    ctx.fillStyle = active ?? palette.inkStrong;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(label, x + 34, y + 50);
  }
  ctx.restore();
}

/* ================================================================== *
 * Quiz
 * ================================================================== */

const QUESTIONS: Question[] = [
  {
    id: "m1",
    prompt: "Which of these is an unguided transmission medium?",
    options: [
      { label: "Coaxial cable" },
      { label: "Shielded twisted pair" },
      { label: "Satellite microwave link", correct: true },
      { label: "Single-mode optical fibre" },
    ],
    explain:
      "Unguided means the signal is radiated into free space with no physical path steering it. Satellite, Wi-Fi, radio and infrared are unguided; every cable is guided.",
  },
  {
    id: "m2",
    prompt: "A signal arrives at the far end of a long cable with the same shape but a much smaller amplitude. Which impairment is this?",
    options: [
      { label: "Attenuation", correct: true },
      { label: "Distortion" },
      { label: "Noise" },
      { label: "Latency" },
    ],
    explain:
      "Attenuation is loss of signal energy as it travels through the medium. The shape survives and only the size falls, so it can be repaired by amplifying or regenerating the signal at a repeater.",
  },
  {
    id: "m3",
    prompt: "Which statement about bandwidth and latency is correct?",
    options: [
      { label: "Increasing bandwidth always reduces latency" },
      { label: "Bandwidth is a range of frequencies in hertz; latency is a delay in milliseconds", correct: true },
      { label: "Both are measured in bits per second" },
      { label: "Latency depends on the bandwidth of the medium" },
    ],
    explain:
      "They measure different things. Bandwidth is how wide the pipe is: a range of frequencies in hertz. Latency is how long one unit of data takes to travel the distance. A wider pipe does not make it shorter.",
  },
  {
    id: "m4",
    prompt: "Why is optical fibre completely unaffected by electromagnetic interference?",
    options: [
      { label: "Because it is shielded with a metal braid" },
      { label: "Because it carries light in a glass core rather than an electrical current", correct: true },
      { label: "Because it is buried underground" },
      { label: "Because the signal travels faster than in copper" },
    ],
    explain:
      "Interference works by inducing unwanted currents in a conductor. There is no conductor and no current in a fibre, only light in glass, so external electrical noise has nothing to couple into.",
  },
  {
    id: "m5",
    prompt: "A cable's capacitance rounds off the sharp corners of a square digital signal. This is best described as:",
    options: [
      { label: "Noise" },
      { label: "Attenuation" },
      { label: "Distortion", correct: true },
      { label: "Latency" },
    ],
    explain:
      "Distortion is the alteration of the properties of the signal by the medium itself: here the capacitance and inductance change the shape. Nothing was added from outside, which is what would make it noise.",
  },
  {
    id: "m6",
    prompt: "In a point-to-point connection, how much of the cable's capacity is available to the two devices?",
    options: [
      { label: "Half each, because they must take turns" },
      { label: "All of it: the link is dedicated to them", correct: true },
      { label: "It depends how many other devices are on the network" },
      { label: "None until a hub is added" },
    ],
    explain:
      "A point-to-point link joins exactly two devices with a dedicated cable. Nothing else shares it, so there is no contention and the full capacity of the medium is theirs.",
  },
  {
    id: "m7",
    prompt: "Two walkie-talkies let both people speak, but only one at a time. Which transmission mode is that?",
    options: [
      { label: "Simplex" },
      { label: "Half duplex", correct: true },
      { label: "Full duplex" },
      { label: "Multiplexed" },
    ],
    explain:
      "Half duplex allows communication in both directions but not simultaneously; the line is turned round between turns. Simplex would mean one of the two could never reply at all, and full duplex, like a telephone call, would let both talk at once.",
  },
  {
    id: "m8",
    prompt: "Three telephone conversations share one line, each getting the whole line for a brief slot in turn, over and over. Which technique is this?",
    options: [
      { label: "Frequency division multiplexing" },
      { label: "Time division multiplexing", correct: true },
      { label: "Wavelength division multiplexing" },
      { label: "Code division multiplexing" },
    ],
    explain:
      "Dividing the transmission time into slots and giving each channel its own slot in rotation is TDM. FDM would give each conversation its own frequency band and run them all at the same time; WDM does the same with wavelengths of light in a fibre; CDM lets them all use everything at once, separated by code.",
  },
];
