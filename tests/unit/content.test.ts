// Checks the real content files: every moment and source parses against its
// schema, and the cross-checks between them pass.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { moment, source, force } from '../../src/content/schema';
import { checkContent, checkMomentOrder, citedSources, flattenMoments, firstSteps, type MomentData } from '../../src/lib/content';
import { STATES } from '../../src/data/areas';
import type { Scene, Source } from '../../src/data/types';

const root = path.resolve(__dirname, '../../src/content');
const files = fs.readdirSync(path.join(root, 'moments')).filter(f => f.endsWith('.yaml')).sort();
const moments = files.map(f => ({
  id: f.replace(/^\d+-/, '').replace(/\.yaml$/, ''),
  data: moment.parse(YAML.parse(fs.readFileSync(path.join(root, 'moments', f), 'utf8'))) as MomentData
}));
const scenes: Scene[] = flattenMoments(moments);
const sources: Source[] = (YAML.parse(fs.readFileSync(path.join(root, 'sources.yaml'), 'utf8')) as unknown[]).map(s => source.parse(s) as Source);

describe('content files', () => {
  it('has 21 moments that all match the schema, with the close-ups expanded into steps', () => {
    expect(moments).toHaveLength(21);
    expect(checkMomentOrder(moments)).toEqual([]);
    expect(firstSteps(scenes)).toHaveLength(21);
    expect(scenes.length).toBeGreaterThan(21);
  });

  it('expands a stepped moment into numbered steps with its own ids', () => {
    const epsom = scenes.filter(s => s.step?.moment === 'epsom');
    expect(epsom.map(s => s.id)).toEqual(['epsom', 'epsom-2', 'epsom-3']);
    expect(epsom.map(s => s.step!.n)).toEqual([1, 2, 3]);
    expect(epsom.every(s => s.forces === epsom[0].forces)).toBe(true);
  });

  it('gives every scene a soundscape mood, with steps overriding their moment', () => {
    expect(scenes.filter(s => !s.sound).map(s => s.id)).toEqual([]);
    expect(scenes.filter(s => s.step?.moment === 'goodwood').map(s => s.sound)).toEqual(['bombing', 'battle-heavy', 'thunder']);
    expect(scenes.find(s => s.id === 'paris')!.sound).toBe('bells');
    expect(() => moment.parse({ ...YAML.parse(fs.readFileSync(path.join(root, 'moments', files[0]), 'utf8')), sound: 'kazoo' })).toThrow();
  });

  it('opens on the eve of D-Day', () => {
    expect(scenes[0].id).toBe('eve');
    expect(scenes[0].day).toBe(-1);
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
  const base = moments[2].data; // a single-stop moment

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
    const bad = { ...base, events: [{ n: 'X', p: [49.2, -0.4], k: 'point' }] }; // lat/lon swapped
    expect(moment.safeParse(bad).success).toBe(false);
  });

  it('rejects a moment that mixes steps with single-stop fields', () => {
    const epsom = moments.find(m => m.id === 'epsom')!.data;
    expect(moment.safeParse({ ...epsom, day: 20 }).success).toBe(false);
    expect(moment.safeParse({ ...base, steps: undefined, day: undefined }).success).toBe(false);
  });

  it('rejects a camera box given the wrong way round', () => {
    expect(moment.safeParse({ ...base, cam: [[0.2, 49.52], [-1.55, 49.16]] }).success).toBe(false);
  });

  it('flags an unknown source, an unknown area state and a gap in the order', () => {
    const broken: Scene[] = scenes.map(s => ({ ...s }));
    broken[3] = { ...broken[3], state: 's99', forces: [{ n: 'us', k: 'X', v: '1', src: ['nope'], check: 'verified' }] };
    broken[4] = { ...broken[4], armour: { br: 1, us: 0, when: 'x', src: ['nada'] } };
    const errors = checkContent(broken, sources, Object.keys(STATES)).join('\n');
    expect(errors).toMatch(/unknown source "nope"/);
    expect(errors).toMatch(/armour count: unknown source "nada"/);
    expect(errors).toMatch(/unknown area state "s99"/);
    const gap = moments.map((m, i) => (i === 5 ? { ...m, data: { ...m.data, order: 9 } } : m));
    expect(checkMomentOrder(gap).join('\n')).toMatch(/expected 6/);
  });

  it('flags a moment id that would clash with a site page', () => {
    const clash = scenes.map((s, i) => (i === 2 ? { ...s, id: 'about' } : s));
    expect(checkContent(clash, sources, Object.keys(STATES)).join('\n')).toMatch(/clashes with a site page/);
  });
});
