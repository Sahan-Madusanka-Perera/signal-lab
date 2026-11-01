/**
 * Reference models for competency level 6.10: the OSI seven-layer model, the
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
 * The OSI model: seven layers, top to bottom
 * ================================================================== */

export const OSI_LAYERS: Layer[] = [
  {
    id: "osi-application",
    n: 7,
    name: "Application",
    role: "Provides network services directly to the user's programs.",
    jobs: [
      "Gives applications a way to use the network",
      "Defines the messages a service exchanges: a request and its response",
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
      "Decides whose turn it is to send: dialogue control",
      "Adds checkpoints, so a long transfer can continue from the last checkpoint instead of starting again",
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
      "Reliability, flow control and error recovery, if the protocol offers them",
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
      "Logical addressing that does not depend on the hardware: IP addresses",
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
      "Framing: marking where the data begins and ends",
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
      "Bit timing: how long one bit lasts",
      "Cables, connectors and pin layouts",
    ],
    unit: "Bit",
    examples: ["Cables", "Connectors", "Hubs", "Repeaters"],
    series: 3,
  },
];

/* ================================================================== *
 * The TCP/IP model: four layers, top to bottom
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
      "UDP adds almost nothing, which makes it faster",
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
      "Hides the details of the physical network from the layers above",
    ],
    unit: "Packet",
    examples: ["IP", "ICMP", "ARP"],
    series: 2,
  },
  {
    id: "tcp-hostnet",
    n: 1,
    name: "Host to network",
    role: "The methods for putting data onto the physical network that is being used.",
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

/** Which OSI layers each TCP/IP layer absorbs, the comparison the paper asks for. */
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
    osi: "A teaching and reference model, rarely used exactly as written",
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
    adds: "The message itself: the text of a request, or part of a file.",
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
    adds: "No header. The frame becomes a stream of signal elements on the medium.",
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
 * Data flow: down the sender's stack, across, up the receiver's
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
 * layer and the receiver strips exactly the same header off, which is the
 * whole point of a layered model: each layer talks to its opposite number.
 */
export const FLOW: FlowStep[] = [
  {
    side: "sender",
    layer: 0,
    title: "The browser writes a request",
    detail: "An application produces data. Nothing has been added to it yet. This is the message the user wants to send.",
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
    detail: "MAC addresses for the next hop go in front and a checksum goes behind. The result is a frame, addressed only to the next device on this link.",
    unit: "Frame",
  },
  {
    side: "wire",
    layer: null,
    title: "Bits cross the medium",
    detail: "The frame becomes a signal: voltages on copper, light in fibre, radio in the air. On the medium itself there is nothing but a stream of bits.",
    unit: "Bits",
  },
  {
    side: "receiver",
    layer: 3,
    title: "Host to network checks and unwraps the frame",
    detail: "The receiver checks the frame is addressed to it and that the checksum matches, then removes the frame header and trailer.",
    unit: "Frame",
  },
  {
    side: "receiver",
    layer: 2,
    title: "The Internet layer reads the IP header",
    detail: "The destination IP address is this machine, so the packet has arrived. The IP header comes off, leaving a segment.",
    unit: "Packet",
  },
  {
    side: "receiver",
    layer: 1,
    title: "Transport reads the port number",
    detail: "The port number says which process is waiting for this. TCP puts segments back in order and removes its header.",
    unit: "Segment",
  },
  {
    side: "receiver",
    layer: 0,
    title: "The server application reads the request",
    detail: "What the application receives is exactly what the sending application wrote. Every header added on the way down has been removed on the way up.",
    unit: "Data",
  },
];

/* ================================================================== *
 * Networking devices, placed by the layer they work at
 *
 * The layer a device understands is what decides what it can do: a device
 * that only sees voltages cannot make a forwarding decision, and one that
 * reads IP addresses can join two different kinds of network together.
 * ================================================================== */

export type Device = {
  id: string;
  name: string;
  /** OSI layer number it works up to. */
  osiLayer: number;
  /** Index into TCPIP_LAYERS. */
  tcpLayer: number;
  what: string;
  /** The one thing that distinguishes it from the device below it. */
  key: string;
  reads: string;
};

