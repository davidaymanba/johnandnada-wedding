"use client";

import { useRef } from "react";
import { gsap, MQ, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro-state";
import { site, verseAt } from "@/content/site";
import { HeroPhoto } from "./HeroPhoto";
import { Ornament } from "./Ornament";

const verse = verseAt("opening")!;

/** First thing behind the door: the verse, rising out of candle-light. */
export function VerseSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MQ.motion, () => {
        const tl = gsap.timeline({ paused: true });
        tl.from(q(".hero-photo"), { autoAlpha: 0, duration: 1.8, ease: "drift" }, 0)
          .from(q(".hero-photo__img"), { scale: 1.08, duration: 3.2, ease: "reveal" }, 0)
          .from(q(".verse__rays span"), { autoAlpha: 0, xPercent: -14, duration: 3, stagger: 0.3, ease: "drift" }, 0)
          .from(q(".verse .ornament path"), { drawSVG: "50% 50%", duration: 1.8, stagger: 0.1, ease: "drift" }, 0.2)
          .from(q(".verse__ref"), { autoAlpha: 0, letterSpacing: "0.7em", duration: 1.8, ease: "drift" }, 2.3)
          .from(q(".scroll-cue"), { autoAlpha: 0, y: -10, duration: 1.2 }, 3.2);

        SplitText.create(q(".verse__text")[0], {
          type: "lines,words",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => {
            const t = gsap.from(self.words, { yPercent: 110, rotate: 2, duration: 1.5, stagger: 0.045, ease: "reveal" });
            tl.add(t, 0.55);
            return t;
          },
        });

        const off = onIntroDone(() => {
          gsap.set(q(".verse__inner"), { autoAlpha: 1 });
          tl.play();
        });

        ScrollTrigger.create({ trigger: root.current, start: "top bottom", end: "bottom top", toggleClass: "is-live" });

        // The words and the photo stay put while scrolling — nothing fades or slides away.
        gsap.to(q(".verse__rays"), {
          yPercent: 20,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        return off;
      });

      mm.add(MQ.reduce, () => gsap.set(q(".verse__inner"), { autoAlpha: 1 }));
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="verse" className="section verse" aria-label="Opening verse">
      <HeroPhoto photo={site.versePhoto} side="right" />
      <div className="verse__rays" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <figure className="verse__inner">
        <Ornament />
        <blockquote className="verse__text">“{verse.text}”</blockquote>
        <figcaption>
          <cite className="verse__ref">{verse.ref}</cite>
        </figcaption>
      </figure>
      <a className="scroll-cue" href="#invitation" aria-label="Scroll to the invitation">
        <span>Scroll</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}
