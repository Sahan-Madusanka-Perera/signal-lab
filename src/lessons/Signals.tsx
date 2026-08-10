import { useMemo, useState } from "react";
import { Section } from "../components/LessonPage";
import { ScopeCanvas } from "../components/ScopeCanvas";
import { Quiz, type Question } from "../components/Quiz";
import {
  Badge,
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
import { MEDIA_SPEED, TAU, period, sampleWave, si, wavelength } from "../lib/signal";

export function SignalsLesson() {
  return (
    <>
      <WhatIsASignal />
      <WaveLab />
      <PhaseSection />
      <AnalogVsDigital />
      <PropagationSection />
      <Section id="check" title="Check yourself">
        <Quiz lessonId="signals" questions={QUESTIONS} />
      </Section>
    </>
  );
}

/* ================================================================== *
 * 1. What is a signal
 * ================================================================== */

function WhatIsASignal() {
  return (
    <Section
      id="what"
      title="A signal is a voltage that changes with time"
      lead={
        <>
          Data communication means moving data between two devices over a transmission medium. The data
          itself cannot travel — what travels is a <strong className="font-semibold text-ink">signal</strong>:
          an electrical voltage, a current, or a light or radio wave whose value changes over time. Everything
          in this competency is about shaping that changing value so the far end can work out what was sent.
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Panel
          title="The communication model"
          subtitle="Three parts, and the only one that carries anything physical is the middle one."
        >
          <ModelDiagram />
        </Panel>

        <Panel title="Two kinds of signal" subtitle="Same information, two ways of representing it.">
          <div className="grid gap-3">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <Badge tone="brand">Analog</Badge>
                <span className="text-xs text-ink-2">continuous — takes every value in between</span>
              </div>
              <Scope height={72}>
                <ScopeCanvas
                  label="A smooth continuous analog wave"
                  bounds={{ x0: 0, x1: 4, y0: -1.3, y1: 1.3 }}
                  insets={{ left: 10, right: 10, top: 8, bottom: 8 }}
                  draw={({ plot, palette }) => {
                    plot.grid({ xEvery: 0.5 });
                    plot.zeroLine();
                    plot.trace(sampleWave({ amplitude: 1, frequency: 0.75, phase: 0 }, 4, 400), palette.series[0], {
                      glow: 8,
                    });
                  }}
                />
              </Scope>
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <Badge>Digital</Badge>
                <span className="text-xs text-ink-2">discrete — only the agreed levels, nothing between</span>
              </div>
              <Scope height={72}>
                <ScopeCanvas
                  label="A square digital signal switching between two levels"
                  bounds={{ x0: 0, x1: 4, y0: -1.3, y1: 1.3 }}
                  insets={{ left: 10, right: 10, top: 8, bottom: 8 }}
                  draw={({ plot, palette }) => {
                    plot.grid({ xEvery: 0.5 });
                    plot.zeroLine();
                    const bits = [1, 0, 1, 1, 0, 0, 1, 0];
                    plot.steps(
                      bits.map((b, i) => ({ from: i * 0.5, to: (i + 1) * 0.5, level: b ? 1 : (-1 as -1 | 1) })),
                      palette.series[1],
                      { glow: 8 },
                    );
                  }}
                />
              </Scope>
            </div>
          </div>
        </Panel>
      </div>
    </Section>
  );
}

function ModelDiagram() {
  const boxes = [
    { label: "Source", sub: "prepares the data" },
    { label: "Transmission system", sub: "carries the signal" },
    { label: "Destination", sub: "hands data to the app" },
  ];
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      {boxes.map((b, i) => (
        <div key={b.label} className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-center ${
              i === 1 ? "border-brand-edge bg-brand-wash" : "border-line bg-surface-2"
            }`}
          >
            <p className="truncate text-xs font-semibold text-ink">{b.label}</p>
            <p className="mt-0.5 text-2xs text-ink-3">{b.sub}</p>
          </div>
          {i < boxes.length - 1 && (
            <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden className="hidden shrink-0 sm:block">
              <path d="M0 5h15m0 0l-4-3.5M15 5l-4 3.5" stroke="var(--ink-3)" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

/* ================================================================== *
 * 2. Wave lab — the flagship interactive
 * ================================================================== */

type Axis = "time" | "distance";

const MEDIA_OPTIONS = [
  { value: "copper", label: "Copper cable", speed: MEDIA_SPEED.copper, note: "≈ 0.66 c" },
  { value: "fibre", label: "Optical fibre", speed: MEDIA_SPEED.fibre, note: "≈ 0.67 c" },
  { value: "air", label: "Free space", speed: MEDIA_SPEED.air, note: "≈ c" },
  { value: "sound", label: "Sound in air", speed: MEDIA_SPEED.soundAir, note: "343 m/s" },
] as const;

const F_MIN = 250;
const F_MAX = 4000;
/** Time window is fixed so raising the frequency visibly packs in more cycles. */
const WINDOW_S = 0.004;

function WaveLab() {
  const [amplitude, setAmplitude] = useState(3);
  const [frequency, setFrequency] = useState(1000);
  const [phase, setPhase] = useState(0);
  const [axis, setAxis] = useState<Axis>("time");
  const [medium, setMedium] = useState<(typeof MEDIA_OPTIONS)[number]["value"]>("copper");
  const [showMeasure, setShowMeasure] = useState(true);
  const [travel, setTravel] = useState(false);

  const speed = MEDIA_OPTIONS.find((m) => m.value === medium)!.speed;
  const T = period(frequency);
  const lambda = wavelength(speed, frequency);
  /** Distance window chosen so the lowest frequency shows just over one wavelength. */
  const distWindow = wavelength(speed, F_MIN);

  /** Headroom above the tallest crest so the span annotations never sit on the trace. */
  const yMax = 6.6;

  return (
    <Section
      id="lab"
      title="The four properties, on one wave"
      lead="Move a slider and watch which part of the picture responds. Amplitude changes the height, frequency changes how tightly the cycles pack in, and phase slides the whole wave sideways without changing its shape."
    >
      <Panel
        title="Wave lab"
        subtitle={
          axis === "time"
            ? "The vertical axis is voltage; the horizontal axis is time at one fixed point on the wire."
            : "A snapshot along the cable at one instant. Now the repeat distance is the wavelength."
        }
        actions={
          <Segmented
            label="Horizontal axis"
            value={axis}
            onChange={(v) => {
              setAxis(v);
              if (v === "time") setTravel(false);
            }}
            options={[
              { value: "time", label: "Against time" },
              { value: "distance", label: "Against distance" },
            ]}
          />
        }
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_236px]">
          <div className="min-w-0">
            <Scope height={300}>
              <ScopeCanvas
                label={`Sine wave with amplitude ${amplitude} volts, frequency ${frequency} hertz and phase ${phase} degrees, drawn against ${axis}`}
                animate={travel}
                bounds={
                  axis === "time"
                    ? { x0: 0, x1: WINDOW_S * 1000, y0: -yMax, y1: yMax }
                    : { x0: 0, x1: distWindow, y0: -yMax, y1: yMax }
                }
                insets={{ left: 46, right: 18, top: 18, bottom: 30 }}
                deps={[amplitude, frequency, phase, axis, showMeasure, speed]}
                draw={({ plot, palette, time }) => {
                  const N = 1400;
                  const isTime = axis === "time";
                  const span = isTime ? WINDOW_S * 1000 : distWindow;
                  /** cycles across the visible window */
                  const cycles = isTime ? frequency * WINDOW_S : distWindow / lambda;
                  const travelPhase = travel ? -TAU * frequency * time * 0.00025 : 0;

                  plot.grid({ yEvery: 2, xEvery: span / 16, xMajorEvery: span / 4 });
                  plot.zeroLine();
                  plot.axisFrame();

                  // Trace
                  const data = new Float64Array(N);
                  for (let i = 0; i < N; i++) {
                    const u = i / (N - 1);
                    data[i] = amplitude * Math.sin(TAU * cycles * u + (phase * Math.PI) / 180 + travelPhase);
                  }
                  plot.trace(data, palette.series[0], { glow: 12, width: 2.2 });

                  // Axis labels
                  plot.yTicks([-4, -2, 0, 2, 4], (v) => `${v}`);
                  plot.text(10, plot.top - 6, "V", palette.ink, { size: 10, weight: 600 });
                  if (isTime) {
                    plot.xTicks(span / 4, (v) => `${Number(v.toFixed(2))} ms`);
                  } else {
                    plot.xTicks(span / 4, (v) => (v === 0 ? "0" : si(v, "m", 2)));
                  }

                  if (!showMeasure) return;

                  const cyc = 1 / cycles; // one cycle in normalised units
                  const toX = (u: number) => u * span;
                  const phi = (phase * Math.PI) / 180 + travelPhase;
                  // First peak after the left edge: sin peaks at π/2
                  let uPeak = (Math.PI / 2 - phi) / (TAU * cycles);
                  while (uPeak < 0.02) uPeak += cyc;

                  if (uPeak + cyc < 0.98) {
                    // Amplitude: vertical measure from the zero line up to the crest.
                    plot.measure(toX(uPeak), amplitude, 0, palette.series[3], `A = ${amplitude} V`, {
                      vertical: true,
                    });
                    // Period / wavelength: crest to crest, drawn in the headroom above
                    // the wave so it never crosses the amplitude arrow or the trace.
                    plot.measure(
                      toX(uPeak),
                      toX(uPeak + cyc),
                      amplitude + 0.85,
                      palette.series[1],
                      isTime ? `T = ${si(T, "s", 3)}` : `λ = ${si(lambda, "m", 3)}`,
                      { above: true },
                    );
                  }

                  // Phase: how far the first upward zero-crossing has slid from the origin.
                  if (phase !== 0) {
                    let uZero = (-phi / (TAU * cycles)) % cyc;
                    if (uZero < 0) uZero += cyc;
                    if (uZero > 0.004 && uZero < 0.9) {
                      plot.vLine(toX(uZero), palette.series[4], { dash: [3, 3] });
                      plot.measure(0, toX(uZero), -(amplitude + 0.85), palette.series[4], `φ = ${phase}°`);
                    }
                  }
                }}
              />
            </Scope>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <Legend
                items={[
                  { color: "var(--s1)", label: "Signal" },
                  ...(showMeasure
                    ? [
                        { color: "var(--s4)", label: "Amplitude" },
                        { color: "var(--s2)", label: axis === "time" ? "Period" : "Wavelength" },
                        { color: "var(--s5)", label: "Phase offset", dash: true },
                      ]
                    : []),
                ]}
              />
              <div className="flex flex-wrap items-center gap-4">
                <Toggle checked={showMeasure} onChange={setShowMeasure} label="Measurements" />
                {axis === "distance" && (
                  <Toggle
                    checked={travel}
                    onChange={setTravel}
                    label="Let it travel"
                    accent="var(--s2)"
                    hint="Moves at the medium's propagation speed"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid content-start gap-4 lg:border-l lg:border-line lg:pl-4">
            <Slider
              label="Amplitude"
              value={amplitude}
              onChange={setAmplitude}
              min={0.5}
              max={5}
              step={0.5}
              readout={`${amplitude.toFixed(1)} V`}
              accent="var(--s4)"
              hint="Height of the wave from the zero line to a crest."
            />
            <Slider
              label="Frequency"
              value={frequency}
              onChange={setFrequency}
              min={F_MIN}
              max={F_MAX}
              step={50}
              readout={si(frequency, "Hz", 3)}
              accent="var(--s2)"
              hint="Complete cycles passing a point each second."
            />
            <Slider
              label="Phase"
              value={phase}
              onChange={setPhase}
              min={0}
              max={360}
              step={15}
              readout={`${phase}°`}
              accent="var(--s5)"
              hint="Where in the cycle the wave starts."
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 border-t border-line pt-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-2">
              Medium — sets the propagation speed v, and so the wavelength
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MEDIA_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMedium(m.value)}
                  className={`flex items-baseline gap-2 rounded-lg border px-2.5 py-1.5 transition-colors ${
                    medium === m.value
                      ? "border-brand-edge bg-brand-wash"
                      : "border-line bg-surface hover:bg-surface-2"
                  }`}
                >
                  <span className="text-xs font-medium text-ink">{m.label}</span>
                  <span className="tnum font-mono text-2xs text-ink-3">{m.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-6 md:justify-end">
            <Readout label="Period T" value={si(T, "s", 3)} sub="= 1 / f" />
            <Readout label="Wavelength λ" value={si(lambda, "m", 3)} sub="= v / f" tone="brand" />
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Callout kind="exam" title="The distinction examiners look for">
          <strong>Period</strong> is measured along a <em>time</em> axis at one point on the wire — it is how
          long one cycle takes. <strong>Wavelength</strong> is measured along a <em>distance</em> axis at one
          instant — it is how far one cycle stretches down the cable. Switch the lab between the two axes and
          notice that the picture is identical; only the horizontal units change.
        </Callout>
        <Callout kind="warn" title="Phase changes nothing about the shape">
          Sliding phase does not make the wave taller, faster or slower. It only decides where in its cycle the
          wave is when you start looking. That is exactly why phase can be used on its own to carry data —
          see <em>Phase Shift Keying</em> in level 6.3.
        </Callout>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 3. Phase
 * ================================================================== */

function PhaseSection() {
  const [delta, setDelta] = useState(90);
  const [running, setRunning] = useState(true);

  return (
    <Section
      id="phase"
      title="Phase, seen as rotation"
      lead="A sine wave is the shadow of a point going round a circle at a steady rate. Phase is simply how far apart two such points are on that circle — so a 180° difference means one wave is at a crest exactly when the other is at a trough."
    >
      <Panel
        title="Two waves, one phase difference"
        actions={
          <Button size="sm" onClick={() => setRunning((r) => !r)}>
            {running ? "Pause" : "Play"}
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
          <Scope height={190} caption="Phasors: each dot's height is the wave's value right now.">
            <ScopeCanvas
              label={`Two rotating phasors separated by ${delta} degrees`}
              animate={running}
              deps={[delta]}
              bounds={{ x0: -1.35, x1: 1.35, y0: -1.35, y1: 1.35 }}
              insets={{ left: 8, right: 8, top: 8, bottom: 8 }}
              draw={({ plot, ctx, palette, time, w, h }) => {
                const cx = w / 2;
                const cy = h / 2;
                const r = Math.min(w, h) / 2 - 16;
                const ang = time * 1.1;

                ctx.save();
                ctx.strokeStyle = palette.gridMajor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, TAU);
                ctx.stroke();
                ctx.strokeStyle = palette.grid;
                ctx.beginPath();
                ctx.moveTo(cx - r, cy);
                ctx.lineTo(cx + r, cy);
                ctx.moveTo(cx, cy - r);
                ctx.lineTo(cx, cy + r);
                ctx.stroke();
                ctx.restore();

                const drawPhasor = (a: number, color: string, tag: string) => {
                  const x = cx + Math.cos(a) * r;
                  const y = cy - Math.sin(a) * r;
                  ctx.save();
                  ctx.strokeStyle = color;
                  ctx.lineWidth = 2;
                  ctx.lineCap = "round";
                  if (palette.isDark) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 10;
                  }
                  ctx.beginPath();
                  ctx.moveTo(cx, cy);
                  ctx.lineTo(x, y);
                  ctx.stroke();
                  ctx.shadowBlur = 0;
                  ctx.beginPath();
                  ctx.arc(x, y, 4.5, 0, TAU);
                  ctx.fillStyle = color;
                  ctx.fill();
                  ctx.lineWidth = 2;
                  ctx.strokeStyle = palette.bg;
                  ctx.stroke();
                  ctx.restore();
                  plot.text(x + 8, y - 4, tag, color, { size: 10, weight: 700 });
                };

                drawPhasor(ang, palette.series[0], "A");
                drawPhasor(ang + (delta * Math.PI) / 180, palette.series[3], "B");
              }}
            />
          </Scope>

          <div className="min-w-0">
            <Scope height={190}>
              <ScopeCanvas
                label={`Two sine waves separated by ${delta} degrees of phase`}
                animate={running}
                deps={[delta]}
                bounds={{ x0: 0, x1: 3, y0: -1.35, y1: 1.35 }}
                insets={{ left: 14, right: 62, top: 14, bottom: 20 }}
                draw={({ plot, palette, time }) => {
                  const N = 700;
                  plot.grid({ xEvery: 0.25, xMajorEvery: 1, yEvery: 0.5 });
                  plot.zeroLine();
                  const make = (off: number) => {
                    const d = new Float64Array(N);
                    for (let i = 0; i < N; i++) {
                      const u = (i / (N - 1)) * 3;
                      d[i] = Math.sin(TAU * u - time * 1.1 + off);
                    }
                    return d;
                  };
                  const a = make(0);
                  const b = make((delta * Math.PI) / 180);
                  plot.trace(a, palette.series[0], { glow: 10 });
                  plot.trace(b, palette.series[3], { glow: 10 });
                  plot.text(plot.right + 8, plot.sy(a[N - 1]), "Wave A", palette.series[0], {
                    size: 10,
                    weight: 700,
                    baseline: "middle",
                  });
                  plot.text(plot.right + 8, plot.sy(b[N - 1]), "Wave B", palette.series[3], {
                    size: 10,
                    weight: 700,
                    baseline: "middle",
                  });
                  plot.xTicks(1, (v) => (v === 0 ? "" : `${v}T`));
                }}
              />
            </Scope>

            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Slider
                label="Phase difference (B relative to A)"
                value={delta}
                onChange={setDelta}
                min={0}
                max={360}
                step={15}
                readout={`${delta}°`}
                accent="var(--s4)"
              />
              <div className="flex gap-1.5">
                {[0, 90, 180, 270].map((d) => (
                  <Button key={d} size="sm" onClick={() => setDelta(d)} variant={delta === d ? "primary" : "secondary"}>
                    {d}°
                  </Button>
                ))}
              </div>
            </div>

            <p className="mt-3 text-sm text-ink-2">
              {delta === 0
                ? "In phase. The two waves are identical and reinforce each other completely."
                : delta === 180
                  ? "Exactly out of phase. Add these two together and they cancel to nothing."
                  : `B is ${delta}° behind A — that is ${(delta / 360).toFixed(3).replace(/0+$/, "")} of a full cycle.`}
            </p>
          </div>
        </div>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * 4. Analog vs digital
 * ================================================================== */

function AnalogVsDigital() {
  const [levels, setLevels] = useState(2);

  const rows = [
    ["Values it can take", "Any value in a continuous range", "Only the agreed discrete levels"],
    ["Natural examples", "Sound, light, temperature, human voice", "Data inside a computer"],
    ["Effect of small noise", "Changes the value — the error stays", "Ignored, as long as the level is still identifiable"],
    ["Drawn as", "A smooth curve", "A square, stepped waveform"],
  ];

  return (
    <Section
      id="compare"
      title="Analog and digital, side by side"
      lead="Both are signals; the difference is how many values they are allowed to take. Raise the number of levels below and watch the digital version creep closer to the analog original — this is exactly what happens inside a modem when it digitises a voice."
    >
      <Panel
        title="One source, two representations"
        actions={
          <Segmented
            label="Number of levels"
            value={String(levels)}
            onChange={(v) => setLevels(Number(v))}
            options={[
              { value: "2", label: "2 levels" },
              { value: "4", label: "4" },
              { value: "8", label: "8" },
              { value: "16", label: "16" },
            ]}
          />
        }
      >
        <Scope height={200}>
          <ScopeCanvas
            label={`An analog wave and the same wave restricted to ${levels} discrete levels`}
            deps={[levels]}
            bounds={{ x0: 0, x1: 4, y0: -1.25, y1: 1.25 }}
            insets={{ left: 34, right: 96, top: 14, bottom: 22 }}
            draw={({ plot, palette }) => {
              const N = 900;
              plot.grid({ xEvery: 0.25, xMajorEvery: 1 });

              // Level rails, so the "only these values" idea is visible.
              const step = 2 / (levels - 1);
              for (let i = 0; i < levels; i++) {
                plot.hLine(-1 + i * step, palette.gridMajor, { dash: [2, 4] });
              }
              plot.zeroLine();

              const analog = new Float64Array(N);
              const digital = new Float64Array(N);
              for (let i = 0; i < N; i++) {
                const u = (i / (N - 1)) * 4;
                const v = Math.sin(TAU * 0.75 * u) * 0.85 + Math.sin(TAU * 1.6 * u) * 0.2;
                analog[i] = v;
                digital[i] = Math.round((Math.max(-1, Math.min(1, v)) + 1) / step) * step - 1;
              }

              plot.trace(analog, palette.series[0], { width: 2, glow: 8 });
              plot.trace(digital, palette.series[1], { width: 2, glow: 8 });

              plot.text(plot.right + 8, plot.top + 4, "Analog", palette.series[0], { size: 10, weight: 700 });
              plot.text(plot.right + 8, plot.top + 20, `Digital`, palette.series[1], { size: 10, weight: 700 });
              plot.text(plot.right + 8, plot.top + 34, `${levels} levels`, palette.inkFaint, { size: 10 });
              plot.yTicks([-1, 0, 1], (v) => `${v}`);
              plot.xTicks(1, (v) => (v === 0 ? "" : `${v}`));
            }}
          />
        </Scope>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="w-[30%] py-2 pr-4 text-2xs font-semibold tracking-wide text-ink-3">&nbsp;</th>
                <th className="py-2 pr-4 text-xs font-semibold" style={{ color: "var(--s1-ink)" }}>
                  Analog
                </th>
                <th className="py-2 text-xs font-semibold" style={{ color: "var(--s2-ink)" }}>
                  Digital
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, a, d]) => (
                <tr key={k} className="border-b border-line last:border-0">
                  <th scope="row" className="py-2.5 pr-4 align-top text-xs font-medium text-ink-3">
                    {k}
                  </th>
                  <td className="py-2.5 pr-4 align-top text-ink-2">{a}</td>
                  <td className="py-2.5 align-top text-ink-2">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * 5. Propagation speed and the v = f λ problems
 * ================================================================== */

type Solve = "lambda" | "f" | "v";

function PropagationSection() {
  const [solveFor, setSolveFor] = useState<Solve>("lambda");
  const [freq, setFreq] = useState(2_400_000_000);
  const [lam, setLam] = useState(0.125);
  const [spd, setSpd] = useState<number>(MEDIA_SPEED.air);

  const result = useMemo(() => {
    if (solveFor === "lambda") return { value: spd / freq, unit: "m", label: "Wavelength λ" };
    if (solveFor === "f") return { value: spd / lam, unit: "Hz", label: "Frequency f" };
    return { value: freq * lam, unit: "m/s", label: "Propagation speed v" };
  }, [solveFor, freq, lam, spd]);

  return (
    <Section
      id="speed"
      title="Propagation speed ties the properties together"
      lead="A signal does not arrive instantly. It travels through the medium at a fixed speed, and that speed depends on the medium — not on how loud or how fast the signal is. One equation links the three quantities, and every numerical problem in this level is a rearrangement of it."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid content-start gap-4">
          <Formula note="v is the propagation speed in metres per second, f is frequency in hertz, and λ is wavelength in metres.">
            v = f × λ
          </Formula>
          <div className="grid gap-2 sm:grid-cols-3">
            <Formula>λ = v / f</Formula>
            <Formula>f = v / λ</Formula>
            <Formula>T = 1 / f</Formula>
          </div>

          <Panel title="Propagation speeds worth remembering" bodyClassName="p-0">
            <ul className="divide-y divide-[var(--line)]">
              {[
                ["Vacuum / free space", "3.0 × 10⁸ m/s", "the speed of light, c"],
                ["Optical fibre", "≈ 2.0 × 10⁸ m/s", "about 0.67 c — glass slows light"],
                ["Copper cable", "≈ 2.0 × 10⁸ m/s", "about 0.66 c"],
                ["Sound in air", "343 m/s", "roughly a million times slower"],
              ].map(([m, v, n]) => (
                <li key={m} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{m}</p>
                    <p className="text-2xs text-ink-3">{n}</p>
                  </div>
                  <span className="tnum shrink-0 font-mono text-xs font-medium text-ink-2">{v}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel
          title="Solver"
          subtitle="Pick the unknown, then set the two you know."
          actions={
            <Segmented
              label="Solve for"
              size="sm"
              value={solveFor}
              onChange={setSolveFor}
              options={[
                { value: "lambda", label: "λ" },
                { value: "f", label: "f" },
                { value: "v", label: "v" },
              ]}
            />
          }
        >
          <div className="grid gap-3.5">
            {solveFor !== "v" && (
              <div>
                <label className="text-xs font-medium text-ink-2" htmlFor="solver-v">
                  Propagation speed v
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {MEDIA_OPTIONS.map((m) => (
                    <Button
                      key={m.value}
                      size="sm"
                      variant={Math.abs(spd - m.speed) < 1 ? "primary" : "secondary"}
                      onClick={() => setSpd(m.speed)}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
                <p className="tnum mt-1.5 font-mono text-2xs text-ink-3" id="solver-v">
                  v = {spd.toExponential(2)} m/s
                </p>
              </div>
            )}

            {solveFor !== "f" && (
              <NumberField
                label="Frequency f"
                value={freq}
                onChange={setFreq}
                unit="Hz"
                presets={[
                  ["1 kHz", 1e3],
                  ["1 MHz", 1e6],
                  ["100 MHz", 1e8],
                  ["2.4 GHz", 2.4e9],
                ]}
              />
            )}

            {solveFor !== "lambda" && (
              <NumberField
                label="Wavelength λ"
                value={lam}
                onChange={setLam}
                unit="m"
                presets={[
                  ["1 cm", 0.01],
                  ["12.5 cm", 0.125],
                  ["1 m", 1],
                  ["300 m", 300],
                ]}
              />
            )}

            <div className="rounded-lg border border-brand-edge bg-brand-wash px-3.5 py-3">
              <p className="text-2xs font-medium text-brand">{result.label}</p>
              <p className="tnum mt-0.5 font-mono text-2xl font-semibold text-ink">
                {si(result.value, result.unit, 4)}
              </p>
              <p className="tnum mt-1 font-mono text-2xs text-ink-2">
                {solveFor === "lambda" && `λ = v / f = ${spd.toExponential(2)} / ${freq.toExponential(2)}`}
                {solveFor === "f" && `f = v / λ = ${spd.toExponential(2)} / ${lam}`}
                {solveFor === "v" && `v = f × λ = ${freq.toExponential(2)} × ${lam}`}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Worked problems" subtitle="Try each one on paper first, then open the working.">
        <div className="grid gap-4">
          {WORKED.map((w) => (
            <div key={w.q} className="border-b border-line pb-4 last:border-0 last:pb-0">
              <p className="max-w-[70ch] text-sm text-ink">{w.q}</p>
              <div className="mt-2">
                <Reveal>
                  <div className="grid gap-1.5">
                    {w.steps.map((s) => (
                      <p key={s} className="tnum font-mono text-xs">
                        {s}
                      </p>
                    ))}
                    <p className="mt-1 text-sm font-medium text-ink">{w.answer}</p>
                  </div>
                </Reveal>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </Section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  unit,
  presets,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  presets: [string, number][];
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-xs font-medium text-ink-2">{label}</label>
        <span className="tnum font-mono text-xs font-medium text-ink">{si(value, unit, 4)}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {presets.map(([l, v]) => (
          <Button key={l} size="sm" variant={value === v ? "primary" : "secondary"} onClick={() => onChange(v)}>
            {l}
          </Button>
        ))}
      </div>
    </div>
  );
}

const WORKED = [
  {
    q: "A Wi-Fi radio signal has a frequency of 2.4 GHz and travels through free space at 3 × 10⁸ m/s. Find its wavelength.",
    steps: ["λ = v / f", "λ = 3 × 10⁸ / 2.4 × 10⁹", "λ = 0.125 m"],
    answer: "The wavelength is 0.125 m, or 12.5 cm.",
  },
  {
    q: "A signal in a copper cable has a wavelength of 200 m. The propagation speed in the cable is 2 × 10⁸ m/s. What is its frequency, and what is its period?",
    steps: ["f = v / λ", "f = 2 × 10⁸ / 200 = 1 × 10⁶ Hz = 1 MHz", "T = 1 / f = 1 / 10⁶ = 1 × 10⁻⁶ s = 1 µs"],
    answer: "The frequency is 1 MHz and the period is 1 microsecond.",
  },
  {
    q: "Two signals travel down the same optical fibre. One has twice the frequency of the other. What can you say about their wavelengths and their propagation speeds?",
    steps: [
      "v is fixed by the medium, so both travel at the same speed.",
      "λ = v / f, and v is constant, so λ is inversely proportional to f.",
    ],
    answer: "Same propagation speed; the higher-frequency signal has half the wavelength.",
  },
  {
    q: "A 5 V peak sine wave completes 4 cycles in 2 ms. State its amplitude, frequency and period.",
    steps: ["Amplitude = 5 V (given as the peak value)", "T = 2 ms / 4 = 0.5 ms", "f = 1 / T = 1 / 0.0005 = 2000 Hz = 2 kHz"],
    answer: "Amplitude 5 V, period 0.5 ms, frequency 2 kHz.",
  },
];

/* ================================================================== *
 * Quiz
 * ================================================================== */

const QUESTIONS: Question[] = [
  {
    id: "s1",
    prompt: "A sine wave is drawn with voltage on the vertical axis and time on the horizontal axis. Which property is read off as the distance between two neighbouring crests?",
    options: [
      { label: "The amplitude" },
      { label: "The period" , correct: true },
      { label: "The wavelength" },
      { label: "The phase" },
    ],
    explain:
      "On a time axis, crest to crest is one complete cycle, which takes one period T. Wavelength is the same measurement made on a distance axis. Both describe one cycle — the axis tells you which name to use.",
  },
  {
    id: "s2",
    prompt: "The frequency of a signal in a fixed medium is doubled. What happens to its wavelength?",
    options: [
      { label: "It doubles" },
      { label: "It halves", correct: true },
      { label: "It stays the same" },
      { label: "It becomes four times smaller" },
    ],
    explain: "λ = v / f. The medium fixes v, so doubling f halves λ. They are inversely proportional.",
  },
  {
    id: "s3",
    prompt: "A signal travels through an optical fibre at 2 × 10⁸ m/s with a frequency of 1 × 10⁸ Hz. What is its wavelength?",
    options: [
      { label: "0.5 m" },
      { label: "2 m", correct: true },
      { label: "20 m" },
      { label: "2 × 10¹⁶ m" },
    ],
    explain: "λ = v / f = (2 × 10⁸) / (1 × 10⁸) = 2 m. Watch the powers of ten — they cancel here.",
  },
  {
    id: "s4",
    prompt: "Which statement about a digital signal is correct?",
    options: [
      { label: "It varies smoothly and can take any value in a range" },
      { label: "It uses a small number of agreed discrete levels, usually two", correct: true },
      { label: "It cannot be sent over a copper cable" },
      { label: "It has no frequency" },
    ],
    explain:
      "Digital means discrete. Only the agreed levels count, so a small amount of noise can be ignored at the receiver as long as the intended level is still identifiable.",
  },
  {
    id: "s5",
    prompt: "Two identical waves are 180° out of phase. What is true?",
    options: [
      { label: "One has twice the amplitude of the other" },
      { label: "One has twice the frequency of the other" },
      { label: "One is at a crest exactly when the other is at a trough", correct: true },
      { label: "One travels twice as fast" },
    ],
    explain:
      "Phase shifts a wave along the horizontal axis without changing height, rate or speed. Half a cycle of shift is 180°, so the crests of one line up with the troughs of the other, and adding them cancels them out.",
  },
  {
    id: "s6",
    prompt: "Which quantity is decided by the transmission medium rather than by the transmitter?",
    options: [
      { label: "Amplitude" },
      { label: "Frequency" },
      { label: "Phase" },
      { label: "Propagation speed", correct: true },
    ],
    explain:
      "The transmitter chooses amplitude, frequency and phase. How fast the signal then travels is a property of the medium — about 2 × 10⁸ m/s in copper and fibre, close to 3 × 10⁸ m/s in free space.",
  },
];
