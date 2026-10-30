"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { deleteEntry, hashIp } from "@/lib/guestbook";
import { isSignedIn, passwordMatches, recordMiss, signIn, signOut, tooManyTries } from "@/lib/admin";

export async function unlock(_: string | null, form: FormData): Promise<string | null> {
  const h = await headers();
  const who = hashIp(h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local");
  if (tooManyTries(who)) return "Too many tries. Please wait 15 minutes and try again.";
  if (!passwordMatches(String(form.get("password") ?? ""))) {
    recordMiss(who);
    return "That password isn’t right.";
  }
  await signIn();
  refresh();
  return null;
}

export async function lock() {
  await signOut();
  refresh();
}

export async function removeBlessing(id: string) {
  if (!(await isSignedIn())) throw new Error("Not allowed");
  await deleteEntry(id);
  refresh();
}
