import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Section } from "../components/LessonPage";
import { Badge, Button, Callout, Extra, Panel } from "../components/ui";
import {
  EXAMPLE_HOPS,
  EXAMPLE_HOSTS,
  EXAMPLE_MIDDLE_ROUTERS,
  EXAMPLE_REQUEST,
  EXAMPLE_STEPS,
  TCPIP_LAYERS,
  UNIT_QUESTIONS,
  encapsulate,
  type ExampleField,
  type ExampleHeader,
  type ExamplePlace,
  type ExampleStep,
} from "../lib/models";

/* ================================================================== *
 * A worked example: one click, followed through every layer
 *
 * The abstract flow diagram further down shows the shape of the journey.
 * This one shows the contents: the real fields each layer writes, as nested
 * envelopes, and what happens to them at a router as well as at the far end.
 * ================================================================== */

const ENC = encapsulate(EXAMPLE_REQUEST.length);
const SIZE: Record<ExampleStep["unit"], number> = {
  Data: ENC.levels[0].totalBytes,
  Segment: ENC.levels[1].totalBytes,
  Packet: ENC.levels[2].totalBytes,
  Frame: ENC.levels[3].totalBytes,
  Bits: ENC.bitsOnWire,
};

const FORMULA: Record<ExampleStep["unit"], string> = {
  Data: "the message itself",
  Segment: "TCP header + data",
  Packet: "IP header + segment",
  Frame: "frame header + packet + FCS",
  Bits: "the whole frame, as 0s and 1s",
};

const UNIT_SERIES: Record<ExampleStep["unit"], number | null> = {
  Data: 0,
  Segment: 1,
  Packet: 2,
  Frame: 3,
  Bits: null,
};

const HEADER: Record<ExampleHeader, { label: string; series: number; bytes: number; depth: number }> = {
  tcp: { label: "TCP header", series: 1, bytes: 20, depth: 1 },
  ip: { label: "IP header", series: 2, bytes: 20, depth: 2 },
  eth: { label: "Frame header", series: 3, bytes: 14, depth: 3 },
};

const REMOVED_NOTE: Record<ExampleHeader, string> = {
  eth: "Frame header and FCS: read, then thrown away",
  ip: "IP header: read, then thrown away",
  tcp: "TCP header: read, then thrown away",
};

/** "a packet", but "data" and "bits": those two are never counted. */
const called = (unit: ExampleStep["unit"]) =>
  unit === "Data" || unit === "Bits" ? unit.toLowerCase() : `a ${unit.toLowerCase()}`;

const series = (n: number | null) => (n === null ? "var(--ink-3)" : `var(--s${n + 1})`);
const seriesInk = (n: number | null) => (n === null ? "var(--ink-2)" : `var(--s${n + 1}-ink)`);
const wash = (colour: string, pct: number) => `color-mix(in oklab, ${colour} ${pct}%, transparent)`;

