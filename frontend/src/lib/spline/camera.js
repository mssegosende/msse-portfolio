// Camara de las escenas de Spline: encuadre por zoom y paneo de la proyeccion
// (escritorio) y camaras clavadas contra la intro de cada archivo.

// NITIDEZ EN ESCRITORIO. El zoom y el paneo de cada beat ya no los hace el
// CSS: estirar el canvas 1.9-4x por CSS dejaba 0.43-0.86 pixeles renderizados
// por pixel mostrado (medido, igual en DPR 1 y 2), o sea un render ablandado.
// Ahora el wrap va SIEMPRE a VIEW_CSS_SCALE, sin traslado, y el resto lo hace
// la camara: zoom = CAM_BASE_ZOOM * S / VIEW_CSS_SCALE, y el paneo va en los
// terminos fuera de eje de la proyeccion (elementos 8 y 9), que desplazan la
// imagen en 2D igual que un translate. Es la MISMA transformacion que antes
// -- escala alrededor del centro y traslado --, asi que encuadres, anclas y
// L quedan identicos; solo cambia donde se hace. Spline recalcula la
// proyeccion al redimensionar, por eso se reaplica en cada frame.
// 1.3 y no 1: el badge "Built with Spline" se dibuja DENTRO del canvas y por
// debajo de ~1.2 entra en cuadro.
export const VIEW_CSS_SCALE = 1.3;
const CAM_BASE_ZOOM = 2;
// La escena 1 se renderiza a VIEW_CSS_SCALE para que, estirada 1.3x por el
// wrap, quede 1:1. La 2 ya tiene OVERSAMPLE (1.7): queda en 1.31:1.
export const OVERSAMPLE_1 = VIEW_CSS_SCALE;

// Render scale of chapter 2 on desktop (its buffer is 1.7x the box).
export const OVERSAMPLE = 1.7;

/** Apply a CSS-equivalent zoom (scale S about the centre) and pan (x/y in %
 *  of the frame) to a scene's camera. */
//
// Escribirlo una vez por frame (ticker de GSAP) no alcanzaba: si algo recalcula
// la proyeccion entre nuestra escritura y el render -- el resize de Spline, o
// la intro de camara del archivo mientras corre -- ese frame sale sin el
// paneo. En Safari la escena se ve antes de que termine la intro, y el robot
// aparecia unos segundos en otro encuadre (mas alto, la cabeza cortada) y
// despues saltaba. Ahora el paneo vive en la camara (__view) y
// updateProjectionMatrix lo vuelve a poner cada vez que la recalcula.
export const applyView = (app, v) => {
  const cam = app?._camera;
  if (!cam || !cam.projectionMatrix || typeof cam.updateProjectionMatrix !== "function") return;
  try {
    // NDC runs -1..1 across the canvas, y up: a pan of f of the canvas is 2f.
    cam.__view = {
      zoom: (CAM_BASE_ZOOM * v.scale) / VIEW_CSS_SCALE,
      ox: (-2 * parseFloat(v.x)) / 100 / VIEW_CSS_SCALE,
      oy: (2 * parseFloat(v.y)) / 100 / VIEW_CSS_SCALE,
    };
    if (!cam.__viewHooked) {
      const update = cam.updateProjectionMatrix;
      cam.updateProjectionMatrix = function (...args) {
        const w = this.__view;
        if (w) this.zoom = w.zoom;
        const out = update.apply(this, args);
        if (w) {
          const e = this.projectionMatrix.elements;
          e[8] = w.ox;
          e[9] = w.oy;
        }
        return out;
      };
      cam.__viewHooked = true;
    }
    cam.updateProjectionMatrix();
  } catch (err) {
    /* runtime without an inspectable camera */
  }
};

