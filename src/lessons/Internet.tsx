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
import { TAU } from "../lib/signal";
import {
  DHCP_STEPS,
  IP_CLASSES,
  PRIVATE_RANGES,
  classOf,
  intToIp,
  ipBits,
  ipToInt,
  isLoopback,
  isPrivate,
  octets,
  prefixForHosts,
  prefixToMask,
  splitBlock,
  subnetOf,
  type IpClass,
} from "../lib/network";

export function InternetLesson() {
  return (
    <>
      <GatewaySection />
      <AddressSection />
      <ClassSection />
      <SubnetSection />
      <SplitSection />
      <PrivateSection />
      <RoutingSection />
      <Section id="check" title="Check yourself">
        <Quiz lessonId="internet" questions={QUESTIONS} />
      </Section>
    </>
  );
}

/* ================================================================== *
 * 1. Gateways
 * ================================================================== */

function GatewaySection() {
  return (
    <Section
      id="gateway"
      title="A LAN can only reach its own members"
      lead="A MAC address identifies an interface on one local network and nothing beyond it. Put an Ethernet LAN next to a Wi-Fi LAN and neither has any way to name a machine on the other. Joining them needs a device sitting in both — a gateway — and an addressing scheme that works the same way on either side."
    >
      <Panel
        title="Two LANs, one gateway"
        subtitle="The gateway has an interface, and therefore an address, on each network."
      >
        <Scope height={200}>
          <ScopeCanvas
            label="Two local networks joined by a gateway router, with a packet passing from one to the other"
            animate
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, time, w, h }) => {
              const cy = h * 0.46;
              const gx = w / 2;
              const leftHosts = [0.1, 0.22].map((f) => w * f);
              const rightHosts = [0.78, 0.9].map((f) => w * f);

              const drawLan = (xs: number[], colour: string, label: string, cidr: string, hubX: number) => {
                ctx.save();
                ctx.strokeStyle = palette.gridMajor;
                ctx.lineWidth = 2;
                xs.forEach((x) => {
                  ctx.beginPath();
                  ctx.moveTo(x, cy);
                  ctx.lineTo(hubX, cy);
                  ctx.stroke();
                });
                ctx.restore();

                xs.forEach((x, i) => {
                  ctx.save();
                  ctx.fillStyle = palette.bg;
                  ctx.strokeStyle = colour;
                  ctx.lineWidth = 1.8;
                  ctx.beginPath();
                  ctx.roundRect(x - 24, cy - 16, 48, 32, 6);
                  ctx.fill();
                  ctx.stroke();
                  ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                  ctx.fillStyle = colour;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(`.${10 + i}`, x, cy);
                  ctx.restore();
                });

                plot.text(hubX, cy + 40, label, colour, { size: 10, weight: 700, align: "center" });
                plot.text(hubX, cy + 54, cidr, palette.inkFaint, { size: 9, align: "center" });
              };

              drawLan(leftHosts, palette.series[1], "LAN A · Ethernet", "192.168.1.0/24", w * 0.31);
              drawLan(rightHosts, palette.series[3], "LAN B · Wi-Fi", "192.168.2.0/24", w * 0.69);

              // Gateway spans both, so it needs an address on each side.
              ctx.save();
              ctx.strokeStyle = palette.gridMajor;
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(w * 0.31, cy);
              ctx.lineTo(w * 0.69, cy);
              ctx.stroke();
              ctx.restore();

              const p = (time * 0.34) % 1.5;
              const u = Math.min(1, p);
              const px = leftHosts[0] + (rightHosts[1] - leftHosts[0]) * u;
              ctx.save();
              ctx.fillStyle = palette.series[0];
              if (palette.isDark) {
                ctx.shadowColor = palette.series[0];
                ctx.shadowBlur = 14;
              }
              ctx.beginPath();
              ctx.roundRect(px - 10, cy - 5, 20, 10, 3);
              ctx.fill();
              ctx.restore();

              ctx.save();
              ctx.fillStyle = palette.bg;
              ctx.strokeStyle = palette.series[0];
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.roundRect(gx - 42, cy - 20, 84, 40, 8);
              ctx.fill();
              ctx.stroke();
              ctx.font = '700 10px "JetBrains Mono Variable", ui-monospace, monospace';
              ctx.fillStyle = palette.series[0];
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("GATEWAY", gx, cy);
              ctx.restore();

              plot.text(gx - 46, cy - 30, "192.168.1.1", palette.series[1], { size: 9, align: "right", weight: 700 });
              plot.text(gx + 46, cy - 30, "192.168.2.1", palette.series[3], { size: 9, weight: 700 });
              plot.text(w / 2, h - 14, "one device, one interface on each network", palette.inkFaint, {
                size: 10,
                align: "center",
              });
            }}
          />
        </Scope>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-ink">What the gateway does</p>
            <ul className="mt-1.5 grid gap-1.5 text-sm text-ink-2">
              {[
                "Belongs to both networks, with a separate address on each side.",
                "Receives a frame on one network, strips the frame header, and builds a new one for the other network.",
                "Decides, from the destination IP address, which side a packet should leave by.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <Callout kind="exam" title="Why MAC addresses are not enough">
            MAC addresses have no structure — nothing in <span className="tnum font-mono">B8:27:EB:1A:2C:9F</span>{" "}
            tells you where in the world that card is. A router would need an entry for every interface on Earth.
            IP addresses are <strong>hierarchical</strong>: the front of the address names the network, so a router
            can forward on that alone and needs to know only about networks, not machines.
          </Callout>
        </div>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * 2. IPv4 addresses
 * ================================================================== */

function AddressSection() {
  const [value, setValue] = useState(() => ipToInt("192.160.32.5")!);
  const parts = octets(value);
  const bits = ipBits(value);

  const setOctet = (i: number, v: number) => {
    const next = [...parts];
    next[i] = v;
    setValue(((next[0] << 24) | (next[1] << 16) | (next[2] << 8) | next[3]) >>> 0);
  };

  return (
    <Section
      id="address"
      title="Thirty-two bits, written to be readable"
      lead="An IPv4 address is a single 32-bit number. Writing it as thirty-two ones and zeros is unusable for humans, so it is split into four groups of eight bits — octets — and each is written as a decimal number from 0 to 255, separated by dots. Move any octet below and watch the binary follow."
    >
      <Panel title="Dotted decimal notation" subtitle="The same number, three ways.">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-4">
          {parts.map((o, i) => (
            <div key={i} className="rounded-lg border border-line bg-surface-2 p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xs font-medium text-ink-3">Octet {i + 1}</span>
                <span className="tnum font-mono text-lg font-semibold text-ink">{o}</span>
              </div>
              <p className="tnum mt-1 font-mono text-xs" style={{ color: `var(--s${i + 1}-ink)` }}>
                {bits[i]}
              </p>
              <input
                type="range"
                min={0}
                max={255}
                value={o}
                onChange={(e) => setOctet(i, Number(e.target.value))}
                aria-label={`Octet ${i + 1}`}
                className="mt-2"
                style={
                  {
                    "--track": `linear-gradient(to right, var(--s${i + 1}) ${(o / 255) * 100}%, var(--surface-3) ${(o / 255) * 100}%)`,
                    "--thumb": `var(--s${i + 1})`,
                  } as React.CSSProperties
                }
              />
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-line pt-4 sm:grid-cols-3">
          <div>
            <p className="text-2xs font-medium text-ink-3">Dotted decimal</p>
            <p className="tnum mt-0.5 font-mono text-2xl font-semibold text-ink">{intToIp(value)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-2xs font-medium text-ink-3">The same 32 bits</p>
            <p className="tnum mt-0.5 font-mono text-sm break-all">
              {bits.map((b, i) => (
                <span key={i}>
                  <span style={{ color: `var(--s${i + 1}-ink)` }}>{b}</span>
                  {i < 3 && <span className="text-ink-3"> </span>}
                </span>
              ))}
            </p>
            <p className="tnum mt-1 font-mono text-2xs text-ink-3">
              as one number: {value.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {["192.168.1.1", "8.8.8.8", "127.0.0.1", "255.255.255.255", "10.0.0.1"].map((ip) => (
            <Button
              key={ip}
              size="sm"
              variant={intToIp(value) === ip ? "primary" : "secondary"}
              onClick={() => setValue(ipToInt(ip)!)}
            >
              {ip}
            </Button>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Panel title="How many addresses is 32 bits?">
          <Formula note="Just over four billion — which sounded limitless in 1981 and does not now.">
            2³² = 4 294 967 296
          </Formula>
          <p className="mt-3 max-w-[62ch] text-sm text-ink-2">
            There are more phones, laptops, servers, cameras and sensors wanting an address than there are
            addresses to hand out. Two responses followed: <strong className="font-semibold text-ink">private
            addressing</strong>, which lets a whole household share one public address, and{" "}
            <strong className="font-semibold text-ink">IPv6</strong>, which widens the address to 128 bits.
          </p>
          <div className="mt-3">
            <Formula note="IPv6. Enough for every grain of sand on Earth to have its own network many times over.">
              2¹²⁸ ≈ 3.4 × 10³⁸
            </Formula>
          </div>
        </Panel>

        <Callout kind="warn" title="An octet stops at 255">
          Eight bits can count from 00000000 to 11111111, which is 0 to 255. An address written with any number
          above 255 in it — 192.300.1.1, say — is not a valid IPv4 address at all. This is a favourite exam trap.
        </Callout>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 3. Classes
 * ================================================================== */

function ClassSection() {
  const [value, setValue] = useState(() => ipToInt("172.16.5.1")!);
  const cls = classOf(value);
  const first = (value >>> 24) & 255;
  const firstBits = first.toString(2).padStart(8, "0");

  return (
    <Section
      id="classes"
      title="The first octet decides the class"
      lead="Before subnetting existed, the split between the network part and the host part of an address was fixed by the address itself. You can read the class straight off the leading bits of the first octet — and that is still how the syllabus asks you to identify one."
    >
      <Panel title="Class identifier" subtitle="Change the first octet and watch the class change with it.">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {firstBits.split("").map((b, i) => {
                const leading = cls ? IP_CLASSES[cls].leading : "";
                const isPattern = i < leading.length;
                return (
                  <span
                    key={i}
                    className={clsx(
                      "tnum grid h-9 w-9 place-items-center rounded-md border font-mono text-sm font-semibold",
                      isPattern
                        ? "border-brand bg-brand-wash text-brand"
                        : "border-line bg-surface-2 text-ink-3",
                    )}
                  >
                    {b}
                  </span>
                );
              })}
              <span className="ml-2 text-sm text-ink-2">
                = <span className="tnum font-mono font-semibold text-ink">{first}</span>
              </span>
            </div>
            <p className="mt-2 text-2xs text-ink-3">
              The highlighted leading bits are the pattern that names the class.
            </p>

            <div className="mt-4">
              <Slider
                label="First octet"
                value={first}
                onChange={(v) => setValue(((v << 24) | (value & 0x00ffffff)) >>> 0)}
                min={0}
                max={255}
                step={1}
                readout={`${first}`}
                accent="var(--s1)"
              />
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="py-2 pr-3 text-2xs font-semibold tracking-wide text-ink-3">Class</th>
                    <th className="py-2 pr-3 text-2xs font-semibold tracking-wide text-ink-3">First octet</th>
                    <th className="py-2 pr-3 text-2xs font-semibold tracking-wide text-ink-3">Starts with</th>
                    <th className="py-2 pr-3 text-2xs font-semibold tracking-wide text-ink-3">Mask</th>
                    <th className="py-2 text-2xs font-semibold tracking-wide text-ink-3">Used for</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(IP_CLASSES) as IpClass[]).map((k) => {
                    const c = IP_CLASSES[k];
                    const active = cls === k;
                    return (
                      <tr
                        key={k}
                        className={clsx("border-b border-line last:border-0", active && "bg-brand-wash")}
                      >
                        <th scope="row" className="py-2.5 pr-3 font-mono text-sm font-semibold text-ink">
                          {k}
                        </th>
                        <td className="tnum py-2.5 pr-3 font-mono text-xs text-ink-2">{c.range}</td>
                        <td className="tnum py-2.5 pr-3 font-mono text-xs text-ink-2">{c.leading}</td>
                        <td className="tnum py-2.5 pr-3 font-mono text-xs text-ink-2">
                          {c.prefix ? `/${c.prefix}` : "—"}
                        </td>
                        <td className="py-2.5 text-xs text-ink-2">{c.use}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid content-start gap-4 lg:border-l lg:border-line lg:pl-4">
            <div>
              <p className="text-2xs font-medium text-ink-3">Address</p>
              <p className="tnum mt-0.5 font-mono text-xl font-semibold text-ink">{intToIp(value)}</p>
            </div>
            <Readout
              label="Class"
              value={cls ?? "Reserved"}
              tone={cls ? "brand" : "warn"}
              sub={
                isLoopback(value)
                  ? "127.x.x.x is loopback — this machine"
                  : first === 0
                    ? "0.x.x.x is reserved"
                    : cls
                      ? IP_CLASSES[cls].use
                      : undefined
              }
            />
            {cls && IP_CLASSES[cls].prefix && (
              <>
                <Readout
                  label="Default mask"
                  value={intToIp(prefixToMask(IP_CLASSES[cls].prefix!))}
                  sub={`/${IP_CLASSES[cls].prefix}`}
                />
                <Readout
                  label="Hosts per network"
                  value={(2 ** (32 - IP_CLASSES[cls].prefix!) - 2).toLocaleString()}
                  sub="minus network and broadcast"
                />
              </>
            )}
            <div className="flex flex-wrap gap-1.5">
              {["10.1.1.1", "150.20.3.4", "200.1.2.3", "127.0.0.1"].map((ip) => (
                <Button key={ip} size="sm" onClick={() => setValue(ipToInt(ip)!)}>
                  {ip}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </Section>
  );
}

/* ================================================================== *
 * 4. Subnet calculator
 * ================================================================== */

function SubnetSection() {
  const [text, setText] = useState("192.168.10.130");
  const [prefix, setPrefix] = useState(26);
  const [showBits, setShowBits] = useState(true);

  const value = ipToInt(text);
  const valid = value !== null;
  const sub = useMemo(() => (valid ? subnetOf(value, prefix) : null), [value, prefix, valid]);

  return (
    <Section
      id="subnet"
      title="The mask says where the network ends"
      lead="A subnet mask is 32 bits laid alongside the address: a one wherever the bit belongs to the network, a zero wherever it belongs to the host. The router ANDs the two together and what falls out is the network address. Everything in this section is that one operation."
    >
      <Panel
        title="Subnet calculator"
        subtitle="Type any address and choose a prefix length."
        actions={<Toggle checked={showBits} onChange={setShowBits} label="Show the bits" />}
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_270px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="subnet-ip" className="text-xs font-medium text-ink-2">
                  Address
                </label>
                <input
                  id="subnet-ip"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  spellCheck={false}
                  inputMode="decimal"
                  className={clsx(
                    "tnum mt-1.5 block h-9 w-[190px] rounded-lg border bg-surface px-3 font-mono text-sm text-ink outline-none transition-colors",
                    valid ? "border-line focus:border-brand" : "border-bad",
                  )}
                />
              </div>
              <span className="pb-2 font-mono text-lg text-ink-3">/</span>
              <div className="min-w-[190px] flex-1">
                <Slider
                  label="Prefix length"
                  value={prefix}
                  onChange={setPrefix}
                  min={8}
                  max={30}
                  step={1}
                  readout={`/${prefix}`}
                  accent="var(--s2)"
                />
              </div>
            </div>
            {!valid && (
              <p className="mt-2 text-xs text-bad">
                Not a valid IPv4 address. Four numbers from 0 to 255, separated by dots.
              </p>
            )}

            {sub && showBits && (
              <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-surface-2 p-3">
                <div className="min-w-[520px]">
                  <BitRuler label="Address" value={value!} prefix={prefix} />
                  <BitRuler label="Mask" value={sub.mask} prefix={prefix} mono />
                  <div className="my-1.5 border-t border-line" />
                  <BitRuler label="Network" value={sub.network} prefix={prefix} highlight />
                  <div className="mt-2 flex gap-4 text-2xs text-ink-3">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm" style={{ background: "var(--s2)" }} />
                      {prefix} network bits
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm" style={{ background: "var(--s4)" }} />
                      {32 - prefix} host bits
                    </span>
                  </div>
                </div>
              </div>
            )}

            {sub && (
              <div className="mt-4 grid gap-2">
                {[
                  ["Network address", intToIp(sub.network), "all host bits set to 0 — names the network itself"],
                  ["First usable host", sub.firstHost !== null ? intToIp(sub.firstHost) : "—", "the first address you can give a machine"],
                  ["Last usable host", sub.lastHost !== null ? intToIp(sub.lastHost) : "—", "the last one"],
                  ["Broadcast address", intToIp(sub.broadcast), "all host bits set to 1 — reaches every host here"],
                  ["Subnet mask", intToIp(sub.mask), `written /${prefix} in CIDR notation`],
                ].map(([k, v, note]) => (
                  <div
                    key={k}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border border-line bg-surface px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink">{k}</p>
                      <p className="text-2xs text-ink-3">{note}</p>
                    </div>
                    <p className="tnum shrink-0 font-mono text-sm font-semibold text-ink">{v}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {sub && (
            <div className="grid content-start gap-4 lg:border-l lg:border-line lg:pl-4">
              <Readout
                label="Usable hosts"
                value={sub.usableHosts.toLocaleString()}
                tone="brand"
                sub={`2^${32 - prefix} − 2`}
              />
              <Readout label="Total addresses" value={sub.totalAddresses.toLocaleString()} sub={`2^${32 - prefix}`} />
              <Formula note="Two addresses in every subnet can never be given to a host.">
                hosts = 2ⁿ − 2
              </Formula>
              <Reveal label="Why minus two?">
                <ul className="grid gap-1.5">
                  <li>
                    The address with <strong className="font-semibold text-ink">all host bits 0</strong> names the
                    network itself. Routers use it; no machine may take it.
                  </li>
                  <li>
                    The address with <strong className="font-semibold text-ink">all host bits 1</strong> is the
                    broadcast address for that subnet. Sending to it reaches every host at once.
                  </li>
                  <li>
                    So a /24 has 256 addresses but only <span className="tnum font-mono">254</span> hosts.
                  </li>
                </ul>
              </Reveal>
              <div className="flex flex-wrap gap-1.5">
                {[24, 25, 26, 27, 28].map((p) => (
                  <Button key={p} size="sm" variant={prefix === p ? "primary" : "secondary"} onClick={() => setPrefix(p)}>
                    /{p}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Panel>

      <Callout kind="exam" title="Working it out on paper">
        Take <span className="tnum font-mono">192.168.10.130/26</span>. A /26 leaves 6 host bits, so each subnet
        holds 2⁶ = 64 addresses. The subnets therefore start at .0, .64, .128 and .192. The address .130 falls in
        the block beginning at <span className="tnum font-mono">.128</span>, so the network address is
        192.168.10.128, the broadcast is 192.168.10.191, and the usable hosts run from .129 to .190 — 62 of them.
      </Callout>
    </Section>
  );
}

function BitRuler({
  label,
  value,
  prefix,
  highlight,
  mono,
}: {
  label: string;
  value: number;
  prefix: number;
  highlight?: boolean;
  mono?: boolean;
}) {
  const bits = ipBits(value).join("");
  return (
    <div className="flex items-center gap-3 py-0.5">
      <span className="w-[62px] shrink-0 text-2xs font-medium text-ink-3">{label}</span>
      <span className="flex gap-px">
        {bits.split("").map((b, i) => {
          const isNetwork = i < prefix;
          return (
            <span
              key={i}
              className={clsx(
                "tnum grid h-5 w-[13px] place-items-center font-mono text-2xs",
                i % 8 === 7 && i < 31 && "mr-1.5",
                highlight && isNetwork && "font-semibold",
              )}
              style={{
                background: isNetwork
                  ? mono || highlight
                    ? "color-mix(in oklab, var(--s2) 13%, transparent)"
                    : "color-mix(in oklab, var(--s2) 7%, transparent)"
                  : mono || highlight
                    ? "color-mix(in oklab, var(--s4) 13%, transparent)"
                    : "color-mix(in oklab, var(--s4) 7%, transparent)",
                color: isNetwork ? "var(--s2-ink)" : "var(--s4-ink)",
              }}
            >
              {b}
            </span>
          );
        })}
      </span>
    </div>
  );
}

/* ================================================================== *
 * 5. Splitting a block
 * ================================================================== */

function SplitSection() {
  const [wanted, setWanted] = useState(4);
  const base = ipToInt("192.168.1.0")!;
  const basePrefix = 24;
  const split = useMemo(() => splitBlock(base, basePrefix, wanted), [wanted]);
  const [hostsNeeded, setHostsNeeded] = useState(50);
  const neededPrefix = prefixForHosts(hostsNeeded);

  return (
    <Section
      id="split"
      title="Borrowing bits to make more networks"
      lead="Subnetting means taking host bits and using them as network bits instead. Each bit you borrow doubles the number of networks you have and halves the size of each. This is the calculation the syllabus asks you to perform."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Panel
          title="Split 192.168.1.0/24"
          subtitle={`Borrowing ${split.borrowed} bit${split.borrowed === 1 ? "" : "s"} gives ${split.count} subnets of ${split.size} addresses each.`}
        >
          <Segmented
            label="Subnets wanted"
            value={String(wanted)}
            onChange={(v) => setWanted(Number(v))}
            options={[2, 4, 8, 16].map((n) => ({ value: String(n), label: `${n}` }))}
          />

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-2 pr-3 text-2xs font-semibold tracking-wide text-ink-3">#</th>
                  <th className="py-2 pr-3 text-2xs font-semibold tracking-wide text-ink-3">Network</th>
                  <th className="py-2 pr-3 text-2xs font-semibold tracking-wide text-ink-3">Usable range</th>
                  <th className="py-2 text-2xs font-semibold tracking-wide text-ink-3">Broadcast</th>
                </tr>
              </thead>
              <tbody>
                {split.subnets.slice(0, 8).map((s, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="tnum py-2 pr-3 font-mono text-2xs text-ink-3">{i + 1}</td>
                    <td className="tnum py-2 pr-3 font-mono text-xs font-medium text-ink">
                      {intToIp(s.network)}/{s.prefix}
                    </td>
                    <td className="tnum py-2 pr-3 font-mono text-2xs text-ink-2">
                      {s.firstHost !== null ? `${intToIp(s.firstHost)} – ${intToIp(s.lastHost!)}` : "—"}
                    </td>
                    <td className="tnum py-2 font-mono text-2xs text-ink-2">{intToIp(s.broadcast)}</td>
                  </tr>
                ))}
                {split.subnets.length > 8 && (
                  <tr>
                    <td colSpan={4} className="py-2 text-2xs text-ink-3">
                      … and {split.subnets.length - 8} more, continuing the same pattern.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-6 border-t border-line pt-4">
            <Readout label="Bits borrowed" value={split.borrowed} tone="brand" />
            <Readout label="New prefix" value={`/${split.newPrefix}`} sub={intToIp(prefixToMask(split.newPrefix))} />
            <Readout label="Hosts per subnet" value={split.size - 2} sub={`${split.size} − 2`} />
            <Readout
              label="Addresses lost"
              value={split.count * 2}
              tone="warn"
              sub="2 per subnet, unusable"
            />
          </div>
        </Panel>

        <div className="grid gap-4">
          <Panel title="Working the other way" subtitle="Start from how many hosts each network must hold.">
            <Slider
              label="Hosts needed per subnet"
              value={hostsNeeded}
              onChange={setHostsNeeded}
              min={2}
              max={500}
              step={1}
              readout={`${hostsNeeded} hosts`}
              accent="var(--s4)"
            />
            <div className="mt-4 grid gap-3">
              <Readout label="Smallest prefix that fits" value={`/${neededPrefix}`} tone="brand" />
              <Readout label="Mask" value={intToIp(prefixToMask(neededPrefix))} />
              <Readout
                label="Actually provides"
                value={`${(2 ** (32 - neededPrefix) - 2).toLocaleString()} hosts`}
                sub={`${(2 ** (32 - neededPrefix) - 2 - hostsNeeded).toLocaleString()} spare`}
              />
            </div>
            <p className="mt-3 max-w-[56ch] text-2xs text-ink-3">
              Host bits only come in whole powers of two, so you always round up. Needing 50 hosts means taking a
              block of 64 and leaving 12 addresses unused.
            </p>
          </Panel>

          <Callout kind="note" title="CIDR — dropping the classes entirely">
            Classful addressing wasted enormous amounts of space: an organisation needing 300 addresses had to be
            given a whole class B block of 65 534. <strong>Classless Inter-Domain Routing</strong> abandons the
            fixed class boundaries and lets a block of any prefix length be allocated, written as{" "}
            <span className="tnum font-mono">address/prefix</span>. It also lets neighbouring blocks be summarised
            into one routing entry, which is what keeps routing tables from exploding.
          </Callout>
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 6. Private addresses and DHCP
 * ================================================================== */

function PrivateSection() {
  const [step, setStep] = useState(0);
  const [check, setCheck] = useState("192.168.1.50");
  const checkVal = ipToInt(check);

  return (
    <Section
      id="private"
      title="Private addresses, and getting one automatically"
      lead="Three blocks of the address space are reserved for use inside private networks. They are not routed on the Internet, so the same 192.168.1.5 can exist in millions of homes at once — which is what makes four billion addresses stretch as far as it has."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Panel title="The three private ranges" bodyClassName="p-0">
          <ul className="divide-y divide-[var(--line)]">
            {PRIVATE_RANGES.map((r) => (
              <li key={r.cidr} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="tnum font-mono text-sm font-semibold text-ink">{r.cidr}</span>
                  <span className="tnum font-mono text-2xs text-ink-3">{r.count} addresses</span>
                </div>
                <p className="tnum mt-0.5 font-mono text-2xs text-ink-2">
                  {r.from} – {r.to}
                </p>
                <p className="mt-0.5 text-2xs text-ink-3">{r.note}</p>
              </li>
            ))}
          </ul>
          <div className="border-t border-line p-4">
            <label htmlFor="priv-check" className="text-xs font-medium text-ink-2">
              Check an address
            </label>
            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <input
                id="priv-check"
                value={check}
                onChange={(e) => setCheck(e.target.value)}
                spellCheck={false}
                inputMode="decimal"
                className={clsx(
                  "tnum h-9 w-[180px] rounded-lg border bg-surface px-3 font-mono text-sm text-ink outline-none transition-colors",
                  checkVal !== null ? "border-line focus:border-brand" : "border-bad",
                )}
              />
              {checkVal !== null && (
                <Badge tone={isLoopback(checkVal) ? "neutral" : isPrivate(checkVal) ? "brand" : "ok"}>
                  {isLoopback(checkVal) ? "Loopback" : isPrivate(checkVal) ? "Private" : "Public"}
                </Badge>
              )}
            </div>
            {checkVal !== null && (
              <p className="mt-2 max-w-[54ch] text-2xs text-ink-3">
                {isLoopback(checkVal)
                  ? "127.x.x.x always means this machine. Traffic sent here never reaches the network at all."
                  : isPrivate(checkVal)
                    ? "Routers on the Internet drop packets addressed to this range, so it is safe to reuse inside any private network."
                    : "This is a globally routable address. It must be unique across the whole Internet, and is allocated by an ISP."}
              </p>
            )}
          </div>
        </Panel>

        <Panel
          title="DHCP — four messages to get an address"
          subtitle={DHCP_STEPS[step].detail}
          actions={
            <div className="flex gap-1.5">
              <Button size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                Back
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setStep((s) => (s + 1) % DHCP_STEPS.length)}
              >
                {step === DHCP_STEPS.length - 1 ? "Start again" : "Next"}
              </Button>
            </div>
          }
        >
          <Scope height={160}>
            <ScopeCanvas
              label={`DHCP step ${step + 1} of 4: ${DHCP_STEPS[step].step}, from ${DHCP_STEPS[step].from} to ${DHCP_STEPS[step].to}`}
              animate
              deps={[step]}
              bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
              insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
              draw={({ plot, ctx, palette, time, w, h }) => {
                const y = h * 0.44;
                const cx = 62;
                const sx = w - 62;
                const cur = DHCP_STEPS[step];
                const fromClient = cur.from === "Client";

                ctx.save();
                ctx.strokeStyle = palette.gridMajor;
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(cx, y);
                ctx.lineTo(sx, y);
                ctx.stroke();
                ctx.restore();

                const p = (time * 0.55) % 1.4;
                const u = Math.min(1, p);
                const px = fromClient ? cx + (sx - cx) * u : sx - (sx - cx) * u;
                const colour = fromClient ? palette.series[0] : palette.series[2];

                ctx.save();
                ctx.fillStyle = colour;
                if (palette.isDark) {
                  ctx.shadowColor = colour;
                  ctx.shadowBlur = 14;
                }
                ctx.beginPath();
                ctx.roundRect(px - 24, y - 9, 48, 18, 4);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = palette.bg;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(cur.step.toUpperCase().slice(0, 8), px, y + 0.5);
                ctx.restore();

                const box = (x: number, label: string, sub: string, c: string) => {
                  ctx.save();
                  ctx.fillStyle = palette.bg;
                  ctx.strokeStyle = c;
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.roundRect(x - 46, y - 22, 92, 44, 7);
                  ctx.fill();
                  ctx.stroke();
                  ctx.font = '700 10px "JetBrains Mono Variable", ui-monospace, monospace';
                  ctx.fillStyle = c;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(label, x, y - 5);
                  ctx.font = '500 9px "JetBrains Mono Variable", ui-monospace, monospace';
                  ctx.fillStyle = palette.ink;
                  ctx.fillText(sub, x, y + 9);
                  ctx.restore();
                };

                box(cx, "CLIENT", step === 3 ? "192.168.1.42" : "no address", palette.series[0]);
                box(sx, "DHCP", "192.168.1.1", palette.series[2]);

                plot.text(w / 2, h - 30, `src ${cur.src}`, palette.inkFaint, { size: 9, align: "center" });
                plot.text(w / 2, h - 16, `dst ${cur.dst}`, palette.inkFaint, { size: 9, align: "center" });
              }}
            />
          </Scope>

          <ol className="mt-3 grid grid-cols-4 gap-1.5">
            {DHCP_STEPS.map((s, i) => (
              <li key={s.step}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={clsx(
                    "w-full rounded-lg border px-2 py-1.5 text-center transition-colors",
                    i === step ? "border-brand-edge bg-brand-wash" : "border-line bg-surface hover:bg-surface-2",
                    i < step && "opacity-70",
                  )}
                >
                  <span className="block text-2xs font-semibold text-ink">{s.step}</span>
                  <span className="block text-2xs text-ink-3">{i + 1}</span>
                </button>
              </li>
            ))}
          </ol>

          <p className="mt-3 max-w-[60ch] text-2xs text-ink-3">
            Notice the first three messages are broadcast. The client has no address yet, so it cannot be spoken
            to directly — the only way to reach it is to address the whole LAN.
          </p>
        </Panel>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 7. Routing and packet switching
 * ================================================================== */

const NODES = [
  { id: "A", x: 0.08, y: 0.5, kind: "host" },
  { id: "R1", x: 0.28, y: 0.5, kind: "router" },
  { id: "R2", x: 0.5, y: 0.2, kind: "router" },
  { id: "R3", x: 0.5, y: 0.8, kind: "router" },
  { id: "R4", x: 0.72, y: 0.5, kind: "router" },
  { id: "B", x: 0.92, y: 0.5, kind: "host" },
] as const;

const LINKS: [string, string][] = [
  ["A", "R1"],
  ["R1", "R2"],
  ["R1", "R3"],
  ["R2", "R4"],
  ["R3", "R4"],
  ["R4", "B"],
  ["R2", "R3"],
];

const ROUTE_TOP = ["A", "R1", "R2", "R4", "B"];
const ROUTE_BOTTOM = ["A", "R1", "R3", "R4", "B"];

function RoutingSection() {
  const [loss, setLoss] = useState(0);
  const [linkDown, setLinkDown] = useState(false);
  const packetCount = 6;

  return (
    <Section
      id="routing"
      title="Packets find their own way, and nobody promises they arrive"
      lead="A message is not sent as one lump. It is chopped into packets, each carrying the destination address in its own header, and each forwarded independently. Routers pass a packet on towards the destination using their routing tables — and if a link fails, later packets simply take a different path."
    >
      <Panel
        title="Packet switching"
        subtitle={
          linkDown
            ? "The upper link has failed. R1 has updated its routing table and is sending everything the other way."
            : "Packets are spread across both available paths and reassembled at the far end."
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Toggle checked={linkDown} onChange={setLinkDown} label="Break the upper link" accent="var(--s5)" />
          </div>
        }
      >
        <Scope height={260}>
          <ScopeCanvas
            label={`Packets travelling from host A to host B through four routers, with ${Math.round(loss * 100)} percent of packets dropped`}
            animate
            deps={[linkDown, loss]}
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, time, w, h }) => {
              const pos = (id: string) => {
                const n = NODES.find((x) => x.id === id)!;
                return { x: 30 + n.x * (w - 60), y: 26 + n.y * (h - 76) };
              };

              // Links
              for (const [a, b] of LINKS) {
                const broken = linkDown && ((a === "R1" && b === "R2") || (a === "R2" && b === "R4"));
                const pa = pos(a);
                const pb = pos(b);
                ctx.save();
                ctx.strokeStyle = broken ? palette.series[4] : palette.gridMajor;
                ctx.lineWidth = broken ? 2 : 2.4;
                if (broken) ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(pa.x, pa.y);
                ctx.lineTo(pb.x, pb.y);
                ctx.stroke();
                ctx.restore();
                if (broken) {
                  const mx = (pa.x + pb.x) / 2;
                  const my = (pa.y + pb.y) / 2;
                  ctx.save();
                  ctx.strokeStyle = palette.series[4];
                  ctx.lineWidth = 2.4;
                  ctx.beginPath();
                  ctx.moveTo(mx - 6, my - 6);
                  ctx.lineTo(mx + 6, my + 6);
                  ctx.moveTo(mx + 6, my - 6);
                  ctx.lineTo(mx - 6, my + 6);
                  ctx.stroke();
                  ctx.restore();
                }
              }

              // Packets, each on its own journey.
              for (let i = 0; i < packetCount; i++) {
                const phase = (time * 0.28 + i / packetCount) % 1;
                const route = linkDown ? ROUTE_BOTTOM : i % 2 === 0 ? ROUTE_TOP : ROUTE_BOTTOM;
                // Deterministic per-packet fate, so a dropped packet stays dropped.
                const drops = ((i * 7919) % 100) / 100 < loss;
                const dropAt = 0.55;
                if (drops && phase > dropAt) continue;

                const legs = route.length - 1;
                const t = phase * legs;
                const leg = Math.min(legs - 1, Math.floor(t));
                const u = t - leg;
                const pa = pos(route[leg]);
                const pb = pos(route[leg + 1]);
                const px = pa.x + (pb.x - pa.x) * u;
                const py = pa.y + (pb.y - pa.y) * u;
                const colour = drops ? palette.series[4] : palette.series[0];

                ctx.save();
                ctx.globalAlpha = drops && phase > dropAt - 0.08 ? 0.4 : 1;
                ctx.fillStyle = colour;
                if (palette.isDark) {
                  ctx.shadowColor = colour;
                  ctx.shadowBlur = 12;
                }
                ctx.beginPath();
                ctx.roundRect(px - 9, py - 5.5, 18, 11, 3);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.font = '700 8px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = palette.bg;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(String(i + 1), px, py + 0.5);
                ctx.restore();
              }

              // Nodes
              for (const n of NODES) {
                const p = pos(n.id);
                const isHost = n.kind === "host";
                const colour = isHost ? palette.series[2] : palette.series[1];
                ctx.save();
                ctx.fillStyle = palette.bg;
                ctx.strokeStyle = colour;
                ctx.lineWidth = 2;
                ctx.beginPath();
                if (isHost) ctx.roundRect(p.x - 22, p.y - 17, 44, 34, 7);
                else ctx.arc(p.x, p.y, 19, 0, TAU);
                ctx.fill();
                ctx.stroke();
                ctx.font = '700 10px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = colour;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(n.id, p.x, p.y + 0.5);
                ctx.restore();
              }

              plot.text(w / 2, h - 16, "each packet is forwarded on its own — they may not even take the same route", palette.inkFaint, {
                size: 10,
                align: "center",
              });
            }}
          />
        </Scope>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <Legend
            items={[
              { color: "var(--s1)", label: "Packet in flight" },
              { color: "var(--s2)", label: "Router" },
              { color: "var(--s3)", label: "Host" },
              ...(loss > 0 || linkDown ? [{ color: "var(--s5)", label: "Dropped / failed link" }] : []),
            ]}
          />
          <div className="w-full max-w-[280px]">
            <Slider
              label="Network congestion"
              value={loss}
              onChange={setLoss}
              min={0}
              max={0.6}
              step={0.05}
              readout={`${Math.round(loss * 100)}% dropped`}
              accent="var(--s5)"
              hint="A router with a full queue simply discards packets. IP does not apologise or retry."
            />
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Panel title="What routers actually do">
          <ul className="grid gap-2 text-sm text-ink-2">
            {[
              "Keep a routing table: a list of destination networks and which neighbour to send them towards.",
              "Read only the destination network part of the address — not the host part, and not the payload.",
              "Exchange tables with neighbouring routers periodically, so the tables stay current when a link fails.",
              "Forward each packet independently. A router has no memory of the packets before it.",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                {t}
              </li>
            ))}
          </ul>
        </Panel>

        <Callout kind="exam" title="Best effort delivery">
          IP promises to <em>try</em>. It does not promise that a packet arrives, that packets arrive in the
          order they were sent, or that they all take the same route. A router whose queue is full just discards
          what it cannot hold. If an application needs reliability, something above IP has to provide it — which
          is exactly what TCP does in the next level.
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
    id: "ip1",
    prompt: "Why is a MAC address not sufficient for delivering data across the Internet?",
    options: [
      { label: "MAC addresses are too short" },
      { label: "MAC addresses have no structure, so a router could not tell where in the world an address is", correct: true },
      { label: "MAC addresses change every time a device restarts" },
      { label: "MAC addresses only work on wireless networks" },
    ],
    explain:
      "A MAC address is flat — it identifies an interface but says nothing about where it is. IP addresses are hierarchical: the leading bits name the network, so a router can forward on that alone and needs to know about networks rather than individual machines.",
  },
  {
    id: "ip2",
    prompt: "What class does the address 150.20.3.4 belong to, and what is its default mask?",
    options: [
      { label: "Class A, /8" },
      { label: "Class B, /16", correct: true },
      { label: "Class C, /24" },
      { label: "Class D, no mask" },
    ],
    explain:
      "The first octet is 150, which falls in the range 128–191, so it is class B. Class B has a default mask of 16 bits — /16, or 255.255.0.0 — leaving 16 host bits and therefore 65 534 hosts per network.",
  },
  {
    id: "ip3",
    prompt: "How many usable host addresses are there in a /26 subnet?",
    options: [
      { label: "26" },
      { label: "32" },
      { label: "62", correct: true },
      { label: "64" },
    ],
    explain:
      "A /26 leaves 32 − 26 = 6 host bits, giving 2⁶ = 64 addresses. Two of those can never be given to a host — the network address (all host bits 0) and the broadcast address (all host bits 1) — so 64 − 2 = 62 are usable.",
  },
  {
    id: "ip4",
    prompt: "An address is 192.168.10.130 with a /26 prefix. What is its network address?",
    options: [
      { label: "192.168.10.0" },
      { label: "192.168.10.128", correct: true },
      { label: "192.168.10.130" },
      { label: "192.168.10.192" },
    ],
    explain:
      "A /26 makes subnets of 64 addresses, so they begin at .0, .64, .128 and .192. The address .130 lies in the block starting at .128, so the network address is 192.168.10.128 and the broadcast address is 192.168.10.191.",
  },
  {
    id: "ip5",
    prompt: "Which of these is a private IP address?",
    options: [
      { label: "8.8.8.8" },
      { label: "172.32.1.1" },
      { label: "172.16.5.20", correct: true },
      { label: "192.170.1.1" },
    ],
    explain:
      "The private ranges are 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16. The 172 block runs from 172.16 to 172.31 only, so 172.16.5.20 is private but 172.32.1.1 is not. Likewise the 192 block is 192.168, not 192.170.",
  },
  {
    id: "ip6",
    prompt: "Why does a DHCP client send its first message to the broadcast address?",
    options: [
      { label: "So that every host on the network gets an address at the same time" },
      { label: "Because it has no IP address yet and does not know the server's address either", correct: true },
      { label: "Because DHCP servers only accept broadcast traffic" },
      { label: "To test whether the network is working" },
    ],
    explain:
      "A host with no address cannot be the source of a normal unicast conversation, and it has not been told where any DHCP server is. Broadcasting to the whole LAN is the only way to reach a server it cannot yet name.",
  },
  {
    id: "ip7",
    prompt: "How many subnets do you get by borrowing 3 bits, and what happens to the size of each?",
    options: [
      { label: "3 subnets, each a third of the size" },
      { label: "6 subnets, each a sixth of the size" },
      { label: "8 subnets, each an eighth of the size", correct: true },
      { label: "8 subnets, each the same size as before" },
    ],
    explain:
      "Each borrowed bit doubles the number of subnets and halves the size of each, so 3 bits give 2³ = 8 subnets, each holding an eighth of the original addresses. Borrowing 3 bits from a /24 makes eight /27 subnets of 32 addresses.",
  },
  {
    id: "ip8",
    prompt: "What does 'best effort delivery' mean in an IP network?",
    options: [
      { label: "Packets are delivered as fast as the network can manage, but always arrive" },
      { label: "The network tries to deliver each packet but does not guarantee arrival, order, or a common route", correct: true },
      { label: "The sender retransmits any packet that is lost" },
      { label: "Packets are delivered in the order they were sent" },
    ],
    explain:
      "IP makes no promises. A router with a full queue discards packets, packets may take different routes and so arrive out of order, and nothing at the IP layer notices. Any application that needs reliability gets it from TCP, one layer up.",
  },
];
