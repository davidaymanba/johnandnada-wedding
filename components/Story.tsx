"use client";

import { Frame } from "./Frame";
import { useRef } from "react";
import { gsap, MQ, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { site, verseAt, type Photo } from "@/content/site";
import { ArchPhoto } from "./ArchPhoto";
import { Scripture } from "./Scripture";

const steps = site.story.steps;
const step = (id: string) => steps.find((s) => s.id === id)!;

type StepT = (typeof steps)[number];

function Milestone({ s, index, side }: { s: StepT; index: number; side: "left" | "right" }) {
  const photo = "photo" in s ? (s.photo as Photo) : null;
  return (
    <article className={`milestone milestone--${side} ${photo ? "has-photo" : ""}`} data-node>
      <div className="milestone__text">
        <p className="milestone__num" aria-hidden="true">
          {String(index).padStart(2, "0")}
        </p>
        {s.date && <p className="milestone__date">{s.date}</p>}
        <h3 className="milestone__title">{s.title}</h3>
        {s.text && <p className="milestone__body">{s.text}</p>}
      </div>
      {photo && (
        <div className="milestone__media">
          <Frame photo={photo} sizes="(min-width: 900px) 440px, 100vw" />
        </div>
      )}
    </article>
  );
}

/** Desktop: smooth, gently waving path through each milestone node. Mobile: a straight rail at the left. */
function buildPath(track: HTMLElement, svg: SVGSVGElement, path: SVGPathElement, desktop: boolean) {
  const w = track.offsetWidth;
  const h = track.offsetHeight;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const cx = desktop ? w / 2 : 14;
  const amp = desktop ? Math.min(46, w * 0.03) : 0;
  const ys = gsap.utils.toArray<HTMLElement>("[data-node]", track).map((n) => n.offsetTop + (desktop ? n.offsetHeight / 2 : 18));
  const pts = [0, ...ys, h].map((y, i) => ({ x: cx + (i % 2 ? amp : -amp) * (i && i < ys.length + 1 ? 1 : 0), y }));
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const my = (a.y + b.y) / 2;
    d += `C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`;
  }
  path.setAttribute("d", d);
  svg.querySelector(".story__line-ghost")?.setAttribute("d", d);
  // Place the node markers on the line.
  gsap.utils.toArray<HTMLElement>(".story__node", track).forEach((dot, i) => {
    const p = pts[i + 1];
    if (p) gsap.set(dot, { x: p.x, y: p.y });
  });
}

