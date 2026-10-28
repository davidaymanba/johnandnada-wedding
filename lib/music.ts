"use client";

import { gsap } from "@/lib/gsap";
import { site } from "@/content/site";

// One shared player for the hymn. Phones only allow audio that starts inside a tap,
// so the intro calls prime() on "Open the invitation" and start() on the knock.
let el: HTMLAudioElement | null = null;
const VOLUME = 0.75;

export function music() {
  if (typeof window === "undefined" || !site.music) return null;
  if (!el) {
    el = new Audio();
    el.src = site.music;
    el.loop = true;
    el.preload = "none";
    el.dataset.music = "hymn";
    el.hidden = true;
    document.body.appendChild(el);
  }
  return el;
}

/** Start buffering early so the hymn is ready when the door opens. */
export function primeMusic() {
  const a = music();
  if (!a || a.preload === "auto") return;
  a.preload = "auto";
  a.load();
}

/** Must be called synchronously inside a user gesture (the knock / a tap). */
export function startMusic(fadeIn = 4) {
  const a = music();
  if (!a) return;
  a.volume = 0;
  a.play()
    .then(() => gsap.to(a, { volume: VOLUME, duration: fadeIn, ease: "none" }))
    .catch(() => {});
}

export function toggleMusic() {
  const a = music();
  if (!a) return;
  if (a.paused) {
    a.volume = VOLUME;
    void a.play().catch(() => {});
  } else a.pause();
}
