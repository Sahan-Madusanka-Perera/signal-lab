import { useMemo, useState } from "react";
import clsx from "clsx";
import { Section } from "../components/LessonPage";
import { ScopeCanvas } from "../components/ScopeCanvas";
import { Quiz, type Question } from "../components/Quiz";
import {
  Badge,
  Button,
  Callout,
  Extra,
  Formula,
  Legend,
  Panel,
  Readout,
  Scope,
  Segmented,
  Slider,
  Toggle,
} from "../components/ui";
import {
  KEYING,
  MODULATION,
  encode,
  keyedCarrier,
  modulate,
  pcm,
  sampleWave,
  si,
  type Keying,
  type Modulation,
} from "../lib/signal";

export function PstnLesson() {
  return (
    <>
      <PstnSection />
      <LinkSection />
      <ModulationLab />
      <PcmSection />
      <Section id="check" title="Check yourself">
        <Quiz lessonId="pstn" questions={QUESTIONS} />
      </Section>
    </>
  );
}

/* ================================================================== *
 * 1. The telephone network
 * ================================================================== */

function PstnSection() {
  return (
    <Section
      id="pstn"
      title="A network built for one job: carrying a voice"
      lead="The Public Switched Telephone Network was designed decades before home computers existed. When you dial, the exchanges switch a circuit through to the far end and hold it open for the whole call. That circuit carries one thing well: an analog signal in the narrow band of frequencies that human speech occupies."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Panel title="A switched circuit" subtitle="Dialling reserves a path; the path stays yours until you hang up.">
          <Scope height={148}>
            <ScopeCanvas
              label="A telephone circuit switched through two exchanges between a caller and a receiver"
              animate
              bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
              insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
              draw={({ plot, ctx, palette, time, w, h }) => {
                const y = h / 2 - 6;
                const nodes = [
                  { x: 44, label: "Caller", kind: "phone" },
                  { x: w * 0.36, label: "Exchange", kind: "switch" },
                  { x: w * 0.64, label: "Exchange", kind: "switch" },
                  { x: w - 44, label: "Callee", kind: "phone" },
                ];

                ctx.save();
                ctx.strokeStyle = palette.gridMajor;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(nodes[0].x, y);
                ctx.lineTo(nodes[3].x, y);
                ctx.stroke();

                // The reserved circuit lights up along its whole length.
                const grad = ctx.createLinearGradient(nodes[0].x, 0, nodes[3].x, 0);
                const head = (time * 0.3) % 1.4;
                grad.addColorStop(Math.max(0, head - 0.25), "transparent");
                grad.addColorStop(Math.min(1, Math.max(0, head)), palette.series[0]);
                grad.addColorStop(Math.min(1, head + 0.25), "transparent");
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(nodes[0].x, y);
                ctx.lineTo(nodes[3].x, y);
                ctx.stroke();
                ctx.restore();

                nodes.forEach((n) => {
                  ctx.save();
                  ctx.fillStyle = palette.surface;
                  ctx.strokeStyle = n.kind === "switch" ? palette.series[1] : palette.ink;
                  ctx.lineWidth = 1.6;
                  if (n.kind === "switch") {
                    ctx.beginPath();
                    ctx.roundRect(n.x - 22, y - 17, 44, 34, 6);
                    ctx.fill();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(n.x - 10, y + 5);
                    ctx.lineTo(n.x + 2, y - 6);
                    ctx.moveTo(n.x + 4, y + 5);
                    ctx.lineTo(n.x + 10, y + 5);
                    ctx.stroke();
                  } else {
                    ctx.beginPath();
                    ctx.roundRect(n.x - 17, y - 17, 34, 34, 6);
                    ctx.fill();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(n.x, y, 7, Math.PI * 0.15, Math.PI * 0.85);
                    ctx.stroke();
                  }
                  ctx.restore();
                  plot.text(n.x, y + 26, n.label, palette.ink, { size: 10, weight: 600, align: "center" });
                });
              }}
            />
          </Scope>
          <ul className="mt-3 grid gap-1.5 text-sm text-ink-2">
            {[
              "The circuit is dedicated: nobody else uses it while your call is up.",
              "It carries analog voice, a continuously varying voltage, not bits.",
              "It is engineered for roughly 300 Hz to 3400 Hz, the band speech needs to stay intelligible.",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                {t}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="The voice band" subtitle="Everything outside the shaded band is filtered away by the network.">
          <Scope height={148}>
            <ScopeCanvas
              label="The telephone voice band runs from 300 hertz to 3400 hertz, a bandwidth of about 3100 hertz"
              bounds={{ x0: 0, x1: 4400, y0: 0, y1: 1.15 }}
              insets={{ left: 22, right: 16, top: 22, bottom: 26 }}
              draw={({ plot, palette }) => {
                plot.grid({ xEvery: 500, xMajorEvery: 1000 });
                plot.band(300, 3400, palette.series[0], 0.16);
                plot.vLine(300, palette.series[0], { width: 1.5 });
                plot.vLine(3400, palette.series[0], { width: 1.5 });

                // A crude speech envelope, purely indicative.
                const N = 400;
                const d = new Float64Array(N);
                for (let i = 0; i < N; i++) {
                  const f = (i / (N - 1)) * 4400;
                  const inBand = f > 300 && f < 3400;
                  const shape = Math.exp(-((f - 900) ** 2) / (2 * 700 ** 2)) * 0.9 + 0.12;
                  d[i] = inBand ? shape : shape * 0.06;
                }
                plot.trace(d, palette.series[1], { width: 2, glow: 8 });

                plot.measure(300, 3400, 1.03, palette.series[0], "≈ 3100 Hz usable", { above: false });
                plot.xTicks(1000, (v) => (v === 0 ? "0" : `${v / 1000}k`));
                plot.text(plot.right, plot.bottom + 12, "Hz", palette.ink, { size: 9, align: "right" });
                plot.axisFrame();
              }}
            />
          </Scope>
          <p className="mt-3 max-w-[62ch] text-sm text-ink-2">
            A computer's digital signal has sharp square edges, which need a very wide range of frequencies to
            survive. Put one straight onto a telephone line and the network throws almost all of it away. Something
            has to translate, and that something is the modem.
          </p>
        </Panel>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 2. End-to-end link: the schematic students must be able to draw
 * ================================================================== */

/** Four bits only: the tap panels are narrow, and a denser carrier turns into a solid block. */
const LINK_BITS = [1, 0, 1, 1];

function LinkSection() {
  const [scheme, setScheme] = useState<Keying>("fsk");
  const [running, setRunning] = useState(true);

  const analog = useMemo(() => keyedCarrier(LINK_BITS, scheme, 1200, 2.5), [scheme]);

  const stages = [
    {
      id: "pc-a",
      title: "Computer A",
      role: "Produces digital data",
      tap: "Digital: square, two voltage levels",
      series: 2,
      kind: "digital" as const,
    },
    {
      id: "modem-a",
      title: "Modem A",
      role: "MODulates",
      tap: `Analog: ${KEYING[scheme].long}`,
      series: 0,
      kind: "analog" as const,
    },
    {
      id: "pstn",
      title: "PSTN line",
      role: "Carries analog voice",
      tap: "Analog, inside the voice band",
      series: 0,
      kind: "analog" as const,
    },
    {
      id: "modem-b",
      title: "Modem B",
      role: "DEModulates",
      tap: "Digital: recovered bits",
      series: 2,
      kind: "digital" as const,
    },
    {
      id: "pc-b",
      title: "Computer B",
      role: "Receives the data",
      tap: "Digital: identical to the original",
      series: 2,
      kind: "digital" as const,
    },
  ];

  return (
    <Section
      id="link"
      title="Two computers, two modems, one telephone line"
      lead="This is the schematic the syllabus asks you to be able to draw. Follow one byte across it: it leaves computer A as a square digital signal, is turned into an analog tone by modem A, crosses the PSTN as sound the network is happy to carry, and is turned back into bits by modem B."
    >
      <Panel
        title="End-to-end link"
        subtitle="Each panel shows the actual signal at that point in the chain."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              label="Modulation scheme"
              size="sm"
              value={scheme}
              onChange={setScheme}
              options={(Object.keys(KEYING) as Keying[]).map((k) => ({ value: k, label: KEYING[k].name }))}
            />
            <Button size="sm" onClick={() => setRunning((r) => !r)}>
              {running ? "Pause" : "Play"}
            </Button>
          </div>
        }
      >
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-5">
          {stages.map((s, i) => (
            <li key={s.id} className="relative min-w-0">
              <div
                className={clsx(
                  "flex h-full flex-col rounded-lg border p-3",
                  s.id === "pstn" ? "border-brand-edge bg-brand-wash" : "border-line bg-surface-2",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="truncate text-xs font-semibold text-ink">{s.title}</h4>
                  <Badge tone={s.kind === "digital" ? "neutral" : "brand"}>{s.kind}</Badge>
                </div>
                <p className="mt-0.5 text-2xs text-ink-3">{s.role}</p>

                <div className="mt-2.5 overflow-hidden rounded-md border border-line" style={{ height: 62 }}>
                  <ScopeCanvas
                    label={s.tap}
                    animate={running}
                    deps={[scheme, s.kind, i]}
                    bounds={{ x0: 0, x1: LINK_BITS.length, y0: -1.5, y1: 1.5 }}
                    insets={{ left: 6, right: 6, top: 6, bottom: 6 }}
                    draw={({ plot, palette, time }) => {
                      const colour = palette.series[s.series];
                      // A travelling window so the eye can follow one byte along the chain.
                      const lead = running ? ((time * 0.5 - i * 0.12) % 1.6) : 1;
                      const reveal = Math.max(0, Math.min(1, lead));

                      if (s.kind === "digital") {
                        plot.steps(encode(LINK_BITS, "nrz-l"), colour, {
                          high: 0.95,
                          low: -0.95,
                          width: 1.8,
                          glow: 8,
                          alpha: 0.25,
                        });
                        if (reveal > 0) {
                          const segs = encode(LINK_BITS, "nrz-l").filter((sg) => sg.from < reveal * LINK_BITS.length);
                          plot.steps(segs, colour, { high: 0.95, low: -0.95, width: 2, glow: 10 });
                        }
                      } else {
                        plot.trace(analog, colour, { width: 1.4, alpha: 0.22 });
                        if (reveal > 0.02) {
                          const n = Math.max(2, Math.floor(analog.length * reveal));
                          plot.trace(analog.slice(0, n), colour, {
                            width: 1.6,
                            glow: 5,
                            x0: 0,
                            x1: reveal * LINK_BITS.length,
                          });
                        }
                      }
                    }}
                  />
                </div>
                <p className="mt-1.5 text-2xs text-ink-2">{s.tap}</p>
              </div>

              {i < stages.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-1/2 -right-2.5 z-[var(--z-raised)] hidden h-5 w-5 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg lg:grid"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5h5m0 0L4.8 2.8M7 5L4.8 7.2" stroke="var(--ink-3)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-ink">Modulation, at modem A</p>
            <p className="mt-1 max-w-[46ch] text-sm text-ink-2">
              Digital in, analog out. The modem takes the bits and varies the{" "}
              <strong className="font-semibold text-ink">{KEYING[scheme].varies}</strong> of a carrier tone that
              sits comfortably inside the voice band.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink">Demodulation, at modem B</p>
            <p className="mt-1 max-w-[46ch] text-sm text-ink-2">
              Analog in, digital out. The modem listens to the incoming tone, works out which{" "}
              {KEYING[scheme].varies} was used in each symbol period, and rebuilds the original square waveform.
            </p>
          </div>
        </div>
      </Panel>

      <Callout kind="exam" title="Where the name comes from">
        <strong>MO</strong>dulator + <strong>DEM</strong>odulator = <strong>MODEM</strong>. Every modem does both
        jobs, because traffic flows in both directions: the one at your end modulates what you send and
        demodulates what arrives. A schematic with only one modem, or with a modem at only one end, will lose
        marks.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * 3. Analog modulation lab
 * ================================================================== */

function ModulationLab() {
  const [kind, setKind] = useState<Modulation>("am");
  const [msgFreq, setMsgFreq] = useState(1.2);
  const [carrierFreq, setCarrierFreq] = useState(14);
  const [depth, setDepth] = useState(0.7);
  const [showParts, setShowParts] = useState(true);

  const N = 1600;
  const result = useMemo(
    () => modulate(kind, 1, N, { frequency: msgFreq, amplitude: 1 }, { frequency: carrierFreq, amplitude: 1 }, depth),
    [kind, msgFreq, carrierFreq, depth],
  );

  return (
    <Section
      id="modulation"
      title="Modulation lab"
      lead="Modulation means attaching a low-frequency message to a high-frequency carrier by changing one of the carrier's properties. The message decides how the carrier is bent; the carrier does the actual travelling."
    >
      <Panel
        title={MODULATION[kind].long}
        subtitle={MODULATION[kind].note}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              label="Modulation type"
              value={kind}
              onChange={setKind}
              options={(Object.keys(MODULATION) as Modulation[]).map((k) => ({
                value: k,
                label: MODULATION[k].name,
                title: MODULATION[k].long,
              }))}
            />
            <Toggle checked={showParts} onChange={setShowParts} label="Show inputs" />
          </div>
        }
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_236px]">
          <div className="min-w-0">
            {showParts && (
              <div className="mb-2 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
                <Scope height={92} caption="Message (modulating signal)">
                  <ScopeCanvas
                    label="The low-frequency message signal"
                    deps={[msgFreq]}
                    bounds={{ x0: 0, x1: 1, y0: -1.35, y1: 1.35 }}
                    insets={{ left: 10, right: 10, top: 8, bottom: 8 }}
                    draw={({ plot, palette }) => {
                      plot.grid({ xEvery: 0.125 });
                      plot.zeroLine();
                      plot.trace(result.message, palette.series[3], { width: 2, glow: 8 });
                    }}
                  />
                </Scope>
                <Scope height={92} caption="Carrier">
                  <ScopeCanvas
                    label="The high-frequency carrier signal"
                    deps={[carrierFreq]}
                    bounds={{ x0: 0, x1: 1, y0: -1.35, y1: 1.35 }}
                    insets={{ left: 10, right: 10, top: 8, bottom: 8 }}
                    draw={({ plot, palette }) => {
                      plot.grid({ xEvery: 0.125 });
                      plot.zeroLine();
                      plot.trace(result.carrier, palette.series[1], { width: 1.6, glow: 6 });
                    }}
                  />
                </Scope>
              </div>
            )}

            <Scope height={showParts ? 208 : 300} caption="Modulated signal: this is what goes on the line">
              <ScopeCanvas
                label={`${MODULATION[kind].long} of the message onto the carrier`}
                deps={[kind, msgFreq, carrierFreq, depth]}
                bounds={{ x0: 0, x1: 1, y0: -2.2, y1: 2.2 }}
                insets={{ left: 30, right: 16, top: 14, bottom: 18 }}
                draw={({ plot, palette }) => {
                  plot.grid({ xEvery: 0.125, yEvery: 1 });
                  plot.zeroLine();

                  // For AM the envelope is the whole point, so draw it as a guide.
                  if (result.envelope) {
                    const upper = result.envelope;
                    const lower = new Float64Array(upper.length);
                    for (let i = 0; i < upper.length; i++) lower[i] = -upper[i];
                    plot.trace(upper, palette.series[3], { width: 1.4, dash: [4, 4], alpha: 0.9 });
                    plot.trace(lower, palette.series[3], { width: 1.4, dash: [4, 4], alpha: 0.9 });
                  } else {
                    // FM and PM keep constant amplitude, so show that explicitly.
                    plot.hLine(1, palette.series[3], { dash: [4, 4], alpha: 0.7 });
                    plot.hLine(-1, palette.series[3], { dash: [4, 4], alpha: 0.7 });
                  }

                  plot.trace(result.modulated, palette.series[0], { width: 1.9, glow: 10 });
                  plot.yTicks([-2, 0, 2], (v) => `${v}`);
                }}
              />
            </Scope>

            <Legend
              className="mt-3"
              items={[
                { color: "var(--s4)", label: "Message" },
                { color: "var(--s2)", label: "Carrier" },
                { color: "var(--s1)", label: "Modulated output" },
                { color: "var(--s4)", label: result.envelope ? "Envelope" : "Constant amplitude", dash: true },
              ]}
            />
          </div>

          <div className="grid content-start gap-4 lg:border-l lg:border-line lg:pl-4">
            <Slider
              label="Message frequency"
              value={msgFreq}
              onChange={setMsgFreq}
              min={0.5}
              max={3}
              step={0.1}
              readout={`${msgFreq.toFixed(1)} ×`}
              accent="var(--s4)"
              hint="The information being sent."
            />
            <Slider
              label="Carrier frequency"
              value={carrierFreq}
              onChange={setCarrierFreq}
              min={6}
              max={30}
              step={1}
              readout={`${carrierFreq} ×`}
              accent="var(--s2)"
              hint="Always much higher than the message."
            />
            <Slider
              label={kind === "am" ? "Modulation depth" : kind === "fm" ? "Frequency deviation" : "Phase deviation"}
              value={depth}
              onChange={setDepth}
              min={0}
              max={1}
              step={0.05}
              readout={`${Math.round(depth * 100)}%`}
              accent="var(--s1)"
              hint="How strongly the message bends the carrier."
            />

            <div className="border-t border-line pt-3">
              <Readout
                label="What changes"
                value={<span className="text-sm capitalize">{MODULATION[kind].varies}</span>}
                tone="brand"
              />
              <p className="mt-2 text-2xs text-ink-3">
                {kind === "am" && "Frequency and phase are held constant."}
                {kind === "fm" && "Amplitude and phase are held constant."}
                {kind === "pm" && "Amplitude and frequency are held constant."}
              </p>
            </div>

            {depth === 0 && (
              <p className="rounded-lg bg-warn-wash px-3 py-2 text-2xs text-ink">
                With the deviation at zero the message has no effect at all, and the output is just the bare carrier.
                Nothing is being transmitted.
              </p>
            )}
          </div>
        </div>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * 4. PCM
 * ================================================================== */

function PcmSection() {
  const [rate, setRate] = useState(16);
  const [bitsPerSample, setBits] = useState(3);
  const [showRecon, setShowRecon] = useState(true);

  const N = 900;
  const source = useMemo(
    () => {
      const a = sampleWave({ amplitude: 0.72, frequency: 1.4, phase: 0 }, 1, N);
      const b = sampleWave({ amplitude: 0.24, frequency: 3.1, phase: 60 }, 1, N);
      const out = new Float64Array(N);
      for (let i = 0; i < N; i++) out[i] = a[i] + b[i];
      return out;
    },
    [],
  );

  const result = useMemo(() => pcm(source, 1, rate, bitsPerSample, 1), [source, rate, bitsPerSample]);
  /** Nyquist: the sampling rate must exceed twice the highest frequency present (3.1 here). */
  const nyquistOk = rate >= 2 * 3.1;

  return (
    <Section
      id="pcm"
      title="Pulse Code Modulation: turning a voice into numbers"
      lead="PCM is the reverse trip: an analog signal becomes digital. Measure the waveform's height at regular instants, round each measurement to the nearest allowed level, and send those numbers. The receiver holds each number until the next arrives and rebuilds the shape."
    >
      <Panel
        title="Sampling and quantisation"
        subtitle="Orange stems are the samples taken; the stepped trace is what the receiver reconstructs from them."
        actions={<Toggle checked={showRecon} onChange={setShowRecon} label="Show reconstruction" accent="var(--s2)" />}
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_236px]">
          <div className="min-w-0">
            <Scope height={272}>
              <ScopeCanvas
                label={`An analog signal sampled ${rate} times, each rounded to one of ${result.levels} levels`}
                deps={[rate, bitsPerSample, showRecon]}
                bounds={{ x0: 0, x1: 1, y0: -1.25, y1: 1.25 }}
                insets={{ left: 40, right: 16, top: 16, bottom: 22 }}
                draw={({ plot, palette }) => {
                  // Quantisation rails: the only heights a sample is allowed to take.
                  const step = 2 / (result.levels - 1);
                  for (let i = 0; i < result.levels; i++) {
                    plot.hLine(-1 + i * step, palette.grid, { dash: [2, 5] });
                  }
                  plot.zeroLine();

                  if (showRecon) {
                    plot.trace(result.reconstruction, palette.series[1], { width: 2, glow: 8 });
                  }
                  plot.trace(source, palette.series[3], { width: 1.8, alpha: showRecon ? 0.75 : 1, glow: 6 });

                  for (const s of result.samples) {
                    plot.stem(s.t, s.quantised, palette.series[0], 0, 1.2);
                    plot.dot(s.t, s.quantised, palette.series[0], 3.4);
                  }

                  plot.yTicks([-1, 0, 1], (v) => `${v}`);
                  plot.text(plot.right - 4, plot.top + 2, `${result.levels} levels`, palette.inkFaint, {
                    size: 9,
                    align: "right",
                  });
                }}
              />
            </Scope>

            <Legend
              className="mt-3"
              items={[
                { color: "var(--s4)", label: "Original analog signal" },
                { color: "var(--s1)", label: "Samples, rounded to a level" },
                ...(showRecon ? [{ color: "var(--s2)", label: "Reconstruction at the receiver" }] : []),
              ]}
            />

            <div className="mt-3 flex flex-wrap gap-6">
              <Readout label="Samples per second" value={rate} sub={`over ${result.samples.length} taken`} />
              <Readout
                label="Levels available"
                value={result.levels}
                sub={`${bitsPerSample} bits per sample`}
                tone="brand"
              />
              <Readout
                label="Bit rate produced"
                value={si(rate * bitsPerSample, "bit/s", 3)}
                sub="rate × bits per sample"
              />
              <Readout
                label="Quantisation error"
                value={`${(result.error * 100).toFixed(1)}%`}
                tone={result.error < 0.03 ? "ok" : result.error < 0.08 ? "warn" : "bad"}
                sub="RMS, of full scale"
              />
            </div>
          </div>

          <div className="grid content-start gap-4 lg:border-l lg:border-line lg:pl-4">
            <Slider
              label="Sampling rate"
              value={rate}
              onChange={setRate}
              min={4}
              max={60}
              step={1}
              readout={`${rate} /s`}
              accent="var(--s1)"
              hint="How often the height is measured."
            />
            <Slider
              label="Bits per sample"
              value={bitsPerSample}
              onChange={setBits}
              min={1}
              max={6}
              step={1}
              readout={`${bitsPerSample} bit${bitsPerSample === 1 ? "" : "s"}`}
              accent="var(--s2)"
              hint={`Gives ${2 ** bitsPerSample} possible levels.`}
            />

            <div
              className={clsx(
                "rounded-lg px-3 py-2.5 text-2xs",
                nyquistOk ? "bg-ok-wash text-ink" : "bg-bad-wash text-ink",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold" style={{ color: nyquistOk ? "var(--ok)" : "var(--bad)" }}>
                  {nyquistOk ? "Sampling fast enough" : "Sampling too slowly"}
                </p>
                {/* The syllabus asks only that sampling happens, not for the
                    theorem that fixes the rate. */}
                <Extra>Nyquist</Extra>
              </div>
              <p className="mt-1 text-ink-2">
                {nyquistOk
                  ? "The rate is more than twice the highest frequency in the signal, so the original shape can be recovered."
                  : "Below twice the highest frequency, detail is lost for good. Notice the reconstruction missing whole wiggles."}
              </p>
            </div>

            <div className="grid gap-1.5">
              <Button size="sm" onClick={() => { setRate(8); setBits(2); }}>
                Coarse
              </Button>
              <Button size="sm" onClick={() => { setRate(40); setBits(6); }}>
                Fine
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Panel title="Why 8000 samples a second?">
          <p className="max-w-[62ch] text-sm text-ink-2">
            The telephone voice band tops out near 3400 Hz. To capture a signal faithfully you must sample at more
            than twice its highest frequency, so 8000 samples per second was chosen with a little margin to spare.
            Each sample is coded in 8 bits, which is where the familiar 64 kbit/s digital voice channel comes from.
          </p>
          <div className="mt-3 grid gap-2">
            <Formula note="The sampling rate must be more than twice the highest frequency present.">
              f_sample &gt; 2 × f_max
            </Formula>
            <Formula note="8000 samples per second × 8 bits per sample.">
              8000 × 8 = 64 000 bit/s
            </Formula>
          </div>
        </Panel>

        <Callout kind="exam" title="Two different errors, two different fixes">
          Sampling <strong>too slowly</strong> loses detail between the samples, and the fix is a higher sampling
          rate. Using <strong>too few bits</strong> per sample forces each measurement to be rounded a long way, and
          the fix is more bits per sample. Turn each slider down on its own in the lab above and you can see the
          two faults look completely different.
        </Callout>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * Quiz
 * ================================================================== */

const QUESTIONS: Question[] = [
  {
    id: "p1",
    prompt: "Why can a computer's digital signal not simply be put straight onto a PSTN line?",
    options: [
      { label: "The line has no electricity in it" },
      { label: "The PSTN is engineered to carry analog signals in the narrow voice band, not sharp digital edges", correct: true },
      { label: "The line is too slow for any kind of data" },
      { label: "Digital signals travel faster than the line allows" },
    ],
    explain:
      "The PSTN was built to carry analog voice across roughly 300–3400 Hz. A square digital waveform needs a far wider range of frequencies to keep its shape, so the network would filter it into uselessness.",
  },
  {
    id: "p2",
    prompt: "What does a modem do?",
    options: [
      { label: "Only converts digital signals into analog signals" },
      { label: "Only converts analog signals into digital signals" },
      { label: "Both: it modulates outgoing data and demodulates incoming data", correct: true },
      { label: "It amplifies the signal so it travels further" },
    ],
    explain:
      "MODEM is short for MODulator-DEModulator. Because data flows in both directions, the modem at each end must do both jobs: modulate what that computer sends and demodulate what arrives for it.",
  },
  {
    id: "p3",
    prompt: "In amplitude modulation, which properties of the carrier stay unchanged?",
    options: [
      { label: "Frequency and phase", correct: true },
      { label: "Amplitude and frequency" },
      { label: "Amplitude and phase" },
      { label: "None, since all three change together" },
    ],
    explain:
      "AM varies only the carrier's amplitude in step with the message. Its frequency and phase are left alone, which is why the modulated waveform keeps the same cycle spacing throughout.",
  },
  {
    id: "p4",
    prompt: "A schematic shows two computers connected over a PSTN line. How many modems are needed?",
    options: [
      { label: "One, at the sending end" },
      { label: "One, at the receiving end" },
      { label: "Two, one at each end", correct: true },
      { label: "None, if the line is digital" },
    ],
    explain:
      "Each computer needs its own modem: the local one modulates outgoing data onto the line and demodulates the analog signal arriving from the far end. The correct diagram is computer – modem – PSTN – modem – computer.",
  },
  {
    id: "p5",
    prompt: "In PCM, what happens during quantisation?",
    options: [
      { label: "The signal's height is measured at regular time intervals" },
      { label: "Each measured height is rounded to the nearest allowed level", correct: true },
      { label: "The signal is amplified to a standard size" },
      { label: "The samples are transmitted down the line" },
    ],
    explain:
      "Sampling is the measuring step; quantisation is the rounding step that follows it. Rounding is what makes the value expressible in a fixed number of bits, and it is also where quantisation error comes from.",
  },
  {
    id: "p6",
    prompt: "A voice channel is sampled 8000 times per second with 8 bits per sample. What bit rate does this produce?",
    options: [
      { label: "8 kbit/s" },
      { label: "16 kbit/s" },
      { label: "64 kbit/s", correct: true },
      { label: "128 kbit/s" },
    ],
    explain:
      "Multiply the sampling rate by the bits in each sample: 8000 × 8 = 64 000 bit/s, or 64 kbit/s. This is the standard digital voice channel used throughout the telephone network.",
  },
];
