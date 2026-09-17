import { useState } from "react";
import "@/App.css";
import { useLenis } from "@/hooks/useLenis";
import { Hero } from "@/components/Hero";
import { SystemFeatures } from "@/components/SystemFeatures";
import { NavigationDock } from "@/components/NavigationDock";
import { Marquee } from "@/components/Marquee";
import { TechDivider } from "@/components/TechDivider";
import { About } from "@/components/About";
import { Projects } from "@/components/Projects";
import { Capabilities } from "@/components/Capabilities";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

function App() {
  useLenis();
  const [heroReady, setHeroReady] = useState(false);

  return (
    <div className="App bg-black font-inter text-white antialiased">
      <NavigationDock visible={heroReady} />
      <main>
        <Hero onReady={() => setHeroReady(true)} />
        <SystemFeatures />
        <Marquee />
        <TechDivider left="2026" right="MSG://01" />
        <About />
        <TechDivider left="Archive" right="03 // WORK" />
        <Projects />
        <TechDivider left="Specs" right="04 // SYS" />
        <Capabilities />
        <TechDivider left="Uplink" right="05 // COM" />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
