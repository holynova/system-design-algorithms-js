import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const PORT = 3333;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

// 1. Start Server
const server = http.createServer((req, res) => {
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/") reqPath = "/index.html";
  const safePath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, async () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  try {
    const playwrightModule = await import("/opt/homebrew/lib/node_modules/playwright/index.js");
    const { chromium } = playwrightModule.default;

    const browser = await chromium.launch({
      headless: true,
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 920 },
      deviceScaleFactor: 2 // High-res Retina display screenshot
    });
    const page = await context.newPage();

    console.log("Navigating to page...");
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });

    console.log("Waiting for meaningful content to load...");
    // Wait for sidebar chapters
    await page.waitForSelector(".chapter-item", { state: "visible", timeout: 15000 });
    // Wait for main title
    await page.waitForSelector(".detail-title", { state: "visible", timeout: 15000 });
    // Wait for SVG diagram card
    await page.waitForSelector(".svg-diagram-card svg", { state: "visible", timeout: 15000 });
    // Wait for Mermaid diagram rendering
    await page.waitForSelector("#mermaidContainer svg", { state: "visible", timeout: 15000 });

    // Allow 2.5s for fonts, transitions, and SVG rendering to settle completely
    await page.waitForTimeout(2500);

    const outPath = path.join(ROOT_DIR, "screenshot.png");
    await page.screenshot({ path: outPath });
    console.log("Screenshot saved successfully:", outPath);

    // Also copy for portfolio
    fs.copyFileSync(outPath, path.join(ROOT_DIR, "portfolio-system-design-algorithms-js.png"));

    await browser.close();
  } catch (err) {
    console.error("Error capturing screenshot:", err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      console.log("Server closed.");
      process.exit();
    });
  }
});
