/**
 * Reference models for competency level 6.10 — the OSI seven-layer model, the
 * TCP/IP four-layer model, and the encapsulation that happens as data moves
 * down one stack and back up the other.
 *
 * The layer tables are reference data; the encapsulation is computed, so the
 * byte figures in the diagram, the readouts and the quiz all come from the
 * same arithmetic.
 */

export type Layer = {
  id: string;
  /** Layer number within its own model, counted from the bottom. */
  n: number;
  name: string;
  /** One sentence: what this layer is responsible for. */
  role: string;
  /** The specific jobs, in the wording the paper expects. */
  jobs: string[];
  /** Protocol data unit at this layer. */
  unit: string;
  /** Protocols, devices or standards that live here. */
  examples: string[];
  /**
   * Series colour index. Every OSI layer carries the colour of the TCP/IP layer
   * it maps to, so the correspondence between the two models is legible without
   * reading a single label.
   */
  series: number;
};

/* ================================================================== *
 * The OSI model — seven layers, top to bottom
 * ================================================================== */

export const OSI_LAYERS: Layer[] = [
  {
    id: "osi-application",
    n: 7,
    name: "Application",
    role: "Provides network services directly to the user's programs.",
    jobs: [
      "Gives applications a way to use the network",
      "Defines the messages a service exchanges — a request and its response",
      "Identifies resources and services by name",
    ],
    unit: "Data",
    examples: ["HTTP", "FTP", "SMTP", "DNS", "Telnet"],
    series: 0,
  },
  {
    id: "osi-presentation",
    n: 6,
    name: "Presentation",
    role: "Puts data into a form both machines agree on.",
    jobs: [
      "Translates between the sender's and the receiver's data formats",
      "Character encoding, so text means the same at both ends",
      "Encryption and compression",
    ],
    unit: "Data",
    examples: ["ASCII / Unicode", "JPEG", "Encryption"],
    series: 0,
  },
  {
    id: "osi-session",
    n: 5,
    name: "Session",
    role: "Sets up, keeps and ends the conversation between two applications.",
    jobs: [
      "Establishes a session and closes it cleanly at the end",
      "Decides whose turn it is to send — dialogue control",
      "Inserts checkpoints so a long transfer can resume rather than restart",
    ],
    unit: "Data",
    examples: ["Login sessions", "Remote procedure calls"],
    series: 0,
  },
  {
    id: "osi-transport",
    n: 4,
    name: "Transport",
    role: "Delivers data end to end, from one process to another process.",
    jobs: [
      "Identifies the end points with port numbers",
      "Splits a long message into segments and reassembles them",
      "Reliability, flow control and error recovery — if the protocol offers them",
    ],
    unit: "Segment",
    examples: ["TCP", "UDP"],
    series: 1,
  },
  {
    id: "osi-network",
    n: 3,
    name: "Network",
    role: "Gets a packet across many networks to the destination host.",
    jobs: [
      "Logical addressing that does not depend on the hardware — IP addresses",
      "Routing: choosing a path from the sender to the receiver",
      "Fragmenting a packet when the next network cannot carry it whole",
    ],
    unit: "Packet",
    examples: ["IP", "ICMP", "Routers"],
    series: 2,
  },
  {
    id: "osi-datalink",
    n: 2,
    name: "Data link",
    role: "Moves a frame across one link, between two directly connected devices.",
    jobs: [
      "Framing — marking where the data begins and ends",
      "Physical (MAC) addressing on the local network",
      "Media access control, and error detection with a checksum",
    ],
    unit: "Frame",
    examples: ["Ethernet", "MAC addresses", "Switches"],
    series: 3,
  },
  {
    id: "osi-physical",
    n: 1,
    name: "Physical",
    role: "Puts raw bits onto the medium as a signal.",
    jobs: [
      "Defines voltages, light pulses or radio signals for a 0 and a 1",
      "Bit timing — how long one bit lasts",
      "Cables, connectors and pin layouts",
    ],
    unit: "Bit",
    examples: ["Cables", "Connectors", "Hubs", "Repeaters"],
    series: 3,
  },
];

/* ================================================================== *
 * The TCP/IP model — four layers, top to bottom
 * ================================================================== */

