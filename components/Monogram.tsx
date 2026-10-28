import { monogram as m } from "@/content/monogram";

type Props = { className?: string; title?: string };

/** The J & N monogram (groom first) under a gothic arch. Every stroke is a real path, so DrawSVG can trace it. */
export function Monogram({ className, title }: Props) {
  return (
    <svg
      className={`monogram ${className ?? ""}`}
      viewBox={m.viewBox}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g className="monogram__frame" fill="none" stroke="currentColor" strokeLinecap="round">
        <path className="monogram__line" d={m.outer} strokeWidth="1.1" />
        <path className="monogram__line" d={m.inner} strokeWidth=".6" />
        <path className="monogram__line" d={m.base} strokeWidth=".6" />
        <path className="monogram__line" d={m.cross} strokeWidth="1.1" />
      </g>
      <g className="monogram__letters">
        <path className="monogram__glyph" d={m.J} />
        <path className="monogram__glyph" d={m.N} />
        <path className="monogram__glyph monogram__amp" d={m.amp} />
      </g>
    </svg>
  );
}
