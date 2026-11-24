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

const mockLanguageModel = (availability: string) => {
  // Stand-in for Chrome's Prompt API: first a valid reordering, then wording that breaks the rules.
  (window as unknown as { __aiCalls: number }).__aiCalls = 0;
  (window as unknown as { LanguageModel: unknown }).LanguageModel = {
    availability: async () => availability,
    create: async () => ({
      prompt: async (text: string) => {
        const w = window as unknown as { __aiCalls: number };
        w.__aiCalls++;
        return w.__aiCalls === 1 ? text.split(/(?<=\.)\s+/).reverse().join(' ') : 'No drums, avoid bass.';
      },
      destroy() {},
    }),
  };
};

test('AI Assist is always visible and says when AI is not available', async ({ page }) => {
  await page.addInitScript(() => { delete (window as unknown as { LanguageModel?: unknown }).LanguageModel; });
  await page.goto(ROUTE_PATHS.styles);
  const panel = page.getByTestId('ai-assist');
  await expect(panel).toBeVisible();
  await expect(page.getByTestId('ai-status')).toHaveText('Not Available');
  await expect(page.getByRole('switch', { name: 'Use on-device AI' })).toBeDisabled();
  await expect(panel).toContainText("This browser doesn't offer on-device AI");
  await page.getByLabel('Your Creative Brief').fill('Dark melodic dubstep at 150 BPM, female lead vocal');
  await page.getByRole('button', { name: 'Generate Styles' }).click();
  await expect(page.getByTestId('results-ai-status')).toHaveText('No AI Used');
  await expect(page.getByTestId('engine-badge')).toHaveCount(3);
  await expect(page.getByTestId('ai-reword')).toHaveCount(0);
});

test('AI turns on only after the user agrees, and AI wording is labeled and checked', async ({ page }) => {
  await page.addInitScript(mockLanguageModel, 'available');
  await page.goto(ROUTE_PATHS.styles);
  const sw = page.getByRole('switch', { name: 'Use on-device AI' });
  await expect(page.getByTestId('ai-status')).toHaveText('AI Off');
  await sw.click();
  const dialog = page.getByRole('dialog', { name: 'Turn On On-Device AI?' });
  await expect(dialog).toBeVisible();
  let results = await new AxeBuilder({ page }).include('[role=dialog]').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
  await dialog.getByRole('button', { name: 'Keep AI Off' }).click();
  await expect(page.getByTestId('ai-status')).toHaveText('AI Off');
  await expect(sw).toHaveAttribute('aria-checked', 'false');

  await sw.click();
  await page.getByRole('button', { name: 'Turn On AI' }).click();
  await expect(page.getByTestId('ai-status')).toHaveText('AI On');
  await page.getByLabel('Your Creative Brief').fill('Dark melodic dubstep at 150 BPM, female lead vocal, cinematic strings');
  await page.getByRole('button', { name: 'Generate Styles' }).click();
  await expect(page.getByTestId('results-ai-status')).toContainText('AI On');
  expect(await page.evaluate(() => (window as unknown as { __aiCalls: number }).__aiCalls)).toBe(0);
  const first = page.getByTestId('ai-reword').first();
  await first.getByRole('button', { name: 'Reword with AI' }).click();
  await expect(first.getByTestId('ai-accepted')).toContainText('AI wording · passed the Workbench checks');
  await first.getByRole('button', { name: 'Reword with AI Again' }).click();
  await expect(first.getByTestId('ai-rejected')).toContainText('discarded');
  results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);

  // Turning AI off removes every AI control at once.
  await page.getByRole('switch', { name: 'Use on-device AI' }).click();
  await expect(page.getByTestId('ai-reword')).toHaveCount(0);
  await expect(page.getByTestId('results-ai-status')).toHaveText('No AI Used');
});

test('AI asks again before the browser downloads its model', async ({ page }) => {
  await page.addInitScript(mockLanguageModel, 'downloadable');
  await page.goto(ROUTE_PATHS.styles);
  await page.getByRole('switch', { name: 'Use on-device AI' }).click();
  await page.getByRole('button', { name: 'Turn On AI' }).click();
  await page.getByLabel('Your Creative Brief').fill('Dark melodic dubstep at 150 BPM, female lead vocal, cinematic strings');
  await page.getByRole('button', { name: 'Generate Styles' }).click();
  const first = page.getByTestId('ai-reword').first();
  await first.getByRole('button', { name: 'Reword with AI' }).click();
  await expect(first.getByTestId('ai-download-confirm')).toBeVisible();
  await first.getByRole('button', { name: 'Cancel' }).click();
  expect(await page.evaluate(() => (window as unknown as { __aiCalls: number }).__aiCalls)).toBe(0);
  await first.getByRole('button', { name: 'Reword with AI' }).click();
  await first.getByRole('button', { name: 'Download Model and Reword' }).click();
  await expect(first.getByTestId('ai-accepted')).toBeVisible();
});

