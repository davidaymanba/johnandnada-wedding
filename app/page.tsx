import { Experience } from "@/components/Experience";
import { Intro } from "@/components/Intro";
import { VerseSection } from "@/components/VerseSection";
import { Invitation } from "@/components/Invitation";
import { Details } from "@/components/Details";
import { Story } from "@/components/Story";
import { Countdown } from "@/components/Countdown";
import { Guestbook } from "@/components/Guestbook";
import { Memories } from "@/components/Memories";
import { Closing } from "@/components/Closing";
import { ArchDefs } from "@/components/ArchPhoto";

export default function Home() {
  return (
    <Experience>
      <ArchDefs />
      <Intro />
      <main id="main">
        <VerseSection />
        <Invitation />
        <Details />
        <Story />
        <Countdown />
        <Guestbook />
        <Memories />
        <Closing />
      </main>
    </Experience>
  );
}
