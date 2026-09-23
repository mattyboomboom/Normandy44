// Compares two folders of screenshots pixel by pixel.
//   node scripts/compare.mjs <baselineDir> <candidateDir> [diffDir]
// Prints the share of differing pixels per image and writes diff images.
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const [a, b, diffDir = 'tests/visual/diff'] = process.argv.slice(2);
fs.mkdirSync(diffDir, { recursive: true });
let worst = 0;
for (const f of fs.readdirSync(a).filter(f => f.endsWith('.png')).sort()) {
  const A = PNG.sync.read(fs.readFileSync(path.join(a, f)));
  const B = PNG.sync.read(fs.readFileSync(path.join(b, f)));
  const { width, height } = A;
  const diff = new PNG({ width, height });
  const n = pixelmatch(A.data, B.data, diff.data, width, height, { threshold: 0.1 });
  const pct = (100 * n) / (width * height);
  worst = Math.max(worst, pct);
  if (n) fs.writeFileSync(path.join(diffDir, f), PNG.sync.write(diff));
  console.log(`${f.padEnd(16)} ${pct.toFixed(3)}% (${n} px)`);
}
console.log(`worst: ${worst.toFixed(3)}%`);
process.exitCode = worst > 0.5 ? 1 : 0;
