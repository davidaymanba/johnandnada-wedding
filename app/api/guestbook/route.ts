import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { addEntry, hashIp, isAdminKey, listEntries, recentCount } from "@/lib/guestbook";

export const dynamic = "force-dynamic";

const clean = (s: string) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const Body = z.object({
  name: z.string().transform(clean).pipe(z.string().min(1, "Please add your name").max(40, "Name is too long")),
  message: z.string().transform(clean).pipe(z.string().min(2, "Please write a message").max(500, "Message is too long")),
  relation: z.enum(["bride", "groom", "family"]).nullable().optional(),
  website: z.string().optional(), // honeypot — humans never see it
});

// Blessings are private: only the couple (with GUESTBOOK_ADMIN_KEY) can read them.
export async function GET(req: NextRequest) {
  if (!isAdminKey(req.headers.get("x-admin-key") ?? req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const before = req.nextUrl.searchParams.get("before") ?? undefined;
    const data = await listEntries(before && !Number.isNaN(Date.parse(before)) ? before : undefined);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Couldn’t load the blessings right now." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 422 });
  }
  const { name, message, relation, website } = parsed.data;

  // Bots fill every field. Pretend it worked.
  if (website) return NextResponse.json({ entry: null }, { status: 201 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  const ipHash = hashIp(ip);
  try {
    if ((await recentCount(ipHash, 10)) >= 3) {
      return NextResponse.json({ error: "Thank you! You’ve sent a few blessings already — please try again in a few minutes." }, { status: 429 });
    }
    const entry = await addEntry({ name, message, relation: relation ?? null }, ipHash);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Couldn’t save your blessing. Please try again." }, { status: 500 });
  }
}
