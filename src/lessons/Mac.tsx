import { useMemo, useState } from "react";
import clsx from "clsx";
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
import {
  BROADCAST_MAC,
  FRAME_FIELDS,
  KNOWN_OUI,
  MAC_PROTOCOLS,
  formatMac,
  macParts,
  macThroughput,
  nibbles,
  simulateMac,
  type MacProtocol,
} from "../lib/network";

export function MacLesson() {
  return (
    <>
      <LanSection />
      <MacAddressSection />
      <FrameSection />
      <AccessSection />
      <DeliverySection />
      <Section id="check" title="Check yourself">
        <Quiz lessonId="mac" questions={QUESTIONS} />
      </Section>
    </>
  );
}

/* ================================================================== *
 * 1. The LAN
 * ================================================================== */

function LanSection() {
  return (
    <Section
      id="lan"
      title="A LAN is a set of machines sharing one medium"
      lead="A Local Area Network connects computers within a limited area: a room, a building, a campus. Level 6.5 gave us the wiring. What it did not give us is any way for a station to say which machine a particular set of bits is meant for, or any rule about when it may start talking. Those two gaps are what this level fills."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
        {[
          {
            t: "Who is this for?",
            d: "On a shared medium every station hears everything. Without a name for each interface, no station can tell whether the bits arriving are its business.",
            a: "Addresses",
          },
          {
            t: "Where does it start and stop?",
            d: "A continuous stream of bits has no boundaries. The data has to be packaged with a beginning, an end and a header that carries the addresses.",
            a: "Frames",
          },
          {
            t: "When may I talk?",
            d: "If two stations transmit at once on a bus, both are destroyed. Something has to decide who goes when.",
            a: "A MAC protocol",
          },
        ].map((c) => (
          <div key={c.t} className="rounded-xl border border-line bg-surface p-4">
            <p className="text-sm font-semibold text-ink">{c.t}</p>
            <p className="mt-1.5 text-sm text-ink-2">{c.d}</p>
            <p className="mt-2.5 text-2xs font-semibold text-brand">{c.a}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 2. MAC addresses
 * ================================================================== */

const SAMPLE_MACS: { label: string; bytes: number[] }[] = [
  { label: "Syllabus", bytes: [0x4a, 0x8f, 0x3c, 0x4f, 0x9e, 0x3d] },
  { label: "Raspberry Pi", bytes: [0xb8, 0x27, 0xeb, 0x1a, 0x2c, 0x9f] },
  { label: "Apple", bytes: [0xf0, 0x18, 0x98, 0x0d, 0x55, 0x71] },
  { label: "Broadcast", bytes: [255, 255, 255, 255, 255, 255] },
];

function MacAddressSection() {
  const [which, setWhich] = useState(0);
  const [openByte, setOpenByte] = useState<number | null>(2);
  const bytes = SAMPLE_MACS[which].bytes;
  const parts = macParts(bytes);
  const ouiKey = formatMac(parts.oui);
  const vendor = KNOWN_OUI[ouiKey];

  return (
    <Section
      id="mac"
      title="Every interface carries a 48-bit name"
      lead="A MAC address is burned into the network interface when it is manufactured. It is 48 bits long, written as six blocks of two hexadecimal digits, and because each hex digit stands for exactly four bits, the whole address is really twelve nibbles. Click a block below to open it up."
    >
      <Panel
        title="Address anatomy"
        subtitle="The first three bytes name the manufacturer; the last three name the individual card."
        actions={
          <Segmented
            label="Example address"
            size="sm"
            value={String(which)}
            onChange={(v) => {
              setWhich(Number(v));
              setOpenByte(2);
            }}
            options={SAMPLE_MACS.map((m, i) => ({ value: String(i), label: m.label }))}
          />
        }
      >
        <div className="flex flex-wrap items-end gap-2">
          {bytes.map((b, i) => {
            const open = openByte === i;
            const isOui = i < 3;
            return (
              <div key={i} className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenByte(open ? null : i)}
                  aria-expanded={open}
                  className={clsx(
                    "rounded-lg border px-3 py-2 text-center transition-all duration-150 ease-[var(--ease-out-quart)] hover:-translate-y-px",
                    open
                      ? "border-brand-edge bg-brand-wash"
                      : "border-line bg-surface-2 hover:border-line-strong",
                  )}
                >
                  <span className="tnum block font-mono text-lg font-semibold text-ink">
                    {b.toString(16).padStart(2, "0").toUpperCase()}
                  </span>
                  <span
                    className="mt-0.5 block text-2xs font-medium"
                    style={{ color: isOui ? "var(--s1-ink)" : "var(--s4-ink)" }}
                  >
                    {isOui ? "vendor" : "card"}
                  </span>
                </button>
                {i < 5 && <span className="pb-6 font-mono text-lg text-ink-3">:</span>}
              </div>
            );
          })}
        </div>

        {openByte !== null && (
          <div
            className="mt-4 rounded-lg border border-line bg-surface-2 p-4"
            style={{ animation: "rise var(--dur) var(--ease-out-quart)" }}
          >
            <p className="text-xs font-medium text-ink-2">
              Block {openByte + 1} of 6: one byte, which is 8 bits, which is two hex digits
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {nibbles(bytes[openByte]).map((n, i) => (
                <div key={i} className="rounded-lg border border-line bg-surface px-3 py-2 text-center">
                  <span className="tnum block font-mono text-xl font-semibold text-brand">{n.hex}</span>
                  <span className="tnum mt-1 block font-mono text-xs text-ink-2">{n.bits}</span>
                  <span className="mt-0.5 block text-2xs text-ink-3">4 bits</span>
                </div>
              ))}
              <div className="text-sm text-ink-2">
                <p>
                  <span className="tnum font-mono font-semibold text-ink">
                    {bytes[openByte].toString(16).padStart(2, "0").toUpperCase()}
                  </span>{" "}
                  in hexadecimal is{" "}
                  <span className="tnum font-mono font-semibold text-ink">
                    {bytes[openByte].toString(2).padStart(8, "0")}
                  </span>{" "}
                  in binary,
                </p>
                <p>
                  which is <span className="tnum font-mono font-semibold text-ink">{bytes[openByte]}</span> in
                  decimal.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Readout label="Total length" value="48 bits" sub="6 bytes × 8 bits" />
          <Readout label="Written as" value="6 blocks" sub="two hex digits each" />
          <Readout
            label="Possible addresses"
            value="2⁴⁸"
            sub="about 281 trillion"
            tone="brand"
          />
          <Readout
            label="This one is"
            value={
              <span className="text-sm">
                {parts.isBroadcast ? "Broadcast" : parts.isMulticast ? "Multicast" : "Unicast"}
              </span>
            }
            sub={parts.isLocallyAdministered ? "locally administered" : "vendor assigned"}
            tone={parts.isBroadcast ? "warn" : "neutral"}
          />
        </div>

        {vendor && (
          <p className="mt-3 text-sm text-ink-2">
            The vendor half, <span className="tnum font-mono text-ink">{ouiKey}</span>, is registered to{" "}
            <strong className="font-semibold text-ink">{vendor}</strong>. Because these blocks are handed out by a
            central authority and the card half is assigned by the manufacturer, no two interfaces in the world
            should ever share an address.
          </p>
        )}
      </Panel>

      <Callout kind="exam" title="Converting between hex and binary">
        Each hexadecimal digit is exactly four binary digits, so you never need to convert the whole 48 bits at
        once. Take one hex digit at a time: <span className="tnum font-mono">4</span> →{" "}
        <span className="tnum font-mono">0100</span>, <span className="tnum font-mono">A</span> →{" "}
        <span className="tnum font-mono">1010</span>, so{" "}
        <span className="tnum font-mono">4A</span> → <span className="tnum font-mono">0100 1010</span>.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * 3. Frames
 * ================================================================== */

function FrameSection() {
  const [openField, setOpenField] = useState<string>("Destination MAC");
  const [payload, setPayload] = useState(500);

  const total = 8 + 6 + 6 + 2 + payload + 4;
  const overhead = total - payload;
  const efficiency = (payload / total) * 100;

  const widths = FRAME_FIELDS.map((f) => (Array.isArray(f.bytes) ? payload : f.bytes));
  const open = FRAME_FIELDS.find((f) => f.name === openField)!;

  return (
    <Section
      id="frame"
      title="Data travels wrapped in a frame"
      lead="A frame is the unit of transmission on a LAN. The data link layer takes the data handed down to it, puts a header in front carrying the destination and source MAC addresses, and adds a checksum on the end. The header is what makes delivery possible; without it the bits are anonymous."
    >
      <Panel
        title="Ethernet frame layout"
        subtitle="Drawn to scale. Click a field to see what it is for."
        actions={
          <Badge tone="brand">
            {total.toLocaleString()} bytes total
          </Badge>
        }
      >
        <div className="flex w-full overflow-hidden rounded-lg border border-line" style={{ height: 62 }}>
          {FRAME_FIELDS.map((f, i) => {
            const isOpen = f.name === openField;
            const w = widths[i];
            return (
              <button
                key={f.name}
                type="button"
                onClick={() => setOpenField(f.name)}
                title={`${f.name}: ${Array.isArray(f.bytes) ? `${payload} bytes` : `${f.bytes} bytes`}`}
                className={clsx(
                  "group relative flex min-w-0 shrink-0 flex-col items-center justify-center border-r border-line px-1 text-center transition-colors last:border-r-0",
                  isOpen ? "bg-brand-wash" : "bg-surface-2 hover:bg-surface-3",
                )}
                style={{ flexBasis: `${(w / total) * 100}%`, flexGrow: Array.isArray(f.bytes) ? 1 : 0 }}
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ background: `var(--s${f.series + 1})` }}
                />
                <span className="truncate text-2xs font-semibold text-ink">
                  {w / total > 0.09 ? f.name : f.name.split(" ")[0]}
                </span>
                <span className="tnum truncate font-mono text-2xs text-ink-3">
                  {Array.isArray(f.bytes) ? payload : f.bytes} B
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="mt-3 rounded-lg border border-line bg-surface-2 px-3.5 py-3"
          style={{ animation: "rise var(--dur) var(--ease-out-quart)" }}
        >
          <div className="flex flex-wrap items-baseline gap-2">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: `var(--s${open.series + 1})` }}
            />
            <p className="text-sm font-semibold text-ink">{open.name}</p>
            <p className="tnum font-mono text-2xs text-ink-3">
              {Array.isArray(open.bytes) ? `${open.bytes[0]}–${open.bytes[1]} bytes` : `${open.bytes} bytes`}
            </p>
          </div>
          <p className="mt-1 max-w-[70ch] text-sm text-ink-2">{open.what}</p>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <Slider
            label="Payload size"
            value={payload}
            onChange={setPayload}
            min={46}
            max={1500}
            step={1}
            readout={`${payload} bytes`}
            accent="var(--s5)"
            hint="Ethernet allows 46 to 1500 bytes of data. Anything shorter is padded up to 46."
          />
          <div className="flex gap-6 lg:justify-end">
            <Readout label="Header + checksum" value={`${overhead} B`} sub="the cost of delivery" />
            <Readout
              label="Efficiency"
              value={`${efficiency.toFixed(1)}%`}
              tone={efficiency > 90 ? "ok" : efficiency > 70 ? "warn" : "bad"}
              sub="payload ÷ total"
            />
          </div>
        </div>

        {payload <= 60 && (
          <p className="mt-3 rounded-lg bg-warn-wash px-3.5 py-2.5 text-sm text-ink">
            With a payload this small, most of what goes on the wire is header. Sending one keystroke costs 26
            bytes of overhead to carry a single byte of data, which is exactly why protocols batch small pieces
            of data together where they can.
          </p>
        )}
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * 4. Media access: the flagship simulation
 * ================================================================== */

const STATIONS = 4;
const SPAN = 24;

function AccessSection() {
  const [protocol, setProtocol] = useState<MacProtocol>("aloha");
  const [load, setLoad] = useState(0.6);
  const [seed, setSeed] = useState(11);
  const [showCurves, setShowCurves] = useState(true);

  const result = useMemo(
    () => simulateMac(protocol, load, SPAN, STATIONS, seed),
    [protocol, load, seed],
  );

  const info = MAC_PROTOCOLS[protocol];
  const attempted = result.successes + result.collisions;
  const lossRate = attempted ? (result.collisions / attempted) * 100 : 0;

  return (
    <Section
      id="access"
      title="From ALOHA to Ethernet"
      lead="On a shared medium two stations that transmit at the same moment destroy each other's frames. The history of local networking is the history of getting better at avoiding that. Raise the traffic below and watch each protocol cope, or fail to."
    >
      <Panel
        title={info.long}
        subtitle={info.rule}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              label="Protocol"
              value={protocol}
              onChange={setProtocol}
              options={(Object.keys(MAC_PROTOCOLS) as MacProtocol[]).map((k) => ({
                value: k,
                label: MAC_PROTOCOLS[k].name,
              }))}
            />
            <Button size="sm" onClick={() => setSeed((s) => s + 1)}>
              New traffic
            </Button>
          </div>
        }
      >
        <Scope height={214} caption="Each row is one station; a bar is a frame it put on the medium. The horizontal axis is measured in frame times.">
          <ScopeCanvas
            label={`${info.long} carrying an offered load of ${load.toFixed(2)}: ${result.successes} frames succeeded and ${result.collisions} collided`}
            deps={[protocol, load, seed]}
            bounds={{ x0: 0, x1: SPAN, y0: 0, y1: STATIONS }}
            insets={{ left: 62, right: 16, top: 16, bottom: 26 }}
            draw={({ plot, palette }) => {
              const ctx = plot.ctx;

              // Slot boundaries make the slotted variant's rule visible.
              if (protocol === "slotted") {
                for (let s = 0; s <= SPAN; s++) plot.vLine(s, palette.grid, { dash: [2, 4] });
              } else {
                plot.grid({ xEvery: 1, xMajorEvery: 4 });
              }

              for (let s = 0; s < STATIONS; s++) {
                const centre = STATIONS - s - 0.5;
                plot.hLine(centre, palette.grid, { alpha: 0.6 });
                plot.gutterLabel(centre, `PC${s + 1}`, palette.ink);
              }

              for (const at of result.attempts) {
                const centre = STATIONS - at.station - 0.5;
                const y = plot.sy(centre + 0.3);
                const h = plot.sy(centre - 0.3) - y;
                const x = plot.sx(at.start);
                const w = Math.max(2, plot.sx(at.end) - x);
                const colour = at.collided ? palette.series[4] : palette.series[2];

                ctx.save();
                ctx.beginPath();
                ctx.rect(plot.left, plot.top, plot.plotW, plot.plotH);
                ctx.clip();
                ctx.fillStyle = colour;
                ctx.globalAlpha = at.collided ? 0.9 : 0.85;
                if (palette.isDark) {
                  ctx.shadowColor = colour;
                  ctx.shadowBlur = 8;
                }
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, 3);
                ctx.fill();
                ctx.shadowBlur = 0;

                // A deferred start is the whole point of carrier sense, so mark it.
                if (at.deferred) {
                  ctx.globalAlpha = 1;
                  ctx.strokeStyle = palette.series[1];
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.moveTo(x, y);
                  ctx.lineTo(x, y + h);
                  ctx.stroke();
                }
                ctx.restore();
              }

              plot.xTicks(4, (v) => (v === 0 ? "0" : `${v}`));
            }}
          />
        </Scope>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Legend
            items={[
              { color: "var(--s3)", label: "Delivered" },
              { color: "var(--s5)", label: "Collided: both lost" },
              ...(protocol === "csma-cd" ? [{ color: "var(--s2)", label: "Waited for a quiet medium" }] : []),
            ]}
          />
          <div className="flex flex-wrap gap-6">
            <Readout
              label="Throughput"
              value={`${(result.throughput * 100).toFixed(1)}%`}
              tone={result.throughput > 0.5 ? "ok" : result.throughput > 0.2 ? "warn" : "bad"}
              sub="of the medium's capacity"
            />
            <Readout label="Delivered" value={result.successes} tone="ok" />
            <Readout
              label="Destroyed"
              value={result.collisions}
              tone={result.collisions ? "bad" : "neutral"}
              sub={`${lossRate.toFixed(0)}% of attempts`}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <Slider
              label="Offered load G"
              value={load}
              onChange={setLoad}
              min={0.05}
              max={2}
              step={0.05}
              readout={`${load.toFixed(2)}`}
              accent="var(--s1)"
              hint="How much traffic the stations want to send, as a multiple of what the medium can carry. G = 1 means they are collectively trying to use it exactly 100 % of the time."
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Button size="sm" onClick={() => setLoad(0.2)}>
                Light
              </Button>
              <Button size="sm" onClick={() => setLoad(0.5)}>
                Moderate
              </Button>
              <Button size="sm" onClick={() => setLoad(1.5)}>
                Heavy
              </Button>
            </div>

            <p className="mt-4 max-w-[68ch] rounded-lg bg-surface-2 px-3.5 py-2.5 text-sm text-ink-2">
              {accessVerdict(protocol, load, result.throughput)}
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-ink-2">Throughput against load</p>
              <Toggle checked={showCurves} onChange={setShowCurves} label="All three" />
            </div>
            <Scope height={168}>
              <ScopeCanvas
                label="Throughput curves: pure ALOHA peaks at 18.4 percent, slotted ALOHA at 36.8 percent, and Ethernet stays high"
                deps={[protocol, load, showCurves]}
                bounds={{ x0: 0, x1: 2, y0: 0, y1: 1 }}
                insets={{ left: 34, right: 12, top: 12, bottom: 24 }}
                draw={({ plot, palette }) => {
                  plot.grid({ xEvery: 0.25, xMajorEvery: 1, yEvery: 0.25 });
                  plot.axisFrame();

                  const curve = (p: MacProtocol) => {
                    const N = 200;
                    const d = new Float64Array(N);
                    for (let i = 0; i < N; i++) d[i] = macThroughput(p, (i / (N - 1)) * 2);
                    return d;
                  };

                  const order: MacProtocol[] = ["csma-cd", "slotted", "aloha"];
                  const colourOf: Record<MacProtocol, string> = {
                    aloha: palette.series[4],
                    slotted: palette.series[3],
                    "csma-cd": palette.series[2],
                  };

                  for (const p of order) {
                    if (!showCurves && p !== protocol) continue;
                    const active = p === protocol;
                    plot.trace(curve(p), colourOf[p], {
                      width: active ? 2.2 : 1.4,
                      glow: active ? 10 : 0,
                      alpha: active ? 1 : 0.4,
                    });
                  }

                  // Where the student currently is.
                  const here = macThroughput(protocol, load);
                  plot.vLine(load, palette.inkFaint, { dash: [3, 3] });
                  plot.dot(load, here, colourOf[protocol], 4.5);
                  plot.dot(load, result.throughput, palette.series[0], 4.5);

                  plot.yTicks([0, 0.5, 1], (v) => `${v * 100}%`);
                  plot.xTicks(1, (v) => (v === 0 ? "0" : `G=${v}`));
                }}
              />
            </Scope>
            <Legend
              className="mt-2"
              items={[
                { color: "var(--s1)", label: "This run" },
                { color: "var(--s5)", label: "ALOHA", muted: protocol !== "aloha" },
                { color: "var(--s4)", label: "Slotted", muted: protocol !== "slotted" },
                { color: "var(--s3)", label: "Ethernet", muted: protocol !== "csma-cd" },
              ]}
            />
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-3">
        {(Object.keys(MAC_PROTOCOLS) as MacProtocol[]).map((k, i) => (
          <div
            key={k}
            className={clsx(
              "rounded-xl border p-4",
              protocol === k ? "border-brand-edge bg-brand-wash" : "border-line bg-surface",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">{MAC_PROTOCOLS[k].long}</h3>
              <span className="tnum font-mono text-2xs text-ink-3">step {i + 1}</span>
            </div>
            <p className="mt-1.5 text-sm text-ink-2">{MAC_PROTOCOLS[k].rule}</p>
            <div className="mt-3 border-t border-line pt-2.5">
              <Readout label="Best throughput" value={MAC_PROTOCOLS[k].peak} tone={i === 2 ? "ok" : "neutral"} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
        <Panel title="Why slotting doubles the throughput">
          <p className="max-w-[64ch] text-sm text-ink-2">
            In pure ALOHA a frame is destroyed by anything that starts in the frame time before it as well as
            anything starting during it, a vulnerable window two frame times wide. Forcing every transmission to
            begin on a slot boundary halves that window to one frame time, and the peak throughput doubles from
            18.4 % to 36.8 %.
          </p>
          <div className="mt-3 grid gap-2">
            <Formula note="Pure ALOHA. Peaks at G = 0.5, where S = 1/2e ≈ 0.184.">S = G · e⁻²ᴳ</Formula>
            <Formula note="Slotted ALOHA. Peaks at G = 1, where S = 1/e ≈ 0.368.">S = G · e⁻ᴳ</Formula>
          </div>
          <div className="mt-3">
            <Reveal label="What the letters mean">
              <ul className="grid gap-1.5">
                <li>
                  <strong className="font-semibold text-ink">G</strong> is the offered load: how much traffic the
                  stations are collectively trying to send.
                </li>
                <li>
                  <strong className="font-semibold text-ink">S</strong> is throughput: how much actually gets
                  through. The rest is destroyed in collisions.
                </li>
                <li>
                  Push G past its peak and S <em>falls</em>: the extra traffic causes more collisions than it
                  delivers frames. The network works harder and carries less.
                </li>
              </ul>
            </Reveal>
          </div>
        </Panel>

        <Callout kind="exam" title="What CSMA/CD stands for, and why each part matters">
          <strong>Carrier Sense</strong>: listen first, and do not start if the medium is busy. That alone
          removes most collisions.
          <strong> Multiple Access</strong>: many stations share the one medium.
          <strong> Collision Detection</strong>: keep listening while sending. If a collision does happen (two
          stations that both heard silence and started together), detect it within microseconds, stop
          immediately instead of wasting the whole frame time, and retry after a random backoff. Set the
          protocol to Ethernet above and compare the width of a red bar with the ALOHA ones.
        </Callout>
      </div>
    </Section>
  );
}

function accessVerdict(protocol: MacProtocol, load: number, throughput: number): string {
  if (protocol === "csma-cd") {
    return load > 1
      ? "Even overloaded, Ethernet keeps the medium busy with real frames. Stations queue behind whoever is transmitting instead of talking over them, so the throughput holds up where ALOHA would have collapsed."
      : "Almost every frame gets through. Stations that find the medium busy simply wait, and the blue edge marks a deferred start, so collisions only happen in the tiny window before a signal has reached everybody.";
  }
  if (load < 0.3) {
    return `With traffic this light, collisions are rare simply because two stations seldom want the medium at the same moment. ${
      protocol === "slotted" ? "Slotted ALOHA" : "Even pure ALOHA"
    } copes fine, and the weakness only shows as the load rises.`;
  }
  if (throughput < 0.12) {
    return "The medium is in chaos. So much is colliding that raising the load further would make things worse, not better: every retry adds to the pile-up. This is precisely the failure that carrier sense was invented to prevent.";
  }
  return protocol === "slotted"
    ? "Slotted ALOHA is doing better than pure ALOHA would at the same load, because a frame can now only be destroyed by something starting in the same slot, not by something that started halfway through the one before."
    : "Collisions are eating a serious share of the medium. Notice that a frame is destroyed both by transmissions starting during it and by ones that started just before, so the vulnerable window is two frame times wide.";
}

/* ================================================================== *
 * 5. Broadcast vs unicast
 * ================================================================== */

type Delivery = "unicast" | "multicast" | "broadcast";

/** The stations that joined the group, for the multicast case. */
const GROUP = [1, 3];
const GROUP_MAC = "01:00:5E:00:00:16";

function DeliverySection() {
  const [mode, setMode] = useState<Delivery>("unicast");
  const [target, setTarget] = useState(2);

  const hosts = [
    { name: "PC1", mac: "B8:27:EB:1A:2C:9F" },
    { name: "PC2", mac: "F0:18:98:0D:55:71" },
    { name: "PC3", mac: "3C:5A:B4:77:01:E2" },
    { name: "PC4", mac: "00:50:56:C0:00:08" },
  ];
  const keptBy = (i: number) =>
    mode === "broadcast" ? true : mode === "multicast" ? GROUP.includes(i) : i === target;
  const kept = hosts.map((_, i) => i).filter((i) => i !== 0 && keptBy(i)).length;
  const destination =
    mode === "broadcast" ? BROADCAST_MAC : mode === "multicast" ? GROUP_MAC : hosts[target].mac;

  return (
    <Section
      id="delivery"
      title="One frame, one destination, or all of them"
      lead="Because every station on a shared medium receives every frame, delivery is really a decision each station makes for itself: it reads the destination address in the header and either keeps the frame or drops it. Three cases follow from that, depending on what the destination address names."
    >
      <Panel
        title={mode === "unicast" ? "Unicast" : mode === "multicast" ? "Multicast" : "Broadcast"}
        subtitle={
          mode === "unicast"
            ? "The destination field holds one station's address. Everyone receives the frame; only the addressed station keeps it."
            : mode === "multicast"
              ? "The destination is a group address. Only the stations that joined that group keep the frame, and the sender still transmits it just once."
              : "The destination field is all ones. Every station recognises this as 'for everybody' and keeps the frame."
        }
        actions={
          <Segmented
            label="Delivery mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: "unicast", label: "Unicast" },
              { value: "multicast", label: "Multicast" },
              { value: "broadcast", label: "Broadcast" },
            ]}
          />
        }
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
          <div className="min-w-0">
            <div className="mb-3 rounded-lg border border-line bg-surface-2 px-3.5 py-2.5">
              <p className="text-2xs font-medium text-ink-3">Destination MAC in the frame header</p>
              <p
                className="tnum mt-0.5 font-mono text-lg font-semibold"
                style={{
                  color:
                    mode === "broadcast" ? "var(--s5-ink)" : mode === "multicast" ? "var(--s4-ink)" : "var(--s3-ink)",
                }}
              >
                {destination}
              </p>
              {mode === "broadcast" && (
                <p className="mt-1 text-2xs text-ink-3">
                  All 48 bits set to 1: the reserved broadcast address.
                </p>
              )}
              {mode === "multicast" && (
                <p className="mt-1 text-2xs text-ink-3">
                  Not any station's own address: the low bit of the first byte marks it as a group address.
                </p>
              )}
            </div>

            <Scope height={220}>
              <ScopeCanvas
                label={
                  mode === "broadcast"
                    ? "A broadcast frame on the bus, kept by all four stations"
                    : mode === "multicast"
                      ? `A multicast frame on the bus, kept by the ${GROUP.length} stations that joined the group`
                      : `A unicast frame addressed to ${hosts[target].name}, kept only by that station`
                }
                animate
                deps={[mode, target]}
                bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
                draw={({ plot, ctx, palette, time, w, h }) => {
                  const busY = h * 0.7;
                  const nodeY = h * 0.3;
                  const x0 = 34;
                  const x1 = w - 34;
                  const xs = hosts.map((_, i) => x0 + 40 + ((x1 - x0 - 80) * i) / (hosts.length - 1));

                  ctx.save();
                  ctx.strokeStyle = palette.gridMajor;
                  ctx.lineWidth = 3;
                  ctx.beginPath();
                  ctx.moveTo(x0, busY);
                  ctx.lineTo(x1, busY);
                  ctx.stroke();
                  xs.forEach((x) => {
                    ctx.beginPath();
                    ctx.moveTo(x, busY);
                    ctx.lineTo(x, nodeY + 17);
                    ctx.stroke();
                  });
                  ctx.restore();

                  // The frame spreads out from PC1's tap in both directions.
                  const p = Math.min(1, (time * 0.42) % 1.7);
                  const reach = p * Math.max(xs[0] - x0, x1 - xs[0]);
                  const lit = mode === "broadcast" ? palette.series[4] : palette.series[2];

                  ctx.save();
                  ctx.strokeStyle = lit;
                  ctx.lineWidth = 3;
                  ctx.globalAlpha = 0.9;
                  if (palette.isDark) {
                    ctx.shadowColor = lit;
                    ctx.shadowBlur = 12;
                  }
                  ctx.beginPath();
                  ctx.moveTo(Math.max(x0, xs[0] - reach), busY);
                  ctx.lineTo(Math.min(x1, xs[0] + reach), busY);
                  ctx.stroke();
                  ctx.restore();

                  xs.forEach((x, i) => {
                    const arrived = Math.abs(x - xs[0]) <= reach;
                    const keeps = keptBy(i);
                    const colour =
                      i === 0
                        ? palette.series[0]
                        : !arrived
                          ? palette.axis
                          : keeps
                            ? palette.series[2]
                            : palette.inkFaint;

                    ctx.save();
                    if (arrived && palette.isDark) {
                      ctx.shadowColor = colour;
                      ctx.shadowBlur = 12;
                    }
                    ctx.fillStyle = palette.bg;
                    ctx.strokeStyle = colour;
                    ctx.lineWidth = arrived || i === 0 ? 2.2 : 1.5;
                    ctx.beginPath();
                    ctx.roundRect(x - 30, nodeY - 17, 60, 34, 7);
                    ctx.fill();
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    ctx.font = '700 10px "JetBrains Mono Variable", ui-monospace, monospace';
                    ctx.fillStyle = colour;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(hosts[i].name, x, nodeY);
                    ctx.restore();

                    if (i === 0) {
                      plot.text(x, nodeY - 30, "sender", palette.series[0], { size: 9, align: "center", weight: 700 });
                    } else if (arrived) {
                      plot.text(x, nodeY + 24, keeps ? "keeps it" : "discards it", colour, {
                        size: 9,
                        align: "center",
                        weight: 700,
                      });
                    }
                  });
                }}
              />
            </Scope>
          </div>

          <div className="grid content-start gap-4 lg:border-l lg:border-line lg:pl-4">
            {mode === "multicast" && (
              <div>
                <p className="mb-2 text-xs font-medium text-ink-2">Joined the group</p>
                <div className="grid gap-1">
                  {hosts.slice(1).map((hst, i) => (
                    <div
                      key={hst.name}
                      className={clsx(
                        "rounded-lg border px-2.5 py-1.5",
                        GROUP.includes(i + 1) ? "border-brand-edge bg-brand-wash" : "border-line bg-surface opacity-60",
                      )}
                    >
                      <span className="block text-xs font-medium text-ink">{hst.name}</span>
                      <span className="block text-2xs text-ink-3">
                        {GROUP.includes(i + 1) ? "subscribed" : "not in the group"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mode === "unicast" && (
              <div>
                <p className="mb-2 text-xs font-medium text-ink-2">Addressed to</p>
                <div className="grid gap-1">
                  {hosts.slice(1).map((hst, i) => (
                    <button
                      key={hst.name}
                      type="button"
                      onClick={() => setTarget(i + 1)}
                      className={clsx(
                        "rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                        target === i + 1
                          ? "border-brand-edge bg-brand-wash"
                          : "border-line bg-surface hover:bg-surface-2",
                      )}
                    >
                      <span className="block text-xs font-medium text-ink">{hst.name}</span>
                      <span className="tnum block font-mono text-2xs text-ink-3">{hst.mac}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3">
              <Readout label="Stations that receive it" value={hosts.length - 1} sub="everyone on the medium" />
              <Readout
                label="Stations that keep it"
                value={kept}
                tone={mode === "broadcast" ? "warn" : "ok"}
                sub={mode === "multicast" ? "the ones that joined the group" : undefined}
              />
            </div>

            <p className="text-2xs text-ink-3">
              {mode === "broadcast"
                ? "Broadcasts are how a station finds something it cannot yet name: a DHCP server, or the MAC address behind an IP. Useful, but every broadcast costs every machine on the LAN a little work."
                : mode === "multicast"
                  ? "Multicast is what makes live video to many viewers affordable: one copy on the wire however many are watching, instead of one copy per viewer. In IPv4 the group addresses are class D, 224.0.0.0 to 239.255.255.255."
                  : "A switch takes this one step further: because it knows which port each address is on, it does not even send the frame down the other cables. See level 6.5."}
            </p>
          </div>
        </div>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * Quiz
 * ================================================================== */

const QUESTIONS: Question[] = [
  {
    id: "mac1",
    prompt: "How long is a MAC address, and how is it normally written?",
    options: [
      { label: "32 bits, as four decimal numbers separated by dots" },
      { label: "48 bits, as six blocks of two hexadecimal digits", correct: true },
      { label: "64 bits, as eight blocks separated by colons" },
      { label: "128 bits, as eight groups of hexadecimal digits" },
    ],
    explain:
      "A MAC address is 48 bits, or six bytes. Each byte is written as two hexadecimal digits and the six blocks are separated by colons, giving the familiar form 4A:8F:3C:4F:9E:3D. The 32-bit dotted-decimal form is an IP address, which is a different thing entirely.",
  },
  {
    id: "mac2",
    prompt: "Which two addresses must appear in the header of every Ethernet frame?",
    options: [
      { label: "The source and destination IP addresses" },
      { label: "The source and destination MAC addresses", correct: true },
      { label: "The destination MAC address only" },
      { label: "The source port and destination port" },
    ],
    explain:
      "The data link layer header carries both MAC addresses: the destination so the right station keeps the frame, and the source so the receiver knows where to send a reply. IP addresses and port numbers live in the headers added by higher layers, inside the payload.",
  },
  {
    id: "mac3",
    prompt: "In pure ALOHA a station transmits as soon as it has data. What is the maximum throughput it can achieve?",
    options: [
      { label: "About 18.4 % of the medium's capacity", correct: true },
      { label: "About 36.8 %" },
      { label: "About 50 %" },
      { label: "100 %, as long as there are fewer than ten stations" },
    ],
    explain:
      "Pure ALOHA peaks at S = 1/2e ≈ 0.184 when G = 0.5. A frame is destroyed both by transmissions that begin during it and by ones that began in the frame time before, so the vulnerable window is two frame times wide.",
  },
  {
    id: "mac4",
    prompt: "What single change does slotted ALOHA make to pure ALOHA?",
    options: [
      { label: "Stations listen to the medium before transmitting" },
      { label: "Stations may only begin transmitting at the start of a time slot", correct: true },
      { label: "Collisions are detected and transmission is aborted early" },
      { label: "Each station is given its own frequency" },
    ],
    explain:
      "Slotted ALOHA still transmits blindly and adds no listening. It only requires transmissions to begin on a slot boundary, which halves the vulnerable window from two frame times to one and so doubles the peak throughput to 36.8 %.",
  },
  {
    id: "mac5",
    prompt: "What does the CD in Ethernet's CSMA/CD add over carrier sense alone?",
    options: [
      { label: "It compresses the data before sending" },
      { label: "It detects a collision while transmitting and aborts immediately instead of wasting the whole frame time", correct: true },
      { label: "It corrects any bits that were damaged" },
      { label: "It decides which station may transmit next" },
    ],
    explain:
      "Carrier sense stops most collisions, but two stations that both hear silence can still start together. Collision Detection means a station keeps listening while it sends, so it notices this within microseconds, stops at once to free the medium, and retries after a random backoff.",
  },
  {
    id: "mac6",
    prompt: "A frame carries the destination address FF:FF:FF:FF:FF:FF. What happens on the LAN?",
    options: [
      { label: "It is discarded because the address is invalid" },
      { label: "Only the station with that address keeps it" },
      { label: "Every station on the LAN keeps and processes it", correct: true },
      { label: "It is sent back to the sender" },
    ],
    explain:
      "All 48 bits set to one is the reserved broadcast address. Every station recognises it as meaning 'for everybody' and processes the frame instead of discarding it, which is how a host reaches a service it cannot yet address, such as a DHCP server.",
  },
];
