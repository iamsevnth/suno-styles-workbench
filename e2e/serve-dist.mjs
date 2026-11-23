// Serves dist/ the way GitHub Pages does: "/compiler" → compiler.html, unknown paths → 404.html.
// Used only by the browser tests (e2e/playwright.config.ts). Run `npm run build` first.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');
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

if (!existsSync(join(root, 'index.html'))) {
  console.error(`serve-dist: ${root}/index.html is missing; run npm run build first.`);
  process.exit(1);
}

function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const candidates = clean.endsWith('/')
    ? [join(clean, 'index.html')]
    : [clean, `${clean}.html`, join(clean, 'index.html')];
  for (const candidate of candidates) {
    const file = join(root, candidate);
    if (file.startsWith(root) && existsSync(file) && statSync(file).isFile()) return file;
  }
  return null;
}

createServer((request, response) => {
  const file = resolveFile(request.url ?? '/');
  const target = file ?? join(root, '404.html');
  response.writeHead(file ? 200 : 404, {
    'content-type': TYPES[extname(target)] ?? 'application/octet-stream',
  });
  createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`serve-dist: http://127.0.0.1:${port}/ → ${root}`);
});
