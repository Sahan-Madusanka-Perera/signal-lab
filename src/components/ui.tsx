import {
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import clsx from "clsx";

/* ------------------------------------------------------------------ *
 * Button — one shape, one vocabulary, every state defined.
 * ------------------------------------------------------------------ */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap",
        "transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-[var(--ease-out-quart)]",
        "active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45",
        size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
        variant === "primary" &&
          "bg-brand text-brand-ink shadow-sm hover:bg-brand-strong",
        variant === "secondary" &&
          "border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2",
        variant === "ghost" && "text-ink-2 hover:bg-surface-2 hover:text-ink",
        variant === "danger" && "border border-transparent bg-bad-wash text-bad hover:brightness-[1.06]",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * Series colours are tuned for 2px strokes on the plot surface, which is not
 * the same job as small UI text. Anything that paints a hue onto *text* routes
 * through here and gets the matching text-safe step instead.
 */
export function textInk(color?: string): string | undefined {
  if (!color) return undefined;
  const m = color.match(/^var\(--(s[1-5])\)$/);
  return m ? `var(--${m[1]}-ink)` : color;
}

/* ------------------------------------------------------------------ *
 * Slider — the primary control of this app, so it carries its readout.
 * ------------------------------------------------------------------ */

type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> & {
  label: ReactNode;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Formatted value shown at the right of the label row. */
  readout?: ReactNode;
  /** Tints the track and thumb — use to bind a control to its trace colour. */
  accent?: string;
  hint?: string;
};

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  readout,
  accent,
  hint,
  className,
  disabled,
  ...rest
}: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  const fill = accent ?? "var(--brand)";

  return (
    <div className={clsx("select-none", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-xs font-medium text-ink-2">
          {label}
        </label>
        {readout != null && (
          <span className="tnum font-mono text-xs font-medium text-ink" style={{ color: textInk(accent) }}>
            {readout}
          </span>
        )}
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5"
        style={
          {
            "--track": `linear-gradient(to right, ${fill} ${pct}%, var(--surface-3) ${pct}%)`,
            "--thumb": fill,
          } as React.CSSProperties
        }
        {...rest}
      />
      {hint && <p className="mt-1 text-2xs text-ink-3">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Segmented control — used everywhere a lesson switches mode.
 * ------------------------------------------------------------------ */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className,
}: {
  options: { value: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={clsx(
        // Wraps rather than overflowing when a control has many or long options.
        "inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={clsx(
              "rounded-[6px] font-medium transition-colors duration-150",
              size === "sm" ? "h-6 px-2 text-2xs" : "h-7 px-2.5 text-xs",
              active
                ? "bg-bg text-ink shadow-sm"
                : "text-ink-3 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Toggle
 * ------------------------------------------------------------------ */

export function Toggle({
  checked,
  onChange,
  label,
  accent,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  accent?: string;
  hint?: string;
}) {
  // A <label> cannot name a <button>, so the switch points at its own text.
  const labelId = useId();
  return (
    <span className="flex items-start gap-2.5 py-0.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative mt-0.5 h-[18px] w-8 shrink-0 cursor-pointer rounded-full border transition-colors duration-150",
          checked ? "border-transparent" : "border-line bg-surface-3",
        )}
        style={checked ? { background: accent ?? "var(--brand)" } : undefined}
      >
        <span
          className="absolute top-[2px] h-[12px] w-[12px] rounded-full bg-bg shadow-sm transition-[left] duration-150 ease-[var(--ease-out-quart)]"
          style={{ left: checked ? 16 : 2 }}
        />
      </button>
      <span className="min-w-0">
        <button
          type="button"
          id={labelId}
          onClick={() => onChange(!checked)}
          className="block cursor-pointer text-left text-xs font-medium text-ink-2 hover:text-ink"
        >
          {label}
        </button>
        {hint && <span className="block text-2xs text-ink-3">{hint}</span>}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Panel — the one container. Never nested inside another panel.
 * ------------------------------------------------------------------ */

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={clsx("rounded-xl border border-line bg-surface", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="mt-0.5 max-w-[62ch] text-xs text-ink-2">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={clsx("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Legend — identity is never colour alone.
 * ------------------------------------------------------------------ */

export function Legend({
  items,
  className,
}: {
  items: { color: string; label: string; dash?: boolean; muted?: boolean }[];
  className?: string;
}) {
  return (
    <ul className={clsx("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {items.map((it) => (
        <li key={it.label} className={clsx("flex items-center gap-1.5", it.muted && "opacity-60")}>
          <span
            aria-hidden
            className="h-[3px] w-4 shrink-0 rounded-full"
            style={
              it.dash
                ? { backgroundImage: `repeating-linear-gradient(90deg, ${it.color} 0 4px, transparent 4px 7px)` }
                : { background: it.color }
            }
          />
          <span className="text-2xs font-medium text-ink-2">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ *
 * Readout — a labelled measurement. Deliberately not a "stat hero".
 * ------------------------------------------------------------------ */

export function Readout({
  label,
  value,
  sub,
  tone = "neutral",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "bad" | "brand";
  className?: string;
}) {
  const toneColor = {
    neutral: "text-ink",
    ok: "text-ok",
    warn: "text-warn",
    bad: "text-bad",
    brand: "text-brand",
  }[tone];

  return (
    <div className={clsx("min-w-0", className)}>
      <div className="text-2xs font-medium tracking-wide text-ink-3">{label}</div>
      <div className={clsx("tnum mt-0.5 font-mono text-lg leading-tight font-semibold", toneColor)}>{value}</div>
      {sub && <div className="mt-0.5 text-2xs text-ink-3">{sub}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Badge
 * ------------------------------------------------------------------ */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "bad" | "brand";
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-semibold",
        tone === "neutral" && "bg-surface-2 text-ink-2",
        tone === "ok" && "bg-ok-wash text-ok",
        tone === "warn" && "bg-warn-wash text-warn",
        tone === "bad" && "bg-bad-wash text-bad",
        tone === "brand" && "bg-brand-wash text-brand",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Callout — the "remember this for the exam" device.
 * ------------------------------------------------------------------ */

export function Callout({
  kind = "note",
  title,
  children,
}: {
  kind?: "note" | "exam" | "warn";
  title?: ReactNode;
  children: ReactNode;
}) {
  const mark = { note: "Note", exam: "For the paper", warn: "Watch out" }[kind];
  return (
    <aside
      className={clsx(
        "rounded-lg border px-3.5 py-3 text-sm",
        kind === "exam" && "border-brand-edge bg-brand-wash",
        kind === "warn" && "border-transparent bg-warn-wash",
        kind === "note" && "border-line bg-surface-2",
      )}
    >
      <p
        className={clsx(
          "text-2xs font-semibold tracking-wide",
          kind === "exam" ? "text-brand" : kind === "warn" ? "text-warn" : "text-ink-3",
        )}
      >
        {title ?? mark}
      </p>
      <div className="mt-1 max-w-[68ch] text-ink-2 [&_strong]:font-semibold [&_strong]:text-ink">{children}</div>
    </aside>
  );
}

/* ------------------------------------------------------------------ *
 * Formula — a maths line that stays readable at small sizes.
 * ------------------------------------------------------------------ */

export function Formula({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3.5 py-2.5">
      <p className="tnum font-mono text-sm font-medium text-ink">{children}</p>
      {note && <p className="mt-1 text-2xs text-ink-3">{note}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Bit editor — clickable bit train, used by three separate lessons.
 * ------------------------------------------------------------------ */

export function BitTrain({
  bits,
  onToggle,
  highlight,
  flagged,
  label,
  colors,
  size = "md",
}: {
  bits: number[];
  onToggle?: (index: number) => void;
  /** index of a bit to emphasise */
  highlight?: number | null;
  /** indices rendered as errors */
  flagged?: number[];
  label?: string;
  /** per-index colour override, e.g. to mark the parity bit */
  colors?: (i: number) => string | undefined;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {label && <span className="mr-1 text-2xs font-medium text-ink-3">{label}</span>}
      {bits.map((b, i) => {
        const isFlagged = flagged?.includes(i);
        const custom = colors?.(i);
        const interactive = Boolean(onToggle);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onToggle?.(i)}
            aria-label={`Bit ${i + 1}, currently ${b}${interactive ? ". Activate to flip." : ""}`}
            className={clsx(
              "tnum grid place-items-center rounded-md border font-mono font-semibold transition-all duration-150 ease-[var(--ease-out-quart)]",
              size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm",
              interactive && "cursor-pointer hover:-translate-y-px hover:shadow-sm active:translate-y-0",
              !interactive && "cursor-default",
              isFlagged
                ? "border-bad bg-bad-wash text-bad"
                : highlight === i
                  ? "border-brand bg-brand-wash text-brand"
                  : b
                    ? "border-line-strong bg-surface-3 text-ink"
                    : "border-line bg-surface text-ink-3",
            )}
            style={custom ? { borderColor: custom, color: textInk(custom) } : undefined}
          >
            {b}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Reveal — progressive disclosure instead of dumping the answer.
 * ------------------------------------------------------------------ */

export function Reveal({ label = "Show working", children }: { label?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Chevron open={open} />
        {open ? "Hide working" : label}
      </Button>
      {open && (
        <div
          className="mt-2 rounded-lg border border-line bg-surface-2 px-3.5 py-3 text-sm text-ink-2"
          style={{ animation: "rise var(--dur) var(--ease-out-quart)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className="transition-transform duration-150 ease-[var(--ease-out-quart)]"
      style={{ transform: open ? "rotate(90deg)" : "none" }}
    >
      <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Scope frame — the standard instrument surround for a canvas.
 * ------------------------------------------------------------------ */

export function Scope({
  children,
  height = 200,
  className,
  caption,
}: {
  children: ReactNode;
  height?: number | string;
  className?: string;
  caption?: ReactNode;
}) {
  return (
    <figure className={clsx("min-w-0", className)}>
      <div
        className="relative overflow-hidden rounded-lg border border-line"
        style={{ background: "var(--scope-bg)", height }}
      >
        {children}
      </div>
      {caption && <figcaption className="mt-1.5 text-2xs text-ink-3">{caption}</figcaption>}
    </figure>
  );
}
