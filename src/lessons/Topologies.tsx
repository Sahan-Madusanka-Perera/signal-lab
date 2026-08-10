import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Section } from "../components/LessonPage";
import { ScopeCanvas } from "../components/ScopeCanvas";
import { Quiz, type Question } from "../components/Quiz";
import {
  Button,
  Callout,
  Formula,
  Legend,
  Panel,
  Readout,
  Scope,
  Segmented,
  Slider,
  Toggle,
} from "../components/ui";
import { TAU, meshLinks, meshPorts } from "../lib/signal";
import type { Plot } from "../lib/plot";
import type { Palette } from "../lib/theme";

export function TopologiesLesson() {
  return (
    <>
      <GrowthSection />
      <TopologyExplorer />
      <CollisionSection />
      <HubVsSwitch />
      <Section id="check" title="Check yourself">
        <Quiz lessonId="topologies" questions={QUESTIONS} />
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Shared node drawing
 * ------------------------------------------------------------------ */

type NodeState = "idle" | "sending" | "receiving" | "ignoring" | "collided";

function drawNode(
  plot: Plot,
  palette: Palette,
  x: number,
  y: number,
  label: string,
  state: NodeState = "idle",
  r = 15,
) {
  const ctx = plot.ctx;
  const colour =
    state === "sending"
      ? palette.series[0]
      : state === "receiving"
        ? palette.series[2]
        : state === "collided"
          ? palette.series[4]
          : state === "ignoring"
            ? palette.inkFaint
            : palette.axis;

  ctx.save();
  if (state !== "idle" && palette.isDark) {
    ctx.shadowColor = colour;
    ctx.shadowBlur = 14;
  }
  ctx.fillStyle = palette.bg;
  ctx.strokeStyle = colour;
  ctx.lineWidth = state === "idle" ? 1.5 : 2.2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = '700 10px "JetBrains Mono Variable", ui-monospace, monospace';
  ctx.fillStyle = state === "idle" ? palette.ink : colour;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 0.5);
  ctx.restore();
}

function drawBox(
  plot: Plot,
  palette: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  colour: string,
) {
  const ctx = plot.ctx;
  ctx.save();
  ctx.fillStyle = palette.bg;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.font = '700 10px "JetBrains Mono Variable", ui-monospace, monospace';
  ctx.fillStyle = colour;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 0.5);
  ctx.restore();
}

/* ================================================================== *
 * 1. The all-to-all problem
 * ================================================================== */

