import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { LESSONS, lessonIndex, type LessonMeta } from "../lib/curriculum";
import { useProgress } from "../lib/progress";

/**
 * Shared chrome for a competency level: title block, syllabus outcomes,
 * a scroll-spy section rail, and the link to the next level.
 */
export function LessonPage({ meta, children }: { meta: LessonMeta; children: ReactNode }) {
  const { markVisited } = useProgress();
  const active = useSectionSpy(meta.sections.map((s) => s.id));

  useEffect(() => {
    markVisited(meta.id);
    window.scrollTo({ top: 0 });
  }, [meta.id, markVisited]);

  const i = lessonIndex(meta.id);
  const prev = i > 0 ? LESSONS[i - 1] : null;
  const next = i < LESSONS.length - 1 ? LESSONS[i + 1] : null;

  return (
    <div className="px-4 pb-16 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1180px] gap-10">
        <div className="min-w-0 flex-1">
          <header className="border-b border-line py-8">
            <div className="flex items-center gap-2">
              <span className="tnum font-mono text-xs font-semibold text-brand">{meta.code}</span>
              <span className="text-2xs text-ink-3">·</span>
              <span className="text-2xs text-ink-3">{meta.periods} periods</span>
            </div>
            <h1 className="mt-1.5 max-w-[20ch] text-3xl font-semibold tracking-tight text-ink">{meta.title}</h1>
            <p className="mt-2 max-w-[62ch] text-lg text-ink-2">{meta.tagline}</p>

            <details className="group mt-5">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md text-xs font-medium text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden
                  className="transition-transform duration-150 group-open:rotate-90"
                >
                  <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Syllabus outcomes for this level
              </summary>
              <div className="mt-3 grid gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
                <div>
                  <p className="text-2xs font-semibold text-ink-3">Learning outcomes</p>
                  <ul className="mt-1.5 grid gap-1.5">
                    {meta.outcomes.map((o) => (
                      <li key={o} className="flex gap-2 text-xs text-ink-2">
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                        <span className="max-w-[52ch]">{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-2xs font-semibold text-ink-3">Contents</p>
                  <ul className="mt-1.5 grid gap-1.5">
                    {meta.contents.map((c) => (
                      <li key={c} className="flex gap-2 text-xs text-ink-2">
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                        <span className="max-w-[52ch]">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          </header>

          {/* minmax(0,1fr): an auto grid track floors at min-content, which lets a
              wide scrollable table inside a section push the whole page sideways. */}
          <div className="grid grid-cols-[minmax(0,1fr)] gap-14 pt-10">{children}</div>

          <nav className="mt-16 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-stretch sm:justify-between">
            {prev ? (
              <Link
                to={`/lesson/${prev.id}`}
                className="group flex min-w-0 flex-1 flex-col rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong hover:bg-surface-2"
              >
                <span className="text-2xs text-ink-3">← Previous · {prev.code}</span>
                <span className="mt-0.5 truncate text-sm font-medium text-ink">{prev.title}</span>
              </Link>
            ) : (
              <span className="hidden flex-1 sm:block" />
            )}
            {next ? (
              <Link
                to={`/lesson/${next.id}`}
                className="group flex min-w-0 flex-1 flex-col rounded-xl border border-brand-edge bg-brand-wash px-4 py-3 text-right transition-[filter] hover:brightness-[1.03]"
              >
                <span className="text-2xs text-brand">Next · {next.code} →</span>
                <span className="mt-0.5 truncate text-sm font-medium text-ink">{next.title}</span>
              </Link>
            ) : (
              <Link
                to="/"
                className="flex min-w-0 flex-1 flex-col rounded-xl border border-brand-edge bg-brand-wash px-4 py-3 text-right transition-[filter] hover:brightness-[1.03]"
              >
                <span className="text-2xs text-brand">You've reached the end →</span>
                <span className="mt-0.5 truncate text-sm font-medium text-ink">Back to the overview</span>
              </Link>
            )}
          </nav>
        </div>

        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[188px] shrink-0 self-start pt-10 xl:block">
          <p className="mb-2 pl-3 text-2xs font-semibold tracking-wide text-ink-3">On this page</p>
          <ul className="grid gap-px">
            {meta.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={clsx(
                    "block rounded-md py-1 pl-3 text-xs transition-colors",
                    active === s.id
                      ? "font-medium text-ink shadow-[inset_2px_0_0_var(--brand)]"
                      : "text-ink-3 hover:text-ink-2",
                  )}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

/** A titled block within a lesson. */
export function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="min-w-0 scroll-mt-20">
      <h2 className="max-w-[24ch] text-xl font-semibold tracking-tight text-ink">{title}</h2>
      {lead && <p className="mt-2 max-w-[70ch] text-ink-2">{lead}</p>}
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5">{children}</div>
    </section>
  );
}

function useSectionSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join("|");

  useEffect(() => {
    const sections = key
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -60% 0px", threshold: 0 },
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [key]);

  return active;
}
