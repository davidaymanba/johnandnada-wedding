"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { site } from "@/content/site";
import { googleCalendarUrl } from "@/lib/calendar";
import { Magnetic } from "./Magnetic";
import { ARCH_D } from "./ArchPhoto";

const ev = site.event;

export function Details() {
  const root = useRef<HTMLElement>(null);
  const [calOpen, setCalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: q(".details__card")[0], start: "top 72%", once: true } });
        tl.from(q(".details__frame path"), { drawSVG: "50% 50%", duration: 2, ease: "drift" })
          .from(q(".details__head > *"), { autoAlpha: 0, y: 14, stagger: 0.12, duration: 1.1 }, 0.2)
          .from(q(".details__day-num"), { yPercent: 105, duration: 1.5, stagger: 0.1, ease: "reveal" }, 0.45)
          .from(q(".details__row .mask > *"), { yPercent: 105, duration: 1.2, stagger: 0.14, ease: "reveal" }, 0.8)
          .from(q(".details__icon path, .details__icon circle, .details__icon rect"), { drawSVG: "0%", duration: 1.2, stagger: 0.05, ease: "drift" }, 0.9)
          .from(q(".details__actions .magnetic"), { autoAlpha: 0, y: 16, stagger: 0.1, duration: 1 }, 1.4);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!calOpen) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && (e.target as HTMLElement).closest(".cal")) return;
      setCalOpen(false);
    };
    window.addEventListener("keydown", close);
    window.addEventListener("click", close);
    return () => {
      window.removeEventListener("keydown", close);
      window.removeEventListener("click", close);
    };
  }, [calOpen]);

  const share = async () => {
    const data = { title: site.title, text: `${site.title}\n${site.description}`, url: site.url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(site.url);
      setToast("Link copied");
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") setToast("Couldn’t share — copy the address bar link");
    }
  };

  return (
    <section ref={root} id="details" className="section details" aria-labelledby="details-title">
      <div className="details__card">
        <svg className="details__frame" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
          <path d={ARCH_D} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="details__head">
          <p className="eyebrow">{site.details.eyebrow}</p>
          <h2 id="details-title" className="details__title">
            {site.details.title}
          </h2>
        </div>

        <p className="details__date" aria-label={`${ev.weekday}, ${ev.dateLong}`}>
          <span className="details__weekday">{ev.weekday}</span>
          <span className="details__day" aria-hidden="true">
            <span className="mask">
              <span className="details__day-num">11</span>
            </span>
            <span className="details__dot">·</span>
            <span className="mask">
              <span className="details__day-num">11</span>
            </span>
            <span className="details__dot">·</span>
            <span className="mask">
              <span className="details__day-num">26</span>
            </span>
          </span>
        </p>

        <ul className="details__rows">
          <li className="details__row">
            <CalendarIcon />
            <span className="mask">
              <span>{ev.dateLong}</span>
            </span>
          </li>
          <li className="details__row">
            <ClockIcon />
            <span className="mask">
              <span>{ev.time}</span>
            </span>
          </li>
          <li className="details__row">
            <PinIcon />
            <span className="mask">
              <span className="details__venue">
                {ev.venue}
                <small>{ev.city}</small>
              </span>
            </span>
          </li>
        </ul>

        <div className="details__actions">
          <Magnetic>
            <a className="btn" href={ev.mapsUrl} target="_blank" rel="noopener noreferrer">
              Open in Maps
            </a>
          </Magnetic>
          <Magnetic>
            <span className="cal">
              <button type="button" className="btn" aria-expanded={calOpen} aria-controls="cal-menu" onClick={() => setCalOpen((v) => !v)}>
                Add to calendar
              </button>
              <span id="cal-menu" className="cal__menu" role="menu" hidden={!calOpen}>
                <a role="menuitem" href="/invite.ics" onClick={() => setCalOpen(false)}>
                  Apple / Outlook (.ics)
                </a>
                <a role="menuitem" href={googleCalendarUrl()} target="_blank" rel="noopener noreferrer" onClick={() => setCalOpen(false)}>
                  Google Calendar
                </a>
              </span>
            </span>
          </Magnetic>
          <Magnetic>
            <button type="button" className="btn btn--solid" onClick={share}>
              Share invitation
            </button>
          </Magnetic>
        </div>
      </div>
      <p className="toast" role="status" aria-live="polite" data-show={Boolean(toast)}>
        {toast}
      </p>
    </section>
  );
}

const iconProps = { className: "details__icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.1, "aria-hidden": true } as const;

function CalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h2M14 13.5h2M8 16.5h2" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11Z" />
      <path d="M12 4.5v5M9.5 7h5" />
    </svg>
  );
}
