// Schemas for the atlas content. Used by src/content.config.ts (so a bad
// moment or source fails the build) and by the unit tests.
import { z } from 'astro/zod';

const lon = z.number().min(-20).max(25);
const lat = z.number().min(35).max(62);
/** A point in the map area: western Europe */
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

export const unit = z.object({
  n: nation,
  k: z.enum(['inf', 'arm', 'mech', 'para', 'kg']),
  label: z.string().min(1),
  p: lonLat,
  size: z.enum(['corps', 'div', 'bde', 'kg']).optional(),
  lp: z.enum(['r', 'l', 't', 'b']).optional()
});

export const tacLine = z.object({
  kind: z.enum(['start', 'objective', 'road', 'ridge', 'front']),
  pts: z.array(lonLat).min(2),
  label: z.string().optional(),
  n: nation.optional()
});

export const zone = z.object({
  kind: z.enum(['bomb', 'corridor', 'pocket']),
  pts: z.array(lonLat).min(3),
  label: z.string().optional(),
  n: nation.optional()
});

export const tacLabel = z.object({ n: z.string().min(1), p: lonLat });

export const armour = z.object({
  br: z.number().min(0).max(20).nullable(),
  us: z.number().min(0).max(20).nullable(),
  tanks: z.object({ br: z.number().int().positive(), us: z.number().int().positive() }).optional(),
  when: z.string().min(1),
  src: z.array(z.string()).min(1),
  note: z.string().optional()
});

const bbox = z.tuple([lonLat, lonLat]).refine(([sw, ne]) => sw[0] < ne[0] && sw[1] < ne[1], {
  message: 'Camera box must be [[west, south], [east, north]]'
});
const globe = z.object({ globe: z.literal(true), center: z.tuple([z.number(), z.number()]) });

const camera = z.union([bbox, globe]);
/** Key into STATES in src/data/areas.ts */
const stateKey = z.string().regex(/^s\d+$/);

/** What the map shows at one stop: shared by moments and their steps */
const mapFields = {
  events: z.array(mapEvent).optional(),
  arrows: z.array(arrow).optional(),
  units: z.array(unit).optional(),
  lines: z.array(tacLine).optional(),
  zones: z.array(zone).optional(),
  labels: z.array(tacLabel).optional()
};

/** One step of a moment told in several steps (a close-up). */
export const step = z.object({
  /** Short name of the step, e.g. "The Scottish Corridor" */
  title: z.string().min(1),
  day: z.number().int().min(-1).max(90),
  date: z.string().min(1),
  cam: camera,
  state: stateKey,
  beaches: z.boolean().optional(),
  body: z.array(z.string().min(1)).min(1),
  ...mapFields
});

export const moment = z.object({
  /** Position in the story, 1-based and without gaps */
  order: z.number().int().positive(),
  title: z.string().min(1),
  forces: z.array(force).optional(),
  forcesNote: z.string().optional(),
  armour: armour.optional(),
  /** A moment is either a single stop (day, date, cam …) or a list of steps */
  day: z.number().int().min(-1).max(90).optional(),
  date: z.string().min(1).optional(),
  cam: camera.optional(),
  state: stateKey.optional(),
  beaches: z.boolean().optional(),
  body: z.array(z.string().min(1)).min(1).optional(),
  steps: z.array(step).min(2).optional(),
  ...mapFields
}).superRefine((m, ctx) => {
  const single = ['day', 'date', 'cam', 'state', 'body'] as const;
  if (m.steps) {
    for (const k of single) if (m[k] !== undefined) ctx.addIssue({ code: 'custom', message: `"${k}" belongs in each step when a moment has steps`, path: [k] });
  } else {
    for (const k of single) if (m[k] === undefined) ctx.addIssue({ code: 'custom', message: `"${k}" is required (or give the moment steps)`, path: [k] });
  }
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
