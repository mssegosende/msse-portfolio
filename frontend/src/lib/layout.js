// Cuando la pagina usa el layout de celular. Ademas del ancho, un celular
// ACOSTADO (tactil, horizontal, poco alto) sigue en el layout de celular: el
// sitio esta trabado en vertical (RotateLock lo tapa en horizontal), y si al
// girarlo pasara al layout de escritorio montaria las 4 escenas de escritorio,
// que es la carga que tiraba el iPhone.
export const MOBILE_LAYOUT_QUERY =
  "(max-width: 767px), (hover: none) and (pointer: coarse) and (orientation: landscape) and (max-height: 500px)";
