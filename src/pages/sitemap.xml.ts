// sitemap.xml: every moment plus the reading pages.
import type { APIRoute } from 'astro';
import { loadContent } from '../lib/load';
import { withBase } from '../lib/url';
import { momentPath } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const { scenes } = await loadContent();
  const origin = site ?? new URL('http://localhost:4321');
  const paths = [withBase('/'), ...scenes.map(s => momentPath(s.id)), ...['story/', 'about/', 'sources/'].map(p => withBase(p))];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map(p => `  <url><loc>${new URL(p, origin).href}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
