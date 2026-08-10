import type { Palette } from "./theme";
import type { Segment } from "./signal";

/**
 * A thin drawing layer over Canvas2D that speaks in data coordinates.
 *
 * Everything is stroked at hairline weights on a recessive grid: the trace is
 * the only loud thing on the surface. Colours always arrive from the token
 * palette, never as literals.
 */

export type Bounds = { x0: number; x1: number; y0: number; y1: number };
export type Insets = { top: number; right: number; bottom: number; left: number };

const DEFAULT_INSETS: Insets = { top: 14, right: 16, bottom: 24, left: 40 };

export class Plot {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  p: Palette;
  bounds: Bounds;
  insets: Insets;

  constructor(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    palette: Palette,
    bounds: Bounds,
    insets: Partial<Insets> = {},
  ) {
    this.ctx = ctx;
    this.w = w;
    this.h = h;
    this.p = palette;
    this.bounds = bounds;
    this.insets = { ...DEFAULT_INSETS, ...insets };
  }

  get left() { return this.insets.left; }
  get right() { return this.w - this.insets.right; }
  get top() { return this.insets.top; }
  get bottom() { return this.h - this.insets.bottom; }
  get plotW() { return Math.max(1, this.right - this.left); }
  get plotH() { return Math.max(1, this.bottom - this.top); }

  /** Data x → device x. */
  sx(x: number): number {
    const { x0, x1 } = this.bounds;
    return this.left + ((x - x0) / (x1 - x0)) * this.plotW;
  }

  /** Data y → device y (y grows upward in data space). */
  sy(y: number): number {
    const { y0, y1 } = this.bounds;
    return this.bottom - ((y - y0) / (y1 - y0)) * this.plotH;
  }

  /** Device x → data x, for pointer interaction. */
  ix(px: number): number {
    const { x0, x1 } = this.bounds;
    return x0 + ((px - this.left) / this.plotW) * (x1 - x0);
  }

