// Serves dist/ the way GitHub Pages does: "/compiler" → compiler.html, unknown paths → 404.html.
// Used only by the browser tests (e2e/playwright.config.ts). Run `npm run build` first.
//
// Request paths never become filesystem paths: dist/ is indexed once at startup and requests are
// looked up in that allowlist, so traversal ("/../", encoded or not) cannot reach other files.
import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT ?? 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

/** Maps every URL path GitHub Pages would answer to the dist/ file it serves. */
function indexDist(dir) {
  const routes = new Map();
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const file = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(file);
        continue;
      }
      const urlPath = '/' + relative(dir, file).split(sep).join('/');
      routes.set(urlPath, file);
      if (urlPath.endsWith('.html')) routes.set(urlPath.slice(0, -'.html'.length), file);
      if (urlPath.endsWith('/index.html')) routes.set(urlPath.slice(0, -'index.html'.length), file);
    }
  };
  walk(dir);
  return routes;
}

let routes;
try {
  routes = indexDist(root);
} catch {
  routes = new Map();
}
const notFound = routes.get('/404.html');
if (!routes.has('/') || !notFound) {
  console.error(`serve-dist: ${root} has no built site; run npm run build first.`);
  process.exit(1);
}

createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  const file = routes.get(pathname);
  const target = file ?? notFound;
  response.writeHead(file ? 200 : 404, {
    'content-type': TYPES[extname(target)] ?? 'application/octet-stream',
  });
  response.end(readFileSync(target));
}).listen(port, '127.0.0.1', () => {
  console.log(`serve-dist: http://127.0.0.1:${port}/ → ${root} (${routes.size} routes)`);
});
