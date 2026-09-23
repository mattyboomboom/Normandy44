import { describe, expect, it } from 'vitest';
import { ASHORE, ashoreOn } from '../../src/data/ashore';

describe('ashoreOn', () => {
  it('is zero before D-Day', () => {
    expect(ashoreOn(-1)).toBe(0);
    expect(ashoreOn(-0.01)).toBe(0);
  });

  it('hits every sourced waypoint exactly', () => {
    for (const [day, troops] of ASHORE) expect(ashoreOn(day)).toBe(troops);
  });

  it('interpolates in a straight line between waypoints', () => {
    // halfway between D+5 (326,547) and D+24 (850,279)
    expect(ashoreOn(14.5)).toBeCloseTo((326547 + 850279) / 2, 6);
  });

  it('never goes down', () => {
    let last = 0;
    for (let d = 0; d <= 90; d += 0.25) {
      const v = ashoreOn(d);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
  });

  it('holds at the last figure after the series ends', () => {
    const [lastDay, lastValue] = ASHORE[ASHORE.length - 1];
    expect(ashoreOn(lastDay + 9)).toBe(lastValue);
  });

  it('has waypoints in day order', () => {
    for (let i = 1; i < ASHORE.length; i++) expect(ASHORE[i][0]).toBeGreaterThan(ASHORE[i - 1][0]);
  });
});
