import { useMemo, useState } from "react";
import clsx from "clsx";
import { Section } from "../components/LessonPage";
import { ScopeCanvas } from "../components/ScopeCanvas";
import { Quiz, type Question } from "../components/Quiz";
import {
  Badge,
  Button,
  Callout,
  Extra,
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
import {
  DEMO_KEYS,
  FIREWALL_RULES,
  GENUINE_SAMPLE,
  PHISHING_SAMPLE,
  PHISH_CLUES,
  PROTECTIONS,
  THREATS,
  TRAFFIC_SAMPLES,
  digest,
  encryptWord,
  firewallDecide,
  numberToLetter,
  passwordStrength,
  rsa,
  shiftCipher,
  signMessage,
  verifyMessage,
  type SampleMessage,
} from "../lib/security";

export function SecurityLesson() {
  return (
    <>
      <NeedSection />
      <KeysSection />
      <SignSection />
      <ThreatsSection />
      <ProtectSection />
      <Section id="check" title="Check yourself">
        <Quiz lessonId="security" questions={QUESTIONS} />
      </Section>
    </>
  );
}

/* ================================================================== *
 * 1. What the Internet does not give you
 * ================================================================== */

const PLAIN_MESSAGE = "MEET AT NOON";

function NeedSection() {
  const [encrypted, setEncrypted] = useState(false);
  const shown = encrypted ? shiftCipher(PLAIN_MESSAGE, 7) : PLAIN_MESSAGE;

  return (
    <Section
      id="need"
      title="Every router on the way can read it"
      lead="Nothing in the last nine levels protects anything. A packet is handed from router to router, and each one has the whole message in front of it in plain text. The Internet delivers data, but it makes no promise that the data was private on the way, and none that the sender is who the message says they are."
    >
      <Panel
        title="One message, several strangers"
        subtitle="The routers between you and the far end are machines you do not own."
        actions={
          <Toggle
            checked={encrypted}
            onChange={setEncrypted}
            label="Encrypt before sending"
            accent="var(--s3)"
          />
        }
      >
        <Scope height={186}>
          <ScopeCanvas
            label={`A message crossing four routers between two people. It currently reads ${shown} at every hop.`}
            animate
            deps={[encrypted]}
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, time, w, h }) => {
              const y = h * 0.44;
              const stops = [0.06, 0.3, 0.5, 0.7, 0.94].map((f) => 30 + f * (w - 60));
              const labels = ["You", "ISP", "Router", "Router", "Friend"];

              ctx.save();
              ctx.strokeStyle = palette.gridMajor;
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(stops[0], y);
              ctx.lineTo(stops[4], y);
              ctx.stroke();
              ctx.restore();

              stops.forEach((x, i) => {
                const isEnd = i === 0 || i === stops.length - 1;
                const colour = isEnd ? palette.series[1] : palette.axis;
                ctx.save();
                ctx.fillStyle = palette.bg;
                ctx.strokeStyle = colour;
                ctx.lineWidth = isEnd ? 2 : 1.5;
                ctx.beginPath();
                ctx.roundRect(x - 26, y - 15, 52, 30, 6);
                ctx.fill();
                ctx.stroke();
                ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = isEnd ? colour : palette.ink;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(labels[i], x, y + 0.5);
                ctx.restore();
              });

              // The message, sliding from one end to the other.
              const u = (time * 0.16) % 1;
              const px = stops[0] + (stops[4] - stops[0]) * u;
              const colour = encrypted ? palette.series[2] : palette.series[4];
              ctx.save();
              ctx.font = '700 10px "JetBrains Mono Variable", ui-monospace, monospace';
              const tw = ctx.measureText(shown).width + 20;
              if (palette.isDark) {
                ctx.shadowColor = colour;
                ctx.shadowBlur = 12;
              }
              ctx.fillStyle = colour;
              ctx.beginPath();
              ctx.roundRect(px - tw / 2, y - 42, tw, 20, 5);
              ctx.fill();
              ctx.shadowBlur = 0;
              ctx.fillStyle = palette.bg;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(shown, px, y - 31.5);
              ctx.restore();

              // The middle hop, reading whatever went past.
              const spy = stops[2];
              ctx.save();
              ctx.strokeStyle = encrypted ? palette.series[2] : palette.series[4];
              ctx.lineWidth = 1.4;
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(spy, y + 16);
              ctx.lineTo(spy, y + 38);
              ctx.stroke();
              ctx.restore();
              plot.text(
                spy,
                y + 44,
                encrypted ? `sees: ${shiftCipher(PLAIN_MESSAGE, 7)}` : `sees: ${PLAIN_MESSAGE}`,
                encrypted ? palette.series[2] : palette.series[4],
                { size: 10, weight: 700, align: "center" },
              );
              plot.text(
                spy,
                y + 58,
                encrypted ? "meaningless without the key" : "the whole message, in plain text",
                palette.inkFaint,
                { size: 9, align: "center" },
              );
            }}
          />
        </Scope>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <p className="text-2xs font-semibold text-ink-3">Confidentiality</p>
            <p className="mt-1 max-w-[46ch] text-sm text-ink-2">
              Can anyone other than the intended reader understand this? Without encryption the answer is yes:
              every device on the path, and anyone listening to the wireless link, sees the message exactly as
              you typed it.
            </p>
          </div>
          <div>
            <p className="text-2xs font-semibold text-ink-3">Authentication</p>
            <p className="mt-1 max-w-[46ch] text-sm text-ink-2">
              Is the sender really who the message claims? Nothing in a packet proves it. The source address is
              simply a field the sender filled in, and it can be filled in with anything.
            </p>
          </div>
        </div>
      </Panel>

      <Callout kind="exam" title="The exam sentence">
        The Internet provides <strong>neither confidentiality nor authentication</strong>. Both have to be added
        by the communicating parties themselves: confidentiality by encryption, and authentication by digital
        signatures. That is the whole reason this competency level exists.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * 2. Keys
 * ================================================================== */

