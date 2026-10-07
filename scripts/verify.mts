/**
 * Independent checks of the computed content against hand-worked values.
 *
 * The site's premise is that every number on screen is computed rather than
 * typed in, which only helps if the computation is right. These checks work
 * the same problems by hand (subnet boundaries, RSA round-trips, the ALOHA
 * throughput peaks at 1/(2e) and 1/e) and compare.
 *
 *   npm run verify
 */
import { subnetOf, ipToInt, intToIp, prefixToMask, maskToPrefix, classOf, isPrivate,
         prefixForHosts, splitBlock, macThroughput, transferTime, formatDuration } from "../src/lib/network.ts";
import { modPow, makeKeyPair, DEMO_KEYS, shiftCipher, firewallDecide,
         FIREWALL_RULES, TRAFFIC_SAMPLES } from "../src/lib/security.ts";
import { wavelength, frequencyFrom, period, MEDIA_SPEED, C } from "../src/lib/signal.ts";
import { GLOSSARY } from "../src/lib/glossary.ts";
import { LESSONS } from "../src/lib/curriculum.ts";

let fail = 0, pass = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) === JSON.stringify(want)) {
    pass++;
  } else {
    fail++;
    console.log(`FAIL ${name}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`);
  }
};
const near = (name: string, got: number, want: number, tol = 1e-6) => {
  if (Math.abs(got - want) <= tol * Math.max(1, Math.abs(want))) {
    pass++;
  } else {
    fail++;
    console.log(`FAIL ${name}: got ${got} want ${want}`);
  }
};

/* ---- IPv4 / subnetting (hand-worked) ---- */
const a = ipToInt("192.168.1.130")!;
const s = subnetOf(a, 26);
eq("192.168.1.130/26 network", intToIp(s.network), "192.168.1.128");
eq("192.168.1.130/26 broadcast", intToIp(s.broadcast), "192.168.1.191");
eq("192.168.1.130/26 first host", intToIp(s.firstHost), "192.168.1.129");
eq("192.168.1.130/26 last host", intToIp(s.lastHost), "192.168.1.190");
eq("192.168.1.130/26 usable hosts", s.usableHosts, 62);
eq("192.168.1.130/26 total addresses", s.totalAddresses, 64);
eq("/31 has no usable hosts", subnetOf(a, 31).usableHosts, 0);
eq("/32 firstHost is null", subnetOf(a, 32).firstHost, null);
eq("/24 mask", intToIp(prefixToMask(24)), "255.255.255.0");
eq("/26 mask", intToIp(prefixToMask(26)), "255.255.255.192");
eq("/30 mask", intToIp(prefixToMask(30)), "255.255.255.252");
eq("mask->prefix 255.255.240.0", maskToPrefix(ipToInt("255.255.240.0")!), 20);
eq("mask->prefix invalid 255.0.255.0", maskToPrefix(ipToInt("255.0.255.0")!), null);
eq("class of 10.0.0.1", classOf(ipToInt("10.0.0.1")!), "A");
eq("class of 128.0.0.1", classOf(ipToInt("128.0.0.1")!), "B");
eq("class of 192.0.0.1", classOf(ipToInt("192.0.0.1")!), "C");
eq("class of 224.0.0.1", classOf(ipToInt("224.0.0.1")!), "D");
eq("class of 240.0.0.1", classOf(ipToInt("240.0.0.1")!), "E");
eq("class of 127.0.0.1 (loopback)", classOf(ipToInt("127.0.0.1")!), null);
eq("private 192.168.0.5", isPrivate(ipToInt("192.168.0.5")!), true);
eq("private 172.16.0.1", isPrivate(ipToInt("172.16.0.1")!), true);
eq("private 172.32.0.1", isPrivate(ipToInt("172.32.0.1")!), false);
eq("private 8.8.8.8", isPrivate(ipToInt("8.8.8.8")!), false);
// hosts -> prefix: 50 hosts needs 6 host bits (62 usable) => /26
eq("prefixForHosts(50)", prefixForHosts(50), 26);
eq("prefixForHosts(2)", prefixForHosts(2), 30);
eq("prefixForHosts(254)", prefixForHosts(254), 24);
eq("prefixForHosts(255)", prefixForHosts(255), 23);
const sp = splitBlock(ipToInt("192.168.1.0")!, 24, 4);
eq("split /24 into 4 -> prefix", sp.prefix ?? (sp as any).newPrefix, 26);

/* ---- v = f x lambda ---- */
near("wavelength 2.4GHz free space", wavelength(C, 2.4e9), 0.1249135, 1e-4);
near("frequency from 200m in copper", frequencyFrom(MEDIA_SPEED.copper, 200), MEDIA_SPEED.copper / 200);
near("period of 1kHz", period(1000), 0.001);

/* ---- RSA (p=5,q=11,e=3) : n=55, phi=40, d=27 ---- */
eq("DEMO_KEYS n", DEMO_KEYS.n, 55);
eq("DEMO_KEYS e", DEMO_KEYS.e, 3);
eq("DEMO_KEYS d", DEMO_KEYS.d, 27);
near("modPow 2^10 mod 1000", modPow(2, 10, 1000), 24);
// round-trip every letter value that fits under n
let rt = true;
for (let m = 1; m < 55; m++) { if (modPow(modPow(m, 3, 55), 27, 55) !== m) rt = false; }
eq("RSA round-trips every m < n", rt, true);
eq("makeKeyPair(5,11,4) rejected (gcd!=1)", makeKeyPair(5, 11, 4), null);

/* ---- Caesar ---- */
eq("shift HELLO by 3", shiftCipher("HELLO", 3), "KHOOR");
eq("shift back", shiftCipher(shiftCipher("HELLO", 3), -3), "HELLO");
eq("wraps Z", shiftCipher("Z", 1), "A");

/* ---- ALOHA throughput: pure = G e^-2G, slotted = G e^-G ---- */
near("pure ALOHA peak at G=0.5", macThroughput("aloha", 0.5), 0.5 * Math.exp(-1), 1e-9);
near("slotted ALOHA peak at G=1", macThroughput("slotted", 1), Math.exp(-1), 1e-9);
near("pure ALOHA max = 1/(2e) = 0.184", macThroughput("aloha", 0.5), 0.18394, 1e-3);
near("slotted ALOHA max = 1/e = 0.368", macThroughput("slotted", 1), 0.36788, 1e-3);

/* ---- transfer time ---- */
near("1 GB over 10 Mbit/s", transferTime(1e9, 10e6), 800);
eq("formatDuration(90)", typeof formatDuration(90), "string");

/* ---- firewall first-match ---- */
for (const t of TRAFFIC_SAMPLES) {
  const v = firewallDecide(FIREWALL_RULES, t);
  if (!v || typeof v !== "object") { fail++; console.log("FAIL firewall verdict shape", t); }
  else pass++;
}

/* ---- every glossary entry points at a section that exists ---- */
const anchors = new Map(LESSONS.map((l) => [l.id, new Set(l.sections.map((x) => x.id))]));
for (const g of GLOSSARY) {
  const secs = anchors.get(g.lessonId);
  if (!secs?.has(g.sectionId)) { fail++; console.log(`FAIL glossary "${g.term}" -> ${g.lessonId}#${g.sectionId}`); }
  else pass++;
}
const names = GLOSSARY.map((g) => g.term.toLowerCase());
eq("glossary has no duplicate terms", names.filter((t, i) => names.indexOf(t) !== i), []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
