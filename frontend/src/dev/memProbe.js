// Temporary phone memory probe (remove after the iPhone diagnosis). Loaded by
// index.js only with ?debug=1, in any build.
//
// Hooks in before the first render: context creation and loss (WebGL, WebGPU,
// 2D), context release, and Spline scene load/dispose. Canvases are tracked
// with WeakRef so the probe doesn't retain the memory it measures.
//
// Every 0.5s it saves a snapshot marked `alive`; pagehide clears the mark. A
// snapshot still `alive` on the next load means iOS killed the page, and it
// shows the state ~0.5s before the crash (last three crashes kept).
//
// Tap the panel to cycle: compact, expanded (log and crashes), minimal.
import { Application } from "@splinetool/runtime";

const KEY = "__memProbe";
const T0 = performance.now();
const sec = () => ((performance.now() - T0) / 1000).toFixed(1);

const s = {
  apps: { loading: 0, live: 0, disposed: 0, failed: 0 },
  gl: { created: 0, released: 0, lost: 0, lostBrowser: 0, restored: 0 },
  gpu: { ctx: 0, devices: 0, destroyed: 0, lost: 0 },
  types: new Set(),
  switches: 0,
  log: [],
};
const log = (msg) => {
  s.log.push(`${sec()}s ${msg}`);
  if (s.log.length > 40) s.log.shift();
};
// ScrollScene's theme swap logs its steps here (only exists with ?debug=1).
window.__memProbeLog = log;

// canvas -> info; `refs` iterates them without retaining them.
const infoOf = new WeakMap();
const refs = [];
const is3D = (t) => t === "webgl" || t === "webgl2" || t === "experimental-webgl" || t === "webgpu";

const origGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
  const known = infoOf.get(this);
  const ctx = origGetContext.call(this, type, ...rest);
  if (!ctx || known) return ctx;
  const info = { type, released: false, lost: false, device: null };
  infoOf.set(this, info);
  refs.push({ ref: new WeakRef(this), info });
  if (type === "webgpu") {
    s.gpu.ctx += 1;
    s.types.add(type);
    log(`webgpu ctx ${this.width}x${this.height}`);
  } else if (is3D(type)) {
    s.gl.created += 1;
    s.types.add(type);
    log(`${type} ctx ${this.width}x${this.height}`);
    this.addEventListener("webglcontextlost", () => {
      info.lost = true;
      s.gl.lost += 1;
      if (!info.released) s.gl.lostBrowser += 1;
      log(info.released ? "gl lost (released)" : "GL LOST BY BROWSER");
    });
    this.addEventListener("webglcontextrestored", () => {
      info.lost = false;
      s.gl.restored += 1;
      log("gl restored");
    });
  }
  return ctx;
};

// Released by the page: releaseGlContext and the runtime's
// forceContextLoss both go through this extension.
const patchedExt = new WeakSet();
[window.WebGLRenderingContext, window.WebGL2RenderingContext].forEach((C) => {
  if (!C) return;
  const orig = C.prototype.getExtension;
  C.prototype.getExtension = function (name) {
    const ext = orig.call(this, name);
    if (ext && name === "WEBGL_lose_context" && !patchedExt.has(ext)) {
      patchedExt.add(ext);
      const gl = this;
      const lose = ext.loseContext.bind(ext);
      ext.loseContext = () => {
        const info = gl.canvas && infoOf.get(gl.canvas);
        if (info && !info.released && !info.lost) {
          info.released = true;
          s.gl.released += 1;
          log("gl released");
        }
        lose();
      };
    }
    return ext;
  };
});

