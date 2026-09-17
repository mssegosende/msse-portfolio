const puppeteer = require("puppeteer-core");

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
  await page.setViewport({ width: 1000, height: 1200 });
  await page.goto("http://localhost:3000/robot-capture.html", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 45000));
  await page.screenshot({ path: "/app/frontend/public/robot-full.png" });
  await browser.close();
  console.log("CAPTURE DONE");
})().catch((e) => {
  console.error("CAPTURE FAILED:", e.message);
  process.exit(1);
});
