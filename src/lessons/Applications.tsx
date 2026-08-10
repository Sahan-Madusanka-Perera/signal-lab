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
  Scope,
  Segmented,
} from "../components/ui";
import { TAU } from "../lib/signal";
import {
  DNS_RESOLUTION,
  DNS_TREE,
  HTTP_REQUEST,
  HTTP_RESPONSE,
  HTTP_STATUS,
  TOP_LEVEL_DOMAINS,
  type DnsNode,
} from "../lib/network";

export function ApplicationsLesson() {
  return (
    <>
      <NamesSection />
      <TreeSection />
      <ResolveSection />
      <HttpSection />
      <JourneySection />
      <Section id="check" title="Check yourself">
        <Quiz lessonId="applications" questions={QUESTIONS} />
      </Section>
    </>
  );
}

/* ================================================================== *
 * 1. Why names
 * ================================================================== */

function NamesSection() {
  return (
    <Section
      id="names"
      title="Nobody wants to remember 93.184.216.34"
      lead="Every level so far has been about getting bits from one address to another. This one is about the layer people actually touch. Two problems appear the moment a human is involved: numeric addresses are impossible to remember, and they change — a site that moves to a new server would otherwise become unreachable to everyone who had memorised the old number."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Panel title="What the machine needs">
          <div className="rounded-lg border border-line bg-surface-2 px-3.5 py-3 text-center">
            <p className="tnum font-mono text-2xl font-semibold text-ink">93.184.216.34</p>
          </div>
          <ul className="mt-3 grid gap-1.5 text-sm text-ink-2">
            {[
              "Fixed length, easy for a router to process",
              "Hierarchical, so routing tables stay small",
              "Meaningless to a person, and changes when the site moves servers",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--s2)" }} />
                {t}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="What a person needs">
          <div className="rounded-lg border border-brand-edge bg-brand-wash px-3.5 py-3 text-center">
            <p className="font-mono text-2xl font-semibold text-ink">www.example.com</p>
          </div>
          <ul className="mt-3 grid gap-1.5 text-sm text-ink-2">
            {[
              "Memorable, and says something about who owns it",
              "Stays the same when the site moves to a different server",
              "Means nothing to a router — it has to be translated first",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                {t}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Callout kind="note" title="The Domain Name System is a translation service">
        DNS is the directory that turns a name people can remember into the address a router can use. It is not
        part of getting the data there — by the time a packet is moving, only the IP address matters. DNS runs
        first, as a separate lookup, and its answer is what the rest of the journey uses.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * 2. The DNS hierarchy
 * ================================================================== */

function TreeSection() {
  const [selected, setSelected] = useState("www.example.com");

  const path = selected.split(".").reverse();

  return (
    <Section
      id="tree"
      title="A tree, and nobody owns all of it"
      lead="Names are organised as an upside-down tree. Read a domain name from right to left and you are walking down from the root: the last part is a top-level domain, the part before it is a domain registered under that, and so on. Crucially, each level only manages the names directly beneath it — which is what lets the system be run by thousands of independent organisations rather than one."
    >
      <Panel
        title="The name space"
        subtitle="Click a name to trace it back to the root."
        actions={
          <Segmented
            label="Name"
            size="sm"
            value={selected}
            onChange={setSelected}
            options={[
              { value: "www.example.com", label: "www.example.com" },
              { value: "cmb.ac.lk", label: "cmb.ac.lk" },
              { value: "www.ietf.org", label: "www.ietf.org" },
            ]}
          />
        }
      >
        <Scope height={280}>
          <ScopeCanvas
            label={`The DNS hierarchy, with the path from the root to ${selected} highlighted`}
            deps={[selected]}
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, w, h }) => {
              type Placed = { node: DnsNode; x: number; y: number; depth: number; onPath: boolean };
              const placed: Placed[] = [];
              const levelY = [26, 96, 172, 248].map((v) => (v / 280) * h);

              // Lay the leaves out evenly, then centre each parent over its children.
              const leaves: DnsNode[] = [];
              const collect = (n: DnsNode) => {
                if (!n.children?.length) leaves.push(n);
                else n.children.forEach(collect);
              };
              collect(DNS_TREE);
              const leafX = new Map<DnsNode, number>();
              leaves.forEach((n, i) => leafX.set(n, 40 + ((w - 80) * (i + 0.5)) / leaves.length));

              const place = (n: DnsNode, depth: number, trail: string[]): number => {
                const label = n.kind === "root" ? "" : n.label;
                const nextTrail = label ? [...trail, label] : trail;
                let x: number;
                if (!n.children?.length) x = leafX.get(n)!;
                else {
                  const xs = n.children.map((c) => place(c, depth + 1, nextTrail));
                  x = xs.reduce((a, b) => a + b, 0) / xs.length;
                }
                // A node is on the path when its trail is a prefix of the selection.
                const onPath = nextTrail.every((seg, i) => path[i] === seg);
                placed.push({ node: n, x, y: levelY[depth], depth, onPath });
                return x;
              };
              place(DNS_TREE, 0, []);

              // Edges first, so nodes sit on top of them.
              const byNode = new Map(placed.map((p) => [p.node, p]));
              const drawEdges = (n: DnsNode) => {
                const pn = byNode.get(n)!;
                for (const c of n.children ?? []) {
                  const pc = byNode.get(c)!;
                  const lit = pn.onPath && pc.onPath;
                  ctx.save();
                  ctx.strokeStyle = lit ? palette.series[0] : palette.gridMajor;
                  ctx.lineWidth = lit ? 2.2 : 1.4;
                  ctx.globalAlpha = lit ? 1 : 0.55;
                  ctx.beginPath();
                  ctx.moveTo(pn.x, pn.y + 12);
                  ctx.lineTo(pc.x, pc.y - 12);
                  ctx.stroke();
                  ctx.restore();
                  drawEdges(c);
                }
              };
              drawEdges(DNS_TREE);

              const kindColour: Record<DnsNode["kind"], string> = {
                root: palette.series[4],
                tld: palette.series[1],
                second: palette.series[3],
                host: palette.series[2],
              };

              for (const p of placed) {
                const colour = p.onPath ? palette.series[0] : kindColour[p.node.kind];
                const text = p.node.kind === "root" ? "root" : p.node.label;
                ctx.save();
                ctx.font = '700 10px "JetBrains Mono Variable", ui-monospace, monospace';
                const tw = ctx.measureText(text).width;
                const bw = Math.max(34, tw + 18);
                if (p.onPath && palette.isDark) {
                  ctx.shadowColor = colour;
                  ctx.shadowBlur = 12;
                }
                ctx.fillStyle = palette.bg;
                ctx.strokeStyle = colour;
                ctx.lineWidth = p.onPath ? 2.2 : 1.5;
                ctx.globalAlpha = p.onPath ? 1 : 0.75;
                ctx.beginPath();
                ctx.roundRect(p.x - bw / 2, p.y - 12, bw, 24, 6);
                ctx.fill();
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.fillStyle = colour;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(text, p.x, p.y + 0.5);
                ctx.restore();
              }

              const labels = ["root", "top level", "second level", "host"];
              labels.forEach((l, i) => {
                plot.text(8, levelY[i], l, palette.inkFaint, { size: 9, baseline: "middle" });
              });
            }}
          />
        </Scope>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Legend
            items={[
              { color: "var(--s1)", label: `Path to ${selected}` },
              { color: "var(--s5)", label: "Root" },
              { color: "var(--s2)", label: "Top level domain" },
              { color: "var(--s4)", label: "Second level" },
              { color: "var(--s3)", label: "Host" },
            ]}
          />
          <p className="tnum font-mono text-sm text-ink">
            {selected.split(".").map((seg, i, arr) => (
              <span key={i}>
                <span className="text-brand">{seg}</span>
                {i < arr.length - 1 && <span className="text-ink-3">.</span>}
              </span>
            ))}
            <span className="text-ink-3">.</span>
          </p>
        </div>

        <p className="mt-3 max-w-[72ch] text-sm text-ink-2">
          Read <span className="tnum font-mono text-ink">{selected}</span> backwards and you get the route down
          the tree. The trailing dot for the root is almost always left off, but it is really there — every
          domain name is a path from the root.
        </p>
      </Panel>

      <Panel title="Top level domains" bodyClassName="p-0">
        <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-2">
          {TOP_LEVEL_DOMAINS.map((t, i) => (
            <div
              key={t.tld}
              className={clsx(
                "flex items-baseline justify-between gap-3 border-line px-4 py-2.5",
                i < TOP_LEVEL_DOMAINS.length - 1 && "border-b",
                i % 2 === 0 && "sm:border-r",
              )}
            >
              <span className="tnum font-mono text-sm font-semibold text-ink">{t.tld}</span>
              <span className="min-w-0 flex-1 truncate text-right text-xs text-ink-2">{t.what}</span>
              <Badge tone={t.kind === "country" ? "brand" : "neutral"}>{t.kind}</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * 3. Resolving a name
 * ================================================================== */

function ResolveSection() {
  const [step, setStep] = useState(0);
  const cur = DNS_RESOLUTION[step];

  return (
    <Section
      id="resolve"
      title="Walking the tree to answer one question"
      lead="No single server knows every name — that is the point of the hierarchy. A resolver starts at the root and is passed down the tree, each server saying not 'here is the answer' but 'ask this one instead', until it reaches the server that is actually authoritative for the domain."
    >
      <Panel
        title={`Step ${step + 1} of ${DNS_RESOLUTION.length} — ${cur.to}`}
        subtitle={cur.detail}
        actions={
          <div className="flex gap-1.5">
            <Button size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              Back
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setStep((s) => (s + 1) % DNS_RESOLUTION.length)}
            >
              {step === DNS_RESOLUTION.length - 1 ? "Start again" : "Next"}
            </Button>
          </div>
        }
      >
        <ol className="grid gap-2">
          {DNS_RESOLUTION.map((r, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <li key={r.to}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={clsx(
                    "flex w-full items-start gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-all duration-150 ease-[var(--ease-out-quart)]",
                    active
                      ? "border-brand-edge bg-brand-wash"
                      : "border-line bg-surface hover:bg-surface-2",
                    done && !active && "opacity-65",
                  )}
                >
                  <span
                    className={clsx(
                      "tnum mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md font-mono text-2xs font-semibold",
                      active ? "bg-brand text-brand-ink" : done ? "bg-ok-wash text-ok" : "bg-surface-2 text-ink-3",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{r.to}</span>
                    {r.ask !== "—" && (
                      <span className="tnum mt-0.5 block font-mono text-2xs text-ink-3">→ {r.ask}</span>
                    )}
                    <span
                      className="tnum mt-0.5 block font-mono text-2xs"
                      style={{ color: i === DNS_RESOLUTION.length - 2 ? "var(--s3-ink)" : "var(--s2-ink)" }}
                    >
                      ← {r.answer}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <Readout label="Servers consulted" value={step + 1} sub="for one uncached name" />
          <Readout label="Cached afterwards" value="Yes" tone="ok" sub="the next lookup skips all of this" />
          <Readout label="Transport used" value="UDP port 53" sub="one small query, one small answer" />
        </div>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Callout kind="exam" title="Why the system is described as distributed">
          No server holds the whole database and no organisation runs the whole thing. Root servers know only
          about top-level domains; the .com servers know only which name server handles each domain registered
          under .com; and example.com's own administrator controls the records inside example.com. Authority is
          delegated down the tree, so each organisation manages exactly the names it owns.
        </Callout>

        <Panel title="Caching is what makes it fast">
          <p className="max-w-[60ch] text-sm text-ink-2">
            Walking the whole tree for every lookup would be unbearably slow, so every resolver stores what it
            learns for a while. In practice the vast majority of lookups are answered straight from a cache
            somewhere close by, and the full walk shown above happens only for a name nobody nearby has asked for
            recently.
          </p>
        </Panel>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 4. HTTP
 * ================================================================== */

function HttpSection() {
  const [side, setSide] = useState<"request" | "response">("request");
  const [line, setLine] = useState(0);
  const lines = side === "request" ? HTTP_REQUEST : HTTP_RESPONSE;
  const safeLine = Math.min(line, lines.length - 1);

  return (
    <Section
      id="http"
      title="The request that fetches a page"
      lead="Once the browser has an IP address it opens a TCP connection to port 80 and sends a request in plain text. HTTP is deliberately simple: a method, a path, some headers, a blank line — and the server answers in the same shape."
    >
      <Panel
        title={side === "request" ? "The client's request" : "The server's response"}
        subtitle="Click any line to see what it does."
        actions={
          <Segmented
            label="Direction"
            value={side}
            onChange={(v) => {
              setSide(v);
              setLine(0);
            }}
            options={[
              { value: "request", label: "Request" },
              { value: "response", label: "Response" },
            ]}
          />
        }
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0 overflow-x-auto rounded-lg border border-line bg-surface-2 p-3">
            <div className="min-w-[300px]">
              {lines.map((l, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLine(i)}
                  className={clsx(
                    "block w-full rounded-md px-2.5 py-1 text-left transition-colors",
                    i === safeLine ? "bg-brand-wash" : "hover:bg-surface-3",
                  )}
                >
                  <span
                    className={clsx(
                      "tnum font-mono text-sm whitespace-pre",
                      l.line === "" ? "text-ink-3 italic" : i === safeLine ? "text-ink" : "text-ink-2",
                    )}
                  >
                    {l.line === "" ? "(blank line)" : l.line}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid content-start gap-4 lg:border-l lg:border-line lg:pl-4">
            <div
              className="rounded-lg border border-line bg-surface-2 px-3.5 py-3"
              style={{ animation: "rise var(--dur) var(--ease-out-quart)" }}
            >
              <p className="text-2xs font-semibold text-brand">Line {safeLine + 1}</p>
              <p className="mt-1 max-w-[38ch] text-sm text-ink-2">{lines[safeLine].note}</p>
            </div>

            {side === "request" && (
              <div>
                <p className="text-2xs font-semibold text-ink-3">The method</p>
                <p className="mt-1 max-w-[38ch] text-sm text-ink-2">
                  <span className="tnum font-mono font-semibold text-ink">GET</span> means "send me this
                  resource, and change nothing". It is the method behind almost every page you load.
                </p>
              </div>
            )}

            {side === "response" && (
              <div>
                <p className="text-2xs font-semibold text-ink-3">Status codes</p>
                <ul className="mt-1.5 grid gap-1.5">
                  {HTTP_STATUS.map((s) => (
                    <li key={s.code} className="flex items-baseline gap-2.5">
                      <span
                        className="tnum shrink-0 font-mono text-sm font-semibold"
                        style={{
                          color:
                            s.tone === "ok"
                              ? "var(--ok)"
                              : s.tone === "bad"
                                ? "var(--bad)"
                                : s.tone === "warn"
                                  ? "var(--warn)"
                                  : "var(--ink-2)",
                        }}
                      >
                        {s.code}
                      </span>
                      <span className="text-2xs text-ink-2">{s.meaning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Client and server" subtitle="The model behind both DNS and HTTP.">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface-2 p-4">
            <p className="text-sm font-semibold" style={{ color: "var(--s1-ink)" }}>
              Client
            </p>
            <p className="mt-1 max-w-[46ch] text-sm text-ink-2">
              Starts the conversation. It knows what it wants and where to ask, but holds none of the resource
              itself. Your browser is a client; so is the resolver asking a DNS server.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface-2 p-4">
            <p className="text-sm font-semibold" style={{ color: "var(--s2-ink)" }}>
              Server
            </p>
            <p className="mt-1 max-w-[46ch] text-sm text-ink-2">
              Waits, listening on a known port, and answers whoever asks. It never starts a conversation. One
              server handles many clients at once, each identified by its own address and port.
            </p>
          </div>
        </div>
        <p className="mt-3 max-w-[72ch] text-sm text-ink-2">
          The work is deliberately split: the resource lives in one place so it only has to be maintained once,
          and the client supplies the screen, the keyboard and the person. Every application in this competency —
          DNS, HTTP, mail, DHCP — follows this same shape.
        </p>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * 5. The whole journey
 * ================================================================== */

const JOURNEY = [
  { layer: "6.9", what: "You type www.example.com", detail: "A name, not an address. Nothing can be sent yet.", series: 0 },
  { layer: "6.9", what: "DNS returns 93.184.216.34", detail: "The resolver walks the hierarchy and caches the answer.", series: 3 },
  { layer: "6.8", what: "TCP opens a connection to port 80", detail: "Port 80 identifies the web server process on that machine.", series: 1 },
  { layer: "6.7", what: "The request is put in IP packets", detail: "Each packet is routed independently, best effort.", series: 2 },
  { layer: "6.6", what: "Each packet is framed with MAC addresses", detail: "For the hop across the local network to the gateway.", series: 3 },
  { layer: "6.1–6.5", what: "The frame becomes a signal on the medium", detail: "Encoded, modulated if needed, and carried down the wire.", series: 0 },
];

function JourneySection() {
  return (
    <Section
      id="journey"
      title="Every level of this competency, in one page load"
      lead="Loading a single web page uses everything in Competency 6. Reading it from the top down is a useful way to check that the whole picture holds together."
    >
      <Panel title="From a name to a signal">
        <ol className="grid gap-2">
          {JOURNEY.map((j, i) => (
            <li key={j.what} className="flex items-start gap-3 rounded-lg border border-line bg-surface-2 px-3.5 py-2.5">
              <span
                className="tnum mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 font-mono text-2xs font-semibold"
                style={{
                  background: `color-mix(in oklab, var(--s${j.series + 1}) 9%, transparent)`,
                  color: `var(--s${j.series + 1}-ink)`,
                }}
              >
                {j.layer}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{j.what}</span>
                <span className="block text-2xs text-ink-3">{j.detail}</span>
              </span>
              {i < JOURNEY.length - 1 && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="mt-1 shrink-0">
                  <path d="M6 2v7m0 0L3.2 6.2M6 9l2.8-2.8" stroke="var(--ink-3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="And the whole thing, animated">
        <Scope height={190}>
          <ScopeCanvas
            label="A request travelling from a browser through DNS, a router and the Internet to a web server, and the page coming back"
            animate
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, time, w, h }) => {
              const y = h * 0.46;
              const stops = [
                { x: 0.09, label: "Browser", sub: "client" },
                { x: 0.31, label: "DNS", sub: "port 53" },
                { x: 0.55, label: "Router", sub: "gateway" },
                { x: 0.85, label: "Server", sub: "port 80" },
              ].map((s) => ({ ...s, px: 40 + s.x * (w - 80) }));

              ctx.save();
              ctx.strokeStyle = palette.gridMajor;
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(stops[0].px, y);
              ctx.lineTo(stops[3].px, y);
              ctx.stroke();
              ctx.restore();

              // Phase 1: name lookup. Phase 2: the request out. Phase 3: the page back.
              const cycle = (time * 0.22) % 3;
              let px = stops[0].px;
              let label = "";
              let colour = palette.series[0];

              if (cycle < 1) {
                const u = cycle < 0.5 ? cycle / 0.5 : 1 - (cycle - 0.5) / 0.5;
                px = stops[0].px + (stops[1].px - stops[0].px) * u;
                label = cycle < 0.5 ? "name?" : "93.184…";
                colour = palette.series[3];
              } else if (cycle < 2) {
                const u = cycle - 1;
                px = stops[0].px + (stops[3].px - stops[0].px) * u;
                label = "GET /";
                colour = palette.series[1];
              } else {
                const u = cycle - 2;
                px = stops[3].px - (stops[3].px - stops[0].px) * u;
                label = "200 OK";
                colour = palette.series[2];
              }

              ctx.save();
              ctx.fillStyle = colour;
              if (palette.isDark) {
                ctx.shadowColor = colour;
                ctx.shadowBlur = 14;
              }
              ctx.beginPath();
              ctx.roundRect(px - 28, y - 10, 56, 20, 5);
              ctx.fill();
              ctx.shadowBlur = 0;
              ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
              ctx.fillStyle = palette.bg;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(label, px, y + 0.5);
              ctx.restore();

              stops.forEach((s, i) => {
                const c = [palette.series[0], palette.series[3], palette.series[1], palette.series[2]][i];
                ctx.save();
                ctx.fillStyle = palette.bg;
                ctx.strokeStyle = c;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(s.px - 38, y - 22, 76, 44, 7);
                ctx.fill();
                ctx.stroke();
                ctx.font = '700 10px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = c;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(s.label, s.px, y - 5);
                ctx.font = '500 9px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = palette.ink;
                ctx.fillText(s.sub, s.px, y + 9);
                ctx.restore();
              });

              const phase = cycle < 1 ? "1 · look the name up" : cycle < 2 ? "2 · send the request" : "3 · the page comes back";
              plot.text(w / 2, h - 16, phase, palette.inkFaint, { size: 10, align: "center" });

              // A small progress arc, so the loop is legible when paused mid-cycle.
              ctx.save();
              ctx.strokeStyle = palette.axis;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(w - 22, 22, 8, -Math.PI / 2, -Math.PI / 2 + (cycle / 3) * TAU);
              ctx.stroke();
              ctx.restore();
            }}
          />
        </Scope>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * Quiz
 * ================================================================== */

const QUESTIONS: Question[] = [
  {
    id: "a1",
    prompt: "What does the Domain Name System do?",
    options: [
      { label: "It routes packets towards their destination" },
      { label: "It translates human-friendly names into IP addresses", correct: true },
      { label: "It encrypts web traffic" },
      { label: "It assigns IP addresses to new hosts" },
    ],
    explain:
      "DNS is a directory service. It takes a name like www.example.com and returns the IP address behind it, which is what the rest of the journey actually uses. Assigning addresses to hosts is DHCP's job, and routing is done by routers.",
  },
  {
    id: "a2",
    prompt: "In the name www.example.com, which part is the top level domain?",
    options: [
      { label: "www" },
      { label: "example" },
      { label: "com", correct: true },
      { label: "www.example" },
    ],
    explain:
      "Domain names are read right to left, walking down from the root. The rightmost label, com, is the top-level domain; example is the second-level domain registered under it; and www is a host within example.com.",
  },
  {
    id: "a3",
    prompt: "Why is DNS described as a distributed, hierarchical system?",
    options: [
      { label: "Because there are many copies of one central database" },
      { label: "Because each level delegates authority for the names beneath it to different organisations", correct: true },
      { label: "Because it uses UDP rather than TCP" },
      { label: "Because names are stored on every client machine" },
    ],
    explain:
      "No server holds the whole name space. Root servers know only the top-level domains, the .com servers know which name server handles each domain under .com, and each domain's own administrator controls the records inside it. Authority is delegated down the tree.",
  },
  {
    id: "a4",
    prompt: "What does a GET request ask a web server to do?",
    options: [
      { label: "Send back the requested resource without changing anything", correct: true },
      { label: "Store the data being uploaded" },
      { label: "Delete the named resource" },
      { label: "Open a new connection on port 53" },
    ],
    explain:
      "GET means 'give me this resource'. It is a read-only request — the server should return the resource and change nothing. It is the method behind nearly every ordinary page load.",
  },
  {
    id: "a5",
    prompt: "A server replies with the status line 'HTTP/1.1 404 Not Found'. What does this mean?",
    options: [
      { label: "The server is overloaded" },
      { label: "The request succeeded and the page follows" },
      { label: "There is no such resource on this server", correct: true },
      { label: "The resource has permanently moved elsewhere" },
    ],
    explain:
      "404 means the server understood the request perfectly well but has nothing at that path. 200 is success, 301 is a permanent redirect, and 500 means the server itself failed while handling the request.",
  },
  {
    id: "a6",
    prompt: "In the client–server model, which side starts the conversation?",
    options: [
      { label: "The server, when it has data to send" },
      { label: "The client, by making a request", correct: true },
      { label: "Whichever has the lower IP address" },
      { label: "The router between them" },
    ],
    explain:
      "The server waits, listening on a known port, and only ever answers. The client is the side that knows what it wants and asks for it. This holds for both DNS and HTTP — and it is why servers need well-known port numbers but clients do not.",
  },
];
