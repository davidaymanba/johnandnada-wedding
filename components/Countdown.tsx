"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { site } from "@/content/site";

const TARGET = new Date(site.event.start).getTime();
const END = new Date(site.event.end).getTime();
const JOURNEY = new Date(site.journeyStart).getTime();
const CAIRO_DAY = (t: number) => new Date(t).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });

/** `?now=2026-11-11T20:00:00+02:00` mocks the clock (for testing before / on the day / after). */
function useNow() {
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const mock = new URLSearchParams(location.search).get("now");
    const off = mock && !Number.isNaN(Date.parse(mock)) ? Date.parse(mock) - Date.now() : 0;
    setOffset(off);
    setNow(Date.now() + off);
    const id = setInterval(() => setNow(Date.now() + off), 1000);
    return () => clearInterval(id);
  }, []);
  return { now, offset };
}

function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

// Each digit is its own column: [9,0,1,…,9]. Counting down moves the column down, so new digits
// always arrive from above; 0→9 lands on the top "9", then silently jumps to the bottom one.
function Digit({ value, reduced }: { value: number; reduced: boolean }) {
  const col = useRef<HTMLSpanElement>(null);
  const prev = useRef<number | null>(null);

  useEffect(() => {
    const el = col.current!;
    const idx = (d: number) => d + 1;
    const pos = (i: number) => -(i / 11) * 100;
    if (prev.current === null || reduced) {
      gsap.set(el, { yPercent: pos(idx(value)) });
    } else if (prev.current === 0 && value === 9) {
      gsap.to(el, {
        yPercent: pos(0),
        duration: 0.7,
        ease: "reveal",
        onComplete: () => gsap.set(el, { yPercent: pos(10) }),
      });
    } else {
      gsap.to(el, { yPercent: pos(idx(value)), duration: 0.7, ease: "reveal" });
    }
    prev.current = value;
  }, [value, reduced]);

  return (
    <span className="digit">
      <span ref={col} className="digit__col">
        {[9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </span>
    </span>
  );
}

function Unit({ value, label, min = 2, reduced }: { value: number; label: string; min?: number; reduced: boolean }) {
  const digits = String(value).padStart(min, "0").split("").map(Number);
  return (
    <div className="unit">
      <span className="unit__digits">
        {digits.map((d, i) => (
          <Digit key={digits.length - i} value={d} reduced={reduced} />
        ))}
      </span>
      <span className="unit__label">{label}</span>
    </div>
  );
}

export function Countdown() {
  const root = useRef<HTMLElement>(null);
  const { now } = useNow();
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(window.matchMedia(MQ.reduce).matches), []);

  const state = useMemo(() => {
    if (now === null) return "before" as const;
    if (now >= END || (now >= TARGET && CAIRO_DAY(now) !== CAIRO_DAY(TARGET))) return "after" as const;
    if (CAIRO_DAY(now) === CAIRO_DAY(TARGET)) return now >= TARGET ? ("today" as const) : ("today-before" as const);
    return "before" as const;
  }, [now]);

  const t = split(now === null ? TARGET - JOURNEY : TARGET - now);
  const progress = now === null ? 0 : gsap.utils.clamp(0, 1, (now - JOURNEY) / (TARGET - JOURNEY));
  const showClock = state === "before" || state === "today-before";

  // Screen readers: announce once a minute, never every second.
  const announcement = `${t.days} days, ${t.hours} hours and ${t.minutes} minutes until the wedding`;

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
        tl.from(q(".countdown__head > *"), { autoAlpha: 0, y: 14, stagger: 0.12, duration: 1.2 })
          .from(q(".unit"), { autoAlpha: 0, y: 30, stagger: 0.12, duration: 1.4 }, 0.2)
          .from(q(".unit__sep"), { scaleY: 0, stagger: 0.12, duration: 1.2, ease: "drift" }, 0.4)
          .from(q(".journey__line"), { scaleX: 0, duration: 1.8, ease: "drift" }, 0.6)
          .from(q(".journey__fill"), { scaleX: 0, duration: 2.4, ease: "reveal" }, 1)
          .from(q(".journey__meta > *"), { autoAlpha: 0, y: 8, stagger: 0.1, duration: 1 }, 1.4);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="countdown" className="section countdown" data-tone="night" aria-labelledby="countdown-title">
      <div className="countdown__head">
        <p className="eyebrow">{site.countdown.eyebrow}</p>
        <h2 id="countdown-title" className="countdown__title">
          {state === "today" || state === "today-before" ? site.countdown.today : state === "after" ? site.countdown.after : "The countdown"}
        </h2>
      </div>

      {showClock && (
        <>
          <div className="countdown__clock" aria-hidden="true">
            <Unit value={t.days} label="Days" reduced={reduced} />
            <span className="unit__sep" />
            <Unit value={t.hours} label="Hours" reduced={reduced} />
            <span className="unit__sep" />
            <Unit value={t.minutes} label="Minutes" reduced={reduced} />
            <span className="unit__sep" />
            <Unit value={t.seconds} label="Seconds" reduced={reduced} />
          </div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {now === null ? "" : announcement}
          </p>
        </>
      )}

      <div className="journey" aria-label={`${Math.round(progress * 100)}% ${site.countdown.progressLabel}`} role="img">
        <div className="journey__line">
          <div className="journey__fill" style={{ transform: `scaleX(${progress})` }} />
          <span className="journey__dot" style={{ left: `${progress * 100}%` }} />
        </div>
        <div className="journey__meta">
          <span>Nov 7, 2025</span>
          <span className="journey__pct">
            {Math.round(progress * 100)}% <em>{site.countdown.progressLabel}</em>
          </span>
          <span>Nov 11, 2026</span>
        </div>
      </div>

      <p className="countdown__when">
        {site.event.weekday} · {site.event.dateLong} · {site.event.time}
      </p>
    </section>
  );
}