export function ExampleSection() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const cur = EXAMPLE_STEPS[step];
  const last = EXAMPLE_STEPS.length - 1;

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      if (step >= last) setPlaying(false);
      else setStep(step + 1);
    }, 5200);
    return () => clearTimeout(id);
  }, [playing, step, last]);

  const go = (i: number) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(last, i)));
  };

  const where =
    cur.at === "laptop"
      ? "Sending host"
      : cur.at === "server"
        ? "Receiving host"
        : cur.at === "router"
          ? "Home router"
          : "On the medium";

  return (
    <Section
      id="example"
      title="One click, followed all the way"
      lead={
        <>
          You open <span className="font-mono text-ink">www.example.com</span> on your laptop. Below, that one
          request is followed through every layer, from your laptop to the web server, with the real values each
          layer writes. Watch two things: the envelopes being added and removed, and the name of the thing
          changing as they are.
        </>
      }
    >
      <Panel
        title={`Step ${step + 1} of ${EXAMPLE_STEPS.length}`}
        subtitle="The addresses are made up, but they have the same shape as real ones."
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              onClick={() => {
                if (step >= last) setStep(0);
                setPlaying((p) => !p);
              }}
            >
              {playing ? "Pause" : "Play"}
            </Button>
            <Button size="sm" onClick={() => go(step - 1)} disabled={step === 0}>
              Back
            </Button>
            <Button size="sm" variant="primary" onClick={() => (step === last ? go(0) : go(step + 1))}>
              {step === last ? "Start again" : "Next"}
            </Button>
          </div>
        }
      >
        <Scene step={cur} />

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <p className="mb-2 text-2xs font-semibold tracking-wide text-ink-3">What is actually being sent</p>
            <Unit step={cur} stepIndex={step} />
          </div>

          <div key={step} className="min-w-0" style={{ animation: "rise var(--dur-slow) var(--ease-out-quart)" }}>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge>{where}</Badge>
              {cur.layer !== null && (
                <Badge tone="brand">
                  {TCPIP_LAYERS[cur.layer].name} layer {cur.verb}
                </Badge>
              )}
            </div>
            <h4 className="mt-2 text-base font-semibold text-ink">{cur.title}</h4>
            <p className="mt-1.5 max-w-[60ch] text-sm text-ink-2">{cur.plain}</p>

            <div className="mt-3 flex gap-2.5 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
              <LetterIcon />
              <p className="min-w-0 text-sm text-ink-2">
                <span className="font-semibold text-ink">Like posting a letter: </span>
                {cur.analogy}
              </p>
            </div>

            {cur.extra && (
              <div className="mt-3 text-sm text-ink-2">
                <Extra>NAT</Extra>
                <p className="mt-1.5 max-w-[60ch]">{cur.extra}</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-2 border-t border-line pt-3">
              <div>
                <p className="text-2xs font-medium tracking-wide text-ink-3">Right now it is called</p>
                <p
                  className="mt-0.5 font-mono text-2xl leading-tight font-semibold"
                  style={{ color: seriesInk(UNIT_SERIES[cur.unit]) }}
                >
                  {called(cur.unit)}
                </p>
              </div>
              <div className="min-w-0 pb-0.5">
                <p className="text-sm text-ink-2">
                  {cur.unit} = {FORMULA[cur.unit]}
                </p>
                <p className="tnum text-2xs text-ink-3">
                  {cur.unit === "Bits" ? `${SIZE.Frame} bytes × 8 = ${SIZE.Bits} bits` : `${SIZE[cur.unit]} bytes`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <UnitLadder step={cur} />

        <ol className="mt-4 flex flex-wrap gap-1.5" aria-label="Steps">
          {EXAMPLE_STEPS.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Step ${i + 1}: ${s.title}`}
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
      </Panel>

      <Panel
        title="Five names, five questions"
        subtitle="Each name goes with exactly one question about the message. If you know the question, you know the name."
        bodyClassName="p-0"
      >
        <ul>
          {UNIT_QUESTIONS.map((u) => {
            const n = u.unit === "Bits" ? null : u.series;
            return (
              <li
                key={u.unit}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-3 border-b border-line px-4 py-3 last:border-0 sm:grid-cols-[6.5rem_minmax(0,1fr)_11rem]"
              >
                <div>
                  <span
                    className="inline-block rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold"
                    style={{ background: wash(series(n), 12), color: seriesInk(n) }}
                  >
                    {u.unit}
                  </span>
                  <p className="mt-1 text-2xs text-ink-3">{u.layer}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{u.question}</p>
                  <p className="text-sm text-ink-2">{u.answer}</p>
                </div>
                <p className="col-start-2 truncate font-mono text-2xs text-ink-3 sm:col-start-3 sm:pt-0.5 sm:text-right">
                  {u.example}
                </p>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Panel title="Four things that trip people up">
          <ol className="grid gap-3">
            <Trip n={1} title="It is the same message the whole time.">
              Data, segment, packet and frame are not different messages. They are the same 41 bytes in more or
              fewer envelopes, and the name tells you how many envelopes are on.
            </Trip>
            <Trip n={2} title="Segment or packet? Look for the address.">
              A segment has port numbers, so it knows which <em>program</em>. A packet adds IP addresses, so it
              knows which <em>computer</em>.
            </Trip>
            <Trip n={3} title="Bits are not one more wrapper.">
              Nothing is added at the bottom. Bits are the finished frame, header and all, turned into a signal.
            </Trip>
            <Trip n={4} title="A router only goes halfway up.">
              It opens the frame and reads the IP address, but never the ports or the data. That is why a router
              is called a network-layer (Internet-layer) device.
            </Trip>
          </ol>
        </Panel>

        <Callout kind="exam" title="The rule to remember">
          <strong>IP addresses go end to end; MAC addresses go hop to hop.</strong> In this example the
          destination IP, 93.184.216.34, is the same from your laptop to the server. The frame, and its MAC
          addresses, is thrown away and rebuilt at every one of the {EXAMPLE_MIDDLE_ROUTERS + 1} routers on the
          way. Steps 6 to 9 show it happening.
        </Callout>
      </div>
    </Section>
  );
}

function Trip({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="tnum mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-surface-2 font-mono text-2xs font-semibold text-ink-3">
        {n}
      </span>
      <p className="min-w-0 text-sm text-ink-2">
        <span className="font-semibold text-ink">{title} </span>
        {children}
      </p>
    </li>
  );
}

/* ------------------------------------------------------------------ *
 * The map: laptop, home router, the Internet, the server
 * ------------------------------------------------------------------ */

type NodeId = "laptop" | "router" | "internet" | "server";

const NODES: { id: NodeId; name: string; sub: string; layers: number[] }[] = [
  { id: "laptop", name: "Your laptop", sub: EXAMPLE_HOSTS.laptop.ip, layers: [0, 1, 2, 3] },
  { id: "router", name: "Home router", sub: EXAMPLE_HOSTS.router.ip, layers: [2, 3] },
  { id: "internet", name: "The Internet", sub: `+${EXAMPLE_MIDDLE_ROUTERS} routers`, layers: [] },
  { id: "server", name: "Web server", sub: EXAMPLE_HOSTS.server.ip, layers: [0, 1, 2, 3] },
];

/** Where the travelling unit sits, as a percentage across the map. */
const TOKEN_X: Record<ExamplePlace, number> = {
  laptop: 12.5,
  wire1: 25,
  router: 37.5,
  wire2: 62.5,
  server: 87.5,
};

const SHORT: Record<number, string> = { 0: "App", 1: "Transport", 2: "Internet", 3: "Link" };

function Scene({ step }: { step: ExampleStep }) {
  const n = UNIT_SERIES[step.unit];
  const colour = series(n);
  const onWire = step.layer === null;

  return (
    <div
      className="relative"
      role="img"
      aria-label={`The unit is at the ${step.at === "wire1" || step.at === "wire2" ? "medium" : step.at}${
        step.layer === null ? "" : `, ${TCPIP_LAYERS[step.layer].name} layer`
      }, and is called ${called(step.unit)}.`}
    >
      {/* The lane the unit travels in. */}
      <div className="relative h-8">
        <div
          className="absolute top-1 -translate-x-1/2 transition-[left] duration-700 ease-[var(--ease-out-quart)]"
          style={{ left: `${TOKEN_X[step.at]}%` }}
        >
          <span
            className="block rounded-md px-2 py-0.5 font-mono text-2xs font-bold whitespace-nowrap shadow-sm"
            style={{
              background: onWire ? "var(--surface-2)" : colour,
              color: onWire ? "var(--ink)" : "var(--bg)",
              border: onWire ? "1px dashed var(--line-strong)" : `1px solid ${colour}`,
            }}
          >
            {onWire ? "0110…" : step.unit}
          </span>
        </div>
      </div>

      <div className="relative grid grid-cols-4">
        {/* The links between them. Dashed where the medium is carrying bits right now. */}
        <div className="absolute top-5 right-[12.5%] left-[12.5%] h-0.5 bg-line" aria-hidden />
        <div
          aria-hidden
          className="absolute top-5 h-0.5 transition-opacity duration-300"
          style={{
            left: step.at === "wire1" ? "12.5%" : "37.5%",
            right: step.at === "wire1" ? "62.5%" : "12.5%",
            opacity: onWire ? 1 : 0,
            backgroundImage: "repeating-linear-gradient(90deg, var(--brand) 0 5px, transparent 5px 9px)",
            animation: onWire ? "bitflow 0.9s linear infinite" : undefined,
          }}
        />

        {NODES.map((node) => {
          const here = step.at === node.id || (node.id === "internet" && step.at === "wire2");
          return (
            <div key={node.id} className="relative flex min-w-0 flex-col items-center px-0.5 text-center">
              <div
                className={clsx(
                  "flex h-10 w-10 items-center justify-center rounded-lg border bg-surface transition-colors duration-300",
                  here ? "border-brand text-brand" : "border-line text-ink-3",
                )}
                style={here ? { boxShadow: `0 0 0 3px ${wash("var(--brand)", 18)}` } : undefined}
              >
                <NodeIcon id={node.id} />
              </div>
              <p className={clsx("mt-1.5 truncate text-2xs font-semibold", here ? "text-ink" : "text-ink-2")}>
                {node.name}
              </p>
              <p className="tnum w-full truncate font-mono text-[9px] text-ink-3 sm:text-[10px]">{node.sub}</p>

              {node.layers.length > 0 && (
                <div className="mt-2 grid w-full max-w-[84px] gap-[3px]">
                  {[0, 1, 2, 3].map((i) => {
                    const used = node.layers.includes(i);
                    const active = step.at === node.id && step.layer === i;
                    const c = series(TCPIP_LAYERS[i].series);
                    return (
                      <div
                        key={i}
                        className={clsx(
                          "flex h-3 items-center justify-center rounded-[3px] text-[8px] leading-none font-semibold transition-all duration-300 sm:h-4 sm:text-[9px]",
                          !used && "border border-dashed border-line",
                        )}
                        style={
                          used
                            ? {
                                background: active ? c : "var(--surface-3)",
                                color: active ? "var(--bg)" : "var(--ink-3)",
                              }
                            : undefined
                        }
                      >
                        <span className={clsx("hidden sm:inline", !used && "opacity-0")}>{SHORT[i]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {node.id === "router" && (
                <p className="mt-1 hidden text-[10px] leading-tight text-ink-3 sm:block">stops at Internet</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The unit itself, as envelopes inside envelopes
 * ------------------------------------------------------------------ */

function Unit({ step, stepIndex }: { step: ExampleStep; stepIndex: number }) {
  const hop = EXAMPLE_HOPS[step.hop];
  const onWire = step.layer === null;

  return (
    <div className="min-w-0">
      {step.removed && (
        <div
          key={`gone-${stepIndex}`}
          className="mb-2 flex items-center gap-2 rounded-md border border-dashed px-2.5 py-1.5 text-2xs"
          style={{
            borderColor: series(HEADER[step.removed].series),
            color: seriesInk(HEADER[step.removed].series),
            animation: "peel-off 900ms var(--ease-out-quart) both",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0">
            <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="font-medium">Removed: {REMOVED_NOTE[step.removed]}</span>
        </div>
      )}

      {onWire && <BitRibbon hop={step.hop} />}

      <div className={clsx("transition-opacity duration-500", onWire && "opacity-45")}>
        <Wrap kind="eth" step={step} fields={[
          { key: "macFrom", label: "from MAC", value: hop.macFrom },
          { key: "macTo", label: "to MAC", value: hop.macTo },
        ]}>
          <Wrap kind="ip" step={step} fields={[
            { key: "ipFrom", label: "from IP", value: hop.ipFrom },
            { label: "to IP", value: EXAMPLE_HOSTS.server.ip },
            { key: "ttl", label: "TTL", value: String(hop.ttl) },
          ]}>
            <Wrap kind="tcp" step={step} fields={[
              { label: "from port", value: String(EXAMPLE_HOSTS.srcPort) },
              { label: "to port", value: String(EXAMPLE_HOSTS.dstPort) },
            ]}>
              <DataBox focused={step.focus === "data"} />
            </Wrap>
          </Wrap>
        </Wrap>
      </div>
      {onWire && (
        <p className="mt-1.5 text-2xs text-ink-3">The same frame is still in there. It is just being carried as a signal.</p>
      )}
    </div>
  );
}

type Field = { key?: ExampleField; label: string; value: string };

/**
 * One envelope. It is always rendered, and grows or collapses to nothing, so
 * adding or removing a header animates in place instead of redrawing the lot.
 */
function Wrap({
  kind,
  step,
  fields,
  children,
}: {
  kind: ExampleHeader;
  step: ExampleStep;
  fields: Field[];
  children: ReactNode;
}) {
  const meta = HEADER[kind];
  const present = step.depth >= meta.depth;
  const focused = present && step.focus === kind;
  const leaving = focused && step.verb === "removes";
  const colour = series(meta.series);

  return (
    <div
      className="rounded-lg transition-[padding,border-color,background-color,box-shadow] duration-500 ease-[var(--ease-out-quart)]"
      style={{
        border: `2px ${leaving ? "dashed" : "solid"} ${present ? colour : "transparent"}`,
        background: present ? wash(colour, 6) : "transparent",
        padding: present ? "6px" : "0px",
        boxShadow: focused ? `0 0 0 3px ${wash(colour, 22)}` : "none",
      }}
    >
      <Collapse open={present}>
        <div className="flex flex-wrap items-center gap-1 pb-1.5">
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap"
            style={{ background: colour, color: "var(--bg)" }}
          >
            {meta.label} · {meta.bytes} B
          </span>
          {fields.map((f) => (
            <FieldChip key={f.label} field={f} changed={!!f.key && !!step.changed?.includes(f.key)} />
          ))}
          {leaving && (
            <span className="text-[10px] font-semibold" style={{ color: seriesInk(meta.series) }}>
              coming off
            </span>
          )}
        </div>
      </Collapse>

      {children}

      {kind === "eth" && (
        <Collapse open={present}>
          <div className="flex items-center gap-1 pt-1.5">
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap"
              style={{ background: colour, color: "var(--bg)" }}
            >
              FCS · 4 B
            </span>
            <span className="text-[10px] text-ink-3">a checksum, so damage can be detected</span>
          </div>
        </Collapse>
      )}
    </div>
  );
}

function FieldChip({ field, changed }: { field: Field; changed: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex max-w-full items-baseline gap-1 rounded border px-1.5 py-0.5 text-[10px] transition-colors duration-300",
        changed ? "border-warn bg-warn-wash" : "border-line bg-surface",
      )}
    >
      <span className="text-ink-3">{field.label}</span>
      <span className="tnum truncate font-mono font-semibold text-ink">{field.value}</span>
      {changed && <span className="font-semibold text-warn">new</span>}
    </span>
  );
}

/** Animates height between zero and its content's natural height. */
function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out-quart)]"
      style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      aria-hidden={!open}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function DataBox({ focused }: { focused: boolean }) {
  const colour = series(0);
  const lines = EXAMPLE_REQUEST.split("\r\n").filter(Boolean);
  return (
    <div
      className="rounded-md border-2 px-2.5 py-2 transition-shadow duration-300"
      style={{
        borderColor: colour,
        background: wash(colour, 10),
        boxShadow: focused ? `0 0 0 3px ${wash(colour, 22)}` : "none",
      }}
    >
      <p className="text-[10px] font-bold" style={{ color: seriesInk(0) }}>
        Data · {EXAMPLE_REQUEST.length} B · written by the browser
      </p>
      <pre className="mt-1 overflow-x-auto font-mono text-xs leading-relaxed text-ink">{lines.join("\n")}</pre>
    </div>
  );
}

/** The first bytes of the frame, as they would be written out in binary. */
function frameBytes(hop: (typeof EXAMPLE_HOPS)[number]): number[] {
  const mac = (m: string) => m.split(":").map((h) => parseInt(h, 16));
  const packetLength = SIZE.Packet;
  return [
    ...mac(hop.macTo),
    ...mac(hop.macFrom),
    0x08, 0x00, // EtherType: what follows is IPv4
    0x45, 0x00, // IPv4, 20-byte header
    packetLength >> 8, packetLength & 0xff,
  ];
}

function BitRibbon({ hop }: { hop: 0 | 1 | 2 }) {
  const bytes = frameBytes(EXAMPLE_HOPS[hop]);
  const text = bytes.map((b) => b.toString(2).padStart(8, "0")).join(" ");
  return (
    <div className="mb-2 overflow-hidden rounded-md border border-line bg-surface-2 py-2">
      <div className="flex w-max font-mono text-xs font-semibold text-ink" style={{ animation: "bitflow-text 14s linear infinite" }}>
        <span className="px-3 whitespace-nowrap">{text}</span>
        <span className="px-3 whitespace-nowrap" aria-hidden>
          {text}
        </span>
      </div>
      <p className="mt-1.5 px-3 text-2xs text-ink-3">
        The first bytes out are the destination MAC address,{" "}
        <span className="font-mono">{EXAMPLE_HOPS[hop].macTo}</span>, written in binary.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The ladder of names, with the current one lit
 * ------------------------------------------------------------------ */

const LADDER: ExampleStep["unit"][] = ["Data", "Segment", "Packet", "Frame", "Bits"];

function UnitLadder({ step }: { step: ExampleStep }) {
  const sending = step.at === "laptop" || step.at === "wire1";
  const atRouter = step.at === "router";
  const between = step.at === "wire2";
  // A router only ever deals in frames and packets; the names above that are
  // dimmed so the ladder does not suggest it unwraps any further.
  const beyondRouter = (u: ExampleStep["unit"]) => (atRouter || between) && (u === "Data" || u === "Segment");
  return (
    <div className="mt-4 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
      <p className="text-2xs font-semibold tracking-wide text-ink-3">
        {sending
          ? "Going down: each layer adds an envelope →"
          : atRouter
            ? "At a router: frame → packet → a new frame. It never unwraps further than the packet."
            : between
              ? "Between routers: bits → frame → packet → new frame → bits, at every hop"
              : "← Going up: each layer removes its envelope"}
      </p>
      <ol className="mt-2 flex flex-wrap items-center gap-1">
        {LADDER.map((u, i) => {
          const active = u === step.unit;
          const c = series(UNIT_SERIES[u]);
          return (
            <li key={u} className="flex items-center gap-1">
              <span
                className={clsx(
                  "rounded-md px-2 py-0.5 font-mono text-xs font-semibold transition-all duration-300",
                  !active && "text-ink-3",
                  beyondRouter(u) && "opacity-40 line-through",
                )}
                style={active ? { background: c, color: "var(--bg)" } : { background: "var(--surface)" }}
              >
                {u}
              </span>
              {i < LADDER.length - 1 && (
                <span aria-hidden className="text-2xs text-ink-3">
                  {sending ? "→" : atRouter || between ? "·" : "←"}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Icons
 * ------------------------------------------------------------------ */

function NodeIcon({ id }: { id: NodeId }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (id === "laptop")
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="11" rx="1.5" />
        <path d="M2 19h20" />
      </svg>
    );
  if (id === "router")
    return (
      <svg {...common}>
        <rect x="3" y="13" width="18" height="6" rx="1.5" />
        <path d="M7 16h.01M11 16h.01M8 13V9M16 13V9M9 6.5a4.5 4.5 0 0 1 6 0" />
      </svg>
    );
  if (id === "internet")
    return (
      <svg {...common}>
        <path d="M7 18a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 17 9a4.5 4.5 0 0 1 .5 9z" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="5" y="3" width="14" height="7" rx="1.5" />
      <rect x="5" y="14" width="14" height="7" rx="1.5" />
      <path d="M8.5 6.5h.01M8.5 17.5h.01" />
    </svg>
  );
}

function LetterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-0.5 shrink-0 text-ink-3" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
