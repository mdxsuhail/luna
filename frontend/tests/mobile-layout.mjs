import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseURL = process.env.LUNA_BASE_URL ?? 'http://127.0.0.1:4173';
const viewports = [
  { name: 'narrow phone', width: 320, height: 568, mobile: true },
  { name: 'phone', width: 375, height: 667, mobile: true },
  { name: 'large phone', width: 390, height: 844, mobile: true },
  { name: 'tablet', width: 768, height: 1024, mobile: true },
  { name: 'desktop', width: 1280, height: 800, mobile: false },
];

const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.width <= 480,
      hasTouch: viewport.width <= 480,
    });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    const response = await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });
    assert.ok(response && response.ok(), `App failed to load at ${viewport.name}`);

    await page.locator('.app-container').waitFor({ state: 'visible' });
    const layout = await page.evaluate(() => {
      const rect = selector => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          x: box.x, y: box.y, top: box.top, bottom: box.bottom,
          width: box.width, height: box.height,
          display: style.display, position: style.position,
          visible: style.display !== 'none' && box.width > 0 && box.height > 0,
        };
      };
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        sidebar: rect('.sidebar'),
        player: rect('.persistent-player'),
        header: rect('.top-header'),
        page: rect('.page-viewport'),
      };
    });

    try {
      assert.ok(layout.documentWidth <= viewport.width + 1,
        `Horizontal overflow: document width ${layout.documentWidth}px exceeds viewport ${viewport.width}px`);
      assert.ok(layout.sidebar?.visible, 'Navigation sidebar is missing');
      if (viewport.mobile) {
        assert.equal(layout.sidebar.position, 'fixed', 'Mobile navigation should be fixed to the bottom');
        assert.ok(layout.sidebar.top > viewport.height * 0.65, 'Mobile navigation should sit at the bottom of the screen');
        if (layout.player?.visible) {
          assert.ok(layout.player.bottom <= layout.sidebar.top + 1,
            'Audio player overlaps the mobile navigation');
        }
      } else {
        assert.ok(layout.sidebar.width >= 180, 'Desktop sidebar is unexpectedly narrow');
      }
      assert.deepEqual(pageErrors, [], `JavaScript page errors: ${pageErrors.join('; ')}`);
      console.log(`PASS ${viewport.name} (${viewport.width}x${viewport.height}) ${JSON.stringify(layout)}`);
    } catch (error) {
      failures.push(`${viewport.name} (${viewport.width}x${viewport.height}): ${error.message}`);
      console.error(`FAIL ${viewport.name}: ${error.message}`);
      console.error(JSON.stringify(layout));
    }
    await page.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('\nResponsive browser checks failed:\n' + failures.map(item => '- ' + item).join('\n'));
  process.exitCode = 1;
} else {
  console.log('\nAll responsive browser checks passed.');
}