function GrowthSection() {
  const [n, setN] = useState(6);
  const links = meshLinks(n);
  const ports = meshPorts(n);

  return (
    <Section
      id="growth"
      title="Why you cannot just connect everything to everything"
      lead="Point-to-point works perfectly for two devices. The obvious next step is to run a cable between every pair — and it collapses almost immediately. Drag the slider and watch the cable count run away from you."
    >
      <Panel
        title="All-to-all growth"
        subtitle="Every host needs a port for every other host, and every pair needs its own cable."
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <Scope height={300}>
            <ScopeCanvas
              label={`${n} devices fully connected need ${links} cables and ${ports} ports on each device`}
              deps={[n]}
              bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
              insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
              draw={({ plot, ctx, palette, w, h }) => {
                const cx = w / 2;
                const cy = h / 2;
                const r = Math.min(w, h) / 2 - 34;
                const pts = Array.from({ length: n }, (_, i) => {
                  const a = (i / n) * TAU - Math.PI / 2;
                  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
                });

                ctx.save();
                ctx.strokeStyle = palette.series[n > 8 ? 4 : 1];
                ctx.globalAlpha = n > 10 ? 0.35 : n > 6 ? 0.5 : 0.72;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                for (let i = 0; i < n; i++) {
                  for (let j = i + 1; j < n; j++) {
                    ctx.moveTo(pts[i].x, pts[i].y);
                    ctx.lineTo(pts[j].x, pts[j].y);
                  }
                }
                ctx.stroke();
                ctx.restore();

                pts.forEach((p, i) => drawNode(plot, palette, p.x, p.y, String(i + 1), "idle", 14));
              }}
            />
          </Scope>

          <div className="grid content-start gap-4 lg:border-l lg:border-line lg:pl-4">
            <Slider
              label="Number of devices"
              value={n}
              onChange={setN}
              min={2}
              max={16}
              step={1}
              readout={`${n} hosts`}
              accent={n > 8 ? "var(--s5)" : "var(--s2)"}
            />

            <div className="grid gap-3">
              <Readout
                label="Cables needed"
                value={links}
                tone={links > 40 ? "bad" : links > 15 ? "warn" : "neutral"}
                sub="n(n − 1) / 2"
              />
              <Readout label="Ports on every device" value={ports} sub="n − 1" />
            </div>

            <Formula note="Doubling the hosts roughly quadruples the cabling.">
              links = n(n − 1) / 2
            </Formula>

            <div className="rounded-lg border border-line bg-surface-2 p-3">
              <p className="text-2xs font-semibold text-ink-3">Scaling up</p>
              <ul className="mt-1.5 grid gap-1">
                {[10, 30, 50, 100].map((k) => (
                  <li key={k} className="flex items-baseline justify-between gap-2 text-2xs">
                    <span className="text-ink-2">{k} devices</span>
                    <span className="tnum font-mono font-semibold text-ink">
                      {meshLinks(k).toLocaleString()} cables
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-4 max-w-[72ch] text-sm text-ink-2">
          A classroom of thirty machines would need{" "}
          <strong className="font-semibold text-ink">{meshLinks(30)} cables</strong> and twenty-nine network ports
          in the back of every single computer. It is not merely expensive — it is physically impossible to build.
          Every topology that follows exists to avoid this.
        </p>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * 2. Topology explorer
 * ================================================================== */

type Topo = "bus" | "star" | "ring" | "mesh";

const TOPO_INFO: Record<
  Topo,
  { name: string; how: string; pros: string[]; cons: string[]; links: (n: number) => string }
> = {
  bus: {
    name: "Bus",
    how: "One shared backbone cable with a terminator at each end. Every device taps onto the same cable.",
    pros: ["Uses the least cable of any topology", "Simple and cheap to lay", "Easy to add another device"],
    cons: [
      "Only one device can transmit at a time — the media access problem",
      "A break anywhere in the backbone takes down the whole network",
      "Hard to fault-find, because everything shares one cable",
    ],
    links: (n) => `${n} taps on 1 cable`,
  },
  star: {
    name: "Star",
    how: "Every device has its own cable running back to a central hub or switch.",
    pros: [
      "One failed cable affects only that one device",
      "Easy to add, remove and fault-find",
      "With a switch, several conversations run at once",
    ],
    cons: ["Needs more cable than a bus", "The central device is a single point of failure"],
    links: (n) => `${n} cables`,
  },
  ring: {
    name: "Ring",
    how: "Each device connects to exactly two neighbours, forming a closed loop. Data passes through every device in between.",
    pros: ["No central device needed", "Orderly access — no collisions", "Performs predictably under heavy load"],
    cons: [
      "One broken link can break the whole ring",
      "Data may pass through many machines to reach its destination",
      "Adding a device means breaking the loop",
    ],
    links: (n) => `${n} cables`,
  },
  mesh: {
    name: "Mesh",
    how: "Devices are joined point-to-point. In a full mesh every host connects directly to every other host.",
    pros: ["Extremely resilient — many alternative paths", "No contention between pairs", "Traffic is private to each link"],
    cons: ["Cabling grows as n(n − 1)/2", "Every host needs many ports", "Expensive to build and to maintain"],
    links: (n) => `${meshLinks(n)} cables`,
  },
};

function TopologyExplorer() {
  const [topo, setTopo] = useState<Topo>("bus");
  const [n, setN] = useState(6);
  const [animate, setAnimate] = useState(true);
  const info = TOPO_INFO[topo];

  return (
    <Section
      id="topologies"
      title="Topology explorer"
      lead="Four ways of wiring the same devices together. The orange dot is one message travelling from device 1 to device 4 — watch how differently it gets there in each layout."
    >
      <Panel
        title={`${info.name} topology`}
        subtitle={info.how}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              label="Topology"
              value={topo}
              onChange={setTopo}
              options={(Object.keys(TOPO_INFO) as Topo[]).map((t) => ({ value: t, label: TOPO_INFO[t].name }))}
            />
            <Toggle checked={animate} onChange={setAnimate} label="Animate" />
          </div>
        }
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_270px]">
          <Scope height={320}>
            <ScopeCanvas
              label={`A ${info.name} topology connecting ${n} devices, with a message travelling from device 1 to device 4`}
              animate={animate}
              deps={[topo, n]}
              bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
              insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
              draw={(a) => drawTopology(a.plot, a.palette, topo, n, a.time, a.w, a.h)}
            />
          </Scope>

          <div className="grid content-start gap-4 lg:border-l lg:border-line lg:pl-4">
            <Slider
              label="Devices"
              value={n}
              onChange={setN}
              min={3}
              max={topo === "mesh" ? 8 : 8}
              step={1}
              readout={`${n}`}
              accent="var(--s2)"
            />
            <Readout label="Cabling" value={<span className="text-sm">{info.links(n)}</span>} tone="brand" />

            <div>
              <p className="text-2xs font-semibold text-ok">Advantages</p>
              <ul className="mt-1.5 grid gap-1.5">
                {info.pros.map((p) => (
                  <li key={p} className="flex gap-2 text-xs text-ink-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ok" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-2xs font-semibold text-bad">Disadvantages</p>
              <ul className="mt-1.5 grid gap-1.5">
                {info.cons.map((p) => (
                  <li key={p} className="flex gap-2 text-xs text-ink-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-bad" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Legend
          className="mt-4"
          items={[
            { color: "var(--s1)", label: "Sender / message in flight" },
            { color: "var(--s3)", label: "Intended recipient" },
            { color: "var(--ink-3)", label: "Sees the data but ignores it", muted: true },
          ]}
        />
      </Panel>
    </Section>
  );
}

function drawTopology(
  plot: Plot,
  palette: Palette,
  topo: Topo,
  n: number,
  time: number,
  w: number,
  h: number,
) {
  const ctx = plot.ctx;
  const src = 0;
  const dst = Math.min(3, n - 1);
  const t = (time * 0.3) % 1.35;
  const p = Math.min(1, t);

  const cable = (path: () => void, colour = palette.gridMajor, width = 2.5) => {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    path();
    ctx.stroke();
    ctx.restore();
  };

  const packet = (x: number, y: number) => {
    ctx.save();
    ctx.fillStyle = palette.series[0];
    if (palette.isDark) {
      ctx.shadowColor = palette.series[0];
      ctx.shadowBlur = 14;
    }
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  const stateOf = (i: number): NodeState => {
    if (i === src) return "sending";
    if (i === dst) return p >= 0.98 ? "receiving" : "idle";
    return "idle";
  };

  if (topo === "bus") {
    // Centred in the shared canvas height that the round topologies need.
    const y = h * 0.68;
    const x0 = 40;
    const x1 = w - 40;
    cable(() => {
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
    });
    // Terminators — the detail that identifies a bus in an exam answer.
    [x0, x1].forEach((x) => {
      ctx.save();
      ctx.strokeStyle = palette.series[4];
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 9);
      ctx.lineTo(x, y + 9);
      ctx.stroke();
      ctx.restore();
    });
    plot.text(x0, y + 16, "terminator", palette.inkFaint, { size: 9, align: "center" });
    plot.text(x1, y + 16, "terminator", palette.inkFaint, { size: 9, align: "center" });

    const xs = Array.from({ length: n }, (_, i) => x0 + 34 + ((x1 - x0 - 68) * i) / (n - 1));
    const nodeY = h * 0.34;
    xs.forEach((x) => cable(() => { ctx.moveTo(x, y); ctx.lineTo(x, nodeY + 15); }, palette.gridMajor, 1.6));

    // On a bus the signal spreads both ways from the tap point.
    const reach = p * Math.max(xs[src] - x0, x1 - xs[src]);
    ctx.save();
    ctx.strokeStyle = palette.series[0];
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.85;
    if (palette.isDark) {
      ctx.shadowColor = palette.series[0];
      ctx.shadowBlur = 12;
    }
    ctx.beginPath();
    ctx.moveTo(Math.max(x0, xs[src] - reach), y);
    ctx.lineTo(Math.min(x1, xs[src] + reach), y);
    ctx.stroke();
    ctx.restore();

    xs.forEach((x, i) => {
      const arrived = Math.abs(x - xs[src]) <= reach;
      const state: NodeState =
        i === src ? "sending" : i === dst ? (arrived ? "receiving" : "idle") : arrived ? "ignoring" : "idle";
      drawNode(plot, palette, x, nodeY, String(i + 1), state);
    });
    plot.text(w / 2, h - 16, "every device sees every frame — only device 4 keeps it", palette.inkFaint, {
      size: 10,
      align: "center",
    });
    return;
  }

  if (topo === "star") {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 42;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * TAU - Math.PI / 2;
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    });
    pts.forEach((pt) => cable(() => { ctx.moveTo(cx, cy); ctx.lineTo(pt.x, pt.y); }));

    // Two legs: source → centre, then centre → destination.
    const leg = p < 0.5 ? 0 : 1;
    const u = leg === 0 ? p / 0.5 : (p - 0.5) / 0.5;
    const from = leg === 0 ? pts[src] : { x: cx, y: cy };
    const to = leg === 0 ? { x: cx, y: cy } : pts[dst];
    ctx.save();
    ctx.strokeStyle = palette.series[0];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pts[src].x, pts[src].y);
    if (leg === 0) ctx.lineTo(from.x + (to.x - from.x) * u, from.y + (to.y - from.y) * u);
    else {
      ctx.lineTo(cx, cy);
      ctx.lineTo(from.x + (to.x - from.x) * u, from.y + (to.y - from.y) * u);
    }
    ctx.stroke();
    ctx.restore();

    drawBox(plot, palette, cx, cy, 62, 30, "switch", palette.series[1]);
    pts.forEach((pt, i) => drawNode(plot, palette, pt.x, pt.y, String(i + 1), stateOf(i)));
    packet(from.x + (to.x - from.x) * u, from.y + (to.y - from.y) * u);
    plot.text(w / 2, h - 12, "every frame goes via the central device", palette.inkFaint, {
      size: 10,
      align: "center",
    });
    return;
  }

  if (topo === "ring") {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 38;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * TAU - Math.PI / 2;
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    });
    cable(() => {
      pts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.closePath();
    });

    // The frame is passed hop by hop until it reaches its destination.
    const hops = (dst - src + n) % n;
    const travelled = p * hops;
    const hop = Math.min(hops - 1, Math.floor(travelled));
    const u = travelled - hop;
    const a = pts[(src + hop) % n];
    const b = pts[(src + hop + 1) % n];
    const px = a.x + (b.x - a.x) * u;
    const py = a.y + (b.y - a.y) * u;

    pts.forEach((pt, i) => {
      const passed = ((i - src + n) % n) <= hop && i !== src && i !== dst;
      const state: NodeState =
        i === src ? "sending" : i === dst ? (p >= 0.98 ? "receiving" : "idle") : passed ? "ignoring" : "idle";
      drawNode(plot, palette, pt.x, pt.y, String(i + 1), state);
    });
    packet(px, py);
    plot.text(w / 2, h - 12, `the frame passes through ${hops - 1} device${hops - 1 === 1 ? "" : "s"} on the way`, palette.inkFaint, {
      size: 10,
      align: "center",
    });
    return;
  }

  // Mesh
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 34;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU - Math.PI / 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
  ctx.save();
  ctx.strokeStyle = palette.gridMajor;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[j].x, pts[j].y);
    }
  ctx.stroke();
  ctx.restore();

  cable(() => {
    ctx.moveTo(pts[src].x, pts[src].y);
    ctx.lineTo(pts[src].x + (pts[dst].x - pts[src].x) * p, pts[src].y + (pts[dst].y - pts[src].y) * p);
  }, palette.series[0], 2.5);

  pts.forEach((pt, i) => drawNode(plot, palette, pt.x, pt.y, String(i + 1), stateOf(i)));
  packet(pts[src].x + (pts[dst].x - pts[src].x) * p, pts[src].y + (pts[dst].y - pts[src].y) * p);
  plot.text(w / 2, h - 12, "a direct link to every other device", palette.inkFaint, {
    size: 10,
    align: "center",
  });
}

/* ================================================================== *
 * 3. Sharing the bus — the media access problem
 * ================================================================== */

type Frame = { id: number; from: number; start: number; colour: number };

function CollisionSection() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [collisions, setCollisions] = useState(0);
  const [sent, setSent] = useState(0);
  const [csma, setCsma] = useState(false);
  const nextId = useRef(1);
  const startedAt = useRef(performance.now());

  const now = () => (performance.now() - startedAt.current) / 1000;

  const send = (from: number) => {
    const t = now();
    setFrames((f) => {
      const live = f.filter((x) => t - x.start < 1.6);
      // Carrier sense: with CSMA on, a host that hears traffic waits instead.
      if (csma && live.some((x) => t - x.start < 1.4)) return live;
      return [...live, { id: nextId.current++, from, start: t, colour: from % 5 }];
    });
    setSent((s) => s + 1);
  };

  // Count a collision whenever two frames are on the wire at the same time.
  useEffect(() => {
    const live = frames.filter((f) => now() - f.start < 1.4);
    if (live.length > 1) setCollisions((c) => c + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames.length]);

  const hosts = 4;

  return (
    <Section
      id="collision"
      title="The price of sharing one cable"
      lead="A bus is beautifully simple until two devices talk at once. Their signals overlap on the shared medium and both are destroyed — a collision. Press two send buttons in quick succession and watch it happen."
    >
      <Panel
        title="Media access on a bus"
        subtitle={
          csma
            ? "Carrier sense is on: a device that hears traffic on the bus waits its turn instead of transmitting."
            : "No access control: any device transmits the moment it wants to."
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Toggle
              checked={csma}
              onChange={setCsma}
              label="Listen before talking"
              accent="var(--s3)"
              hint="Carrier sense"
            />
            <Button
              size="sm"
              onClick={() => {
                setFrames([]);
                setCollisions(0);
                setSent(0);
              }}
            >
              Reset
            </Button>
          </div>
        }
      >
        <Scope height={210}>
          <ScopeCanvas
            label="Four devices sharing one bus cable; overlapping transmissions collide"
            animate
            deps={[csma]}
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, w, h }) => {
              const y = h * 0.66;
              const x0 = 44;
              const x1 = w - 44;
              const nodeY = h * 0.26;
              const xs = Array.from({ length: hosts }, (_, i) => x0 + 40 + ((x1 - x0 - 80) * i) / (hosts - 1));
              const t = now();
              const live = frames.filter((f) => t - f.start < 1.5);
              const colliding = live.length > 1;

              // Backbone and terminators.
              ctx.save();
              ctx.strokeStyle = palette.gridMajor;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(x0, y);
              ctx.lineTo(x1, y);
              ctx.stroke();
              [x0, x1].forEach((x) => {
                ctx.strokeStyle = palette.series[4];
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(x, y - 10);
                ctx.lineTo(x, y + 10);
                ctx.stroke();
              });
              ctx.restore();

              xs.forEach((x) => {
                ctx.save();
                ctx.strokeStyle = palette.gridMajor;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, nodeY + 15);
                ctx.stroke();
                ctx.restore();
              });

              // Each live frame spreads outward from its sender's tap.
              live.forEach((f) => {
                const age = t - f.start;
                const reach = Math.min(1, age / 1.1) * Math.max(xs[f.from] - x0, x1 - xs[f.from]);
                const colour = colliding ? palette.series[4] : palette.series[f.colour];
                ctx.save();
                ctx.strokeStyle = colour;
                ctx.lineWidth = 3;
                ctx.globalAlpha = Math.max(0, 1 - age / 1.5);
                if (palette.isDark) {
                  ctx.shadowColor = colour;
                  ctx.shadowBlur = 14;
                }
                ctx.beginPath();
                ctx.moveTo(Math.max(x0, xs[f.from] - reach), y);
                ctx.lineTo(Math.min(x1, xs[f.from] + reach), y);
                ctx.stroke();
                ctx.restore();
              });

              if (colliding) {
                // Mark the overlap zone, which is what actually destroys the data.
                const spans = live.map((f) => {
                  const reach = Math.min(1, (t - f.start) / 1.1) * Math.max(xs[f.from] - x0, x1 - xs[f.from]);
                  return [Math.max(x0, xs[f.from] - reach), Math.min(x1, xs[f.from] + reach)] as const;
                });
                const lo = Math.max(...spans.map((s) => s[0]));
                const hi = Math.min(...spans.map((s) => s[1]));
                if (hi > lo) {
                  ctx.save();
                  ctx.fillStyle = palette.series[4];
                  ctx.globalAlpha = 0.22;
                  ctx.fillRect(lo, y - 16, hi - lo, 32);
                  ctx.restore();
                  plot.text((lo + hi) / 2, y - 30, "COLLISION", palette.series[4], {
                    size: 11,
                    weight: 700,
                    align: "center",
                  });
                }
              }

              xs.forEach((x, i) => {
                const sending = live.some((f) => f.from === i);
                const state: NodeState = colliding && sending ? "collided" : sending ? "sending" : "idle";
                drawNode(plot, palette, x, nodeY, `PC${i + 1}`, state, 17);
              });
            }}
          />
        </Scope>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div>
            <p className="mb-2 text-xs font-medium text-ink-2">Make a device transmit</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: hosts }, (_, i) => (
                <Button key={i} size="sm" variant="secondary" onClick={() => send(i)}>
                  PC{i + 1} sends
                </Button>
              ))}
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  send(0);
                  send(2);
                }}
              >
                PC1 and PC3 at once
              </Button>
            </div>
            <p className="mt-2.5 max-w-[64ch] text-2xs text-ink-3">
              {csma
                ? "With carrier sense on, the second transmission is held back until the bus is quiet — so the collision never happens. This is the idea behind CSMA, the access method real Ethernet buses used."
                : "With no access control, any two overlapping transmissions destroy each other. Both senders must detect the collision, back off for a random time and try again."}
            </p>
          </div>

          <div className="flex gap-6 sm:flex-col sm:gap-3 sm:border-l sm:border-line sm:pl-4">
            <Readout label="Frames attempted" value={sent} />
            <Readout label="Collisions" value={collisions} tone={collisions > 0 ? "bad" : "ok"} />
          </div>
        </div>
      </Panel>

      <Callout kind="exam" title="The bus's defining weakness">
        Every device shares one medium, so only one may transmit at a time. Controlling who gets to use the bus —
        the <strong>media access problem</strong> — is the price of the bus's simplicity. A star built around a{" "}
        <em>switch</em> avoids it entirely, because each device has a link of its own.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * 4. Hub vs switch
 * ================================================================== */

