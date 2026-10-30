import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listEntries, type Entry } from "@/lib/guestbook";
import { isSignedIn } from "@/lib/admin";
import { site } from "@/content/site";
import { DeleteButton } from "./DeleteButton";
import { Unlock } from "./Unlock";
import { lock } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blessings", robots: { index: false, follow: false } };

const relLabel = (r: Entry["relation"]) => site.guestbook.relations.find((x) => x.value === r)?.label;

/** Private page for the couple, behind GUESTBOOK_ADMIN_PASSWORD (see lib/admin.ts). */
export default async function Blessings() {
  if (!process.env.GUESTBOOK_ADMIN_PASSWORD) notFound();
  if (!(await isSignedIn())) {
    return (
      <main className="section blessings">
        <header className="guestbook__head">
          <p className="eyebrow">Private · for {site.names.groom} &amp; {site.names.bride}</p>
          <h1 className="section-title">Your blessings</h1>
          <p className="guestbook__intro">Enter your password to read the messages.</p>
        </header>
        <Unlock />
      </main>
    );
  }

  const entries: Entry[] = [];
  let before: string | undefined;
  for (let page = 0; page < 50; page++) {
    const { entries: batch, next } = await listEntries(before);
    entries.push(...batch);
    if (!next) break;
    before = next;
  }
  const fmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });

  return (
    <main className="section blessings">
      <header className="guestbook__head">
        <p className="eyebrow">Private · for {site.names.groom} &amp; {site.names.bride}</p>
        <h1 className="section-title">Your blessings</h1>
        <p className="guestbook__intro">
          {entries.length} {entries.length === 1 ? "message" : "messages"} from the people who love you.
        </p>
      </header>
      <ol className="blessings__list">
        {entries.map((e) => (
          <li key={e.id} className="blessing">
            <p className="blessing__msg">{e.message}</p>
            <p className="blessing__meta">
              <span className="blessing__name">{e.name}</span>
              {relLabel(e.relation) && <span className="blessing__rel">{relLabel(e.relation)}</span>}
              <time dateTime={e.created_at}>{fmt.format(new Date(e.created_at))}</time>
              <DeleteButton id={e.id} name={e.name} />
            </p>
          </li>
        ))}
      </ol>
      <form action={lock} className="blessings__lock">
        <button type="submit" className="blessing__delete">
          Lock this page
        </button>
      </form>
    </main>
  );
}
