"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, MQ, SplitText, useGSAP } from "@/lib/gsap";
import { lockScroll } from "@/lib/lenis";
import { markIntroDone } from "@/lib/intro-state";
import { playKnock, playSwell } from "@/lib/sound";
import { primeMusic, startMusic } from "@/lib/music";
import { fullNames, site } from "@/content/site";
import { Monogram } from "./Monogram";

const D = site.door;
const F = D.frame;
const KNOCK = { x: D.seam, y: D.y + D.h * 0.56 };
const SESSION_KEY = "nj-door";

// Door shapes in the leaf's own pixels (pointed arch springs at D.spring).
const springY = D.spring - D.y;
const leftW = D.seam - D.x;
const rightW = D.x + D.w - D.seam;
const leftPath = `M0 ${D.h}V${springY}C0 ${springY * 0.54} ${leftW * 0.43} ${springY * 0.17} ${leftW} 0V${D.h}Z`;
const rightPath = `M0 0C${rightW * 0.56} ${springY * 0.17} ${rightW} ${springY * 0.54} ${rightW} ${springY}V${D.h}H0Z`;
const archPath = `M0 ${D.h}V${springY}C0 ${springY * 0.54} ${leftW * 0.43} ${springY * 0.17} ${leftW} 0C${leftW + rightW * 0.56} ${springY * 0.17} ${D.w} ${springY * 0.54} ${D.w} ${springY}V${D.h}Z`;

type Phase = "loading" | "ready" | "playing" | "door" | "opening" | "gone";

/** object-fit: cover, but horizontally biased so the door sits in the middle of narrow screens. */
function fit(vw: number, vh: number) {
  const s = Math.max(vw / F.w, vh / F.h);
  const ox = gsap.utils.clamp(vw - F.w * s, 0, vw / 2 - D.seam * s);
  const oy = (vh - F.h * s) / 2;
  return { s, ox, oy };
}

