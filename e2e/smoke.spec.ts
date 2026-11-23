import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { ROUTE_META, ROUTE_PATHS, type RouteId } from '../src/routes';

/** Records console errors, page errors and every request that is not same-origin. */
function watch(page: Page, origin: (url: URL) => boolean) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') return;
    if (!origin(url)) problems.push(`foreign request: ${request.url()}`);
  });
  return problems;
}

const ROUTES = Object.keys(ROUTE_PATHS) as RouteId[];

test.describe('Every page', () => {
  for (const route of ROUTES) {
    test(`${ROUTE_PATHS[route]} loads cleanly, stays same-origin and passes axe`, async ({
      page,
      baseURL,
    }) => {
      const host = new URL(baseURL ?? '').host;
      const problems = watch(page, (url) => url.host === host);
      await page.goto(ROUTE_PATHS[route]);
      await expect(page).toHaveTitle(ROUTE_META[route].title);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`),
        'axe WCAG A/AA violations',
      ).toEqual([]);
      expect(problems).toEqual([]);
    });
  }
});

test('Styles Compiler generates three 800–975 character prompts that keep the brief’s BPM', async ({
  page,
}) => {
  await page.goto(ROUTE_PATHS.styles);
  await page
    .getByLabel('Your Creative Brief')
    .fill(
      'Warm neo-soul ballad at 78 BPM with Rhodes piano, upright bass, brushed drums and a breathy female lead vocal',
    );
  await page.getByRole('button', { name: 'Generate Styles' }).click();
  const headings = page.getByRole('heading', { name: /Seed #: \d+ \| BPM: \d+/ });
  await expect(headings).toHaveCount(3);
  for (const text of await headings.allTextContents()) {
    expect(text).toContain('BPM: 78');
    const total = Number(/Total Characters: (\d+)/.exec(text)?.[1]);
    expect(total).toBeGreaterThanOrEqual(800);
    expect(total).toBeLessThanOrEqual(975);
  }
});

test('Lyrics Studio arranges supplied lyrics without adding words and verifies the source', async ({
  page,
}) => {
  const source = [
    '[Verse]',
    'Morning light across the harbor wall',
    'I count the boats and wait for you to call',
    'Salt is drying on the window frame',
    'Every tide comes back but not the same',
    '',
    '[Chorus]',
    'Hold the line, hold the line tonight',
    'Keep the lantern burning bright',
    'Hold the line, hold the line tonight',
    'Till the harbor fills with light',
  ].join('\n');
  await page.goto(ROUTE_PATHS.lyrics);
  await page.getByLabel('Entire Original Draft').fill(source);
  await page.getByRole('button', { name: 'Suggest Structure' }).click();
  await page.getByRole('button', { name: 'Arrange Supplied Lyrics' }).click();
  await expect(page.getByRole('heading', { name: 'Source Integrity: Verified' })).toBeVisible();
  const output = await page.getByLabel('Verified source-preserving lyrics').inputValue();
  const words = (text: string) =>
    new Set(
      text
        .replace(/\[[^\]]*\]/g, ' ')
        .toLowerCase()
        .match(/[a-z']+/g) ?? [],
    );
  const sourceWords = words(source);
  const added = [...words(output)].filter((word) => !sourceWords.has(word));
  expect(output.trim().length).toBeGreaterThan(0);
  expect(added, 'words in the arrangement that are not in the source').toEqual([]);
});

test('The offline file runs from disk with no network requests', async ({ page }) => {
  const file = pathToFileURL(resolve(process.cwd(), 'dist/suno-workbench.html')).href;
  const problems = watch(page, (url) => url.protocol === 'file:');
  await page.goto(file);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(problems).toEqual([]);
});
