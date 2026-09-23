// Checks the real content files: every moment and source parses against its
// schema, and the cross-checks between them pass.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { moment, source, force } from '../../src/content/schema';
import { checkContent, citedSources } from '../../src/lib/content';
import { STATES } from '../../src/data/areas';
import type { Scene, Source } from '../../src/data/types';

const root = path.resolve(__dirname, '../../src/content');
const files = fs.readdirSync(path.join(root, 'moments')).filter(f => f.endsWith('.yaml')).sort();
const scenes: Scene[] = files.map(f => ({
  id: f.replace(/^\d+-/, '').replace(/\.yaml$/, ''),
  ...moment.parse(YAML.parse(fs.readFileSync(path.join(root, 'moments', f), 'utf8')))
}) as Scene);
const sources: Source[] = (YAML.parse(fs.readFileSync(path.join(root, 'sources.yaml'), 'utf8')) as unknown[]).map(s => source.parse(s) as Source);

describe('content files', () => {
  it('has 18 moments that all match the schema', () => {
    expect(scenes).toHaveLength(18);
  });

  it('passes the cross-checks (sources, area states, order, ids)', () => {
    expect(checkContent(scenes, sources, Object.keys(STATES))).toEqual([]);
  });

  it('gives every figure a check status, and every verified figure a source', () => {
    for (const sc of scenes) for (const f of sc.forces || []) {
      if (/\d/.test(f.v || '')) expect(f.check, `${sc.id}: ${f.k}`).toBeDefined();
      if (f.check === 'verified') expect(f.src?.length, `${sc.id}: ${f.k}`).toBeGreaterThan(0);
    }
  });

  it('cites a subset of the bibliography, including works checked via a web page', () => {
    const cited = citedSources(scenes, sources).map(s => s.id);
    expect(cited).toContain('ddaystory');
    expect(cited).toContain('weinberg1994');
    expect(cited).toContain('wp-overlord'); // via for weinberg1994
    expect(cited).not.toContain('naturalearth');
  });
});

describe('schema and cross-checks catch mistakes', () => {
  const base = scenes[1];

  it('rejects a figure with no check status', () => {
    expect(force.safeParse({ n: 'us', k: 'Troops', v: '1,000' }).success).toBe(false);
  });

  it('rejects a verified figure with no source', () => {
    expect(force.safeParse({ n: 'us', k: 'Troops', v: '1,000', check: 'verified' }).success).toBe(false);
  });

  it('accepts a descriptive row with no figure', () => {
    expect(force.safeParse({ n: 'de', k: 'Defenders', s: '352nd Division' }).success).toBe(true);
  });

  it('rejects a point outside the map area', () => {
    const bad = { ...base, events: [{ n: 'X', p: [49.2, -0.4], k: 'point' }] };
    expect(moment.safeParse(bad).success).toBe(false);
  });

  it('rejects a camera box given the wrong way round', () => {
    expect(moment.safeParse({ ...base, cam: [[0.2, 49.52], [-1.55, 49.16]] }).success).toBe(false);
  });

  it('flags an unknown source, an unknown area state and a gap in the order', () => {
    const broken: Scene[] = scenes.map(s => ({ ...s }));
    broken[3] = { ...broken[3], state: 's99', forces: [{ n: 'us', k: 'X', v: '1', src: ['nope'], check: 'verified' }] };
    broken[5] = { ...broken[5], order: 9 };
    const errors = checkContent(broken, sources, Object.keys(STATES)).join('\n');
    expect(errors).toMatch(/unknown source "nope"/);
    expect(errors).toMatch(/unknown area state "s99"/);
    expect(errors).toMatch(/order is 9, expected 6/);
  });

  it('flags a moment id that would clash with a site page', () => {
    const clash = scenes.map((s, i) => (i === 2 ? { ...s, id: 'about' } : s));
    expect(checkContent(clash, sources, Object.keys(STATES)).join('\n')).toMatch(/clashes with a site page/);
  });
});
