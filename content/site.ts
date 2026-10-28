// ─────────────────────────────────────────────────────────────────────────────
//  Everything you might want to edit lives in this one file:
//  copy, dates, links, photos (+ crops), scripture, and the door geometry.
// ─────────────────────────────────────────────────────────────────────────────
import type { StaticImageData } from "next/image";

import nada from "@/assets/photos/nada.jpg";
import john from "@/assets/photos/john.jpg";
import proposal from "@/assets/photos/proposal.jpg";
import engagement from "@/assets/photos/engagement.jpg";
import theDay from "@/assets/photos/the-day.jpg";
import field from "@/assets/photos/field.jpg";
import river from "@/assets/photos/river.jpg";
import cardSelfie from "@/assets/photos/card-selfie.jpg";
import cafeGift from "@/assets/photos/cafe-gift.jpg";
import prepSelfie from "@/assets/photos/prep-selfie.jpg";
import prepFriends from "@/assets/photos/prep-friends.jpg";
import fountain from "@/assets/photos/fountain.jpg";
import nightSelfie from "@/assets/photos/night-selfie.jpg";
import whiteShirt from "@/assets/photos/white-shirt.jpg";
import officeLunch from "@/assets/photos/office-lunch.jpg";
import woodWall from "@/assets/photos/wood-wall.jpg";
import friendsFour from "@/assets/photos/friends-four.jpg";
import friendsDinner from "@/assets/photos/friends-dinner.jpg";

export type Photo = {
  src: StaticImageData;
  alt: string;
  /** CSS object-position — keeps faces in frame for every crop */
  pos: string;
};

const p = (src: StaticImageData, alt: string, pos = "50% 40%"): Photo => ({ src, alt, pos });

export const site = {
  /** The groom is always named first. */
  names: {
    groom: "John",
    groomSurname: "Michel",
    bride: "Nada",
    brideSurname: "Nassef",
  },
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://johnandnada.codexai.systems",
  title: "John Michel & Nada Nassef — Wedding Invitation",
  description: "Wednesday, November 11, 2026 · 7:00 PM · The First Evangelical Church",

  event: {
    /** Cairo is UTC+2 in November */
    start: "2026-11-11T19:00:00+02:00",
    end: "2026-11-11T22:00:00+02:00",
    weekday: "Wednesday",
    dateLong: "November 11, 2026",
    time: "7:00 PM",
    venue: "The First Evangelical Church",
    // TODO(couple): replace with the church's exact Google Maps link
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=The+First+Evangelical+Church",
  },

  /** Countdown "progress" runs from the engagement to the wedding */
  journeyStart: "2025-11-07T19:00:00+02:00",

  /** The hymn that starts when the church door opens ("The Blessing"). null = no music. */
  music: "/media/the-blessing.m4a" as string | null,

  /** Photo behind the opening verse (faces sit in the top 40% of the frame). */
  versePhoto: p(whiteShirt, "John and Nada smiling together at night, holding hands", "50% 0%"),

  intro: {
    hint: "Knock to open",
    skip: "Skip",
    begin: "Open the invitation",
    sound: "Best with sound on",
  },

  invitation: {
    eyebrow: "Together with their families",
    lines: ["With hearts full of gratitude to God,", "we joyfully invite you to celebrate our wedding."],
    groom: p(john, "John in a beige blazer and white shirt, smiling", "50% 18%"),
    bride: p(nada, "Nada, smiling, standing on a balcony in a white dress and denim vest", "50% 22%"),
  },

  details: {
    eyebrow: "The celebration",
    title: "Save the date",
  },

  story: {
    eyebrow: "Our story",
    title: "Every step, ordered by the Lord",
    steps: [
      {
        id: "beginning",
        date: "May 25, 2025",
        title: "Where it all began",
        text: "The beginning of prayers, long conversations, and many questions — to the Lord and to each other.",
      },
      {
        id: "walking",
        date: null,
        title: "Choosing to keep walking",
        text: "After months of thinking and praying, and watching the Lord lead every detail, we decided to keep walking together — following Him.",
      },
      {
        id: "proposal",
        date: "October 18, 2025",
        title: "John came to propose",
        text: null,
        photo: p(proposal, "John and his friends on the way to propose, smiling in the car", "50% 45%"),
      },
      {
        id: "engagement",
        date: "November 7, 2025",
        title: "Our engagement",
        text: "A day we declared before the Lord and everyone we love that we choose to be two vessels, open to all He wants to do in us and through us, together.",
        photo: p(engagement, "Nada in a royal-blue dress holding blue roses beside John on their engagement day", "50% 20%"),
      },
      {
        id: "everyday",
        date: null,
        title: "Every day, together",
        text: "Every day we walk together, we know each other more, love each other more, and follow the Lord together more.",
        photos: [
          p(field, "Nada and John on a sunny lawn, his arm around her", "50% 25%"),
          p(river, "A sunset selfie of Nada and John by the river", "50% 45%"),
          p(cardSelfie, "Nada and John laughing in a selfie, John holding a card", "50% 40%"),
          p(cafeGift, "John holding a gift bag while Nada smiles at the camera", "50% 40%"),
        ],
      },
      {
        id: "preparations",
        date: null,
        title: "Then came the preparations",
        text: "Building a home, one wall and one prayer at a time.",
        photos: [
          p(prepSelfie, "Nada and John in a selfie inside their home being prepared", "55% 55%"),
          p(prepFriends, "John taking a selfie with friends helping prepare the new home", "50% 70%"),
        ],
      },
      {
        id: "the-day",
        date: "November 11, 2026",
        title: "And at last, the day",
        text: "By God's grace, before God and people, we vow to become one — to glorify Him together for the rest of our lives.",
        photo: p(theDay, "Nada and John standing together outside the church at night", "50% 18%"),
      },
    ],
  },

  countdown: {
    eyebrow: "Until we say “I do”",
    today: "Today is the day.",
    after: "We’re married — thank you for being part of our story.",
    progressLabel: "of the way from our engagement to the altar",
  },

  guestbook: {
    eyebrow: "Guestbook",
    title: "Leave us a blessing",
    intro: "A prayer, a wish, a memory — we will keep every word.",
    relations: [
      { value: "groom", label: "Groom’s side" },
      { value: "bride", label: "Bride’s side" },
      { value: "family", label: "Family" },
    ],
    empty: "Be the first to leave a blessing.",
  },

  memories: {
    eyebrow: "Memories",
    title: "Moments we keep",
    photos: [
      p(engagement, "Nada and John on their engagement day", "50% 20%"),
      p(fountain, "Nada and John on a bridge beside a fountain", "38% 50%"),
      p(nightSelfie, "A night-time selfie of Nada and John", "50% 40%"),
      p(whiteShirt, "Nada and John holding hands at night", "50% 22%"),
      p(friendsFour, "Nada and John with two friends", "50% 40%"),
      p(woodWall, "Nada and John in front of a wooden wall", "50% 22%"),
      p(officeLunch, "Nada and John sharing lunch at the office", "50% 45%"),
      p(friendsDinner, "Nada and John at dinner with a friend", "50% 45%"),
    ],
  },

  closing: {
    /** Photo behind the closing words. John's head is near the top edge, so it is never cropped from above. */
    photo: p(theDay, "John and Nada standing together outside the church at night", "50% 0%"),
    line: "We can’t wait to celebrate with you.",
    signoff: "With love,",
    credit: { label: "Designed by Eng. David Ayman", href: "https://wa.me/201207809980" },
  },

  /**
   * Door geometry, in source-video pixels (1920×1080), measured on frame 221 —
   * the last frame of the encoded intro and the exact door still.
   */
  door: {
    frame: { w: 1920, h: 1080 },
    x: 840,
    y: 477,
    w: 211,
    h: 390,
    seam: 947,
    /** y where the pointed arch springs from the vertical jambs */
    spring: 595,
  },
};

