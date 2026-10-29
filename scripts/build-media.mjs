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

// Intro film: the portrait 4K master, cut at 20.5s — by then the camera has settled on the church
// door, which the site takes over and opens. H.264 30fps, 1080×1920 (tablets, desktop) + 720×1280 (phones).
const video = path.join(root, "John-Nada-Intro-4K-Master-v2.mp4");
const INTRO_CUT = 20.5;
const ff = (...args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const h264 = ["-c:v", "libx264", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart"];
for (const [w, crf, max] of [[1080, "23", "5000k"], [720, "24", "2600k"]]) {
  const h = (w * 16) / 9;
  const out = path.join(mediaOut, `intro-${w}x${h}.mp4`);
  ff("-i", video, "-t", String(INTRO_CUT), "-an", "-vf", `fps=30,scale=${w}:${h}:flags=lanczos`, ...h264, "-crf", crf, "-maxrate", max, "-bufsize", "8000k", out);
}
// The film's own music, whole, as a separate file: it starts on the guest's tap and rings out
// past the last video frame (with a soft fade instead of a hard cut).
ff("-i", video, "-vn", "-af", "afade=t=out:st=21.6:d=1.55", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", path.join(mediaOut, "intro-audio.m4a"));

// The hymn that starts when the door opens (streamed, so a lighter AAC is plenty).
const hymn = path.resolve(root, "../Elevation_Worship_The_Blessing_Lyrics_ft_Kari_Jobe_Cody_CarnesMP3.mp3");
if (fs.existsSync(hymn)) {
  ff("-i", hymn, "-vn", "-map_metadata", "-1", "-c:a", "aac", "-b:a", "112k", "-ac", "2", "-movflags", "+faststart", path.join(mediaOut, "the-blessing.m4a"));
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nj-media-"));
// Door still = the exact last frame of the encoded 1080 film (frame 614), so the hand-off is pixel-identical.
const door = path.join(tmp, "door-src.png");
ff("-i", path.join(mediaOut, "intro-1080x1920.mp4"), "-vf", "select=eq(n\\,614)", "-frames:v", "1", door);
const img = sharp(door);
await img.clone().avif({ quality: 60 }).toFile(path.join(mediaOut, "door-1080.avif"));
await img.clone().webp({ quality: 82 }).toFile(path.join(mediaOut, "door-1080.webp"));
await img.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(mediaOut, "door-1080.jpg"));

fs.rmSync(tmp, { recursive: true, force: true });
console.log("media ready");
