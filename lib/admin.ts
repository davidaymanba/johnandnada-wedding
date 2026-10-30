import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// The couple's private page (/blessings) is behind a password (GUESTBOOK_ADMIN_PASSWORD).
// Signing in sets a signed, http-only cookie; GUESTBOOK_ADMIN_KEY is the signing secret.

const COOKIE = "nj_blessings";
const DAYS = 30;

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

const sign = (exp: string) => createHmac("sha256", process.env.GUESTBOOK_ADMIN_KEY ?? "").update(`blessings:${exp}`).digest("base64url");

export function passwordMatches(input: string) {
  const pw = process.env.GUESTBOOK_ADMIN_PASSWORD;
  return Boolean(pw && process.env.GUESTBOOK_ADMIN_KEY && same(input, pw));
}

/** True when this browser has signed in (and the session hasn't expired). */
export async function isSignedIn() {
  if (!process.env.GUESTBOOK_ADMIN_KEY) return false;
  const [exp, sig] = ((await cookies()).get(COOKIE)?.value ?? "").split(".");
  return Boolean(exp && sig && Number(exp) > Date.now() && same(sig, sign(exp)));
}

export async function signIn() {
  const exp = String(Date.now() + DAYS * 864e5);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // "strict" would drop it when the page is opened from a WhatsApp link
    path: "/",
    maxAge: DAYS * 86400,
  });
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

// Wrong passwords: 5 tries per 15 minutes per visitor, so it can't be guessed by brute force.
const tries = new Map<string, { n: number; until: number }>();
export function tooManyTries(who: string) {
  const t = tries.get(who);
  return Boolean(t && t.until > Date.now() && t.n >= 5);
}
export function recordMiss(who: string) {
  const t = tries.get(who);
  const fresh = !t || t.until < Date.now();
  tries.set(who, { n: fresh ? 1 : t.n + 1, until: fresh ? Date.now() + 15 * 60_000 : t.until });
}
