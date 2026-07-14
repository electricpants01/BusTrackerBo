// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages project site: https://<user>.github.io/<repo>/
// Set SITE_URL and BASE_PATH in CI; defaults work for local dev at /
const site = process.env.SITE_URL || undefined;
const base = process.env.BASE_PATH || '/';

// https://astro.build/config
export default defineConfig({
	site,
	base,
	output: 'static',
	vite: {
		plugins: [tailwindcss()],
	},
});
