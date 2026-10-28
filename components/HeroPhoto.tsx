import Image from "next/image";
import type { Photo } from "@/content/site";

/**
 * A photo that sits behind text. Phones: full width, uncropped (faces always whole), fading into the
 * page under the words. Desktop: a tall side panel that melts into the page.
 */
export function HeroPhoto({ photo, side = "right" }: { photo: Photo; side?: "left" | "right" | "center" }) {
  return (
    <div className={`hero-photo hero-photo--${side}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        sizes="(min-width: 900px) 46vw, 100vw"
        quality={85}
        placeholder="blur"
        loading="eager"
        fetchPriority="low"
        className="hero-photo__img"
        style={{ objectPosition: photo.pos }}
      />
      <span className="hero-photo__veil" aria-hidden="true" />
    </div>
  );
}
