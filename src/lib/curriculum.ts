/**
 * Competency 6 of the GCE A/L ICT syllabus, split into the five competency
 * levels. `outcomes` are quoted from the syllabus so students can check their
 * own coverage against the paper.
 */

export type LessonMeta = {
  id: string;
  code: string;
  title: string;
  tagline: string;
  periods: number;
  /** Number of checkpoint questions, so overall progress is out of the true
      total rather than only the lessons the student has opened. */
  questions: number;
  outcomes: string[];
  contents: string[];
  /** Section anchors, in page order. */
  sections: { id: string; label: string }[];
};

export const LESSONS: LessonMeta[] = [
  {
    id: "signals",
    code: "6.1",
    title: "Signals and their properties",
    tagline: "What a signal is, the four properties that describe it, and how fast it travels.",
    periods: 4,
    questions: 6,
    outcomes: [
      "Graphically represents digital and analog signals and their properties",
      "Solves problems related to the relationship between signal properties",
    ],
    contents: [
      "Signal types: digital, analog",
      "Properties: amplitude, frequency, wavelength, phase",
      "Propagation speed in a medium",
    ],
    sections: [
      { id: "what", label: "What is a signal" },
      { id: "lab", label: "Wave lab" },
      { id: "phase", label: "Phase" },
      { id: "compare", label: "Analog vs digital" },
      { id: "speed", label: "Propagation speed" },
      { id: "check", label: "Check yourself" },
    ],
  },
  {
    id: "media",
    code: "6.2",
    title: "Signal transmission media",
    tagline: "Guided and unguided media, and the five impairments that spoil a signal on the way.",
    periods: 4,
    questions: 6,
    outcomes: [
      "Classifies media as guided and unguided media",
      "Describes how latency, bandwidth, noise, attenuation and distortion affect signal transmission",
    ],
    contents: [
      "Guided media: twisted pair, coaxial cable, fibre optics",
      "Unguided media: free space",
      "Properties: latency, bandwidth, noise, attenuation, distortion",
      "Simple topology: point-to-point connection",
    ],
    sections: [
      { id: "guided", label: "Guided vs unguided" },
      { id: "cables", label: "The media" },
      { id: "sort", label: "Sorting drill" },
      { id: "impair", label: "Impairment lab" },
      { id: "p2p", label: "Point-to-point" },
      { id: "check", label: "Check yourself" },
    ],
  },
  {
    id: "encoding",
    code: "6.3",
    title: "Encoding digital data",
    tagline: "Turning bits into signal elements, keeping two clocks in step, and catching a flipped bit.",
    periods: 4,
    questions: 6,
    outcomes: [
      "Graphically represents encoding of digital data using two voltage levels as well as Manchester encoding",
      "Describes the possibility of using changes in frequency and phase as signal elements",
      "Explains the need for synchronisation and the problems that arise when transmitter and receiver are not synchronised",
      "Compares the relationship between signal element rate and bit rate in two-voltage and Manchester encoding",
      "Describes how the parity bit enables detecting a bit error",
    ],
    contents: [
      "Agreeing on signal elements to represent data (a protocol)",
      "Two voltage levels; frequency and phase as alternatives",
      "Speed of signal elements; the need for synchronisation",
      "Manchester encoding",
      "Handling errors: parity",
    ],
    sections: [
      { id: "protocol", label: "Agreeing on elements" },
      { id: "encoder", label: "Encoding lab" },
      { id: "rate", label: "Baud vs bit rate" },
      { id: "sync", label: "Synchronisation" },
      { id: "keying", label: "Frequency and phase" },
      { id: "parity", label: "Parity" },
      { id: "check", label: "Check yourself" },
    ],
  },
  {
    id: "pstn",
    code: "6.4",
    title: "PSTN and modems",
    tagline: "Sending data down a line built for the human voice.",
    periods: 4,
    questions: 6,
    outcomes: [
      "Describes a PSTN as an analog voice carrying line",
      "Describes how modems modulate analog signals so that they can be sent along a PSTN line",
      "Draws a schematic diagram depicting two computers connected using modems via a PSTN line",
    ],
    contents: [
      "PSTN: a circuit between two points that carries analog voice",
      "Modulation, demodulation and modems",
      "Encoding data using analog signal elements",
      "Connecting two devices using modems",
    ],
    sections: [
      { id: "pstn", label: "The telephone network" },
      { id: "link", label: "End-to-end link" },
      { id: "modulation", label: "Modulation lab" },
      { id: "pcm", label: "PCM sampling" },
      { id: "check", label: "Check yourself" },
    ],
  },
  {
    id: "topologies",
    code: "6.5",
    title: "Connecting many devices",
    tagline: "Why all-to-all fails, what a bus costs you, and what a switch actually does.",
    periods: 4,
    questions: 6,
    outcomes: [
      "Demonstrates the impracticality of connecting a large number of devices in an all-to-all topology",
      "Demonstrates the simplicity of a bus",
      "Draws diagrams of different topologies",
      "Describes the use of hubs and switches to simplify wiring, and compares their functionality",
    ],
    contents: [
      "All-to-all connections are impractical",
      "Bus topology and the media access problem",
      "Star, ring and mesh topologies",
      "Simplifying wiring: hubs and switches",
    ],
    sections: [
      { id: "growth", label: "The all-to-all problem" },
      { id: "topologies", label: "Topology explorer" },
      { id: "collision", label: "Sharing the bus" },
      { id: "hubswitch", label: "Hub vs switch" },
      { id: "check", label: "Check yourself" },
    ],
  },
  {
    id: "mac",
    code: "6.6",
    title: "Media Access Control",
    tagline: "Naming every device, wrapping data in frames, and taking turns on a shared cable.",
    periods: 4,
    questions: 6,
    outcomes: [
      "Describes the need to uniquely name devices (addresses) so that the sender and the receiver can be identified",
      "Explains the role of frames as the unit of transmission",
      "Describes the need of a protocol to ensure orderly access to media with respect to a bus",
      "Briefly describes the evolution of MAC protocols from ALOHA to Ethernet",
    ],
    contents: [
      "Local Area Network (LAN)",
      "Identifying devices: MAC addresses",
      "Frames",
      "Orderly access to the media: ALOHA, and the improvements to Ethernet",
      "Broadcasting and unicasting messages",
    ],
    sections: [
      { id: "lan", label: "The LAN" },
      { id: "mac", label: "MAC addresses" },
      { id: "frame", label: "Frames" },
      { id: "access", label: "Taking turns" },
      { id: "delivery", label: "Broadcast vs unicast" },
      { id: "check", label: "Check yourself" },
    ],
  },
  {
    id: "internet",
    code: "6.7",
    title: "Joining networks into the Internet",
    tagline: "IP addresses, subnet masks, DHCP, and how a packet finds its way across the world.",
    periods: 5,
    questions: 8,
    outcomes: [
      "Explains the role of a gateway device in interconnecting two LANs",
      "Explains the need for a uniform, MAC protocol independent addressing scheme and how IP addresses play that role",
      "Describes the role of subnet masks",
      "Calculates subnet masks and IP address ranges given a block of IP addresses and network sizes",
      "Describes how DHCP is used to dynamically assign IP addresses",
      "Describes the role of routers in finding a suitable path from the sender to the receiver",
      "Explains packet switching and best effort delivery in IP networks",
    ],
    contents: [
      "A device connected to two or more networks — the gateway",
      "IPv4 addresses and dotted decimal notation; classes A, B and C",
      "Sub-netting, subnet masks and CIDR notation",
      "Private IP addresses; DHCP",
      "Scarcity of IPv4 addresses and IPv6 as a solution",
      "Routing, routers and packet switching; best effort delivery",
    ],
    sections: [
      { id: "gateway", label: "Gateways" },
      { id: "address", label: "IPv4 addresses" },
      { id: "classes", label: "Classes" },
      { id: "subnet", label: "Subnet calculator" },
      { id: "split", label: "Splitting a block" },
      { id: "private", label: "Private IPs and DHCP" },
      { id: "routing", label: "Routing and packet switching" },
      { id: "check", label: "Check yourself" },
    ],
  },
  {
    id: "transport",
    code: "6.8",
    title: "Transport protocols",
    tagline: "Getting data to the right program on the machine, reliably or quickly — pick one.",
    periods: 3,
    questions: 6,
    outcomes: [
      "Explains that it is not sufficient to deliver a message from one IP address to another by demonstrating that the communication is from process to process",
      "Explains the need for multiplexing messages and how port numbers identify the end points",
      "Briefly describes the functionality of TCP and lists applications that use it",
    ],
    contents: [
      "Delivering data from an application process to another application process",
      "Multiple applications at a host identified by one IP; multiplexing",
      "Ports and port numbers",
      "UDP: properties and applications",
      "TCP: properties and applications",
    ],
    sections: [
      { id: "why", label: "Why an IP is not enough" },
      { id: "ports", label: "Ports and multiplexing" },
      { id: "compare", label: "TCP vs UDP" },
      { id: "race", label: "Delivery race" },
      { id: "check", label: "Check yourself" },
    ],
  },
  {
    id: "applications",
    code: "6.9",
    title: "Applications on the Internet",
    tagline: "Human-friendly names, and the request that fetches a web page.",
    periods: 4,
    questions: 6,
    outcomes: [
      "Describes the need for human friendly names instead of IP addresses",
      "Explains the role of DNS in translating names to IP addresses",
      "Graphically represents the hierarchical and distributed structure of the DNS",
      "Describes a simple GET request and its response in HTTP",
      "Describes the client server model using DNS and HTTP",
    ],
    contents: [
      "Domain Name System: IP addresses are hard to remember",
      "Hierarchical name space; each domain manages the names under it",
      "Top level domains",
      "HTTP",
      "The client server model",
    ],
    sections: [
      { id: "names", label: "Why names" },
      { id: "tree", label: "The DNS hierarchy" },
      { id: "resolve", label: "Resolving a name" },
      { id: "http", label: "HTTP" },
      { id: "journey", label: "The whole journey" },
      { id: "check", label: "Check yourself" },
    ],
  },
];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
export const lessonIndex = (id: string) => LESSONS.findIndex((l) => l.id === id);
