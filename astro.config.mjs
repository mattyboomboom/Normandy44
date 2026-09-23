// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://normandy44.vercel.app',
  build: { inlineStylesheets: 'auto' },
  compressHTML: true
});
