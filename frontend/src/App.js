import { useState } from "react";
import "@/App.css";
import { useLenis } from "@/hooks/useLenis";
import { Hero } from "@/components/Hero";
import { NavigationDock } from "@/components/NavigationDock";
import { Marquee } from "@/components/Marquee";
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
