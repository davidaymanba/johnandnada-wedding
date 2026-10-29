import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdminKey, listEntries, type Entry } from "@/lib/guestbook";
import { site } from "@/content/site";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blessings", robots: { index: false, follow: false } };

const relLabel = (r: Entry["relation"]) => site.guestbook.relations.find((x) => x.value === r)?.label;

/** Private page for the couple: /blessings?key=GUESTBOOK_ADMIN_KEY */
export default async function Blessings({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!isAdminKey(key)) notFound();

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
              <DeleteButton adminKey={key!} id={e.id} name={e.name} />
            </p>
          </li>
        ))}
      </ol>
    </main>
  );
}
