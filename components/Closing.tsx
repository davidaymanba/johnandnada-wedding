"use client";

import { useRef } from "react";
import { gsap, MQ, SplitText, useGSAP } from "@/lib/gsap";
import { fullNames, site, verseAt } from "@/content/site";
import { Monogram } from "./Monogram";
import { Scripture } from "./Scripture";
import { HeroPhoto } from "./HeroPhoto";

/** Bookend: the monogram draws itself again, as it did behind the door. */
export function Closing() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: q(".closing__mark")[0], start: "top 85%", once: true } });
        gsap.from(q(".closing .hero-photo"), {
          autoAlpha: 0,
          duration: 2,
          ease: "drift",
          scrollTrigger: { trigger: q(".closing__sign")[0], start: "top 85%", once: true },
        });
        gsap.from(q(".closing .hero-photo__img"), {
          scale: 1.08,
          duration: 3,
          scrollTrigger: { trigger: q(".closing__sign")[0], start: "top 85%", once: true },
        });
        tl.fromTo(
          q(".closing .monogram__line, .closing .monogram__glyph"),
          { drawSVG: "0%", fillOpacity: 0 },
          { drawSVG: "100%", duration: 2.4, stagger: 0.12, ease: "drift" },
        )
          .to(q(".closing .monogram__glyph"), { fillOpacity: 1, strokeOpacity: 0, duration: 0.9, stagger: 0.08 }, 2)
          .from(q(".closing__glow"), { autoAlpha: 0, scale: 0.6, duration: 2.4, ease: "drift" }, 0.6);
        SplitText.create(q(".closing__line")[0], {
          type: "lines,words",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => {
            const t = gsap.from(self.words, { yPercent: 110, stagger: 0.06, duration: 1.4 });
            tl.add(t, 1.6);
            return t;
          },
        });
        tl.from(q(".closing__signoff > *"), { autoAlpha: 0, y: 14, stagger: 0.18, duration: 1.4, ease: "drift" }, 2.4).from(
          q(".closing__credit"),
          { autoAlpha: 0, duration: 1.2 },
          3.2,
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <footer ref={root} id="closing" className="section closing">
      <Scripture verse={verseAt("closing")} />
      <div className="closing__sign">
        <HeroPhoto photo={site.closing.photo} side="left" />
        <div className="closing__mark">
          <span className="closing__glow" aria-hidden="true" />
          <Monogram className="closing__monogram" title={`${fullNames.groom} and ${fullNames.bride} monogram`} />
        </div>
        <p className="closing__line">{site.closing.line}</p>
        <p className="closing__signoff">
          <span className="closing__with">{site.closing.signoff}</span>
          <span className="closing__names">
            <span>{fullNames.groom}</span>
            <span className="amp">&amp;</span>
            <span>{fullNames.bride}</span>
          </span>
          <span className="closing__date">11 · 11 · 2026</span>
        </p>
      </div>
      <p className="closing__credit">
        <a href={site.closing.credit.href} target="_blank" rel="noopener noreferrer">
          {site.closing.credit.label}
        </a>
      </p>
    </footer>
  );
}
