// Content collections: the 18 moments and the bibliography.
// Schemas live in src/content/schema.ts; cross-checks between collections
// (source keys, area states, ordering) are in src/lib/content.ts.
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { moment, source } from './content/schema';

const moments = defineCollection({
  // 01-eve.yaml -> id "eve"; the number only keeps the files in story order
  loader: glob({
    pattern: '*.yaml',
    base: './src/content/moments',
    generateId: ({ entry }) => entry.replace(/^\d+-/, '').replace(/\.yaml$/, '')
  }),
  schema: moment
});

const sources = defineCollection({
  loader: file('src/content/sources.yaml'),
  schema: source
});

export const collections = { moments, sources };
