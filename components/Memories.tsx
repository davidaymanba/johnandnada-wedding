"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Flip, gsap, MQ, ScrollTrigger, useGSAP, REVEAL_START, REVEAL_SPEED } from "@/lib/gsap";
import { lockScroll } from "@/lib/lenis";
import { site } from "@/content/site";
import { Frame } from "./Frame";

const photos = site.memories.photos;

export function Memories() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const flip = useRef<Flip.FlipState | null>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        gsap.from(q(".memories__head > *"), {
          autoAlpha: 0,
          y: 16,
          stagger: 0.12,
          duration: 1.2,
          scrollTrigger: { trigger: root.current, start: REVEAL_START, once: true },
        }).timeScale(REVEAL_SPEED);
        const tiles = q(".tile");
        gsap.set(tiles, { clipPath: "inset(100% 0% 0% 0%)" });
        gsap.set(q(".tile .frame__reveal img"), { scale: 1.2 });
        ScrollTrigger.batch(tiles, {
          start: REVEAL_START,
          once: true,
          onEnter: (batch) => {
            gsap.to(batch, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, stagger: 0.08, ease: "door" });
            gsap.to(
              batch.map((b) => b.querySelector(".frame__reveal img")),
              { scale: 1, duration: 1.3, stagger: 0.08, ease: "reveal" },
            );
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const show = (i: number) => {
    const img = thumbs.current[i]?.querySelector<HTMLElement>(".frame__reveal img");
    flip.current = img && !window.matchMedia(MQ.reduce).matches ? Flip.getState(img) : null;
    setOpen(i);
  };

  const close = useCallback(() => {
    setOpen((i) => {
      if (i !== null) requestAnimationFrame(() => thumbs.current[i]?.focus({ preventScroll: true }));
      return null;
    });
  }, []);

  return (
    <section ref={root} id="memories" className="section memories" aria-labelledby="memories-title">
      <header className="memories__head">
        <p className="eyebrow">{site.memories.eyebrow}</p>
        <h2 id="memories-title" className="section-title">
          {site.memories.title}
        </h2>
      </header>
      <ul className="memories__grid">
        {photos.map((p, i) => (
          <li key={p.alt} className="tile">
            <button ref={(el) => void (thumbs.current[i] = el)} type="button" className="tile__btn" onClick={() => show(i)} aria-label={`Open photo: ${p.alt}`}>
              <Frame photo={p} sizes="(min-width: 900px) 300px, 100vw" imgProps={{ "data-flip-id": `photo-${i}` }} />
            </button>
          </li>
        ))}
      </ul>
      {open !== null && <Lightbox index={open} setIndex={setOpen} onClose={close} flipState={flip} />}
    </section>
  );
}

function Lightbox({
  index,
  setIndex,
  onClose,
  flipState,
}: {
  index: number;
  setIndex: (i: number) => void;
  onClose: () => void;
  flipState: React.RefObject<Flip.FlipState | null>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const p = photos[index];
  const go = useCallback((d: number) => setIndex((index + d + photos.length) % photos.length), [index, setIndex]);

  useEffect(() => {
    lockScroll(true);
    box.current?.querySelector<HTMLButtonElement>(".lightbox__close")?.focus();
    return () => lockScroll(false);
  }, []);

  // Open: the thumbnail grows into place (Flip by data-flip-id). Later photos cross-fade.
  useLayoutEffect(() => {
    const img = box.current?.querySelector<HTMLElement>(".lightbox__img");
    if (!img) return;
    const state = flipState.current;
    if (state) {
      flipState.current = null;
      gsap.fromTo(box.current, { backgroundColor: "rgba(12,15,22,0)" }, { backgroundColor: "rgba(12,15,22,0.94)", duration: 0.6 });
      Flip.from(state, { targets: img, duration: 0.9, ease: "reveal", scale: false, absolute: true });
      gsap.from(box.current!.querySelectorAll(".lightbox__ui"), { autoAlpha: 0, duration: 0.6, delay: 0.4 });
    } else {
      gsap.fromTo(img, { autoAlpha: 0, scale: 0.98 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "drift" });
    }
  }, [index, flipState]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab") {
        const f = Array.from(box.current!.querySelectorAll<HTMLElement>("button"));
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // Swipe
  const start = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      ref={box}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        else if (dy > 90) onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <figure className="lightbox__figure">
        <Image
          key={index}
          src={p.src}
          alt={p.alt}
          sizes="92vw"
          className="lightbox__img"
          data-flip-id={`photo-${index}`}
          loading="eager"
          quality={85}
          draggable={false}
        />
        <figcaption className="lightbox__ui lightbox__count">
          {index + 1} / {photos.length}
        </figcaption>
      </figure>
      <button type="button" className="lightbox__ui lightbox__close" onClick={onClose} aria-label="Close photo viewer">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <button type="button" className="lightbox__ui lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label="Previous photo">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <button type="button" className="lightbox__ui lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label="Next photo">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
