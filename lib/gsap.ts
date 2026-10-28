"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { CustomEase } from "gsap/CustomEase";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";

let registered = false;

if (typeof window !== "undefined" && !registered) {
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase, Flip, useGSAP);
  // The site's whole easing language — three curves, used everywhere.
  CustomEase.create("reveal", "M0,0 C0.16,1 0.3,1 1,1"); // long, soft arrival
  CustomEase.create("door", "M0,0 C0.6,0 0.12,1 1,1"); // heavy start, weightless finish
  CustomEase.create("drift", "M0,0 C0.45,0 0.25,1 1,1"); // calm in-out for scrubs and loops
  gsap.defaults({ ease: "reveal", duration: 1.2 });
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

/** Media-query conditions shared by every gsap.matchMedia() in the site. */
export const MQ = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 900px)",
  mobile: "(max-width: 899px)",
} as const;

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase, Flip, useGSAP };
