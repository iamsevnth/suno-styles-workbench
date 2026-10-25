// Inlines the Vite build's script and stylesheet into dist/suno-workbench.html,
// so the whole site runs from one file opened straight from disk.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.argv[2] ?? 'dist');
const distRealPath = fs.realpathSync(dist);
const indexPath = path.join(dist, 'index.html');
const outPath = path.join(dist, 'suno-workbench.html');

// One pass over the original HTML: the inlined bundle itself contains tag-like strings
// (React's warnings mention <link rel="stylesheet" href="%s">), so it must never be rescanned.
const ASSET_TAG =
  /<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>|<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>|<link\b[^>]*\brel="(?:modulepreload|canonical)"[^>]*>/g;

function readAsset(url) {
  const file = path.resolve(distRealPath, url.replace(/^\.?\//, ''));
  const relativePath = path.relative(distRealPath, file);
  if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    throw new Error(`Asset path is outside the build directory: ${url}`);
  }
  if (!fs.existsSync(file)) throw new Error(`Asset not found: ${url} (looked for ${file})`);
  const realPath = fs.realpathSync(file);
  const realRelativePath = path.relative(distRealPath, realPath);
  if (realRelativePath === '..' || realRelativePath.startsWith(`..${path.sep}`) || path.isAbsolute(realRelativePath)) {
    throw new Error(`Asset path is outside the build directory: ${url}`);
  }
  return fs.readFileSync(realPath, 'utf8');
}

let scripts = 0;
let styles = 0;
const scriptHashes = [];
const styleHashes = [];

const sha256 = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

const html = fs.readFileSync(indexPath, 'utf8').replace(ASSET_TAG, (_tag, scriptSrc, styleHref) => {
  if (scriptSrc) {
    scripts++;
    // Inline module scripts run from file:// (external ones are blocked by CORS there).
    const code = readAsset(scriptSrc).replace(/<\/script/gi, '<\\/script');
    scriptHashes.push(sha256(code));
    return `<script type="module">${code}</script>`;
  }
  if (styleHref) {
    styles++;
    const css = readAsset(styleHref).replace(/<\/style/gi, '<\\/style');
    styleHashes.push(sha256(css));
    return `<style>${css}</style>`;
  }
  return ''; // modulepreload hints and the canonical URL mean nothing in a local file.
});

if (scripts === 0 || styles === 0) {
  throw new Error(`Expected at least one script and one stylesheet in ${indexPath}; found ${scripts} and ${styles}.`);
}

// The hosted page allows only same-origin files ('self'); this file's code is inline and opened
// from disk, so script-src and style-src name the exact inlined code by hash instead.
const CSP_META = /(<meta\s+http-equiv="Content-Security-Policy"\s+content=")([^"]*)(")/i;
const withCsp = html.replace(CSP_META, (_m, open, policy, close) => {
  const directives = policy
    .replace(/&#39;|&#x27;/gi, "'")
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const name = d.split(/\s+/)[0];
      if (name === 'script-src') return `script-src ${scriptHashes.join(' ')}`;
      if (name === 'style-src') return `style-src ${styleHashes.join(' ')}`;
      // 'self' means nothing for a file:// page; the inline code is all it needs.
      return d.replace(/\s'self'/g, '').replace(/^(\S+)$/, "$1 'none'");
    });
  return `${open}${directives.join('; ')}${close}`;
});

fs.writeFileSync(outPath, withCsp, 'utf8');
console.log(`Wrote ${path.relative(process.cwd(), outPath)} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB, ${scripts} script, ${styles} stylesheet inlined)`);
