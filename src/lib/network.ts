/**
 * Maths for competency levels 6.6 – 6.9 and 6.12: media access, addressing,
 * transport, the application protocols, and the access link and address
 * translation that join a home network to an ISP.
 *
 * As in `signal.ts`, everything here is a pure function so the same computation
 * drives the animation, the readout and the answer a student checks against.
 */

/* ================================================================== *
 * 6.6 — MAC addresses
 * ================================================================== */

export const BROADCAST_MAC = "FF:FF:FF:FF:FF:FF";

/** Six bytes as a colon-separated uppercase hex string. */
export function formatMac(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(":");
}

export function parseMac(text: string): number[] | null {
  const parts = text.trim().split(/[:-]/);
  if (parts.length !== 6) return null;
  const bytes = parts.map((p) => parseInt(p, 16));
  return bytes.every((b) => Number.isInteger(b) && b >= 0 && b <= 255) ? bytes : null;
}

/**
 * A MAC address is 48 bits: the first three bytes identify the manufacturer
 * (the OUI), the last three identify the individual interface.
 */
export type MacParts = {
  bytes: number[];
  oui: number[];
  nic: number[];
  /** Set in the least significant bit of the first byte for a group address. */
  isMulticast: boolean;
  isBroadcast: boolean;
  /** Set in the second-least-significant bit when the address is not from a vendor. */
  isLocallyAdministered: boolean;
};

export function macParts(bytes: number[]): MacParts {
  return {
    bytes,
    oui: bytes.slice(0, 3),
    nic: bytes.slice(3),
    isMulticast: (bytes[0] & 0x01) === 1,
    isBroadcast: bytes.every((b) => b === 0xff),
    isLocallyAdministered: (bytes[0] & 0x02) === 2,
  };
}

/** The two hex digits of a byte, with the four bits behind each of them. */
export function nibbles(byte: number): { hex: string; bits: string }[] {
  const hi = (byte >> 4) & 0xf;
  const lo = byte & 0xf;
  return [hi, lo].map((n) => ({
    hex: n.toString(16).toUpperCase(),
    bits: n.toString(2).padStart(4, "0"),
  }));
}

/** A few well-known OUIs, so the vendor half of the address means something. */
export const KNOWN_OUI: Record<string, string> = {
  "00:1A:2B": "Ayecom Technology",
  "3C:5A:B4": "Google",
  "F0:18:98": "Apple",
  "B8:27:EB": "Raspberry Pi Foundation",
  "00:50:56": "VMware",
  "4A:8F:3C": "(locally administered — no vendor)",
};

/* ================================================================== *
 * 6.6 — Ethernet frame layout
 * ================================================================== */

export type FrameField = {
  name: string;
  bytes: number | [number, number];
  what: string;
  series: number;
};

/** The IEEE 802.3 frame, in the order the bits go onto the wire. */
export const FRAME_FIELDS: FrameField[] = [
  { name: "Preamble + SFD", bytes: 8, what: "A fixed bit pattern that lets the receiver lock its clock onto the incoming signal.", series: 2 },
  { name: "Destination MAC", bytes: 6, what: "Who the frame is for. All ones means every station on the LAN.", series: 0 },
  { name: "Source MAC", bytes: 6, what: "Which interface sent it, so a reply can be addressed back.", series: 3 },
  { name: "Type / Length", bytes: 2, what: "What the payload contains — 0x0800 for an IPv4 packet.", series: 1 },
  { name: "Payload", bytes: [46, 1500], what: "The data being carried, usually an IP packet. Padded up to 46 bytes if it is shorter.", series: 4 },
  { name: "FCS", bytes: 4, what: "A checksum over the whole frame. If it does not match, the frame is silently discarded.", series: 2 },
];

/* ================================================================== *
 * 6.6 — Media access simulation
 *
 * A small event simulation rather than a formula, because the point of the
 * lesson is *why* the protocols behave differently, not the algebra.
 * ================================================================== */

