"use client";

import { useRef } from "react";
import { gsap, MQ, SplitText, useGSAP, scrollReveal, REVEAL_START, REVEAL_SPEED } from "@/lib/gsap";
import { site } from "@/content/site";
import { monogram } from "@/content/monogram";
import { ArchPhoto } from "./ArchPhoto";

const inv = site.invitation;

export function Invitation() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const tl = scrollReveal(q(".invite__portraits")[0]);
        tl.from(q(".invite__eyebrow"), { autoAlpha: 0, y: 10, duration: 1 })
          .from(q(".arch__outline path"), { drawSVG: "50% 50%", duration: 1.8, stagger: 0.25, ease: "drift" }, 0)
          .from(q(".arch__reveal"), { clipPath: "inset(100% 0% 0% 0%)", duration: 1.7, stagger: 0.25, ease: "door" }, 0.15)
          .from(q(".arch__img"), { scale: 1.35, duration: 2.2, stagger: 0.25, ease: "reveal" }, 0.15)
          .from(q(".invite__role"), { autoAlpha: 0, y: 8, stagger: 0.2, duration: 1 }, 1.1);

        // The two portraits float at slightly different speeds (the whole frame moves; the photo is never cropped).
        q(".invite__portrait").forEach((fig, i) => {
          gsap.fromTo(
            fig,
            { y: i ? 60 : 20 },
            { y: i ? -40 : -20, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } },
          );
        });

        const names = scrollReveal(q(".invite__names")[0]);
        SplitText.create(q(".invite__name"), {
          type: "chars",
          mask: "chars",
          charsClass: "invite__char", // masks get "invite__char-mask" (room for the J's tail, see CSS)
          onSplit: (self) => {
            const t = gsap.from(self.chars, { yPercent: 140, duration: 1.4, stagger: 0.06, ease: "reveal" });
            names.add(t, 0);
            return t;
          },
        });
        names
          .from(q(".invite__amp path"), { drawSVG: "0%", fillOpacity: 0, duration: 1.8, ease: "drift" }, 0.35)
          .to(q(".invite__amp path"), { fillOpacity: 1, strokeOpacity: 0, duration: 0.8 }, 1.6)
          .from(q(".invite__surname"), { autoAlpha: 0, letterSpacing: "0.9em", duration: 1.6, stagger: 0.15, ease: "drift" }, 0.7);

        SplitText.create(q(".invite__lines")[0], {
          type: "words",
          onSplit: (self) =>
            gsap.from(self.words, {
              autoAlpha: 0,
              y: 10,
              filter: "blur(4px)",
              duration: 1.1,
              stagger: 0.06,
              ease: "drift",
              scrollTrigger: { trigger: q(".invite__lines")[0], start: REVEAL_START, once: true },
            }).timeScale(REVEAL_SPEED),
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="invitation" className="section invite" aria-labelledby="invite-title">
      <p className="eyebrow invite__eyebrow">{inv.eyebrow}</p>
      <div className="invite__portraits">
        {/* Groom on the guest's left, bride on the right. */}
        <figure className="invite__portrait invite__portrait--left">
          <ArchPhoto photo={inv.groom} sizes="(min-width: 900px) 26vw, 44vw" />
          <figcaption className="invite__role">The groom</figcaption>
        </figure>
        <figure className="invite__portrait invite__portrait--right">
          <ArchPhoto photo={inv.bride} sizes="(min-width: 900px) 26vw, 44vw" />
          <figcaption className="invite__role">The bride</figcaption>
        </figure>
      </div>
      <h2 id="invite-title" className="invite__names">
        <span className="invite__person">
          <span className="invite__name">{site.names.groom}</span>
          <span className="invite__surname">{site.names.groomSurname}</span>
        </span>
        <svg className="invite__amp" viewBox={monogram.ampSolo.viewBox} role="img" aria-label="and">
          <path d={monogram.ampSolo.d} />
        </svg>
        <span className="invite__person">
          <span className="invite__name">{site.names.bride}</span>
          <span className="invite__surname">{site.names.brideSurname}</span>
        </span>
      </h2>
      <p className="invite__lines">
        {inv.lines[0]}
        <br />
        {inv.lines[1]}
      </p>
    </section>
  );
}
