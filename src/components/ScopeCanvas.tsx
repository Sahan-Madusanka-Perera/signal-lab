import { useCanvas, type DrawArgs } from "../lib/canvas";
import type { Bounds, Insets } from "../lib/plot";

/**
 * A canvas sized by its parent, drawn through the Plot helper.
 * Always paired with a text alternative in the surrounding markup, so the
 * information is never carried by the picture alone.
 */
export function ScopeCanvas({
  draw,
  bounds,
  insets,
  animate,
  deps,
  label,
  className = "block h-full w-full",
}: {
  draw: (a: DrawArgs) => void;
  bounds: Bounds;
  insets?: Partial<Insets>;
  animate?: boolean;
  deps?: unknown[];
  /** Read out by screen readers in place of the drawing. Pass "" for purely
      decorative canvases, which are then hidden from assistive technology. */
  label: string;
  className?: string;
}) {
  const ref = useCanvas(draw, { bounds, insets, animate, deps });
  return label ? (
    <canvas ref={ref} className={className} role="img" aria-label={label} />
  ) : (
    <canvas ref={ref} className={className} aria-hidden="true" />
  );
}
