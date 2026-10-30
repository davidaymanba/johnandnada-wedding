"use client";

import { useTransition } from "react";
import { removeBlessing } from "./actions";

export function DeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="blessing__delete"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Delete the message from ${name}? This can’t be undone.`)) return;
        start(() => removeBlessing(id));
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
