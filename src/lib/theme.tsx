import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeChoice = "light" | "dark" | "system";

const KEY = "signallab.theme";

type Ctx = {
  choice: ThemeChoice;
  resolved: "light" | "dark";
  setChoice: (c: ThemeChoice) => void;
  /** Increments whenever the effective palette changes, so canvases can re-read it. */
  paletteVersion: number;
};

const ThemeContext = createContext<Ctx | null>(null);

function systemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(() => {
    const saved = localStorage.getItem(KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  });
  const [systemIsDark, setSystemIsDark] = useState(() => systemDark());

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved: "light" | "dark" = choice === "system" ? (systemIsDark ? "dark" : "light") : choice;

  useEffect(() => {
    const root = document.documentElement;
    if (choice === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", choice);
  }, [choice]);

  const setChoice = useCallback((c: ThemeChoice) => {
    setChoiceState(c);
    if (c === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, c);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ choice, resolved, setChoice, paletteVersion: resolved === "dark" ? 1 : 0 }),
    [choice, resolved, setChoice],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/* ------------------------------------------------------------------ *
 * Palette bridge: the canvas reads the same custom properties as the DOM,
 * so a theme switch can never leave the plots on stale colours.
 * ------------------------------------------------------------------ */

export type Palette = {
  bg: string;
  grid: string;
  gridMajor: string;
  axis: string;
  ink: string;
  inkStrong: string;
  inkFaint: string;
  surface: string;
  line: string;
  brand: string;
  series: [string, string, string, string, string];
  ok: string;
  warn: string;
  bad: string;
  isDark: boolean;
};

const TOKENS = [
  "--scope-bg",
  "--scope-grid",
  "--scope-grid-major",
  "--scope-axis",
  "--scope-ink",
  "--ink",
  "--ink-3",
  "--surface",
  "--line",
  "--brand",
  "--s1",
  "--s2",
  "--s3",
  "--s4",
  "--s5",
  "--ok",
  "--warn",
  "--bad",
] as const;

/**
 * Resolve tokens to concrete colour strings. Values are read from the live
 * document so there is exactly one source of truth for colour.
 */
export function readPalette(isDark: boolean): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: (typeof TOKENS)[number]) => cs.getPropertyValue(name).trim();
  return {
    bg: v("--scope-bg"),
    grid: v("--scope-grid"),
    gridMajor: v("--scope-grid-major"),
    axis: v("--scope-axis"),
    ink: v("--scope-ink"),
    inkStrong: v("--ink"),
    inkFaint: v("--ink-3"),
    surface: v("--surface"),
    line: v("--line"),
    brand: v("--brand"),
    series: [v("--s1"), v("--s2"), v("--s3"), v("--s4"), v("--s5")],
    ok: v("--ok"),
    warn: v("--warn"),
    bad: v("--bad"),
    isDark,
  };
}

/** Palette that tracks the active theme. */
export function usePalette(): Palette {
  const { resolved } = useTheme();
  const [palette, setPalette] = useState<Palette>(() => readPalette(resolved === "dark"));

  useEffect(() => {
    // Wait a frame so the [data-theme] attribute has been applied to <html>.
    const id = requestAnimationFrame(() => setPalette(readPalette(resolved === "dark")));
    return () => cancelAnimationFrame(id);
  }, [resolved]);

  return palette;
}

/** Honour the OS reduced-motion setting in JS-driven animation. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}
