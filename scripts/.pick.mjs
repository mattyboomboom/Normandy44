import { chromium } from 'playwright';
const [out, ...paths] = process.argv.slice(2);
const b = await chromium.launch(); const errs = [];
for (const [nm, vp] of [['d', { width: 1440, height: 900 }], ['m', { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp, reducedMotion: 'reduce' });
  for (const p of paths) {
    const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(p + ' ' + e.message));
    await pg.goto('http://localhost:8800/Normandy44/' + p, { waitUntil: 'networkidle' }); await pg.waitForTimeout(600);
    await pg.screenshot({ path: `${out}/${nm}-${p.replace(/\//g, '_') || 'cover'}.png` }); await pg.close();
  }
}
console.log('errors', errs); await b.close();