const destroyed = new WeakSet();
if (window.GPUAdapter && window.GPUDevice) {
  const origReq = window.GPUAdapter.prototype.requestDevice;
  window.GPUAdapter.prototype.requestDevice = async function (...a) {
    const dev = await origReq.apply(this, a);
    s.gpu.devices += 1;
    log("gpu device");
    dev.lost.then((i) => {
      if (i.reason === "destroyed") return;
      s.gpu.lost += 1;
      log(`GPU DEVICE LOST ${i.reason || ""} ${i.message || ""}`.trim());
    });
    return dev;
  };
  const origDestroy = window.GPUDevice.prototype.destroy;
  window.GPUDevice.prototype.destroy = function () {
    if (!destroyed.has(this)) {
      destroyed.add(this);
      s.gpu.destroyed += 1;
      log("gpu device destroyed");
    }
    return origDestroy.call(this);
  };
  if (window.GPUCanvasContext) {
    const origConf = window.GPUCanvasContext.prototype.configure;
    window.GPUCanvasContext.prototype.configure = function (cfg) {
      const info = this.canvas && infoOf.get(this.canvas);
      if (info && cfg?.device) info.device = new WeakRef(cfg.device);
      return origConf.call(this, cfg);
    };
  }
}

// Scenes: load starts, resolves or fails; dispose removes them in any state.
const appState = new WeakMap();
const AP = Application?.prototype;
const appsHooked = !!(AP?.load && AP?.dispose);
if (appsHooked) {
  const load = AP.load;
  const dispose = AP.dispose;
  AP.load = function (...a) {
    appState.set(this, "loading");
    s.apps.loading += 1;
    log("scene load");
    return load.apply(this, a).then(
      (r) => {
        if (appState.get(this) === "loading") {
          appState.set(this, "live");
          s.apps.loading -= 1;
          s.apps.live += 1;
          log("scene live");
        }
        return r;
      },
      (e) => {
        if (appState.get(this) === "loading") {
          appState.set(this, "failed");
          s.apps.loading -= 1;
          s.apps.failed += 1;
          log("SCENE FAILED");
        }
        throw e;
      }
    );
  };
  AP.dispose = function (...a) {
    const st = appState.get(this);
    if (st === "loading") s.apps.loading -= 1;
    if (st === "live") s.apps.live -= 1;
    if (st !== "disposed") {
      appState.set(this, "disposed");
      s.apps.disposed += 1;
      log("scene dispose");
    }
    return dispose.apply(this, a);
  };
}

let theme = document.documentElement.getAttribute("data-theme") || "light";
new MutationObserver(() => {
  const t = document.documentElement.getAttribute("data-theme") || "light";
  if (t === theme) return;
  theme = t;
  s.switches += 1;
  log(`THEME -> ${t}`);
}).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

// Reload, or crash of the previous load.
let stored = null;
try {
  stored = JSON.parse(localStorage.getItem(KEY));
} catch (e) {
  /* sin storage */
}
const nav = performance.getEntriesByType?.("navigation")?.[0]?.type || "?";
const prevDied = !!stored?.alive;
const run = {
  n: (stored?.n || 0) + 1,
  deaths: (stored?.deaths || 0) + (prevDied ? 1 : 0),
  deathLog: [
    ...(prevDied ? [{ at: stored.at, when: stored.when, lines: stored.lines, log: stored.log }] : []),
    ...(stored?.deathLog || []),
  ].slice(0, 3),
};

const snapshot = () => {
  let held = 0;
  let detached = 0;
  let mp3d = 0;
  let mp2d = 0;
  let n2d = 0;
  const sizes = [];
  for (let i = refs.length - 1; i >= 0; i--) {
    const { ref, info } = refs[i];
    const c = ref.deref();
    if (!c) {
      refs.splice(i, 1);
      continue;
    }
    const mp = (c.width * c.height) / 1e6;
    if (info.type === "2d") {
      if (c.isConnected) {
        n2d += 1;
        mp2d += mp;
      }
      continue;
    }
    const dev = info.device?.deref();
    const alive =
      info.type === "webgpu" ? !!dev && !destroyed.has(dev) : !info.released && !info.lost;
    if (!alive) continue;
    held += 1;
    if (!c.isConnected) {
      detached += 1;
      continue;
    }
    mp3d += mp;
    sizes.push(`${c.width}x${c.height}`);
  }
  const renderer = [...s.types].join("+") || "none yet";
  const a = s.apps;
  const lines = [
    `load #${run.n} (${nav})` + (prevDied ? " PREV LOAD DIED" : "") + (run.deaths ? ` deaths ${run.deaths}` : ""),
    `${renderer} | DPR ${window.devicePixelRatio} | secure ${window.isSecureContext ? "y" : "n"} gpu ${navigator.gpu ? "y" : "n"}`,
    appsHooked
      ? `scenes live ${a.live} loading ${a.loading} disposed ${a.disposed}` + (a.failed ? ` FAILED ${a.failed}` : "")
      : "scenes ? (runtime hook missing)",
    `gl ctx +${s.gl.created} rel ${s.gl.released} lost ${s.gl.lost}` +
      (s.gl.lostBrowser ? ` (BROWSER ${s.gl.lostBrowser})` : "") +
      ` | held ${held}` + (detached ? ` (${detached} detached)` : ""),
    ...(s.gpu.ctx || s.gpu.devices
      ? [`gpu ctx +${s.gpu.ctx} dev +${s.gpu.devices} destroyed ${s.gpu.destroyed}` + (s.gpu.lost ? ` LOST ${s.gpu.lost}` : "")]
      : []),
    `3D ${sizes.join(" ") || "-"} = ${mp3d.toFixed(1)} MP`,
    `2D x${n2d} = ${mp2d.toFixed(1)} MP | theme ${theme} switches ${s.switches}`,
  ];
  return lines;
};

