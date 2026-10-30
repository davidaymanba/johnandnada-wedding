"use client";

import { useActionState } from "react";
import { unlock } from "./actions";

export function Unlock() {
  const [error, action, pending] = useActionState(unlock, null);
  return (
    <form action={action} className="unlock">
      <label className="field">
        <span className="field__label">Password</span>
        <input type="password" name="password" autoComplete="current-password" required autoFocus />
        <i className="field__line" aria-hidden="true" />
      </label>
      <p className="unlock__error" role="alert">
        {error}
      </p>
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Opening…" : "Open"}
      </button>
    </form>
  );
}
