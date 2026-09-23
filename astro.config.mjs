// @ts-check
import { defineConfig } from 'astro/config';

// Where the site is hosted. The defaults publish to GitHub Pages at
// https://mattyboomboom.github.io/Normandy44/. For a custom domain or Vercel,
// build with SITE_URL set to the full origin (e.g. https://normandy44.com)
// and BASE_PATH=/ so the site is served from the root.
const site = process.env.SITE_URL ?? 'https://mattyboomboom.github.io';
const base = process.env.BASE_PATH ?? '/Normandy44';

export default defineConfig({
  site,
  base,
  build: { inlineStylesheets: 'auto' },
  compressHTML: true
});
