// Cumulative Allied troops ashore, interpolated by day for the counter under
// the date. [day relative to D-Day, troops]. Sources (see sources.yaml):
//   D-Day      156,000    ddaystory (156,115 by sea and air)
//   D+5        326,547    ddaystory (by the end of 11 June)
//   D+24       850,279    ww2db-normandy (by 30 June; primary still to be traced)
//   D+49     1,452,000    wp-overlord (by 25 July)
//   D+76     2,052,299    tamelander2003 via wp-overlord (D-Day to 21 August)
// After 21 August the counter holds at the last figure.
export const ASHORE: [number, number][] = [[0, 156000], [5, 326547], [24, 850279], [49, 1452000], [76, 2052299]];

export function ashoreOn(day: number): number {
  if (day < 0) return 0;
  for (let i = 1; i < ASHORE.length; i++) {
    const [d0, v0] = ASHORE[i - 1], [d1, v1] = ASHORE[i];
    if (day <= d1) return v0 + (v1 - v0) * (day - d0) / (d1 - d0);
  }
  return ASHORE[ASHORE.length - 1][1];
}