export type MacProtocol = "aloha" | "slotted" | "csma-cd";

export const MAC_PROTOCOLS: Record<MacProtocol, { name: string; long: string; rule: string; peak: string }> = {
  aloha: {
    name: "ALOHA",
    long: "Pure ALOHA",
    rule: "Transmit the moment you have something to send. If it collides, wait a random time and try again.",
    peak: "18.4 %",
  },
  slotted: {
    name: "Slotted ALOHA",
    long: "Slotted ALOHA",
    rule: "Same idea, but you may only start at the beginning of a time slot. That halves the window in which a collision can start.",
    peak: "36.8 %",
  },
  "csma-cd": {
    name: "Ethernet",
    long: "Ethernet — CSMA/CD",
    rule: "Listen before you talk. If the medium is busy, wait. Keep listening while sending, and if you hear a collision, stop immediately and back off.",
    peak: "over 90 %",
  },
};

export type Attempt = {
  station: number;
  start: number;
  end: number;
  collided: boolean;
  /** Deferred because the station sensed the medium was busy. */
  deferred: boolean;
};

/** Small deterministic generator, so a given seed always replays the same run. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type MacResult = {
  attempts: Attempt[];
  /** Fraction of the simulated time spent carrying frames that got through. */
  throughput: number;
  successes: number;
  collisions: number;
  duration: number;
};

/**
 * @param load   offered load G, in frame-times of traffic generated per frame time
 * @param span   how many frame times to simulate
 * @param a      propagation delay as a fraction of one frame time (CSMA/CD only)
 */
export function simulateMac(
  protocol: MacProtocol,
  load: number,
  span: number,
  stations: number,
  seed: number,
  a = 0.04,
): MacResult {
  const rnd = mulberry32(seed);
  const frame = 1; // one frame time, by definition

  // Poisson arrivals at rate `load` over the whole span.
  const arrivals: { t: number; station: number }[] = [];
  let t = 0;
  while (t < span) {
    t += -Math.log(1 - rnd()) / Math.max(load, 1e-6);
    if (t >= span) break;
    arrivals.push({ t, station: Math.floor(rnd() * stations) });
  }

  const attempts: Attempt[] = [];

  if (protocol === "aloha" || protocol === "slotted") {
    for (const arr of arrivals) {
      // Slotted ALOHA holds the frame until the next slot boundary.
      const start = protocol === "slotted" ? Math.ceil(arr.t) : arr.t;
      if (start + frame > span) continue;
      attempts.push({ station: arr.station, start, end: start + frame, collided: false, deferred: start > arr.t });
    }
    // Any overlap in time destroys both frames.
    for (let i = 0; i < attempts.length; i++) {
      for (let j = i + 1; j < attempts.length; j++) {
        if (attempts[i].start < attempts[j].end && attempts[j].start < attempts[i].end) {
          attempts[i].collided = true;
          attempts[j].collided = true;
        }
      }
    }
  } else {
    // CSMA/CD, 1-persistent: sense the medium, defer while busy, and abort
    // quickly if a collision is detected inside the propagation window.
    const sorted = [...arrivals].sort((x, y) => x.t - y.t);
    // Real Ethernet leaves an interframe gap, so back-to-back frames can never
    // quite fill the medium. Without it the model would claim 100 % throughput.
    const gap = a;
    for (const arr of sorted) {
      const busyUntil = attempts.reduce((m, x) => Math.max(m, x.end + gap), 0);
      // Deferred senders queue up behind the current transmission.
      const start = arr.t < busyUntil ? busyUntil : arr.t;
      if (start >= span) continue;

      // A station already committed within one propagation delay cannot have
      // heard this one yet — that is the only remaining collision window.
      const clash = attempts.find((x) => !x.collided && Math.abs(x.start - start) < a && x.station !== arr.station);
      if (clash) {
        // Both abort as soon as they detect it, so the medium is freed early.
        clash.collided = true;
        clash.end = Math.min(clash.end, clash.start + a * 2);
        attempts.push({ station: arr.station, start, end: start + a * 2, collided: true, deferred: start > arr.t });
      } else {
        attempts.push({ station: arr.station, start, end: Math.min(span, start + frame), collided: false, deferred: start > arr.t });
      }
    }
  }

  const successes = attempts.filter((x) => !x.collided).length;
  const collisions = attempts.filter((x) => x.collided).length;
  return { attempts, throughput: (successes * frame) / span, successes, collisions, duration: span };
}

