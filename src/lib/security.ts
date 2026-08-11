/**
 * Security maths and reference data for competency level 6.11.
 *
 * The RSA here is real RSA, just with primes small enough that every step can
 * be shown in full — a student can check 8³ mod 55 = 17 by hand, which is the
 * only way "the public key encrypts, the private key decrypts" stops being a
 * slogan. Everything is pure, so the same arithmetic drives the animation, the
 * readouts and the answers.
 */

/* ================================================================== *
 * Modular arithmetic
 * ================================================================== */

/** Fast modular exponentiation: base^exp mod m, without overflowing. */
export function modPow(base: number, exp: number, m: number): number {
  let result = 1;
  let b = base % m;
  let e = exp;
  while (e > 0) {
    if (e & 1) result = (result * b) % m;
    b = (b * b) % m;
    e >>= 1;
  }
  return result;
}

export function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

/** The d in e·d ≡ 1 (mod φ), found by trial — φ is tiny here. */
export function modInverse(e: number, phi: number): number | null {
  for (let d = 1; d < phi; d++) if ((e * d) % phi === 1) return d;
  return null;
}

/* ================================================================== *
 * Symmetric encryption — one shared key
 * ================================================================== */

const A = "A".charCodeAt(0);

/** Shift each letter on by `key` places. Non-letters pass through untouched. */
export function shiftCipher(text: string, key: number): string {
  return text
    .toUpperCase()
    .split("")
    .map((ch) => {
      const c = ch.charCodeAt(0);
      if (c < A || c > A + 25) return ch;
      return String.fromCharCode(A + (((c - A + key) % 26) + 26) % 26);
    })
    .join("");
}

/* ================================================================== *
 * Asymmetric encryption — a key pair
 * ================================================================== */

export type KeyPair = {
  p: number;
  q: number;
  /** The modulus, p·q. Public. */
  n: number;
  /** (p−1)(q−1) — used to find d, then thrown away. */
  phi: number;
  /** Public exponent. Published with n as the public key. */
  e: number;
  /** Private exponent. Never leaves the owner. */
  d: number;
};

export function makeKeyPair(p: number, q: number, e: number): KeyPair | null {
  const n = p * q;
  const phi = (p - 1) * (q - 1);
  if (gcd(e, phi) !== 1) return null;
  const d = modInverse(e, phi);
  return d === null ? null : { p, q, n, phi, e, d };
}

/**
 * The worked pair used throughout the lesson: p = 5, q = 11, e = 3 gives
 * n = 55, φ = 40 and d = 27. Every value from 0 to 54 survives a round trip.
 */
export const DEMO_KEYS: KeyPair = makeKeyPair(5, 11, 3)!;

/** Letters carry their position: A = 1 … Z = 26, all comfortably below n. */
export const letterToNumber = (ch: string): number => ch.toUpperCase().charCodeAt(0) - A + 1;
export const numberToLetter = (n: number): string =>
  n >= 1 && n <= 26 ? String.fromCharCode(A + n - 1) : "?";

/** Encrypting and decrypting are the same operation with different exponents. */
export const rsa = (m: number, exponent: number, n: number): number => modPow(m, exponent, n);

export type CipherRow = { letter: string; plain: number; cipher: number; recovered: number };

/** Encrypt a short word letter by letter, and decrypt it straight back. */
export function encryptWord(word: string, keys: KeyPair): CipherRow[] {
  return word
    .toUpperCase()
    .split("")
    .filter((ch) => ch >= "A" && ch <= "Z")
    .map((letter) => {
      const plain = letterToNumber(letter);
      const cipher = rsa(plain, keys.e, keys.n);
      return { letter, plain, cipher, recovered: rsa(cipher, keys.d, keys.n) };
    });
}

/* ================================================================== *
 * Digital signatures
 * ================================================================== */

/**
 * A stand-in for a cryptographic hash: small enough to sign with the demo key,
 * and sensitive enough that changing one character changes the digest. A real
 * hash is 256 bits and far harder to collide, but it plays exactly this role.
 */
export function digest(text: string, n: number): number {
  let h = 7;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) % 1000003;
  }
  return h % n;
}

export type SignedMessage = {
  text: string;
  /** Digest of the text as it stands now. */
  hash: number;
  /** The signature that travelled with the message. */
  signature: number;
  /** What the public key recovers from the signature. */
  recovered: number;
  valid: boolean;
};