export const TCPIP_LAYERS: Layer[] = [
  {
    id: "tcp-application",
    n: 4,
    name: "Application",
    role: "The applications and processes that use the network.",
    jobs: [
      "Everything the OSI model splits across application, presentation and session",
      "Each application protocol defines its own message format",
      "Formatting and encryption are left to the application itself",
    ],
    unit: "Data",
    examples: ["FTP", "Telnet", "SMTP", "HTTP", "DNS"],
    series: 0,
  },
  {
    id: "tcp-transport",
    n: 3,
    name: "Transport",
    role: "Provides end-to-end data delivery between two hosts.",
    jobs: [
      "Process-to-process delivery using port numbers",
      "TCP adds a connection, acknowledgements and retransmission",
      "UDP adds almost nothing, and is quicker for it",
    ],
    unit: "Segment",
    examples: ["TCP", "UDP"],
    series: 1,
  },
  {
    id: "tcp-internet",
    n: 2,
    name: "Internet",
    role: "Defines the datagram and handles the routing of data.",
    jobs: [
      "Defines the IP datagram and the IP addressing scheme",
      "Routes datagrams across interconnected networks",
      "Isolates the upper layers from whatever the physical network happens to be",
    ],
    unit: "Packet",
    examples: ["IP", "ICMP", "ARP"],
    series: 2,
  },
  {
    id: "tcp-hostnet",
    n: 1,
    name: "Host to network",
    role: "The routines for getting onto whatever physical network is in use.",
    jobs: [
      "Encapsulates the IP datagram into a frame",
      "Maps IP addresses to physical (MAC) addresses",
      "Defines how the bits are actually delivered to the next device",
    ],
    unit: "Frame, then bits",
    examples: ["Ethernet", "Wi-Fi", "Cables and connectors"],
    series: 3,
  },
];

/** Which OSI layers each TCP/IP layer absorbs — the comparison the paper asks for. */
export const MODEL_MAP: Record<string, string[]> = {
  "tcp-application": ["osi-application", "osi-presentation", "osi-session"],
  "tcp-transport": ["osi-transport"],
  "tcp-internet": ["osi-network"],
  "tcp-hostnet": ["osi-datalink", "osi-physical"],
};

/** The reverse lookup, so clicking either column highlights the other. */
export const OSI_TO_TCPIP: Record<string, string> = Object.entries(MODEL_MAP).reduce(
  (acc, [tcp, osis]) => {
    for (const o of osis) acc[o] = tcp;
    return acc;
  },
  {} as Record<string, string>,
);

export const MODEL_DIFFERENCES: { osi: string; tcpip: string }[] = [
  { osi: "Seven layers", tcpip: "Four layers" },
  {
    osi: "Defined first, as a reference; protocols were written to fit it afterwards",
    tcpip: "The protocols came first, and the model describes what was already working",
  },
  {
    osi: "Presentation and session are layers of their own",
    tcpip: "Both are left to the application layer",
  },
  {
    osi: "Data link and physical are separate layers",
    tcpip: "Combined into one host-to-network layer",
  },
  {
    osi: "A teaching and reference model — rarely implemented as it stands",
    tcpip: "What the Internet actually runs on",
  },
];

/* ================================================================== *
 * Encapsulation
 *
 * Real header sizes, so the overhead a student reads off the diagram is the
 * overhead a real Ethernet link carries.
 * ================================================================== */

export type EncapStep = {
  layer: string;
  /** What the unit is called once this layer has finished with it. */
  unit: string;
  headerBytes: number;
  trailerBytes: number;
  /** What the header this layer adds is actually for. */
  adds: string;
  series: number;
};

export const ENCAP_STEPS: EncapStep[] = [
  {
    layer: "Application",
    unit: "Data",
    headerBytes: 0,
    trailerBytes: 0,
    adds: "The message itself — the text of a request, or part of a file.",
    series: 0,
  },
  {
    layer: "Transport",
    unit: "Segment",
    headerBytes: 20,
    trailerBytes: 0,
    adds: "Source and destination port numbers, a sequence number and a checksum.",
    series: 1,
  },
  {
    layer: "Internet",
    unit: "Packet",
    headerBytes: 20,
    trailerBytes: 0,
    adds: "Source and destination IP addresses, and a time-to-live.",
    series: 2,
  },
  {
    layer: "Data link",
    unit: "Frame",
    headerBytes: 14,
    trailerBytes: 4,
    adds: "Source and destination MAC addresses in front, a frame check sequence behind.",
    series: 3,
  },
  {
    layer: "Physical",
    unit: "Bits",
    headerBytes: 0,
    trailerBytes: 0,
    adds: "No header — the frame becomes a stream of signal elements on the medium.",
    series: 3,
  },
];

/** The smallest Ethernet payload. Anything shorter is padded up to it. */
export const MIN_FRAME_PAYLOAD = 46;

