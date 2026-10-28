"use client";

// Tiny event bus so sections can wait for the door to open before their first animation.
type Listener = () => void;
const listeners = new Set<Listener>();
let done = false;

export function introIsDone() {
  return done || (typeof document !== "undefined" && document.documentElement.dataset.intro === "skip");
}

export function markIntroDone() {
  if (done) return;
  done = true;
  document.documentElement.dataset.intro = "done";
  listeners.forEach((l) => l());
  listeners.clear();
}

/** Runs cb once the intro is finished (immediately if it already is). Returns an unsubscribe. */
export function onIntroDone(cb: Listener) {
  if (introIsDone()) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}
