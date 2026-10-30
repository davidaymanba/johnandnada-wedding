"use client";

import { useRef, useState, type FormEvent } from "react";
import { gsap, MQ, useGSAP, REVEAL_START, REVEAL_SPEED } from "@/lib/gsap";
import { site } from "@/content/site";

type Relation = "groom" | "bride" | "family" | null;

const gb = site.guestbook;

/**
 * Guests leave a blessing; it goes privately to the couple (nothing is shown publicly).
 * The couple reads them at /blessings, behind a password (see README).
 */
export function Guestbook() {
  const root = useRef<HTMLElement>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [relation, setRelation] = useState<Relation>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        gsap.from(q(".guestbook__head > *, .guestbook__form .field, .guestbook__form .chips, .guestbook__actions"), {
          autoAlpha: 0,
          y: 18,
          stagger: 0.08,
          duration: 1.2,
          scrollTrigger: { trigger: root.current, start: REVEAL_START, once: true },
        }).timeScale(REVEAL_SPEED);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // The thank-you note rises in where the form was.
  useGSAP(
    () => {
      if (!sent || window.matchMedia(MQ.reduce).matches) return;
      const q = gsap.utils.selector(root);
      gsap
        .timeline()
        .from(q(".guestbook__thanks .ornament path"), { drawSVG: "50% 50%", duration: 1.4, ease: "drift" })
        .from(q(".guestbook__thanks > :not(.ornament)"), { autoAlpha: 0, y: 14, stagger: 0.12, duration: 1.1 }, 0.2);
    },
    { dependencies: [sent], scope: root },
  );

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    setError(null);
    const website = String(new FormData(e.currentTarget).get("website") ?? "");
    const body = { name: name.trim(), message: message.trim(), relation, website };
    if (!body.name) return setError("Please add your name.");
    if (body.message.length < 2) return setError("Please write a message.");

    setSending(true);
    try {
      const res = await fetch("/api/guestbook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn’t send your blessing.");
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const again = () => {
    setName("");
    setMessage("");
    setRelation(null);
    setSent(false);
  };

  return (
    <section ref={root} id="guestbook" className="section guestbook" aria-labelledby="guestbook-title">
      <header className="guestbook__head">
        <p className="eyebrow">{gb.eyebrow}</p>
        <h2 id="guestbook-title" className="section-title">
          {gb.title}
        </h2>
        <p className="guestbook__intro">{gb.intro}</p>
      </header>

      {sent ? (
        <div className="guestbook__thanks" role="status">
          <svg className="ornament" viewBox="0 0 240 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M8 12H98" strokeWidth=".8" />
            <path d="M232 12H142" strokeWidth=".8" />
            <path d="M120 2L128 12L120 22L112 12Z" strokeWidth=".9" />
            <path d="M120 7V17M115 12H125" strokeWidth=".8" />
          </svg>
          <p className="guestbook__thanks-title">Thank you{name ? `, ${name.split(" ")[0]}` : ""}.</p>
          <p className="guestbook__thanks-text">
            Your blessing is on its way to {site.names.groom} &amp; {site.names.bride}. They will keep every word.
          </p>
          <button type="button" className="btn" onClick={again}>
            Write another
          </button>
        </div>
      ) : (
        <form className="guestbook__form" onSubmit={submit} noValidate>
          <label className="field">
            <span className="field__label">Your name</span>
            <input name="name" autoComplete="name" maxLength={40} required value={name} onChange={(e) => setName(e.target.value)} />
            <i className="field__line" aria-hidden="true" />
          </label>

          <fieldset className="chips">
            <legend className="field__label">I’m from… (optional)</legend>
            {gb.relations.map((r) => (
              <label key={r.value} className="chip">
                <input
                  type="radio"
                  name="relation"
                  value={r.value}
                  checked={relation === r.value}
                  onChange={() => setRelation(r.value as Relation)}
                  onClick={() => relation === r.value && setRelation(null)}
                />
                <span>{r.label}</span>
              </label>
            ))}
          </fieldset>

          <label className="field">
            <span className="field__label">Your blessing</span>
            <textarea name="message" rows={4} maxLength={500} required value={message} onChange={(e) => setMessage(e.target.value)} />
            <i className="field__line" aria-hidden="true" />
            <span className="field__count" aria-hidden="true">
              {message.length}/500
            </span>
          </label>

          {/* Honeypot */}
          <label className="hp" aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>

          <div className="guestbook__actions">
            <button type="submit" className="btn btn--solid guestbook__submit" disabled={sending}>
              {sending ? "Sending…" : "Send your blessing"}
            </button>
            <p className="guestbook__private">
              Only {site.names.groom} &amp; {site.names.bride} will read it.
            </p>
            <p className="guestbook__status" role="status" aria-live="polite">
              {error && <span className="is-error">{error}</span>}
            </p>
          </div>
        </form>
      )}
    </section>
  );
}