export function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const music = useRef<HTMLAudioElement>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const phaseRef = useRef<Phase>("loading");
  const geo = useRef(fit(1440, 900));
  const reduced = useRef(false);

  const go = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // Skipped (deep link / already opened this session): never mount the heavy parts.
  const [skipped] = useState(() => typeof document !== "undefined" && document.documentElement.dataset.intro === "skip");

  // ── layout: keep the 1920×1080 stage covering the screen, door centred ───────────
  useEffect(() => {
    if (skipped) return;
    const el = root.current!;
    const layout = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const g = fit(vw, vh);
      geo.current = g;
      el.style.setProperty("--s", String(g.s));
      el.style.setProperty("--ox", `${g.ox}px`);
      el.style.setProperty("--oy", `${g.oy}px`);
      el.style.setProperty("--door-top", `${g.oy + D.y * g.s}px`);
      el.style.setProperty("--door-bottom", `${g.oy + (D.y + D.h) * g.s}px`);
      el.style.setProperty("--knock-x", `${g.ox + KNOCK.x * g.s}px`);
      el.style.setProperty("--knock-y", `${g.oy + KNOCK.y * g.s}px`);
    };
    layout();
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
  }, [skipped]);

  // ── lock the page behind the curtain ──────────────────────────────────────────────
  useEffect(() => {
    if (skipped) return;
    lockScroll(true);
    const main = document.getElementById("main");
    main?.setAttribute("inert", "");
    return () => main?.removeAttribute("inert");
  }, [skipped]);

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    document.getElementById("main")?.removeAttribute("inert");
    lockScroll(false);
    window.scrollTo(0, 0);
    markIntroDone();
    go("gone");
  }, [go]);

  /** Let the film's music ring out softly (iOS ignores volume, so it simply plays to its own fade). */
  const fadeMusic = useCallback((duration: number) => {
    const a = music.current;
    if (!a || a.paused) return;
    gsap.to(a, { volume: 0, duration, ease: "none", onComplete: () => a.pause() });
  }, []);

  // ── door ready: light behind the seam, hint, ring ─────────────────────────────────
  const toDoor = useCallback(
    (instant: boolean) => {
      if (phaseRef.current === "door" || phaseRef.current === "opening" || phaseRef.current === "gone") return;
      go("door");
      if (!instant) fadeMusic(1.2);
      const q = gsap.utils.selector(root);
      const v = video.current;
      gsap.to(q(".intro__preload"), { autoAlpha: 0, duration: 0.6, overwrite: true });
      gsap.to(q(".intro__still"), {
        autoAlpha: 1,
        duration: instant ? 0 : 0.7,
        ease: "drift",
        onComplete: () => {
          v?.pause();
          gsap.set(q(".door"), { autoAlpha: 1 });
          gsap.set(v, { autoAlpha: 0 });
        },
      });
      gsap.to(q(".intro__skip"), { autoAlpha: 0, duration: 0.4 });

      const tl = gsap.timeline({ delay: instant ? 0.05 : 0.7 });
      tl.to(q(".intro__vignette"), { autoAlpha: 1, duration: 1.6, ease: "drift" })
        .fromTo(q(".door__seam"), { autoAlpha: 0, scaleY: 0.2 }, { autoAlpha: 1, scaleY: 1, duration: 1.4 }, "<0.2")
        .fromTo(q(".intro__title > *"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 1.4 }, "<0.1")
        .add(() => {
          const hint = q(".intro__hint-text")[0];
          if (!hint) return;
          if (reduced.current) {
            gsap.to(hint, { autoAlpha: 1, duration: 0.6 });
            return;
          }
          gsap.set(hint, { autoAlpha: 1 });
          SplitText.create(hint, {
            type: "chars",
            onSplit: (self) =>
              gsap.from(self.chars, { autoAlpha: 0, yPercent: 70, rotateX: -60, stagger: 0.035, duration: 1.1, ease: "reveal" }),
          });
        }, "<0.5")
        .fromTo(q(".intro__ring"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, "<0.3");

      if (!reduced.current) {
        gsap.to(q(".door__seam"), { opacity: 0.55, duration: 1.8, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 2.6 });
        gsap.fromTo(
          q(".intro__ring-pulse"),
          { scale: 0.4, autoAlpha: 0.9 },
          { scale: 2.4, autoAlpha: 0, duration: 2.2, ease: "power2.out", repeat: -1, repeatDelay: 0.6, delay: 2.2 },
        );
      }
      q<HTMLButtonElement>(".door__btn")[0]?.focus({ preventScroll: true });
    },
    [go, fadeMusic],
  );

  // ── the knock ─────────────────────────────────────────────────────────────────────
  const knock = useCallback(() => {
    if (phaseRef.current !== "door") return;
    go("opening");
    const q = gsap.utils.selector(root);
    fadeMusic(0.5);
    playKnock();
    startMusic(); // the knock is a tap, so the hymn may start now
    try {
      navigator.vibrate?.(30);
    } catch {}

    if (reduced.current) {
      gsap.to(root.current, { autoAlpha: 0, duration: 0.6, ease: "drift", onComplete: finish });
      return;
    }

    playSwell(3);
    const g = geo.current;
    const vw = window.innerWidth;
    const desktop = window.matchMedia(MQ.desktop).matches;
    const push = Math.max(4.2, (vw / (D.w * g.s)) * 1.7);
    gsap.killTweensOf([q(".door__seam"), q(".intro__ring-pulse")]);

    const tl = gsap.timeline({ onComplete: finish });
    tl.to(q(".intro__camera"), { keyframes: { x: [0, -5, 4, -2, 0] }, duration: 0.34, ease: "none" })
      .fromTo(q(".intro__knock-ring"), { scale: 0.2, autoAlpha: 1 }, { scale: 3.2, autoAlpha: 0, duration: 1, ease: "power2.out" }, 0)
      .to([q(".intro__hint"), q(".intro__title"), q(".intro__ring")], { autoAlpha: 0, y: 8, duration: 0.5, ease: "drift" }, 0.05)
      .to(q(".door__seam"), { opacity: 1, scaleX: 4, duration: 0.5, ease: "power2.in" }, 0.2)
      .to(q(".door__leaf--l"), { rotateY: 96, duration: 2.1, ease: "door" }, 0.42)
      .to(q(".door__leaf--r"), { rotateY: -96, duration: 2.1, ease: "door" }, 0.42)
      .to(q(".door__shade"), { opacity: 0.85, duration: 1.6, ease: "drift" }, 0.5)
      .to(q(".door__seam"), { autoAlpha: 0, duration: 0.4 }, 0.7)
      .to(q(".door__glow"), { opacity: 1, duration: 1.4, ease: "drift" }, 0.6)
      .to(q(".door__spill"), { opacity: 1, scaleX: 1.25, duration: 1.6, ease: "drift" }, 0.6)
      .to(q(".intro__vignette"), { autoAlpha: 0.6, duration: 1.2 }, 1)
      .set(q(".intro__camera"), { transformOrigin: `${g.ox + KNOCK.x * g.s}px ${g.oy + (D.y + D.h * 0.62) * g.s}px` }, 0)
      .to(q(".intro__camera"), { scale: push, duration: 2.3, ease: "power3.in" }, 1.05)
      .to(q(".intro__camera"), desktop ? { filter: "blur(6px)", duration: 0.9, ease: "power2.in" } : { duration: 0 }, 2.45)
      .to(q(".intro__bloom"), { autoAlpha: 1, duration: 1, ease: "power2.in" }, 2.3)
      .to(root.current, { autoAlpha: 0, duration: 0.9, ease: "drift" }, 3.35);
  }, [finish, go, fadeMusic]);

  // ── preloader → video → door ──────────────────────────────────────────────────────
  useGSAP(
    () => {
      if (skipped) return;
      const q = gsap.utils.selector(root);
      const v = video.current!;
      const mm = gsap.matchMedia();
      mm.add({ motion: MQ.motion, reduce: MQ.reduce }, (ctx) => {
        reduced.current = Boolean(ctx.conditions?.reduce);
      });

      const lines = q(".intro__preload .monogram__line, .intro__preload .monogram__glyph");
      const glyphs = q(".intro__preload .monogram__glyph");

      if (reduced.current) {
        gsap.set(q(".intro__monogram"), { autoAlpha: 1 });
        gsap.delayedCall(0.8, () => toDoor(true));
        return () => mm.revert();
      }

      const ready = new Promise<void>((resolve) => {
        if (v.readyState >= 3) return resolve();
        v.addEventListener("canplaythrough", () => resolve(), { once: true });
        setTimeout(resolve, 7000);
      });

      const draw = gsap.timeline();
      draw
        .set(q(".intro__monogram"), { autoAlpha: 1 })
        .fromTo(lines, { drawSVG: "0%" }, { drawSVG: "100%", duration: 2.1, stagger: 0.12, ease: "drift" })
        .from(q(".intro__preload-date"), { letterSpacing: "0.6em", duration: 1.8, ease: "drift" }, 0.3);

      let cancelled = false;
      Promise.all([ready, draw.then()]).then(async () => {
        if (cancelled) return;
        await gsap.to(glyphs, { fillOpacity: 1, strokeOpacity: 0, duration: 0.7, stagger: 0.08, ease: "drift" }).then();
        if (cancelled) return;
        // Sound needs a tap, so the guest opens the invitation themselves.
        go("ready");
      });

      return () => {
        cancelled = true;
        mm.revert();
      };
    },
    { scope: root, dependencies: [skipped] },
  );

  const start = useCallback(() => {
    if (phaseRef.current !== "ready") return;
    const q = gsap.utils.selector(root);
    go("playing");
    gsap.to(q(".intro__preload"), { autoAlpha: 0, scale: 1.04, duration: 1.1, ease: "drift" });
    gsap.fromTo(q(".intro__skip"), { autoAlpha: 0 }, { autoAlpha: 1, delay: 1.5, duration: 0.6 });
    // Watchdog: if the stream stalls, don't keep guests waiting.
    gsap.delayedCall(16, () => toDoor(false));
  }, [go, toDoor]);

  // Video and its music start together, inside the tap (that's what unlocks sound on phones).
  const begin = useCallback(() => {
    if (phaseRef.current !== "ready") return;
    primeMusic();
    const v = video.current!;
    const a = music.current;
    if (a) {
      a.currentTime = 0;
      a.volume = 1;
      a.play().catch(() => {});
    }
    v.play()
      .then(start)
      .catch(() => {
        go("playing");
        toDoor(false);
      });
  }, [go, start, toDoor]);

  useEffect(() => {
    if (phase === "ready") root.current?.querySelector<HTMLButtonElement>(".intro__begin")?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (skipped) return;
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current === "door" && (e.key === "Enter" || e.key === " ") && document.activeElement === document.body) {
        e.preventDefault();
        knock();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [knock, skipped]);

  if (skipped || phase === "gone") return null;

  return (
    <div
      ref={root}
      className="intro"
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label="Wedding invitation — knock on the door to open it"
      onClick={phase === "door" ? knock : undefined}
    >
      <div className="intro__camera">
        <div className="intro__stage">
          <video
            ref={video}
            className="intro__video"
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            onEnded={() => toDoor(true)}
            aria-hidden="true"
          >
            {/* Sources live in the HTML so the download starts before any JS runs. */}
            <source src="/media/intro-1080.mp4" type="video/mp4" media="(min-width: 1000px)" />
            <source src="/media/intro-720.mp4" type="video/mp4" />
          </video>
          <audio ref={music} src="/media/intro-audio.m4a" preload="auto" aria-hidden="true" />
          <picture className="intro__still" aria-hidden="true">
            <source type="image/avif" srcSet="/media/door-1280.avif 1280w, /media/door-1920.avif 1920w" sizes="1920px" />
            <source type="image/webp" srcSet="/media/door-1280.webp 1280w, /media/door-1920.webp 1920w" sizes="1920px" />
            <img src="/media/door-1920.jpg" alt="" width={1920} height={1080} decoding="async" />
          </picture>

          <div className="door" style={{ left: D.x, top: D.y, width: D.w, height: D.h }}>
            <div className="door__light" style={{ clipPath: `path("${archPath}")` }}>
              <div className="door__glow" />
            </div>
            <div className="door__leaf door__leaf--l" style={{ width: leftW, clipPath: `path("${leftPath}")`, backgroundPosition: `-${D.x}px -${D.y}px` }}>
              <span className="door__shade" />
            </div>
            <div
              className="door__leaf door__leaf--r"
              style={{ left: leftW, width: rightW, clipPath: `path("${rightPath}")`, backgroundPosition: `-${D.seam}px -${D.y}px` }}
            >
              <span className="door__shade" />
            </div>
            <span className="door__seam" style={{ left: leftW - 1 }} />
            <button
              type="button"
              className="door__btn"
              aria-label="Knock on the door to open the invitation"
              disabled={phase !== "door"}
              onClick={(e) => {
                e.stopPropagation();
                knock();
              }}
            />
          </div>
          <div className="door__spill" style={{ left: D.x - 120, top: D.y + D.h - 30, width: D.w + 240 }} />
        </div>
      </div>

      <div className="intro__vignette" aria-hidden="true" />

      <div className="intro__title" aria-hidden="true">
        <p className="eyebrow">The wedding of</p>
        <p className="intro__names">
          <span>{fullNames.groom}</span>
          <span className="amp">&amp;</span>
          <span>{fullNames.bride}</span>
        </p>
      </div>

      <div className="intro__ring" aria-hidden="true">
        <span className="intro__ring-dot" />
        <span className="intro__ring-pulse" />
      </div>
      <span className="intro__knock-ring" aria-hidden="true" />

      <p className="intro__hint" aria-hidden={phase !== "door"}>
        <span className="intro__hint-text">{site.intro.hint}</span>
      </p>

      <div className="intro__preload">
        <Monogram className="intro__monogram" />
        <p className="intro__preload-date">11 · 11 · 2026</p>
        {phase === "ready" && (
          <div className="intro__begin-wrap">
            <button type="button" className="btn intro__begin" onClick={begin}>
              {site.intro.begin}
            </button>
            <p className="intro__sound" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
                <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
              </svg>
              {site.intro.sound}
            </p>
          </div>
        )}
      </div>

      <button type="button" className="intro__skip" onClick={(e) => (e.stopPropagation(), toDoor(false))}>
        {site.intro.skip}
      </button>

      <div className="intro__bloom" aria-hidden="true" />
    </div>
  );
}
