import { useState } from "react";
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
  Reveal,
  Scope,
  Segmented,
  Toggle,
} from "../components/ui";
import {
  ACCESS_LINKS,
  ADSL_BANDS,
  HOME_HOSTS,
  HOME_PUBLIC_IP,
  ISP_SERVICES,
  PRIVATE_RANGES,
  PROXY_JOBS,
  PROXY_PAGES,
  formatDuration,
  formatRate,
  natInbound,
  natOutbound,
  nextPublicPort,
  transferTime,
  type AccessLink,
  type NatEntry,
} from "../lib/network";

export function IspLesson() {
  return (
    <>
      <IspSection />
      <AccessSection />
      <HomeSection />
      <NatSection />
      <ProxySection />
      <Section id="check" title="Check yourself">
        <Quiz lessonId="isp" questions={QUESTIONS} />
      </Section>
    </>
  );
}

/* ================================================================== *
 * 1. The ISP
 * ================================================================== */

function IspSection() {
  return (
    <Section
      id="isp"
      title="You cannot join the Internet; you join somebody who is already on it"
      lead="There is no central Internet to plug into. It is thousands of separate networks that have agreed to carry each other's traffic, and an Internet Service Provider is simply one of those networks that will sell you a connection to itself. Everything reachable from them becomes reachable from you."
    >
      <Panel title="Your house, and everything above it" subtitle="Traffic climbs until it finds a network that knows the way down to the destination.">
        <Scope height={216}>
          <ScopeCanvas
            label="A home network connected to a local ISP, which connects to a regional provider and then to the Internet backbone, with a packet travelling up and across to a distant web server"
            animate
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, time, w, h }) => {
              const narrow = w < 520;
              const boxW = narrow ? 78 : 104;
              const leftX = w * 0.27;
              const rightX = w * 0.73;
              const yOf = (f: number) => 24 + f * (h - 76);

              // Two provider chains that meet at the top: the shape of the Internet.
              const path = [
                { x: leftX, y: yOf(1), label: "Your home", sub: HOME_PUBLIC_IP, series: 3 },
                { x: leftX, y: yOf(0.72), label: "Your ISP", sub: "tier 3", series: 0 },
                { x: leftX, y: yOf(0.44), label: "Regional", sub: "tier 2", series: 1 },
                { x: w / 2, y: yOf(0.16), label: "Backbone", sub: "tier 1", series: 2 },
                { x: rightX, y: yOf(0.44), label: "Regional", sub: "tier 2", series: 1 },
                { x: rightX, y: yOf(0.72), label: "Their ISP", sub: "tier 3", series: 0 },
                { x: rightX, y: yOf(1), label: "Web server", sub: "far away", series: 4 },
              ];

              ctx.save();
              ctx.strokeStyle = palette.gridMajor;
              ctx.lineWidth = 2;
              ctx.beginPath();
              for (let i = 0; i < path.length - 1; i++) {
                ctx.moveTo(path[i].x, path[i].y);
                ctx.lineTo(path[i + 1].x, path[i + 1].y);
              }
              ctx.stroke();
              ctx.restore();

              // The packet, walking the whole chain and back.
              const total = path.length - 1;
              const u = (time * 0.14) % 1;
              const t = u < 0.5 ? u / 0.5 : 1 - (u - 0.5) / 0.5;
              const seg = Math.min(total - 1, Math.floor(t * total));
              const local = t * total - seg;
              const px = path[seg].x + (path[seg + 1].x - path[seg].x) * local;
              const py = path[seg].y + (path[seg + 1].y - path[seg].y) * local;

              ctx.save();
              const colour = palette.series[u < 0.5 ? 0 : 2];
              if (palette.isDark) {
                ctx.shadowColor = colour;
                ctx.shadowBlur = 12;
              }
              ctx.fillStyle = colour;
              ctx.beginPath();
              ctx.arc(px, py, 5.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();

              path.forEach((n) => {
                ctx.save();
                ctx.fillStyle = palette.bg;
                ctx.strokeStyle = palette.series[n.series];
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.roundRect(n.x - boxW / 2, n.y - 17, boxW, 34, 6);
                ctx.fill();
                ctx.stroke();
                ctx.font = `700 ${narrow ? 8.5 : 9.5}px "JetBrains Mono Variable", ui-monospace, monospace`;
                ctx.fillStyle = palette.series[n.series];
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(n.label, n.x, n.y - 5);
                ctx.font = '500 8px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = palette.ink;
                ctx.fillText(n.sub, n.x, n.y + 8);
                ctx.restore();
              });

              plot.text(w / 2, h - 14, "no single owner, just networks that agree to carry each other's traffic", palette.inkFaint, {
                size: 9,
                align: "center",
              });
            }}
          />
        </Scope>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 sm:grid-cols-2">
          {ISP_SERVICES.map((s) => (
            <div key={s.name}>
              <p className="text-sm font-semibold text-ink">{s.name}</p>
              <p className="mt-0.5 max-w-[46ch] text-sm text-ink-2">{s.what}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Callout kind="exam" title="The role of an ISP, in one answer">
        An ISP is an organisation that provides access to the Internet. It owns a network that is already
        connected to other networks, gives each customer a connection and a public IP address, carries their
        traffic to and from the rest of the Internet, and usually supplies supporting services such as DNS
        resolution, email and web hosting.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * 2. Getting to the ISP
 * ================================================================== */

const FILES = [
  { label: "A web page", bytes: 400_000 },
  { label: "A photo", bytes: 2_000_000 },
  { label: "A song", bytes: 5_000_000 },
  { label: "A film", bytes: 700_000_000 },
];

function AccessSection() {
  const [linkId, setLinkId] = useState<AccessLink["id"]>("adsl");
  const [fileIndex, setFileIndex] = useState(1);
  const link = ACCESS_LINKS.find((l) => l.id === linkId) ?? ACCESS_LINKS[1];
  const file = FILES[fileIndex];

  return (
    <Section
      id="access"
      title="Down the same copper pair the telephone uses"
      lead="Almost every home already had a pair of copper wires running to the exchange, for the telephone. Both ways of reaching an ISP over that pair use it differently: a dial-up modem pretends to be a telephone call, while DSL discovers that the wire was always capable of far more than the 4 kHz a voice needs."
    >
      <Panel
        title="How the line is used"
        subtitle="The telephone system reserves only the bottom 4 kHz for speech. Everything above it was going to waste."
        actions={
          <Segmented
            label="Connection"
            value={linkId}
            onChange={setLinkId}
            options={ACCESS_LINKS.map((l) => ({ value: l.id, label: l.name, title: l.long }))}
          />
        }
      >
        <Scope height={188}>
          <ScopeCanvas
            label={
              linkId === "dialup"
                ? "A dial-up modem uses only the voice band from 300 Hz to 3.4 kHz, the same band a telephone call occupies"
                : "ADSL leaves the voice band alone and uses a narrow upstream band and a much wider downstream band above it"
            }
            deps={[linkId]}
            bounds={{ x0: 0, x1: 1.2e6, y0: 0, y1: 1 }}
            insets={{ left: 16, right: 16, top: 22, bottom: 40 }}
            draw={({ plot, ctx, palette }) => {
              const dial = linkId === "dialup";
              const bands = dial
                ? [{ name: "Voice / dial-up modem", from: 300, to: 3_400, what: "everything shares one narrow band", series: 4 }]
                : ADSL_BANDS;

              // A log-ish axis would hide how small the voice band is, and that
              // smallness is the entire point, so this stays linear.
              plot.axisFrame();
              [0, 200e3, 400e3, 600e3, 800e3, 1e6].forEach((f) => {
                plot.vLine(f, palette.grid, { alpha: 0.8 });
              });
              plot.xTicks(200e3, (v) => (v === 0 ? "0" : `${Math.round(v / 1000)} kHz`), { size: 9 });

              // One label row per band, so the 4 kHz voice band (three pixels
              // wide at this scale) is still readable next to a 1 MHz one.
              const rowH = 30;
              bands.forEach((b, i) => {
                const x0 = plot.sx(b.from);
                const x1 = Math.max(plot.sx(b.to), x0 + 2.5);
                const colour = palette.series[b.series];
                ctx.save();
                ctx.globalAlpha = 0.2;
                ctx.fillStyle = colour;
                ctx.fillRect(x0, plot.top, x1 - x0, plot.plotH);
                ctx.globalAlpha = 1;
                ctx.strokeStyle = colour;
                ctx.lineWidth = 1.6;
                ctx.strokeRect(x0, plot.top, x1 - x0, plot.plotH);
                ctx.restore();

                const mid = (x0 + x1) / 2;
                const labelY = plot.top + 12 + i * rowH;
                const width = b.to - b.from;
                const widthText = width >= 1000 ? `${Math.round(width / 1000)} kHz` : `${width} Hz`;

                // A leader from the band down to its own row of text.
                ctx.save();
                ctx.strokeStyle = colour;
                ctx.globalAlpha = 0.7;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(mid, labelY + 2);
                ctx.lineTo(mid, plot.bottom - 6);
                ctx.stroke();
                ctx.restore();

                plot.text(mid + 6, labelY, `${b.name} · ${widthText}`, colour, { size: 10, weight: 700 });
                plot.text(mid + 6, labelY + 12, b.what, palette.inkFaint, { size: 9 });
              });

              if (dial) {
                plot.text(
                  plot.sx(3_400) + 8,
                  plot.top + 12 + rowH,
                  "everything above 4 kHz goes to waste",
                  palette.inkFaint,
                  { size: 9 },
                );
              }
              plot.text(plot.left, plot.bottom + 24, "frequency on the copper pair", palette.inkFaint, { size: 9 });
            }}
          />
        </Scope>

        <div className="mt-4 border-t border-line pt-4">
          <p className="max-w-[74ch] text-sm text-ink-2">{link.how}</p>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
            <Readout label="Downstream" value={formatRate(link.down)} sub="ISP to you" />
            <Readout label="Upstream" value={formatRate(link.up)} sub="you to the ISP" />
            <Readout
              label="Telephone"
              value={link.alwaysOn ? "Always on" : "Dials each time"}
              tone={link.alwaysOn ? "ok" : "warn"}
              sub={link.voice}
            />
          </div>
        </div>
      </Panel>

      <Panel
        title="The same file, over each connection"
        subtitle="Transfer time is simply size ÷ rate, the arithmetic the paper asks for."
        actions={
          <Segmented
            label="File"
            size="sm"
            value={String(fileIndex)}
            onChange={(v) => setFileIndex(Number(v))}
            options={FILES.map((f, i) => ({ value: String(i), label: f.label }))}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">Connection</th>
                <th className="px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">Downstream rate</th>
                <th className="px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">
                  Time to download {file.label.toLowerCase()}
                </th>
                <th className="px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">Time to upload it</th>
              </tr>
            </thead>
            <tbody>
              {ACCESS_LINKS.map((l) => {
                const down = transferTime(file.bytes, l.down);
                const up = transferTime(file.bytes, l.up);
                return (
                  <tr
                    key={l.id}
                    className={clsx("border-b border-line last:border-0", l.id === linkId && "bg-brand-wash")}
                  >
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => setLinkId(l.id)}
                        className="text-left text-sm font-medium text-ink hover:text-brand"
                      >
                        {l.name}
                        <span className="block text-2xs font-normal text-ink-3">{l.long}</span>
                      </button>
                    </td>
                    <td className="tnum px-4 py-2.5 font-mono text-ink-2">{formatRate(l.down)}</td>
                    <td className="tnum px-4 py-2.5 font-mono font-semibold" style={{ color: `var(--s${l.series + 1}-ink)` }}>
                      {formatDuration(down)}
                    </td>
                    <td className="tnum px-4 py-2.5 font-mono text-ink-2">{formatDuration(up)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 md:grid-cols-2">
          <Reveal label="Show the working">
            <p className="max-w-[58ch]">
              {file.label} is {(file.bytes / 1_000_000).toFixed(file.bytes < 1_000_000 ? 1 : 0)} MB, which is{" "}
              {(file.bytes / 1_000_000).toFixed(file.bytes < 1_000_000 ? 1 : 0)} × 8 ={" "}
              {((file.bytes * 8) / 1_000_000).toFixed(1)} Mb. Remember the file is quoted in{" "}
              <strong>bytes</strong> and the line in <strong>bits</strong> per second. Over{" "}
              {link.name} at {formatRate(link.down)} that is {((file.bytes * 8) / 1_000_000).toFixed(1)} ÷{" "}
              {(link.down / 1_000_000).toFixed(link.down < 1_000_000 ? 3 : 0)} ={" "}
              {formatDuration(transferTime(file.bytes, link.down))}.
            </p>
          </Reveal>
          <div>
            <p className="text-sm font-semibold text-ink">Why ADSL is asymmetric</p>
            <p className="mt-1 max-w-[52ch] text-sm text-ink-2">
              A home connection spends its life receiving: pages, video, updates. What it sends is mostly
              requests, which are tiny. Giving the downstream direction the wider band matches how the line is
              actually used, and a narrower upstream band also interferes less with the neighbouring pairs in
              the same cable.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Panel title="What the modem is for">
          <p className="max-w-[52ch] text-sm text-ink-2">
            The local loop to the exchange was built to carry an analog voice signal, but a computer produces
            digital data. A <strong className="font-semibold text-ink">mod</strong>ulator turns that data into an
            analog signal the line will accept, and a <strong className="font-semibold text-ink">dem</strong>
            odulator at the far end turns it back; <em>modem</em> is the two words joined.
          </p>
          <p className="mt-2 max-w-[52ch] text-sm text-ink-2">
            A dial-up modem does this inside the voice band, so the exchange cannot tell the difference between
            your data and a conversation. That is exactly why the line is busy while you are online, and why the
            ceiling is 56 kbps: it is all the voice band can carry.
          </p>
        </Panel>

        <Callout kind="exam" title="Advantages of DSL / ADSL over dial-up">
          <ul className="mt-1 grid gap-1">
            {[
              "Far higher speed: megabits rather than kilobits",
              "Always on: no dialling, no connection delay, no per-minute charge",
              "The telephone still works, because voice and data use different frequencies",
              "Independent services: losing the data service does not take the telephone with it",
              "Each subscriber has their own line to the exchange, rather than a shared medium",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Callout>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 3. The home LAN
 * ================================================================== */

function HomeSection() {
  return (
    <Section
      id="home"
      title="One public address for the whole house"
      lead="Your ISP gives you a single public IP address. Nearly every home has more devices than that, and IPv4 addresses ran short long ago, so the router hands each device an address from a private range that is meaningless outside your house, and does the translating itself."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Panel title="Public address" subtitle="Unique across the whole Internet.">
          <div className="rounded-lg border border-brand-edge bg-brand-wash px-3.5 py-3 text-center">
            <p className="tnum font-mono text-2xl font-semibold text-ink">{HOME_PUBLIC_IP}</p>
            <p className="mt-1 text-2xs text-ink-2">given to your router by the ISP</p>
          </div>
          <ul className="mt-3 grid gap-1.5 text-sm text-ink-2">
            {[
              "Routable: any machine on the Internet can send to it",
              "Allocated from a block the ISP holds, and often changes over time",
              "There is exactly one, no matter how many devices you own",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                {t}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Private addresses" subtitle="Reused in millions of homes at once.">
          <div className="grid gap-1.5">
            {HOME_HOSTS.map((hst) => (
              <div
                key={hst.ip}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                style={{
                  borderColor: `color-mix(in oklab, var(--s${hst.series + 1}) 35%, transparent)`,
                  background: `color-mix(in oklab, var(--s${hst.series + 1}) 7%, transparent)`,
                }}
              >
                <span className="text-sm font-medium text-ink">{hst.name}</span>
                <span className="tnum font-mono text-sm font-semibold" style={{ color: `var(--s${hst.series + 1}-ink)` }}>
                  {hst.ip}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 max-w-[46ch] text-sm text-ink-2">
            Handed out by the router over DHCP. No router on the Internet will forward a packet addressed to one
            of these, which is why they can be used by everybody simultaneously.
          </p>
        </Panel>
      </div>

      <Panel title="The three private ranges" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                {["Block", "From", "To", "Addresses", "Usually"].map((th) => (
                  <th key={th} className="px-4 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRIVATE_RANGES.map((r) => (
                <tr key={r.cidr} className="border-b border-line last:border-0">
                  <td className="tnum px-4 py-2.5 font-mono text-sm font-semibold text-ink">{r.cidr}</td>
                  <td className="tnum px-4 py-2.5 font-mono text-ink-2">{r.from}</td>
                  <td className="tnum px-4 py-2.5 font-mono text-ink-2">{r.to}</td>
                  <td className="tnum px-4 py-2.5 font-mono text-ink-2">{r.count}</td>
                  <td className="px-4 py-2.5 text-ink-2">{r.note}</td>
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
 * 4. NAT
 * ================================================================== */

const REMOTE = { ip: "93.184.216.34", port: 80 };

function NatSection() {
  const [entries, setEntries] = useState<NatEntry[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showHeaders, setShowHeaders] = useState(true);

  const active = entries.find((e) => e.id === activeId) ?? null;

  const send = (hostIndex: number) => {
    const entry: NatEntry = {
      id: entries.length + 1,
      host: HOME_HOSTS[hostIndex],
      // Clients pick a fresh high port for every conversation.
      privatePort: 49152 + entries.length * 13 + hostIndex,
      publicPort: nextPublicPort(entries),
      remoteIp: REMOTE.ip,
      remotePort: REMOTE.port,
    };
    setEntries((prev) => [...prev, entry]);
    setActiveId(entry.id);
  };

  const out = active ? natOutbound(active) : null;
  const back = active ? natInbound(active) : null;

  return (
    <Section
      id="nat"
      title="Network Address Translation"
      lead="A packet leaving your house cannot carry 192.168.1.10 as its source, because no reply could ever find its way back. So the router rewrites the source address to its own public one on the way out, and rewrites it back on the way in. The table it keeps to remember which reply belongs to which device is the whole of NAT."
    >
      <Panel
        title="Translation lab"
        subtitle="Send a request from a device and watch the header being rewritten in both directions."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Toggle checked={showHeaders} onChange={setShowHeaders} label="Show headers" />
            <Button size="sm" onClick={() => { setEntries([]); setActiveId(null); }} disabled={!entries.length}>
              Clear table
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_216px]">
          <Scope height={244}>
            <ScopeCanvas
              label={
                active
                  ? `The ${active.host.name} sends from ${active.host.ip} port ${active.privatePort}; the router rewrites it to ${HOME_PUBLIC_IP} port ${active.publicPort}, and rewrites the reply back again`
                  : "A home network of three devices behind a router, waiting for a request to be sent"
              }
              animate={Boolean(active)}
              deps={[activeId, showHeaders]}
              bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
              insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
              draw={({ plot, ctx, palette, time, w, h }) => {
                const narrow = w < 480;
                const hostX = narrow ? 44 : 58;
                const routerX = w * 0.5;
                const serverX = w - (narrow ? 44 : 58);
                const rowY = (i: number) => 42 + i * 56;
                const midY = rowY(1);

                HOME_HOSTS.forEach((hst, i) => {
                  const on = active?.host.ip === hst.ip;
                  const colour = palette.series[hst.series];
                  ctx.save();
                  ctx.strokeStyle = on ? colour : palette.gridMajor;
                  ctx.lineWidth = on ? 2 : 1.4;
                  ctx.globalAlpha = on ? 1 : 0.55;
                  ctx.beginPath();
                  ctx.moveTo(hostX, rowY(i));
                  ctx.lineTo(routerX - 30, midY);
                  ctx.stroke();
                  ctx.restore();

                  ctx.save();
                  if (on && palette.isDark) {
                    ctx.shadowColor = colour;
                    ctx.shadowBlur = 12;
                  }
                  ctx.fillStyle = palette.bg;
                  ctx.strokeStyle = on ? colour : palette.axis;
                  ctx.lineWidth = on ? 2.2 : 1.4;
                  ctx.beginPath();
                  ctx.roundRect(hostX - (narrow ? 38 : 46), rowY(i) - 16, narrow ? 76 : 92, 32, 6);
                  ctx.fill();
                  ctx.stroke();
                  ctx.shadowBlur = 0;
                  ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                  ctx.fillStyle = on ? colour : palette.ink;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(hst.name, hostX, rowY(i) - 5);
                  ctx.font = '500 8px "JetBrains Mono Variable", ui-monospace, monospace';
                  ctx.fillStyle = palette.ink;
                  ctx.fillText(hst.ip, hostX, rowY(i) + 8);
                  ctx.restore();
                });

                // Router and the Internet side.
                ctx.save();
                ctx.strokeStyle = palette.gridMajor;
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(routerX + 30, midY);
                ctx.lineTo(serverX, midY);
                ctx.stroke();
                ctx.restore();

                [
                  { x: routerX, label: "Router", sub: "NAT", wBox: 60, colour: palette.brand },
                  { x: serverX, label: "Server", sub: REMOTE.ip, wBox: narrow ? 80 : 96, colour: palette.series[4] },
                ].forEach((n) => {
                  ctx.save();
                  ctx.fillStyle = palette.bg;
                  ctx.strokeStyle = n.colour;
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.roundRect(n.x - n.wBox / 2, midY - 20, n.wBox, 40, 7);
                  ctx.fill();
                  ctx.stroke();
                  ctx.font = '700 9.5px "JetBrains Mono Variable", ui-monospace, monospace';
                  ctx.fillStyle = n.colour;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(n.label, n.x, midY - 6);
                  ctx.font = '500 8px "JetBrains Mono Variable", ui-monospace, monospace';
                  ctx.fillStyle = palette.ink;
                  ctx.fillText(n.sub, n.x, midY + 8);
                  ctx.restore();
                });

                if (!active) {
                  plot.text(w / 2, h - 18, "choose a device to send a request", palette.inkFaint, {
                    size: 10,
                    align: "center",
                  });
                  return;
                }

                // Out to the server, then back again.
                const cycle = (time * 0.34) % 2;
                const outbound = cycle < 1;
                const t = outbound ? cycle : cycle - 1;
                const hostIdx = HOME_HOSTS.findIndex((hst) => hst.ip === active.host.ip);
                const hostPt = { x: hostX, y: rowY(hostIdx) };
                const routerIn = { x: routerX - 30, y: midY };
                const routerOut = { x: routerX + 30, y: midY };
                const serverPt = { x: serverX, y: midY };

                const lerp = (a: { x: number; y: number }, b: { x: number; y: number }, u: number) => ({
                  x: a.x + (b.x - a.x) * u,
                  y: a.y + (b.y - a.y) * u,
                });

                let pos: { x: number; y: number };
                let translated: boolean;
                if (outbound) {
                  translated = t > 0.5;
                  pos = t < 0.5 ? lerp(hostPt, routerIn, t / 0.5) : lerp(routerOut, serverPt, (t - 0.5) / 0.5);
                } else {
                  translated = t < 0.5;
                  pos = t < 0.5 ? lerp(serverPt, routerOut, t / 0.5) : lerp(routerIn, hostPt, (t - 0.5) / 0.5);
                }

                const label = translated
                  ? `${HOME_PUBLIC_IP}:${active.publicPort}`
                  : `${active.host.ip}:${active.privatePort}`;
                const colour = translated ? palette.series[1] : palette.series[active.host.series];

                if (showHeaders) {
                  // Wide enough, the header rides with the packet. On a narrow
                  // canvas it would cover the devices, so it is pinned instead.
                  const chipX = narrow ? w / 2 : pos.x;
                  const chipY = narrow ? 14 : pos.y - 23;
                  ctx.save();
                  ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                  const tw = ctx.measureText(label).width + 16;
                  if (palette.isDark) {
                    ctx.shadowColor = colour;
                    ctx.shadowBlur = 12;
                  }
                  ctx.fillStyle = colour;
                  ctx.beginPath();
                  ctx.roundRect(chipX - tw / 2, chipY - 9, tw, 18, 4);
                  ctx.fill();
                  ctx.shadowBlur = 0;
                  ctx.fillStyle = palette.bg;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(label, chipX, chipY);
                  ctx.restore();
                  if (!narrow) {
                    plot.text(chipX, chipY - 17, outbound ? "source" : "destination", palette.inkFaint, {
                      size: 8,
                      align: "center",
                    });
                  }
                }

                ctx.save();
                ctx.fillStyle = colour;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                plot.text(
                  w / 2,
                  h - 18,
                  outbound ? "request going out: source address rewritten" : "reply coming back: destination address restored",
                  outbound ? palette.series[1] : palette.series[2],
                  { size: 10, weight: 700, align: "center" },
                );
              }}
            />
          </Scope>

          <div className="grid content-start gap-3 lg:border-l lg:border-line lg:pl-4">
            <div>
              <p className="mb-2 text-xs font-medium text-ink-2">Send a request from</p>
              <div className="grid gap-1">
                {HOME_HOSTS.map((hst, i) => (
                  <button
                    key={hst.ip}
                    type="button"
                    onClick={() => send(i)}
                    className={clsx(
                      "flex items-baseline justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                      active?.host.ip === hst.ip
                        ? "border-brand-edge bg-brand-wash"
                        : "border-line bg-surface hover:bg-surface-2",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium text-ink">{hst.name}</span>
                      <span className="block text-2xs text-ink-3">{hst.kind}</span>
                    </span>
                    <span className="tnum shrink-0 font-mono text-2xs" style={{ color: `var(--s${hst.series + 1}-ink)` }}>
                      .{hst.ip.split(".")[3]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <Readout label="Public address" value={HOME_PUBLIC_IP} sub="shared by every device" tone="brand" />
            <Readout label="Entries in the table" value={entries.length} sub="one per conversation" />
          </div>
        </div>

        {out && back && (
          <div
            className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-line pt-4 md:grid-cols-2"
            style={{ animation: "rise var(--dur) var(--ease-out-quart)" }}
          >
            <div className="min-w-0 overflow-x-auto rounded-lg border border-line bg-surface-2 p-3">
              <p className="text-2xs font-semibold" style={{ color: "var(--s2-ink)" }}>
                Going out: the router rewrites the source
              </p>
              <p className="tnum mt-1.5 font-mono text-xs whitespace-nowrap text-ink-3 line-through">{out.before}</p>
              <p className="tnum mt-1 font-mono text-xs whitespace-nowrap text-ink">{out.after}</p>
            </div>
            <div className="min-w-0 overflow-x-auto rounded-lg border border-line bg-surface-2 p-3">
              <p className="text-2xs font-semibold" style={{ color: "var(--s3-ink)" }}>
                Coming back: the router rewrites the destination
              </p>
              <p className="tnum mt-1.5 font-mono text-xs whitespace-nowrap text-ink-3 line-through">{back.before}</p>
              <p className="tnum mt-1 font-mono text-xs whitespace-nowrap text-ink">{back.after}</p>
            </div>
          </div>
        )}

        <div className="mt-4 overflow-x-auto border-t border-line pt-4">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <caption className="pb-2 text-left text-2xs text-ink-3">
              The router's translation table: how a reply finds its way back to the right device.
            </caption>
            <thead>
              <tr className="border-b border-line">
                {["Device", "Private address : port", "Public address : port", "Talking to"].map((th) => (
                  <th key={th} className="px-4 py-2 text-2xs font-semibold tracking-wide text-ink-3">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-ink-3">
                    Empty. Send a request from one of the devices above.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr
                    key={e.id}
                    className={clsx("border-b border-line last:border-0", e.id === activeId && "bg-brand-wash")}
                  >
                    <td className="px-4 py-2 text-sm font-medium" style={{ color: `var(--s${e.host.series + 1}-ink)` }}>
                      {e.host.name}
                    </td>
                    <td className="tnum px-4 py-2 font-mono text-ink-2">
                      {e.host.ip}:{e.privatePort}
                    </td>
                    <td className="tnum px-4 py-2 font-mono font-semibold text-ink">
                      {HOME_PUBLIC_IP}:{e.publicPort}
                    </td>
                    <td className="tnum px-4 py-2 font-mono text-ink-2">
                      {e.remoteIp}:{e.remotePort}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 max-w-[74ch] rounded-lg bg-surface-2 px-3.5 py-2.5 text-sm text-ink-2">
          Every row has the same public address, so the port number is what tells them apart. When a reply arrives
          for port {entries.length ? entries[entries.length - 1].publicPort : "51000"}, the router looks that
          number up, finds the device it belongs to, and rewrites the destination back to the private address.
        </p>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Callout kind="exam" title="What NAT is for">
          NAT lets a whole network share one public IP address by rewriting the address information in packet
          headers as they pass through the router. It was introduced because IPv4 addresses are scarce, and it
          has a useful side effect: an outside machine cannot start a conversation with a device inside, because
          it has no address that reaches one.
        </Callout>

        <Panel title="The cost of translating">
          <p className="max-w-[52ch] text-sm text-ink-2">
            Because there is no way in from outside without a rule set up by hand, running a server at home is
            awkward: the router must be told to forward a particular port to a particular machine. NAT also
            breaks the original idea that any host could address any other, which is one of the arguments for
            moving to IPv6, where there are enough addresses that nobody needs to share.
          </p>
        </Panel>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 5. Proxies
 * ================================================================== */

function ProxySection() {
  const [cache, setCache] = useState<string[]>([]);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  // Whether the *last* request was a hit has to be decided before the fetched
  // page is added to the cache, since deriving it afterwards would make the very
  // first request look like a hit.
  const [hit, setHit] = useState(false);

  const request = (url: string) => {
    const cached = cache.includes(url);
    setHit(cached);
    setLastUrl(url);
    if (!cached) setCache((c) => [...c, url]);
  };

  const emptyCache = () => {
    setCache([]);
    setLastUrl(null);
    setHit(false);
  };

  return (
    <Section
      id="proxy"
      title="A stand-in that fetches on your behalf"
      lead="A proxy server sits between the client machines and the Internet. Instead of connecting to a site directly, a computer asks the proxy, and the proxy makes the request for it. Every reply passes back through the same place, which is what makes caching, filtering and a single point of contact possible at once."
    >
      <Panel
        title="Cache hit or cache miss"
        subtitle="Request the same page twice and watch where the second request stops."
        actions={
          <Button size="sm" onClick={emptyCache} disabled={!cache.length}>
            Empty the cache
          </Button>
        }
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_216px]">
          <Scope height={186}>
            <ScopeCanvas
              label={
                lastUrl === null
                  ? "A client, a proxy server and the Internet, with no request made yet"
                  : hit
                    ? `${lastUrl} was already in the proxy's cache, so the request is answered without using the ISP link`
                    : `${lastUrl} was not cached, so the proxy fetched it from the origin server across the ISP link`
              }
              animate={lastUrl !== null}
              deps={[lastUrl, hit, cache.length]}
              bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
              insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
              draw={({ plot, ctx, palette, time, w, h }) => {
                const y = h * 0.44;
                const clientX = 52;
                const proxyX = w * 0.44;
                const originX = w - 52;

                ctx.save();
                ctx.strokeStyle = palette.gridMajor;
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(clientX, y);
                ctx.lineTo(proxyX, y);
                ctx.stroke();
                // The expensive half of the path.
                ctx.setLineDash(hit ? [5, 5] : []);
                ctx.globalAlpha = hit ? 0.4 : 1;
                ctx.beginPath();
                ctx.moveTo(proxyX, y);
                ctx.lineTo(originX, y);
                ctx.stroke();
                ctx.restore();

                plot.text((proxyX + originX) / 2, y + 26, "the ISP link", palette.inkFaint, {
                  size: 9,
                  align: "center",
                });

                const boxes = [
                  { x: clientX, label: "Client", sub: "a lab PC", colour: palette.series[0] },
                  { x: proxyX, label: "Proxy", sub: `${cache.length} cached`, colour: palette.series[2] },
                  { x: originX, label: "Origin", sub: "the real site", colour: palette.series[4] },
                ];
                boxes.forEach((b) => {
                  ctx.save();
                  ctx.fillStyle = palette.bg;
                  ctx.strokeStyle = b.colour;
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.roundRect(b.x - 36, y - 19, 72, 38, 7);
                  ctx.fill();
                  ctx.stroke();
                  ctx.font = '700 10px "JetBrains Mono Variable", ui-monospace, monospace';
                  ctx.fillStyle = b.colour;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(b.label, b.x, y - 5);
                  ctx.font = '500 8px "JetBrains Mono Variable", ui-monospace, monospace';
                  ctx.fillStyle = palette.ink;
                  ctx.fillText(b.sub, b.x, y + 9);
                  ctx.restore();
                });

                if (lastUrl === null) {
                  plot.text(w / 2, h - 16, "request a page to see what happens", palette.inkFaint, {
                    size: 10,
                    align: "center",
                  });
                  return;
                }

                // A hit turns round at the proxy; a miss carries on to the origin.
                const far = hit ? proxyX : originX;
                const u = (time * 0.42) % 2;
                const going = u < 1;
                const t = going ? u : u - 1;
                const px = going ? clientX + (far - clientX) * t : far - (far - clientX) * t;
                const colour = hit ? palette.series[2] : palette.series[4];

                ctx.save();
                if (palette.isDark) {
                  ctx.shadowColor = colour;
                  ctx.shadowBlur = 12;
                }
                ctx.fillStyle = colour;
                ctx.beginPath();
                ctx.roundRect(px - 9, y - 32, 18, 14, 3);
                ctx.fill();
                ctx.restore();

                plot.text(
                  w / 2,
                  h - 16,
                  hit ? "cache hit: the ISP link is not used at all" : "cache miss: fetched from the origin, and kept",
                  colour,
                  { size: 10, weight: 700, align: "center" },
                );
              }}
            />
          </Scope>

          <div className="grid content-start gap-3 lg:border-l lg:border-line lg:pl-4">
            <div>
              <p className="mb-2 text-xs font-medium text-ink-2">Request a page</p>
              <div className="grid gap-1">
                {PROXY_PAGES.map((p) => (
                  <button
                    key={p.url}
                    type="button"
                    onClick={() => request(p.url)}
                    className={clsx(
                      "flex items-baseline justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                      lastUrl === p.url ? "border-brand-edge bg-brand-wash" : "border-line bg-surface hover:bg-surface-2",
                    )}
                  >
                    <span className="tnum min-w-0 truncate font-mono text-2xs text-ink">{p.url}</span>
                    {cache.includes(p.url) && <Badge tone="ok">cached</Badge>}
                  </button>
                ))}
              </div>
            </div>
            <Readout
              label="Last request"
              value={lastUrl === null ? "—" : hit ? "Cache hit" : "Cache miss"}
              tone={lastUrl === null ? "neutral" : hit ? "ok" : "warn"}
              sub={lastUrl === null ? "nothing requested yet" : hit ? "served by the proxy" : "went to the origin"}
            />
            <Readout label="Pages held" value={cache.length} sub="future requests answered locally" />
          </div>
        </div>

        <Legend
          className="mt-4 border-t border-line pt-4"
          items={[
            { color: "var(--s3)", label: "Answered by the proxy" },
            { color: "var(--s5)", label: "Fetched across the ISP link" },
          ]}
        />
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-3">
        {PROXY_JOBS.map((j) => (
          <Panel key={j.name} title={j.name}>
            <p className="max-w-[40ch] text-sm text-ink-2">{j.what}</p>
          </Panel>
        ))}
      </div>

      <Callout kind="note" title="NAT and a proxy are not the same thing">
        Both let many machines share one public address, but they work at different levels. NAT rewrites address
        fields in the packet header and has no idea what the packet contains. A proxy is an application-layer
        program: it understands the requests it is passing on, which is what lets it cache a page, refuse a site
        or keep a log, and also why it must be told about each kind of traffic it handles.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * Quiz
 * ================================================================== */

const QUESTIONS: Question[] = [
  {
    id: "i1",
    prompt: "What is the role of an Internet Service Provider?",
    options: [
      { label: "It owns and runs the Internet" },
      { label: "It provides access to the Internet, carrying a customer's traffic to and from other networks", correct: true },
      { label: "It assigns domain names to organisations" },
      { label: "It manufactures the modems and routers customers use" },
    ],
    explain:
      "Nobody owns the Internet: it is many networks that agree to carry each other's traffic. An ISP is one of those networks, selling you a connection to itself along with a public IP address and supporting services such as DNS.",
  },
  {
    id: "i2",
    prompt: "Why is a modem needed to connect a home computer to an ISP over a telephone line?",
    options: [
      { label: "To increase the speed of the telephone line" },
      { label: "To convert the computer's digital data into an analog signal the line can carry, and back again", correct: true },
      { label: "To assign the computer an IP address" },
      { label: "To store data while the line is busy" },
    ],
    explain:
      "The local loop was built to carry analog voice. A modem MODulates digital data onto an analog signal for the journey and DEModulates it at the far end, and those are the two words that give it its name.",
  },
  {
    id: "i3",
    prompt: "Which of these is an advantage of ADSL over a dial-up connection?",
    options: [
      { label: "The telephone can be used at the same time as the Internet connection", correct: true },
      { label: "It does not need a physical line to the exchange" },
      { label: "It gives every device in the house a public IP address" },
      { label: "It encrypts everything that is sent" },
    ],
    explain:
      "ADSL uses frequencies above the voice band, so speech and data travel on the same pair without interfering. It is also always on and far faster. Dial-up occupies the voice band itself, which is exactly why the line is busy while you are online.",
  },
  {
    id: "i4",
    prompt: "Why does ADSL give more capacity to the downstream direction than to the upstream?",
    options: [
      { label: "Because upstream signals travel more slowly" },
      { label: "Because a home connection receives far more data than it sends", correct: true },
      { label: "Because the exchange cannot receive at high speed" },
      { label: "Because upstream data does not need to be error checked" },
    ],
    explain:
      "A typical home downloads pages, video and updates while sending little more than requests. Matching the split to that use gets more from the same line, which is what the 'asymmetric' in ADSL means.",
  },
  {
    id: "i5",
    prompt: "A home LAN uses the addresses 192.168.1.10 to 192.168.1.12. What does NAT do when one of them requests a web page?",
    options: [
      { label: "It gives the device a public IP address for the duration" },
      { label: "It replaces the private source address with the router's public address, and reverses that for the reply", correct: true },
      { label: "It encrypts the private address so it cannot be read" },
      { label: "It forwards the private address unchanged, since routers ignore it" },
    ],
    explain:
      "A packet with a private source address could never be replied to, because no router on the Internet will carry one. NAT rewrites the source to the router's own public address and remembers the mapping, keyed by port number, so it can rewrite the reply back on the way in.",
  },
  {
    id: "i6",
    prompt: "What does a proxy server do that NAT does not?",
    options: [
      { label: "It lets several machines share one public address" },
      { label: "It understands the requests passing through it, so it can cache pages, filter sites and keep logs", correct: true },
      { label: "It assigns IP addresses to clients on the LAN" },
      { label: "It routes packets between two networks" },
    ],
    explain:
      "Both hide a private network behind one address, but NAT only rewrites header fields and never looks at the contents. A proxy works at the application layer and makes the request on the client's behalf, so it can keep a copy of the answer, refuse the request, or record it.",
  },
];
