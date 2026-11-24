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

test('Brief Check flags a conflicting brief, and variants name what changed', async ({ page }) => {
  await page.goto(ROUTE_PATHS.styles);
  const check = page.getByLabel('Brief Check');
  await page.getByLabel('Your Creative Brief').fill('uk garage 2-step with four on the floor kicks, dark');
  await expect(check.locator('[data-lint="TWO_PRIMARY_KICK_SYSTEMS"]')).toBeVisible();
  await page.getByLabel('Your Creative Brief').fill('melodic dubstep, 150 BPM, female vocals, detuned pluck hook, emotional');
  await expect(check).toContainText('No conflicts found');
  await page.getByRole('button', { name: 'Generate Styles' }).click();
  await expect(page.getByRole('heading', { name: /Seed #: \d+ \| BPM: \d+/ })).toHaveCount(3);
  await expect(page.getByTestId('changed-axes')).toHaveCount(2);
  for (const t of await page.getByTestId('changed-axes').allTextContents()) expect(t).toMatch(/Differs from the first in: /);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
});

test('On-device AI rewording is hidden without the API, and shows only checked wording', async ({ page }) => {
  // Browsers without the Prompt API (Safari, Firefox, older Chrome) never see the option.
  await page.addInitScript(() => { delete (window as unknown as { LanguageModel?: unknown }).LanguageModel; });
  await page.goto(ROUTE_PATHS.styles);
  await expect(page.getByLabel(/On-device AI/)).toHaveCount(0);

  // Stand-in for Chrome's Prompt API: first a valid reordering, then wording that breaks the rules.
  await page.addInitScript(() => {
    let calls = 0;
    (window as unknown as { LanguageModel: unknown }).LanguageModel = {
      availability: async () => 'available',
      create: async () => ({
        prompt: async (text: string) => {
          calls++;
          return calls === 1 ? text.split(/(?<=\.)\s+/).reverse().join(' ') : 'No drums, avoid bass.';
        },
        destroy() {},
      }),
    };
  });
  await page.reload();
  const toggle = page.getByLabel(/On-device AI/);
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  await page.getByLabel('Your Creative Brief').fill('Dark melodic dubstep at 150 BPM, female lead vocal, cinematic strings');
  await page.getByRole('button', { name: 'Generate Styles' }).click();
  const first = page.getByTestId('ai-reword').first();
  await first.getByRole('button', { name: 'Reword on This Device' }).click();
  await expect(first.getByTestId('ai-accepted')).toContainText('Passed the Workbench checks');
  await first.getByRole('button', { name: 'Try Again' }).click();
  await expect(first.getByTestId('ai-rejected')).toContainText('Discarded');
  await expect(first.getByTestId('ai-accepted')).toHaveCount(0);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
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