  clear() {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.fillStyle = this.p.bg;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  /** Vertical + horizontal rules. `xEvery`/`yEvery` are in data units. */
  grid(opts: { xEvery?: number; yEvery?: number; xMajorEvery?: number } = {}) {
    const { ctx } = this;
    const { xEvery, yEvery, xMajorEvery } = opts;
    ctx.save();
    ctx.lineWidth = 1;

    if (yEvery) {
      ctx.strokeStyle = this.p.grid;
      ctx.beginPath();
      const start = Math.ceil(this.bounds.y0 / yEvery) * yEvery;
      for (let y = start; y <= this.bounds.y1 + 1e-9; y += yEvery) {
        const py = Math.round(this.sy(y)) + 0.5;
        ctx.moveTo(this.left, py);
        ctx.lineTo(this.right, py);
      }
      ctx.stroke();
    }

    if (xEvery) {
      ctx.strokeStyle = this.p.grid;
      ctx.beginPath();
      const start = Math.ceil(this.bounds.x0 / xEvery) * xEvery;
      for (let x = start; x <= this.bounds.x1 + 1e-9; x += xEvery) {
        if (xMajorEvery && Math.abs(x / xMajorEvery - Math.round(x / xMajorEvery)) < 1e-6) continue;
        const px = Math.round(this.sx(x)) + 0.5;
        ctx.moveTo(px, this.top);
        ctx.lineTo(px, this.bottom);
      }
      ctx.stroke();
    }

    if (xMajorEvery) {
      ctx.strokeStyle = this.p.gridMajor;
      ctx.beginPath();
      const start = Math.ceil(this.bounds.x0 / xMajorEvery) * xMajorEvery;
      for (let x = start; x <= this.bounds.x1 + 1e-9; x += xMajorEvery) {
        const px = Math.round(this.sx(x)) + 0.5;
        ctx.moveTo(px, this.top);
        ctx.lineTo(px, this.bottom);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  /** The y = 0 line, drawn slightly stronger than the grid. */
  zeroLine(y = 0) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = this.p.axis;
    ctx.lineWidth = 1;
    const py = Math.round(this.sy(y)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(this.left, py);
    ctx.lineTo(this.right, py);
    ctx.stroke();
    ctx.restore();
  }

  axisFrame() {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = this.p.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(this.left) + 0.5, this.top);
    ctx.lineTo(Math.round(this.left) + 0.5, Math.round(this.bottom) + 0.5);
    ctx.lineTo(this.right, Math.round(this.bottom) + 0.5);
    ctx.stroke();
    ctx.restore();
  }

  font(size = 10, weight = 500) {
    this.ctx.font = `${weight} ${size}px "JetBrains Mono Variable", ui-monospace, monospace`;
  }

  /** Tick labels along the x axis. */
  xTicks(every: number, format: (v: number) => string, opts: { size?: number } = {}) {
    const { ctx } = this;
    ctx.save();
    this.font(opts.size ?? 10);
    ctx.fillStyle = this.p.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const start = Math.ceil(this.bounds.x0 / every) * every;
    for (let x = start; x <= this.bounds.x1 + 1e-9; x += every) {
      const label = format(x);
      if (!label) continue;
      ctx.fillText(label, this.sx(x), this.bottom + 6);
    }
    ctx.restore();
  }

  /** Tick labels along the y axis. */
  yTicks(values: number[], format: (v: number) => string) {
    const { ctx } = this;
    ctx.save();
    this.font(10);
    ctx.fillStyle = this.p.ink;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const y of values) ctx.fillText(format(y), this.left - 8, this.sy(y));
    ctx.restore();
  }

  /**
   * A continuous trace from a sampled array spanning the full x range.
   * `glow` adds a soft halo — the one place a shadow earns its keep, because it
   * is what makes a phosphor trace read as luminous rather than as a hairline.
   */
  trace(
    data: ArrayLike<number>,
    color: string,
    opts: { width?: number; glow?: number; dash?: number[]; alpha?: number; x0?: number; x1?: number } = {},
  ) {
    const { ctx } = this;
    const n = data.length;
    if (n < 2) return;
    const x0 = opts.x0 ?? this.bounds.x0;
    const x1 = opts.x1 ?? this.bounds.x1;

    ctx.save();
    ctx.beginPath();
    ctx.rect(this.left - 1, this.top - 1, this.plotW + 2, this.plotH + 2);
    ctx.clip();

    ctx.lineWidth = opts.width ?? 2;
    ctx.strokeStyle = color;
    ctx.globalAlpha = opts.alpha ?? 1;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (opts.dash) ctx.setLineDash(opts.dash);

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = x0 + (i / (n - 1)) * (x1 - x0);
      const px = this.sx(x);
      const py = this.sy(data[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    if (opts.glow && this.p.isDark) {
      ctx.shadowColor = color;
      ctx.shadowBlur = opts.glow;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.stroke();
    ctx.restore();
  }

  /** Filled area between a trace and a baseline — used sparingly, for envelopes. */
  area(data: ArrayLike<number>, color: string, baseline: number, alpha = 0.12) {
    const { ctx } = this;
    const n = data.length;
    if (n < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(this.sx(this.bounds.x0), this.sy(baseline));
    for (let i = 0; i < n; i++) {
      const x = this.bounds.x0 + (i / (n - 1)) * (this.bounds.x1 - this.bounds.x0);
      ctx.lineTo(this.sx(x), this.sy(data[i]));
    }
    ctx.lineTo(this.sx(this.bounds.x1), this.sy(baseline));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /** Square-wave path from level segments (line coding, clocks). */
  steps(
    segs: Segment[],
    color: string,
    opts: { width?: number; glow?: number; high?: number; low?: number; alpha?: number; dash?: number[] } = {},
  ) {
    const { ctx } = this;
    if (!segs.length) return;
    const high = opts.high ?? 1;
    const low = opts.low ?? -1;
    const yOf = (lvl: number) => this.sy(lvl > 0 ? high : low);

    ctx.save();
    ctx.beginPath();
    ctx.rect(this.left - 1, this.top - 1, this.plotW + 2, this.plotH + 2);
    ctx.clip();
    ctx.lineWidth = opts.width ?? 2;
    ctx.strokeStyle = color;
    ctx.globalAlpha = opts.alpha ?? 1;
    ctx.lineJoin = "miter";
    ctx.lineCap = "butt";
    if (opts.dash) ctx.setLineDash(opts.dash);

    ctx.beginPath();
    ctx.moveTo(this.sx(segs[0].from), yOf(segs[0].level));
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      ctx.lineTo(this.sx(s.from), yOf(s.level));
      ctx.lineTo(this.sx(s.to), yOf(s.level));
    }

    if (opts.glow && this.p.isDark) {
      ctx.shadowColor = color;
      ctx.shadowBlur = opts.glow;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.stroke();
    ctx.restore();
  }

  /** Vertical rule, e.g. a bit boundary or a sampling instant. */
  vLine(x: number, color: string, opts: { dash?: number[]; width?: number; alpha?: number } = {}) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = opts.width ?? 1;
    ctx.globalAlpha = opts.alpha ?? 1;
    if (opts.dash) ctx.setLineDash(opts.dash);
    const px = Math.round(this.sx(x)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(px, this.top);
    ctx.lineTo(px, this.bottom);
    ctx.stroke();
    ctx.restore();
  }

  hLine(y: number, color: string, opts: { dash?: number[]; width?: number; alpha?: number } = {}) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = opts.width ?? 1;
    ctx.globalAlpha = opts.alpha ?? 1;
    if (opts.dash) ctx.setLineDash(opts.dash);
    const py = Math.round(this.sy(y)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(this.left, py);
    ctx.lineTo(this.right, py);
    ctx.stroke();
    ctx.restore();
  }

  /** Shade a band of the x axis — one bit cell, one symbol period. */
  band(xa: number, xb: number, color: string, alpha = 0.09) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(this.sx(xa), this.top, this.sx(xb) - this.sx(xa), this.plotH);
    ctx.restore();
  }

  /** Data marker. Minimum 8px per the mark spec, with a surface ring so
      overlapping markers stay countable. */
  dot(x: number, y: number, color: string, r = 4.5, ring = true) {
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.sx(x), this.sy(y), r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (ring) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.p.bg;
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Stem from the baseline to a sample — the PCM picture. */
  stem(x: number, y: number, color: string, baseline = 0, width = 1.5) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(this.sx(x), this.sy(baseline));
    ctx.lineTo(this.sx(x), this.sy(y));
    ctx.stroke();
    ctx.restore();
  }

  /** Arrow annotation used for wavelength / amplitude / period callouts. */
  measure(
    xa: number,
    xb: number,
    y: number,
    color: string,
    label: string,
    opts: { vertical?: boolean; above?: boolean } = {},
  ) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;

    if (opts.vertical) {
      const px = this.sx(xa);
      const ya = this.sy(y);
      const yb = this.sy(xb);
      ctx.beginPath();
      ctx.moveTo(px, ya);
      ctx.lineTo(px, yb);
      ctx.stroke();
      arrowHead(ctx, px, ya, 0, ya < yb ? -1 : 1);
      arrowHead(ctx, px, yb, 0, ya < yb ? 1 : -1);
      this.font(10, 600);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      labelChip(ctx, label, px + 8, (ya + yb) / 2, color, this.p.bg);
    } else {
      const pa = this.sx(xa);
      const pb = this.sx(xb);
      const py = this.sy(y);
      ctx.beginPath();
      ctx.moveTo(pa, py);
      ctx.lineTo(pb, py);
      ctx.stroke();
      arrowHead(ctx, pa, py, -1, 0);
      arrowHead(ctx, pb, py, 1, 0);
      this.font(10, 600);
      ctx.textAlign = "center";
      ctx.textBaseline = opts.above ? "bottom" : "top";
      labelChip(ctx, label, (pa + pb) / 2, py + (opts.above ? -8 : 8), color, this.p.bg);
    }
    ctx.restore();
  }

  /** Direct label pinned inside the plot, so identity is never colour-alone. */
  tag(x: number, y: number, text: string, color: string, align: CanvasTextAlign = "left") {
    const { ctx } = this;
    ctx.save();
    this.font(10, 600);
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    labelChip(ctx, text, this.sx(x), this.sy(y), color, this.p.bg, align);
    ctx.restore();
  }

  /**
   * Name a lane. Sits in the left gutter when there is room; on a narrow canvas
   * it moves inside the plot instead of being clipped at the edge.
   */
  gutterLabel(y: number, text: string, color: string, size = 10) {
    const { ctx } = this;
    ctx.save();
    this.font(size, 700);
    const fits = this.left - 8 - ctx.measureText(text).width >= 2;
    if (fits) {
      ctx.fillStyle = color;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(text, this.left - 8, this.sy(y));
    } else {
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      labelChip(ctx, text, this.left + 6, this.sy(y), color, this.p.bg, "left");
    }
    ctx.restore();
  }

  /** Free-floating text in device coordinates. */
  text(
    px: number,
    py: number,
    text: string,
    color: string,
    opts: { size?: number; weight?: number; align?: CanvasTextAlign; baseline?: CanvasTextBaseline } = {},
  ) {
    const { ctx } = this;
    ctx.save();
    this.font(opts.size ?? 10, opts.weight ?? 500);
    ctx.fillStyle = color;
    ctx.textAlign = opts.align ?? "left";
    ctx.textBaseline = opts.baseline ?? "top";
    ctx.fillText(text, px, py);
    ctx.restore();
  }
}

function arrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number) {
  const s = 4.5;
  ctx.save();
  ctx.beginPath();
  if (dx !== 0) {
    ctx.moveTo(x, y);
    ctx.lineTo(x - dx * s, y - s * 0.75);
    ctx.lineTo(x - dx * s, y + s * 0.75);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x - s * 0.75, y - dy * s);
    ctx.lineTo(x + s * 0.75, y - dy * s);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Text with a knocked-out background so labels stay legible over a trace. */
function labelChip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  bg: string,
  align: CanvasTextAlign = "center",
) {
  const m = ctx.measureText(text);
  const padX = 4;
  const h = 14;
  let left = x - m.width / 2 - padX;
  if (align === "left") left = x - padX;
  if (align === "right") left = x - m.width - padX;

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = bg;
  roundRect(ctx, left, y - h / 2, m.width + padX * 2, h, 3);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
