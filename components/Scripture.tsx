"use client";

import { useRef } from "react";
import { gsap, MQ, SplitText, useGSAP } from "@/lib/gsap";
import type { Verse } from "@/content/site";
import { Ornament } from "./Ornament";

type Props = { verse: Verse | undefined; className?: string };

/** A quiet scripture "breath" between chapters: ornament draws, lines rise slowly, Arabic follows. */
export function Scripture({ verse, className = "" }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root);
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 78%", once: true } });
        tl.from(q(".ornament path"), { drawSVG: "50% 50%", duration: 1.6, stagger: 0.08, ease: "drift" });
        SplitText.create(q(".interlude__en")[0], {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => {
            const t = gsap.from(self.lines, { yPercent: 105, duration: 1.6, stagger: 0.14, ease: "reveal" });
            tl.add(t, 0.3);
            return t;
          },
        });
        tl.from(q(".interlude__ref, .interlude__ar"), { autoAlpha: 0, y: 12, duration: 1.4, stagger: 0.2, ease: "drift" }, 1.1);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  if (!verse) return null;
  return (
    <figure ref={root} className={`interlude ${className}`}>
      <Ornament />
      <blockquote className="interlude__en">“{verse.en}”</blockquote>
      <figcaption>
        <cite className="interlude__ref">{verse.refEn}</cite>
        <p className="interlude__ar" lang="ar" dir="rtl">
          «{verse.ar}» — {verse.refAr}
        </p>
      </figcaption>
    </figure>
  );
}
