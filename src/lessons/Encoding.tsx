import { useMemo, useState } from "react";
import clsx from "clsx";
import { Section } from "../components/LessonPage";
import { ScopeCanvas } from "../components/ScopeCanvas";
import { Quiz, type Question } from "../components/Quiz";
import {
  Badge,
  BitTrain,
  Button,
  Callout,
  Formula,
  Legend,
  Panel,
  Readout,
  Reveal,
  Scope,
  Segmented,
  Slider,
  Toggle,
} from "../components/ui";
import type { Plot } from "../lib/plot";
import type { Palette } from "../lib/theme";
import {
  KEYING,
  LINE_CODES,
  baudPerBit,
  clockSegments,
  encode,
  keyedCarrier,
  longestFlatRun,
  parityBit,
  sampleWithDrift,
  si,
  transitionCount,
  type Keying,
  type LineCode,
  type Parity,
  type Segment,
} from "../lib/signal";

export function EncodingLesson() {
  return (
    <>
      <ProtocolSection />
      <EncodingLab />
      <RateSection />
      <SyncSection />
      <KeyingSection />
      <ParitySection />
      <Section id="check" title="Check yourself">
        <Quiz lessonId="encoding" questions={QUESTIONS} />
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Lane helper — several aligned waveforms share one canvas so the bit
 * boundaries can never drift apart between rows.
 * ------------------------------------------------------------------ */

/**
 * `series` is an index into the palette, never a CSS string — canvas cannot
 * resolve `var(--s1)`, and a colour it cannot parse silently paints black.
 */
type Lane = { label: string; series: number; segs: Segment[]; dim?: boolean };

function drawLanes(
  plot: Plot,
  palette: Palette,
  nBits: number,
  lanes: Lane[],
  opts: { bits?: number[]; midMarks?: boolean; glow?: number } = {},
) {
  const { bits, midMarks } = opts;
  const laneH = 2;

  // Bit-cell shading and boundaries.
  for (let i = 0; i < nBits; i++) {
    if (i % 2 === 1) plot.band(i, i + 1, palette.gridMajor, 0.5);
    plot.vLine(i, palette.gridMajor);
    if (midMarks) plot.vLine(i + 0.5, palette.grid, { dash: [2, 4] });
  }
  plot.vLine(nBits, palette.gridMajor);

  // Bit digits along the top.
  if (bits) {
    for (let i = 0; i < nBits; i++) {
      plot.text(plot.sx(i + 0.5), plot.top + 3, String(bits[i]), palette.inkStrong, {
        size: 11,
        weight: 700,
        align: "center",
      });
    }
  }

  lanes.forEach((lane, li) => {
    const centre = (lanes.length - li) * laneH - laneH / 2;
    const colour = palette.series[lane.series % palette.series.length];

    plot.hLine(centre, palette.grid, { alpha: 0.7 });
    plot.steps(lane.segs, colour, {
      high: centre + 0.62,
      low: centre - 0.62,
      width: 2.2,
      glow: opts.glow ?? 10,
      alpha: lane.dim ? 0.55 : 1,
    });
    plot.gutterLabel(centre, lane.label, colour);
  });
}

/* ================================================================== *
 * 1. Encoding is an agreement
 * ================================================================== */

function ProtocolSection() {
  const [highIsOne, setHighIsOne] = useState(true);
  const bits = [1, 0, 1, 1, 0, 0, 1];

  return (
    <Section
      id="protocol"
      title="Encoding is an agreement, not a law of physics"
      lead="A wire carries voltage. It has no idea what a 1 is. Before any data can cross it, both ends must agree on which signal element stands for which bit — and that agreement is what we call a protocol. Flip the agreement below and watch the same seven bits produce the opposite waveform."
    >
      <Panel
        title="The same bits, two agreements"
        actions={
          <Segmented
            label="Agreement"
            value={highIsOne ? "high" : "low"}
            onChange={(v) => setHighIsOne(v === "high")}
            options={[
              { value: "high", label: "High = 1" },
              { value: "low", label: "Low = 1" },
            ]}
          />
        }
      >
        <Scope height={150}>
          <ScopeCanvas
            label={`The bit sequence ${bits.join("")} sent with ${highIsOne ? "high voltage meaning one" : "low voltage meaning one"}`}
            deps={[highIsOne]}
            bounds={{ x0: 0, x1: bits.length, y0: 0, y1: 2 }}
            insets={{ left: 70, right: 20, top: 26, bottom: 18 }}
            draw={({ plot, palette }) => {
              const segs = bits.map((b, i) => ({
                from: i,
                to: i + 1,
                level: ((highIsOne ? b : 1 - b) ? 1 : -1) as -1 | 1,
              }));
              drawLanes(plot, palette, bits.length, [{ label: "on the wire", series: 0, segs }], { bits });
              plot.gutterLabel(1.62, "+V", palette.inkFaint, 9);
              plot.gutterLabel(0.38, "−V", palette.inkFaint, 9);
            }}
          />
        </Scope>
        <p className="mt-3 max-w-[70ch] text-sm text-ink-2">
          Both waveforms are equally valid. A receiver using the wrong agreement reads{" "}
          <span className="tnum font-mono text-ink">{bits.map((b) => 1 - b).join("")}</span> instead of{" "}
          <span className="tnum font-mono text-ink">{bits.join("")}</span> — every single bit inverted. This is
          why the encoding scheme has to be settled in advance and built into both devices.
        </p>
      </Panel>

      <Callout kind="note" title="Three properties, three ways to signal">
        Amplitude is the obvious choice — two voltage levels — but it is not the only one. The transmitter can
        equally well hold the amplitude constant and change the <strong>frequency</strong>, or change the{" "}
        <strong>phase</strong>. All three appear later on this page.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * 2. Encoding lab
 * ================================================================== */

const PRESETS: [string, number[]][] = [
  ["10110010", [1, 0, 1, 1, 0, 0, 1, 0]],
  ["All ones", [1, 1, 1, 1, 1, 1, 1, 1]],
  ["All zeros", [0, 0, 0, 0, 0, 0, 0, 0]],
  ["Alternating", [1, 0, 1, 0, 1, 0, 1, 0]],
];

function EncodingLab() {
  const [bits, setBits] = useState<number[]>([1, 0, 1, 1, 0, 0, 1, 0]);
  const [code, setCode] = useState<LineCode>("nrz-l");
  const [showClock, setShowClock] = useState(true);
  const [compare, setCompare] = useState(false);

  const segs = useMemo(() => encode(bits, code), [bits, code]);
  const clock = useMemo(() => clockSegments(bits.length), [bits.length]);
  const transitions = transitionCount(segs);
  const flat = longestFlatRun(segs);

  const clockLane: Lane[] = showClock ? [{ label: "Clock", series: 2, segs: clock, dim: true }] : [];
  const lanes: Lane[] = compare
    ? [
        ...clockLane,
        { label: "NRZ-L", series: 0, segs: encode(bits, "nrz-l") },
        { label: "NRZ-I", series: 1, segs: encode(bits, "nrz-i") },
        { label: "Manchester", series: 3, segs: encode(bits, "manchester") },
      ]
    : [...clockLane, { label: LINE_CODES[code].name, series: 0, segs }];

  const laneCount = lanes.length;

  return (
    <Section
      id="encoder"
      title="Encoding lab"
      lead="Click any bit to flip it, or load a preset. Watch what each scheme does at the bit boundaries and in the middle of each bit — that difference is the whole story."
    >
      <Panel
        title="Line coding"
        subtitle="Grey bands mark alternate bit cells so you can see exactly where one bit ends and the next begins."
        actions={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Toggle checked={compare} onChange={setCompare} label="Compare all three" />
            <Toggle checked={showClock} onChange={setShowClock} label="Clock" accent="var(--s3)" />
          </div>
        }
      >
        <Scope height={laneCount * 62 + 46}>
          <ScopeCanvas
            label={`Line coding of the bits ${bits.join("")}${compare ? " in NRZ-L, NRZ-I and Manchester" : ` using ${LINE_CODES[code].name}`}`}
            deps={[bits.join(""), code, showClock, compare]}
            bounds={{ x0: 0, x1: bits.length, y0: 0, y1: laneCount * 2 }}
            insets={{ left: 84, right: 18, top: 26, bottom: 18 }}
            draw={({ plot, palette }) => {
              drawLanes(plot, palette, bits.length, lanes, {
                bits,
                midMarks: compare || code === "manchester" || code === "manchester-diff",
              });
            }}
          />
        </Scope>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div>
            <p className="mb-2 text-xs font-medium text-ink-2">Bit stream — click a bit to flip it</p>
            <BitTrain bits={bits} onToggle={(i) => setBits((b) => b.map((v, j) => (j === i ? 1 - v : v)))} />
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {PRESETS.map(([label, preset]) => (
                <Button
                  key={label}
                  size="sm"
                  variant={bits.join("") === preset.join("") ? "primary" : "secondary"}
                  onClick={() => setBits(preset)}
                >
                  {label}
                </Button>
              ))}
              <Button
                size="sm"
                onClick={() => setBits(Array.from({ length: 8 }, () => (Math.random() < 0.5 ? 0 : 1)))}
              >
                Random
              </Button>
            </div>
          </div>

          {!compare && (
            <div className="lg:w-[300px]">
              <p className="mb-2 text-xs font-medium text-ink-2">Scheme</p>
              <div className="grid gap-1">
                {(Object.keys(LINE_CODES) as LineCode[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCode(c)}
                    className={clsx(
                      "rounded-lg border px-3 py-2 text-left transition-colors",
                      code === c ? "border-brand-edge bg-brand-wash" : "border-line bg-surface hover:bg-surface-2",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink">{LINE_CODES[c].name}</span>
                      {!LINE_CODES[c].syllabus && <Badge>beyond syllabus</Badge>}
                    </span>
                    <span className="mt-0.5 block text-2xs text-ink-2">{LINE_CODES[c].blurb}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {!compare && (
          <div className="mt-4 flex flex-wrap gap-6 border-t border-line pt-4">
            <Readout label="Signal elements per bit" value={baudPerBit(code)} tone="brand" />
            <Readout label="Level changes in this stream" value={transitions} sub={`over ${bits.length} bits`} />
            <Readout
              label="Longest stretch with no change"
              value={`${flat} bit${flat === 1 ? "" : "s"}`}
              tone={flat >= 4 ? "bad" : flat >= 3 ? "warn" : "ok"}
              sub="the receiver's clock drifts here"
            />
          </div>
        )}
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        <Callout kind="exam" title="How to draw Manchester in the exam">
          Split every bit cell in half. For a <strong>1</strong>, the voltage goes <strong>low then high</strong>;
          for a <strong>0</strong>, it goes <strong>high then low</strong>. There is a transition in the middle of
          every single bit, without exception. If your drawing has a bit cell with no mid-point transition, it is
          not Manchester.
        </Callout>
        <Callout kind="warn" title="Try 'All zeros' with each scheme">
          With NRZ-L and NRZ-I a long run of zeros produces a flat line — nothing changes for eight whole bit
          times, and a receiver has nothing to lock on to. With Manchester the same run still transitions in the
          middle of every bit. That is the problem the next two sections are about.
        </Callout>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 3. Baud vs bit rate
 * ================================================================== */

function RateSection() {
  const [bitRate, setBitRate] = useState(2000);

  return (
    <Section
      id="rate"
      title="How fast the signal elements change"
      lead="Bit rate and signal element rate are not the same number. Bit rate counts bits per second; the signal element rate — the baud rate — counts how many times per second the signal is allowed to change. Manchester buys its reliability by needing two signal elements for every one bit."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <Panel title="Set a bit rate" subtitle="Then read off what each scheme demands of the medium.">
          <Slider
            label="Bit rate"
            value={bitRate}
            onChange={setBitRate}
            min={200}
            max={10000}
            step={100}
            readout={si(bitRate, "bit/s", 3)}
            accent="var(--s1)"
          />

          <div className="mt-4 grid gap-2">
            {([
              ["nrz-l", "var(--s1)", "var(--s1-ink)"],
              ["nrz-i", "var(--s2)", "var(--s2-ink)"],
              ["manchester", "var(--s4)", "var(--s4-ink)"],
            ] as [LineCode, string, string][]).map(([c, color, ink]) => {
              const baud = bitRate * baudPerBit(c);
              return (
                <div
                  key={c}
                  className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface-2 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
                    <span className="truncate text-sm font-medium text-ink">{LINE_CODES[c].name}</span>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-3">
                    <span className="tnum font-mono text-xs text-ink-3">×{baudPerBit(c)}</span>
                    <span className="tnum font-mono text-sm font-semibold" style={{ color: ink }}>
                      {si(baud, "baud", 3)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-2">
            <Formula note="One signal element per bit, so the two numbers are equal.">
              NRZ: baud rate = bit rate
            </Formula>
            <Formula note="Two signal elements per bit, so the medium must support twice the rate of change.">
              Manchester: baud rate = 2 × bit rate
            </Formula>
          </div>
        </Panel>

        <Panel
          title="The same four bits, drawn to scale"
          subtitle="Manchester packs twice as many signal elements into the same four bit times."
        >
          <Scope height={172}>
            <ScopeCanvas
              label="NRZ-L uses one signal element per bit while Manchester uses two"
              bounds={{ x0: 0, x1: 4, y0: 0, y1: 4 }}
              insets={{ left: 84, right: 18, top: 26, bottom: 18 }}
              draw={({ plot, palette }) => {
                const bits = [1, 0, 0, 1];
                drawLanes(
                  plot,
                  palette,
                  4,
                  [
                    { label: "NRZ-L", series: 0, segs: encode(bits, "nrz-l") },
                    { label: "Manchester", series: 3, segs: encode(bits, "manchester") },
                  ],
                  { bits, midMarks: true },
                );

                // Count the signal elements in each lane.
                plot.text(plot.right - 4, plot.sy(3.55), "4 elements", palette.series[0], {
                  size: 9,
                  weight: 700,
                  align: "right",
                });
                plot.text(plot.right - 4, plot.sy(1.55), "8 elements", palette.series[3], {
                  size: 9,
                  weight: 700,
                  align: "right",
                });
              }}
            />
          </Scope>
          <p className="mt-3 max-w-[64ch] text-sm text-ink-2">
            Both lanes deliver the same four bits in the same four bit times, so the{" "}
            <strong className="font-semibold text-ink">bit rate is identical</strong>. But Manchester changes
            level twice as often, so it needs a medium with{" "}
            <strong className="font-semibold text-ink">twice the bandwidth</strong>. That is the price of the
            guaranteed mid-bit transition.
          </p>
        </Panel>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 4. Synchronisation — the drift demo
 * ================================================================== */

function SyncSection() {
  const [drift, setDrift] = useState(1.0);
  const [code, setCode] = useState<LineCode>("nrz-l");
  const bits = [1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0];

  const segs = useMemo(() => encode(bits, code), [code]);
  const samples = useMemo(() => sampleWithDrift(segs, bits.length, drift, code), [segs, drift, code]);
  const decoded = samples.map((s) => s.bit);
  const errors = decoded.map((b, i) => b !== bits[i]).filter(Boolean).length;
  const firstError = decoded.findIndex((b, i) => b !== bits[i]);
  const missing = bits.length - decoded.length;

  return (
    <Section
      id="sync"
      title="Why the two ends must stay in step"
      lead="The receiver cannot see the bit boundaries — it only sees a voltage. It has to run its own clock and sample the line at what it believes is the middle of each bit. If that clock runs even slightly fast or slow, the sampling points creep away from the bit centres and the data falls apart."
    >
      <Panel
        title="Clock drift simulator"
        subtitle="The green marks are the receiver's sampling instants. Drag the drift away from 1.00 and watch them slide."
        actions={
          <Segmented
            label="Encoding"
            size="sm"
            value={code}
            onChange={setCode}
            options={[
              { value: "nrz-l", label: "NRZ-L" },
              { value: "manchester", label: "Manchester" },
            ]}
          />
        }
      >
        <Scope height={188}>
          <ScopeCanvas
            label={`The transmitted signal with the receiver sampling at ${drift.toFixed(2)} times the correct interval, producing ${errors} wrong bits`}
            deps={[drift, code]}
            bounds={{ x0: 0, x1: bits.length, y0: 0, y1: 2 }}
            insets={{ left: 84, right: 18, top: 26, bottom: 30 }}
            draw={({ plot, palette }) => {
              drawLanes(plot, palette, bits.length, [{ label: "on the wire", series: 0, segs }], {
                bits,
                midMarks: code === "manchester",
              });

              // Where the receiver actually looks.
              samples.forEach((s, i) => {
                const wrong = s.bit !== bits[i];
                const color = wrong ? palette.series[4] : palette.series[2];
                plot.vLine(s.t, color, { dash: wrong ? undefined : [2, 3], alpha: wrong ? 0.9 : 0.6 });
                plot.dot(s.t, s.level > 0 ? 1.62 : 0.38, color, 4);
                plot.text(plot.sx(s.t), plot.bottom + 6, s.bit === null ? "?" : String(s.bit), color, {
                  size: 10,
                  weight: 700,
                  align: "center",
                });
              });

              if (plot.left > 60) {
                plot.text(plot.left - 8, plot.bottom + 6, "decoded", palette.ink, { size: 9, align: "right" });
              }
            }}
          />
        </Scope>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Slider
              label="Receiver clock rate"
              value={drift}
              onChange={setDrift}
              min={0.86}
              max={1.14}
              step={0.005}
              readout={`${drift.toFixed(3)} × correct`}
              accent={errors === 0 ? "var(--s3)" : "var(--s5)"}
              hint="1.000 means the receiver's clock exactly matches the transmitter's."
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Button size="sm" variant={drift === 1 ? "primary" : "secondary"} onClick={() => setDrift(1)}>
                Perfectly in step
              </Button>
              <Button size="sm" onClick={() => setDrift(1.04)}>
                4% fast
              </Button>
              <Button size="sm" onClick={() => setDrift(0.92)}>
                8% slow
              </Button>
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-2xs font-medium text-ink-3">Sent</p>
              <BitTrain bits={bits} size="sm" />
              <p className="mt-2.5 mb-1.5 text-2xs font-medium text-ink-3">Received</p>
              <BitTrain
                bits={decoded.map((b) => b ?? 0)}
                size="sm"
                flagged={decoded.map((b, i) => (b !== bits[i] ? i : -1)).filter((i) => i >= 0)}
              />
            </div>
          </div>

          <div className="flex gap-6 lg:flex-col lg:gap-4 lg:border-l lg:border-line lg:pl-4">
            <Readout
              label="Bits in error"
              value={errors}
              tone={errors === 0 ? "ok" : "bad"}
              sub={firstError >= 0 ? `first at bit ${firstError + 1}` : "all correct"}
            />
            <Readout label="Bits lost off the end" value={missing} tone={missing > 0 ? "warn" : "neutral"} />
          </div>
        </div>

        <p
          className={clsx(
            "mt-4 rounded-lg px-3.5 py-2.5 text-sm",
            errors === 0 ? "bg-surface-2 text-ink-2" : "bg-bad-wash text-ink",
          )}
        >
          {syncVerdict(drift, code, errors, firstError)}
        </p>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        <Callout kind="note" title="How real receivers stay in step">
          Either a separate clock line is sent alongside the data — expensive, because it doubles the wiring — or
          the clock is <strong>recovered from the data itself</strong>. That only works if the signal changes
          often enough, which is precisely what Manchester guarantees.
        </Callout>
        <Callout kind="exam" title="The self-clocking argument">
          Manchester's mid-bit transition happens in <em>every</em> bit, so the receiver gets a timing reference
          from every bit and can re-align continuously. It is called a <strong>self-clocking</strong> code. NRZ
          has no such guarantee: send a long run of the same bit and the receiver is flying blind.
        </Callout>
      </div>
    </Section>
  );
}

function syncVerdict(drift: number, code: LineCode, errors: number, firstError: number): string {
  if (errors === 0 && Math.abs(drift - 1) < 0.001)
    return "Both clocks agree, so every sample lands squarely in the middle of its bit cell and all twelve bits arrive intact.";
  if (errors === 0)
    return code === "manchester"
      ? `The receiver is ${Math.abs(drift - 1) > 0 ? "off by " + Math.round(Math.abs(drift - 1) * 100) + "%" : "off"}, but Manchester's mid-bit transition lets it re-align on every single bit, so nothing is lost yet.`
      : "The drift has not yet accumulated enough to push a sample out of its bit cell — but it is building up with every bit that passes.";
  return `The sampling points have slipped out of their bit cells. Bit ${firstError + 1} is the first casualty, and because the error accumulates, every bit after it is suspect too. ${errors} of ${12} bits are wrong.`;
}

/* ================================================================== *
 * 5. Frequency and phase as signal elements
 * ================================================================== */

function KeyingSection() {
  const [kind, setKind] = useState<Keying>("ask");
  const bits = [1, 0, 1, 1, 0, 0, 1, 0];
  const carrier = useMemo(() => keyedCarrier(bits, kind, 2000, 4), [kind]);

  return (
    <Section
      id="keying"
      title="Using frequency and phase instead"
      lead="Two voltage levels is the simplest agreement, but any property of a wave can carry the bits. Keep the carrier running and modify one of its three properties in step with the data — that gives the three shift keying schemes."
    >
      <Panel
        title="Shift keying"
        subtitle={`${KEYING[kind].long}: the carrier's ${KEYING[kind].varies} changes with each bit; the other two properties are left alone.`}
        actions={
          <Segmented
            label="Keying scheme"
            value={kind}
            onChange={setKind}
            options={(Object.keys(KEYING) as Keying[]).map((k) => ({
              value: k,
              label: KEYING[k].name,
              title: KEYING[k].long,
            }))}
          />
        }
      >
        <Scope height={210}>
          <ScopeCanvas
            label={`${KEYING[kind].long} of the bits ${bits.join("")}`}
            deps={[kind]}
            bounds={{ x0: 0, x1: bits.length, y0: -3, y1: 3 }}
            insets={{ left: 84, right: 18, top: 26, bottom: 18 }}
            draw={({ plot, palette }) => {
              // Bit cells and digits.
              for (let i = 0; i < bits.length; i++) {
                if (i % 2 === 1) plot.band(i, i + 1, palette.gridMajor, 0.5);
                plot.vLine(i, palette.gridMajor);
                plot.text(plot.sx(i + 0.5), plot.top + 3, String(bits[i]), palette.inkStrong, {
                  size: 11,
                  weight: 700,
                  align: "center",
                });
              }
              plot.vLine(bits.length, palette.gridMajor);

              // The data lane, then the keyed carrier beneath it.
              plot.steps(encode(bits, "nrz-l"), palette.series[2], {
                high: 2.35,
                low: 1.55,
                width: 2,
                glow: 8,
              });
              plot.gutterLabel(1.95, "data", palette.series[2]);

              plot.hLine(-0.9, palette.grid, { alpha: 0.7 });
              const shifted = new Float64Array(carrier.length);
              for (let i = 0; i < carrier.length; i++) shifted[i] = carrier[i] * 1.15 - 0.9;
              plot.trace(shifted, palette.series[0], { width: 2, glow: 10 });
              plot.gutterLabel(-0.9, KEYING[kind].name, palette.series[0]);
            }}
          />
        </Scope>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(Object.keys(KEYING) as Keying[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={clsx(
                "rounded-lg border px-3 py-2.5 text-left transition-colors",
                kind === k ? "border-brand-edge bg-brand-wash" : "border-line bg-surface hover:bg-surface-2",
              )}
            >
              <span className="text-sm font-semibold text-ink">{KEYING[k].name}</span>
              <span className="mt-0.5 block text-xs text-ink-2">{KEYING[k].long}</span>
              <span className="mt-1 block text-2xs text-ink-3">
                {k === "ask" && "Amplitude is switched between two values — often full size for 1 and nothing for 0."}
                {k === "fsk" && "One frequency means 1, a different frequency means 0. Height stays constant."}
                {k === "psk" && "The phase jumps by 180° whenever the bit changes. Height and rate stay constant."}
              </span>
            </button>
          ))}
        </div>

        <Callout kind="note" title="Which one survives noise best?">
          <span className="text-ink-2">
            Noise mostly adds and subtracts <em>amplitude</em>, so ASK is the most fragile of the three — a noisy
            line can push a 0 up to look like a 1. FSK and PSK ignore amplitude entirely, which is why real modems
            use them. You will meet these again in the next competency level.
          </span>
        </Callout>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * 6. Parity
 * ================================================================== */

function ParitySection() {
  const [data, setData] = useState<number[]>([1, 0, 1, 1, 0, 0, 1]);
  const [kind, setKind] = useState<Parity>("even");
  const [received, setReceived] = useState<number[] | null>(null);
  const [corruptedIndex, setCorruptedIndex] = useState<number | null>(null);
  const [flipCount, setFlipCount] = useState(1);

  const p = parityBit(data, kind);
  const sent = [...data, p];
  const ones = data.reduce((a, b) => a + b, 0);

  const send = (flips: number) => {
    const copy = [...sent];
    const picked = new Set<number>();
    while (picked.size < flips) picked.add(Math.floor(Math.random() * copy.length));
    picked.forEach((i) => (copy[i] = 1 - copy[i]));
    setReceived(copy);
    setCorruptedIndex(flips === 1 ? [...picked][0] : null);
    setFlipCount(flips);
  };

  const receivedOnes = received?.reduce((a, b) => a + b, 0) ?? 0;
  const detected = received
    ? kind === "even"
      ? receivedOnes % 2 !== 0
      : receivedOnes % 2 !== 1
    : false;
  const actuallyCorrupt = received ? received.some((b, i) => b !== sent[i]) : false;

  return (
    <Section
      id="parity"
      title="Catching a flipped bit with one extra bit"
      lead="Noise and drift both produce the same symptom: a bit arrives as the opposite of what was sent. Parity is the cheapest possible check — add one extra bit so that the number of 1s always comes out even (or always odd). If the count is wrong at the far end, something was corrupted."
    >
      <Panel
        title="Parity workbench"
        actions={
          <Segmented
            label="Parity type"
            value={kind}
            onChange={(v) => {
              setKind(v);
              setReceived(null);
            }}
            options={[
              { value: "even", label: "Even parity" },
              { value: "odd", label: "Odd parity" },
            ]}
          />
        }
      >
        <div className="grid gap-5">
          <div>
            <p className="mb-2 text-xs font-medium text-ink-2">
              1 · Seven data bits — click any bit to flip it
            </p>
            <BitTrain
              bits={data}
              onToggle={(i) => {
                setData((b) => b.map((v, j) => (j === i ? 1 - v : v)));
                setReceived(null);
              }}
            />
            <p className="mt-2 text-2xs text-ink-3">
              There {ones === 1 ? "is" : "are"}{" "}
              <span className="tnum font-mono font-semibold text-ink">{ones}</span>{" "}
              one{ones === 1 ? "" : "s"} in the data, which is {ones % 2 === 0 ? "even" : "odd"}.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-ink-2">
              2 · The transmitter appends the parity bit
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <BitTrain bits={data} />
              <span className="text-ink-3" aria-hidden>
                +
              </span>
              <div className="flex flex-col items-center gap-1">
                <BitTrain bits={[p]} colors={() => "var(--s4)"} />
                <span className="text-2xs font-medium" style={{ color: "var(--s4-ink)" }}>
                  parity
                </span>
              </div>
              <p className="max-w-[38ch] text-sm text-ink-2">
                Parity is <span className="tnum font-mono font-semibold text-ink">{p}</span>, so the eight bits
                sent contain{" "}
                <span className="tnum font-mono font-semibold text-ink">{ones + p}</span> ones — an{" "}
                <strong className="font-semibold text-ink">{kind}</strong> number, as agreed.
              </p>
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <p className="mb-2 text-xs font-medium text-ink-2">3 · Send it down a noisy line</p>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="primary" onClick={() => send(1)}>
                Send and flip 1 bit
              </Button>
              <Button size="sm" onClick={() => send(2)}>
                Flip 2 bits
              </Button>
              <Button size="sm" onClick={() => send(3)}>
                Flip 3 bits
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setReceived([...sent]);
                  setCorruptedIndex(null);
                  setFlipCount(0);
                }}
              >
                Send cleanly
              </Button>
              {received && (
                <Button size="sm" variant="ghost" onClick={() => setReceived(null)}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {received && (
            <div style={{ animation: "rise var(--dur) var(--ease-out-quart)" }}>
              <p className="mb-2 text-xs font-medium text-ink-2">4 · What the receiver sees, and its verdict</p>
              <BitTrain
                bits={received}
                flagged={received.map((b, i) => (b !== sent[i] ? i : -1)).filter((i) => i >= 0)}
                colors={(i) => (i === 7 && received[7] === sent[7] ? "var(--s4)" : undefined)}
              />

              <div className="mt-3 flex flex-wrap items-start gap-6">
                <Readout
                  label="Ones received"
                  value={receivedOnes}
                  sub={receivedOnes % 2 === 0 ? "even" : "odd"}
                />
                <Readout
                  label="Parity check"
                  value={detected ? "FAILED" : "passed"}
                  tone={detected ? "bad" : actuallyCorrupt ? "warn" : "ok"}
                />
              </div>

              <p
                className={clsx(
                  "mt-3 max-w-[72ch] rounded-lg px-3.5 py-2.5 text-sm",
                  detected ? "bg-bad-wash text-ink" : actuallyCorrupt ? "bg-warn-wash text-ink" : "bg-ok-wash text-ink",
                )}
              >
                {detected && (
                  <>
                    The receiver counted {receivedOnes} ones. {kind === "even" ? "Even" : "Odd"} parity was agreed,
                    so this is impossible — <strong>an error is detected</strong>. Note what the receiver does{" "}
                    <em>not</em> know:
                    {corruptedIndex !== null ? " which bit was flipped, so it cannot repair the data." : " which bits were flipped."}{" "}
                    It can only ask for the whole thing again.
                  </>
                )}
                {!detected && actuallyCorrupt && (
                  <>
                    {flipCount} bits were flipped, and the count of ones is still {kind}. The check{" "}
                    <strong>passes even though the data is wrong</strong>. This is the fundamental limit of a
                    single parity bit: it catches any odd number of errors, and misses every even number.
                  </>
                )}
                {!detected && !actuallyCorrupt && (
                  <>
                    Nothing was corrupted, the count of ones is {kind} as agreed, and the check passes. The
                    receiver strips the parity bit and hands the seven data bits to the application.
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="What parity can and cannot do">
          <ul className="grid gap-2 text-sm">
            {[
              ["ok", "Detects any single flipped bit"],
              ["ok", "Detects any odd number of flipped bits"],
              ["bad", "Misses an even number of flipped bits — they cancel out"],
              ["bad", "Cannot say which bit was wrong"],
              ["bad", "Cannot correct anything — it can only ask for a retransmission"],
            ].map(([tone, text]) => (
              <li key={text} className="flex gap-2.5">
                <span
                  className={clsx(
                    "mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold",
                    tone === "ok" ? "bg-ok-wash text-ok" : "bg-bad-wash text-bad",
                  )}
                  aria-hidden
                >
                  {tone === "ok" ? "✓" : "✕"}
                </span>
                <span className="text-ink-2">{text}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Work it out yourself">
          <div className="grid gap-3">
            {[
              {
                q: "The seven data bits 1 0 0 1 1 0 1 are to be sent with even parity. What is the parity bit?",
                a: ["Count the ones: 1 + 0 + 0 + 1 + 1 + 0 + 1 = 4", "4 is already even", "So the parity bit is 0"],
              },
              {
                q: "The same seven bits are sent with odd parity instead. What is the parity bit now?",
                a: ["The four ones make an even count", "Odd parity needs an odd total", "So the parity bit is 1, making five ones"],
              },
              {
                q: "A receiver expecting even parity gets 1 1 0 1 0 0 1 1. Is there an error?",
                a: ["Count the ones: 1+1+0+1+0+0+1+1 = 5", "5 is odd, but even parity was agreed", "Yes — an error is detected, though not which bit"],
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <p className="text-sm text-ink">{item.q}</p>
                <div className="mt-1.5">
                  <Reveal label="Show answer">
                    <ol className="grid gap-1">
                      {item.a.map((s) => (
                        <li key={s} className="tnum font-mono text-xs">
                          {s}
                        </li>
                      ))}
                    </ol>
                  </Reveal>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Legend
        className="justify-center"
        items={[
          { color: "var(--s1)", label: "Signal" },
          { color: "var(--s3)", label: "Clock / correct" },
          { color: "var(--s4)", label: "Parity bit" },
          { color: "var(--s5)", label: "Corrupted bit" },
        ]}
      />
    </Section>
  );
}

/* ================================================================== *
 * Quiz
 * ================================================================== */

const QUESTIONS: Question[] = [
  {
    id: "e1",
    prompt: "In Manchester encoding, how is a bit value represented?",
    options: [
      { label: "By a high or low voltage held for the whole bit" },
      { label: "By the direction of a transition in the middle of the bit", correct: true },
      { label: "By whether a transition occurs at the start of the bit" },
      { label: "By the number of cycles in the bit period" },
    ],
    explain:
      "Manchester puts a transition in the middle of every bit and uses its direction to carry the value: low-to-high for 1, high-to-low for 0. The mid-bit transition is always present, which is what makes the code self-clocking.",
  },
  {
    id: "e2",
    prompt: "A link runs at 4000 bit/s using Manchester encoding. What is the signal element (baud) rate?",
    options: [
      { label: "2000 baud" },
      { label: "4000 baud" },
      { label: "8000 baud", correct: true },
      { label: "16 000 baud" },
    ],
    explain:
      "Manchester uses two signal elements per bit, so the baud rate is twice the bit rate: 2 × 4000 = 8000 baud. With NRZ the two figures would be equal.",
  },
  {
    id: "e3",
    prompt: "Why is a long run of identical bits a problem for NRZ-L but not for Manchester?",
    options: [
      { label: "NRZ-L cannot represent more than four identical bits" },
      { label: "The NRZ-L signal stays flat, so the receiver has no transitions to keep its clock aligned", correct: true },
      { label: "Manchester automatically corrects the errors that result" },
      { label: "NRZ-L uses more bandwidth for identical bits" },
    ],
    explain:
      "A receiver recovers its timing from transitions in the signal. A flat NRZ-L line gives it nothing, so its clock drifts until its sampling points fall in the wrong bit cells. Manchester transitions in the middle of every bit regardless of the data.",
  },
  {
    id: "e4",
    prompt: "The seven data bits 1 1 0 1 0 0 1 are sent using even parity. What is the parity bit?",
    options: [
      { label: "0", correct: true },
      { label: "1" },
      { label: "It depends on the encoding scheme" },
      { label: "Two parity bits are needed" },
    ],
    explain:
      "Count the ones: 1+1+0+1+0+0+1 = 4, which is already even. Even parity requires the total number of ones — including the parity bit — to be even, so the parity bit is 0.",
  },
  {
    id: "e5",
    prompt: "A receiver using even parity receives eight bits containing six ones. What can it conclude?",
    options: [
      { label: "Two bits were flipped" },
      { label: "The data is definitely correct" },
      { label: "No error has been detected, though errors may still have occurred", correct: true },
      { label: "An error has been detected but cannot be located" },
    ],
    explain:
      "Six ones is an even count, so the check passes and no error is flagged. But parity only catches an odd number of flipped bits — if two bits were flipped, the count stays even and the corruption slips through undetected.",
  },
  {
    id: "e6",
    prompt: "In Frequency Shift Keying, which property of the carrier carries the data?",
    options: [
      { label: "Its amplitude" },
      { label: "Its frequency", correct: true },
      { label: "Its phase" },
      { label: "Its propagation speed" },
    ],
    explain:
      "FSK holds amplitude and phase steady and switches between two frequencies — one for a 1 and another for a 0. Because it ignores amplitude, it is far less vulnerable to noise than ASK.",
  },
];
