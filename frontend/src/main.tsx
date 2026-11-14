import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SoundLab } from "@/components/SoundLab";
import { bootDone, bootSkip } from "@/lib/boot";
import { followBrowserScheme } from "@/lib/favicon";

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root");

// The loading screen: the app's code is in. ?view=sounds has no scene 1 to
// wait for: straight in.
const soundLab = new URLSearchParams(window.location.search).get("view") === "sounds";
bootDone("app");
if (soundLab) bootSkip();

// The tab icon: navy on a light browser, white on a dark one.
followBrowserScheme();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider>
      {/* ?view=sounds: the HUD sounds, one button each (not linked). */}
      {soundLab ? <SoundLab /> : <App />}
    </ThemeProvider>
  </React.StrictMode>,
);
