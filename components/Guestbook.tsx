"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Flip, gsap, MQ, useGSAP } from "@/lib/gsap";
import { site } from "@/content/site";

type Entry = { id: string; name: string; message: string; relation: "bride" | "groom" | "family" | null; created_at: string; pending?: boolean; key?: string };

const gb = site.guestbook;
const relLabel = (r: Entry["relation"]) => gb.relations.find((x) => x.value === r)?.label ?? null;

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function ago(iso: string) {
  const s = (new Date(iso).getTime() - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of steps) if (Math.abs(s) >= secs) return rtf.format(Math.round(s / secs), unit);
  return "just now";
}

export function Guestbook() {
  const root = useRef<HTMLElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const flyFrom = useRef<DOMRect | null>(null);
  const shown = useRef(new Set<string>());

  const [entries, setEntries] = useState<Entry[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [relation, setRelation] = useState<Entry["relation"]>(null);
  const [, tick] = useState(0);

  const load = useCallback(async (before?: string) => {
    try {
      const res = await fetch(`/api/guestbook${before ? `?before=${encodeURIComponent(before)}` : ""}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { entries: Entry[]; next: string | null };
      setEntries((prev) => {
        const seen = new Set(prev.map((e) => e.id));
        return before ? [...prev, ...data.entries.filter((e) => !seen.has(e.id))] : data.entries;
      });
      setNext(data.next);
      setStatus("ready");
    } catch {
      setStatus((s) => (s === "loading" ? "error" : s));
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => tick((n) => n + 1), 60_000); // keep "5 minutes ago" fresh
    return () => clearInterval(id);
  }, [load]);

  // New card: existing cards Flip into their new places, the new one flies in from the form.
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state || !list.current) return;
    flipState.current = null;
    const fresh = list.current.querySelector<HTMLElement>("[data-fresh]");
    const reduce = window.matchMedia(MQ.reduce).matches;
    if (reduce) return;
    Flip.from(state, { duration: 0.9, ease: "reveal", targets: list.current.querySelectorAll(".blessing:not([data-fresh])") });
    if (fresh && flyFrom.current) {
      const to = fresh.getBoundingClientRect();
      const from = flyFrom.current;
      gsap.fromTo(
        fresh,
        { x: from.left - to.left, y: from.top - to.top, scale: Math.min(1.1, from.width / to.width), autoAlpha: 0.3, transformOrigin: "0 0" },
        { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: 1.2, ease: "reveal", clearProps: "transform" },
      );
    }
  }, [entries]);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        gsap.from(q(".guestbook__head > *, .guestbook__form .field, .guestbook__form .chips, .guestbook__form .guestbook__submit"), {
          autoAlpha: 0,
          y: 18,
          stagger: 0.08,
          duration: 1.2,
          scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // Stagger in whatever arrives from the server.
  useGSAP(
    () => {
      if (status !== "ready" || window.matchMedia(MQ.reduce).matches) return;
      const cards = Array.from(list.current?.querySelectorAll<HTMLElement>(".blessing") ?? []).filter((c) => !shown.current.has(c.dataset.flipId!));
      if (!cards.length) return;
      cards.forEach((c) => shown.current.add(c.dataset.flipId!));
      gsap.from(cards, {
        autoAlpha: 0,
        y: 24,
        stagger: 0.07,
        duration: 1,
        ease: "drift",
        scrollTrigger: { trigger: list.current, start: "top 85%", once: true },
      });
    },
    { dependencies: [entries.length, status], scope: root },
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setError(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const body = { name: name.trim(), message: message.trim(), relation, website: String(fd.get("website") ?? "") };
    if (!body.name) return setError("Please add your name.");
    if (body.message.length < 2) return setError("Please write a message.");

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: Entry = { id: tempId, name: body.name, message: body.message, relation, created_at: new Date().toISOString(), pending: true };

    shown.current.add(tempId);
    flyFrom.current = form.current?.querySelector("textarea")?.getBoundingClientRect() ?? null;
    if (list.current) flipState.current = Flip.getState(list.current.querySelectorAll(".blessing"));
    setEntries((prev) => [optimistic, ...prev]);
    setStatus("ready");

    try {
      const res = await fetch("/api/guestbook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn’t save your blessing.");
      setEntries((prev) => prev.map((x) => (x.id === tempId ? { ...(data.entry ?? optimistic), pending: false, key: tempId } : x)));
      setName("");
      setMessage("");
      setRelation(null);
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      setEntries((prev) => prev.filter((x) => x.id !== tempId));
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
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

      <div className="guestbook__grid">
        <form ref={form} className="guestbook__form" onSubmit={submit} noValidate>
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
                  onChange={() => setRelation(r.value as Entry["relation"])}
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
            <p className="guestbook__status" role="status" aria-live="polite">
              {error ? <span className="is-error">{error}</span> : sent ? "Thank you — it means the world to us." : ""}
            </p>
          </div>
        </form>

        <div className="guestbook__wall">
          {status === "loading" && <p className="guestbook__note">Gathering blessings…</p>}
          {status === "error" && entries.length === 0 && (
            <p className="guestbook__note">
              The blessings couldn’t load right now.{" "}
              <button type="button" className="link" onClick={() => void load()}>
                Try again
              </button>
            </p>
          )}
          {status === "ready" && entries.length === 0 && <p className="guestbook__note guestbook__empty">{gb.empty}</p>}
          <ol ref={list} className="guestbook__list" aria-label="Blessings from our guests">
            {entries.map((e) => (
              <li key={e.key ?? e.id} className="blessing" data-flip-id={e.key ?? e.id} data-fresh={e.pending ? "" : undefined} aria-busy={e.pending || undefined}>
                <p className="blessing__msg">{e.message}</p>
                <p className="blessing__meta">
                  <span className="blessing__name">{e.name}</span>
                  {relLabel(e.relation) && <span className="blessing__rel">{relLabel(e.relation)}</span>}
                  <time dateTime={e.created_at}>{e.pending ? "sending…" : ago(e.created_at)}</time>
                </p>
              </li>
            ))}
          </ol>
          {next && (
            <button type="button" className="btn guestbook__more" onClick={() => void load(next)}>
              Load more
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
