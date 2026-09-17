const puppeteer = require("puppeteer-core");

const [url, out, w, h] = process.argv.slice(2);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--enable-unsafe-swiftshader",
      "--hide-scrollbars",
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: Number(w) || 1000, height: Number(h) || 1200 });
  await page.setContent(
    `<!doctype html><html><head><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}#c{position:fixed;inset:0;width:100%;height:100%}</style>
    <script type="module">import { Application } from "https://esm.sh/@splinetool/runtime@1.10.59";new Application(document.querySelector("#c")).load("${url}");</script></head><body><canvas id="c"></canvas></body></html>`,
    { waitUntil: "domcontentloaded", timeout: 60000 }
  );
  await new Promise((r) => setTimeout(r, 45000));
  await page.screenshot({ path: out });
  await browser.close();
  console.log("CAPTURE DONE", out);
})().catch((e) => {
  console.error("CAPTURE FAILED:", e.message);
  process.exit(1);
});
