"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { smooth } from "@/lib/lenis";
import { music, toggleMusic } from "@/lib/music";
import { onIntroDone } from "@/lib/intro-state";
import { site } from "@/content/site";

type Theme = "dark" | "light";
const THEME_KEY = "nj-theme";
const THEME_COLOR: Record<Theme, string> = { dark: "#1C2230", light: "#F0EEE9" };

/** Client shell: smooth scrolling, progress hairline, theme toggle, music. */
export function Experience({ children }: { children: ReactNode }) {
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
      <div className="grain" aria-hidden="true" />
      <div className={`progress ${opened ? "is-on" : ""}`} aria-hidden="true">
        <div ref={bar} className="progress__bar" />
      </div>
      <ThemeToggle visible={opened} />
      {site.music && opened && <MusicToggle />}
      {children}
    </>
  );
}

function ThemeToggle({ visible }: { visible: boolean }) {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    const t: Theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[t]);
    setTheme(t);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const apply = () => {
      document.documentElement.dataset.theme = next;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[next]);
      setTheme(next);
    };
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !window.matchMedia(MQ.reduce).matches) doc.startViewTransition(apply);
    else apply();
  };

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  return (
    <button type="button" className={`fab theme-toggle ${visible ? "is-on" : ""}`} onClick={toggle} aria-label={label} title={label} tabIndex={visible ? 0 : -1}>
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1Z" />
        </svg>
      )}
    </button>
  );
}

function MusicToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const a = music();
    if (!a) return;
    const sync = () => setOn(!a.paused);
    sync();
    a.addEventListener("play", sync);
    a.addEventListener("pause", sync);
    return () => {
      a.removeEventListener("play", sync);
      a.removeEventListener("pause", sync);
    };
  }, []);

  return (
    <button
      type="button"
      className={`fab music is-on ${on ? "is-playing" : ""}`}
      aria-pressed={on}
      aria-label={on ? "Pause the hymn" : "Play the hymn"}
      title={on ? "Pause the hymn" : "Play the hymn"}
      onClick={toggleMusic}
    >
      <span className="music__bars" aria-hidden="true">
        <i /> <i /> <i /> <i />
      </span>
    </button>
  );
}
