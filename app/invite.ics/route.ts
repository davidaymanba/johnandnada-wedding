import { icsFile } from "@/lib/calendar";

export const dynamic = "force-static";

export function GET() {
  return new Response(icsFile(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="john-and-nada-wedding.ics"',
    },
  });
}
