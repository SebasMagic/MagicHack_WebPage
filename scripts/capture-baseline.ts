import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const PAGES = [
  { name: 'index', path: '/index.html' },
  { name: 'services', path: '/services.html' },
  { name: 'case-studies', path: '/case-studies-2.html' },
  { name: 'case-study', path: '/case-studies/case-study.html' },
  { name: 'contact', path: '/contact.html' },
  { name: '404', path: '/404.html' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const BASE = process.env.BASE_URL ?? 'http://localhost:8080';

async function main() {
  mkdirSync('baseline', { recursive: true });
  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();

    for (const p of PAGES) {
      await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
      // Las animaciones de scroll de Webflow necesitan que la pagina se recorra
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let y = 0;
          const step = () => {
            window.scrollTo(0, y);
            y += 400;
            if (y < document.body.scrollHeight) requestAnimationFrame(step);
            else { window.scrollTo(0, 0); resolve(); }
          };
          step();
        });
      });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: `baseline/${p.name}-${vp.name}.png`,
        fullPage: true,
      });
      console.log(`OK ${p.name}-${vp.name}`);
    }
    await ctx.close();
  }
  await browser.close();
}

main();
