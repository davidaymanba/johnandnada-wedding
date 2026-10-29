"use client";

import { useRef } from "react";
import { gsap, MQ, SplitText, useGSAP, scrollReveal, REVEAL_START, REVEAL_SPEED } from "@/lib/gsap";
import { fullNames, site, verseAt } from "@/content/site";
import { Scripture } from "./Scripture";
import { HeroPhoto } from "./HeroPhoto";

/** The last frame: John & Nada's photo, with the closing words resting on it. */
export function Closing() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const trigger = { trigger: q(".closing__sign")[0], start: REVEAL_START, once: true };
        gsap.from(q(".closing .hero-photo"), { autoAlpha: 0, duration: 2, ease: "drift", scrollTrigger: trigger }).timeScale(REVEAL_SPEED);
        gsap.from(q(".closing .hero-photo__img"), { scale: 1.08, duration: 3, scrollTrigger: trigger }).timeScale(REVEAL_SPEED);

        const tl = scrollReveal(q(".closing__words")[0]);
        SplitText.create(q(".closing__line")[0], {
          type: "lines,words",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => {
            const t = gsap.from(self.words, { yPercent: 110, stagger: 0.06, duration: 1.4 });
            tl.add(t, 0);
            return t;
          },
        });
        tl.from(q(".closing__signoff > *"), { autoAlpha: 0, y: 14, stagger: 0.18, duration: 1.4, ease: "drift" }, 0.7).from(
          q(".closing__credit"),
          { autoAlpha: 0, duration: 1.2 },
          1.6,
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
        <HeroPhoto photo={site.closing.photo} side="center" />
        <div className="closing__words">
          <p className="closing__line">{site.closing.line}</p>
          <p className="closing__signoff">
            <span className="closing__with">{site.closing.signoff}</span>
            <span className="closing__names">
              {fullNames.groom} <span className="amp">&amp;</span> {fullNames.bride}
            </span>
            <span className="closing__date">11 · 11 · 2026</span>
          </p>
        </div>
      </div>
      <p className="closing__credit">
        <a href={site.closing.credit.href} target="_blank" rel="noopener noreferrer">
          {site.closing.credit.label}
        </a>
      </p>
    </footer>
  );
}
