/**
 * Signal maths for the lessons.
 *
 * Every function here is pure and returns plain arrays so the same numbers can
 * drive a canvas trace, a readout, and a quiz answer. Units are stated on each
 * export because the syllabus problems are unit-conversion problems as much as
 * they are signal problems.
 */

export const TAU = Math.PI * 2;

/** Evenly spaced sample points over [0, span). */
export function linspace(span: number, n: number): Float64Array {
  const out = new Float64Array(n);
  const step = span / (n - 1);
  for (let i = 0; i < n; i++) out[i] = i * step;
  return out;
}

export type Wave = {
  /** peak amplitude, arbitrary units (volts in the lessons) */
  amplitude: number;
  /** cycles per second (Hz) */
  frequency: number;
  /** degrees */
  phase: number;
  /** vertical offset */
  offset?: number;
};

/** Instantaneous value of a sine wave at time t (seconds). */
export function sineAt(w: Wave, t: number): number {
  return (w.offset ?? 0) + w.amplitude * Math.sin(TAU * w.frequency * t + (w.phase * Math.PI) / 180);
}

/** Sample a sine over `duration` seconds into `n` points. */
export function sampleWave(w: Wave, duration: number, n: number): Float64Array {
  const out = new Float64Array(n);
  const dt = duration / (n - 1);
  for (let i = 0; i < n; i++) out[i] = sineAt(w, i * dt);
  return out;
}

