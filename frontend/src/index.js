import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { ThemeProvider } from "@/hooks/useTheme";

const render = () => {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>,
  );
};

// Temporary memory probe for phone debugging (dev/memProbe.js), only with
// ?debug=1. It must hook in before the scenes request their GPU contexts, so
// the first render waits for it.
if (new URLSearchParams(window.location.search).get("debug") === "1") {
  import(/* webpackChunkName: "mem-probe" */ "./dev/memProbe").catch(() => {}).then(render);
} else {
  render();
}
