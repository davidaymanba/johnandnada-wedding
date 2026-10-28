/** Hairline ornament: two rules and a small cross-diamond. Every piece is a path for DrawSVG. */
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg className={`ornament ${className}`} viewBox="0 0 240 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path className="ornament__rule" d="M8 12H98" strokeWidth=".8" />
      <path className="ornament__rule" d="M232 12H142" strokeWidth=".8" />
      <path className="ornament__mark" d="M120 2L128 12L120 22L112 12Z" strokeWidth=".9" />
      <path className="ornament__mark" d="M120 7V17M115 12H125" strokeWidth=".8" />
      <path className="ornament__mark" d="M104 12a2 2 0 1 0 0 .01M136 12a2 2 0 1 0 0 .01" strokeWidth=".8" />
    </svg>
  );
}