/** Sum of waves, used for the harmonics / noise demonstrations. */
export function sampleSum(waves: Wave[], duration: number, n: number): Float64Array {
  const out = new Float64Array(n);
  const dt = duration / (n - 1);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (const w of waves) v += sineAt(w, i * dt);
    out[i] = v;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Wave relationships: the 6.1 problem set
 * ------------------------------------------------------------------ */

/** Speed of light in a vacuum, m/s. */
export const C = 299_792_458;

/** Propagation speed presets, m/s. */
export const MEDIA_SPEED = {
  vacuum: C,
  air: 299_702_547,
  copper: 0.66 * C,
  fibre: 0.67 * C,
  coax: 0.77 * C,
  soundAir: 343,
} as const;

/** v = f × λ  →  wavelength in metres. */
export const wavelength = (speed: number, frequency: number) => speed / frequency;
/** v = f × λ  →  frequency in Hz. */
export const frequencyFrom = (speed: number, wavelengthM: number) => speed / wavelengthM;
/** T = 1 / f  →  period in seconds. */
export const period = (frequency: number) => 1 / frequency;

/** Human-readable SI formatting: 1_500_000 Hz → "1.5 MHz". */
export function si(value: number, unit: string, digits = 3): string {
  if (!Number.isFinite(value)) return `— ${unit}`;
  const abs = Math.abs(value);
  const steps: [number, string][] = [
    [1e9, "G"],
    [1e6, "M"],
    [1e3, "k"],
    [1, ""],
    [1e-3, "m"],
    [1e-6, "µ"],
    [1e-9, "n"],
  ];
  if (abs === 0) return `0 ${unit}`;
  for (const [scale, prefix] of steps) {
    if (abs >= scale) {
      const v = value / scale;
      return `${trim(v, digits)} ${prefix}${unit}`;
    }
  }
  return `${trim(value * 1e12, digits)} p${unit}`;
}

function trim(v: number, digits: number): string {
  const s = v.toPrecision(digits);
  return String(Number(s));
}

/* ------------------------------------------------------------------ *
 * Digital line coding (6.3)
 * ------------------------------------------------------------------ */

export type LineCode = "nrz-l" | "nrz-i" | "manchester" | "manchester-diff";

export const LINE_CODES: Record<LineCode, { name: string; blurb: string; syllabus: boolean }> = {
  "nrz-l": {
    name: "NRZ-L",
    blurb: "Two voltage levels held for the whole bit. High = 1, low = 0.",
    syllabus: true,
  },
  "nrz-i": {
    name: "NRZ-I",
    blurb: "A 1 causes a transition at the start of the bit; a 0 causes none.",
    syllabus: true,
  },
  manchester: {
    name: "Manchester",
    blurb: "Every bit has a mid-bit transition; its direction carries the value.",
    syllabus: true,
  },
  "manchester-diff": {
    name: "Differential Manchester",
    blurb: "Mid-bit transition always. A 0 adds a transition at the bit boundary.",
    syllabus: false,
  },
};

/**
 * Manchester has two published conventions that are exact inverses of each
 * other, and the syllabus names both. Getting the direction backwards is only
 * an error relative to a stated convention, so the lesson always states one.
 */
export type ManchesterConvention = "ieee" | "thomas";

export const MANCHESTER_CONVENTIONS: Record<
  ManchesterConvention,
  { name: string; attribution: string; one: string; zero: string; note: string }
> = {
  ieee: {
    name: "IEEE 802.3",
    attribution: "IEEE 802.3 (10 Mbit/s Ethernet) and IEEE 802.4",
    one: "low→high",
    zero: "high→low",
    note: "The convention written into the Ethernet standards, and the one Stallings uses.",
  },
  thomas: {
    name: "G. E. Thomas",
    attribution: "G. E. Thomas (1949), also called Manchester II or biphase-L",
    one: "high→low",
    zero: "low→high",
    note: "The original 1949 definition, and the one Tanenbaum's Computer Networks uses.",
  },
};

/**
 * A line-coded waveform as level segments in bit-time units.
 * `from`/`to` are in bits (0…bits.length), `level` is -1 or +1.
 */
export type Segment = { from: number; to: number; level: -1 | 1 };

export function encode(
  bits: number[],
  code: LineCode,
  convention: ManchesterConvention = "ieee",
): Segment[] {
  const segs: Segment[] = [];
  let last: -1 | 1 = -1; // resting level for the differential codes

  bits.forEach((bit, i) => {
    switch (code) {
      case "nrz-l":
        segs.push({ from: i, to: i + 1, level: bit ? 1 : -1 });
        break;

      case "nrz-i":
        if (bit) last = last === 1 ? -1 : 1;
        segs.push({ from: i, to: i + 1, level: last });
        break;

      case "manchester": {
        // IEEE 802.3: 1 = low→high, 0 = high→low. G. E. Thomas is the exact
        // inverse, so the whole waveform simply flips.
        const rising = convention === "ieee" ? bit === 1 : bit === 0;
        segs.push({ from: i, to: i + 0.5, level: rising ? -1 : 1 });
        segs.push({ from: i + 0.5, to: i + 1, level: rising ? 1 : -1 });
        break;
      }

      case "manchester-diff": {
        // A 0 flips the level at the bit boundary; a 1 does not.
        if (!bit) last = last === 1 ? -1 : 1;
        segs.push({ from: i, to: i + 0.5, level: last });
        last = last === 1 ? -1 : 1; // guaranteed mid-bit transition
        segs.push({ from: i + 0.5, to: i + 1, level: last });
        break;
      }
    }
  });

  return segs;
}

/** Square-wave clock: one full cycle per bit, high in the first half. */
export function clockSegments(nBits: number): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < nBits; i++) {
    segs.push({ from: i, to: i + 0.5, level: 1 });
    segs.push({ from: i + 0.5, to: i + 1, level: -1 });
  }
  return segs;
}

/**
 * Signal elements (baud) per bit. This is the "how fast do the signal
 * elements change" comparison the syllabus asks students to make.
 */
export function baudPerBit(code: LineCode): number {
  return code === "manchester" || code === "manchester-diff" ? 2 : 1;
}

/** Count of level changes in a coded waveform, the honest measure of transitions. */
export function transitionCount(segs: Segment[]): number {
  let n = 0;
  for (let i = 1; i < segs.length; i++) if (segs[i].level !== segs[i - 1].level) n++;
  return n;
}

