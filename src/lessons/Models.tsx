import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Section } from "../components/LessonPage";
import { ScopeCanvas } from "../components/ScopeCanvas";
import { Quiz, type Question } from "../components/Quiz";
import {
  Badge,
  Button,
  Callout,
  Extra,
  Legend,
  Panel,
  Readout,
  Reveal,
  Scope,
  Segmented,
  Slider,
} from "../components/ui";
import { useReducedMotion } from "../lib/theme";
import {
  ENCAP_STEPS,
  FLOW,
  NETWORK_DEVICES,
  MODEL_DIFFERENCES,
  MODEL_MAP,
  OSI_LAYERS,
  OSI_TO_TCPIP,
  TCPIP_LAYERS,
  encapsulate,
  type Layer,
} from "../lib/models";

export function ModelsLesson() {
  return (
    <>
      <WhySection />
      <StackSection />
      <UnitsSection />
      <FlowSection />
      <DevicesSection />
      <Section id="check" title="Check yourself">
        <Quiz lessonId="models" questions={QUESTIONS} />
      </Section>
    </>
  );
}

/* ================================================================== *
 * 1. Why a layered model
 * ================================================================== */

const BENEFITS = [
  {
    t: "One hard problem becomes several easy ones",
    d: "Routing across the world and putting a voltage on a wire are completely different jobs. Separating them means nobody has to solve both at once.",
  },
  {
    t: "A layer can be replaced without touching the others",
    d: "Move a laptop from Ethernet to Wi-Fi and everything above the bottom layer carries on unchanged. The browser never finds out.",
  },
  {
    t: "Each layer talks only to its opposite number",
    d: "The transport layer at one end is answered by the transport layer at the other. What happens below is somebody else's problem.",
  },
  {
    t: "Different manufacturers can interoperate",
    d: "Agreeing on the boundaries between layers is what lets a router from one company carry traffic from a program written by another.",
  },
];

