// Prepares every image the site ships. Source of truth = the original files next to wedding-kit/.
// Run once: npm run media   (needs ffmpeg on PATH)
import fs from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kit = path.resolve(root, "../wedding-kit/assets");
const photosOut = path.join(root, "assets/photos");
const mediaOut = path.join(root, "public/media");
fs.mkdirSync(photosOut, { recursive: true });

// slug ← source file (story placement follows the Arabic filenames in the project root)
const photos = {
  nada: "photos/bride-portrait.jpg",
  john: "photos/john-portrait.jpg",
  proposal: "photos/john-friends-car.jpg", // «يوم ١٨: ١٠ : ٢٠٢٥ چون جه اتقدم»
  engagement: "photos/proposal-2025-10-18.jpg", // «يوم الخطوبة 7 -11 - 2025»
  "the-day": "photos/couple-church-night.jpg", // «… نكون واحد نمجد الله سوا …»
  field: "photos/couple-field.jpg",
  river: "photos/couple-river-sunset.jpg",
  "card-selfie": "photos/couple-card-selfie.jpg",
  "cafe-gift": "photos/couple-cafe-gift.jpg",
  "prep-selfie": "photos/prep-home-selfie.jpg",
  "prep-friends": "photos/prep-home-with-friend.jpg",
  fountain: "photos/couple-fountain.jpg",
  "night-selfie": "photos/couple-night-selfie.jpg",
  "white-shirt": "photos/couple-night-white-shirt.jpg",
  "office-lunch": "photos/couple-office-lunch.jpg",
  "wood-wall": "photos/couple-wood-wall.jpg",
  "friends-four": "photos/friends-four.jpg",
  "friends-dinner": "photos/friends-restaurant.jpg",
};

for (const [slug, src] of Object.entries(photos)) {
  await sharp(path.join(kit, src))
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(photosOut, `${slug}.jpg`));
}

// Intro video: frames 0–221 only (the source fades to black after ~9.45s). H.264, 1080p (desktop) + 720p (phones).
const video = path.join(kit, "video/intro.mp4");
const ff = (...args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const h264 = ["-c:v", "libx264", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart"];
for (const [h, rate] of [[1080, "3800k"], [720, "2000k"]]) {
  const w = (h * 16) / 9;
  ff("-i", video, "-frames:v", "222", "-an", "-vf", `scale=${w}:${h}`, ...h264, "-b:v", rate, path.join(mediaOut, `intro-${h}.mp4`));
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nj-media-"));
ff("-i", video, "-vf", "select=eq(n\\,221)", "-frames:v", "1", path.join(tmp, "door-src.png"));

// Door still = the exact last frame of the encoded intro video (frame 221 ≈ 9.2s), so the hand-off is pixel-identical.
const door = path.join(tmp, "door-src.png");
for (const w of [1920, 1280]) {
  const img = sharp(door).resize(w, Math.round((w * 9) / 16));
  await img.clone().avif({ quality: 60 }).toFile(path.join(mediaOut, `door-${w}.avif`));
  await img.clone().webp({ quality: 82 }).toFile(path.join(mediaOut, `door-${w}.webp`));
  await img.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(mediaOut, `door-${w}.jpg`));
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log("media ready");
