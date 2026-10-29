import Image from "next/image";
import type { Photo } from "@/content/site";

type Props = {
  photo: Photo;
  sizes: string;
  className?: string;
  /** Extra attributes for the <img> (e.g. data-flip-id for the lightbox). */
  imgProps?: Record<string, string>;
};

const RATIO = 3 / 4;

/**
 * Every rectangular photo on the site sits in the same 3:4 frame.
 * Portrait photos (most are 3:4 already) fill it; landscape photos are shown whole —
 * nobody gets cropped out — over a soft blur of themselves.
 */
export function Frame({ photo, sizes, className = "", imgProps }: Props) {
  const ratio = photo.src.width / photo.src.height;
  const fills = Math.abs(ratio - RATIO) < 0.1;
  return (
    <div className={`frame ${fills ? "" : "frame--whole"} ${className}`}>
      {/* The photo's own tiny blur placeholder, stretched, fills the space around a landscape shot.
          No CSS blur filter: phones would re-blur it on every repaint while scrolling. */}
      {!fills && <div className="frame__fill" aria-hidden="true" style={{ backgroundImage: `url("${photo.src.blurDataURL}")` }} />}
      <div className="frame__reveal">
        <Image
          src={photo.src}
          alt={photo.alt}
          sizes={sizes}
          quality={85}
          placeholder={fills ? "blur" : "empty"}
          style={{ objectPosition: fills ? photo.pos : "50% 50%" }}
          {...imgProps}
        />
      </div>
    </div>
  );
}
