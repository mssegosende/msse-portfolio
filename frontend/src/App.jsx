import { useEffect, useState } from "react";
import "@/App.css";
import { useLenis, pinScrollToTopOnReload } from "@/hooks/useLenis";
import { pendingThemeReload } from "@/lib/themeReload";
import { useTitleTicker } from "@/hooks/useTitleTicker";
import { ScrollScene } from "@/components/ScrollScene";
import { NavigationDock } from "@/components/NavigationDock";
import { Marquee } from "@/components/Marquee";
import { About } from "@/components/About";
import { Projects } from "@/components/Projects";
import { Capabilities } from "@/components/Capabilities";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { RotateLock } from "@/components/RotateLock";

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
      <main>
        <ScrollScene onJourneyEnd={() => setJourneyDone(true)} />
        <Marquee />
        <About />
        <Projects />
        <Capabilities />
        <Contact />
      </main>
      <Footer />
      <RotateLock />
    </div>
  );
}

export default App;