// CAMARAS (los dos anchos). Cada escena trae su propia intro de camara: un evento
// Start de Spline que la lleva desde la posicion guardada en el archivo hasta
// (0, 147, 1000) en ~2.5s. Los dos archivos arrancan de camaras distintas --
// el robot negro de (0, 249, 360), mucho mas cerca, el plateado de
// (-7.5, 262, 588) -- y el hero se revela con la intro todavia corriendo. Asi
// el mismo beat salia encuadrado distinto segun el tema (negro grande y con la
// cabeza baja, plateado chico y alto), y segun cuanto tardara en cargar; y
// HOME, que no repite la intro, aterrizaba en la camara final. El rig y la
// camara final son iguales en los dos: lo unico que divergia era esa intro.
//
// La salida es sacarle la camara a la intro: se clavan la posicion Y la
// rotacion. La intro tambien inclina la camara -- de 0.014 a 0.007 rad en su
// ultimo tramo --, y play() la REPITE: despues de home la escena, que estaba
// en pausa, vuelve a disparar el Start, la inclinacion salta a 0.014 y baja a
// 0.007 en ~2.5s, y el robot aparece ~28px mas abajo y sube hasta asentarse.
// Clavada en el valor asentado, que es el mismo en las dos escenas y en los
// dos anchos, el cuadro es identico en carga fresca, despues de home y en
// los dos temas.
//
// HERO: sobre la propia linea de la intro del robot negro, en t = .4 (de 0,
// la guardada, a 1, la final). t ~ .3 es el encuadre de referencia -- corona
// en el borde, visor a ~37%, titular bajo el menton --; .4 se aleja apenas:
// visor a ~32%, corona todavia rozando el borde. Mas atras (.5-.6) la corona
// entra entera con aire arriba; subir t es la unica perilla.
export const HERO_CAM_MOBILE = { x: 0, y: 208.2, z: 616 };
// HERO ESCRITORIO: 1.52x mas cerca que la final (z 1000 -> 660) y mas alta
// (y 146.98 -> 177.6), que es lo que baja el robot en el cuadro sin correr el
// canvas. El acercamiento sale de la camara y no del scale CSS: el canvas ya
// va estirado 1.9x, y subirlo lo ablandaria. Ver heroY / heroDx.
export const HERO_CAM_DESKTOP = { x: 0, y: 178.2, z: 660 };

// CAPITULO 2: la final de la intro, la misma en los dos archivos. Todo el
// encuadre del capitulo 2 (L, cintura, anclas) se midio con esta camara; se
// clava solo para que la intro no la barra en el crossfade.
export const CAM_FINAL = { x: 0, y: 146.98, z: 1000 };
// La rotacion asentada de la intro, leida en vivo: igual en las tres
// camaras, los dos temas y los dos anchos.
const CAM_EULER_X = 0.006996317664543058;
const CAM_QUAT = { x: 0.003498151697713782, y: 0, z: 0, w: 0.9999938814486315 };

/** Pin a scene's camera so its own Start transition cannot move or tilt it. */
export const pinCamera = (app, pos) => {
  const pin = (obj, key, value) =>
    Object.defineProperty(obj, key, { get: () => value, set: () => {}, configurable: true });
  try {
    const cam = app?._camera;
    if (!cam?.position) return;
    ["x", "y", "z"].forEach((ax) =>
      Object.defineProperty(cam.position, ax, { get: () => pos[ax], set: () => {}, configurable: true })
    );
    // The matrix is composed from the quaternion's backing fields, and the
    // Euler keeps its own copy in sync from them: pin both, so neither path
    // can bring the intro's tilt back.
    const q = cam.quaternion;
    if (q) ["x", "y", "z", "w"].forEach((k) => pin(q, "_" + k in q ? "_" + k : k, CAM_QUAT[k]));
    const r = cam.rotation;
    if (r) [["x", CAM_EULER_X], ["y", 0], ["z", 0]].forEach(([k, v]) => pin(r, "_" + k in r ? "_" + k : k, v));
  } catch (e) {
    /* runtime without an inspectable camera */
  }
};
