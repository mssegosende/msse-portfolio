import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SoundLab } from "@/components/SoundLab";

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider>
      {/* ?view=sounds: the HUD sounds, one button each (not linked). */}
      {new URLSearchParams(window.location.search).get("view") === "sounds" ? (
        <SoundLab />
      ) : (
        <App />
      )}
    </ThemeProvider>
  </React.StrictMode>,
);
