/**
 * Every term the paper expects a definition for, in one place.
 *
 * A student meeting "attenuation" again in 6.12 should not have to remember
 * which level taught it, so each entry carries the level and the section that
 * explains it properly. The definitions here are deliberately one sentence:
 * they are a reminder, not a replacement for the lesson.
 */

export type GlossaryEntry = {
  term: string;
  /** One sentence, in the wording the paper expects. */
  definition: string;
  /** Competency level that teaches it. */
  lessonId: string;
  /** Section anchor within that lesson. */
  sectionId: string;
  /** Alternative spellings and abbreviations, so search finds them too. */
  aka?: string[];
};

export const GLOSSARY: GlossaryEntry[] = [
  /* ---- 6.1 Signals ---- */
  {
    term: "Signal",
    definition: "An electrical voltage, current or wave that varies with time and is used to carry information from one place to another.",
    lessonId: "signals",
    sectionId: "what",
  },
  {
    term: "Analog signal",
    definition: "A signal that varies continuously and can take any value in a range, so it has infinitely many levels.",
    lessonId: "signals",
    sectionId: "compare",
  },
  {
    term: "Digital signal",
    definition: "A signal that takes only a fixed set of discrete levels, with nothing in between them.",
    lessonId: "signals",
    sectionId: "compare",
  },
  {
    term: "Amplitude",
    definition: "The height of a wave from its rest position, which is how strong the signal is.",
    lessonId: "signals",
    sectionId: "lab",
  },
  {
    term: "Frequency",
    definition: "The number of complete cycles a wave makes in one second, measured in hertz.",
    lessonId: "signals",
    sectionId: "lab",
    aka: ["Hz", "hertz"],
  },
  {
    term: "Wavelength",
    definition: "The distance between two neighbouring points at the same stage of the wave, such as crest to crest.",
    lessonId: "signals",
    sectionId: "lab",
    aka: ["lambda"],
  },
  {
    term: "Phase",
    definition: "How far into its cycle a wave has already travelled at the moment you start measuring, given as an angle.",
    lessonId: "signals",
    sectionId: "phase",
  },
  {
    term: "Period",
    definition: "The time taken for one complete cycle, which is one divided by the frequency.",
    lessonId: "signals",
    sectionId: "lab",
  },
  {
    term: "Propagation speed",
    definition: "How fast a signal travels through a medium, equal to frequency multiplied by wavelength.",
    lessonId: "signals",
    sectionId: "speed",
    aka: ["v = f lambda"],
  },

  /* ---- 6.2 Media ---- */
  {
    term: "Guided media",
    definition: "A medium that confines the signal to a physical path, such as twisted pair, coaxial cable or optical fibre. Also called bounded media.",
    lessonId: "media",
    sectionId: "guided",
    aka: ["bounded media"],
  },
  {
    term: "Unguided media",
    definition: "A medium that radiates the signal into free space with no physical path steering it, such as radio, microwave, infrared or visible light. Also called unbounded media.",
    lessonId: "media",
    sectionId: "guided",
    aka: ["unbounded media", "wireless"],
  },
  {
    term: "Twisted pair",
    definition: "Pairs of copper wires twisted together so that interference picked up by one wire is cancelled by the other.",
    lessonId: "media",
    sectionId: "cables",
    aka: ["UTP", "STP"],
  },
  {
    term: "Coaxial cable",
    definition: "A copper core surrounded by insulation and a braided shield, which gives it better noise immunity than twisted pair.",
    lessonId: "media",
    sectionId: "cables",
    aka: ["coax"],
  },
  {
    term: "Optical fibre",
    definition: "A glass core that carries pulses of light, giving very high bandwidth, very low attenuation and complete immunity to electrical noise.",
    lessonId: "media",
    sectionId: "cables",
    aka: ["fiber", "fibre optic"],
  },
  {
    term: "Bandwidth",
    definition: "The capacity of a medium, defined as the difference between the highest and lowest frequencies it can carry.",
    lessonId: "media",
    sectionId: "impair",
  },
  {
    term: "Latency",
    definition: "The delay between sending a signal and its arrival at the far end.",
    lessonId: "media",
    sectionId: "impair",
    aka: ["delay"],
  },
  {
    term: "Throughput",
    definition: "The amount of data actually delivered per second, which is usually less than the bandwidth the medium promises.",
    lessonId: "media",
    sectionId: "impair",
  },
  {
    term: "Attenuation",
    definition: "The loss of signal strength as the signal travels through a medium.",
    lessonId: "media",
    sectionId: "impair",
  },
  {
    term: "Distortion",
    definition: "A change in the shape of the signal, caused by different frequency components travelling at different speeds.",
    lessonId: "media",
    sectionId: "impair",
  },
  {
    term: "Noise",
    definition: "Unwanted energy added to the signal on the way, which the receiver cannot tell apart from the signal itself.",
    lessonId: "media",
    sectionId: "impair",
  },
  {
    term: "Simplex",
    definition: "Transmission in one direction only, so one end always sends and the other always receives.",
    lessonId: "media",
    sectionId: "modes",
  },
  {
    term: "Half duplex",
    definition: "Transmission in both directions, but only one direction at a time.",
    lessonId: "media",
    sectionId: "modes",
  },
  {
    term: "Full duplex",
    definition: "Transmission in both directions at the same time.",
    lessonId: "media",
    sectionId: "modes",
  },
  {
    term: "Multiplexing",
    definition: "Carrying several separate conversations over one medium at the same time, by dividing it up in time, frequency, wavelength or code.",
    lessonId: "media",
    sectionId: "mux",
    aka: ["TDM", "FDM", "WDM", "CDM"],
  },

  /* ---- 6.3 Encoding ---- */
  {
    term: "Encoding",
    definition: "The agreed rule that turns bits into signal elements, so the receiver can read back what the sender meant.",
    lessonId: "encoding",
    sectionId: "protocol",
  },
  {
    term: "NRZ",
    definition: "Non-return to zero: each bit is held at one of two voltage levels for the whole bit time, with no return to zero in between.",
    lessonId: "encoding",
    sectionId: "encoder",
    aka: ["NRZ-L", "NRZ-I", "non-return to zero"],
  },
  {
    term: "Manchester encoding",
    definition: "A scheme where every bit has a transition in the middle of its bit time, so the signal carries the clock along with the data.",
    lessonId: "encoding",
    sectionId: "encoder",
  },
  {
    term: "Bit rate",
    definition: "The number of bits sent per second.",
    lessonId: "encoding",
    sectionId: "rate",
    aka: ["bps"],
  },
  {
    term: "Baud rate",
    definition: "The number of signal elements sent per second, which equals the bit rate only when each element carries exactly one bit.",
    lessonId: "encoding",
    sectionId: "rate",
  },
  {
    term: "Synchronisation",
    definition: "Keeping the sender's and the receiver's clocks in step, so the receiver samples each bit in the middle of its own bit time.",
    lessonId: "encoding",
    sectionId: "sync",
    aka: ["clock drift"],
  },
  {
    term: "Parity bit",
    definition: "One extra bit added to make the number of ones in the group even or odd, so a single flipped bit can be detected.",
    lessonId: "encoding",
    sectionId: "parity",
    aka: ["even parity", "odd parity", "error detection"],
  },
  {
    term: "ASK",
    definition: "Amplitude shift keying: the carrier's amplitude changes with each bit while its frequency and phase stay fixed.",
    lessonId: "encoding",
    sectionId: "keying",
    aka: ["amplitude shift keying"],
  },
  {
    term: "FSK",
    definition: "Frequency shift keying: the carrier's frequency changes with each bit while its amplitude and phase stay fixed.",
    lessonId: "encoding",
    sectionId: "keying",
    aka: ["frequency shift keying"],
  },
  {
    term: "PSK",
    definition: "Phase shift keying: the carrier's phase changes with each bit while its amplitude and frequency stay fixed.",
    lessonId: "encoding",
    sectionId: "keying",
    aka: ["phase shift keying"],
  },

  /* ---- 6.4 PSTN ---- */
  {
    term: "PSTN",
    definition: "The public switched telephone network: the circuit-switched network built to carry the human voice.",
    lessonId: "pstn",
    sectionId: "pstn",
    aka: ["public switched telephone network", "telephone network"],
  },
  {
    term: "Circuit switching",
    definition: "A dedicated path is set up between the two ends for the whole call, and it stays reserved whether or not anything is being sent.",
    lessonId: "pstn",
    sectionId: "pstn",
  },
  {
    term: "Modem",
    definition: "A device that modulates digital data onto an analog carrier to send it, and demodulates the carrier back into data at the other end.",
    lessonId: "pstn",
    sectionId: "link",
    aka: ["modulator demodulator"],
  },
  {
    term: "Modulation",
    definition: "Varying one property of a carrier wave, its amplitude, frequency or phase, so the carrier carries the data.",
    lessonId: "pstn",
    sectionId: "modulation",
    aka: ["AM", "FM", "PM"],
  },
  {
    term: "PCM",
    definition: "Pulse code modulation: turning an analog signal into digital by sampling it at regular intervals and rounding each sample to the nearest level.",
    lessonId: "pstn",
    sectionId: "pcm",
    aka: ["pulse code modulation", "sampling", "quantisation"],
  },

  /* ---- 6.5 Topologies ---- */
  {
    term: "Topology",
    definition: "The arrangement of the links between the devices on a network.",
    lessonId: "topologies",
    sectionId: "topologies",
  },
  {
    term: "Bus topology",
    definition: "Every device shares one cable, so only one may transmit at a time and a break in the cable affects everyone.",
    lessonId: "topologies",
    sectionId: "topologies",
  },
  {
    term: "Star topology",
    definition: "Every device has its own link to a central hub or switch, so one failed link affects only that device.",
    lessonId: "topologies",
    sectionId: "topologies",
  },
  {
    term: "Ring topology",
    definition: "Each device connects to two neighbours forming a closed loop, and data travels around the ring.",
    lessonId: "topologies",
    sectionId: "topologies",
  },
  {
    term: "Mesh topology",
    definition: "Every device has a direct link to every other, which is the most reliable arrangement and by far the most expensive.",
    lessonId: "topologies",
    sectionId: "topologies",
  },
  {
    term: "Hub",
    definition: "A physical layer device that repeats an incoming signal out of every other port, so all ports share one collision domain.",
    lessonId: "topologies",
    sectionId: "hubswitch",
  },
  {
    term: "Switch",
    definition: "A data link layer device that reads MAC addresses and forwards each frame only to the port the destination is on.",
    lessonId: "topologies",
    sectionId: "hubswitch",
  },
  {
    term: "Collision",
    definition: "Two devices transmitting on the shared medium at the same time, so both signals are spoiled and both must be sent again.",
    lessonId: "topologies",
    sectionId: "collision",
  },

  /* ---- 6.6 MAC ---- */
  {
    term: "MAC address",
    definition: "A 48-bit address burned into a network interface that identifies it on the local network, written as twelve hexadecimal digits.",
    lessonId: "mac",
    sectionId: "mac",
    aka: ["physical address", "hardware address"],
  },
  {
    term: "Frame",
    definition: "The unit of data at the data link layer: the payload wrapped in a header with MAC addresses and a trailer with an error check.",
    lessonId: "mac",
    sectionId: "frame",
  },
  {
    term: "Pure ALOHA",
    definition: "A device transmits whenever it has data and retries after a random wait if the frame collided. Its peak throughput is about 18 per cent.",
    lessonId: "mac",
    sectionId: "access",
    aka: ["ALOHA"],
  },
  {
    term: "Slotted ALOHA",
    definition: "Transmission may begin only at the start of a time slot, which halves the window for a collision and doubles the peak throughput to about 37 per cent.",
    lessonId: "mac",
    sectionId: "access",
  },
  {
    term: "CSMA/CD",
    definition: "Carrier sense multiple access with collision detection: listen before transmitting, and if a collision still happens, stop at once and retry after a random wait.",
    lessonId: "mac",
    sectionId: "access",
    aka: ["carrier sense", "CSMA"],
  },
  {
    term: "Unicast",
    definition: "A frame addressed to exactly one recipient.",
    lessonId: "mac",
    sectionId: "delivery",
  },
  {
    term: "Multicast",
    definition: "A frame addressed to a group, delivered to every member of that group and to nobody else.",
    lessonId: "mac",
    sectionId: "delivery",
  },
  {
    term: "Broadcast",
    definition: "A frame addressed to every device on the local network, using the address FF:FF:FF:FF:FF:FF.",
    lessonId: "mac",
    sectionId: "delivery",
  },

  /* ---- 6.7 Internet ---- */
  {
    term: "IP address",
    definition: "A 32-bit logical address identifying a host on a network, written as four octets in decimal separated by dots.",
    lessonId: "internet",
    sectionId: "address",
    aka: ["IPv4", "octet"],
  },
  {
    term: "IPv6",
    definition: "The 128-bit addressing scheme that replaces IPv4, written as eight groups of four hexadecimal digits.",
    lessonId: "internet",
    sectionId: "address",
  },
  {
    term: "Subnet mask",
    definition: "Thirty-two bits laid alongside an address, a one wherever the bit belongs to the network and a zero wherever it belongs to the host.",
    lessonId: "internet",
    sectionId: "subnet",
    aka: ["network mask", "netmask"],
  },
  {
    term: "Network address",
    definition: "The first address of a block, with every host bit set to zero. It names the network and cannot be given to a host.",
    lessonId: "internet",
    sectionId: "subnet",
  },
  {
    term: "Broadcast address",
    definition: "The last address of a block, with every host bit set to one. It reaches every host on that network and cannot be given to one.",
    lessonId: "internet",
    sectionId: "subnet",
  },
  {
    term: "Subnetting",
    definition: "Borrowing bits from the host part to use as network bits, which doubles the number of networks for each bit borrowed and halves the size of each.",
    lessonId: "internet",
    sectionId: "split",
    aka: ["FLSM", "VLSM"],
  },
  {
    term: "Private IP address",
    definition: "An address from a range reserved for use inside private networks, which is never routed on the Internet.",
    lessonId: "internet",
    sectionId: "private",
  },
  {
    term: "DHCP",
    definition: "Dynamic Host Configuration Protocol: a server hands a host its address and settings automatically, through discover, offer, request and acknowledge.",
    lessonId: "internet",
    sectionId: "private",
    aka: ["DORA", "dynamic addressing"],
  },
  {
    term: "Gateway",
    definition: "A device sitting in two networks that passes traffic between them, translating between their different addressing or protocols where needed.",
    lessonId: "internet",
    sectionId: "gateway",
  },
  {
    term: "Router",
    definition: "A network layer device that reads IP addresses and forwards each packet towards its destination using a routing table.",
    lessonId: "internet",
    sectionId: "routing",
  },
  {
    term: "Packet switching",
    definition: "A message is split into packets, each carrying the destination address and each forwarded independently, possibly by different paths.",
    lessonId: "internet",
    sectionId: "routing",
  },
  {
    term: "VPN",
    definition: "A virtual private network: an encrypted tunnel across a public network that makes two distant sites behave as one private network.",
    lessonId: "internet",
    sectionId: "scale",
    aka: ["virtual private network", "tunnel"],
  },
  {
    term: "LAN, MAN and WAN",
    definition: "Labels for how much ground a network covers: one site, one city, and one country or more.",
    lessonId: "internet",
    sectionId: "scale",
    aka: ["LAN", "MAN", "WAN", "PAN"],
  },

  /* ---- 6.8 Transport ---- */
  {
    term: "Port number",
    definition: "A sixteen-bit number identifying which program on a machine a segment belongs to, so one address can serve many applications.",
    lessonId: "transport",
    sectionId: "ports",
    aka: ["well-known port"],
  },
  {
    term: "TCP",
    definition: "Transmission Control Protocol: connection oriented and reliable. It acknowledges what arrives and retransmits what does not.",
    lessonId: "transport",
    sectionId: "compare",
    aka: ["transmission control protocol"],
  },
  {
    term: "UDP",
    definition: "User Datagram Protocol: connectionless and unreliable. Each datagram is sent once with no handshake and no retransmission, which makes it fast.",
    lessonId: "transport",
    sectionId: "compare",
    aka: ["user datagram protocol"],
  },

  /* ---- 6.9 Applications ---- */
  {
    term: "DNS",
    definition: "The Domain Name System: the distributed directory that turns a human-readable name into the IP address behind it.",
    lessonId: "applications",
    sectionId: "tree",
    aka: ["domain name system", "name resolution"],
  },
  {
    term: "URL",
    definition: "A uniform resource locator: the full address of a resource, giving the protocol, the host name, the path and any query.",
    lessonId: "applications",
    sectionId: "resolve",
    aka: ["uniform resource locator"],
  },
  {
    term: "HTTP",
    definition: "Hypertext Transfer Protocol: the request and response protocol a browser uses to fetch a web page.",
    lessonId: "applications",
    sectionId: "http",
    aka: ["HTTPS"],
  },
  {
    term: "FTP",
    definition: "File Transfer Protocol: a protocol for moving whole files between a client and a server.",
    lessonId: "applications",
    sectionId: "http",
    aka: ["file transfer protocol"],
  },
  {
    term: "Client-server model",
    definition: "Dedicated servers hold the resources and clients request them, so management is central but the server is a single point of failure.",
    lessonId: "applications",
    sectionId: "journey",
  },
  {
    term: "Peer-to-peer model",
    definition: "Every machine is both client and server, sharing resources directly with no central server.",
    lessonId: "applications",
    sectionId: "journey",
    aka: ["P2P"],
  },

  /* ---- 6.10 Models ---- */
  {
    term: "OSI model",
    definition: "A seven-layer reference model: application, presentation, session, transport, network, data link and physical.",
    lessonId: "models",
    sectionId: "stack",
    aka: ["open systems interconnection", "seven layers"],
  },
  {
    term: "TCP/IP model",
    definition: "A four-layer reference model: application, transport, Internet and host to network. It does the same job as OSI with fewer lines drawn.",
    lessonId: "models",
    sectionId: "stack",
  },
  {
    term: "Encapsulation",
    definition: "Adding a header at each layer as data moves down the stack, so each layer wraps what the layer above handed it.",
    lessonId: "models",
    sectionId: "units",
    aka: ["decapsulation"],
  },
  {
    term: "Protocol data unit",
    definition: "The name of the data at a given layer: data at the top three, segment at transport, packet at network, frame at data link and bits at physical.",
    lessonId: "models",
    sectionId: "units",
    aka: ["PDU", "segment", "packet"],
  },
  {
    term: "Best effort delivery",
    definition: "IP will try to deliver a packet but makes no promise that it will arrive, arrive in order, or arrive only once.",
    lessonId: "models",
    sectionId: "units",
  },
  {
    term: "Repeater",
    definition: "A physical layer device that regenerates a weakened signal so it can travel further.",
    lessonId: "models",
    sectionId: "devices",
  },
  {
    term: "Bridge",
    definition: "A data link layer device that joins two network segments and forwards frames between them based on MAC addresses.",
    lessonId: "models",
    sectionId: "devices",
  },
  {
    term: "Network interface card",
    definition: "The hardware that connects a device to a network and carries its MAC address.",
    lessonId: "models",
    sectionId: "devices",
    aka: ["NIC"],
  },

  /* ---- 6.11 Security ---- */
  {
    term: "Encryption",
    definition: "Turning a readable message into an unreadable one using a key, so that only a holder of the matching key can read it.",
    lessonId: "security",
    sectionId: "keys",
    aka: ["decryption", "cipher"],
  },
  {
    term: "Symmetric key encryption",
    definition: "One shared secret key both encrypts and decrypts, which is fast but requires the two parties to exchange the key safely first.",
    lessonId: "security",
    sectionId: "keys",
  },
  {
    term: "Asymmetric key encryption",
    definition: "A public key encrypts and the matching private key decrypts, so strangers can communicate securely without ever sharing a secret.",
    lessonId: "security",
    sectionId: "keys",
    aka: ["public key", "private key", "RSA"],
  },
  {
    term: "Digital signature",
    definition: "A digest of the message scrambled with the sender's private key, which anyone can check with the public key to prove who sent it and that it is unchanged.",
    lessonId: "security",
    sectionId: "sign",
  },
  {
    term: "Confidentiality",
    definition: "The guarantee that only the intended recipient can read the message.",
    lessonId: "security",
    sectionId: "need",
  },
  {
    term: "Authentication",
    definition: "The guarantee that the sender really is who the message claims they are.",
    lessonId: "security",
    sectionId: "need",
  },
  {
    term: "Virus",
    definition: "Malicious code that attaches itself to another program and spreads when that program is run.",
    lessonId: "security",
    sectionId: "threats",
    aka: ["worm", "trojan horse", "malware"],
  },
  {
    term: "Phishing",
    definition: "A message that impersonates someone trusted to trick the reader into giving up credentials. It attacks the person, not the machine.",
    lessonId: "security",
    sectionId: "threats",
  },
  {
    term: "Firewall",
    definition: "A device or program that decides what traffic may cross the boundary of a network, by checking it against a list of rules in order.",
    lessonId: "security",
    sectionId: "protect",
  },
  {
    term: "Antivirus",
    definition: "Software that detects and removes malware already on a machine.",
    lessonId: "security",
    sectionId: "protect",
  },

  /* ---- 6.12 ISP ---- */
  {
    term: "ISP",
    definition: "An Internet service provider: the company that connects a home or business to the rest of the Internet.",
    lessonId: "isp",
    sectionId: "isp",
    aka: ["internet service provider"],
  },
  {
    term: "ADSL",
    definition: "Asymmetric digital subscriber line: broadband over the existing telephone line, using frequencies above the voice band and giving more downstream than upstream.",
    lessonId: "isp",
    sectionId: "access",
    aka: ["DSL", "broadband"],
  },
  {
    term: "Dial-up",
    definition: "Internet access over a voice call through a modem, limited to the 4 kHz voice band and so to about 56 kbit/s.",
    lessonId: "isp",
    sectionId: "access",
  },
  {
    term: "NAT",
    definition: "Network address translation: the router rewrites private source addresses to its one public address, and uses a table to send the replies back to the right machine.",
    lessonId: "isp",
    sectionId: "nat",
    aka: ["network address translation"],
  },
  {
    term: "Proxy server",
    definition: "A server that fetches pages on behalf of clients and caches them, so a repeated request is served without going out to the Internet again.",
    lessonId: "isp",
    sectionId: "proxy",
    aka: ["cache"],
  },
];

/** Ranked search over the glossary. Exact and prefix matches come first. */
export function searchGlossary(query: string): GlossaryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { e: GlossaryEntry; score: number }[] = [];
  for (const e of GLOSSARY) {
    const term = e.term.toLowerCase();
    const aka = (e.aka ?? []).map((a) => a.toLowerCase());
    let score = -1;
    if (term === q || aka.includes(q)) score = 0;
    else if (term.startsWith(q) || aka.some((a) => a.startsWith(q))) score = 1;
    else if (term.includes(q) || aka.some((a) => a.includes(q))) score = 2;
    else if (e.definition.toLowerCase().includes(q)) score = 3;
    if (score >= 0) scored.push({ e, score });
  }
  return scored.sort((a, b) => a.score - b.score || a.e.term.localeCompare(b.e.term)).map((s) => s.e);
}
