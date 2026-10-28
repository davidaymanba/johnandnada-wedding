import { fullNames, site } from "@/content/site";

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export const calendarText = {
  title: `${fullNames.bride} & ${fullNames.groom} — Wedding`,
  details: `With hearts full of gratitude to God, we joyfully invite you to celebrate our wedding.\n${site.url}`,
};

export function googleCalendarUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: calendarText.title,
    dates: `${stamp(site.event.start)}/${stamp(site.event.end)}`,
    details: calendarText.details,
    location: site.event.venue,
    ctz: "Africa/Cairo",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function icsFile() {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nada Nassef & John Michel//Wedding//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:nada-john-wedding-20261111@invitation",
    `DTSTAMP:${stamp("2026-10-28T12:00:00Z")}`,
    `DTSTART:${stamp(site.event.start)}`,
    `DTEND:${stamp(site.event.end)}`,
    `SUMMARY:${esc(calendarText.title)}`,
    `DESCRIPTION:${esc(calendarText.details)}`,
    `LOCATION:${esc(site.event.venue)}`,
    `URL:${site.url}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`${fullNames.bride} & ${fullNames.groom}’s wedding is tomorrow`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