export const NETWORK_DEVICES: Device[] = [
  {
    id: "nic",
    name: "Network interface card",
    osiLayer: 2,
    tcpLayer: 3,
    what: "The hardware that connects one computer to the network. It converts the computer's data into signals for the medium and back again, and holds the MAC address that was stored in it at the factory.",
    key: "Every device that is on a network has one, and it is where the MAC address lives.",
    reads: "Its own MAC address",
  },
  {
    id: "repeater",
    name: "Repeater",
    osiLayer: 1,
    tcpLayer: 3,
    what: "Receives a weakened signal, restores it and sends it again at full strength, so a cable can be longer than attenuation would normally allow.",
    key: "It regenerates the signal rather than simply amplifying it, so noise is not amplified too.",
    reads: "Nothing, since it deals in signals, not data",
  },
  {
    id: "hub",
    name: "Hub",
    osiLayer: 1,
    tcpLayer: 3,
    what: "A multi-port repeater. Whatever arrives on one port is copied to every other port, so the whole hub is one shared collision domain running half duplex.",
    key: "It does not know which device is on which port, so it wastes bandwidth and cannot prevent collisions.",
    reads: "Nothing",
  },
  {
    id: "bridge",
    name: "Bridge",
    osiLayer: 2,
    tcpLayer: 3,
    what: "Joins two LAN segments and learns which MAC addresses are on each side, forwarding a frame across only when it has to.",
    key: "It splits one collision domain into two, which is the idea a switch then applies to every port.",
    reads: "MAC addresses",
  },
  {
    id: "switch",
    name: "Switch",
    osiLayer: 2,
    tcpLayer: 3,
    what: "A multi-port bridge. It builds a table of which MAC address is on which port and sends each frame only to the port it belongs to.",
    key: "Every port is its own collision domain, so many conversations run at once, in full duplex.",
    reads: "MAC addresses",
  },
  {
    id: "ap",
    name: "Wireless access point",
    osiLayer: 2,
    tcpLayer: 3,
    what: "Lets wireless devices join a wired network. It bridges between Wi-Fi and Ethernet and is usually plugged into a switch, or built into the home router.",
    key: "It extends a LAN to devices with no cable, and is the wireless equivalent of a switch port.",
    reads: "MAC addresses",
  },
  {
    id: "router",
    name: "Router",
    osiLayer: 3,
    tcpLayer: 2,
    what: "Connects different networks and chooses which way to send each packet, using a routing table and the destination IP address.",
    key: "It works with IP addresses, so it can join networks that use completely different media.",
    reads: "IP addresses",
  },
  {
    id: "gateway",
    name: "Gateway",
    osiLayer: 7,
    tcpLayer: 0,
    what: "A device that joins two networks which use different protocols, and translates between them. In everyday use the word also means the router that a host sends all non-local traffic to: its default gateway.",
    key: "It can translate as well as forward, which is why it may work all the way up to the application layer.",
    reads: "Whatever it has to translate",
  },
  {
    id: "modem",
    name: "Modem",
    osiLayer: 1,
    tcpLayer: 3,
    what: "Modulates digital data onto an analog signal the local loop can carry, and demodulates the signal coming back.",
    key: "It changes the form of the signal, not the data. Nothing about the packet changes as it passes through.",
    reads: "Nothing",
  },
  {
    id: "firewall",
    name: "Firewall",
    osiLayer: 4,
    tcpLayer: 1,
    what: "Checks traffic entering or leaving a network and allows or blocks it using a list of rules, usually written in terms of addresses, protocols and port numbers.",
    key: "It is the one device here whose job is to stop traffic rather than move it.",
    reads: "Addresses, protocols and ports",
  },
];

/* ================================================================== *
 * A worked example: one web request, followed all the way
 *
 * The same request the Applications lesson uses (www.example.com, port 80),
 * with every address and port filled in, so a student can watch the actual
 * values each layer writes and reads. The addresses are made up but shaped
 * like real ones; 203.0.113.0/24 is the range set aside for examples.
 * ================================================================== */

/** The request the browser writes. 41 bytes, which the scaled diagram can reuse. */
export const EXAMPLE_REQUEST = "GET / HTTP/1.1\r\nHost: www.example.com\r\n\r\n";

export const EXAMPLE_HOSTS = {
  laptop: { name: "Your laptop", ip: "192.168.1.42", mac: "a4:5e:60:c2:19:7e" },
  router: { name: "Home router", ip: "192.168.1.1", lanMac: "3c:52:82:1a:00:01", wanMac: "3c:52:82:1a:00:02" },
  server: { name: "Web server", ip: "93.184.216.34", mac: "00:1a:4b:9c:5d:10" },
  publicIp: "203.0.113.7",
  srcPort: 51234,
  dstPort: 80,
};

/**
 * The frame is rebuilt on every link, so its MAC addresses depend on which hop
 * it is on. The packet inside keeps its destination the whole way; only the
 * TTL ticks down, and the home router's NAT swaps the private source address.
 */
export const EXAMPLE_HOPS = [
  { macFrom: EXAMPLE_HOSTS.laptop.mac, macTo: EXAMPLE_HOSTS.router.lanMac, ipFrom: EXAMPLE_HOSTS.laptop.ip, ttl: 64 },
  { macFrom: EXAMPLE_HOSTS.router.wanMac, macTo: "00:25:9e:4b:71:c3", ipFrom: EXAMPLE_HOSTS.publicIp, ttl: 63 },
  { macFrom: "e8:1c:ba:30:7f:22", macTo: EXAMPLE_HOSTS.server.mac, ipFrom: EXAMPLE_HOSTS.publicIp, ttl: 52 },
] as const;