/** Theoretical throughput S for a given offered load G. */
export function macThroughput(protocol: MacProtocol, G: number): number {
  if (protocol === "aloha") return G * Math.exp(-2 * G);
  if (protocol === "slotted") return G * Math.exp(-G);
  // CSMA/CD with a small propagation ratio: efficiency ≈ 1/(1 + 5a), applied to
  // the offered load and capped at the channel capacity.
  const a = 0.04;
  const eff = 1 / (1 + 5 * a);
  return Math.min(G, eff);
}

/* ================================================================== *
 * 6.7 — IPv4 addressing
 * ================================================================== */

export function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let v = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    v = v * 256 + n;
  }
  return v >>> 0;
}

export const intToIp = (v: number): string =>
  [24, 16, 8, 0].map((s) => (v >>> s) & 255).join(".");

export const octets = (v: number): number[] => [24, 16, 8, 0].map((s) => (v >>> s) & 255);

/** The full 32 bits, grouped into four octets of eight characters. */
export const ipBits = (v: number): string[] =>
  octets(v).map((o) => o.toString(2).padStart(8, "0"));

/** A /n prefix as a 32-bit mask. */
export const prefixToMask = (prefix: number): number =>
  prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;

export function maskToPrefix(mask: number): number | null {
  const bits = mask.toString(2).padStart(32, "0");
  // A valid mask is a run of ones followed by a run of zeros, nothing else.
  return /^1*0*$/.test(bits) ? (bits.match(/1/g) ?? []).length : null;
}

export type Subnet = {
  network: number;
  broadcast: number;
  mask: number;
  prefix: number;
  firstHost: number | null;
  lastHost: number | null;
  /** Addresses that can actually be given to a host. */
  usableHosts: number;
  totalAddresses: number;
};

export function subnetOf(address: number, prefix: number): Subnet {
  const mask = prefixToMask(prefix);
  const network = (address & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - prefix);
  // /31 and /32 have no room for a separate network and broadcast address.
  const usable = total > 2 ? total - 2 : 0;
  return {
    network,
    broadcast,
    mask,
    prefix,
    firstHost: usable ? network + 1 : null,
    lastHost: usable ? broadcast - 1 : null,
    usableHosts: usable,
    totalAddresses: total,
  };
}

export type IpClass = "A" | "B" | "C" | "D" | "E";

export const IP_CLASSES: Record<IpClass, { range: string; leading: string; prefix: number | null; use: string }> = {
  A: { range: "1 – 126", leading: "0", prefix: 8, use: "Very large networks — 16 777 214 hosts each" },
  B: { range: "128 – 191", leading: "10", prefix: 16, use: "Medium networks — 65 534 hosts each" },
  C: { range: "192 – 223", leading: "110", prefix: 24, use: "Small networks — 254 hosts each" },
  D: { range: "224 – 239", leading: "1110", prefix: null, use: "Multicast — one message to a group" },
  E: { range: "240 – 255", leading: "1111", prefix: null, use: "Reserved for experimental use" },
};

export function classOf(address: number): IpClass | null {
  const first = (address >>> 24) & 255;
  if (first === 0 || first === 127) return null; // 0.x is reserved, 127.x is loopback
  if (first <= 126) return "A";
  if (first <= 191) return "B";
  if (first <= 223) return "C";
  if (first <= 239) return "D";
  return "E";
}

