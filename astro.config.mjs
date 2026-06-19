// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://softwarejoe.com',
  integrations: [
    sitemap({
      // Exclude noindex pages (thank-you, etc.) from the sitemap.
      filter: (page) => !page.includes('/thanks'),
    }),
  ],
  // Static output (default). Vercel serves dist/ and deploys /api/* as functions.
});