/** Sign with the private key: the one operation only the owner can perform. */
export function signMessage(text: string, keys: KeyPair): number {
  return rsa(digest(text, keys.n), keys.d, keys.n);
}

/**
 * Verify with the public key. The signature is checked against a digest of the
 * message *as received* — which is why altering the text breaks it.
 */
export function verifyMessage(text: string, signature: number, keys: KeyPair): SignedMessage {
  const hash = digest(text, keys.n);
  const recovered = rsa(signature, keys.e, keys.n);
  return { text, hash, signature, recovered, valid: recovered === hash };
}

/* ================================================================== *
 * Threats
 * ================================================================== */

export type Threat = {
  id: string;
  name: string;
  what: string;
  how: string;
  tell: string;
  /** Whether it needs a person to be fooled, or spreads on its own. */
  needsVictim: boolean;
  series: number;
};

export const THREATS: Threat[] = [
  {
    id: "virus",
    name: "Virus",
    what: "A program that attaches itself to another file or program, runs when that host is run, and copies itself into more files.",
    how: "Arrives inside something you already wanted — a document, a game, a copied USB stick — and performs its malicious activity without you knowing.",
    tell: "Files changing size or date on their own; programs starting slowly; antivirus alerts.",
    needsVictim: true,
    series: 4,
  },
  {
    id: "trojan",
    name: "Trojan horse",
    what: "A malicious program that invades a computer by misleading users about what it is.",
    how: "Pretends to be something useful — a free utility, a codec, a cracked game — so the user installs it willingly. It does not copy itself; it does not need to.",
    tell: "Software that asks for far more permission than its job requires; downloads from outside the official source.",
    needsVictim: true,
    series: 3,
  },
  {
    id: "malware",
    name: "Malware",
    what: "The umbrella term: any software written for a malicious purpose.",
    how: "Viruses, trojans, worms, spyware and ransomware are all malware. The word describes the intent, not the technique.",
    tell: "Unexpected pop-ups, an unfamiliar browser home page, network activity when you are doing nothing.",
    needsVictim: false,
    series: 1,
  },
  {
    id: "phishing",
    name: "Phishing",
    what: "An attempt to obtain sensitive information — usernames, passwords, card details — by pretending to be someone trustworthy.",
    how: "A message that looks like it comes from your bank or your school, with an urgent reason to click a link and log in on a page that is not theirs.",
    tell: "Urgency, a threat, a slightly wrong address, and a link whose text and destination disagree.",
    needsVictim: true,
    series: 0,
  },
];

/* ================================================================== *
 * Phishing drill
 *
 * A made-up message from an invented bank. The clue segments are marked in the
 * data so the drill can score which ones the student actually found.
 * ================================================================== */

export type TextRun = {
  text: string;
  /** Present when this run is one of the giveaways. */
  clue?: { id: string; why: string };
};

export type MessagePart = { label: string; runs: TextRun[]; mono?: boolean };

export type SampleMessage = {
  id: string;
  verdict: "phishing" | "genuine";
  parts: MessagePart[];
};

export const PHISHING_SAMPLE: SampleMessage = {
  id: "phish",
  verdict: "phishing",
  parts: [
    {
      label: "From",
      mono: true,
      runs: [
        { text: "Ridgeway Bank Security " },
        {
          text: "<security@ridgeway-bank-verify.info>",
          clue: {
            id: "from",
            why: "The display name says Ridgeway Bank, but the actual address is on ridgeway-bank-verify.info — a domain anyone could register. A bank's mail comes from the bank's own domain, and the display name is free text that the sender chooses.",
          },
        },
      ],
    },
    {
      label: "Subject",
      runs: [
        {
          text: "URGENT: your account will be closed within 24 hours",
          clue: {
            id: "urgency",
            why: "Manufactured urgency is the core trick. A deadline stops you checking, and the fear of losing access is what makes an otherwise careful person click. Real institutions do not close accounts by email in a day.",
          },
        },
      ],
    },
    {
      label: "Body",
      runs: [
        { text: "Dear " },
        {
          text: "Valued Customer",
          clue: {
            id: "greeting",
            why: "Your bank knows your name — it is on the account. A generic greeting means the sender does not know who you are, because the same message went to thousands of addresses at once.",
          },
        },
        { text: ", we detected an unusual login to your account. To keep your account active you must " },
        {
          text: "confirm your password and card PIN",
          clue: {
            id: "credentials",
            why: "No bank, school or service will ever ask for your password or PIN — not by email, not by phone, not in person. They do not need it, because they can verify you in other ways. Any request for one is an attack.",
          },
        },
        { text: " immediately. " },
        {
          text: "Failure to responde will result in permanant suspension.",
          clue: {
            id: "spelling",
            why: "'Responde' and 'permanant' are both misspelt. Messages from a real organisation are proofread; sloppy language is a strong signal that the sender is not who they claim.",
          },
        },
      ],
    },
    {
      label: "Link",
      mono: true,
      runs: [
        {
          text: "www.ridgewaybank.lk/secure-login → 203.0.113.51/rb/login.php",
          clue: {
            id: "link",
            why: "The text of the link and where it actually goes are two different things. Hovering over it reveals the real destination — here a bare IP address, not the bank at all. Always read the destination, never the text.",
          },
        },
      ],
    },
    {
      label: "Attachment",
      mono: true,
      runs: [
        {
          text: "account_form.pdf.exe",
          clue: {
            id: "attachment",
            why: "The real extension is the last one: .exe, a program. The .pdf in front is there to make it look like a document. Opening it runs the attacker's code with your permissions.",
          },
        },
      ],
    },
  ],
};

