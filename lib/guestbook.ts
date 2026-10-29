import "server-only";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type Entry = {
  id: string;
  name: string;
  message: string;
  relation: "bride" | "groom" | "family" | null;
  created_at: string;
};

type Row = Entry & { approved: boolean; ip_hash: string | null };

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const usingSupabase = Boolean(URL_ && KEY);

const PAGE = 12;
const FIELDS = "id,name,message,relation,created_at";

/** True only for the couple's private key (constant-time compare). */
export function isAdminKey(key: string | null | undefined) {
  const secret = process.env.GUESTBOOK_ADMIN_KEY;
  if (!secret || !key) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${process.env.GUESTBOOK_SALT ?? "nada-john"}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

// ── Local store: a JSON file on the server's disk (GUESTBOOK_FILE), or memory in dev ──
const FILE = process.env.GUESTBOOK_FILE;
const g = globalThis as unknown as { __guestbook?: Row[] };
const memory = (g.__guestbook ??= load());

function load(): Row[] {
  if (!FILE) return [];
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as Row[];
  } catch {
    return [];
  }
}

/** One Node process owns the file, so a sync write-then-rename never interleaves or tears. */
function save() {
  if (!FILE) return;
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(`${FILE}.tmp`, JSON.stringify(memory, null, 2));
  renameSync(`${FILE}.tmp`, FILE);
}

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: KEY!,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res;
}

export async function listEntries(before?: string): Promise<{ entries: Entry[]; next: string | null }> {
  if (!usingSupabase) {
    const rows = memory
      .filter((r) => r.approved && (!before || r.created_at < before))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    const page = rows.slice(0, PAGE).map(({ approved: _a, ip_hash: _i, ...e }) => e);
    return { entries: page, next: rows.length > PAGE ? page[page.length - 1].created_at : null };
  }
  const q = new URLSearchParams({ select: FIELDS, approved: "eq.true", order: "created_at.desc", limit: String(PAGE + 1) });
  if (before) q.set("created_at", `lt.${before}`);
  const rows = (await (await rest(`guestbook?${q}`)).json()) as Entry[];
  const page = rows.slice(0, PAGE);
  return { entries: page, next: rows.length > PAGE ? page[page.length - 1].created_at : null };
}

/** How many messages this visitor posted in the last `minutes`. */
export async function recentCount(ipHash: string, minutes: number) {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  if (!usingSupabase) return memory.filter((r) => r.ip_hash === ipHash && r.created_at > since).length;
  const q = new URLSearchParams({ select: "id", ip_hash: `eq.${ipHash}`, created_at: `gt.${since}` });
  const res = await rest(`guestbook?${q}`, { method: "HEAD", headers: { Prefer: "count=exact" } });
  return Number(res.headers.get("content-range")?.split("/")[1] ?? 0);
}

export async function addEntry(input: Pick<Entry, "name" | "message" | "relation">, ipHash: string): Promise<Entry> {
  if (!usingSupabase) {
    const row: Row = { ...input, id: randomUUID(), created_at: new Date().toISOString(), approved: true, ip_hash: ipHash };
    memory.push(row);
    save();
    const { approved: _a, ip_hash: _i, ...e } = row;
    return e;
  }
  const res = await rest(`guestbook?select=${FIELDS}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...input, ip_hash: ipHash }),
  });
  const [row] = (await res.json()) as Entry[];
  return row;
}
