// Checks the built pages' Content Security Policy: the hosted page loads only same-origin files,
// and every inline script and stylesheet in the offline file matches a hash its policy allows.
// Run after `npm run build`: node scripts/check-csp.mjs [dist]
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { fileInBuildDir, resolveBuildDir } from './build-dir.mjs';

const { dir: dist } = resolveBuildDir(process.argv[2]);
const CSP_META = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/i;
const failures = [];

function policyOf(file) {
  const html = fs.readFileSync(fileInBuildDir(dist, file), 'utf8');
  const match = html.match(CSP_META);
  if (!match) {
    failures.push(`${file}: no Content-Security-Policy meta tag`);
    return { html, directives: new Map() };
  }
  const directives = new Map(
    match[1]
      .replace(/&#39;|&#x27;/gi, "'")
      .split(';')
      .map((d) => d.trim().split(/\s+/))
      .filter((parts) => parts[0])
      .map(([name, ...values]) => [name, values])
  );
  // The policy must come before anything it governs.
  const firstGoverned = Math.min(
    ...[...blocksOf(html)].map((b) => b.start),
    ...['<link rel="stylesheet"'].map((t) => html.toLowerCase().indexOf(t)).filter((i) => i >= 0),
    Infinity
  );
  if (html.search(CSP_META) > firstGoverned) {
    failures.push(`${file}: the policy appears after a script or stylesheet`);
  }
  return { html, directives };
}

/**
 * Script and style elements in document order, found by scanning tags rather than with a regular
 * expression. A script's contents are skipped as a whole, so markup-like text inside the inlined
 * bundle (React mentions "<style>" in strings) is never mistaken for an element.
 */
function* blocksOf(html) {
  const lower = html.toLowerCase();
  let i = 0;
  for (;;) {
    const next = ['script', 'style']
      .map((tag) => ({ tag, start: findOpenTag(lower, tag, i) }))
      .filter((c) => c.start >= 0)
      .sort((a, b) => a.start - b.start)[0];
    if (!next) return;
    const openEnd = lower.indexOf('>', next.start);
    const close = lower.indexOf(`</${next.tag}`, openEnd);
    const closeEnd = close < 0 ? -1 : lower.indexOf('>', close);
    if (openEnd < 0 || closeEnd < 0) return;
    yield {
      tag: next.tag,
      start: next.start,
      openTag: html.slice(next.start, openEnd + 1),
      body: html.slice(openEnd + 1, close),
    };
    i = closeEnd + 1;
  }
}

function findOpenTag(lower, tag, from) {
  for (let at = lower.indexOf(`<${tag}`, from); at >= 0; at = lower.indexOf(`<${tag}`, at + 1)) {
    const after = lower[at + tag.length + 1];
    if (after === '>' || after === '/' || /\s/.test(after ?? '')) return at;
  }
  return -1;
}

const hosted = policyOf('index.html');
for (const [name, expected] of [
  ['default-src', "'none'"],
  ['script-src', "'self'"],
  ['style-src', "'self'"],
  ['object-src', "'none'"],
  ['base-uri', "'none'"],
]) {
  const values = hosted.directives.get(name) ?? [];
  if (values.join(' ') !== expected) failures.push(`index.html: ${name} is "${values.join(' ')}", expected "${expected}"`);
}
if ([...blocksOf(hosted.html)].some((b) => b.tag === 'script' && !/\bsrc=/i.test(b.openTag))) {
  failures.push('index.html: has an inline script');
}

// Every page file written by build-routes.mjs carries the same policy as index.html.
for (const file of fs.readdirSync(dist).filter((f) => f.endsWith('.html') && f !== 'index.html' && f !== 'suno-workbench.html')) {
  const page = policyOf(file);
  for (const name of ['default-src', 'script-src', 'style-src']) {
    if ((page.directives.get(name) ?? []).join(' ') !== (hosted.directives.get(name) ?? []).join(' ')) {
      failures.push(`${file}: ${name} differs from index.html`);
    }
  }
}

const offline = policyOf('suno-workbench.html');
const sha256 = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
for (const [tag, directive] of [
  ['script', 'script-src'],
  ['style', 'style-src'],
]) {
  const allowed = new Set(offline.directives.get(directive) ?? []);
  const blocks = [...blocksOf(offline.html)].filter((b) => b.tag === tag);
  if (!blocks.length) failures.push(`suno-workbench.html: no inline ${tag}`);
  for (const { body } of blocks) {
    if (!allowed.has(sha256(body))) failures.push(`suno-workbench.html: an inline ${tag} is not allowed by ${directive}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Content Security Policy checks passed for index.html and suno-workbench.html.');