function WhySection() {
  return (
    <Section
      id="why"
      title="Nobody could write this as one program"
      lead="Every level so far has solved one piece of the problem: signals, frames, addresses, ports, names. A reference model is the map that says how those pieces stack up: what each one is responsible for, and where one ends and the next begins. Two such models matter for the paper, and they describe the same journey at different resolutions."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Panel title="Without layers">
          <p className="max-w-[52ch] text-sm text-ink-2">
            One program would have to know how to encode a bit as a voltage, share a cable, find a route across
            the world, recover from loss <em>and</em> render a web page. Change the cable and you rewrite the
            browser.
          </p>
          <div className="mt-3 rounded-lg border border-line bg-surface-2 p-4">
            <div className="grid place-items-center rounded-md border border-dashed border-line-strong px-3 py-6 text-center">
              <p className="text-sm font-semibold text-ink">Everything, all at once</p>
              <p className="mt-1 max-w-[30ch] text-2xs text-ink-3">
                Nothing can be changed in isolation, and nothing can be reused.
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="With layers">
          <p className="max-w-[52ch] text-sm text-ink-2">
            Each layer offers a service to the layer above and uses the service of the layer below. The
            boundaries between them are agreed, so the inside of any one layer can be rebuilt freely.
          </p>
          <div className="mt-3 grid gap-1.5">
            {["Application", "Transport", "Internet", "Host to network"].map((l, i) => (
              <div
                key={l}
                className="flex items-center justify-between rounded-md border px-3 py-2"
                style={{
                  borderColor: `color-mix(in oklab, var(--s${i + 1}) 35%, transparent)`,
                  background: `color-mix(in oklab, var(--s${i + 1}) 7%, transparent)`,
                }}
              >
                <span className="text-sm font-medium" style={{ color: `var(--s${i + 1}-ink)` }}>
                  {l}
                </span>
                <span className="text-2xs text-ink-3">uses the layer below</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        {BENEFITS.map((b) => (
          <div key={b.t} className="rounded-lg border border-line bg-surface px-4 py-3">
            <p className="text-sm font-semibold text-ink">{b.t}</p>
            <p className="mt-1 max-w-[46ch] text-sm text-ink-2">{b.d}</p>
          </div>
        ))}
      </div>

      <Callout kind="note" title="A model is not a protocol">
        Neither model is software you can install. They are descriptions, an agreed vocabulary for saying which
        job belongs where. TCP/IP is the model the Internet was actually built on; OSI is the fuller reference
        that examiners use to talk about layers that TCP/IP leaves inside the application.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * 2. The two stacks
 * ================================================================== */

function StackSection() {
  const [selected, setSelected] = useState<string>("osi-network");

  const layer =
    OSI_LAYERS.find((l) => l.id === selected) ?? TCPIP_LAYERS.find((l) => l.id === selected) ?? OSI_LAYERS[4];

  // Whichever column was clicked, both ends of the mapping light up.
  const tcpId = selected.startsWith("osi-") ? OSI_TO_TCPIP[selected] : selected;
  const osiIds = MODEL_MAP[tcpId] ?? [];

  return (
    <Section
      id="stack"
      title="Seven layers, or four"
      lead="The OSI model splits the journey into seven layers; the TCP/IP model does the same job in four. They are not rivals; TCP/IP simply draws fewer lines, folding OSI's top three layers into one application layer and its bottom two into one host-to-network layer. Select any layer to see what it does and what it lines up with."
    >
      <Panel
        title="The two models, side by side"
        subtitle="The height of each TCP/IP box shows how many OSI layers it absorbs."
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <p className="mb-2 text-2xs font-semibold tracking-wide text-ink-3">OSI · 7 layers</p>
            <div className="grid gap-1.5">
              {OSI_LAYERS.map((l) => (
                <LayerButton
                  key={l.id}
                  layer={l}
                  active={selected === l.id}
                  linked={osiIds.includes(l.id)}
                  onClick={() => setSelected(l.id)}
                />
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <p className="mb-2 text-2xs font-semibold tracking-wide text-ink-3">TCP/IP · 4 layers</p>
            <div className="grid gap-1.5" style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}>
              {TCPIP_LAYERS.map((l) => (
                <LayerButton
                  key={l.id}
                  layer={l}
                  active={selected === l.id}
                  linked={tcpId === l.id}
                  span={MODEL_MAP[l.id].length}
                  onClick={() => setSelected(l.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          key={layer.id}
          className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 sm:grid-cols-[minmax(0,1fr)_auto]"
          style={{ animation: "rise var(--dur) var(--ease-out-quart)" }}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-ink">
                {layer.name}
                <span className="ml-2 font-normal text-ink-3">
                  layer {layer.n} of {selected.startsWith("osi-") ? "OSI" : "TCP/IP"}
                </span>
              </h4>
              <Badge tone="brand">{layer.unit}</Badge>
            </div>
            <p className="mt-1 max-w-[62ch] text-sm text-ink-2">{layer.role}</p>
            <ul className="mt-2.5 grid gap-1.5">
              {layer.jobs.map((j) => (
                <li key={j} className="flex gap-2 text-sm text-ink-2">
                  <span
                    className="mt-[9px] h-1 w-1 shrink-0 rounded-full"
                    style={{ background: `var(--s${layer.series + 1})` }}
                  />
                  <span className="max-w-[58ch]">{j}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:w-[190px] sm:border-l sm:border-line sm:pl-4">
            <p className="text-2xs font-semibold text-ink-3">Lives here</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {layer.examples.map((e) => (
                <li key={e}>
                  <Badge>{e}</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-2xs font-semibold text-ink-3">Data unit</p>
            <p className="tnum mt-0.5 font-mono text-sm font-semibold text-ink">{layer.unit}</p>
          </div>
        </div>
      </Panel>

      <Panel title="What the models disagree about" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">OSI model</th>
                <th className="px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">TCP/IP model</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_DIFFERENCES.map((d) => (
                <tr key={d.osi} className="border-b border-line last:border-0">
                  <td className="max-w-[40ch] px-4 py-2.5 align-top text-ink-2">{d.osi}</td>
                  <td className="max-w-[40ch] px-4 py-2.5 align-top text-ink-2">{d.tcpip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Callout kind="exam" title="The mapping, in one line">
        Application + presentation + session become the TCP/IP <strong>application</strong> layer; OSI transport
        becomes TCP/IP <strong>transport</strong> (host to host); OSI network becomes the{" "}
        <strong>Internet</strong> layer; and data link + physical become <strong>host to network</strong>. That
        one sentence answers most questions asked about the two models together.
      </Callout>
    </Section>
  );
}

function LayerButton({
  layer,
  active,
  linked,
  span = 1,
  onClick,
}: {
  layer: Layer;
  active: boolean;
  linked: boolean;
  span?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        gridRow: span > 1 ? `span ${span}` : undefined,
        borderColor: active || linked ? `var(--s${layer.series + 1})` : undefined,
        background: linked ? `color-mix(in oklab, var(--s${layer.series + 1}) 9%, transparent)` : undefined,
      }}
      className={clsx(
        "flex min-w-0 flex-col justify-center rounded-lg border px-2.5 py-2 text-left transition-all duration-150 ease-[var(--ease-out-quart)]",
        active ? "shadow-sm" : "hover:bg-surface-2",
        !active && !linked && "border-line bg-surface",
      )}
    >
      <span className="flex items-baseline gap-1.5">
        <span className="tnum shrink-0 font-mono text-2xs font-semibold text-ink-3">{layer.n}</span>
        <span
          className="min-w-0 truncate text-xs font-semibold"
          style={{ color: active || linked ? `var(--s${layer.series + 1}-ink)` : "var(--ink)" }}
        >
          {layer.name}
        </span>
      </span>
      <span className="mt-0.5 truncate text-2xs text-ink-3">{layer.unit}</span>
    </button>
  );
}

/* ================================================================== *
 * 3. Data units and encapsulation
 * ================================================================== */

const PRESETS = [
  { label: "1 byte", value: 1, note: "one keystroke" },
  { label: "20 bytes", value: 20, note: "a short chat message" },
  { label: "500 bytes", value: 500, note: "a small web request" },
  { label: "1460 bytes", value: 1460, note: "a full segment" },
];

function UnitsSection() {
  const [payload, setPayload] = useState(20);
  const enc = encapsulate(payload);
  const frame = enc.levels[3];

  return (
    <Section
      id="units"
      title="Data, segment, packet, frame, bits"
      lead="The same information has a different name at every layer, because at every layer it is wrapped in one more header. That wrapping is called encapsulation, and the name of the unit tells you exactly how far down the stack it has travelled, which is why the paper asks for the names."
    >
      <Panel
        title="Encapsulation, drawn to scale"
        subtitle="Every block is drawn in proportion to its real size in bytes."
        actions={
          <Segmented
            label="Payload preset"
            size="sm"
            value={String(payload)}
            onChange={(v) => setPayload(Number(v))}
            options={PRESETS.map((p) => ({ value: String(p.value), label: p.label, title: p.note }))}
          />
        }
      >
        <Scope height={252}>
          <ScopeCanvas
            label={`${payload} bytes of data wrapped into a segment, a packet and then a ${enc.frameBytes}-byte frame, of which ${Math.round(enc.efficiency * 100)} per cent is the original data`}
            deps={[payload]}
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, w }) => {
              const left = 74;
              const right = w - 16;
              const width = right - left;
              const pxPerByte = width / enc.frameBytes;
              const rowH = 30;
              const gap = 14;
              const top = 16;

              // A header two bytes wide would vanish, and the whole point is that
              // it is still there, so slivers get a floor.
              const wOf = (bytes: number) => (bytes === 0 ? 0 : Math.max(bytes * pxPerByte, 3));

              type Block = { bytes: number; label: string; series: number; hatch?: boolean };
              const rows: { name: string; blocks: Block[] }[] = [
                { name: "Data", blocks: [{ bytes: payload, label: "Data", series: 0 }] },
                {
                  name: "Segment",
                  blocks: [
                    { bytes: 20, label: "TCP", series: 1 },
                    { bytes: payload, label: "Data", series: 0 },
                  ],
                },
                {
                  name: "Packet",
                  blocks: [
                    { bytes: 20, label: "IP", series: 2 },
                    { bytes: 20, label: "TCP", series: 1 },
                    { bytes: payload, label: "Data", series: 0 },
                  ],
                },
                {
                  name: "Frame",
                  blocks: [
                    { bytes: 14, label: "Eth", series: 3 },
                    { bytes: 20, label: "IP", series: 2 },
                    { bytes: 20, label: "TCP", series: 1 },
                    { bytes: payload, label: "Data", series: 0 },
                    ...(frame.padBytes ? [{ bytes: frame.padBytes, label: "pad", series: 4, hatch: true }] : []),
                    { bytes: 4, label: "FCS", series: 3 },
                  ],
                },
              ];

              rows.forEach((row, ri) => {
                const y = top + ri * (rowH + gap);
                plot.text(left - 10, y + rowH / 2, row.name, palette.inkFaint, {
                  size: 10,
                  weight: 700,
                  align: "right",
                  baseline: "middle",
                });

                let x = left;
                for (const b of row.blocks) {
                  const bw = wOf(b.bytes);
                  const colour = palette.series[b.series];
                  ctx.save();
                  ctx.fillStyle = colour;
                  ctx.globalAlpha = b.hatch ? 0.18 : b.label === "Data" ? 0.22 : 0.9;
                  ctx.beginPath();
                  ctx.roundRect(x, y, Math.max(bw, 1.5), rowH, 3);
                  ctx.fill();
                  ctx.globalAlpha = 1;
                  ctx.strokeStyle = colour;
                  ctx.lineWidth = 1.2;
                  ctx.stroke();

                  if (bw > 30) {
                    ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                    ctx.fillStyle = b.label === "Data" || b.hatch ? colour : palette.bg;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(b.label, x + bw / 2, y + rowH / 2 - 4);
                    ctx.font = '500 8px "JetBrains Mono Variable", ui-monospace, monospace';
                    ctx.fillText(`${b.bytes} B`, x + bw / 2, y + rowH / 2 + 7);
                  }
                  ctx.restore();
                  x += bw;
                }

                // The arrow down to the next row, showing what gets wrapped.
                if (ri < rows.length - 1) {
                  ctx.save();
                  ctx.strokeStyle = palette.axis;
                  ctx.lineWidth = 1.2;
                  ctx.setLineDash([3, 3]);
                  ctx.beginPath();
                  ctx.moveTo(left - 2, y + rowH + 2);
                  ctx.lineTo(left - 2, y + rowH + gap - 2);
                  ctx.stroke();
                  ctx.restore();
                }
              });

              // The frame as bits on the medium.
              const bitsY = top + 4 * (rowH + gap) + 6;
              plot.text(left - 10, bitsY + 10, "Bits", palette.inkFaint, {
                size: 10,
                weight: 700,
                align: "right",
                baseline: "middle",
              });
              ctx.save();
              ctx.strokeStyle = palette.series[3];
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              const pattern = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0];
              const step = width / pattern.length;
              pattern.forEach((bit, i) => {
                const bx = left + i * step;
                const by = bitsY + (bit ? 2 : 18);
                if (i === 0) ctx.moveTo(bx, by);
                else ctx.lineTo(bx, by);
                ctx.lineTo(bx + step, by);
              });
              ctx.stroke();
              ctx.restore();
              plot.text(right, bitsY + 30, `${enc.bitsOnWire.toLocaleString("en-GB")} bits on the wire`, palette.inkFaint, {
                size: 9,
                align: "right",
              });
            }}
          />
        </Scope>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Slider
              label="Application data"
              value={payload}
              onChange={setPayload}
              min={1}
              max={1460}
              step={1}
              readout={`${payload} bytes`}
              accent="var(--s1)"
              hint="1460 bytes is the most a TCP segment can carry inside one Ethernet frame."
            />
            <Legend
              className="mt-3"
              items={[
                { color: "var(--s1)", label: "Application data" },
                { color: "var(--s2)", label: "TCP header · 20 B" },
                { color: "var(--s3)", label: "IP header · 20 B" },
                { color: "var(--s4)", label: "Ethernet header 14 B + FCS 4 B" },
                ...(frame.padBytes ? [{ color: "var(--s5)", label: `Padding · ${frame.padBytes} B` }] : []),
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-6 lg:border-l lg:border-line lg:pl-4">
            <Readout label="Frame on the wire" value={`${enc.frameBytes} B`} sub={`${enc.bitsOnWire} bits`} />
            <Readout
              label="Overhead"
              value={`${enc.overheadBytes} B`}
              tone={enc.efficiency < 0.5 ? "warn" : "neutral"}
              sub="headers, trailer and padding"
            />
            <Readout
              label="Efficiency"
              value={`${(enc.efficiency * 100).toFixed(1)} %`}
              tone={enc.efficiency > 0.9 ? "ok" : enc.efficiency < 0.5 ? "bad" : "warn"}
              sub="of the frame is your data"
            />
          </div>
        </div>

        <p className="mt-3 max-w-[74ch] rounded-lg bg-surface-2 px-3.5 py-2.5 text-sm text-ink-2">
          {frame.padBytes > 0
            ? `Your ${payload} bytes produce a ${enc.frameBytes}-byte frame, and Ethernet will not send anything shorter, so ${frame.padBytes} bytes of padding are added to reach the minimum. Sending one keystroke costs the same as sending forty-six.`
            : `Your ${payload} bytes travel inside a ${enc.frameBytes}-byte frame. The 58 bytes of headers and trailer are a fixed cost, so the longer the payload, the smaller a share of the wire they take.`}
        </p>
      </Panel>

      <Panel title="The name at each layer" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">Layer</th>
                <th className="px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">Unit is called</th>
                <th className="px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">What that layer adds</th>
              </tr>
            </thead>
            <tbody>
              {ENCAP_STEPS.map((s) => (
                <tr key={s.layer} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 align-top">
                    <span className="text-sm font-medium" style={{ color: `var(--s${s.series + 1}-ink)` }}>
                      {s.layer}
                    </span>
                  </td>
                  <td className="tnum px-4 py-2.5 align-top font-mono text-sm font-semibold text-ink">
                    {s.unit}
                    {s.headerBytes > 0 && (
                      <span className="ml-1.5 font-sans text-2xs font-normal text-ink-3">
                        +{s.headerBytes + s.trailerBytes} B
                      </span>
                    )}
                  </td>
                  <td className="max-w-[46ch] px-4 py-2.5 align-top text-ink-2">{s.adds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Callout kind="exam" title="Three names worth memorising">
          The network layer unit is a <strong>packet</strong>, the data link layer unit is a{" "}
          <strong>frame</strong>, and the physical layer deals in <strong>bits</strong>. Above them, the
          transport layer unit is a <strong>segment</strong> in TCP and a datagram in UDP. Those names are what
          the paper asks for; the byte counts above are here to make the idea concrete, not to be learnt.
        </Callout>

        <Panel
          title="Why the smallest messages are the most expensive"
          actions={<Extra>frame padding and efficiency</Extra>}
        >
          <Reveal label="Work it out">
            <p className="max-w-[58ch]">
              A one-byte keystroke gets a 20-byte TCP header and a 20-byte IP header, which is still only 41
              bytes, below Ethernet's 46-byte minimum payload, so five bytes of padding are added. With the
              14-byte Ethernet header and the 4-byte FCS the frame is 64 bytes, of which one byte is yours:
              an efficiency of 1.6 %. At the other end of the slider, 1460 bytes of data ride in a 1518-byte
              frame, or 96.2 %.
            </p>
          </Reveal>
        </Panel>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 4. Data flow
 * ================================================================== */

function FlowSection() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const posRef = useRef({ x: 0, y: 0, size: 0 });
  const cur = FLOW[step];

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setStep((s) => (s + 1) % FLOW.length), 2000);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <Section
      id="flow"
      title="Down one stack, across, and up the other"
      lead="Here is the whole model in motion. Data goes down the sender's stack, gaining a header at each layer; it crosses the medium as nothing but bits; then it climbs the receiver's stack, losing exactly the header its opposite number added. Each layer only ever reads what the matching layer at the far end wrote."
    >
      <Panel
        title={`Step ${step + 1} of ${FLOW.length}: ${cur.title}`}
        subtitle={cur.detail}
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" onClick={() => setPlaying((p) => !p)}>
              {playing ? "Pause" : "Play"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setPlaying(false);
                setStep((s) => Math.max(0, s - 1));
              }}
              disabled={step === 0}
            >
              Back
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setPlaying(false);
                setStep((s) => (s + 1) % FLOW.length);
              }}
            >
              {step === FLOW.length - 1 ? "Start again" : "Next"}
            </Button>
          </div>
        }
      >
        <Scope height={292}>
          <ScopeCanvas
            label={`Data flow between two hosts using the TCP/IP model. Step ${step + 1}: ${cur.title}. The unit is currently a ${cur.unit}.`}
            animate={!reduced}
            deps={[step, reduced]}
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, w }) => {
              const narrow = w < 520;
              const boxW = narrow ? 96 : 132;
              const boxH = 34;
              const gapY = 12;
              const top = 28;
              const senderX = narrow ? 12 : 28;
              const recvX = w - boxW - (narrow ? 12 : 28);
              const rowY = (i: number) => top + i * (boxH + gapY);
              const wireY = rowY(3) + boxH + 40;

              // The unit travels in a lane beside each stack rather than over it,
              // so a layer's name is never hidden by the thing passing through it.
              const bandW = narrow ? 8 : 13;
              const unitBase = narrow ? 26 : 40;
              const halfMax = (unitBase + 3 * bandW) / 2;
              const laneL = Math.min(senderX + boxW + halfMax + 4, w / 2 - halfMax - 6);
              const laneR = Math.max(recvX - halfMax - 4, w / 2 + halfMax + 6);

              plot.text(senderX + boxW / 2, 10, "Sender", palette.inkFaint, { size: 10, weight: 700, align: "center" });
              plot.text(recvX + boxW / 2, 10, "Receiver", palette.inkFaint, { size: 10, weight: 700, align: "center" });

              // Peer-to-peer links: the layer a layer really talks to.
              TCPIP_LAYERS.forEach((l, i) => {
                const lit = cur.layer === i;
                ctx.save();
                ctx.strokeStyle = lit ? palette.series[l.series] : palette.grid;
                ctx.lineWidth = lit ? 1.6 : 1;
                ctx.setLineDash([4, 4]);
                ctx.globalAlpha = lit ? 0.9 : 0.5;
                ctx.beginPath();
                ctx.moveTo(senderX + boxW + 4, rowY(i) + boxH / 2);
                ctx.lineTo(recvX - 4, rowY(i) + boxH / 2);
                ctx.stroke();
                ctx.restore();
              });

              // The stacks.
              const drawStack = (x: number, side: "sender" | "receiver") => {
                TCPIP_LAYERS.forEach((l, i) => {
                  const active = cur.side === side && cur.layer === i;
                  const colour = palette.series[l.series];
                  const y = rowY(i);
                  ctx.save();
                  if (active && palette.isDark) {
                    ctx.shadowColor = colour;
                    ctx.shadowBlur = 14;
                  }
                  ctx.fillStyle = palette.bg;
                  ctx.strokeStyle = active ? colour : palette.axis;
                  ctx.lineWidth = active ? 2.2 : 1.3;
                  ctx.beginPath();
                  ctx.roundRect(x, y, boxW, boxH, 6);
                  ctx.fill();
                  ctx.stroke();
                  ctx.shadowBlur = 0;
                  ctx.font = `${active ? 700 : 600} ${narrow ? 8.5 : 10}px "JetBrains Mono Variable", ui-monospace, monospace`;
                  ctx.fillStyle = active ? colour : palette.ink;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(l.name, x + boxW / 2, y + boxH / 2);
                  ctx.restore();
                });
              };
              drawStack(senderX, "sender");
              drawStack(recvX, "receiver");

              // The path the data physically takes: down one side, across the
              // medium, and up the other.
              ctx.save();
              ctx.strokeStyle = palette.gridMajor;
              ctx.lineWidth = 2.4;
              ctx.lineJoin = "round";
              ctx.beginPath();
              ctx.moveTo(laneL, rowY(0));
              ctx.lineTo(laneL, wireY);
              ctx.lineTo(laneR, wireY);
              ctx.lineTo(laneR, rowY(0));
              ctx.stroke();
              ctx.lineWidth = 1;
              ctx.setLineDash([2, 3]);
              ctx.globalAlpha = 0.7;
              TCPIP_LAYERS.forEach((_, i) => {
                ctx.beginPath();
                ctx.moveTo(senderX + boxW, rowY(i) + boxH / 2);
                ctx.lineTo(laneL, rowY(i) + boxH / 2);
                ctx.moveTo(recvX, rowY(i) + boxH / 2);
                ctx.lineTo(laneR, rowY(i) + boxH / 2);
                ctx.stroke();
              });
              ctx.restore();
              plot.text((laneL + laneR) / 2, wireY + 12, "the medium: bits only", palette.inkFaint, {
                size: 9,
                align: "center",
              });

              // Where the unit should be for this step, and how big it is.
              const target =
                cur.side === "wire"
                  ? { x: (laneL + laneR) / 2, y: wireY, size: 3 }
                  : {
                      x: cur.side === "sender" ? laneL : laneR,
                      y: rowY(cur.layer ?? 0) + boxH / 2,
                      size: cur.side === "sender" ? (cur.layer ?? 0) : (cur.layer ?? 0) - 1,
                    };

              const p = posRef.current;
              const k = reduced ? 1 : 0.16;
              // Snap on a first paint, then ease, so a step change reads as movement.
              if (p.x === 0 && p.y === 0) Object.assign(p, target);
              p.x += (target.x - p.x) * k;
              p.y += (target.y - p.y) * k;
              p.size += (target.size - p.size) * k;

              // The unit itself: one band per header it is currently carrying.
              const bands = Math.max(0, Math.round(p.size));
              const unitW = unitBase + bands * bandW;
              const colour = palette.series[cur.side === "wire" ? 3 : TCPIP_LAYERS[cur.layer ?? 0].series];
              ctx.save();
              if (palette.isDark) {
                ctx.shadowColor = colour;
                ctx.shadowBlur = 14;
              }
              ctx.fillStyle = colour;
              ctx.beginPath();
              ctx.roundRect(p.x - unitW / 2, p.y - 10, unitW, 20, 5);
              ctx.fill();
              ctx.shadowBlur = 0;
              // Header stripes stack up on the left as the unit descends.
              for (let i = 0; i < bands; i++) {
                ctx.fillStyle = palette.bg;
                ctx.globalAlpha = 0.34;
                ctx.fillRect(p.x - unitW / 2 + 3 + i * bandW, p.y - 7, bandW - 3, 14);
              }
              ctx.globalAlpha = 1;
              ctx.font = `700 ${narrow ? 8 : 9}px "JetBrains Mono Variable", ui-monospace, monospace`;
              ctx.fillStyle = palette.bg;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(cur.unit, p.x + (bands * bandW) / 2, p.y + 0.5);
              ctx.restore();
            }}
          />
        </Scope>

        <ol className="mt-4 flex flex-wrap gap-1.5">
          {FLOW.map((f, i) => (
            <li key={f.title}>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setStep(i);
                }}
                aria-label={`Step ${i + 1}: ${f.title}`}
                aria-current={i === step}
                className={clsx(
                  "tnum h-6 w-6 rounded-md font-mono text-2xs font-semibold transition-colors",
                  i === step
                    ? "bg-brand text-brand-ink"
                    : i < step
                      ? "bg-ok-wash text-ok"
                      : "bg-surface-2 text-ink-3 hover:text-ink",
                )}
              >
                {i + 1}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <Readout label="Where" value={cur.side === "wire" ? "On the medium" : cur.side === "sender" ? "Sending host" : "Receiving host"} />
          <Readout
            label="Layer"
            value={cur.layer === null ? "—" : TCPIP_LAYERS[cur.layer].name}
            tone="brand"
            sub={cur.layer === null ? "between the two hosts" : `TCP/IP layer ${TCPIP_LAYERS[cur.layer].n}`}
          />
          <Readout label="Unit is called" value={cur.unit} sub="its name at this point" />
        </div>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Callout kind="note" title="Two conversations at once">
          The dotted lines are the conversation each layer <em>thinks</em> it is having: TCP at one end appears
          to talk straight to TCP at the other. The solid path down, across and up is what physically happens.
          Both descriptions are correct, and the model is what lets you use whichever is more useful.
        </Callout>

        <Panel title="The rule that decides what a device can do">
          <p className="max-w-[52ch] text-sm text-ink-2">
            A device can only act on what it can read. A repeater sees voltages, so all it can do is make them
            stronger. A switch reads MAC addresses, so it can decide which port a frame belongs on, but only
            within one network. A router reads IP addresses, so it can move a packet between networks that have
            nothing else in common.
          </p>
          <p className="mt-2 max-w-[52ch] text-sm text-ink-2">
            Learn the layer and the capability follows. The next section is every device in this competency,
            placed on that ladder.
          </p>
        </Panel>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 5. Devices, by the layer they work at
 * ================================================================== */

function DevicesSection() {
  const [pick, setPick] = useState("switch");
  const device = NETWORK_DEVICES.find((d) => d.id === pick) ?? NETWORK_DEVICES[0];
  const layer = OSI_LAYERS.find((l) => l.n === device.osiLayer)!;

  return (
    <Section
      id="devices"
      title="Every device, on the ladder"
      lead="Networking hardware is easiest to remember by the layer it understands, because that is what sets the limit on what it can do. Reading nothing means you can only repeat a signal; reading MAC addresses means you can forward within a network; reading IP addresses means you can move between networks."
    >
      <Panel
        title="Placed by layer"
        subtitle="Select a device to see what it reads and what that lets it do."
      >
        <Scope height={228}>
          <ScopeCanvas
            label={`Networking devices arranged by OSI layer. ${NETWORK_DEVICES.map((d) => `${d.name} at layer ${d.osiLayer}`).join("; ")}.`}
            deps={[pick]}
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, w, h }) => {
              const narrow = w < 560;
              const gutter = narrow ? 58 : 92;
              // One row per layer that actually has a device on it.
              const rows = [7, 4, 3, 2, 1];
              const rowH = (h - 34) / rows.length;
              const yOf = (n: number) => 20 + (rows.indexOf(n) + 0.5) * rowH;

              rows.forEach((n) => {
                const l = OSI_LAYERS.find((x) => x.n === n)!;
                const colour = palette.series[l.series];
                const y = yOf(n);
                ctx.save();
                ctx.strokeStyle = palette.grid;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(gutter - 6, y + rowH / 2);
                ctx.lineTo(w - 8, y + rowH / 2);
                ctx.stroke();
                ctx.restore();
                plot.text(gutter - 12, y, `${n} ${narrow ? l.name.slice(0, 5) : l.name}`, colour, {
                  size: narrow ? 8.5 : 10,
                  weight: 700,
                  align: "right",
                  baseline: "middle",
                });
              });

              // Devices spread along their layer's row.
              rows.forEach((n) => {
                const on = NETWORK_DEVICES.filter((d) => d.osiLayer === n);
                const y = yOf(n);
                on.forEach((d, i) => {
                  const active = d.id === pick;
                  const colour = palette.series[OSI_LAYERS.find((x) => x.n === n)!.series];
                  const bw = Math.min(narrow ? 74 : 104, (w - gutter - 16) / on.length - 8);
                  const x = gutter + 4 + i * (bw + 8);
                  ctx.save();
                  if (active && palette.isDark) {
                    ctx.shadowColor = colour;
                    ctx.shadowBlur = 12;
                  }
                  ctx.fillStyle = active ? colour : palette.bg;
                  ctx.strokeStyle = colour;
                  ctx.lineWidth = active ? 2.2 : 1.4;
                  ctx.globalAlpha = active ? 1 : 0.85;
                  ctx.beginPath();
                  ctx.roundRect(x, y - 12, bw, 24, 5);
                  ctx.fill();
                  ctx.stroke();
                  ctx.shadowBlur = 0;
                  ctx.globalAlpha = 1;
                  ctx.font = `${active ? 700 : 600} ${narrow ? 8 : 9}px "JetBrains Mono Variable", ui-monospace, monospace`;
                  ctx.fillStyle = active ? palette.bg : colour;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  const short = d.name.replace("Wireless access point", "Access point").replace("Network interface card", "NIC");
                  let text = short;
                  while (ctx.measureText(text).width > bw - 8 && text.length > 3) text = text.slice(0, -2) + "…";
                  ctx.fillText(text, x + bw / 2, y + 0.5);
                  ctx.restore();
                });
              });
            }}
          />
        </Scope>

        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
          {NETWORK_DEVICES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setPick(d.id)}
              aria-pressed={pick === d.id}
              className={clsx(
                "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                pick === d.id ? "shadow-sm" : "border-line bg-surface text-ink-2 hover:bg-surface-2",
              )}
              style={
                pick === d.id
                  ? {
                      borderColor: `var(--s${OSI_LAYERS.find((l) => l.n === d.osiLayer)!.series + 1})`,
                      background: `color-mix(in oklab, var(--s${OSI_LAYERS.find((l) => l.n === d.osiLayer)!.series + 1}) 10%, transparent)`,
                      color: `var(--s${OSI_LAYERS.find((l) => l.n === d.osiLayer)!.series + 1}-ink)`,
                    }
                  : undefined
              }
            >
              {d.name}
            </button>
          ))}
        </div>

        <div
          key={device.id}
          className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_auto]"
          style={{ animation: "rise var(--dur) var(--ease-out-quart)" }}
        >
          <div>
            <h4 className="text-sm font-semibold text-ink">{device.name}</h4>
            <p className="mt-1 max-w-[62ch] text-sm text-ink-2">{device.what}</p>
            <p className="mt-2 max-w-[62ch] text-sm text-ink-2">
              <span className="font-medium text-ink">What sets it apart: </span>
              {device.key}
            </p>
          </div>
          <div className="flex flex-wrap gap-6 sm:w-[200px] sm:border-l sm:border-line sm:pl-4">
            <Readout
              label="Works at"
              value={`Layer ${device.osiLayer}`}
              sub={`${layer.name} · ${TCPIP_LAYERS[device.tcpLayer].name}`}
              tone="brand"
            />
            <Readout label="Reads" value={device.reads} />
          </div>
        </div>
      </Panel>

      <Callout kind="exam" title="The three that are confused most often">
        A <strong>hub</strong> copies everything to every port and is one collision domain. A{" "}
        <strong>switch</strong> reads MAC addresses and sends each frame only where it belongs, giving every port
        its own collision domain. A <strong>router</strong> reads IP addresses and moves packets between separate
        networks. Hub, switch, router: physical, data link, network.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * Quiz
 * ================================================================== */

const QUESTIONS: Question[] = [
  {
    id: "m1",
    prompt: "How many layers does the OSI model have, and how many does the TCP/IP model have?",
    options: [
      { label: "Four and seven" },
      { label: "Seven and four", correct: true },
      { label: "Seven and five" },
      { label: "Both have seven" },
    ],
    explain:
      "OSI has seven: application, presentation, session, transport, network, data link and physical. TCP/IP has four: application, transport, Internet and host to network. TCP/IP covers the same ground with fewer boundaries.",
  },
  {
    id: "m2",
    prompt: "Which TCP/IP layer does the OSI network layer correspond to?",
    options: [
      { label: "The application layer" },
      { label: "The transport layer" },
      { label: "The Internet layer", correct: true },
      { label: "The host to network layer" },
    ],
    explain:
      "The OSI network layer and the TCP/IP Internet layer do the same job: logical addressing with IP addresses, and routing a packet across interconnected networks. It is the one place where the two models line up exactly, one to one.",
  },
  {
    id: "m3",
    prompt: "What is the data unit at the data link layer called?",
    options: [
      { label: "A packet" },
      { label: "A segment" },
      { label: "A frame", correct: true },
      { label: "A bit" },
    ],
    explain:
      "Transport produces segments, the network layer produces packets, the data link layer produces frames, and the physical layer transmits bits. The name tells you how far down the stack the data has travelled.",
  },
  {
    id: "m4",
    prompt: "Which three OSI layers are all handled by the TCP/IP application layer?",
    options: [
      { label: "Application, presentation and session", correct: true },
      { label: "Application, transport and network" },
      { label: "Session, transport and network" },
      { label: "Presentation, session and transport" },
    ],
    explain:
      "TCP/IP has no separate presentation or session layer. Translation, encryption and managing the conversation are all left to the application itself, so OSI's top three layers become one.",
  },
  {
    id: "m5",
    prompt: "As data travels down the sending host's stack, what happens at each layer?",
    options: [
      { label: "A header is removed" },
      { label: "A header is added, and the unit gets a new name", correct: true },
      { label: "The data is encrypted again" },
      { label: "The data is sent onto the medium" },
    ],
    explain:
      "Each layer wraps what it received from the layer above in its own header, and this is encapsulation. The receiving host's matching layer removes exactly that header on the way up, so the application finally receives precisely what was sent.",
  },
  {
    id: "m6",
    prompt: "Which layer of the TCP/IP model encapsulates the IP datagram into a frame and maps IP addresses to physical addresses?",
    options: [
      { label: "Application" },
      { label: "Transport" },
      { label: "Internet" },
      { label: "Host to network", correct: true },
    ],
    explain:
      "The host-to-network layer, also called the network access layer, is the bottom of the TCP/IP model. It takes the datagram the Internet layer produced, wraps it in a frame with MAC addresses, and puts it onto whatever physical network is actually in use.",
  },
  {
    id: "m7",
    prompt: "Which device reads MAC addresses to decide which port to forward a frame to?",
    options: [
      { label: "A repeater" },
      { label: "A hub" },
      { label: "A switch", correct: true },
      { label: "A modem" },
    ],
    explain:
      "A switch works at the data link layer, so it can read the destination MAC address and send the frame only to the port that address is on. A hub and a repeater work at the physical layer and can do nothing but copy the signal onward; a modem only changes the signal's form.",
  },
];