/** Routers between the home router and the server's own network. */
export const EXAMPLE_MIDDLE_ROUTERS = EXAMPLE_HOPS[1].ttl - EXAMPLE_HOPS[2].ttl;

export type ExampleHeader = "tcp" | "ip" | "eth";
export type ExampleField = "macFrom" | "macTo" | "ipFrom" | "ttl";
export type ExamplePlace = "laptop" | "wire1" | "router" | "wire2" | "server";

export type ExampleStep = {
  at: ExamplePlace;
  /** Index into TCPIP_LAYERS, or null while the unit is on the medium. */
  layer: number | null;
  title: string;
  /** What happens, in plain words. */
  plain: string;
  /** The same step as posting a letter. */
  analogy: string;
  unit: "Data" | "Segment" | "Packet" | "Frame" | "Bits";
  /** How many headers the unit is carrying: 0 is bare data, 3 is a frame. */
  depth: 0 | 1 | 2 | 3;
  /** Which hop's addresses are written in the headers. */
  hop: 0 | 1 | 2;
  /** The part of the unit this layer writes or reads. */
  focus?: ExampleHeader | "data";
  /** What this layer is doing to its header. */
  verb: "writes" | "adds" | "reads" | "removes" | "rebuilds" | "sends";
  /** A header that came off in the step before, shown leaving. */
  removed?: ExampleHeader;
  /** Fields whose values have just changed. */
  changed?: ExampleField[];
  /** Marks a detail that goes beyond the syllabus. */
  extra?: string;
};