export type VersePlacement =
  | "opening"
  | "after-beginning"
  | "after-walking"
  | "after-engagement"
  | "before-countdown"
  | "closing";

export type Verse = {
  placement: VersePlacement;
  /** King James Version */
  text: string;
  ref: string;
};

export const verses: Verse[] = [
  {
    placement: "opening",
    text: "What man is he that feareth the LORD? him shall he teach in the way that he shall choose. His soul shall dwell at ease; and his seed shall inherit the earth.",
    ref: "Psalm 25:12–13",
  },
  {
    placement: "after-beginning",
    text: "Delight thyself also in the LORD; and he shall give thee the desires of thine heart. Commit thy way unto the LORD; trust also in him; and he shall bring it to pass.",
    ref: "Psalm 37:4–5",
  },
  {
    placement: "after-walking",
    text: "The steps of a good man are ordered by the LORD: and he delighteth in his way.",
    ref: "Psalm 37:23",
  },
  {
    placement: "after-engagement",
    text: "Wherefore the LORD God of Israel saith, I said indeed that thy house, and the house of thy father, should walk before me for ever: but now the LORD saith, Be it far from me; for them that honour me I will honour, and they that despise me shall be lightly esteemed.",
    ref: "1 Samuel 2:30",
  },
  {
    placement: "before-countdown",
    text: "…keep through thine own name those whom thou hast given me, that they may be one, as we are.",
    ref: "John 17:11",
  },
  {
    placement: "closing",
    text: "And I have declared unto them thy name, and will declare it: that the love wherewith thou hast loved me may be in them, and I in them.",
    ref: "John 17:26",
  },
];

export const verseAt = (placement: VersePlacement) => verses.find((v) => v.placement === placement);

export const fullNames = {
  groom: `${site.names.groom} ${site.names.groomSurname}`,
  bride: `${site.names.bride} ${site.names.brideSurname}`,
};