export const GENUINE_SAMPLE: SampleMessage = {
  id: "genuine",
  verdict: "genuine",
  parts: [
    {
      label: "From",
      mono: true,
      runs: [{ text: "Ridgeway Bank <statements@ridgewaybank.lk>" }],
    },
    { label: "Subject", runs: [{ text: "Your monthly statement is ready" }] },
    {
      label: "Body",
      runs: [
        {
          text: "Dear S. Perera, your statement for March is available. Sign in at our website by typing the address yourself, or use the mobile app. We will never ask you for your password or PIN.",
        },
      ],
    },
    { label: "Link", mono: true, runs: [{ text: "no link — you are asked to navigate there yourself" }] },
    { label: "Attachment", mono: true, runs: [{ text: "none" }] },
  ],
};

/** Every clue in the phishing sample, in reading order. */
export const PHISH_CLUES = PHISHING_SAMPLE.parts
  .flatMap((p) => p.runs)
  .filter((r): r is TextRun & { clue: NonNullable<TextRun["clue"]> } => Boolean(r.clue))
  .map((r) => r.clue);

/* ================================================================== *
 * Firewalls
 * ================================================================== */

export type FirewallRule = {
  id: string;
  action: "allow" | "deny";
  direction: "in" | "out";
  protocol: "TCP" | "UDP" | "any";
  /** A port number, or "any" to match every port. */
  port: number | "any";
  what: string;
};

/**
 * A default-deny rule set: anything not explicitly permitted is blocked.
 * Rules are tested top to bottom and the first match wins, which is why the
 * order of two rules can change what a firewall does.
 */
export const FIREWALL_RULES: FirewallRule[] = [
  { id: "r1", action: "allow", direction: "out", protocol: "any", port: "any", what: "Anything this network starts is allowed out" },
  { id: "r2", action: "allow", direction: "in", protocol: "TCP", port: 80, what: "Incoming web requests to our own web server" },
  { id: "r3", action: "allow", direction: "in", protocol: "TCP", port: 443, what: "The same, over HTTPS" },
  { id: "r4", action: "allow", direction: "in", protocol: "UDP", port: 53, what: "DNS answers coming back to our resolver" },
  { id: "r5", action: "deny", direction: "in", protocol: "any", port: "any", what: "Default: block everything else arriving" },
];

export type TrafficSample = {
  id: string;
  label: string;
  direction: "in" | "out";
  protocol: "TCP" | "UDP";
  port: number;
  detail: string;
};

export const TRAFFIC_SAMPLES: TrafficSample[] = [
  { id: "t1", label: "A student loads a web page", direction: "out", protocol: "TCP", port: 443, detail: "Started from inside the network, so it is ordinary use." },
  { id: "t2", label: "Someone visits our web server", direction: "in", protocol: "TCP", port: 80, detail: "The server exists to be reached, so port 80 must be open." },
  { id: "t3", label: "An outsider probes for remote login", direction: "in", protocol: "TCP", port: 22, detail: "Nobody outside should be opening an SSH session into the school network." },
  { id: "t4", label: "An outsider tries the file-sharing port", direction: "in", protocol: "TCP", port: 445, detail: "A classic worm target. There is no reason for this to arrive from the Internet." },
  { id: "t5", label: "A DNS reply comes back", direction: "in", protocol: "UDP", port: 53, detail: "The answer to a lookup one of our own machines asked for." },
  { id: "t6", label: "Malware phones home from a lab PC", direction: "out", protocol: "TCP", port: 6667, detail: "Outbound, so this rule set lets it through — a firewall alone cannot save an already-infected machine." },
];

