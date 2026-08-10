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
];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
export const lessonIndex = (id: string) => LESSONS.findIndex((l) => l.id === id);
