import { Link } from "react-router-dom";
import { ScopeCanvas } from "../components/ScopeCanvas";
import { LESSONS } from "../lib/curriculum";
import { overallProgress, useProgress } from "../lib/progress";
import { TAU } from "../lib/signal";

export function Home() {
  const { progress, totalQuestions, lessonScore, reset } = useProgress();
  const pct = Math.round(overallProgress(progress, totalQuestions) * 100);
  const started = progress.visited.length > 0;
  const nextLesson = LESSONS.find((l) => !progress.visited.includes(l.id)) ?? LESSONS[0];

  return (
    <div className="px-4 pb-20 lg:px-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <section className="relative py-12 sm:py-16">
          <div className="blueprint pointer-events-none absolute inset-x-0 top-0 h-56 opacity-[0.55]" aria-hidden />
          <div className="relative">
            <p className="text-xs font-medium text-brand">GCE Advanced Level · ICT · Competency 6</p>
            <h1 className="mt-2 max-w-[16ch] text-4xl font-semibold tracking-tight text-ink">
              Data communication, drawn out.
            </h1>
            <p className="mt-3 max-w-[64ch] text-lg text-ink-2">
              Five competency levels, each built around instruments you can actually move. Drag a slider and the
              waveform answers — because a signal is far easier to understand when you can bend it yourself
              than when it is a static diagram in a textbook.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to={`/lesson/${nextLesson.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-medium text-brand-ink shadow-sm transition-[background-color,transform] duration-150 ease-[var(--ease-out-quart)] hover:bg-brand-strong active:scale-[0.985]"
              >
                {started ? "Continue" : "Start with"} {nextLesson.code}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2 6h7m0 0L6.2 3.2M9 6l-2.8 2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              {started && (
                <span className="text-xs text-ink-3">
                  {pct}% of the questions answered
                  <button
                    type="button"
                    onClick={reset}
                    className="ml-2 rounded font-medium text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
                  >
                    reset progress
                  </button>
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="sr-only">Competency levels</h2>
          <ul className="grid gap-3">
            {LESSONS.map((l, i) => {
              const { done, total } = lessonScore(l.id);
              const visited = progress.visited.includes(l.id);
              return (
                <li key={l.id}>
                  <Link
                    to={`/lesson/${l.id}`}
                    className="group grid items-center gap-4 rounded-xl border border-line bg-surface p-4 transition-[border-color,background-color,transform] duration-200 ease-[var(--ease-out-quart)] hover:-translate-y-px hover:border-line-strong hover:bg-surface-2 sm:grid-cols-[auto_minmax(0,1fr)_170px]"
                  >
                    <div className="flex items-center gap-3 sm:block">
                      <span className="tnum font-mono text-sm font-semibold text-brand">{l.code}</span>
                      <span className="text-2xs text-ink-3 sm:mt-0.5 sm:block">{l.periods} periods</span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-ink">{l.title}</h3>
                      <p className="mt-0.5 max-w-[64ch] text-sm text-ink-2">{l.tagline}</p>
                      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-ink-3">
                        {l.sections
                          .filter((s) => s.id !== "check")
                          .map((s) => (
                            <span key={s.id}>{s.label}</span>
                          ))}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 sm:justify-end">
                      <div className="h-[52px] w-[96px] shrink-0 overflow-hidden rounded-md border border-line">
                        <ScopeCanvas
                          label=""
                          bounds={{ x0: 0, x1: 1, y0: -1.25, y1: 1.25 }}
                          insets={{ left: 4, right: 4, top: 4, bottom: 4 }}
                          deps={[i]}
                          draw={({ plot, palette }) => {
                            drawThumb(plot, palette, i);
                          }}
                        />
                      </div>
                      <div className="w-[52px] shrink-0 text-right">
                        {total > 0 && done >= total ? (
                          <span className="text-2xs font-semibold text-ok">Done</span>
                        ) : visited ? (
                          <span className="tnum text-2xs text-ink-3">
                            {done}/{total || "–"}
                          </span>
                        ) : (
                          <span className="text-2xs text-ink-3">New</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-10 grid gap-3 border-t border-line pt-8 sm:grid-cols-3">
          {[
            {
              t: "Everything is live",
              d: "No pre-rendered diagrams. Every waveform on the site is computed from the same equations you are asked to use in the paper.",
            },
            {
              t: "Syllabus wording kept",
              d: "Each level lists its learning outcomes and contents exactly as they appear in the syllabus, so you can tick off your own coverage.",
            },
            {
              t: "Progress stays here",
              d: "Answers are stored in this browser alone. There is no account, nothing is uploaded, and clearing your browser data clears them.",
            },
          ].map((c) => (
            <div key={c.t}>
              <h3 className="text-sm font-semibold text-ink">{c.t}</h3>
              <p className="mt-1 max-w-[42ch] text-sm text-ink-2">{c.d}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

/** A small distinct trace per lesson, so the list reads as five different topics. */
function drawThumb(
  plot: import("../lib/plot").Plot,
  palette: import("../lib/theme").Palette,
  index: number,
) {
  const N = 260;
  const c = palette.series[index % 5];

  if (index === 0) {
    const d = new Float64Array(N);
    for (let i = 0; i < N; i++) d[i] = Math.sin((TAU * 2 * i) / (N - 1));
    plot.trace(d, c, { width: 1.6, glow: 6 });
  } else if (index === 1) {
    const d = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      d[i] = Math.sin(TAU * 2.5 * u) * (1 - u * 0.8);
    }
    plot.trace(d, c, { width: 1.6, glow: 6 });
  } else if (index === 2) {
    const bits = [1, 0, 1, 1, 0];
    const segs = bits.flatMap((b, i) => [
      { from: i, to: i + 0.5, level: (b ? -1 : 1) as -1 | 1 },
      { from: i + 0.5, to: i + 1, level: (b ? 1 : -1) as -1 | 1 },
    ]);
    plot.bounds.x1 = bits.length;
    plot.steps(segs, c, { width: 1.6, glow: 6, high: 0.85, low: -0.85 });
  } else if (index === 3) {
    const d = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      d[i] = Math.sin(TAU * 9 * u) * (0.45 + 0.5 * Math.sin(TAU * 1 * u));
    }
    plot.trace(d, c, { width: 1.4, glow: 6 });
  } else {
    // Star topology glyph
    const cx = plot.w / 2;
    const cy = plot.h / 2;
    const r = Math.min(plot.w, plot.h) / 2 - 5;
    const ctx = plot.ctx;
    ctx.save();
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2.4, 0, TAU);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 3.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