/**
 * Longest run with no transition, in bit times. This is what breaks receiver
 * clock recovery, so it is the number that makes the synchronisation lesson land.
 */
export function longestFlatRun(segs: Segment[]): number {
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const s of segs) {
    const width = s.to - s.from;
    if (prev === null || s.level === prev) run += width;
    else run = width;
    prev = s.level;
    if (run > best) best = run;
  }
  return best;
}

/** Level of a coded waveform at time `t` measured in bit times. */
export function levelAt(segs: Segment[], t: number): number {
  for (const s of segs) if (t >= s.from && t < s.to) return s.level;
  return segs.length ? segs[segs.length - 1].level : 0;
}

/**
 * What a receiver decodes when its clock runs at the wrong rate.
 * `drift` is the receiver's sampling interval as a fraction of a true bit time
 * (1.0 = perfect, 1.08 = receiver 8 % slow).
 */
export function sampleWithDrift(
  segs: Segment[],
  nBits: number,
  drift: number,
  code: LineCode,
): { t: number; level: number; bit: number | null }[] {
  const out: { t: number; level: number; bit: number | null }[] = [];
  const isManchester = code === "manchester" || code === "manchester-diff";

  for (let i = 0; i < nBits; i++) {
    if (isManchester) {
      // Manchester receivers sample either side of the mid-bit transition.
      const a = (i + 0.25) * drift;
      const b = (i + 0.75) * drift;
      if (a >= nBits) break;
      const la = levelAt(segs, a);
      const lb = levelAt(segs, b);
      out.push({ t: b, level: lb, bit: la === lb ? null : la < lb ? 1 : 0 });
    } else {
      const t = (i + 0.5) * drift; // sample mid-bit
      if (t >= nBits) break;
      const lv = levelAt(segs, t);
      out.push({ t, level: lv, bit: lv > 0 ? 1 : 0 });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Parity (6.3 error detection)
 * ------------------------------------------------------------------ */

export type Parity = "even" | "odd";

export function parityBit(bits: number[], kind: Parity): number {
  const ones = bits.reduce((a, b) => a + b, 0);
  return kind === "even" ? ones % 2 : 1 - (ones % 2);
}

export function parityHolds(bitsWithParity: number[], kind: Parity): boolean {
  const ones = bitsWithParity.reduce((a, b) => a + b, 0);
  return kind === "even" ? ones % 2 === 0 : ones % 2 === 1;
}

/* ------------------------------------------------------------------ *
 * Digital → analog keying (ASK / FSK / PSK), 6.3 and 6.4
 * ------------------------------------------------------------------ */

export type Keying = "ask" | "fsk" | "psk";

export const KEYING: Record<Keying, { name: string; long: string; varies: string }> = {
  ask: { name: "ASK", long: "Amplitude Shift Keying", varies: "amplitude" },
  fsk: { name: "FSK", long: "Frequency Shift Keying", varies: "frequency" },
  psk: { name: "PSK", long: "Phase Shift Keying", varies: "phase" },
};

/**
 * Keyed carrier over `bits`, sampled into `n` points across the whole bit train.
 * `cyclesPerBit` is the carrier frequency expressed in cycles per bit time,
 * which keeps the picture readable at any zoom.
 */
export function keyedCarrier(
  bits: number[],
  kind: Keying,
  n: number,
  cyclesPerBit = 4,
  opts: { fskRatio?: number; askFloor?: number } = {},
): Float64Array {
  const { fskRatio = 2, askFloor = 0 } = opts;
  const out = new Float64Array(n);
  const nBits = bits.length;
  let phase = 0;
  const dt = nBits / (n - 1); // bit-times per sample

  for (let i = 0; i < n; i++) {
    const t = i * dt;
    const bit = bits[Math.min(nBits - 1, Math.floor(t))] ?? 0;

    switch (kind) {
      case "ask":
        out[i] = (bit ? 1 : askFloor) * Math.sin(TAU * cyclesPerBit * t);
        break;
      case "fsk": {
        // Integrate frequency so the waveform stays continuous at bit edges.
        const f = bit ? cyclesPerBit * fskRatio : cyclesPerBit;
        phase += TAU * f * dt;
        out[i] = Math.sin(phase);
        break;
      }
      case "psk":
        out[i] = Math.sin(TAU * cyclesPerBit * t + (bit ? Math.PI : 0));
        break;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Analog modulation (AM / FM / PM), 6.4
 * ------------------------------------------------------------------ */

export type Modulation = "am" | "fm" | "pm";

export const MODULATION: Record<Modulation, { name: string; long: string; varies: string; note: string }> = {
  am: {
    name: "AM",
    long: "Amplitude Modulation",
    varies: "amplitude",
    note: "The carrier's height follows the message. Frequency and phase are untouched.",
  },
  fm: {
    name: "FM",
    long: "Frequency Modulation",
    varies: "frequency",
    note: "The carrier bunches up on message peaks and stretches out in the troughs. Height stays constant.",
  },
  pm: {
    name: "PM",
    long: "Phase Modulation",
    varies: "phase",
    note: "The carrier is shifted along the time axis in proportion to the message voltage.",
  },
};

export type ModulationResult = {
  message: Float64Array;
  carrier: Float64Array;
  modulated: Float64Array;
  /** Upper envelope for AM, drawn as a guide, not as data. */
  envelope: Float64Array | null;
};

export function modulate(
  kind: Modulation,
  duration: number,
  n: number,
  msg: { frequency: number; amplitude: number },
  carrier: { frequency: number; amplitude: number },
  depth: number,
): ModulationResult {
  const message = new Float64Array(n);
  const carrierArr = new Float64Array(n);
  const modulated = new Float64Array(n);
  const envelope = kind === "am" ? new Float64Array(n) : null;
  const dt = duration / (n - 1);

  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i * dt;
    const m = msg.amplitude * Math.sin(TAU * msg.frequency * t);
    message[i] = m;
    carrierArr[i] = carrier.amplitude * Math.sin(TAU * carrier.frequency * t);

    switch (kind) {
      case "am": {
        const a = carrier.amplitude * (1 + depth * (m / (msg.amplitude || 1)));
        modulated[i] = a * Math.sin(TAU * carrier.frequency * t);
        if (envelope) envelope[i] = a;
        break;
      }
      case "fm": {
        const f = carrier.frequency * (1 + depth * (m / (msg.amplitude || 1)) * 0.6);
        phase += TAU * f * dt;
        modulated[i] = carrier.amplitude * Math.sin(phase);
        break;
      }
      case "pm": {
        const shift = depth * Math.PI * (m / (msg.amplitude || 1));
        modulated[i] = carrier.amplitude * Math.sin(TAU * carrier.frequency * t + shift);
        break;
      }
    }
  }

  return { message, carrier: carrierArr, modulated, envelope };
}

/* ------------------------------------------------------------------ *
 * PCM (6.4)
 * ------------------------------------------------------------------ */

export type PcmResult = {
  /** Sample instants and their quantised values. */
  samples: { t: number; value: number; quantised: number; code: number }[];
  /** Zero-order-hold reconstruction the receiver would build. */
  reconstruction: Float64Array;
  levels: number;
  /** Root-mean-square quantisation error, as a fraction of full scale. */
  error: number;
};

export function pcm(
  source: Float64Array,
  duration: number,
  sampleRate: number,
  bitsPerSample: number,
  peak: number,
): PcmResult {
  const n = source.length;
  const levels = 2 ** bitsPerSample;
  const step = (2 * peak) / (levels - 1);
  const nSamples = Math.max(2, Math.floor(duration * sampleRate));
  const samples: PcmResult["samples"] = [];

  for (let s = 0; s < nSamples; s++) {
    const t = (s / sampleRate);
    if (t > duration) break;
    const idx = Math.min(n - 1, Math.round((t / duration) * (n - 1)));
    const value = source[idx];
    const code = Math.max(0, Math.min(levels - 1, Math.round((value + peak) / step)));
    samples.push({ t, value, quantised: code * step - peak, code });
  }

  const reconstruction = new Float64Array(n);
  let errSq = 0;
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * duration;
    let held = samples.length ? samples[0].quantised : 0;
    for (const s of samples) {
      if (s.t <= t) held = s.quantised;
      else break;
    }
    reconstruction[i] = held;
    const e = (source[i] - held) / (2 * peak);
    errSq += e * e;
  }

  return { samples, reconstruction, levels, error: Math.sqrt(errSq / n) };
}

/* ------------------------------------------------------------------ *
 * Transmission impairments (6.2)
 * ------------------------------------------------------------------ */

export type Impairments = {
  /** 0–1: fraction of amplitude lost by the far end. */
  attenuation: number;
  /** 0–1: noise amplitude relative to the original peak. */
  noise: number;
  /** 0–1: how hard the medium's low-pass behaviour rounds off the edges. */
  distortion: number;
};

/** Deterministic value noise so the trace is stable between frames unless animated. */
function hashNoise(i: number, seed: number): number {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

export function impair(source: Float64Array, imp: Impairments, seed = 1): Float64Array {
  const n = source.length;
  const out = new Float64Array(n);

  // Attenuation: uniform amplitude loss.
  const gain = 1 - imp.attenuation;
  for (let i = 0; i < n; i++) out[i] = source[i] * gain;

  // Distortion: a one-pole low-pass, which is what cable capacitance does to
  // sharp edges. Strength maps to the filter's smoothing coefficient.
  if (imp.distortion > 0) {
    const a = 1 - imp.distortion * 0.965;
    let y = out[0];
    for (let i = 0; i < n; i++) {
      y = y + a * (out[i] - y);
      out[i] = y;
    }
  }

  // Noise: added last, because noise picked up on the line is not filtered by it.
  if (imp.noise > 0) {
    for (let i = 0; i < n; i++) {
      out[i] += imp.noise * 0.6 * (hashNoise(i, seed) + hashNoise(i * 3.7, seed + 11) * 0.5);
    }
  }

  return out;
}

/** Peak amplitude of a trace, used for the "is this still readable?" verdict. */
export function peakOf(a: Float64Array): number {
  let m = 0;
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i]));
  return m;
}

/**
 * Signal-to-noise ratio in dB, from the clean and received traces.
 * Returns null when there is no measurable noise.
 */
export function snrDb(clean: Float64Array, received: Float64Array): number | null {
  let sig = 0;
  let noise = 0;
  const n = Math.min(clean.length, received.length);
  for (let i = 0; i < n; i++) {
    sig += clean[i] * clean[i];
    const d = received[i] - clean[i];
    noise += d * d;
  }
  if (noise <= 1e-12) return null;
  return 10 * Math.log10(sig / noise);
}

/* ------------------------------------------------------------------ *
 * Topology maths (6.5)
 * ------------------------------------------------------------------ */

/** Cable runs needed for a full mesh: n(n−1)/2. */
export const meshLinks = (n: number) => (n * (n - 1)) / 2;
/** Ports each host needs in a full mesh. */
export const meshPorts = (n: number) => Math.max(0, n - 1);

/* ------------------------------------------------------------------ *
 * Direction of flow (6.2)
 * ------------------------------------------------------------------ */

export type Mode = "simplex" | "half" | "full";

export const TRANSMISSION_MODES: Record<
  Mode,
  { name: string; how: string; capacity: string; examples: string[]; series: number }
> = {
  simplex: {
    name: "Simplex",
    how: "Data travels in one direction only. One device is permanently the sender and the other permanently the receiver.",
    capacity: "The whole channel is available to the one direction that uses it.",
    examples: ["Radio and television broadcasting", "A keyboard to a computer", "A computer to a monitor"],
    series: 1,
  },
  half: {
    name: "Half duplex",
    how: "Both devices can send, but only one at a time. The line has to be turned round between turns.",
    capacity: "The whole channel goes to whichever device is currently sending.",
    examples: ["Walkie-talkies", "A hub-based Ethernet segment", "CB radio"],
    series: 0,
  },
  full: {
    name: "Full duplex",
    how: "Both devices send at the same time, either on separate paths or in separate frequency bands.",
    capacity: "The capacity is shared between the two directions.",
    examples: ["Telephone calls", "Switched Ethernet", "Mobile phone calls"],
    series: 2,
  },
};

/* ------------------------------------------------------------------ *
 * Multiplexing (6.2)
 *
 * One medium, several conversations. Each technique divides a different
 * resource: time, frequency, wavelength, or the code the data is wrapped in.
 * ------------------------------------------------------------------ */

export type Muxing = "tdm" | "fdm" | "wdm" | "cdm";

export const MULTIPLEXING: Record<
  Muxing,
  {
    name: string;
    long: string;
    divides: string;
    how: string;
    used: string;
    key: { term: string; what: string }[];
  }
> = {
  tdm: {
    name: "TDM",
    long: "Time Division Multiplexing",
    divides: "time",
    how: "Transmission time is cut into slots and each channel is given its own slot in turn. One complete round of slots is a frame, and the frames repeat.",
    used: "Digital telephone trunks, where 24 or 30 voice channels share one line.",
    key: [
      { term: "Time slot", what: "The share of time one channel gets to transmit in." },
      { term: "Frame", what: "One complete set of slots: one slot per input channel." },
      { term: "Round robin", what: "Slots are handed out in sequence, then the cycle repeats." },
      { term: "Guard time", what: "A small unused gap between slots so a timing error cannot overlap two channels." },
      { term: "Synchronisation", what: "Both ends must agree where each slot begins, or every channel is read wrongly." },
    ],
  },
  fdm: {
    name: "FDM",
    long: "Frequency Division Multiplexing",
    divides: "frequency",
    how: "The bandwidth of the medium is split into bands and each channel is modulated onto its own carrier frequency. All channels travel at once.",
    used: "Radio and television broadcasting, and the upstream/downstream split in ADSL.",
    key: [
      { term: "Carrier", what: "The frequency a channel's data is modulated onto." },
      { term: "Band", what: "The slice of the spectrum reserved for one channel." },
      { term: "Guard band", what: "An unused strip of spectrum between bands, so neighbours do not interfere." },
    ],
  },
  wdm: {
    name: "WDM",
    long: "Wavelength Division Multiplexing",
    divides: "wavelength",
    how: "The same idea as FDM, but in optical fibre: several beams of different wavelength (different colours of light) travel down one fibre at once.",
    used: "Long-haul fibre backbones and submarine cables.",
    key: [
      { term: "Prism or grating", what: "Combines the beams at the sending end and separates them again at the far end." },
      { term: "Wavelength", what: "Each channel gets its own colour of light, so they never mix." },
    ],
  },
  cdm: {
    name: "CDM",
    long: "Code Division Multiplexing",
    divides: "code",
    how: "Every channel is given a unique code and all of them transmit over the whole band at the same time. A receiver that knows a code can pull that channel out and treat the rest as noise.",
    used: "Mobile telephone networks (CDMA) and GPS.",
    key: [
      { term: "Chip code", what: "The unique pattern each channel's bits are multiplied by." },
      { term: "Orthogonal", what: "Codes are chosen so that any two of them cancel out, and that is what keeps the channels separable." },
    ],
  },
};

export const MUX_PROS = [
  "One expensive medium carries many conversations, so the cost per channel falls",
  "The capacity of a link that would otherwise sit idle is actually used",
  "The network can grow by adding channels rather than cable",
];

export const MUX_CONS = [
  "If the shared link fails, every channel on it fails together",
  "Extra hardware is needed at both ends: a multiplexer and a demultiplexer",
  "The equipment, and the synchronisation it needs, make the system more complex",
];
