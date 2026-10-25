// Inlines the Vite build's script and stylesheet into dist/suno-workbench.html,
// so the whole site runs from one file opened straight from disk.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileInBuildDir, resolveBuildDir } from './build-dir.mjs';

const { dir: distRealPath } = resolveBuildDir(process.argv[2]);
const dist = distRealPath;
const indexPath = fileInBuildDir(distRealPath, 'index.html');
const outPath = fileInBuildDir(distRealPath, 'suno-workbench.html');

/** Links that mean nothing in a local file: preload hints, the canonical URL and the home-screen icon. */
const DROPPED_LINKS = new Set(['modulepreload', 'canonical', 'apple-touch-icon']);

/**
 * The tags in Vite's index.html that the offline file replaces, found with a tag scanner: each
 * external <script src> (with its closing tag), each stylesheet <link>, and each dropped <link>.
 * Only the original page is scanned, never the inlined code, whose strings contain tag-like text
 * (React's warnings mention <link rel="stylesheet" href="%s">).
 */
function* assetTags(html) {
  for (let at = html.indexOf('<'); at >= 0; at = html.indexOf('<', at + 1)) {
    const close = html.indexOf('>', at);
    if (close < 0) return;
    const tag = html.slice(at, close + 1);
    const name = (tag.match(/^<([a-z]+)/i)?.[1] ?? '').toLowerCase();
    const attrs = Object.fromEntries([...tag.matchAll(/([a-z-]+)="([^"]*)"/gi)].map(([, k, v]) => [k.toLowerCase(), v]));
    if (name === 'script' && attrs.src) {
      const end = html.indexOf('</script>', close);
      if (end < 0 || html.slice(close + 1, end).trim()) throw new Error(`Unexpected script tag: ${tag}`);
      yield { start: at, end: end + '</script>'.length, kind: 'script', url: attrs.src, module: attrs.type === 'module' };
      at = end;
    } else if (name === 'link' && attrs.rel === 'stylesheet' && attrs.href) {
      yield { start: at, end: close + 1, kind: 'style', url: attrs.href };
    } else if (name === 'link' && DROPPED_LINKS.has(attrs.rel)) {
      yield { start: at, end: close + 1, kind: 'drop' };
    }
  }
}

/** Rewrites each "<" that opens one of `sequences` (any letter case) as `replacement`. */
function escapeSequences(text, sequences, replacement) {
  let out = '';
  let from = 0;
  for (let at = text.indexOf('<'); at >= 0; at = text.indexOf('<', at + 1)) {
    // Each candidate is compared on its own slice, so positions stay aligned with the original text.
    if (sequences.some((seq) => text.slice(at, at + seq.length).toLowerCase() === seq)) {
      out += text.slice(from, at) + replacement;
      from = at + 1;
    }
  }
  return out + text.slice(from);
}

function readAsset(url, encoding = 'utf8') {
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
  return fs.readFileSync(realPath, encoding);
}

let fontsInlined = 0;

/** Embeds the stylesheet's web fonts as data: URLs; the offline file has no folder to load them from. */
function inlineFonts(css, cssUrl) {
  const cssDir = path.posix.dirname(cssUrl.replace(/^\.?\//, ''));
  return css.replace(/url\((['"]?)([^'")]+\.woff2)\1\)/g, (_m, _q, fontUrl) => {
    fontsInlined++;
    const data = readAsset(path.posix.join(cssDir, fontUrl), null).toString('base64');
    return `url("data:font/woff2;base64,${data}")`;
  });
}

/**
 * Inside an HTML <script> element, "</script" ends it early and "<!--" followed by "<script" can
 * stop "</script>" from ending it at all. Each "<" that starts one of those sequences becomes \x3C,
 * the same character in JavaScript strings, templates and regular expressions, which is the only
 * place a bundle contains them (React writes "<script></script>" into innerHTML). The result is
 * then parsed, so an occurrence anywhere else fails the build instead of shipping broken code.
 */
const DANGEROUS_IN_SCRIPT = ['</script', '<script', '<!--'];

function escapeForInlineScript(code) {
  const escaped = escapeSequences(code, DANGEROUS_IN_SCRIPT, '\\x3C');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'offline-check-'));
  try {
    const file = path.join(tmp, 'bundle.mjs');
    fs.writeFileSync(file, escaped);
    const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (check.status !== 0) throw new Error(`The inlined script no longer parses after escaping:\n${check.stderr}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return escaped;
}

let scripts = 0;
let styles = 0;
const scriptHashes = [];
const styleHashes = [];

const sha256 = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

function inlined(tag) {
  if (tag.kind === 'script') {
    scripts++;
    // Inline scripts run from file:// (external module scripts are blocked by CORS there). A classic
    // script such as theme-init.js stays classic, so it still runs before the page paints.
    const code = escapeForInlineScript(readAsset(tag.url));
    scriptHashes.push(sha256(code));
    return tag.module ? `<script type="module">${code}</script>` : `<script>${code}</script>`;
  }
  if (tag.kind === 'style') {
    styles++;
    const css = escapeSequences(inlineFonts(readAsset(tag.url), tag.url), ['</style'], '\\3C');
    styleHashes.push(sha256(css));
    return `<style>${css}</style>`;
  }
  return '';
}

const source = fs.readFileSync(indexPath, 'utf8');
let html = '';
let cursor = 0;
for (const tag of assetTags(source)) {
  html += source.slice(cursor, tag.start) + inlined(tag);
  cursor = tag.end;
}
html += source.slice(cursor);

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
      if (name === 'font-src') return fontsInlined ? 'font-src data:' : "font-src 'none'";
      // 'self' means nothing for a file:// page; the inline code is all it needs.
      return d.replace(/\s'self'/g, '').replace(/^(\S+)$/, "$1 'none'");
    });
  return `${open}${directives.join('; ')}${close}`;
});

fs.writeFileSync(outPath, withCsp, 'utf8');
console.log(`Wrote ${path.relative(process.cwd(), outPath)} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB, ${scripts} script, ${styles} stylesheet inlined)`);