export const PRIVATE_RANGES = [
  { cidr: "10.0.0.0/8", from: "10.0.0.0", to: "10.255.255.255", count: "16 777 216", note: "One class A block" },
  { cidr: "172.16.0.0/12", from: "172.16.0.0", to: "172.31.255.255", count: "1 048 576", note: "Sixteen class B blocks" },
  { cidr: "192.168.0.0/16", from: "192.168.0.0", to: "192.168.255.255", count: "65 536", note: "The usual home-router range" },
];

export function isPrivate(address: number): boolean {
  const a = (address >>> 24) & 255;
  const b = (address >>> 16) & 255;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export const isLoopback = (address: number) => ((address >>> 24) & 255) === 127;

/**
 * Split a block into equal subnets. Returns the borrowed-bit count alongside
 * the subnets, because "how many bits did you borrow" is the exam question.
 */
export function splitBlock(network: number, prefix: number, wanted: number) {
  const borrowed = Math.ceil(Math.log2(Math.max(1, wanted)));
  const newPrefix = Math.min(32, prefix + borrowed);
  const count = 2 ** (newPrefix - prefix);
  const size = 2 ** (32 - newPrefix);
  const subnets = Array.from({ length: count }, (_, i) => subnetOf((network + i * size) >>> 0, newPrefix));
  return { borrowed, newPrefix, count, size, subnets };
}

/** Smallest prefix that still leaves room for `hosts` usable addresses. */
export function prefixForHosts(hosts: number): number {
  for (let p = 32; p >= 0; p--) {
    if (2 ** (32 - p) - 2 >= hosts) return p;
  }
  return 0;
}

/* ================================================================== *
 * 6.7 — DHCP
 * ================================================================== */

export const DHCP_STEPS = [
  {
    step: "Discover",
    from: "Client",
    to: "Broadcast",
    detail: "The new host has no address yet, so it shouts to the whole LAN: is there a DHCP server out there?",
    src: "0.0.0.0",
    dst: "255.255.255.255",
  },
  {
    step: "Offer",
    from: "Server",
    to: "Client",
    detail: "A DHCP server replies with an address it is willing to lend, plus the subnet mask, gateway and DNS server.",
    src: "192.168.1.1",
    dst: "255.255.255.255",
  },
  {
    step: "Request",
    from: "Client",
    to: "Broadcast",
    detail: "The client formally asks for that address. It broadcasts again so any other server that made an offer knows to withdraw it.",
    src: "0.0.0.0",
    dst: "255.255.255.255",
  },
  {
    step: "Acknowledge",
    from: "Server",
    to: "Client",
    detail: "The server confirms the lease and how long it lasts. Only now may the client use the address.",
    src: "192.168.1.1",
    dst: "192.168.1.42",
  },
];

/* ================================================================== *
 * 6.8 — Ports and transport
 * ================================================================== */

export const WELL_KNOWN_PORTS = [
  { port: 20, name: "FTP data", transport: "TCP" },
  { port: 21, name: "FTP control", transport: "TCP" },
  { port: 22, name: "SSH", transport: "TCP" },
  { port: 25, name: "SMTP — sending mail", transport: "TCP" },
  { port: 53, name: "DNS", transport: "UDP" },
  { port: 67, name: "DHCP server", transport: "UDP" },
  { port: 80, name: "HTTP", transport: "TCP" },
  { port: 110, name: "POP3 — reading mail", transport: "TCP" },
  { port: 161, name: "SNMP", transport: "UDP" },
  { port: 443, name: "HTTPS", transport: "TCP" },
] as const;

export type Transport = "tcp" | "udp";

export const TRANSPORTS: Record<
  Transport,
  { name: string; long: string; traits: { label: string; has: boolean }[]; apps: string[]; blurb: string }
> = {
  tcp: {
    name: "TCP",
    long: "Transmission Control Protocol",
    blurb:
      "Connection-oriented. A handshake sets the connection up, every segment is acknowledged, and anything lost is sent again — so the receiving application gets exactly what was sent, in order.",
    traits: [
      { label: "Sets up a connection first", has: true },
      { label: "Acknowledges every segment", has: true },
      { label: "Retransmits anything lost", has: true },
      { label: "Delivers in the original order", has: true },
      { label: "Controls congestion", has: true },
      { label: "Low overhead", has: false },
    ],
    apps: ["Web browsing (HTTP / HTTPS)", "Email (SMTP, POP3, IMAP)", "File transfer (FTP)", "Remote login (SSH)"],
  },
  udp: {
    name: "UDP",
    long: "User Datagram Protocol",
    blurb:
      "Connectionless. Each datagram is fired off on its own with no handshake, no acknowledgement and no retransmission. Fast and simple, but the application must cope with loss and reordering itself.",
    traits: [
      { label: "Sets up a connection first", has: false },
      { label: "Acknowledges every segment", has: false },
      { label: "Retransmits anything lost", has: false },
      { label: "Delivers in the original order", has: false },
      { label: "Controls congestion", has: false },
      { label: "Low overhead", has: true },
    ],
    apps: ["DNS lookups", "SNMP network management", "DHCP", "Live video and voice calls", "Online games"],
  },
};

/* ================================================================== *
 * 6.9 — DNS
 * ================================================================== */

export type DnsNode = { label: string; kind: "root" | "tld" | "second" | "host"; children?: DnsNode[] };

export const DNS_TREE: DnsNode = {
  label: ".",
  kind: "root",
  children: [
    {
      label: "lk",
      kind: "tld",
      children: [
        { label: "gov", kind: "second", children: [{ label: "www", kind: "host" }] },
        { label: "ac", kind: "second", children: [{ label: "cmb", kind: "host" }] },
      ],
    },
    {
      label: "com",
      kind: "tld",
      children: [
        { label: "example", kind: "second", children: [{ label: "www", kind: "host" }, { label: "mail", kind: "host" }] },
        { label: "wikipedia", kind: "second", children: [{ label: "www", kind: "host" }] },
      ],
    },
    {
      label: "org",
      kind: "tld",
      children: [{ label: "ietf", kind: "second", children: [{ label: "www", kind: "host" }] }],
    },
  ],
};

export const TOP_LEVEL_DOMAINS = [
  { tld: ".com", what: "Commercial organisations", kind: "generic" },
  { tld: ".org", what: "Non-profit organisations", kind: "generic" },
  { tld: ".net", what: "Network infrastructure", kind: "generic" },
  { tld: ".edu", what: "Educational institutions", kind: "generic" },
  { tld: ".gov", what: "Government bodies", kind: "generic" },
  { tld: ".lk", what: "Sri Lanka", kind: "country" },
  { tld: ".uk", what: "United Kingdom", kind: "country" },
  { tld: ".in", what: "India", kind: "country" },
];

/** The servers a resolver walks, in order, to answer one query. */
export const DNS_RESOLUTION = [
  {
    to: "Local resolver",
    ask: "www.example.com — what is the IP?",
    answer: "Not in my cache. I will find out.",
    detail: "Your computer asks the resolver configured by DHCP, usually at your ISP or your router.",
  },
  {
    to: "Root server",
    ask: "www.example.com?",
    answer: "I do not know, but ask the .com servers — here they are.",
    detail: "The thirteen root server addresses are built into every resolver. Root servers know only the top-level domains.",
  },
  {
    to: ".com server",
    ask: "www.example.com?",
    answer: "I do not know, but example.com is handled by ns1.example.com.",
    detail: "The TLD server knows which name servers are authoritative for each domain registered under it.",
  },
  {
    to: "example.com server",
    ask: "www.example.com?",
    answer: "93.184.216.34.",
    detail: "This is the authoritative server — the one the domain's own administrator controls. Its answer is the real one.",
  },
  {
    to: "Back to the client",
    ask: "—",
    answer: "93.184.216.34, cached for next time.",
    detail: "The resolver caches the answer so the next lookup for this name skips the whole walk.",
  },
];

/* ================================================================== *
 * 6.9 — HTTP
 * ================================================================== */

export const HTTP_REQUEST = [
  { line: "GET /index.html HTTP/1.1", note: "The method, the resource wanted, and the protocol version." },
  { line: "Host: www.example.com", note: "Which site — one server can host many, so this is required in HTTP/1.1." },
  { line: "User-Agent: Mozilla/5.0", note: "What is asking. Servers sometimes vary the response on this." },
  { line: "Accept: text/html", note: "What formats the client can handle." },
  { line: "", note: "A blank line marks the end of the headers." },
];

export const HTTP_RESPONSE = [
  { line: "HTTP/1.1 200 OK", note: "The status line. 200 means the request succeeded." },
  { line: "Content-Type: text/html", note: "What is being returned, so the browser knows how to read it." },
  { line: "Content-Length: 1256", note: "How many bytes of body follow." },
  { line: "", note: "Blank line again — everything after this is the body." },
  { line: "<html>…</html>", note: "The resource itself." },
];

export const HTTP_STATUS = [
  { code: "200", meaning: "OK — here is what you asked for", tone: "ok" },
  { code: "301", meaning: "Moved permanently — look here instead", tone: "neutral" },
  { code: "404", meaning: "Not found — no such resource on this server", tone: "warn" },
  { code: "500", meaning: "Internal server error — the server broke", tone: "bad" },
] as const;

/* ================================================================== *
 * 6.12 — ISPs and the access link
 * ================================================================== */

export const ISP_SERVICES = [
  {
    name: "A path to the rest of the Internet",
    what: "The ISP is already connected to other networks, so buying a connection to the ISP buys reachability to everything they can reach.",
  },
  {
    name: "A public IP address",
    what: "Addresses are allocated in blocks to ISPs, who lend one to each customer. Without it your traffic has no return address the Internet can route to.",
  },
  {
    name: "Name resolution",
    what: "A DNS resolver, handed to your router automatically, so names can be turned into addresses.",
  },
  {
    name: "Extra services",
    what: "Mail accounts, web hosting, and increasingly television and telephone over the same line.",
  },
];

export type AccessLink = {
  id: "dialup" | "adsl" | "sdsl";
  name: string;
  long: string;
  /** Downstream and upstream capacity in bits per second. */
  down: number;
  up: number;
  alwaysOn: boolean;
  /** What happens to the telephone while the link is in use. */
  voice: string;
  how: string;
  series: number;
};

export const ACCESS_LINKS: AccessLink[] = [
  {
    id: "dialup",
    name: "Dial-up",
    long: "Voice-band modem over a dial-up line",
    down: 56_000,
    up: 33_600,
    alwaysOn: false,
    voice: "The line is busy — nobody can call in or out",
    how: "The modem dials the ISP's number, and the data is modulated into the same 300 Hz – 3.4 kHz band a voice would occupy. The exchange treats it as an ordinary call.",
    series: 4,
  },
  {
    id: "adsl",
    name: "ADSL",
    long: "Asymmetric Digital Subscriber Line",
    down: 8_000_000,
    up: 1_000_000,
    alwaysOn: true,
    voice: "Unaffected — voice and data use different frequencies on the same pair",
    how: "The copper pair can carry far more than the 4 kHz the telephone system reserves for speech. ADSL uses the frequencies above that band, leaving the voice band alone.",
    series: 0,
  },
  {
    id: "sdsl",
    name: "SDSL",
    long: "Symmetric Digital Subscriber Line",
    down: 2_000_000,
    up: 2_000_000,
    alwaysOn: true,
    voice: "The whole pair is used for data — no telephone on this line",
    how: "The same idea as ADSL, but the capacity is split evenly. Chosen by a business that has to send as much as it receives, such as one hosting its own server.",
    series: 1,
  },
];

/** Seconds to move `bytes` over a link of `bitsPerSecond`. */
export const transferTime = (bytes: number, bitsPerSecond: number): number =>
  (bytes * 8) / bitsPerSecond;

/** A duration in a form a student would say out loud. */
export function formatDuration(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)} s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s ? `${m} min ${s} s` : `${m} min`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Bits per second in the unit a student would quote. */
export function formatRate(bps: number): string {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(bps % 1_000_000 ? 1 : 0)} Mbps`;
  return `${Math.round(bps / 1000)} kbps`;
}

/**
 * How ADSL divides the copper pair. The voice band is left where it has always
 * been, and the two data bands sit above it — the upstream band deliberately
 * narrower than the downstream one, which is where the "asymmetric" comes from.
 */
export const ADSL_BANDS = [
  { name: "Voice", from: 0, to: 4_000, what: "The ordinary telephone call, untouched", series: 2 },
  { name: "Upstream", from: 25_000, to: 138_000, what: "Data from you to the ISP", series: 3 },
  { name: "Downstream", from: 138_000, to: 1_104_000, what: "Data from the ISP to you", series: 0 },
];

/* ================================================================== *
 * 6.12 — NAT
 * ================================================================== */

export const HOME_PUBLIC_IP = "203.0.113.24";

export type HomeHost = { name: string; ip: string; kind: string; series: number };

export const HOME_HOSTS: HomeHost[] = [
  { name: "Laptop", ip: "192.168.1.10", kind: "browsing a web page", series: 0 },
  { name: "Phone", ip: "192.168.1.11", kind: "loading a map", series: 1 },
  { name: "Tablet", ip: "192.168.1.12", kind: "playing a video", series: 3 },
];

export type NatEntry = {
  id: number;
  host: HomeHost;
  privatePort: number;
  publicPort: number;
  remoteIp: string;
  remotePort: number;
};

/**
 * The router hands out a fresh public port for every conversation, because the
 * public port is the only thing distinguishing one internal host from another
 * once the private address has been rewritten away.
 */
export const NAT_PORT_BASE = 51000;

export const nextPublicPort = (entries: NatEntry[]): number =>
  NAT_PORT_BASE + entries.length;

/** The two rewrites, written out as the router would perform them. */
export function natOutbound(entry: NatEntry) {
  return {
    before: `${entry.host.ip}:${entry.privatePort} → ${entry.remoteIp}:${entry.remotePort}`,
    after: `${HOME_PUBLIC_IP}:${entry.publicPort} → ${entry.remoteIp}:${entry.remotePort}`,
  };
}

export function natInbound(entry: NatEntry) {
  return {
    before: `${entry.remoteIp}:${entry.remotePort} → ${HOME_PUBLIC_IP}:${entry.publicPort}`,
    after: `${entry.remoteIp}:${entry.remotePort} → ${entry.host.ip}:${entry.privatePort}`,
  };
}

/* ================================================================== *
 * 6.12 — Proxies
 * ================================================================== */

export const PROXY_JOBS = [
  {
    name: "Caching",
    what: "Keeps a copy of pages that have been fetched recently. The next person to ask for the same page is served from the proxy, so the ISP link is not used at all.",
    series: 2,
  },
  {
    name: "One point of contact",
    what: "Servers on the Internet see only the proxy's address. Every machine behind it can share one public address without needing one of its own.",
    series: 1,
  },
  {
    name: "Filtering and logging",
    what: "Because every request passes through it, a proxy can refuse some sites and keep a record of what was requested — which is why schools and offices use them.",
    series: 3,
  },
];

/** Pages used by the proxy cache demonstration. */
export const PROXY_PAGES = [
  { url: "school.lk/timetable", size: "48 kB" },
  { url: "news.lk/headlines", size: "310 kB" },
  { url: "wikipedia.org/Networks", size: "126 kB" },
];
