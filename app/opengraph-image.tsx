import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { monogram as m } from "@/content/monogram";
import { fullNames, site } from "@/content/site";

export const alt = "Nada Nassef & John Michel — Wedding Invitation · Wednesday, November 11, 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  const dir = path.join(process.cwd(), "assets");
  const [photo, serif, italic, script] = await Promise.all([
    readFile(path.join(dir, "photos/engagement.jpg")),
    readFile(path.join(dir, "fonts/cormorant-garamond-latin-300-normal.woff")),
    readFile(path.join(dir, "fonts/cormorant-garamond-latin-400-italic.woff")),
    readFile(path.join(dir, "fonts/pinyon-script-latin-400-normal.woff")),
  ]);
  const src = `data:image/jpeg;base64,${photo.toString("base64")}`;
  const gold = "#C8A96A";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1C2230", color: "#F0EEE9" }}>
        <div style={{ width: 470, height: 630, display: "flex", position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" width={470} height={630} style={{ objectFit: "cover", objectPosition: "50% 22%", width: 470, height: 630 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(28,34,48,0) 55%, #1C2230 100%)" }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 56px" }}>
          <svg width="70" height="91" viewBox={m.viewBox}>
            <path d={m.outer} fill="none" stroke={gold} strokeWidth="2" />
            <path d={m.inner} fill="none" stroke={gold} strokeWidth="1" />
            <path d={m.cross} fill="none" stroke={gold} strokeWidth="2" />
            <path d={m.N} fill="#F0EEE9" />
            <path d={m.J} fill="#F0EEE9" />
            <path d={m.amp} fill={gold} />
          </svg>
          <div style={{ marginTop: 16, fontSize: 18, letterSpacing: 7, color: gold, fontFamily: "Serif", textTransform: "uppercase" }}>You are invited</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 10, fontFamily: "Serif", fontSize: 76, lineHeight: 1 }}>
            <span>{fullNames.bride}</span>
            <span style={{ fontFamily: "Script", color: gold, fontSize: 96, lineHeight: 1, margin: "-10px 0 -14px" }}>&amp;</span>
            <span>{fullNames.groom}</span>
          </div>
          <div style={{ width: 220, height: 1, background: gold, opacity: 0.7, margin: "20px 0 18px" }} />
          <div style={{ fontFamily: "Italic", fontSize: 34 }}>Wednesday, November 11, 2026 · 7:00 PM</div>
          <div style={{ fontFamily: "Italic", fontSize: 28, opacity: 0.75, marginTop: 6 }}>{site.event.venue}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Serif", data: serif, weight: 300, style: "normal" },
        { name: "Italic", data: italic, weight: 400, style: "italic" },
        { name: "Script", data: script, weight: 400, style: "normal" },
      ],
    },
  );
}