// A tick may still run between pagehide and unload; without this it would
// mark the page `alive` again and the next load would read as a crash.
let leaving = false;
let mode = 0; // 0 compacto, 1 expandido, 2 minimo
const panel = document.createElement("div");
panel.setAttribute("data-mem-probe", "");
Object.assign(panel.style, {
  position: "fixed",
  top: "max(4px, env(safe-area-inset-top))",
  left: "4px",
  zIndex: "2147483647",
  maxWidth: "min(96vw, 420px)",
  maxHeight: "70vh",
  overflow: "auto",
  padding: "4px 6px",
  background: "rgba(0,0,0,0.8)",
  color: "#fff",
  font: "10px/1.3 ui-monospace, Menlo, monospace",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  pointerEvents: "auto",
  WebkitTextSizeAdjust: "100%",
});
panel.addEventListener("click", (e) => {
  if (e.target.dataset.clear != null) {
    try {
      localStorage.removeItem(KEY);
    } catch (err) {
      /* sin storage */
    }
    run.n = 1;
    run.deaths = 0;
    run.deathLog = [];
  } else {
    mode = (mode + 1) % 3;
  }
  render();
});

const esc = (t) => t.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch]);
const render = () => {
  const lines = snapshot();
  try {
    if (!leaving) {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          n: run.n,
          deaths: run.deaths,
          deathLog: run.deathLog,
          alive: true,
          at: sec(),
          when: new Date().toLocaleTimeString(),
          lines,
          log: s.log.slice(-15),
        })
      );
    }
  } catch (e) {
    /* sin storage */
  }
  if (mode === 2) {
    panel.textContent = `P ${lines[2].replace("scenes ", "")} | sw ${s.switches}${prevDied ? " DIED" : ""}`;
    return;
  }
  let html = esc(lines.join("\n"));
  if (mode === 1) {
    html += "\n-- log --\n" + esc(s.log.slice(-20).join("\n"));
    run.deathLog.forEach((d, i) => {
      html +=
        `\n-- DEATH ${i + 1} (${d.when || "?"}, ${d.at}s into that load) --\n` +
        esc([...(d.lines || []), ...(d.log || [])].join("\n"));
    });
    html += '\n<u data-clear="">clear stored runs</u>';
  }
  panel.innerHTML = html;
  panel.style.color = prevDied || s.gl.lostBrowser || s.gpu.lost ? "#ff8a8a" : "#fff";
};

const mount = () => {
  document.body.appendChild(panel);
  render();
  setInterval(render, 500);
};
if (document.body) mount();
else document.addEventListener("DOMContentLoaded", mount);

// pagehide means the page left on its own (reload, navigation), not a crash.
window.addEventListener("pagehide", () => {
  leaving = true;
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    localStorage.setItem(KEY, JSON.stringify({ ...v, alive: false }));
  } catch (e) {
    /* sin storage */
  }
});
window.addEventListener("pageshow", (e) => {
  leaving = false;
  if (e.persisted) render();
});
