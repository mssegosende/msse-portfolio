import { useEffect } from "react";

const GAP = 16;

/**
 * CELULAR: las tarjetas se apoyan 16px encima del lugar del dock, medido en
 * vivo. Con unidades CSS caian debajo del dock: la seccion mide 100vh (en
 * iOS, el alto con las barras escondidas) y tiene min-h de 640px, asi que
 * con las barras de Safari o Brave visibles, o en una pantalla baja, su
 * borde inferior queda fuera de lo que se ve. El dock es fixed y siempre
 * esta en el borde visible. Mientras hay una tarjeta en pantalla la seccion
 * esta fijada con el borde de arriba en 0, asi que alcanza con su alto.
 */
export const useCalloutsAboveDock = (enabled, sectionRef, calloutRefs) => {
  useEffect(() => {
    if (!enabled) return undefined;
    let raf = 0;
    let last = null;
    const placeCallouts = () => {
      raf = 0;
      const slot = document.querySelector("[data-dock-slot]");
      const sec = sectionRef.current;
      if (!slot || !sec) return;
      const bottom = Math.max(0, Math.round(sec.offsetHeight - slot.getBoundingClientRect().top + GAP));
      if (bottom === last) return;
      last = bottom;
      calloutRefs.current.forEach((el) => {
        if (el) el.style.bottom = `${bottom}px`;
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(placeCallouts);
    };
    placeCallouts();
    // Las barras del navegador aparecen y se van con el scroll: resize en
    // unos, solo visualViewport en otros. El scroll es por las dudas; si no
    // cambio nada no escribe.
    const vv = window.visualViewport;
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    vv?.addEventListener("resize", schedule);
    const callouts = calloutRefs.current;
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      vv?.removeEventListener("resize", schedule);
      callouts.forEach((el) => {
        if (el) el.style.bottom = "";
      });
    };
  }, [enabled, sectionRef, calloutRefs]);
};
