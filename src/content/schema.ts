// Schemas for the atlas content. Used by src/content.config.ts (so a bad
// moment or source fails the build) and by the unit tests.
import { z } from 'astro/zod';

const lon = z.number().min(-10).max(10);
const lat = z.number().min(44).max(56);
/** A point in the map area: western France and southern England */
export const lonLat = z.tuple([lon, lat]);

export const nation = z.enum(['us', 'uk', 'ca', 'pl', 'fr', 'de', 'all']);

const hasDigit = (s?: string) => !!s && /\d/.test(s);

export const force = z.object({
  n: nation,
  /** What is being counted */
  k: z.string().min(1),
  /** The figure, as displayed */
  v: z.string().optional(),
  /** Detail line */
  s: z.string().optional(),
  /** Bibliography keys (checked against sources.yaml by checkContent in src/lib/content.ts) */
  src: z.array(z.string()).optional(),
  /** verified: checked against the listed sources. unverified: still to be traced */
  check: z.enum(['verified', 'unverified']).optional(),
  /** Anything a careful reader should know about the figure */
  note: z.string().optional()
}).refine(f => !hasDigit(f.v) || !!f.check, {
  message: 'Every figure needs a check status (verified or unverified)'
}).refine(f => f.check !== 'verified' || (f.src && f.src.length > 0), {
  message: 'A verified figure must list at least one source'
});

export const mapEvent = z.object({
  n: z.string().min(1),
  p: lonLat,
  k: z.enum(['star', 'clash', 'target', 'para', 'fort', 'gap', 'storm', 'bomb', 'harbour', 'point']),
  nat: nation.optional(),
  note: z.string().optional(),
  l: z.literal(1).optional(),
  lp: z.enum(['r', 'l', 't', 'b']).optional()
});

export const arrow = z.object({
  n: nation,
  pts: z.array(lonLat).min(2),
  w: z.number().positive().optional(),
  dash: z.literal(1).optional()
});

const bbox = z.tuple([lonLat, lonLat]).refine(([sw, ne]) => sw[0] < ne[0] && sw[1] < ne[1], {
  message: 'Camera box must be [[west, south], [east, north]]'
});
const globe = z.object({ globe: z.literal(true), center: z.tuple([z.number(), z.number()]) });

export const moment = z.object({
  /** Position in the story, 1-based and without gaps */
  order: z.number().int().positive(),
  /** Days relative to D-Day (6 June 1944 = 0) */
  day: z.number().int().min(-1).max(90),
  date: z.string().min(1),
  title: z.string().min(1),
  cam: z.union([bbox, globe]),
  /** Key into STATES in src/data/areas.ts */
  state: z.string().regex(/^s\d+$/),
  beaches: z.boolean(),
  body: z.array(z.string().min(1)).min(1),
  forces: z.array(force).optional(),
  forcesNote: z.string().optional(),
  events: z.array(mapEvent).optional(),
  arrows: z.array(arrow).optional()
});

export const source = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.enum(['web', 'book', 'official', 'data']),
  author: z.string(),
  title: z.string(),
  publisher: z.string().optional(),
  year: z.number().int().optional(),
  pages: z.string().optional(),
  url: z.url().optional(),
  accessed: z.coerce.date().optional(),
  /** Key of the web page through which this work was checked */
  via: z.string().optional(),
  note: z.string().optional()
});