const WORDS = ["HI", "CAT", "KEY", "SEND"];

function KeysSection() {
  const [mode, setMode] = useState<"symmetric" | "asymmetric">("symmetric");
  const [shift, setShift] = useState(7);
  const [word, setWord] = useState("SEND");
  const [letterIndex, setLetterIndex] = useState(0);

  const rows = useMemo(() => encryptWord(word, DEMO_KEYS), [word]);
  const row = rows[Math.min(letterIndex, rows.length - 1)];
  const wrongKey = rsa(row.cipher, DEMO_KEYS.e, DEMO_KEYS.n);
  const wrongResult =
    wrongKey >= 1 && wrongKey <= 26
      ? `it gives ${numberToLetter(wrongKey)}, the wrong letter entirely`
      : "it gives a number that is not a letter at all";

  return (
    <Section
      id="keys"
      title="One key, or a pair of them"
      lead="Encryption turns a message into something unreadable, and a key is what turns it back. The whole difference between the two families is whether the key that locks is the same one that unlocks, and that single change is what makes secure communication between strangers possible at all."
    >
      <Panel
        title={mode === "symmetric" ? "Symmetric key encryption" : "Asymmetric key encryption"}
        subtitle={
          mode === "symmetric"
            ? "The same key encrypts and decrypts, so both sides must already share it."
            : "Two different but mathematically related keys. What one locks, only the other opens."
        }
        actions={
          <Segmented
            label="Kind of encryption"
            value={mode}
            onChange={setMode}
            options={[
              { value: "symmetric", label: "Same key" },
              { value: "asymmetric", label: "Key pair" },
            ]}
          />
        }
      >
        <Scope height={210}>
          <ScopeCanvas
            label={
              mode === "symmetric"
                ? "A message encrypted with a shared key, sent, and decrypted with the same shared key at the far end"
                : "A message encrypted with the recipient's public key, sent, and decrypted with the recipient's private key"
            }
            animate
            deps={[mode, shift, word]}
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, time, w, h }) => {
              const y = h * 0.42;
              const aX = 52;
              const bX = w - 52;
              const encX = aX + (bX - aX) * 0.26;
              const decX = aX + (bX - aX) * 0.74;

              ctx.save();
              ctx.strokeStyle = palette.gridMajor;
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(aX, y);
              ctx.lineTo(bX, y);
              ctx.stroke();
              ctx.restore();

              const person = (x: number, label: string, sub: string) => {
                ctx.save();
                ctx.fillStyle = palette.bg;
                ctx.strokeStyle = palette.series[1];
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(x - 34, y - 20, 68, 40, 7);
                ctx.fill();
                ctx.stroke();
                ctx.font = '700 10px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = palette.series[1];
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(label, x, y - 5);
                ctx.font = '500 8px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = palette.ink;
                ctx.fillText(sub, x, y + 9);
                ctx.restore();
              };

              // The two transformation stages.
              const stage = (x: number, label: string, keyText: string, colour: string) => {
                ctx.save();
                ctx.fillStyle = palette.bg;
                ctx.strokeStyle = colour;
                ctx.lineWidth = 2;
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.roundRect(x - 30, y - 17, 60, 34, 6);
                ctx.fill();
                ctx.stroke();
                ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = colour;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(label, x, y + 0.5);
                ctx.restore();
                plot.text(x, y + 26, keyText, colour, { size: 9, weight: 700, align: "center" });
              };

              const keyColour = mode === "symmetric" ? palette.series[0] : palette.series[3];
              const privColour = mode === "symmetric" ? palette.series[0] : palette.series[2];
              stage(encX, "encrypt", mode === "symmetric" ? `shared key ${shift}` : "Bob's public key", keyColour);
              stage(decX, "decrypt", mode === "symmetric" ? `shared key ${shift}` : "Bob's private key", privColour);

              person(aX, "Alice", "sender");
              person(bX, "Bob", "receiver");

              // The message, changing form as it passes each stage.
              const u = (time * 0.15) % 1;
              const px = aX + (bX - aX) * u;
              const plain = mode === "symmetric" ? "HELLO" : word;
              const cipherText =
                mode === "symmetric"
                  ? shiftCipher(plain, shift)
                  : rows.map((r) => r.cipher).join(" ");
              const text = px < encX ? plain : px < decX ? cipherText : plain;
              const scrambled = px >= encX && px < decX;
              const colour = scrambled ? palette.series[3] : palette.series[2];

              ctx.save();
              ctx.font = '700 10px "JetBrains Mono Variable", ui-monospace, monospace';
              const tw = ctx.measureText(text).width + 18;
              if (palette.isDark) {
                ctx.shadowColor = colour;
                ctx.shadowBlur = 12;
              }
              ctx.fillStyle = colour;
              ctx.beginPath();
              ctx.roundRect(px - tw / 2, y - 46, tw, 19, 5);
              ctx.fill();
              ctx.shadowBlur = 0;
              ctx.fillStyle = palette.bg;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(text, px, y - 36);
              ctx.restore();

              if (mode === "symmetric") {
                // The problem the whole of asymmetric encryption exists to solve.
                ctx.save();
                ctx.strokeStyle = palette.series[4];
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(encX, y + 44);
                ctx.lineTo(decX, y + 44);
                ctx.stroke();
                ctx.restore();
                plot.text((encX + decX) / 2, y + 50, "how does this key get across safely?", palette.series[4], {
                  size: 9,
                  weight: 700,
                  align: "center",
                });
              } else {
                plot.text(w / 2, y + 50, "the public key can be shouted from the rooftops", palette.inkFaint, {
                  size: 9,
                  align: "center",
                });
              }
            }}
          />
        </Scope>

        {mode === "symmetric" ? (
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 lg:grid-cols-2">
            <div>
              <Slider
                label="Shared key: how far each letter is shifted"
                value={shift}
                onChange={setShift}
                min={1}
                max={25}
                readout={`+${shift}`}
                accent="var(--s1)"
                hint="A shift cipher is a toy, but the shape is right: one number both sides must know."
              />
              <div className="mt-3 grid gap-1.5">
                <Formula note="plaintext, as typed">{PLAIN_MESSAGE}</Formula>
                <Formula note={`each letter moved on by ${shift}`}>{shiftCipher(PLAIN_MESSAGE, shift)}</Formula>
                <Formula note="decrypted with the same key">
                  {shiftCipher(shiftCipher(PLAIN_MESSAGE, shift), -shift)}
                </Formula>
              </div>
            </div>
            <div className="lg:border-l lg:border-line lg:pl-4">
              <p className="text-sm font-semibold text-ink">Fast, but there is a catch</p>
              <p className="mt-1 max-w-[52ch] text-sm text-ink-2">
                Symmetric encryption is quick and is what actually protects the bulk of your traffic. The
                difficulty is the key itself: both sides must have the same one before they can exchange
                anything, and sending the key over the very network you do not trust defeats the purpose.
              </p>
              <p className="mt-2 max-w-[52ch] text-sm text-ink-2">
                It gets worse with numbers. Ten people who all want to talk privately in pairs need forty-five
                different shared keys; a hundred people need almost five thousand.
              </p>
              <Readout className="mt-3" label="Keys needed for n people" value="n(n−1)/2" sub="45 keys for 10 people" />
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">Encrypting {word} for Bob</p>
                <Segmented
                  label="Word"
                  size="sm"
                  value={word}
                  onChange={(v) => {
                    setWord(v);
                    setLetterIndex(0);
                  }}
                  options={WORDS.map((wd) => ({ value: wd, label: wd }))}
                />
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[380px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      {["Letter", "As a number m", "c = m³ mod 55", "c²⁷ mod 55"].map((th) => (
                        <th key={th} className="px-3 py-2 text-2xs font-semibold tracking-wide text-ink-3">
                          {th}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr
                        key={i}
                        className={clsx("border-b border-line last:border-0", i === letterIndex && "bg-brand-wash")}
                      >
                        <td className="px-3 py-1.5">
                          <button
                            type="button"
                            onClick={() => setLetterIndex(i)}
                            className="tnum font-mono text-sm font-semibold text-ink hover:text-brand"
                          >
                            {r.letter}
                          </button>
                        </td>
                        <td className="tnum px-3 py-1.5 font-mono text-ink-2">{r.plain}</td>
                        <td className="tnum px-3 py-1.5 font-mono font-semibold" style={{ color: "var(--s4-ink)" }}>
                          {r.cipher}
                        </td>
                        <td className="tnum px-3 py-1.5 font-mono font-semibold" style={{ color: "var(--s3-ink)" }}>
                          {r.recovered} = {numberToLetter(r.recovered)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 grid gap-1.5">
                <Formula note={`encrypting ${row.letter} with the public key (e = ${DEMO_KEYS.e}, n = ${DEMO_KEYS.n})`}>
                  {row.plain}³ = {row.plain ** 3}, and {row.plain ** 3} mod 55 = {row.cipher}
                </Formula>
                <Formula note={`decrypting with the private key (d = ${DEMO_KEYS.d}) gets the letter back`}>
                  {row.cipher}²⁷ mod 55 = {row.recovered} = {row.letter}
                </Formula>
                <Formula note={`the public key cannot undo its own work: ${wrongResult}`}>
                  {row.cipher}³ mod 55 = {wrongKey}
                </Formula>
              </div>
            </div>

            <div className="grid content-start gap-3 lg:border-l lg:border-line lg:pl-4">
              <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: "var(--s4)", background: "color-mix(in oklab, var(--s4) 8%, transparent)" }}>
                <p className="text-2xs font-semibold" style={{ color: "var(--s4-ink)" }}>
                  Public key
                </p>
                <p className="tnum mt-0.5 font-mono text-sm font-semibold text-ink">
                  (e = {DEMO_KEYS.e}, n = {DEMO_KEYS.n})
                </p>
                <p className="mt-1 text-2xs text-ink-2">
                  Published openly. Anyone may use it to encrypt something for Bob, or to check his signature.
                </p>
              </div>
              <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: "var(--s3)", background: "color-mix(in oklab, var(--s3) 8%, transparent)" }}>
                <p className="text-2xs font-semibold" style={{ color: "var(--s3-ink)" }}>
                  Private key
                </p>
                <p className="tnum mt-0.5 font-mono text-sm font-semibold text-ink">
                  (d = {DEMO_KEYS.d}, n = {DEMO_KEYS.n})
                </p>
                <p className="mt-1 text-2xs text-ink-2">
                  Never leaves Bob's machine. Only it can undo what the public key did.
                </p>
              </div>
              <Extra className="self-start" />
              <Reveal label="Where d comes from">
                <p className="max-w-[40ch] text-sm">
                  Pick two primes, p = {DEMO_KEYS.p} and q = {DEMO_KEYS.q}. Then n = p × q = {DEMO_KEYS.n} and
                  φ = (p−1)(q−1) = {DEMO_KEYS.phi}. Choose e = {DEMO_KEYS.e}, which shares no factor with φ, and
                  find d such that e × d leaves remainder 1 when divided by φ: {DEMO_KEYS.e} × {DEMO_KEYS.d} ={" "}
                  {DEMO_KEYS.e * DEMO_KEYS.d}, and {DEMO_KEYS.e * DEMO_KEYS.d} mod {DEMO_KEYS.phi} = 1. Real keys
                  use primes hundreds of digits long, which is what makes working d out from e and n hopeless.
                </p>
              </Reveal>
            </div>
          </div>
        )}
      </Panel>

      <Callout kind="exam" title="Which key does which job">
        To send something <strong>confidentially</strong>, encrypt it with the{" "}
        <strong>receiver's public key</strong>, and then only the receiver's private key can open it. The keys are
        used the other way round for signing, and mixing the two up is the most common mistake in this topic.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * 3. Signing
 * ================================================================== */

const MESSAGES = [
  "Pay Nimal 1000 rupees",
  "The meeting is at 4 pm",
  "I approve this transfer",
];

function SignSection() {
  const [message, setMessage] = useState(MESSAGES[0]);
  const [tampered, setTampered] = useState(false);

  const received = tampered ? message.replace(/1000|4 pm|approve/, (m) =>
    m === "1000" ? "9000" : m === "4 pm" ? "9 pm" : "reject",
  ) : message;

  const signature = signMessage(message, DEMO_KEYS);
  const check = verifyMessage(received, signature, DEMO_KEYS);

  return (
    <Section
      id="sign"
      title="Signing: the same maths, used backwards"
      lead="A signature answers the other question: not 'can anyone else read this' but 'did this really come from you, and is it still exactly what you wrote'. The sender scrambles a digest of the message with their private key. Anyone can unscramble it with the matching public key, and only the real owner could have produced something that unscrambles correctly."
    >
      <Panel
        title="Signature workbench"
        subtitle="Change the message, or alter it in transit, and watch the check succeed or fail."
        actions={
          <Toggle
            checked={tampered}
            onChange={setTampered}
            label="Alter the message in transit"
            accent="var(--s5)"
          />
        }
      >
        <Scope height={230}>
          <ScopeCanvas
            label={`Signing and verification. The sender's digest is ${digest(message, DEMO_KEYS.n)} and the receiver recomputes ${check.hash}, so the signature is ${check.valid ? "valid" : "rejected"}.`}
            deps={[message, tampered]}
            bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
            insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
            draw={({ plot, ctx, palette, w }) => {
              const narrow = w < 560;
              const colL = narrow ? 14 : 26;
              const colR = w - (narrow ? 14 : 26);
              const midX = w / 2;
              const boxW = Math.min(narrow ? 128 : 168, midX - colL - 18);

              const chip = (x: number, y: number, title: string, value: string, colour: string, strong = false) => {
                ctx.save();
                if (strong && palette.isDark) {
                  ctx.shadowColor = colour;
                  ctx.shadowBlur = 12;
                }
                ctx.fillStyle = palette.bg;
                ctx.strokeStyle = colour;
                ctx.lineWidth = strong ? 2.2 : 1.4;
                ctx.beginPath();
                ctx.roundRect(x, y, boxW, 38, 6);
                ctx.fill();
                ctx.stroke();
                ctx.shadowBlur = 0;
                const max = boxW - 16;
                // Both lines are clipped to the chip rather than running past it.
                const fit = (text: string) => {
                  let shown = text;
                  while (ctx.measureText(shown).width > max && shown.length > 3) shown = shown.slice(0, -2) + "…";
                  return shown;
                };
                ctx.font = '600 8px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = palette.ink;
                ctx.textAlign = "left";
                ctx.textBaseline = "middle";
                ctx.fillText(fit(title), x + 8, y + 12);
                ctx.font = '700 11px "JetBrains Mono Variable", ui-monospace, monospace';
                ctx.fillStyle = colour;
                ctx.fillText(fit(value), x + 8, y + 26);
                ctx.restore();
              };

              const arrow = (x: number, y0: number, y1: number, colour: string) => {
                ctx.save();
                ctx.strokeStyle = colour;
                ctx.fillStyle = colour;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(x, y0);
                ctx.lineTo(x, y1 - 5);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x, y1);
                ctx.lineTo(x - 4, y1 - 6);
                ctx.lineTo(x + 4, y1 - 6);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
              };

              plot.text(colL, 8, "Sender", palette.inkFaint, { size: 10, weight: 700 });
              plot.text(colR, 8, "Receiver", palette.inkFaint, { size: 10, weight: 700, align: "right" });

              const rowY = [26, 88, 150];
              const rX = colR - boxW;

              chip(colL, rowY[0], "message", message, palette.series[0]);
              arrow(colL + boxW / 2, rowY[0] + 38, rowY[1], palette.axis);
              chip(colL, rowY[1], "digest of the message", String(digest(message, DEMO_KEYS.n)), palette.series[1]);
              arrow(colL + boxW / 2, rowY[1] + 38, rowY[2], palette.axis);
              chip(colL, rowY[2], "signed with the private key", String(signature), palette.series[2], true);

              chip(rX, rowY[0], tampered ? "message as received (altered)" : "message as received", received, tampered ? palette.series[4] : palette.series[0], tampered);
              arrow(rX + boxW / 2, rowY[0] + 38, rowY[1], palette.axis);
              chip(rX, rowY[1], "digest recomputed here", String(check.hash), palette.series[1]);
              chip(rX, rowY[2], "opened with the public key", String(check.recovered), palette.series[3], true);

              // The two things that travel.
              [rowY[0], rowY[2]].forEach((y, i) => {
                ctx.save();
                ctx.strokeStyle = i === 1 ? palette.series[2] : tampered ? palette.series[4] : palette.series[0];
                ctx.lineWidth = 1.6;
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                ctx.moveTo(colL + boxW + 4, y + 19);
                ctx.lineTo(rX - 4, y + 19);
                ctx.stroke();
                ctx.restore();
                plot.text(midX, y + 8, i === 1 ? "signature" : "message", palette.inkFaint, {
                  size: 8,
                  align: "center",
                });
              });

              // The comparison that decides everything.
              const ok = check.valid;
              const verdictColour = ok ? palette.ok : palette.bad;
              ctx.save();
              ctx.strokeStyle = verdictColour;
              ctx.lineWidth = 1.6;
              ctx.setLineDash([4, 3]);
              ctx.beginPath();
              ctx.moveTo(rX + boxW / 2, rowY[1] + 38);
              ctx.lineTo(rX + boxW / 2, rowY[2]);
              ctx.stroke();
              ctx.restore();
              plot.text(
                rX + boxW / 2 - 6,
                (rowY[1] + 38 + rowY[2]) / 2,
                ok ? "equal ✓" : "different ✗",
                verdictColour,
                { size: 9, weight: 700, align: "right", baseline: "middle" },
              );
            }}
          />
        </Scope>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line pt-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="mb-2 text-xs font-medium text-ink-2">Message to sign</p>
            <div className="grid gap-1">
              {MESSAGES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMessage(m)}
                  className={clsx(
                    "rounded-lg border px-3 py-1.5 text-left text-sm transition-colors",
                    message === m ? "border-brand-edge bg-brand-wash text-ink" : "border-line bg-surface text-ink-2 hover:bg-surface-2",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <Legend
              className="mt-3"
              items={[
                { color: "var(--s3)", label: "Signed with the private key" },
                { color: "var(--s4)", label: "Opened with the public key" },
                { color: "var(--s5)", label: "Altered in transit", muted: !tampered },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-6 lg:border-l lg:border-line lg:pl-4">
            <Readout label="Digest sent" value={digest(message, DEMO_KEYS.n)} sub="computed by the sender" />
            <Readout label="Digest here" value={check.hash} sub="recomputed by the receiver" tone={check.valid ? "neutral" : "bad"} />
            <Readout
              label="Verdict"
              value={check.valid ? "Signature valid" : "Rejected"}
              tone={check.valid ? "ok" : "bad"}
              sub={check.valid ? "authentic and unchanged" : "the message is not what was signed"}
            />
          </div>
        </div>

        <p className="mt-3 max-w-[74ch] rounded-lg bg-surface-2 px-3.5 py-2.5 text-sm text-ink-2">
          {check.valid
            ? "The digest the receiver computes from the message matches the number recovered from the signature, so two things are proved at once: the message has not been altered, and it was signed by whoever holds the private key."
            : "One word was changed on the way, so the receiver's digest no longer matches what the signature contains. The attacker cannot repair it, because producing a matching signature would need the private key, which never left the sender."}
        </p>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <Panel title="Encrypting and signing, side by side" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[300px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-3 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">Goal</th>
                  <th className="px-3 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">Sender</th>
                  <th className="px-3 py-2.5 text-2xs font-semibold tracking-wide text-ink-3">Receiver</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-line">
                  <td className="px-3 py-2.5 align-top text-ink">Keep it secret</td>
                  <td className="px-3 py-2.5 align-top text-ink-2">receiver's public key</td>
                  <td className="px-3 py-2.5 align-top text-ink-2">own private key</td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 align-top text-ink">Prove who sent it</td>
                  <td className="px-3 py-2.5 align-top text-ink-2">own private key</td>
                  <td className="px-3 py-2.5 align-top text-ink-2">sender's public key</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>

        <Callout kind="exam" title="What a signature proves">
          A digital signature gives <strong>authentication</strong> (it came from the holder of that private key)
          and <strong>integrity</strong> (not one character has changed). It does <em>not</em> hide the message;
          the text still travels in the open. For secrecy as well, you encrypt the signed message too.
        </Callout>
      </div>
    </Section>
  );
}

/* ================================================================== *
 * 4. Threats
 * ================================================================== */

function ThreatsSection() {
  const [open, setOpen] = useState("virus");
  const threat = THREATS.find((t) => t.id === open) ?? THREATS[0];

  return (
    <Section
      id="threats"
      title="What is actually out there"
      lead="The threats in the syllabus split neatly in two. Viruses, trojans and the rest of malware are programs that get onto a machine and do something you did not ask for. Phishing does not attack the machine at all; it attacks the person using it, and no software setting can fully close that door."
    >
      <Panel title="Four names to know apart" subtitle="Select one to see how it gets in and what gives it away.">
        <div className="flex flex-wrap gap-1.5">
          {THREATS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setOpen(t.id)}
              aria-pressed={open === t.id}
              className={clsx(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150",
                open === t.id ? "shadow-sm" : "border-line bg-surface text-ink-2 hover:bg-surface-2",
              )}
              style={
                open === t.id
                  ? {
                      borderColor: `var(--s${t.series + 1})`,
                      background: `color-mix(in oklab, var(--s${t.series + 1}) 10%, transparent)`,
                      color: `var(--s${t.series + 1}-ink)`,
                    }
                  : undefined
              }
            >
              {t.name}
            </button>
          ))}
        </div>

        <div
          key={threat.id}
          className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3"
          style={{ animation: "rise var(--dur) var(--ease-out-quart)" }}
        >
          <div>
            <p className="text-2xs font-semibold text-ink-3">What it is</p>
            <p className="mt-1 max-w-[42ch] text-sm text-ink-2">{threat.what}</p>
          </div>
          <div>
            <p className="text-2xs font-semibold text-ink-3">How it gets in</p>
            <p className="mt-1 max-w-[42ch] text-sm text-ink-2">{threat.how}</p>
          </div>
          <div>
            <p className="text-2xs font-semibold text-ink-3">What gives it away</p>
            <p className="mt-1 max-w-[42ch] text-sm text-ink-2">{threat.tell}</p>
            <Badge className="mt-2" tone={threat.needsVictim ? "warn" : "neutral"}>
              {threat.needsVictim ? "needs a person to be fooled" : "an umbrella term"}
            </Badge>
          </div>
        </div>
      </Panel>

      <PhishingDrill />
    </Section>
  );
}

function PhishingDrill() {
  const [sample, setSample] = useState<SampleMessage>(PHISHING_SAMPLE);
  const [found, setFound] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const isPhish = sample.verdict === "phishing";
  const total = PHISH_CLUES.length;
  const clue = PHISH_CLUES.find((c) => c.id === selected);

  return (
    <Panel
      title="Spot the phish"
      subtitle={
        isPhish
          ? "An invented message from a bank that does not exist. Click anything that looks wrong."
          : "The same bank, sending something real. Nothing here should worry you."
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isPhish && found.length === total ? "ok" : "neutral"}>
            {isPhish ? `${found.length} / ${total} clues found` : "genuine message"}
          </Badge>
          <Segmented
            label="Message"
            size="sm"
            value={sample.id}
            onChange={(v) => {
              setSample(v === "phish" ? PHISHING_SAMPLE : GENUINE_SAMPLE);
              setSelected(null);
            }}
            options={[
              { value: "phish", label: "Suspicious" },
              { value: "genuine", label: "Genuine" },
            ]}
          />
        </div>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 rounded-lg border border-line bg-surface-2 p-3.5">
          {sample.parts.map((part) => (
            <div key={part.label} className="border-b border-line py-2 first:pt-0 last:border-0 last:pb-0">
              <p className="text-2xs font-semibold tracking-wide text-ink-3">{part.label}</p>
              <p className={clsx("mt-0.5 text-sm", part.mono ? "tnum font-mono break-all text-ink" : "text-ink")}>
                {part.runs.map((run, i) =>
                  run.clue ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelected(run.clue!.id);
                        setFound((f) => (f.includes(run.clue!.id) ? f : [...f, run.clue!.id]));
                      }}
                      className={clsx(
                        // Deliberately unmarked until found: a phishing message
                        // does not arrive with its giveaways highlighted.
                        "rounded px-0.5 transition-colors",
                        found.includes(run.clue.id)
                          ? "bg-warn-wash text-warn"
                          : "hover:bg-surface-3 hover:underline hover:decoration-dotted hover:underline-offset-2",
                        selected === run.clue.id && "ring-1 ring-warn",
                      )}
                    >
                      {run.text}
                    </button>
                  ) : (
                    <span key={i}>{run.text}</span>
                  ),
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="grid content-start gap-3 lg:border-l lg:border-line lg:pl-4">
          {!isPhish ? (
            <div className="rounded-lg border border-ok bg-ok-wash px-3.5 py-3">
              <p className="text-2xs font-semibold text-ok">Nothing to find</p>
              <p className="mt-1 max-w-[38ch] text-sm text-ink-2">
                It comes from the bank's own domain, it uses your name, it asks for nothing, it carries no link
                and no attachment. Compare it with the other message: the differences are the lesson.
              </p>
            </div>
          ) : clue ? (
            <div
              key={clue.id}
              className="rounded-lg border border-line bg-surface-2 px-3.5 py-3"
              style={{ animation: "rise var(--dur) var(--ease-out-quart)" }}
            >
              <p className="text-2xs font-semibold text-warn">Why this is a giveaway</p>
              <p className="mt-1 max-w-[38ch] text-sm text-ink-2">{clue.why}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-line-strong px-3.5 py-3">
              <p className="max-w-[38ch] text-sm text-ink-2">
                {total} things in this message should stop you. Click any part that looks wrong and the reason
                appears here.
              </p>
            </div>
          )}

          {isPhish && found.length === total && (
            <div className="rounded-lg border border-ok bg-ok-wash px-3.5 py-3" style={{ animation: "rise var(--dur) var(--ease-out-quart)" }}>
              <p className="text-2xs font-semibold text-ok">All {total} found</p>
              <p className="mt-1 max-w-[38ch] text-sm text-ink-2">
                In real life you would never need all {total}; one is enough to stop and check by another route.
                Never use a link in the message itself to do the checking.
              </p>
            </div>
          )}

          {isPhish && (
            <Button size="sm" onClick={() => { setFound([]); setSelected(null); }} disabled={!found.length}>
              Start again
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}

/* ================================================================== *
 * 5. Protection
 * ================================================================== */

const EXAMPLE_PASSWORDS = ["password", "Kandy2010", "n3tw0rk!", "correct-horse-battery"];

function ProtectSection() {
  const [trafficId, setTrafficId] = useState(TRAFFIC_SAMPLES[1].id);
  const [password, setPassword] = useState("Kandy2010");

  const traffic = TRAFFIC_SAMPLES.find((t) => t.id === trafficId) ?? TRAFFIC_SAMPLES[0];
  const verdict = firewallDecide(FIREWALL_RULES, traffic);
  const strength = passwordStrength(password);

  return (
    <Section
      id="protect"
      title="Three defences, none of them enough on its own"
      lead="A firewall decides what may cross the boundary of the network. Antivirus software deals with what got in anyway. And the person at the keyboard decides whether either of those ever gets the chance to help, which is why the syllabus lists education alongside the software."
    >
      <Panel
        title="Firewall rule tester"
        subtitle="Rules are checked from the top down, and the first one that matches decides. Anything not matched is blocked."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Extra>rule tables</Extra>
            <Badge tone={verdict.action === "allow" ? "ok" : "bad"}>
              {verdict.action === "allow" ? "Allowed" : "Blocked"}
            </Badge>
          </div>
        }
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
          <Scope height={190}>
            <ScopeCanvas
              label={`${traffic.label}: ${traffic.direction === "in" ? "arriving" : "leaving"} on ${traffic.protocol} port ${traffic.port}, and the firewall ${verdict.action === "allow" ? "allows" : "blocks"} it`}
              animate
              deps={[trafficId]}
              bounds={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
              insets={{ left: 0, right: 0, top: 0, bottom: 0 }}
              draw={({ plot, ctx, palette, time, w, h }) => {
                const y = h * 0.46;
                const wallX = w * 0.5;
                const netX = w - 46;
                const outX = 46;
                const allowed = verdict.action === "allow";
                const outbound = traffic.direction === "out";

                // Inside and outside.
                plot.text(outX, y + 44, "the Internet", palette.inkFaint, { size: 9, align: "center" });
                plot.text(netX, y + 44, "our network", palette.inkFaint, { size: 9, align: "center" });

                ctx.save();
                ctx.strokeStyle = palette.gridMajor;
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(outX, y);
                ctx.lineTo(netX, y);
                ctx.stroke();
                ctx.restore();

                [outX, netX].forEach((x, i) => {
                  ctx.save();
                  ctx.fillStyle = palette.bg;
                  ctx.strokeStyle = palette.series[i === 0 ? 4 : 1];
                  ctx.lineWidth = 1.8;
                  ctx.beginPath();
                  ctx.roundRect(x - 30, y - 18, 60, 36, 6);
                  ctx.fill();
                  ctx.stroke();
                  ctx.restore();
                });

                // The wall itself, brick-ish, so it reads as a barrier.
                const wallColour = allowed ? palette.series[2] : palette.bad;
                ctx.save();
                ctx.fillStyle = palette.bg;
                ctx.strokeStyle = wallColour;
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.roundRect(wallX - 17, y - 52, 34, 104, 6);
                ctx.fill();
                ctx.stroke();
                ctx.globalAlpha = 0.5;
                for (let i = 0; i < 6; i++) {
                  ctx.beginPath();
                  ctx.moveTo(wallX - 17, y - 52 + i * 17.3);
                  ctx.lineTo(wallX + 17, y - 52 + i * 17.3);
                  ctx.stroke();
                }
                ctx.restore();
                plot.text(wallX, y + 58, "firewall", wallColour, { size: 10, weight: 700, align: "center" });

                // The packet's run at the wall.
                const cycle = (time * 0.42) % 1;
                const from = outbound ? netX : outX;
                const to = outbound ? outX : netX;
                const reach = allowed ? 1 : 0.52;
                const u = cycle < reach ? cycle : reach - (cycle - reach) * 0.9;
                const px = from + (to - from) * Math.max(0, u);
                const colour = allowed ? palette.series[2] : palette.bad;

                ctx.save();
                ctx.font = '700 9px "JetBrains Mono Variable", ui-monospace, monospace';
                const label = `${traffic.protocol} :${traffic.port}`;
                const tw = ctx.measureText(label).width + 16;
                if (palette.isDark) {
                  ctx.shadowColor = colour;
                  ctx.shadowBlur = 12;
                }
                ctx.fillStyle = colour;
                ctx.globalAlpha = !allowed && cycle > reach ? 0.45 : 1;
                ctx.beginPath();
                ctx.roundRect(px - tw / 2, y - 30, tw, 18, 4);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = palette.bg;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(label, px, y - 21);
                ctx.restore();

                plot.text(
                  wallX,
                  h - 16,
                  allowed
                    ? `allowed by rule ${verdict.rule?.id.toUpperCase()}`
                    : `blocked${verdict.rule ? ` by rule ${verdict.rule.id.toUpperCase()}` : ""}`,
                  colour,
                  { size: 10, weight: 700, align: "center" },
                );
              }}
            />
          </Scope>

          <div className="grid content-start gap-3 lg:border-l lg:border-line lg:pl-4">
            <div>
              <p className="mb-2 text-xs font-medium text-ink-2">Traffic to test</p>
              <div className="grid gap-1">
                {TRAFFIC_SAMPLES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTrafficId(t.id)}
                    className={clsx(
                      "flex items-baseline justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                      trafficId === t.id ? "border-brand-edge bg-brand-wash" : "border-line bg-surface hover:bg-surface-2",
                    )}
                  >
                    <span className="min-w-0 text-xs font-medium text-ink">{t.label}</span>
                    <span className="tnum shrink-0 font-mono text-2xs text-ink-3">
                      {t.direction === "in" ? "↓" : "↑"} {t.port}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <p className="max-w-[34ch] text-sm text-ink-2">{traffic.detail}</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto border-t border-line pt-4">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                {["", "Action", "Direction", "Protocol", "Port", "What it is for"].map((th, i) => (
                  <th key={i} className="px-3 py-2 text-2xs font-semibold tracking-wide text-ink-3">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FIREWALL_RULES.map((r) => {
                const hit = verdict.rule?.id === r.id;
                return (
                  <tr
                    key={r.id}
                    className={clsx("border-b border-line last:border-0", hit && "bg-brand-wash")}
                  >
                    <td className="tnum px-3 py-2 font-mono text-2xs text-ink-3">
                      {hit ? <span className="font-semibold text-brand">→</span> : ""} {r.id.toUpperCase()}
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={r.action === "allow" ? "ok" : "bad"}>{r.action}</Badge>
                    </td>
                    <td className="px-3 py-2 text-ink-2">{r.direction === "in" ? "inbound" : "outbound"}</td>
                    <td className="tnum px-3 py-2 font-mono text-ink-2">{r.protocol}</td>
                    <td className="tnum px-3 py-2 font-mono text-ink-2">{r.port}</td>
                    <td className="max-w-[34ch] px-3 py-2 text-ink-2">{r.what}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 max-w-[74ch] rounded-lg bg-surface-2 px-3.5 py-2.5 text-sm text-ink-2">
          Notice the last sample. Traffic <em>leaving</em> the network matches the first rule and is allowed, so
          malware already running inside can still reach the Internet. A firewall guards the boundary; it does
          nothing about what is already on the wrong side of it.
        </p>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-3">
        {PROTECTIONS.map((p) => (
          <Panel key={p.name} title={p.name}>
            <p className="max-w-[40ch] text-sm text-ink-2">{p.what}</p>
            <ul className="mt-3 grid gap-1">
              {p.stops.map((s) => (
                <li key={s} className="flex gap-2 text-sm text-ink-2">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full" style={{ background: `var(--s${p.series + 1})` }} />
                  <span className="max-w-[34ch]">{s}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-line pt-2.5 text-2xs text-ink-3">
              <span className="font-semibold">But: </span>
              {p.limit}
            </p>
          </Panel>
        ))}
      </div>

      <Panel
        title="Password lab"
        subtitle="Type an example, never a password you actually use. Nothing here leaves your browser."
        actions={<Extra>the arithmetic behind a strong password</Extra>}
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <label htmlFor="pw" className="text-xs font-medium text-ink-2">
              Example password
            </label>
            <input
              id="pw"
              type="text"
              value={password}
              maxLength={48}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setPassword(e.target.value)}
              className="tnum mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm text-ink outline-none focus:border-brand"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXAMPLE_PASSWORDS.map((p) => (
                <Button key={p} size="sm" onClick={() => setPassword(p)}>
                  {p}
                </Button>
              ))}
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full transition-[width,background-color] duration-200 ease-[var(--ease-out-quart)]"
                style={{
                  width: `${Math.min(100, (strength.bits / 80) * 100)}%`,
                  background:
                    strength.verdict === "strong"
                      ? "var(--ok)"
                      : strength.verdict === "reasonable"
                        ? "var(--warn)"
                        : "var(--bad)",
                }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {strength.sets.map((s) => (
                <span
                  key={s.label}
                  className={clsx("text-2xs", s.used ? "font-medium text-ink-2" : "text-ink-3 line-through opacity-60")}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 lg:border-l lg:border-line lg:pl-4">
            <Readout label="Characters possible" value={strength.pool || "—"} sub="per position" />
            <Readout label="Guessing needed" value={`${strength.bits.toFixed(0)} bits`} sub={`${strength.length} characters`} />
            <Readout
              label="Time to guess"
              value={strength.crackTime}
              tone={strength.verdict === "strong" ? "ok" : strength.verdict === "reasonable" ? "warn" : "bad"}
              sub="at 10 billion guesses a second"
            />
          </div>
        </div>

        <p className="mt-3 max-w-[74ch] text-sm text-ink-2">
          Length beats cleverness. Adding one character multiplies the work by the size of the character set,
          while swapping <span className="tnum font-mono">o</span> for{" "}
          <span className="tnum font-mono">0</span> adds almost nothing, since attackers try that substitution first.
          A long phrase you can remember is stronger than a short string you cannot.
        </p>
      </Panel>

      <Callout kind="warn" title="Good practice, in the order it matters">
        Keep software and antivirus definitions updated, because an out-of-date scanner cannot recognise what is
        current. Use a different password for every account, so one breach does not open the rest. Do not open
        attachments or links you were not expecting, even from a name you know. Back up anything you would mind
        losing, and keep the backup disconnected, because ransomware encrypts whatever it can reach.
      </Callout>
    </Section>
  );
}

/* ================================================================== *
 * Quiz
 * ================================================================== */

const QUESTIONS: Question[] = [
  {
    id: "s1",
    prompt: "Amal wants to send Kamala a message that only she can read. Which key does he encrypt it with?",
    options: [
      { label: "Kamala's public key", correct: true },
      { label: "Kamala's private key" },
      { label: "His own private key" },
      { label: "A key they agreed over the telephone" },
    ],
    explain:
      "Anything encrypted with Kamala's public key can only be undone by the matching private key, which only she holds. That is what makes confidentiality possible between two people who have never met: the locking key can be published freely.",
  },
  {
    id: "s2",
    prompt: "What does signing a message with your private key allow the receiver to do?",
    options: [
      { label: "Read the message without a key" },
      { label: "Confirm that it came from you and has not been altered", correct: true },
      { label: "Keep the message secret from everyone else" },
      { label: "Recover the message if it is lost in transit" },
    ],
    explain:
      "Only the holder of the private key could have produced a signature that opens correctly with the matching public key, and the digest inside it only matches if not one character has changed. That is authentication and integrity, but not secrecy, since the message itself still travels in the open.",
  },
  {
    id: "s3",
    prompt: "What is the main practical difficulty with symmetric key encryption?",
    options: [
      { label: "It is far too slow for ordinary use" },
      { label: "Both sides must already share the same secret key before they can communicate", correct: true },
      { label: "It cannot encrypt long messages" },
      { label: "The key can be worked out from the ciphertext" },
    ],
    explain:
      "Symmetric encryption is fast and perfectly strong; the problem is delivering the key. Sending it over the network you do not trust defeats the purpose, and the number of keys needed grows as n(n−1)/2 with the number of people.",
  },
  {
    id: "s4",
    prompt: "Which description matches a trojan?",
    options: [
      { label: "A program that attaches itself to other files and copies itself" },
      { label: "A program that misleads the user about what it is, so they install it themselves", correct: true },
      { label: "A message pretending to come from a bank" },
      { label: "Software that scans for and removes malicious code" },
    ],
    explain:
      "A trojan gets in by deception rather than by spreading: it looks like something useful and the user installs it willingly. Copying itself into other files is what a virus does, and a fake message from a bank is phishing.",
  },
  {
    id: "s5",
    prompt: "An email says your account will be closed in 24 hours unless you confirm your password on the linked page. What is happening?",
    options: [
      { label: "A virus has infected the mail server" },
      { label: "Phishing: an attempt to get your credentials by pretending to be someone you trust", correct: true },
      { label: "A firewall rule has blocked your account" },
      { label: "The bank is performing a routine security check" },
    ],
    explain:
      "Urgency, a threat, and a request for a password are the signature of phishing. No genuine organisation asks for your password, because they never need it. If in doubt, reach the organisation the way you normally would, never through a link in the message.",
  },
  {
    id: "s6",
    prompt: "A school has a firewall and updated antivirus software. A student still loses their account. What most likely happened?",
    options: [
      { label: "The firewall was pointed the wrong way" },
      { label: "The antivirus software cannot scan encrypted traffic" },
      { label: "The student was tricked into giving their password away, and no software setting prevents that", correct: true },
      { label: "The password was too long for the system" },
    ],
    explain:
      "A firewall filters traffic at the boundary and antivirus deals with malicious code. Neither can stop a person from typing their password into a convincing page. That is exactly why the syllabus lists education, awareness and good practice as a protection measure in its own right.",
  },
];
