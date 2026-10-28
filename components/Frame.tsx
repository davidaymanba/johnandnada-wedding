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
      {/* A tiny copy of the same photo, blurred, fills the space around a landscape shot. */}
      {!fills && <Image src={photo.src} alt="" aria-hidden="true" sizes="96px" className="frame__fill" />}
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
