import { useEffect, useRef } from "react";
import { Plot, type Bounds, type Insets } from "./plot";
import { usePalette, useReducedMotion, type Palette } from "./theme";

export type DrawArgs = {
  plot: Plot;
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  palette: Palette;
  /** Seconds since the canvas mounted. 0 when animation is off or reduced. */
  time: number;
};

type Options = {
  bounds: Bounds;
  insets?: Partial<Insets>;
  /** Run a rAF loop. Off by default — static plots redraw only on dependency change. */
  animate?: boolean;
  /** Values that should force a redraw. */
  deps?: unknown[];
};

/**
 * Device-pixel-ratio-correct canvas with an optional animation loop.
 *
 * The canvas resizes with its container via ResizeObserver, so plots stay crisp
 * on retina displays and reflow correctly when the sidebar collapses.
 */
export function useCanvas(draw: (a: DrawArgs) => void, opts: Options) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);
  const optsRef = useRef(opts);
  const palette = usePalette();
  const reduced = useReducedMotion();

  drawRef.current = draw;
  optsRef.current = opts;

  const animate = opts.animate && !reduced;
  const depKey = JSON.stringify(opts.deps ?? []) + JSON.stringify(opts.bounds) + palette.bg + palette.series[0];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let start = 0;
    let cssW = 0;
    let cssH = 0;

    const render = (now: number) => {
      if (!start) start = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const rect = canvas.getBoundingClientRect();
      const nextW = Math.max(1, Math.round(rect.width));
      const nextH = Math.max(1, Math.round(rect.height));

      if (nextW !== cssW || nextH !== cssH) {
        cssW = nextW;
        cssH = nextH;
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const o = optsRef.current;
      const plot = new Plot(ctx, cssW, cssH, palette, o.bounds, o.insets);
      plot.clear();
      drawRef.current({
        plot,
        ctx,
        w: cssW,
        h: cssH,
        palette,
        time: animate ? (now - start) / 1000 : 0,
      });

      if (animate) raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    const ro = new ResizeObserver(() => {
      if (!animate) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(render);
      }
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey, animate, palette]);

  return ref;
}
