"use client";

import type Lenis from "lenis";

/** Single shared Lenis instance (null when reduced motion is on). */
export const smooth: { lenis: Lenis | null } = { lenis: null };

export function lockScroll(locked: boolean) {
  document.documentElement.classList.toggle("is-locked", locked);
  if (locked) smooth.lenis?.stop();
  else smooth.lenis?.start();
}

export function scrollToTarget(target: string | HTMLElement) {
  if (smooth.lenis) smooth.lenis.scrollTo(target, { duration: 1.6 });
  else {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: "smooth" });
  }
}
