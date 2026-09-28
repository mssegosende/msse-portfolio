import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";
import { ThemeProvider } from "@/hooks/useTheme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const render = () => {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  );
};

// TEMPORAL: lectura de memoria para el telefono (ver src/dev/memProbe.js y
// HANDOFF). Solo con ?debug=1, en cualquier build; sin el parametro ni se
// descarga. Tiene que engancharse ANTES del primer render -- las escenas piden
// sus contextos al montar --, asi que con el parametro el render espera al
// import. Si el chunk no carga, la pagina arranca igual.
if (new URLSearchParams(window.location.search).get("debug") === "1") {
  import(/* webpackChunkName: "mem-probe" */ "./dev/memProbe").catch(() => {}).then(render);
} else {
  render();
}