export type FirewallVerdict = { action: "allow" | "deny"; rule: FirewallRule | null };

/** First matching rule wins; nothing matching at all is denied. */
export function firewallDecide(rules: FirewallRule[], t: TrafficSample): FirewallVerdict {
  for (const rule of rules) {
    if (rule.direction !== t.direction) continue;
    if (rule.protocol !== "any" && rule.protocol !== t.protocol) continue;
    if (rule.port !== "any" && rule.port !== t.port) continue;
    return { action: rule.action, rule };
  }
  return { action: "deny", rule: null };
}

/* ================================================================== *
 * Protection measures
 * ================================================================== */

export const PROTECTIONS = [
  {
    name: "Firewall",
    what: "Sits between the network and the Internet and checks every packet against a list of rules, blocking anything not permitted.",
    stops: ["Unwanted connections from outside", "Access to services that should not be public"],
    limit: "It cannot see inside traffic you allowed, and it does nothing about malware carried in by a user.",
    series: 1,
  },
  {
    name: "Antivirus software",
    what: "Scans files and running programs for known malicious code, then quarantines or removes what it finds.",
    stops: ["Known viruses, trojans and other malware", "Infected files arriving by mail or USB"],
    limit: "It can only recognise what its database describes, so an out-of-date scanner is close to useless.",
    series: 2,
  },
  {
    name: "Education and good practice",
    what: "Strong, unique passwords; suspicion of unexpected messages; updates installed promptly; backups kept separately.",
    stops: ["Phishing", "Trojans the user would otherwise install", "Password guessing"],
    limit: "It depends on every person, every time — which is exactly why it needs to be taught rather than assumed.",
    series: 0,
  },
] as const;

/* ================================================================== *
 * Password strength
 * ================================================================== */

export type PasswordStrength = {
  length: number;
  /** How many different characters an attacker must try per position. */
  pool: number;
  /** log2(pool^length) — the number of bits of guessing needed. */
  bits: number;
  crackTime: string;
  verdict: "very weak" | "weak" | "reasonable" | "strong";
  /** Which character sets are present. */
  sets: { label: string; used: boolean; size: number }[];
};

/** A modern attacker with commodity hardware, guessing offline. */
const GUESSES_PER_SECOND = 1e10;

export function passwordStrength(pw: string): PasswordStrength {
  const sets = [
    { label: "lower case", used: /[a-z]/.test(pw), size: 26 },
    { label: "upper case", used: /[A-Z]/.test(pw), size: 26 },
    { label: "digits", used: /[0-9]/.test(pw), size: 10 },
    { label: "symbols", used: /[^a-zA-Z0-9]/.test(pw), size: 33 },
  ];
  const pool = sets.reduce((sum, s) => sum + (s.used ? s.size : 0), 0);
  const bits = pw.length === 0 || pool === 0 ? 0 : pw.length * Math.log2(pool);
  // Half the space, on average, before a guess lands.
  const seconds = bits === 0 ? 0 : (2 ** (bits - 1)) / GUESSES_PER_SECOND;

  const verdict: PasswordStrength["verdict"] =
    bits < 28 ? "very weak" : bits < 45 ? "weak" : bits < 65 ? "reasonable" : "strong";

  return { length: pw.length, pool, bits, crackTime: describeSeconds(seconds), verdict, sets };
}

/** Crack times span from "instantly" to numbers with no useful name. */
function describeSeconds(s: number): string {
  if (s < 1) return "instantly";
  if (!Number.isFinite(s)) return "longer than the universe has existed";

  const scale: [number, string][] = [
    [1, "second"],
    [60, "minute"],
    [3600, "hour"],
    [86400, "day"],
    [86400 * 365, "year"],
  ];
  let unit = scale[0];
  for (const entry of scale) if (s >= entry[0]) unit = entry;

  const value = s / unit[0];
  // Past a million years the figure stops meaning anything, so give the order
  // of magnitude instead of a number nobody can read.
  if (unit[1] === "year" && value >= 1e6) return `about 10^${Math.floor(Math.log10(value))} years`;

  const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  return `about ${rounded.toLocaleString("en-GB")} ${unit[1]}${rounded === 1 ? "" : "s"}`;
}
