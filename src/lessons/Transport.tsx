import { useEffect, useMemo, useRef, useState } from "react";
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
  Scope,
  Slider,
  Toggle,
} from "../components/ui";
import { PORT_RANGES, TRANSPORTS, WELL_KNOWN_PORTS, type Transport } from "../lib/network";

export function TransportLesson() {
  return (
    <>
      <WhySection />
      <PortSection />
      <CompareSection />
      <RaceSection />
      <Section id="check" title="Check yourself">
        <Quiz lessonId="transport" questions={QUESTIONS} />
      </Section>
    </>
  );
}

/* ================================================================== *
 * 1. Why an IP address is not enough
 * ================================================================== */

function WhySection() {
  return (
    <Section
      id="why"
      title="An IP address gets you to the machine, not to the program"
      lead="A laptop with one IP address might be loading a web page, fetching mail and running a video call all at once. When a packet arrives carrying that address, the machine still has to decide which of those programs it belongs to. Communication is really process to process, not host to host."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Panel title="What IP alone can tell you" bodyClassName="p-4">
          <div className="rounded-lg border border-line bg-surface-2 px-3.5 py-3">
            <p className="text-2xs font-medium text-ink-3">Packet arrives</p>
            <p className="tnum mt-0.5 font-mono text-sm text-ink">to: 192.168.1.42</p>
          </div>
          <p className="mt-3 max-w-[58ch] text-sm text-ink-2">
            The network layer has done its job: the packet is at the right machine. But three programs on that
            machine are all waiting for data, and nothing in the packet says which of them should get it. The
            operating system has no way to choose.
          </p>
          <p className="mt-2 text-sm font-medium text-bad">Delivery fails at the last step.</p>
        </Panel>

        <Panel title="What a port number adds" bodyClassName="p-4">
          <div className="rounded-lg border border-brand-edge bg-brand-wash px-3.5 py-3">
            <p className="text-2xs font-medium text-brand">Packet arrives</p>
            <p className="tnum mt-0.5 font-mono text-sm text-ink">to: 192.168.1.42 : 443</p>
          </div>
          <p className="mt-3 max-w-[58ch] text-sm text-ink-2">
            A port is a numbered doorway into the machine. Each running process is attached to one, so the pair
            of address and port identifies exactly one endpoint anywhere on the Internet. Port 443 means the
            browser's secure connection, and the operating system hands it straight there.
          </p>
          <p className="mt-2 text-sm font-medium text-ok">The data reaches the right process.</p>
        </Panel>
      </div>

      <Callout kind="exam" title="The vocabulary">
        Splitting one arriving stream of packets out to several processes by port number is called{" "}
        <strong>multiplexing</strong>, or more precisely, sorting them on the way in is{" "}
        <em>demultiplexing</em>, and combining several processes' traffic onto one outgoing connection is{" "}
        <em>multiplexing</em>. The syllabus uses the single term for both directions.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * 2. Ports and multiplexing
 * ================================================================== */

const APPS = [
  { name: "Browser", port: 443, service: "HTTPS", series: 1 },
  { name: "Mail client", port: 25, service: "SMTP", series: 3 },
  { name: "Name lookup", port: 53, service: "DNS", series: 2 },
  { name: "SSH session", port: 22, service: "SSH", series: 0 },
];

function PortSection() {
  const [target, setTarget] = useState(0);

  return (
    <Section
      id="ports"
      title="One address, many doorways"
      lead="Ports are just numbers, sixteen bits wide, so there are 65 536 of them per machine. The low ones are reserved for well-known services so that a client knows where to knock without being told; the high ones are handed out to clients as temporary numbers for the duration of a conversation."
    >
      <Panel
        title="Demultiplexing at the receiver"
        subtitle="Every packet carries the same destination IP. The port number is what separates them."
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_230px]">
          <Scope height={252}>
            <ScopeCanvas
              label={`Packets arriving at one IP address are sorted by port number to four different programs; the ${APPS[target].name} on port ${APPS[target].port} is receiving`}
              animate
              deps={[target]}
              bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
              insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
              draw={({ plot, ctx, palette, time, w, h }) => {
                const inX = 40;
                const stackX = w * 0.42;
                const appX = w - 92;
                const rowY = (i: number) => 40 + ((h - 80) * (i + 0.5)) / APPS.length;
                const midY = h / 2;

                // Incoming wire into the transport layer.
                ctx.save();
                ctx.strokeStyle = palette.gridMajor;
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(inX, midY);
                ctx.lineTo(stackX - 26, midY);
                ctx.stroke();
                ctx.restore();

                // Fan-out from the transport layer to each port.
                APPS.forEach((_, i) => {
                  ctx.save();
                  ctx.strokeStyle = palette.gridMajor;
                  ctx.lineWidth = i === target ? 2.2 : 1.6;
                  ctx.globalAlpha = i === target ? 1 : 0.5;
                  ctx.beginPath();
                  ctx.moveTo(stackX + 26, midY);
                  ctx.lineTo(appX - 42, rowY(i));
                  ctx.stroke();
                  ctx.restore();
                });

                // One packet: in along the wire, then out to its port.
                const cycle = (time * 0.4) % 1.6;
                const p = Math.min(1, cycle);
                const colour = palette.series[APPS[target].series];
                let px: number;
                let py: number;
                if (p < 0.5) {
                  const u = p / 0.5;
                  px = inX + (stackX - 26 - inX) * u;
                  py = midY;
                } else {
                  const u = (p - 0.5) / 0.5;
                  px = stackX + 26 + (appX - 42 - (stackX + 26)) * u;
                  py = midY + (rowY(target) - midY) * u;
                }

                ctx.save();
                ctx.fillStyle = colour;
                if (palette.isDark) {
                  ctx.shadowColor = colour;
                  ctx.shadowBlur = 12;
                }
                ctx.beginPath();
                ctx.roundRect(px - 26, py - 9, 52, 18, 4);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = palette.bg;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(`:${APPS[target].port}`, px, py + 0.5);
                ctx.restore();

                // The transport layer itself.
                ctx.save();
                ctx.fillStyle = palette.bg;
                ctx.strokeStyle = palette.series[1];
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(stackX - 26, midY - 34, 52, 68, 7);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                plot.text(stackX, midY - 4, "sort", palette.series[1], {
                  size: 9,
                  weight: 700,
                  align: "center",
                  baseline: "middle",
                });
                plot.text(stackX, midY + 9, "by port", palette.series[1], {
                  size: 9,
                  weight: 700,
                  align: "center",
                  baseline: "middle",
                });

                // The processes.
                APPS.forEach((app, i) => {
                  const active = i === target;
                  const c = active ? palette.series[app.series] : palette.axis;
                  const y = rowY(i);
                  ctx.save();
                  if (active && palette.isDark) {
                    ctx.shadowColor = c;
                    ctx.shadowBlur = 12;
                  }
                  ctx.fillStyle = palette.bg;
                  ctx.strokeStyle = c;
                  ctx.lineWidth = active ? 2.2 : 1.5;
                  ctx.beginPath();
                  ctx.roundRect(appX - 42, y - 17, 100, 34, 7);
                  ctx.fill();
                  ctx.stroke();
                  ctx.shadowBlur = 0;
                  ctx.font = '600 9px "JetBrains Mono Variable", ui-monospace, monospace';
                  ctx.fillStyle = active ? c : palette.ink;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(app.name, appX + 8, y - 5);
                  ctx.font = '700 10px "JetBrains Mono Variable", ui-monospace, monospace';
                  ctx.fillText(`:${app.port}`, appX + 8, y + 8);
                  ctx.restore();
                });

                plot.text(inX - 8, midY - 22, "192.168.1.42", palette.inkFaint, { size: 9 });
                plot.text(w / 2, h - 14, "same IP address, four different endpoints", palette.inkFaint, {
                  size: 10,
                  align: "center",
                });
              }}
            />
          </Scope>

          <div className="grid content-start gap-4 lg:border-l lg:border-line lg:pl-4">
            <div>
              <p className="mb-2 text-xs font-medium text-ink-2">Send a packet to</p>
              <div className="grid gap-1">
                {APPS.map((app, i) => (
                  <button
                    key={app.name}
                    type="button"
                    onClick={() => setTarget(i)}
                    className={clsx(
                      "flex items-baseline justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                      target === i ? "border-brand-edge bg-brand-wash" : "border-line bg-surface hover:bg-surface-2",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium text-ink">{app.name}</span>
                      <span className="block text-2xs text-ink-3">{app.service}</span>
                    </span>
                    <span
                      className="tnum shrink-0 font-mono text-sm font-semibold"
                      style={{ color: `var(--s${app.series + 1}-ink)` }}
                    >
                      {app.port}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <Readout label="Ports per machine" value="65 536" sub="16 bits, 0 to 65535" tone="brand" />
          </div>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-2 text-xs font-medium text-ink-2">The 65 536 numbers are split into three ranges</p>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
            {PORT_RANGES.map((r) => (
              <div
                key={r.name}
                className="rounded-lg border px-3 py-2.5"
                style={{
                  borderColor: `color-mix(in oklab, var(--s${r.series + 1}) 35%, transparent)`,
                  background: `color-mix(in oklab, var(--s${r.series + 1}) 6%, transparent)`,
                }}
              >
                <p className="text-sm font-semibold" style={{ color: `var(--s${r.series + 1}-ink)` }}>
                  {r.name}
                </p>
                <p className="tnum mt-0.5 font-mono text-sm font-semibold text-ink">
                  {r.from.toLocaleString("en-GB")} – {r.to.toLocaleString("en-GB")}
                </p>
                <p className="mt-1 max-w-[34ch] text-2xs text-ink-2">{r.who}</p>
                <p className="mt-1 text-2xs text-ink-3">{r.example}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 max-w-[74ch] text-sm text-ink-2">
            This is why a conversation has two different kinds of port number at its two ends. Your browser is
            given a temporary number from the dynamic range and connects <em>to</em> the server's well-known 80 or
            443, so the server knows where to listen, and your machine knows which of its own windows the reply
            belongs to.
          </p>
        </div>
      </Panel>

      <Panel
        title="Ports worth knowing"
        bodyClassName="p-0"
        actions={<Extra>HTTPS, SMTP and POP3</Extra>}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">Port</th>
                <th className="px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">Service</th>
                <th className="px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">Transport</th>
              </tr>
            </thead>
            <tbody>
              {WELL_KNOWN_PORTS.map((p) => (
                <tr key={p.port} className="border-b border-line last:border-0">
                  <td className="tnum px-4 py-2 font-mono text-sm font-semibold text-ink">{p.port}</td>
                  <td className="px-4 py-2 text-ink-2">{p.name}</td>
                  <td className="px-4 py-2">
                    <Badge tone={p.transport === "TCP" ? "brand" : "neutral"}>{p.transport}</Badge>
                  </td>
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
 * 3. TCP vs UDP
 * ================================================================== */

function CompareSection() {
  return (
    <Section
      id="compare"
      title="Two transport protocols, opposite priorities"
      lead="Both TCP and UDP sit directly on top of IP and both use port numbers. Everything else about them differs, because they answer different questions: TCP asks how to make an unreliable network look reliable, and UDP asks how little it can get away with doing."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        {(["tcp", "udp"] as Transport[]).map((k) => {
          const t = TRANSPORTS[k];
          return (
            <Panel
              key={k}
              title={
                <span className="flex items-baseline gap-2">
                  {t.name}
                  <span className="text-2xs font-normal text-ink-3">{t.long}</span>
                </span>
              }
              subtitle={t.blurb}
            >
              <ul className="grid gap-1.5">
                {t.traits.map((tr) => (
                  <li key={tr.label} className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className={clsx(
                        "grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold",
                        tr.has ? "bg-ok-wash text-ok" : "bg-surface-2 text-ink-3",
                      )}
                    >
                      {tr.has ? "✓" : "✕"}
                    </span>
                    <span className={clsx("text-sm", tr.has ? "text-ink" : "text-ink-3")}>{tr.label}</span>
                    <span className="sr-only">{tr.has ? "yes" : "no"}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-line pt-3">
                <p className="text-2xs font-semibold text-ink-3">Used by</p>
                <ul className="mt-1.5 grid gap-1">
                  {t.apps.map((a) => (
                    <li key={a} className="flex gap-2 text-sm text-ink-2">
                      <span
                        className="mt-[9px] h-1 w-1 shrink-0 rounded-full"
                        style={{ background: k === "tcp" ? "var(--s2)" : "var(--s4)" }}
                      />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          );
        })}
      </div>

      <Callout kind="exam" title="How to choose between them">
        Ask what a lost packet costs. In a file or a web page a missing byte corrupts the whole thing, so the
        retransmission TCP provides is worth the delay. In a live voice call a packet that arrives late is
        useless anyway, and you would rather have a moment of crackle than a growing delay, so UDP wins. The rule of
        thumb: <strong>TCP when correctness matters, UDP when timeliness matters.</strong>
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * 4. Delivery race: TCP and UDP under the same loss
 * ================================================================== */

type Seg = {
  id: number;
  /** 0–1 progress along the wire, or null once delivered. */
  sentAt: number;
  lost: boolean;
  attempt: number;
};

const TOTAL = 8;

function RaceSection() {
  const [loss, setLoss] = useState(0.25);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const startRef = useRef(performance.now());

  // Drive both simulations from one clock so the comparison is fair.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = () => {
      setTick((performance.now() - startRef.current) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const reset = () => {
    startRef.current = performance.now();
    setTick(0);
  };

  /** Deterministic loss, so the same segment number always suffers the same fate. */
  const isLost = (id: number, attempt: number) => {
    const x = Math.sin((id * 127.1 + attempt * 311.7) * 43758.5453);
    return x - Math.floor(x) < loss;
  };

  const sim = useMemo(() => {
    // Tuned so that even at the maximum loss the TCP run finishes within a few
    // seconds. The point is that it is slower, not that it is unwatchable.
    const flight = 0.75; // seconds for one crossing
    const gap = 0.26; // spacing between sends

    // UDP: send once, never look back.
    const udp: Seg[] = Array.from({ length: TOTAL }, (_, i) => ({
      id: i,
      sentAt: i * gap,
      lost: isLost(i, 0),
      attempt: 0,
    }));
    const udpArrived = udp.filter((s) => !s.lost && tick >= s.sentAt + flight);

    // TCP: the sender waits for an acknowledgement and retries what is lost.
    const tcp: Seg[] = [];
    let t = 0;
    for (let i = 0; i < TOTAL; i++) {
      let attempt = 0;
      // Each lost attempt costs a timeout before the retry goes out. That delay
      // is the whole cost of reliability, so it has to be visible, but capped,
      // or a bad run would never finish on screen.
      while (isLost(i, attempt) && attempt < 3) {
        tcp.push({ id: i, sentAt: t, lost: true, attempt });
        t += flight * 1.05; // timeout, then retransmit
        attempt++;
      }
      tcp.push({ id: i, sentAt: t, lost: false, attempt });
      t += gap;
    }
    const tcpArrived = tcp.filter((s) => !s.lost && tick >= s.sentAt + flight);

    return { udp, tcp, flight, udpArrived, tcpArrived };
  }, [loss, tick]);

  const udpDelivered = sim.udpArrived.length;
  const tcpDelivered = sim.tcpArrived.length;
  const udpLostCount = sim.udp.filter((s) => s.lost && tick >= s.sentAt + sim.flight * 0.6).length;

  return (
    <Section
      id="race"
      title="The same lossy network, two different outcomes"
      lead="Turn the loss up and watch what each protocol does about it. UDP sends each datagram once and moves on, so what is lost stays lost. TCP waits for an acknowledgement, notices what never arrived, and sends it again, so everything gets through eventually. That word is the whole trade-off."
    >
      <Panel
        title="Delivery race"
        subtitle="Eight pieces of data, sent left to right. Faded segments were dropped by the network."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setRunning((r) => !r)}>
              {running ? "Pause" : "Play"}
            </Button>
            <Button size="sm" variant="primary" onClick={reset}>
              Restart
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          {(["udp", "tcp"] as const).map((kind) => {
            const segs = kind === "udp" ? sim.udp : sim.tcp;
            const arrived = kind === "udp" ? udpDelivered : tcpDelivered;
            return (
              <div key={kind}>
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: `var(--s${kind === "udp" ? 4 : 2}-ink)` }}>
                    {TRANSPORTS[kind].name}
                  </p>
                  <p className="text-2xs text-ink-3">
                    {arrived} of {TOTAL} delivered
                    {kind === "tcp" && segs.length > TOTAL && ` · ${segs.length - TOTAL} retransmission${segs.length - TOTAL === 1 ? "" : "s"}`}
                  </p>
                </div>
                <Scope height={104}>
                  <ScopeCanvas
                    label={`${TRANSPORTS[kind].name}: ${arrived} of ${TOTAL} pieces delivered so far`}
                    animate={running}
                    deps={[loss, kind, tick > 0]}
                    bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                    insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    draw={({ ctx, palette, w, h }) => {
                      const y = h / 2;
                      const x0 = 54;
                      const x1 = w - 54;

                      ctx.save();
                      ctx.strokeStyle = palette.gridMajor;
                      ctx.lineWidth = 2.4;
                      ctx.beginPath();
                      ctx.moveTo(x0, y);
                      ctx.lineTo(x1, y);
                      ctx.stroke();
                      ctx.restore();

                      for (const s of segs) {
                        const age = tick - s.sentAt;
                        if (age < 0) continue;
                        const u = age / sim.flight;
                        if (u > 1) continue;
                        // Lost segments vanish part way across.
                        const cut = s.lost ? 0.55 : 1;
                        if (u > cut) continue;
                        const px = x0 + (x1 - x0) * u;
                        const c = s.lost ? palette.series[4] : palette.series[kind === "udp" ? 3 : 1];

                        ctx.save();
                        ctx.globalAlpha = s.lost ? Math.max(0.15, 1 - u / cut) : 1;
                        ctx.fillStyle = c;
                        if (palette.isDark && !s.lost) {
                          ctx.shadowColor = c;
                          ctx.shadowBlur = 10;
                        }
                        ctx.beginPath();
                        ctx.roundRect(px - 11, y - 8, 22, 16, 4);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                        ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                        ctx.fillStyle = palette.bg;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(String(s.id + 1), px, y + 0.5);
                        ctx.restore();
                      }

                      const box = (x: number, label: string) => {
                        ctx.save();
                        ctx.fillStyle = palette.bg;
                        ctx.strokeStyle = palette.axis;
                        ctx.lineWidth = 1.6;
                        ctx.beginPath();
                        ctx.roundRect(x - 24, y - 18, 48, 36, 6);
                        ctx.fill();
                        ctx.stroke();
                        ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                        ctx.fillStyle = palette.ink;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(label, x, y + 0.5);
                        ctx.restore();
                      };
                      box(26, "send");
                      box(w - 26, "recv");

                      // What has landed so far.
                      const done = segs.filter((s) => !s.lost && tick >= s.sentAt + sim.flight);
                      done.forEach((_, i) => {
                        const px = x1 - 8 - i * 7;
                        if (px < x0) return;
                        ctx.save();
                        ctx.fillStyle = palette.series[2];
                        ctx.globalAlpha = 0.9;
                        ctx.beginPath();
                        ctx.roundRect(px - 3, y + 22, 6, 10, 2);
                        ctx.fill();
                        ctx.restore();
                      });
                    }}
                  />
                </Scope>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Slider
              label="Packet loss on the network"
              value={loss}
              onChange={(v) => {
                setLoss(v);
                reset();
              }}
              min={0}
              max={0.5}
              step={0.05}
              readout={`${Math.round(loss * 100)}%`}
              accent="var(--s5)"
              hint="The same loss is applied to both protocols, so the comparison is fair."
            />
            <Legend
              className="mt-3"
              items={[
                { color: "var(--s4)", label: "UDP datagram" },
                { color: "var(--s2)", label: "TCP segment" },
                { color: "var(--s5)", label: "Lost in the network" },
                { color: "var(--s3)", label: "Arrived" },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-6 lg:border-l lg:border-line lg:pl-4">
            <Readout
              label="UDP delivered"
              value={`${udpDelivered} / ${TOTAL}`}
              tone={udpDelivered === TOTAL ? "ok" : "bad"}
              sub={udpLostCount ? `${udpLostCount} lost for good` : "nothing lost yet"}
            />
            <Readout
              label="TCP delivered"
              value={`${tcpDelivered} / ${TOTAL}`}
              tone="ok"
              sub={sim.tcp.length > TOTAL ? `${sim.tcp.length - TOTAL} resent` : "no retries needed"}
            />
          </div>
        </div>

        <p className="mt-3 max-w-[74ch] rounded-lg bg-surface-2 px-3.5 py-2.5 text-sm text-ink-2">
          {loss === 0
            ? "With a perfect network the two behave identically, and UDP gets there with less work, because it never had to wait for an acknowledgement it did not need."
            : `At ${Math.round(loss * 100)} % loss, UDP simply ends up with holes in the data: whatever the network dropped is gone, and the application never finds out. TCP loses nothing, but every retransmission costs a timeout, so the same eight pieces take noticeably longer to arrive. Neither is better; they are different bargains.`}
        </p>
      </Panel>

      <Toggle
        checked={running}
        onChange={setRunning}
        label="Keep the simulation running"
        hint="Pause it to read a single moment closely."
      />
    </Section>
  );
}

/* ================================================================== *
 * Quiz
 * ================================================================== */

const QUESTIONS: Question[] = [
  {
    id: "t1",
    prompt: "Why is an IP address on its own not enough to deliver data to the right place?",
    options: [
      { label: "IP addresses are not unique" },
      { label: "A machine runs many programs at once, and the address does not say which one the data is for", correct: true },
      { label: "IP addresses change too often" },
      { label: "The IP address does not include the sender" },
    ],
    explain:
      "An IP address identifies a host. Communication is really between processes, and one host may be running a browser, a mail client and a name lookup at the same time. The port number is what identifies the endpoint within the machine.",
  },
  {
    id: "t2",
    prompt: "What is the combination of an IP address and a port number used for?",
    options: [
      { label: "To identify a unique process endpoint on the network", correct: true },
      { label: "To encrypt the data being sent" },
      { label: "To find the shortest route to the destination" },
      { label: "To identify the network interface card" },
    ],
    explain:
      "The address gets the data to the machine and the port gets it to the process. Together they identify one endpoint anywhere on the Internet, which is what makes multiplexing several conversations over one connection possible.",
  },
  {
    id: "t3",
    prompt: "Which of these is a property of UDP but not of TCP?",
    options: [
      { label: "It guarantees that data arrives in order" },
      { label: "It retransmits anything that is lost" },
      { label: "It sends datagrams without setting up a connection first", correct: true },
      { label: "It uses port numbers" },
    ],
    explain:
      "UDP is connectionless: each datagram is sent on its own with no handshake, no acknowledgement and no retransmission. Both protocols use port numbers, because that is the transport layer's job regardless of which one you pick.",
  },
  {
    id: "t4",
    prompt: "A DNS lookup uses UDP rather than TCP. Why is that a sensible choice?",
    options: [
      { label: "DNS data is too large for TCP" },
      { label: "A lookup is a single small query and answer, so a connection setup would cost more than simply asking again", correct: true },
      { label: "TCP cannot carry DNS messages" },
      { label: "UDP encrypts the query" },
    ],
    explain:
      "A DNS query and its reply each fit in one small datagram. Setting up a TCP connection would take more round trips than the lookup itself, and if the answer does not come back the resolver can just ask again, so the reliability TCP offers is not worth its cost here.",
  },
  {
    id: "t5",
    prompt: "Which application would you expect to use TCP?",
    options: [
      { label: "A live video call" },
      { label: "Downloading a file over FTP", correct: true },
      { label: "DHCP address assignment" },
      { label: "SNMP network monitoring" },
    ],
    explain:
      "A file must arrive complete and in order, because a single missing byte corrupts it, so the acknowledgements and retransmissions of TCP are essential. Live video, DHCP and SNMP all favour UDP, because for them a late packet is worth less than a fast one.",
  },
  {
    id: "t6",
    prompt: "What does TCP do that makes it 'reliable' when the IP layer beneath it is not?",
    options: [
      { label: "It stops routers from dropping packets" },
      { label: "It sends every packet twice" },
      { label: "It acknowledges what arrives and retransmits anything that does not", correct: true },
      { label: "It chooses a route that never fails" },
    ],
    explain:
      "TCP cannot change what IP does: routers still drop packets. What it adds is bookkeeping: the receiver acknowledges the segments it got, and the sender retransmits anything left unacknowledged, then puts everything back into the original order before handing it to the application.",
  },
];