export type EncapLevel = {
  step: EncapStep;
  /** What arrived from the layer above. */
  payloadBytes: number;
  /** Padding added to reach the Ethernet minimum, data link only. */
  padBytes: number;
  /** Size of the whole unit once this layer has wrapped it. */
  totalBytes: number;
};

export type Encapsulation = {
  levels: EncapLevel[];
  /** The original application data. */
  dataBytes: number;
  /** Everything that is not application data. */
  overheadBytes: number;
  /** Bytes handed to the physical layer. */
  frameBytes: number;
  bitsOnWire: number;
  /** Fraction of the frame that is the student's actual data, 0–1. */
  efficiency: number;
};

/**
 * Wrap `dataBytes` of application data down the stack.
 *
 * Padding matters here: a two-byte message does not produce a tiny frame, it
 * produces the 64-byte minimum, and that is where "small messages are
 * inefficient" comes from.
 */
export function encapsulate(dataBytes: number): Encapsulation {
  const levels: EncapLevel[] = [];
  let carried = dataBytes;

  for (const step of ENCAP_STEPS) {
    const payloadBytes = carried;
    let padBytes = 0;
    if (step.layer === "Data link" && payloadBytes < MIN_FRAME_PAYLOAD) {
      padBytes = MIN_FRAME_PAYLOAD - payloadBytes;
    }
    const totalBytes = payloadBytes + padBytes + step.headerBytes + step.trailerBytes;
    levels.push({ step, payloadBytes, padBytes, totalBytes });
    carried = totalBytes;
  }

  const frameBytes = carried;
  return {
    levels,
    dataBytes,
    overheadBytes: frameBytes - dataBytes,
    frameBytes,
    bitsOnWire: frameBytes * 8,
    efficiency: frameBytes === 0 ? 0 : dataBytes / frameBytes,
  };
}

/* ================================================================== *
 * Data flow — down the sender's stack, across, up the receiver's
 * ================================================================== */

export type FlowStep = {
  /** Which side of the link is working. */
  side: "sender" | "wire" | "receiver";
  /** Index into TCPIP_LAYERS, or null on the wire. */
  layer: number | null;
  title: string;
  detail: string;
  unit: string;
};

/**
 * One journey, described in TCP/IP terms. The sender adds a header at each
 * layer and the receiver strips exactly the same header off — which is the
 * whole point of a layered model: each layer talks to its opposite number.
 */
export const FLOW: FlowStep[] = [
  {
    side: "sender",
    layer: 0,
    title: "The browser writes a request",
    detail: "An application produces data. Nothing has been added to it yet — this is the message a person cares about.",
    unit: "Data",
  },
  {
    side: "sender",
    layer: 1,
    title: "Transport adds ports",
    detail: "TCP puts a header in front carrying the source and destination port numbers, so the receiving machine knows which program the data belongs to. The result is a segment.",
    unit: "Segment",
  },
  {
    side: "sender",
    layer: 2,
    title: "The Internet layer adds IP addresses",
    detail: "IP wraps the segment in a header carrying the source and destination IP addresses. The result is a packet, and it can now be routed anywhere.",
    unit: "Packet",
  },
  {
    side: "sender",
    layer: 3,
    title: "Host to network builds a frame",
    detail: "MAC addresses for the next hop go in front and a checksum goes behind. The result is a frame, addressed only as far as the next device on this link.",
    unit: "Frame",
  },
  {
    side: "wire",
    layer: null,
    title: "Bits cross the medium",
    detail: "The frame becomes a signal — voltages on copper, light in fibre, radio in the air. On the medium itself there is nothing but a stream of bits.",
    unit: "Bits",
  },
  {
    side: "receiver",
    layer: 3,
    title: "Host to network checks and unwraps the frame",
    detail: "The receiver checks the frame is addressed to it and that the checksum matches, then strips the frame header and trailer off.",
    unit: "Packet",
  },
  {
    side: "receiver",
    layer: 2,
    title: "The Internet layer reads the IP header",
    detail: "The destination IP address is this machine, so the packet has arrived. The IP header comes off, leaving a segment.",
    unit: "Segment",
  },
  {
    side: "receiver",
    layer: 1,
    title: "Transport reads the port number",
    detail: "The port number says which process is waiting for this. TCP puts segments back in order and strips its header off.",
    unit: "Data",
  },
  {
    side: "receiver",
    layer: 0,
    title: "The server application reads the request",
    detail: "What the application receives is exactly what the sending application wrote — every header added on the way down has been removed on the way up.",
    unit: "Data",
  },
];
