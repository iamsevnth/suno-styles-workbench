const { chromium } = require("playwright");
const fs = require("node:fs/promises");
const path = require("node:path");

const target = "http://127.0.0.1:4173/guide.html";
const out = path.resolve("docs/screenshots/live-guide-v4");
const captured = [];

async function setTheme(page, mode) {
  await page.evaluate(theme => { document.documentElement.setAttribute("data-theme", theme); }, mode);
  await page.waitForTimeout(400);
}
async function load(page, query = "") {
  for (let i = 1; i <= 4; i++) {
    const url = target + query + (query.includes("?") ? "&" : "?") + "shot=" + Date.now();
    try {
      const response = await page.goto(url, {waitUntil: "networkidle", timeout: 45000});
      if (!response || !response.ok()) throw new Error("HTTP " + (response ? response.status() : "no response"));
      await page.getByRole("heading", {name: "The complete Suno Workbench Guide"}).waitFor({timeout: 15000});
      await page.evaluate(() => document.fonts.ready);
      return;
    } catch (e) {
      console.warn("Load attempt " + i + ":", e.message);
      if (i === 4) throw e;
      await page.waitForTimeout(3500);
    }
  }
}
async function shot(page, name, mode, fullPage = true) {
  await setTheme(page, mode);
  await page.screenshot({path:path.join(out,name), fullPage, animations:"disabled", caret:"hide"});
  captured.push({name,mode,fullPage,viewport:page.viewportSize()});
  console.log("Captured " + name);
}

(async () => {
  await fs.mkdir(out, {recursive:true});
  const browser = await chromium.launch({headless:true,args:["--no-sandbox"]});
  try {
    const desktop = await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,colorScheme:"light"});
    await load(desktop);
    await shot(desktop,"guide-v4-desktop-light.png","light");
    await shot(desktop,"guide-v4-desktop-dark.png","dark");

    await setTheme(desktop,"light");
    await desktop.getByRole("searchbox",{name:"Search every chapter, recipe and appendix"}).fill("Phrygian");
    await desktop.locator(".guide-search-results").waitFor({timeout:10000});
    await shot(desktop,"guide-v4-search.png","light",false);

    await load(desktop,"?chapter=ch04");
    await desktop.locator(".guide-live-chart").waitFor({timeout:10000});
    await shot(desktop,"guide-v4-genre-coverage.png","light",false);

    const mobile = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,colorScheme:"light"});
    await load(mobile);
    await shot(mobile,"guide-v4-mobile-light.png","light");
    await shot(mobile,"guide-v4-mobile-dark.png","dark");

    await fs.writeFile(path.join(out,"capture.json"),JSON.stringify({
      capturedAt:new Date().toISOString(),target,publicSite:"https://sunoworkbench.com/guide",pagesRunId:40297339376,mergeCommit:"6545634f72f1078d62dcdb1c1eb19b0d3e1a4f8e",captured
    },null,2)+"\n");
    await fs.writeFile(path.join(out,"README.md"),[
      "# Deployed Guide v4 screenshots",
      "",
      "Chromium captures of the exact GitHub Pages deployment artifact for PR #25, corresponding to https://sunoworkbench.com/guide.",
      "",
      "- guide-v4-desktop-light.png: desktop light theme, full page",
      "- guide-v4-desktop-dark.png: desktop dark theme, full page",
      "- guide-v4-mobile-light.png: mobile light theme, full page",
      "- guide-v4-mobile-dark.png: mobile dark theme, full page",
      "- guide-v4-search.png: full-text search for Phrygian",
      "- guide-v4-genre-coverage.png: live genre coverage chart",
      "",
      "These evidence images are stored in a separate branch, not in the application's main branch.",
      ""
    ].join("\n"));
  } finally {
    await browser.close();
  }
})().catch(e=>{ console.error(e); process.exitCode=1; });
