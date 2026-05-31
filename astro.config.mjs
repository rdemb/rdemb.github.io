// @ts-check
import { defineConfig } from 'astro/config';

// D-Logic Studio — storefront + lab + blog. Static output (GH Pages-friendly).
// i18n: PL default at /, EN at /en/, DE at /de/ (DE = rynek #1, wyeksponowane w UI).
export default defineConfig({
  site: 'https://rdemb.github.io',
  i18n: {
    defaultLocale: 'pl',
    locales: ['pl', 'en', 'de'],
    routing: { prefixDefaultLocale: false },
  },
  build: { inlineStylesheets: 'auto' },
});
