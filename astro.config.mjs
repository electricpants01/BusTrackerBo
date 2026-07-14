// @ts-check
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	adapter: node({ mode: 'middleware' }),
	vite: {
		plugins: [tailwindcss()],
	},
});
