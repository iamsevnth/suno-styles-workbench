// Checks the built pages' Content Security Policy: the hosted page loads only same-origin files,
// and every inline script and stylesheet in the offline file matches a hash its policy allows.
// Run after `npm run build`: node scripts/check-csp.mjs [dist]
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.argv[2] ?? 'dist');
const CSP_META = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/i;
const failures = [];

function policyOf(file) {
  const html = fs.readFileSync(path.join(dist, file), 'utf8');
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
  if (html.search(CSP_META) > html.search(/<script|<link\s+rel="stylesheet"|<style/i)) {
    failures.push(`${file}: the policy appears after a script or stylesheet`);
  }
  return { html, directives };
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
if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(hosted.html)) failures.push('index.html: has an inline script');

const offline = policyOf('suno-workbench.html');
const sha256 = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
for (const [tag, directive] of [
  ['script', 'script-src'],
  ['style', 'style-src'],
]) {
  const allowed = new Set(offline.directives.get(directive) ?? []);
  // Styles are searched outside the scripts, whose code can mention "<style>" in strings.
  const scope = tag === 'style' ? offline.html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '') : offline.html;
  const blocks = [...scope.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi'))];
  if (!blocks.length) failures.push(`suno-workbench.html: no inline ${tag}`);
  for (const [, body] of blocks) {
    if (!allowed.has(sha256(body))) failures.push(`suno-workbench.html: an inline ${tag} is not allowed by ${directive}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Content Security Policy checks passed for index.html and suno-workbench.html.');