test('AI permission from v5.5/v5.6 is not carried over; the dialog keeps focus and returns it', async ({ page }) => {
  await page.addInitScript(mockLanguageModel, 'available');
  await page.addInitScript(() => { try { localStorage.setItem('suno-workbench:on-device-ai', 'on'); } catch { /* ignore */ } });
  await page.goto(ROUTE_PATHS.styles);
  await expect(page.getByTestId('ai-status')).toHaveText('AI Off');
  expect(await page.evaluate(() => localStorage.getItem('suno-workbench:on-device-ai'))).toBe(null);

  const sw = page.getByRole('switch', { name: 'Use on-device AI' });
  await sw.click();
  const dialog = page.getByRole('dialog', { name: 'Turn On On-Device AI?' });
  await expect(dialog.getByRole('button', { name: 'Keep AI Off' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Turn On AI' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Keep AI Off' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Turn On AI' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(sw).toBeFocused();
  await expect(page.getByTestId('ai-status')).toHaveText('AI Off');
});

test('After one model download, no other result asks again; AI can be turned off in Fix mode', async ({ page }) => {
  await page.addInitScript(mockLanguageModel, 'downloadable');
  await page.goto(ROUTE_PATHS.styles);
  await page.getByRole('switch', { name: 'Use on-device AI' }).click();
  await page.getByRole('button', { name: 'Turn On AI' }).click();
  await page.getByLabel('Your Creative Brief').fill('Dark melodic dubstep at 150 BPM, female lead vocal, cinematic strings');
  await page.getByRole('button', { name: 'Generate Styles' }).click();
  const cards = page.getByTestId('ai-reword');
  // Open the download question on two results, then agree on the first: the second closes.
  await cards.nth(2).getByRole('button', { name: 'Reword with AI' }).click();
  await expect(cards.nth(2).getByTestId('ai-download-confirm')).toBeVisible();
  await cards.nth(0).getByRole('button', { name: 'Reword with AI' }).click();
  await cards.nth(0).getByRole('button', { name: 'Download Model and Reword' }).click();
  await expect(cards.nth(2).getByTestId('ai-download-confirm')).toHaveCount(0);
  await expect(cards.nth(0).getByTestId('ai-accepted')).toBeVisible();
  await cards.nth(1).getByRole('button', { name: 'Reword with AI' }).click();
  await expect(cards.nth(1).getByTestId('ai-download-confirm')).toHaveCount(0);
  await expect(cards.nth(1).getByTestId('ai-rejected')).toBeVisible();

  await page.getByRole('button', { name: 'Fix Existing Prompt' }).click();
  const sw = page.getByRole('switch', { name: 'Use on-device AI' });
  await expect(sw).toBeVisible();
  await sw.click();
  await expect(page.getByTestId('ai-status')).toHaveText('AI Off');
});

test('Instrumental toggle keeps vocal-free briefs instrumental and yields to vocal briefs', async ({ page }) => {
  await page.goto(ROUTE_PATHS.styles);
  const toggle = page.getByLabel('Instrumental');
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  await page.getByLabel('Your Creative Brief').fill('deep dubstep, dark, 140 BPM');
  await expect(page.getByTestId('instrumental-note')).toHaveCount(0);
  await page.getByRole('button', { name: 'Generate Styles' }).click();
  await expect(page.getByRole('heading', { name: /Seed #: \d+ \| BPM: \d+/ })).toHaveCount(3);
  for (const t of await page.locator('article p.whitespace-pre-wrap').allTextContents()) {
    expect(t).not.toMatch(/\b(?:vocals?|singer|singing|rap|voice)\b/i);
  }
  await page.getByLabel('Your Creative Brief').fill('deep dubstep with female vocals');
  await expect(page.getByTestId('instrumental-note')).toBeVisible();
  // The setting is kept for the session.
  await page.reload();
  await expect(page.getByLabel('Instrumental')).toBeChecked();
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

test('Prompt Length: Tight prompts are 600–850 characters and report their vocal share', async ({ page }) => {
  await page.goto(ROUTE_PATHS.styles);
  const lengths = page.getByTestId('length-choice');
  await expect(lengths.getByRole('radio', { name: /Detailed/ })).toBeChecked();
  await lengths.getByText('Tight').click();
  await expect(lengths.getByRole('radio', { name: /Tight/ })).toBeChecked();
  await page.getByLabel('Your Creative Brief').fill('melodic dubstep, emotional, female vocals with breathy verses and belted chorus peaks');
  await page.getByRole('button', { name: 'Generate Styles' }).click();
  const titles = page.getByRole('heading', { name: /Seed #: \d+ \| BPM: \d+/ });
  await expect(titles).toHaveCount(3);
  for (const text of await titles.allTextContents()) {
    const total = Number(/Total Characters: (\d+)/.exec(text)?.[1]);
    expect(total).toBeGreaterThanOrEqual(600);
    expect(total).toBeLessThanOrEqual(850);
  }
  for (const report of await page.getByTestId('length-report').allTextContents()) {
    expect(report).toMatch(/^Tight · \d+ characters · vocals (\d+)% \(cap 15%\)$/);
    expect(Number(/vocals (\d+)%/.exec(report)?.[1])).toBeLessThanOrEqual(15);
  }
});

test('140 UKG Dubstep carries the tempo in its name, with no separate BPM', async ({ page }) => {
  await page.goto(ROUTE_PATHS.styles);
  await page.getByLabel('Your Creative Brief').fill('140 UKG + Future Bass + Wobble Dubstep, emotional, nocturnal, 140 BPM');
  await page.getByRole('button', { name: 'Generate Styles' }).click();
  const texts = await page.getByTestId('prompt-text').allTextContents();
  expect(texts).toHaveLength(3);
  for (const t of texts) {
    expect(t).toMatch(/^140 UKG Dubstep with /);
    expect(t).not.toMatch(/\bBPM\b/);
    expect(t.match(/\b1[34]\d\b/g)).toHaveLength(1);
  }
});

test('Rephrase rewords a result with no AI, labeled, and Show Original restores it', async ({ page }) => {
  await page.goto(ROUTE_PATHS.styles);
  await page.getByLabel('Your Creative Brief').fill('Dark melodic dubstep at 150 BPM, female lead vocal, cinematic strings');
  await page.getByRole('button', { name: 'Generate Styles' }).click();
  const text = page.getByTestId('prompt-text').first();
  const badge = page.getByTestId('engine-badge').first();
  const original = await text.textContent();
  await expect(badge).toHaveText('Workbench engine · no AI');
  await page.getByTestId('rephrase').first().click();
  await expect(badge).toHaveText('Rephrased by the Workbench engine · no AI · passed the checks');
  await expect(text).not.toHaveText(original ?? '');
  expect((await text.textContent())?.startsWith('Melodic dubstep at 150 BPM') || (await text.textContent())?.includes('150 BPM')).toBe(true);
  await page.getByRole('button', { name: 'Show Original' }).first().click();
  await expect(text).toHaveText(original ?? '');
  await expect(badge).toHaveText('Workbench engine · no AI');
});

test('Reword with your own assistant: copy a request, paste the answer, and only a checked answer is used', async ({ page, context, browserName }) => {
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => { delete (window as unknown as { LanguageModel?: unknown }).LanguageModel; });
  await page.goto(ROUTE_PATHS.styles);
  await expect(page.getByTestId('ai-alternatives')).toContainText('Reword with your own AI assistant');
  await page.getByLabel('Your Creative Brief').fill('Dark melodic dubstep at 150 BPM, female lead vocal, cinematic strings');
  await page.getByRole('button', { name: 'Generate Styles' }).click();
  const handoff = page.getByTestId('assistant-handoff').first();
  await handoff.locator('summary').click();
  await expect(handoff).toContainText("goes to that company's service");
  // The request carries the wording on the card: after Rephrase, that is the rephrased text.
  await page.getByTestId('rephrase').first().click();
  const shown = (await page.getByTestId('prompt-text').first().textContent()) ?? '';
  await handoff.getByRole('button', { name: 'Copy Request' }).click();
  await expect(handoff.getByRole('status').first()).toContainText(/Copied|Clipboard blocked/);
  if ((await handoff.getByRole('status').first().textContent())?.includes('Copied')) {
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.endsWith(shown)).toBe(true);
  }
  await page.getByRole('button', { name: 'Show Original' }).first().click();

  const answer = handoff.getByLabel("2. Paste the assistant's answer");
  await answer.fill('No drums, avoid bass.');
  await handoff.getByRole('button', { name: 'Check Answer' }).click();
  await expect(handoff.getByTestId('assistant-rejected')).toContainText('Not used');

  const original = (await page.getByTestId('prompt-text').first().textContent()) ?? '';
  const reordered = original.split(/(?<=\.)\s+/).reverse().join(' ');
  await answer.fill(`Here is the rewritten prompt:\n${reordered}`);
  await handoff.getByRole('button', { name: 'Check Answer' }).click();
  await expect(handoff.getByTestId('assistant-accepted')).toContainText('AI wording from your assistant · passed the Workbench checks');
  await handoff.getByRole('button', { name: 'Use This Wording' }).click();
  await expect(page.getByTestId('engine-badge').first()).toHaveText('AI wording from your assistant · passed the Workbench checks');
  await expect(page.getByTestId('prompt-text').first()).toHaveText(reordered);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
});
