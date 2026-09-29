// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://iefan.net',
	devToolbar: { enabled: false },
	integrations: [mdx(), sitemap({ filter: (page) => !page.endsWith('/404/') && !page.endsWith('/about/') })],
});
