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

      {/* Full viewport height minus the 3.5rem bar, so short pages still push the footer down. */}
      <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-[1600px]">
        <SideNav open={navOpen} onClose={() => setNavOpen(false)} />
        {/* main and footer share a column so the footer clears the sidebar. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
            <Outlet />
          </main>
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line px-4 py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="flex items-center gap-1.5 text-xs text-ink-2">
          Made with
          <HeartMark />
          <span className="sr-only">love</span>
          by <span className="font-medium text-ink">Sahan Perera</span>
          <span className="text-ink-3">·</span>
          <span className="tnum font-mono text-ink-3">2026</span>
        </p>

        <nav aria-label="Elsewhere" className="flex items-center gap-1.5">
          {/* Icon-only for the two secondary profiles; h-8 matches the GitHub pill's height. */}
          <SocialIcon
            href="https://www.linkedin.com/in/sahan-perera-64183b204/"
            label="Sahan Perera on LinkedIn"
          >
            <LinkedInMark />
          </SocialIcon>
          <SocialIcon href="https://www.instagram.com/sahan._perera/" label="Sahan Perera on Instagram">
            <InstagramMark />
          </SocialIcon>

          <a
            href="https://github.com/Sahan-Madusanka-Perera"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <GitHubMark />
            Sahan-Madusanka-Perera
          </a>
        </nav>
      </div>
    </footer>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={label}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {children}
      <span className="sr-only">{label}</span>
    </a>
  );
}

function HeartMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <path
        d="M8 14s-5.5-3.4-5.5-7A3.2 3.2 0 018 5.1 3.2 3.2 0 0113.5 7c0 3.6-5.5 7-5.5 7z"
        fill="var(--brand)"
      />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 110-4.13 2.07 2.07 0 010 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"
      />
    </svg>
  );
}

/* Instagram's mark is an outline by design, so it is drawn with strokes like the other UI icons. */
function InstagramMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
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
