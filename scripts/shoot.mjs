// Visual regression screenshots: one per scene, desktop and mobile.
//
//   node scripts/shoot.mjs <baseUrl> <outDir> [--fonts-css=<file>]
//
// Scenes are opened by deep link (#scene=N) with reduced motion, so every
// animation lands on its final frame and the shots are deterministic.
// --fonts-css swaps any Google Fonts stylesheet request for a local one, so the
// original prototype renders with exactly the same font files as the new site.
import { chromium } from 'playwright';
import fs from 'node:fs';

const args = process.argv.slice(2);
const [base, out] = args.filter(a => !a.startsWith('--'));
const fontsCss = args.find(a => a.startsWith('--fonts-css='))?.split('=')[1];
if (!base || !out) {
  console.error('usage: node scripts/shoot.mjs <baseUrl> <outDir> [--fonts-css=<file>]');
  process.exit(1);
}
fs.mkdirSync(out, { recursive: true });

const SCENES = 18;
const SIZES = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 }
};

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined
});
for (const [name, viewport] of Object.entries(SIZES)) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  if (fontsCss) {
    const css = fs.readFileSync(fontsCss, 'utf8');
    await ctx.route(/fonts\.googleapis\.com/, r => r.fulfill({ contentType: 'text/css', body: css }));
  }
  await ctx.route(/fonts\.gstatic\.com/, r => r.abort());
  for (let n = 1; n <= SCENES; n++) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}#scene=${n}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);
    const file = `${out}/${name}-${String(n).padStart(2, '0')}.png`;
    await page.screenshot({ path: file });
    if (errors.length) console.warn(`${file}: page errors:`, errors);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(`saved ${Object.keys(SIZES).length * SCENES} screenshots to ${out}`);
