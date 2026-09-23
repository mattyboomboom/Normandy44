// robots.txt pointing at the sitemap. Note: on GitHub Pages under a
// sub-folder, crawlers only read robots.txt at the domain root, so this file
// matters once the site has its own domain.
import type { APIRoute } from 'astro';
import { withBase } from '../lib/url';

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('http://localhost:4321');
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL(withBase('sitemap.xml'), origin).href}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
