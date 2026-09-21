import { useState } from "react";
import "@/App.css";
import { useLenis } from "@/hooks/useLenis";
import { ScrollScene } from "@/components/ScrollScene";
import { NavigationDock } from "@/components/NavigationDock";
import { Marquee } from "@/components/Marquee";
import { About } from "@/components/About";
import { Projects } from "@/components/Projects";
import { Capabilities } from "@/components/Capabilities";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

function App() {
  useLenis();
  // The dock stays out of the way until the hero sequence has been seen once.
  // It latches on, so coming back to the top does not hide it again.
  const [journeyDone, setJourneyDone] = useState(false);

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
    </div>
  );
}

export default App;
