import { useEffect, useState } from "react";
import "@/App.css";
import { useLenis, pinScrollToTopOnReload } from "@/hooks/useLenis";
import { pendingThemeReload } from "@/lib/themeReload";
import { useTitleTicker } from "@/hooks/useTitleTicker";
import { ScrollScene } from "@/components/ScrollScene";
import { NavigationDock } from "@/components/NavigationDock";
import { About } from "@/components/About";
import { Projects } from "@/components/Projects";
import { Contact } from "@/components/Contact";
import { RotateLock } from "@/components/RotateLock";
import { SectionIndex } from "@/components/SectionIndex";
import { Signature } from "@/components/Signature";

function App() {
  useLenis();
  useTitleTicker();
  useEffect(pinScrollToTopOnReload, []);
  // The dock appears once the hero sequence has been seen and then stays. A
  // theme reload on phones (lib/themeReload) comes back with it shown.
  const [journeyDone, setJourneyDone] = useState(!!pendingThemeReload);

  return (
    <div className="App bg-surface font-inter text-ink antialiased">
      <NavigationDock visible={journeyDone} />
      <SectionIndex />
      <Signature />
      {/* Design order: Ø1 hero and Ø2 capabilities (both inside the pinned hero),
          Ø3 projects, Ø4 about, Ø5 contact. */}
      <main>
        <ScrollScene onJourneyEnd={() => setJourneyDone(true)} />
        <Projects />
        <About />
        <Contact />
      </main>
      <RotateLock />
    </div>
  );
}

export default App;
