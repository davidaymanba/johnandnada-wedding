# Design notes

## Direction
**"Through the door."** The guest knocks on the real church door, walks through it into candle-light, and the gothic arch of that door becomes the site's signature shape: the monogram frame, both portraits, the save-the-date card, and the wedding-day photo.

The page is one continuous theme: all navy (default) or all light, chosen by the guest with a toggle. All copy is English.

## Kept from the Neno & Tota reference
- Palette, exact hex: midnight `#1C2230`, champagne gold `#C8A96A`, deep gold `#A8873F`, ivory `#F0EEE9`, soft white `#FFFDF8`, mocha `#6B5A4E`, ink `#24212A`, blush sand `#E8D9CC`. Derived: `#141925` (deeper midnight, closing) and `#7A5E27` (gold dark enough for small text on ivory, 5.2:1).
- Type families: Cormorant Garamond (display + body), Pinyon Script (the "&", "With love"), Jost (labels).
- Section set: monogram, verse, portraits, details, story, countdown, gallery, closing + credit.

## What v2 does differently
1. The J & N monogram (groom first) is built from real glyph outlines inside a gothic arch with a small cross, so it can draw itself (preloader and closing bookend).
2. The intro is one master timeline: the film hands off pixel-identically to the door still (same frame 221), real door leaves cut from that frame swing inward in 3D, light floods out, and the camera pushes through.
3. "Open the invitation" starts the film together with its own soundtrack (a tap is what unlocks sound on phones). One knock (Web Audio knock + distant bell + air swell), with haptic feedback.
4. A strict type scale with fluid `clamp()` sizes; lining numerals for dates and digits.
5. A consistent easing language: three custom curves (`reveal`, `door`, `drift`) used everywhere.
6. Text reveals rise from masks (SplitText lines/words/chars) instead of generic fade-ups.
7. Photos reveal with clip-path wipes plus inner parallax; faces are protected with per-photo `object-position`.
8. The story is a real timeline: a waving gold path draws with the scroll, and nodes light up as it reaches them.
9. Scripture interludes (KJV) are quiet breaths between chapters, not cards.
10. Desktop: a pinned horizontal chapter for "every day" and "preparations"; phones: an editorial column that keeps scrolling down (no sideways swiping), each photo opening as it arrives.
11. The wedding day opens like the door did (the arch photo wipes open from the centre), then flows into the countdown.
12. The countdown digits are rolling columns (never re-rendered); a journey line shows progress from the engagement to the altar; announcements are once a minute.
13. Guestbook: underline-draw fields, an optimistic card that flies from the form into the wall (Flip), rate limiting, and proper empty and error states.
14. Gallery: an editorial 12-column grid, a staggered clip-path reveal, and a lightbox that grows from the thumbnail (Flip) with swipe, keyboard, and focus trap.
15. Accessibility: AA contrast on every text pair in both themes, real buttons (the door included), reduced-motion fallbacks.

## Reduced motion
No Lenis, no parallax, no pinning, no SplitText; the video is skipped, the door is a 0.6s cross-fade, and the countdown updates without rolling.