export function Story() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const track = q(".story__track")[0] as HTMLElement;
      const svg = q(".story__line")[0] as unknown as SVGSVGElement;
      const path = q(".story__line-path")[0] as unknown as SVGPathElement;
      const mm = gsap.matchMedia();

      mm.add({ motion: MQ.motion, reduce: MQ.reduce, desktop: MQ.desktop }, (ctx) => {
        const { motion, desktop } = ctx.conditions as { motion: boolean; desktop: boolean };
        buildPath(track, svg, path, desktop);
        const onRefresh = () => buildPath(track, svg, path, desktop);
        ScrollTrigger.addEventListener("refreshInit", onRefresh);

        if (!motion) return () => ScrollTrigger.removeEventListener("refreshInit", onRefresh);

        // Header
        SplitText.create(q(".story__title")[0], {
          type: "lines,words",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.words, {
              yPercent: 110,
              stagger: 0.06,
              duration: 1.4,
              scrollTrigger: { trigger: q(".story__head")[0], start: "top 80%", once: true },
            }),
        });

        // The path draws itself with the scroll; its tip rides ~60% down the screen.
        gsap.fromTo(
          path,
          { drawSVG: "0%" },
          { drawSVG: "100%", ease: "none", scrollTrigger: { trigger: track, start: "top 60%", end: "bottom 60%", scrub: 0.6 } },
        );

        q(".story__node").forEach((dot, i) => {
          const node = q("[data-node]")[i];
          ScrollTrigger.create({
            trigger: node,
            start: desktop ? "center 60%" : "top 60%",
            onEnter: () => dot.classList.add("is-lit"),
            onLeaveBack: () => dot.classList.remove("is-lit"),
          });
        });

        q(".milestone").forEach((m) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: m, start: "top 74%", once: true } });
          tl.from(m.querySelector(".milestone__num"), { autoAlpha: 0, x: -12, duration: 1 });
          const date = m.querySelector(".milestone__date");
          if (date) {
            SplitText.create(date, {
              type: "chars",
              onSplit: (self) => {
                const t = gsap.from(self.chars, { autoAlpha: 0, duration: 0.05, stagger: 0.045, ease: "none" });
                tl.add(t, 0.15);
                return t;
              },
            });
          }
          SplitText.create(m.querySelector(".milestone__title"), {
            type: "lines,words",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) => {
              const t = gsap.from(self.words, { yPercent: 110, stagger: 0.05, duration: 1.3 });
              tl.add(t, 0.35);
              return t;
            },
          });
          const body = m.querySelector(".milestone__body");
          if (body) tl.from(body, { autoAlpha: 0, y: 16, duration: 1.3, ease: "drift" }, 0.7);

          const reveal = m.querySelector(".frame__reveal");
          if (reveal) {
            const sideX = m.classList.contains("milestone--right") ? "0% 0% 0% 100%" : "0% 100% 0% 0%";
            tl.from(reveal, { clipPath: `inset(${sideX})`, duration: 1.6, ease: "door" }, 0.1).from(
              reveal.querySelector("img"),
              { scale: 1.3, duration: 2.2 },
              0.1,
            );
            gsap.fromTo(
              reveal,
              { yPercent: -5 },
              { yPercent: 5, ease: "none", scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: true } },
            );
          }
        });

        // Chapter: "every day" + "preparations". Pinned horizontal travel on desktop; on phones the photos
        // simply continue down the page, each one opening as it arrives.
        const chapter = q(".chapter")[0] as HTMLElement;
        const rail = q(".chapter__rail")[0] as HTMLElement;
        if (desktop) {
          const distance = () => rail.scrollWidth - window.innerWidth;
          const travel = gsap.to(rail, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: chapter,
              start: "top top",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          });
          q(".chapter__item").forEach((item, i) => {
            gsap.fromTo(
              item.querySelector(".frame__reveal"),
              { xPercent: -6 },
              {
                xPercent: 6,
                ease: "none",
                scrollTrigger: { trigger: item, containerAnimation: travel, start: "left right", end: "right left", scrub: true },
              },
            );
            gsap.from(item.querySelector(".frame"), {
              clipPath: "inset(0% 0% 0% 100%)",
              duration: 1.4,
              ease: "door",
              delay: (i % 2) * 0.1,
              scrollTrigger: { trigger: item, containerAnimation: travel, start: "left 92%", once: true },
            });
          });
          gsap.fromTo(
            q(".chapter__progress i"),
            { scaleX: 0 },
            { scaleX: 1, ease: "none", scrollTrigger: { trigger: chapter, start: "top top", end: () => `+=${distance()}`, scrub: true } },
          );
        } else {
          q(".chapter__item").forEach((item) => {
            const reveal = item.querySelector(".frame__reveal");
            const tl = gsap.timeline({ scrollTrigger: { trigger: item, start: "top 86%", once: true } });
            tl.from(reveal, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.5, ease: "door" }).from(item.querySelector(".frame__reveal img"), { scale: 1.25, duration: 2 }, 0);
            gsap.fromTo(reveal, { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: true } });
          });
        }
        if (!desktop) {
          q(".chapter__panel").forEach((panel) =>
            gsap.from(panel.children, { autoAlpha: 0, y: 18, stagger: 0.1, duration: 1.2, scrollTrigger: { trigger: panel, start: "top 80%", once: true } }),
          );
        }

        // Finale: the wedding-day photo opens like the door did.
        const fin = gsap.timeline({ scrollTrigger: { trigger: q(".finale")[0], start: "top 65%", once: true } });
        fin
          .from(q(".finale .arch__outline path"), { drawSVG: "50% 50%", duration: 2, ease: "drift" })
          .from(q(".finale .arch__reveal"), { clipPath: "inset(0% 50% 0% 50%)", duration: 1.8, ease: "door" }, 0.2)
          .from(q(".finale .arch__img"), { scale: 1.3, duration: 2.4 }, 0.2)
          .from(q(".finale__date .mask > span"), { yPercent: 105, stagger: 0.08, duration: 1.4 }, 0.6)
          .from(q(".finale__text > *"), { autoAlpha: 0, y: 16, stagger: 0.14, duration: 1.3, ease: "drift" }, 0.9);

        return () => ScrollTrigger.removeEventListener("refreshInit", onRefresh);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const everyday = step("everyday");
  const prep = step("preparations");
  const theDay = step("the-day");
  const theDayPhoto = (theDay as { photo: Photo }).photo;

  return (
    <section ref={root} id="story" className="section story" aria-labelledby="story-title">
      <div className="story__paper">
        <header className="story__head">
          <p className="eyebrow">{site.story.eyebrow}</p>
          <h2 id="story-title" className="story__title">
            {site.story.title}
          </h2>
        </header>

        <div className="story__track">
          <svg className="story__line" aria-hidden="true" preserveAspectRatio="none">
            <path className="story__line-ghost" />
            <path className="story__line-path" />
          </svg>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="story__node" aria-hidden="true" />
          ))}

          <Milestone s={step("beginning")} index={1} side="left" />
          <Scripture verse={verseAt("after-beginning")} />
          <Milestone s={step("walking")} index={2} side="right" />
          <Scripture verse={verseAt("after-walking")} />
          <Milestone s={step("proposal")} index={3} side="left" />
          <Milestone s={step("engagement")} index={4} side="right" />
        </div>
        <Scripture verse={verseAt("after-engagement")} className="interlude--wide" />
      </div>

      <div className="chapter">
        <div className="chapter__rail">
          <div className="chapter__panel">
            <p className="milestone__num">05</p>
            <h3 className="milestone__title">{everyday.title}</h3>
            <p className="milestone__body">{everyday.text}</p>
          </div>
          {(everyday as { photos: Photo[] }).photos.map((ph, i) => (
            <ChapterItem key={ph.alt} photo={ph} />
          ))}
          <div className="chapter__panel chapter__panel--prep">
            <p className="milestone__num">06</p>
            <h3 className="milestone__title">{prep.title}</h3>
            <p className="milestone__body">{prep.text}</p>
          </div>
          {(prep as { photos: Photo[] }).photos.map((ph, i) => (
            <ChapterItem key={ph.alt} photo={ph} />
          ))}
          <div className="chapter__spacer" aria-hidden="true" />
        </div>
        <div className="chapter__progress" aria-hidden="true">
          <i />
        </div>
      </div>

      <div className="finale">
        <ArchPhoto photo={theDayPhoto} sizes="(min-width: 900px) 34vw, 78vw" className="finale__photo" />
        <div className="finale__text">
          <p className="milestone__num">07</p>
          <p className="finale__date" aria-label={theDay.date ?? undefined}>
            <span className="mask">
              <span>11</span>
            </span>
            <span className="mask">
              <span>·</span>
            </span>
            <span className="mask">
              <span>11</span>
            </span>
            <span className="mask">
              <span>·</span>
            </span>
            <span className="mask">
              <span>2026</span>
            </span>
          </p>
          <h3 className="milestone__title">{theDay.title}</h3>
          <p className="milestone__body">{theDay.text}</p>
        </div>
        <Scripture verse={verseAt("before-countdown")} />
      </div>
    </section>
  );
}

function ChapterItem({ photo }: { photo: Photo }) {
  return (
    <figure className="chapter__item">
      <Frame photo={photo} sizes="(min-width: 900px) 40vw, 100vw" />
    </figure>
  );
}
