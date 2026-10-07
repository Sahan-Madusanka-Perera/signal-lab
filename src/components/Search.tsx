import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { LESSONS } from "../lib/curriculum";
import { GLOSSARY, searchGlossary } from "../lib/glossary";

/**
 * One place to look anything up: the twelve levels, every section inside them,
 * and the hundred terms the paper expects a definition for.
 *
 * A student who meets "attenuation" again in 6.12 should not have to remember
 * that 6.2 taught it, so a term match shows the definition straight away and
 * links to the section that explains it properly.
 */

type Hit =
  | { kind: "lesson"; id: string; code: string; title: string; sub: string; to: string }
  | { kind: "section"; id: string; code: string; title: string; sub: string; to: string }
  | { kind: "term"; id: string; code: string; title: string; sub: string; to: string };

const lessonOf = (id: string) => LESSONS.find((l) => l.id === id)!;

function buildHits(query: string): Hit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const lessons: Hit[] = LESSONS.filter(
    (l) => l.title.toLowerCase().includes(q) || l.code.includes(q) || l.tagline.toLowerCase().includes(q),
  ).map((l) => ({
    kind: "lesson" as const,
    id: `lesson:${l.id}`,
    code: l.code,
    title: l.title,
    sub: l.tagline,
    to: `/lesson/${l.id}`,
  }));

  const sections: Hit[] = LESSONS.flatMap((l) =>
    l.sections
      .filter((s) => s.label.toLowerCase().includes(q) && s.id !== "check")
      .map((s) => ({
        kind: "section" as const,
        id: `section:${l.id}:${s.id}`,
        code: l.code,
        title: s.label,
        sub: l.title,
        to: `/lesson/${l.id}#${s.id}`,
      })),
  );

  const terms: Hit[] = searchGlossary(q).map((e) => {
    const l = lessonOf(e.lessonId);
    return {
      kind: "term" as const,
      id: `term:${e.term}`,
      code: l.code,
      title: e.term,
      sub: e.definition,
      to: `/lesson/${e.lessonId}#${e.sectionId}`,
    };
  });

  // Terms first: a one-line definition is usually what was wanted.
  return [...terms, ...lessons, ...sections].slice(0, 24);
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const hits = useMemo(() => buildHits(query), [query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    // The dialog mounts hidden, so focus has to wait for the paint.
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  // Hold the page still behind the dialog.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const go = useCallback(
    (hit: Hit) => {
      onClose();
      navigate(hit.to);
      // The lesson chunk may still be loading, so the anchor is scrolled to
      // once it exists rather than immediately.
      const hash = hit.to.split("#")[1];
      if (!hash) return;
      let tries = 0;
      const find = () => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else if (tries++ < 40) requestAnimationFrame(find);
      };
      requestAnimationFrame(find);
    },
    [navigate, onClose],
  );

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (hits.length ? (a + 1) % hits.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (hits.length ? (a - 1 + hits.length) % hits.length : 0));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-toast)] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search the site"
    >
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[oklch(0_0_0/0.4)] backdrop-blur-[2px]"
      />

      <div
        className="relative flex max-h-[70vh] w-full max-w-[620px] flex-col overflow-hidden rounded-xl border border-line bg-bg shadow-[0_24px_60px_-12px_oklch(0_0_0/0.45)]"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-ink-3">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search levels, sections and terms"
            aria-label="Search levels, sections and terms"
            autoComplete="off"
            spellCheck={false}
            className="h-12 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
          />
          <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-2xs text-ink-3 sm:block">
            Esc
          </kbd>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {!query.trim() ? (
            <EmptyPrompt onPick={setQuery} />
          ) : hits.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-2">
              Nothing matches <span className="font-medium text-ink">{query}</span>.
            </p>
          ) : (
            <ul ref={listRef} className="py-1.5">
              {hits.map((h, i) => (
                <li key={h.id}>
                  <button
                    type="button"
                    data-active={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(h)}
                    className={clsx(
                      "flex w-full items-start gap-3 px-4 py-2 text-left",
                      i === active && "bg-surface-2",
                    )}
                  >
                    <span className="tnum mt-[3px] w-8 shrink-0 font-mono text-2xs font-semibold text-brand">
                      {h.code}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink">{h.title}</span>
                        <span className="shrink-0 text-2xs text-ink-3">
                          {h.kind === "term" ? "term" : h.kind === "lesson" ? "level" : "section"}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-2">{h.sub}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line px-4 py-2 text-2xs text-ink-3">
          <Hint keys="↑↓" label="move" />
          <Hint keys="↵" label="open" />
          <span className="ml-auto tnum">{GLOSSARY.length} terms</span>
        </div>
      </div>
    </div>
  );
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <kbd className="rounded border border-line px-1 font-mono">{keys}</kbd>
      {label}
    </span>
  );
}

/** A few starting points, so an empty box is not a dead end. */
function EmptyPrompt({ onPick }: { onPick: (q: string) => void }) {
  const suggestions = ["subnet mask", "attenuation", "CSMA/CD", "encapsulation", "NAT", "parity"];
  return (
    <div className="px-4 py-5">
      <p className="text-2xs font-semibold tracking-wide text-ink-3">TRY</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-md border border-line px-2 py-1 text-xs text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Opens the dialog from the top bar, and on Ctrl/Cmd+K anywhere. */
export function SearchButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search levels, sections and terms"
        className="flex h-9 items-center gap-2 rounded-lg border border-line px-2.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="hidden text-xs sm:inline">Search</span>
        <kbd className="hidden rounded border border-line px-1 font-mono text-2xs md:inline">⌘K</kbd>
      </button>
      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
