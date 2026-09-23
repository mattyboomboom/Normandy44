import { describe, expect, it } from 'vitest';
import { dayLabel, forcesHtml, fullDate } from '../../src/atlas/panel';
import { dwellFor } from '../../src/atlas/player';
import type { Scene } from '../../src/data/types';

const scene = (over: Partial<Scene> = {}): Scene => ({
  id: 'x', order: 1, day: 0, date: '6 June', title: 'T', cam: [[-1, 49], [0, 50]], state: 's0', beaches: false,
  body: ['One two three.'], ...over
});

describe('panel text', () => {
  it('labels days relative to D-Day', () => {
    expect(dayLabel(-1)).toBe('D−1');
    expect(dayLabel(0)).toBe('D-Day');
    expect(dayLabel(49)).toBe('D+49');
  });

  it('adds the year to dates that lack it', () => {
    expect(fullDate(scene({ date: '25 July' }))).toBe('25 July 1944');
    expect(fullDate(scene({ date: '5 June 1944' }))).toBe('5 June 1944');
  });

  it('escapes text in the figures table and links sources', () => {
    const html = forcesHtml(scene({ forces: [{ n: 'us', k: 'A <b>', v: '1', src: ['a'], check: 'verified' }, { n: 'de', k: 'B', v: '2', check: 'unverified' }] }),
      (id, i) => `/sources/#fig-${id}-${i + 1}`);
    expect(html).toContain('A &lt;b&gt;');
    expect(html).toContain('href="/sources/#fig-x-1"');
    expect(html).toContain('class="fcite unv"');
  });
});

describe('autoplay', () => {
  it('dwells between 7 and 16 seconds depending on length', () => {
    expect(dwellFor(scene())).toBe(7000);
    expect(dwellFor(scene({ body: [Array(500).fill('word').join(' ')] }))).toBe(16000);
  });
});
