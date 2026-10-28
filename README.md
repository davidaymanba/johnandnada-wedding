# John Michel & Nada Nassef — Wedding Invitation

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · GSAP 3.15 (ScrollTrigger, SplitText, DrawSVG, Flip, CustomEase) · Lenis · Supabase.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Useful URLs while testing:

| URL | What it does |
|---|---|
| `/?skip` | Skips the door intro |
| `/#details` (any hash) | Deep link — skips the intro |
| `/?skip&now=2026-11-11T20:00:00+02:00` | Mocks the clock (countdown: before / on the day / after) |

The door intro plays once per browser session (`sessionStorage`). Open a new tab to see it again.

## Editing content

Everything lives in **`content/site.ts`**: names, date and time, venue, the **Google Maps link**, story steps, photos (with `pos` = CSS `object-position` so faces stay in frame), gallery, guestbook copy, closing, music, and the `verses` array (each verse has `placement`, `text` (KJV) and `ref` — move or delete freely). Full names live in `site.names` (`brideSurname`, `groomSurname`).

- **Maps link:** `site.event.mapsUrl` is currently a search for "The First Evangelical Church". Replace it with the exact link.
- **Intro music:** the film's own soundtrack (`public/media/intro-audio.m4a`, made by `npm run media`). Phones only allow sound after a tap, so the intro shows an **"Open the invitation"** button once the monogram has drawn; the tap starts the film and its music together.
- **The hymn ("The Blessing"):** `public/media/the-blessing.m4a` starts automatically the moment the guest knocks and the church door opens (the knock is the tap that allows sound), fades in, and loops. A floating button (bottom right) pauses/plays it. To change it, replace the file or set `site.music`; `null` = no music.
- **Photos:** every rectangular photo uses the same 3:4 frame. Portraits fill it; landscape photos are shown whole (nobody cropped out) over a soft blur of themselves. On phones photos run one per row, full width. The photos behind the opening verse and the closing are `site.versePhoto` and `site.closing.photo`.
- **Order of names:** the groom is always first (John Michel & Nada Nassef); in the invitation the groom's portrait is on the left and the bride's on the right.
- **Photos:** originals are in `../wedding-kit/assets`. `npm run media` re-creates `assets/photos/*` and the video/door files (needs `ffmpeg`). `next/image` serves AVIF/WebP at responsive sizes with blur placeholders automatically.
- **Monogram (J & N):** `npm run monogram` rebuilds `content/monogram.ts` from the real Cormorant Garamond / Pinyon Script glyph outlines.

## Theme

The whole page is one theme: **navy (default)** or **light**. Guests switch with the sun/moon button (top right, after the door opens); the choice is remembered on their device. The intro film and the photo lightbox always stay dark. Colours are CSS variables in `app/globals.css` (`:root[data-theme="dark"]` / `[data-theme="light"]`).

## Guestbook (Supabase)

1. Create a Supabase project → SQL editor → run `supabase/migration.sql`.
2. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GUESTBOOK_SALT`, `GUESTBOOK_ADMIN_KEY`.

**Blessings are private.** Guests only see the form and a thank-you; nothing they write is shown on the site. John & Nada read every message at **`/blessings?key=YOUR_GUESTBOOK_ADMIN_KEY`** (that page and the read API return 404 without the key), or in the Supabase table editor.
3. Inserts go through `app/api/guestbook/route.ts`: Zod validation (name ≤ 40, message ≤ 500), HTML stripped, honeypot, rate limit 3 per 10 minutes per hashed IP. The service key never reaches the browser; RLS allows public reads of approved rows only.

**Hide a message:** `update public.guestbook set approved = false where id = '…';`

Without the Supabase variables the guestbook falls back to an in-memory store. That is fine for local development, but **on Vercel messages would vanish**, so set the variables before sharing the link.

## Deploy to Vercel

1. Push this folder to GitHub (or run `npx vercel` inside it).
2. In Vercel → Project → Settings → Environment Variables, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GUESTBOOK_SALT`, `GUESTBOOK_ADMIN_KEY`, and `NEXT_PUBLIC_SITE_URL` (the final URL — used for the WhatsApp preview, share link and calendar file).
3. Deploy. The framework preset is detected automatically.

## QA scripts

With the site running (`npm run dev` or `npm start`):

```bash
node scripts/qa.mjs http://localhost:3000      # full walkthrough at 390×844 and 1440×900 → docs/qa/
node scripts/check-states.mjs                  # reduced motion + countdown states (expects port 3210; edit the URL)
```
