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
2. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GUESTBOOK_SALT`, `GUESTBOOK_ADMIN_KEY`, `GUESTBOOK_ADMIN_PASSWORD`.

**Blessings are private.** Guests only see the form and a thank-you; nothing they write is shown on the site. John & Nada read (and can delete) every message at **`/blessings`**, which asks for the password in `GUESTBOOK_ADMIN_PASSWORD`. A correct password keeps that browser signed in for 30 days ("Lock this page" signs out); 5 wrong tries lock that visitor out for 15 minutes. Nothing else reads the messages back.
3. Inserts go through `app/api/guestbook/route.ts`: Zod validation (name ≤ 40, message ≤ 500), HTML stripped, honeypot, rate limit 3 per 10 minutes per hashed IP. The service key never reaches the browser; RLS allows public reads of approved rows only.

**Hide a message:** `update public.guestbook set approved = false where id = '…';`

Without the Supabase variables the guestbook keeps messages in a JSON file when `GUESTBOOK_FILE` is set (this is what the VPS uses), otherwise in memory (local development only; **on Vercel messages would vanish**).

## Deploy to the VPS (live)

The site runs at **https://johnandnada.codexai.systems** on the Hostinger VPS (`root@31.97.107.121`), as a Docker container behind the server's Traefik, which handles HTTPS (Let's Encrypt).

- `/docker/johnandnada/app/`: a clone of this repo (updated by `deploy/deploy.sh`)
- `/docker/johnandnada/docker-compose.yml`: copy of `deploy/docker-compose.yml`
- `/docker/johnandnada/.env`: `GUESTBOOK_SALT`, `GUESTBOOK_ADMIN_KEY` (signs the sign-in cookie), `GUESTBOOK_ADMIN_PASSWORD` (server only, never committed)
- Blessings: `/data/blessings.json` in the `johnandnada_blessings` Docker volume (survives rebuilds)

**Every push to `main` deploys automatically** (within about a minute, plus ~2 minutes to build). A cron job on the VPS runs `deploy/autodeploy.sh` every minute; when GitHub's `main` has new commits it runs `deploy/deploy.sh`, which pulls `main` into `app/`, rebuilds the image and checks the site answers. No keys or GitHub secrets are involved: the server only reads the public repo.

- Cron (installed 2026-10-29): `/etc/cron.d/johnandnada-deploy` → `* * * * * root /docker/johnandnada/app/deploy/autodeploy.sh >> /var/log/johnandnada-deploy.log 2>&1`
- Deploy log: `ssh root@31.97.107.121 tail -50 /var/log/johnandnada-deploy.log`
- Deploy right now: `ssh root@31.97.107.121 /docker/johnandnada/app/deploy/deploy.sh`

DNS: `johnandnada.codexai.systems` needs an **A record → 31.97.107.121** and no AAAA record pointing elsewhere.

## Deploy to Vercel (alternative)

1. Push this folder to GitHub (or run `npx vercel` inside it).
2. In Vercel → Project → Settings → Environment Variables, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GUESTBOOK_SALT`, `GUESTBOOK_ADMIN_KEY`, `GUESTBOOK_ADMIN_PASSWORD`, and `NEXT_PUBLIC_SITE_URL` (the final URL — used for the WhatsApp preview, share link and calendar file).
3. Deploy. The framework preset is detected automatically.

## QA scripts

With the site running (`npm run dev` or `npm start`):

```bash
node scripts/qa.mjs http://localhost:3000      # full walkthrough at 390×844 and 1440×900 → docs/qa/
node scripts/check-states.mjs                  # reduced motion + countdown states (expects port 3210; edit the URL)
```
