import Image from "next/image";
import type { Photo } from "@/content/site";

type Props = {
  photo: Photo;
  sizes: string;
  className?: string;
  /** Draw a hairline arch around the frame */
  outline?: boolean;
};

export const ARCH_D = "M0,1 V0.34 C0,0.16 0.22,0.05 0.5,0 C0.78,0.05 1,0.16 1,0.34 V1 Z";

/** A photo in a gothic-arch frame — the shape of the church door, repeated through the site. */
export function ArchPhoto({ photo, sizes, className = "", outline = true }: Props) {
  return (
    <div className={`arch ${className}`}>
      {outline && (
        <svg className="arch__outline" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
          <path d={ARCH_D} vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      <div className="arch__clip">
        <div className="arch__reveal">
          <Image
            src={photo.src}
            alt={photo.alt}
            sizes={sizes}
            quality={85}
            placeholder="blur"
            className="arch__img"
            style={{ objectPosition: photo.pos }}
          />
        </div>
      </div>
    </div>
  );
}

/** The SVG clipPath every .arch__clip references (rendered once in the page). */
export function ArchDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="arch-clip" clipPathUnits="objectBoundingBox">
          <path d={ARCH_D} />
        </clipPath>
      </defs>
    </svg>
  );
}
