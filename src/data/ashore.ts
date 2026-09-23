// Cumulative Allied troops ashore (sourced waypoints), interpolated by day.
// [day relative to D-Day, troops]
export const ASHORE: [number, number][] = [[0, 156000], [5, 326547], [24, 850279], [49, 1452000], [85, 2052299]];

export function ashoreOn(day: number): number {
  if (day < 0) return 0;
  for (let i = 1; i < ASHORE.length; i++) {
    const [d0, v0] = ASHORE[i - 1], [d1, v1] = ASHORE[i];
    if (day <= d1) return v0 + (v1 - v0) * (day - d0) / (d1 - d0);
  }
  return ASHORE[ASHORE.length - 1][1];
}
