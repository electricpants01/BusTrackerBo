// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages project site: https://<user>.github.io/<repo>/
// Set SITE_URL and BASE_PATH in CI; defaults work for local dev at /
const site = process.env.SITE_URL || undefined;
const rawBase = process.env.BASE_PATH || '/';
// Astro BASE_URL must end with `/` or `${BASE_URL}r/...` becomes `/BusTrackerBor/...`
const base =
	rawBase === '/' ? '/' : rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

// https://astro.build/config
export default defineConfig({
	site,
	base,
	output: 'static',
	vite: {
		plugins: [tailwindcss()],
	},
});
