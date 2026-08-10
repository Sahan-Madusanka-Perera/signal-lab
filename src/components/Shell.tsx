import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import { LESSONS } from "../lib/curriculum";
import { overallProgress, useProgress } from "../lib/progress";
import { useTheme, type ThemeChoice } from "../lib/theme";

export function Shell() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setNavOpen(false);
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[var(--z-toast)] focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-ink"
      >
        Skip to content
      </a>

      <TopBar onMenu={() => setNavOpen((o) => !o)} navOpen={navOpen} />

      <div className="mx-auto flex w-full max-w-[1600px]">
        <SideNav open={navOpen} onClose={() => setNavOpen(false)} />
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function TopBar({ onMenu, navOpen }: { onMenu: () => void; navOpen: boolean }) {
  return (
    <header className="sticky top-0 z-[var(--z-nav)] border-b border-line bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-3 px-4">
        <button
          type="button"
          onClick={onMenu}
          aria-expanded={navOpen}
          aria-label="Toggle lesson navigation"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink lg:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <NavLink to="/" className="flex items-center gap-2.5 rounded-lg pr-2">
          <WaveMark />
          <span className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-ink">SignalLab</span>
            <span className="hidden text-2xs text-ink-3 sm:inline">Competency 6</span>
          </span>
        </NavLink>

        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}

function WaveMark() {
  return (
    <span
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-brand-edge"
      style={{ background: "var(--brand-wash)" }}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M1 10c1.6-6 3.2-6 4.8 0s3.2 6 4.8 0"
          stroke="var(--brand)"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path d="M10.6 10h2.2V5.2h3.1V15H19" stroke="var(--brand)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ThemeSwitch() {
  const { choice, setChoice } = useTheme();
  const options: { value: ThemeChoice; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <SunIcon /> },
    { value: "dark", label: "Dark", icon: <MoonIcon /> },
    { value: "system", label: "System", icon: <SystemIcon /> },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={choice === o.value}
          title={o.label}
          onClick={() => setChoice(o.value)}
          className={clsx(
            "grid h-7 w-7 place-items-center rounded-[6px] transition-colors duration-150",
            choice === o.value ? "bg-bg text-ink shadow-sm" : "text-ink-3 hover:text-ink",
          )}
        >
          {o.icon}
          <span className="sr-only">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function SideNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { progress, totalQuestions, lessonScore } = useProgress();
  const pct = Math.round(overallProgress(progress, totalQuestions) * 100);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-[var(--z-backdrop)] bg-[oklch(0_0_0/0.4)] lg:hidden"
        />
      )}

      <nav
        aria-label="Lessons"
        className={clsx(
          "fixed top-14 bottom-0 left-0 z-[var(--z-drawer)] w-[264px] shrink-0 overflow-y-auto border-r border-line bg-surface transition-transform duration-200 ease-[var(--ease-out-quart)]",
          "lg:sticky lg:top-14 lg:z-[var(--z-sticky)] lg:h-[calc(100dvh-3.5rem)] lg:translate-x-0 lg:bg-bg",
          open ? "translate-x-0 shadow-lg" : "-translate-x-full",
        )}
      >
        <div className="p-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )
            }
          >
            <HomeIcon />
            Overview
          </NavLink>

          <p className="mt-5 mb-1.5 px-2.5 text-2xs font-semibold tracking-wide text-ink-3">
            Competency levels
          </p>

          <ul className="grid gap-0.5">
            {LESSONS.map((l) => {
              const { done, total } = lessonScore(l.id);
              const complete = total > 0 && done >= total;
              return (
                <li key={l.id}>
                  <NavLink
                    to={`/lesson/${l.id}`}
                    className={({ isActive }) =>
                      clsx(
                        "group flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                        isActive ? "bg-brand-wash text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={clsx(
                            "tnum mt-px shrink-0 font-mono text-2xs font-semibold",
                            isActive ? "text-brand" : "text-ink-3",
                          )}
                        >
                          {l.code}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm leading-snug font-medium">{l.title}</span>
                        </span>
                        {complete && (
                          <span className="mt-0.5 shrink-0 text-ok" title="All questions answered">
                            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden>
                              <path
                                d="M2 5.2L4 7.2L8 2.8"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-2xs font-medium text-ink-2">Questions answered</span>
              <span className="tnum font-mono text-2xs font-semibold text-ink">{pct}%</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300 ease-[var(--ease-out-quart)]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-2xs text-ink-3">Saved in this browser only.</p>
          </div>
        </div>
      </nav>
    </>
  );
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 6l5-4 5 4v5.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="2.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 1v1.4M7 11.6V13M13 7h-1.4M2.4 7H1M11.2 2.8l-1 1M3.8 10.2l-1 1M11.2 11.2l-1-1M3.8 3.8l-1-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M11.5 8.4A5 5 0 015.6 2.5 5 5 0 107 12a5 5 0 004.5-3.6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function SystemIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1.5" y="2.5" width="11" height="7.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 12.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
