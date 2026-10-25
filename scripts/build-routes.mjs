// Writes one HTML file per clean address (compiler.html is served at sunoworkbench.com/compiler by
// GitHub Pages), each with its own title, description, canonical URL and link-preview tags, plus
// 404.html, sitemap.xml and robots.txt. Run after `vite build`: node scripts/build-routes.mjs [dist]
import fs from "node:fs";
import { fileInBuildDir, resolveBuildDir } from "./build-dir.mjs";
import { PAGES, SITE_URL } from "./site-pages.mjs";

const { dir: dist } = resolveBuildDir(process.argv[2]);
const template = fs.readFileSync(fileInBuildDir(dist, "index.html"), "utf8");

const escapeAttr = (text) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

/** Replaces one tag's attribute value, failing loudly if the tag is missing from index.html. */
function setTag(html, pattern, value, label) {
  if (!pattern.test(html)) throw new Error(`index.html is missing ${label}`);
  return html.replace(pattern, (_m, open, close) => `${open}${escapeAttr(value)}${close}`);
}

function pageHtml(page, { noindex = false } = {}) {
  const url = SITE_URL + page.path;
  let html = template;
  html = setTag(html, /(<title>)[^<]*(<\/title>)/, page.title, "<title>");
  html = setTag(html, /(<meta\s+name="description"\s+content=")[^"]*(")/, page.description, "the description meta tag");
  html = setTag(html, /(<link\s+rel="canonical"\s+href=")[^"]*(")/, url, "the canonical link");
  html = setTag(html, /(<meta\s+property="og:url"\s+content=")[^"]*(")/, url, "og:url");
  html = setTag(html, /(<meta\s+property="og:title"\s+content=")[^"]*(")/, page.title, "og:title");
  html = setTag(html, /(<meta\s+property="og:description"\s+content=")[^"]*(")/, page.description, "og:description");
  if (noindex) html = html.replace("<head>", '<head>\n    <meta name="robots" content="noindex" />');
  return html;
}

for (const page of PAGES) {
  const file = page.path === "/" ? "index.html" : `${page.path.slice(1)}.html`;
  fs.writeFileSync(fileInBuildDir(dist, file), pageHtml(page));
}
// Unknown addresses load the app (it shows the home page) but are kept out of search results.
fs.writeFileSync(fileInBuildDir(dist, "404.html"), pageHtml(PAGES[0], { noindex: true }));

fs.writeFileSync(
  fileInBuildDir(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGES.map(
    (p) => `  <url><loc>${SITE_URL}${p.path}</loc></url>`,
  ).join("\n")}\n</urlset>\n`,
);
fs.writeFileSync(fileInBuildDir(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`Wrote ${PAGES.length - 1} page files, 404.html, sitemap.xml and robots.txt`);
