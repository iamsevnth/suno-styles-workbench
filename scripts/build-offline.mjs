// Inlines the Vite build's script and stylesheet into dist/suno-workbench.html,
// so the whole site runs from one file opened straight from disk.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const indexPath = path.join(dist, 'index.html');
const outPath = path.join(dist, 'suno-workbench.html');

// One pass over the original HTML: the inlined bundle itself contains tag-like strings
// (React's warnings mention <link rel="stylesheet" href="%s">), so it must never be rescanned.
const ASSET_TAG =
  /<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>|<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>|<link\b[^>]*\brel="(?:modulepreload|canonical)"[^>]*>/g;

function readAsset(url) {
  const file = path.join(dist, url.replace(/^\.?\//, ''));
  if (!fs.existsSync(file)) throw new Error(`Asset not found: ${url} (looked for ${file})`);
  return fs.readFileSync(file, 'utf8');
}

let scripts = 0;
let styles = 0;

const html = fs.readFileSync(indexPath, 'utf8').replace(ASSET_TAG, (_tag, scriptSrc, styleHref) => {
  if (scriptSrc) {
    scripts++;
    // Inline module scripts run from file:// (external ones are blocked by CORS there).
    return `<script type="module">${readAsset(scriptSrc).replace(/<\/script/gi, '<\\/script')}</script>`;
  }
  if (styleHref) {
    styles++;
    return `<style>${readAsset(styleHref).replace(/<\/style/gi, '<\\/style')}</style>`;
  }
  return ''; // modulepreload hints and the canonical URL mean nothing in a local file.
});

if (scripts === 0 || styles === 0) {
  throw new Error(`Expected at least one script and one stylesheet in ${indexPath}; found ${scripts} and ${styles}.`);
}

fs.writeFileSync(outPath, html, 'utf8');
console.log(`Wrote ${path.relative(process.cwd(), outPath)} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB, ${scripts} script, ${styles} stylesheet inlined)`);
