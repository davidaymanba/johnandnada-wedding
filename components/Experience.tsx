"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { smooth } from "@/lib/lenis";
import { onIntroDone } from "@/lib/intro-state";
import { site } from "@/content/site";

const TONES: Record<string, string> = {
  night: "#1C2230",
  paper: "#F0EEE9",
  deep: "#141925",
};

/** Client shell: smooth scrolling, scroll-scrubbed background tone, progress hairline, music. */
export function Experience({ children }: { children: ReactNode }) {
  const bg = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => onIntroDone(() => setOpened(true)), []);

  // Lenis ↔ ScrollTrigger, on one clock (GSAP's ticker). Off for reduced motion.
  useEffect(() => {
    if (window.matchMedia(MQ.reduce).matches) return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, autoRaf: false });
    smooth.lenis = lenis;
    if (document.documentElement.classList.contains("is-locked")) lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      smooth.lenis = null;
    };
  }, []);

  useGSAP(() => {
    const layer = bg.current!;
    const zones = gsap.utils.toArray<HTMLElement>("[data-tone]");
    if (!zones.length) return;
    const first = TONES[zones[0].dataset.tone!] ?? TONES.night;
    gsap.set(layer, { backgroundColor: first });
    document.documentElement.classList.add("tones");
    let prev = first;
    zones.slice(1).forEach((zone) => {
      const next = TONES[zone.dataset.tone!] ?? TONES.night;
      if (next === prev) return;
      const from = prev;
      const mix = gsap.utils.interpolate(from, next);
      ScrollTrigger.create({
        trigger: zone,
        start: "top 72%",
        end: "top 42%",
        onUpdate: (self) => gsap.set(layer, { backgroundColor: mix(self.progress) }),
        onLeave: () => gsap.set(layer, { backgroundColor: next }),
        onLeaveBack: () => gsap.set(layer, { backgroundColor: from }),
      });
      prev = next;
    });

    gsap.fromTo(
      bar.current,
      { scaleX: 0 },
      { scaleX: 1, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.4 } },
    );

    // Fonts settle → line breaks change → re-measure everything once.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  });

  return (
    <>
      <div ref={bg} className="tone-layer" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className={`progress ${opened ? "is-on" : ""}`} aria-hidden="true">
        <div ref={bar} className="progress__bar" />
      </div>
      {site.music && opened && <MusicToggle src={site.music} />}
      {children}
    </>
  );
}

function MusicToggle({ src }: { src: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    // The knock was a user gesture, so playback is allowed now.
    const a = audio.current!;
    a.volume = 0.5;
    a.play().then(() => setOn(true)).catch(() => setOn(false));
  }, []);

  const toggle = () => {
    const a = audio.current!;
    if (a.paused) a.play().then(() => setOn(true)).catch(() => {});
    else {
      a.pause();
      setOn(false);
    }
  };

  return (
    <>
      <audio ref={audio} src={src} loop preload="auto" />
      <button type="button" className={`music ${on ? "is-on" : ""}`} aria-pressed={on} aria-label={on ? "Pause music" : "Play music"} onClick={toggle}>
        <span className="music__bars" aria-hidden="true">
          <i /> <i /> <i /> <i />
        </span>
      </button>
    </>
  );
}
