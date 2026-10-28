# Nada & John — Wedding Invitation

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

Everything lives in **`content/site.ts`**: names, date and time, venue, the **Google Maps link**, story steps, photos (with `pos` = CSS `object-position` so faces stay in frame), gallery, guestbook copy, closing, music, and the `verses` array (each verse has `placement`, `en`, `ar`, `refEn`, `refAr` — move or delete freely).

- **Maps link:** `site.event.mapsUrl` is currently a search for "The First Evangelical Church". Replace it with the exact link.
- **Music:** put an mp3 in `public/media/` and set `site.music = "/media/your-track.mp3"`. A floating toggle appears after the door opens. `null` = no music.
- **Photos:** originals are in `../wedding-kit/assets`. `npm run media` re-creates `assets/photos/*` and the video/door files (needs `ffmpeg`). `next/image` serves AVIF/WebP at responsive sizes with blur placeholders automatically.
- **Monogram:** `npm run monogram` rebuilds `content/monogram.ts` from the real Cormorant Garamond / Pinyon Script glyph outlines.

## Guestbook (Supabase)

1. Create a Supabase project → SQL editor → run `supabase/migration.sql`.
2. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GUESTBOOK_SALT`.
3. Inserts go through `app/api/guestbook/route.ts`: Zod validation (name ≤ 40, message ≤ 500), HTML stripped, honeypot, rate limit 3 per 10 minutes per hashed IP. The service key never reaches the browser; RLS allows public reads of approved rows only.

**Hide a message:** `update public.guestbook set approved = false where id = '…';`

Without the Supabase variables the guestbook falls back to an in-memory store. That is fine for local development, but **on Vercel messages would vanish**, so set the variables before sharing the link.

## Deploy to Vercel

1. Push this folder to GitHub (or run `npx vercel` inside it).
2. In Vercel → Project → Settings → Environment Variables, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GUESTBOOK_SALT`, and `NEXT_PUBLIC_SITE_URL` (the final URL — used for the WhatsApp preview, share link and calendar file).
3. Deploy. The framework preset is detected automatically.

## QA scripts

With the site running (`npm run dev` or `npm start`):

```bash
node scripts/qa.mjs http://localhost:3000      # full walkthrough at 390×844 and 1440×900 → docs/qa/
node scripts/check-states.mjs                  # reduced motion + countdown states (expects port 3210; edit the URL)
```