function HubVsSwitch() {
  const [device, setDevice] = useState<"hub" | "switch">("hub");
  const [target, setTarget] = useState(2);

  const rows = [
    ["What it does with an incoming frame", "Copies it to every other port", "Sends it only to the destination's port"],
    ["Does it learn addresses?", "No — it has no idea who is where", "Yes — it builds a table of which device is on which port"],
    ["Simultaneous conversations", "None — the whole hub is one shared medium", "Many, as long as the pairs differ"],
    ["Collisions", "Yes — all ports share one collision domain", "No — each port is its own collision domain"],
    ["Privacy", "Every device receives every frame", "Only the intended recipient receives it"],
    ["Cost and intelligence", "Cheap, dumb, obsolete", "Costlier, but standard everywhere today"],
  ];

  return (
    <Section
      id="hubswitch"
      title="Hub or switch — the same wiring, very different behaviour"
      lead="Both sit at the centre of a star and both tidy up the cabling. The difference is what happens to a frame once it arrives. Send a frame below and watch where it goes."
    >
      <Panel
        title={device === "hub" ? "Hub — floods every port" : "Switch — forwards to one port"}
        subtitle={
          device === "hub"
            ? "A hub is an electrical repeater. It has no idea who is connected where, so it copies the frame to every other port and lets the devices sort it out."
            : "A switch reads the destination address, looks it up in the table it has learnt, and sends the frame out of that one port only."
        }
        actions={
          <Segmented
            label="Central device"
            value={device}
            onChange={setDevice}
            options={[
              { value: "hub", label: "Hub" },
              { value: "switch", label: "Switch" },
            ]}
          />
        }
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_230px]">
          <Scope height={300}>
            <ScopeCanvas
              label={`PC1 sends a frame to PC${target + 1} through a ${device}`}
              animate
              deps={[device, target]}
              bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
              insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
              draw={({ plot, ctx, palette, time, w, h }) => {
                const cx = w / 2;
                const cy = h / 2;
                const r = Math.min(w, h) / 2 - 42;
                const n = 5;
                const pts = Array.from({ length: n }, (_, i) => {
                  const a = (i / n) * TAU - Math.PI / 2;
                  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
                });

                pts.forEach((pt) => {
                  ctx.save();
                  ctx.strokeStyle = palette.gridMajor;
                  ctx.lineWidth = 2.2;
                  ctx.beginPath();
                  ctx.moveTo(cx, cy);
                  ctx.lineTo(pt.x, pt.y);
                  ctx.stroke();
                  ctx.restore();
                });

                const t = (time * 0.32) % 1.5;
                const p = Math.min(1, t);
                const inbound = p < 0.5;
                const u = inbound ? p / 0.5 : (p - 0.5) / 0.5;

                const drawLeg = (from: { x: number; y: number }, to: { x: number; y: number }, colour: string) => {
                  const x = from.x + (to.x - from.x) * u;
                  const y = from.y + (to.y - from.y) * u;
                  ctx.save();
                  ctx.strokeStyle = colour;
                  ctx.lineWidth = 2.6;
                  ctx.beginPath();
                  ctx.moveTo(from.x, from.y);
                  ctx.lineTo(x, y);
                  ctx.stroke();
                  ctx.fillStyle = colour;
                  if (palette.isDark) {
                    ctx.shadowColor = colour;
                    ctx.shadowBlur = 12;
                  }
                  ctx.beginPath();
                  ctx.arc(x, y, 5, 0, TAU);
                  ctx.fill();
                  ctx.restore();
                };

                if (inbound) {
                  drawLeg(pts[0], { x: cx, y: cy }, palette.series[0]);
                } else if (device === "hub") {
                  // Flooded out of every port except the one it arrived on.
                  for (let i = 1; i < n; i++) {
                    drawLeg({ x: cx, y: cy }, pts[i], i === target ? palette.series[2] : palette.inkFaint);
                  }
                } else {
                  drawLeg({ x: cx, y: cy }, pts[target], palette.series[2]);
                }

                drawBox(
                  plot,
                  palette,
                  cx,
                  cy,
                  70,
                  32,
                  device.toUpperCase(),
                  device === "hub" ? palette.series[4] : palette.series[1],
                );

                pts.forEach((pt, i) => {
                  const state: NodeState =
                    i === 0
                      ? "sending"
                      : i === target
                        ? !inbound && u > 0.9
                          ? "receiving"
                          : "idle"
                        : device === "hub" && !inbound && u > 0.9
                          ? "ignoring"
                          : "idle";
                  drawNode(plot, palette, pt.x, pt.y, `PC${i + 1}`, state, 18);
                });

                plot.text(
                  cx,
                  h - 14,
                  device === "hub"
                    ? "all four other devices receive it; three throw it away"
                    : "only the addressed device receives it",
                  palette.inkFaint,
                  { size: 10, align: "center" },
                );
              }}
            />
          </Scope>

          <div className="grid content-start gap-4 lg:border-l lg:border-line lg:pl-4">
            <div>
              <p className="mb-2 text-xs font-medium text-ink-2">PC1 is sending to</p>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <Button key={i} size="sm" variant={target === i ? "primary" : "secondary"} onClick={() => setTarget(i)}>
                    PC{i + 1}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <Readout
                label="Devices that receive the frame"
                value={device === "hub" ? 4 : 1}
                tone={device === "hub" ? "warn" : "ok"}
              />
              <Readout
                label="Wasted copies"
                value={device === "hub" ? 3 : 0}
                tone={device === "hub" ? "bad" : "ok"}
              />
            </div>

            <div
              className={clsx(
                "rounded-lg px-3 py-2.5 text-2xs",
                device === "hub" ? "bg-warn-wash text-ink" : "bg-ok-wash text-ink",
              )}
            >
              {device === "hub"
                ? "Bandwidth is shared by everyone, and any device could read traffic meant for another. A hub is effectively a bus with tidier cabling."
                : "Each link is separate, so several pairs can talk at the same time and no device sees traffic that is not addressed to it."}
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Side by side" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="w-[32%] px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">&nbsp;</th>
                <th className="px-4 py-2.5 text-xs font-semibold" style={{ color: "var(--s5-ink)" }}>
                  Hub
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold" style={{ color: "var(--s2-ink)" }}>
                  Switch
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, hub, sw]) => (
                <tr key={k} className="border-b border-line last:border-0">
                  <th scope="row" className="px-4 py-3 align-top text-xs font-medium text-ink-3">
                    {k}
                  </th>
                  <td className="px-4 py-3 align-top text-ink-2">{hub}</td>
                  <td className="px-4 py-3 align-top text-ink-2">{sw}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Callout kind="exam" title="The one-sentence answer">
        A hub receives data on one port and <strong>forwards it to all</strong> its other ports. A switch receives
        data on one port and <strong>forwards it only to the port connected to the destination device</strong>.
        That is why a switch is described as the more intelligent device.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * Quiz
 * ================================================================== */

const QUESTIONS: Question[] = [
  {
    id: "t1",
    prompt: "How many cables are needed to connect 8 devices in a full all-to-all (mesh) topology?",
    options: [
      { label: "8" },
      { label: "16" },
      { label: "28", correct: true },
      { label: "64" },
    ],
    explain:
      "Use n(n − 1)/2 = (8 × 7)/2 = 28. Each of the eight devices would also need seven separate network ports, which is why full mesh is impractical for anything but a handful of critical links.",
  },
  {
    id: "t2",
    prompt: "What is the main problem with a bus topology?",
    options: [
      { label: "It uses more cable than any other topology" },
      { label: "Only one device can transmit at a time, so access to the shared medium must be controlled", correct: true },
      { label: "It cannot connect more than four devices" },
      { label: "It requires a hub at the centre" },
    ],
    explain:
      "Every device taps the same backbone cable, so two simultaneous transmissions collide and destroy each other. Controlling who may use the medium — the media access problem — is the cost of the bus's simplicity.",
  },
  {
    id: "t3",
    prompt: "In a ring topology, how does a message get from one device to a non-adjacent device?",
    options: [
      { label: "It is broadcast to every device at once" },
      { label: "It passes through each device in between, around the loop", correct: true },
      { label: "It travels through a central hub" },
      { label: "It takes a direct cable between the two devices" },
    ],
    explain:
      "Each station connects only to its two neighbours, so a frame is passed from station to station around the ring until it reaches its destination. That also means one broken link can stop the whole ring.",
  },
  {
    id: "t4",
    prompt: "A hub receives a frame on port 1 of 8. What does it do?",
    options: [
      { label: "Sends it out of port 2 only" },
      { label: "Sends it out of all the other ports", correct: true },
      { label: "Looks up the destination address and forwards it accordingly" },
      { label: "Discards it unless the destination is known" },
    ],
    explain:
      "A hub is a simple repeater with no knowledge of addresses, so it copies the incoming frame to every other port. Every device receives it, and all but the intended recipient throw it away.",
  },
  {
    id: "t5",
    prompt: "What makes a switch more intelligent than a hub?",
    options: [
      { label: "It transmits at a higher voltage" },
      { label: "It has more ports" },
      { label: "It learns which device is on which port and forwards each frame only to its destination", correct: true },
      { label: "It converts digital signals to analog" },
    ],
    explain:
      "A switch builds a table of which device is reachable through which port, then forwards each frame out of that one port. This removes the wasted copies, allows several conversations at once, and keeps traffic private.",
  },
  {
    id: "t6",
    prompt: "Which topology gives each device its own dedicated cable to a central device?",
    options: [
      { label: "Bus" },
      { label: "Ring" },
      { label: "Star", correct: true },
      { label: "Mesh" },
    ],
    explain:
      "In a star, every device has one cable running back to a central hub or switch. A single damaged cable therefore isolates only that device — but the central device is a single point of failure for the whole network.",
  },
];
