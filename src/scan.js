import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

/**
 * Load a URL in a headless browser and run axe-core against it.
 *
 * Everything runs locally: Playwright drives a bundled Chromium and axe-core
 * is injected into the page. No external service, no API key, no runtime cost.
 *
 * @param {string} url            Page to scan (http(s):// or file://).
 * @param {object} [opts]
 * @param {number} [opts.timeout] Navigation timeout in ms (default 30000).
 * @param {string[]} [opts.tags]  axe tag filter, e.g. ['wcag2a','wcag2aa','wcag21aa'].
 * @returns {Promise<object>} Raw axe results, with `url`/`timestamp` ensured.
 */
export async function scan(url, { timeout = 30000, tags } = {}) {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load', timeout });

    let builder = new AxeBuilder({ page });
    if (tags && tags.length) builder = builder.withTags(tags);

    const results = await builder.analyze();
    results.url = results.url || url;
    results.timestamp = results.timestamp || new Date().toISOString();
    return results;
  } finally {
    await browser.close();
  }
}