export const EXAMPLE_STEPS: ExampleStep[] = [
  {
    at: "laptop",
    layer: 0,
    title: "You press Enter, and the browser writes a request",
    plain:
      "You typed www.example.com. The browser is an application, and it writes a short text message asking the web server for its home page. That text is the data. Nothing has been added to it yet.",
    analogy: "You write a letter.",
    unit: "Data",
    depth: 0,
    hop: 0,
    focus: "data",
    verb: "writes",
  },
  {
    at: "laptop",
    layer: 1,
    title: "Transport adds the port numbers",
    plain:
      "TCP puts a header in front of the data. Its key fields are two port numbers. Port 80 means “give this to the web server program”, and port 51234 is the browser tab that is waiting for the answer. Data plus a TCP header is a segment.",
    analogy: "You put the letter in an envelope and write on it which person in the house it is for.",
    unit: "Segment",
    depth: 1,
    hop: 0,
    focus: "tcp",
    verb: "adds",
  },
  {
    at: "laptop",
    layer: 2,
    title: "The Internet layer adds IP addresses",
    plain:
      "IP wraps the segment in a header with two IP addresses: the laptop’s, and the server’s 93.184.216.34, which DNS found earlier. An IP address picks out one computer anywhere in the world, so routers can pass the unit towards it. A segment plus an IP header is a packet.",
    analogy: "You put that envelope inside a bigger one and write the full street address of the house on it.",
    unit: "Packet",
    depth: 2,
    hop: 0,
    focus: "ip",
    verb: "adds",
  },
  {
    at: "laptop",
    layer: 3,
    title: "Host to network wraps it in a frame for the first hop",
    plain:
      "The laptop cannot reach the server directly. All it can reach is the home router. So the frame header carries MAC addresses for this one short hop, from the laptop’s Wi-Fi card to the router, and a checksum (the FCS) goes on the end so damage can be spotted. A packet plus this header and trailer is a frame.",
    analogy: "You hand it to a courier in a bag labelled only “to the post office down the road”.",
    unit: "Frame",
    depth: 3,
    hop: 0,
    focus: "eth",
    verb: "adds",
  },
  {
    at: "wire1",
    layer: null,
    title: "The frame leaves as bits",
    plain:
      "The Wi-Fi card turns the whole frame, every header included, into 0s and 1s and sends them as radio waves. Nothing new is added. “Bits” is not another wrapper: it is the same frame, written as a signal.",
    analogy: "The courier drives down the road. The road does not care what is in the bag.",
    unit: "Bits",
    depth: 3,
    hop: 0,
    verb: "sends",
  },
  {
    at: "router",
    layer: 3,
    title: "The home router opens the frame",
    plain:
      "The router turns the bits back into a frame. The destination MAC address is its own and the FCS checks out, so the frame has done its job. The router throws the frame header and trailer away and passes the packet up.",
    analogy: "The post office opens the courier bag. The bag was only for getting here.",
    unit: "Frame",
    depth: 3,
    hop: 0,
    focus: "eth",
    verb: "removes",
  },
  {
    at: "router",
    layer: 2,
    title: "The router reads the IP address",
    plain:
      "93.184.216.34 is not on the home network, so the packet has to go out to the ISP. The router lowers the TTL by one, from 64 to 63. A router never looks inside at the ports or the data; for a router, the Internet layer is the top.",
    analogy: "The post office reads the street address, sees it is in another town, and sends it on that way.",
    unit: "Packet",
    depth: 2,
    hop: 1,
    focus: "ip",
    verb: "reads",
    removed: "eth",
    changed: ["ipFrom", "ttl"],
    extra:
      "A home router also swaps the private “from” address 192.168.1.42 for your home’s public address, 203.0.113.7, so the reply can find its way back. This is NAT, covered in 6.12.",
  },
  {
    at: "router",
    layer: 3,
    title: "A brand new frame for the next hop",
    plain:
      "The router builds a new frame around the same packet, addressed from the router to the ISP’s router. Both MAC addresses are new. The server’s IP address inside has not changed at all.",
    analogy: "The envelope goes into a new courier bag for the next post office. New bag, same envelope.",
    unit: "Frame",
    depth: 3,
    hop: 1,
    focus: "eth",
    verb: "rebuilds",
    changed: ["macFrom", "macTo"],
  },
  {
    at: "wire2",
    layer: null,
    title: `Across the Internet, one hop at a time`,
    plain: `The bits cross about ${EXAMPLE_MIDDLE_ROUTERS} more routers. Each one does exactly what your home router just did: turn the bits into a frame, throw the frame away, read the IP address, lower the TTL, and build a new frame for the next link. The packet inside travels the whole way.`,
    analogy: "The envelope changes bags at every post office, but no post office opens the envelope.",
    unit: "Bits",
    depth: 3,
    hop: 2,
    verb: "sends",
    changed: ["macFrom", "macTo", "ttl"],
  },
  {
    at: "server",
    layer: 3,
    title: "The server’s network card opens the frame",
    plain:
      "The bits become a frame again. The destination MAC address belongs to this server and the FCS is correct, so the frame header and trailer come off and the packet goes up.",
    analogy: "The last courier delivers the bag to the right house, and the bag is opened.",
    unit: "Frame",
    depth: 3,
    hop: 2,
    focus: "eth",
    verb: "removes",
  },
  {
    at: "server",
    layer: 2,
    title: "The Internet layer: this packet is for me",
    plain:
      "The destination IP address, 93.184.216.34, is this server’s own. The journey across networks is over, so the IP header comes off and the segment goes up to TCP.",
    analogy: "The street address is right. The outer envelope comes off.",
    unit: "Packet",
    depth: 2,
    hop: 2,
    focus: "ip",
    verb: "removes",
    removed: "eth",
  },
  {
    at: "server",
    layer: 1,
    title: "Transport reads the port: which program?",
    plain:
      "Destination port 80 belongs to the web server program. TCP checks that nothing is missing and everything is in order, sends an acknowledgement back, and removes its header.",
    analogy: "The inner envelope says which person in the house it is for, so it is handed to them.",
    unit: "Segment",
    depth: 1,
    hop: 2,
    focus: "tcp",
    verb: "removes",
    removed: "ip",
  },
  {
    at: "server",
    layer: 0,
    title: "The web server reads exactly what the browser wrote",
    plain:
      "Every header added on the way down has been removed on the way up, so the server sees the same 41 bytes of text the browser wrote. It now writes a reply, the web page, which goes down the server’s stack and back to you the same way, with every “from” and “to” swapped.",
    analogy: "The person reads exactly the letter you wrote, and writes a reply.",
    unit: "Data",
    depth: 0,
    hop: 2,
    focus: "data",
    verb: "reads",
    removed: "tcp",
  },
];

/** The five names, and the one question each wrapper answers. */
export const UNIT_QUESTIONS = [
  { unit: "Data", layer: "Application", question: "What do I want to say?", answer: "The message itself", example: "GET / HTTP/1.1", series: 0 },
  { unit: "Segment", layer: "Transport", question: "Which program is it for?", answer: "Port numbers", example: "51234 → 80", series: 1 },
  { unit: "Packet", layer: "Internet", question: "Which computer, anywhere in the world?", answer: "IP addresses", example: "→ 93.184.216.34", series: 2 },
  { unit: "Frame", layer: "Host to network", question: "Which device next, on this link?", answer: "MAC addresses", example: "→ 3c:52:82:1a:00:01", series: 3 },
  { unit: "Bits", layer: "Physical medium", question: "How does it travel?", answer: "0s and 1s as a signal", example: "00111100 01010010…", series: 4 },
] as const;
