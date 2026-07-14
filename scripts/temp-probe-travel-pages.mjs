#!/usr/bin/env node
/**
 * TEMP — inspect Tickets Bolivia static travel guide pages for published prices.
 * Run: node scripts/temp-probe-travel-pages.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as cheerio from 'cheerio';

import { USER_AGENT } from './lib/http.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'temp-travel-page-results.json');

const PAGES = [
	'https://www.ticketsbolivia.com/travel-by-bus/la_paz-cochabamba.php',
	'https://www.ticketsbolivia.com/travel-by-bus/la_paz-uyuni.php',
	'https://www.ticketsbolivia.com/travel-by-bus/uyuni-sucre.php',
	'https://www.ticketsbolivia.com/travel-by-bus/santa_cruz-tarija.php',
];

async function probePage(url) {
	const res = await fetch(url, {
		headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
		signal: AbortSignal.timeout(20000),
	});
	const html = await res.text();
	const $ = cheerio.load(html);

	const prices = [...html.matchAll(/(?:Bs\.?\s*|BOB\s*|\$\s*)(\d{1,4}(?:[.,]\d{2})?)/gi)].map((m) => m[0]);
	const tables = [];
	$('table tr').each((i, row) => {
		const cells = $(row)
			.find('td,th')
			.map((_, c) => $(c).text().replace(/\s+/g, ' ').trim())
			.get();
		if (cells.length >= 2 && /bs\.|\$|bob|price|precio|company|empresa|operator/i.test(cells.join(' '))) {
			tables.push(cells);
		}
	});

	const headings = $('h2,h3')
		.map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
		.get()
		.slice(0, 12);

	return {
		url,
		status: res.status,
		title: $('title').text().trim(),
		blocked: /bad bot|captcha/i.test(html),
		priceMatches: [...new Set(prices)].slice(0, 20),
		tableRows: tables.slice(0, 15),
		headings,
		htmlLength: html.length,
	};
}

async function main() {
	const results = [];
	for (const url of PAGES) {
		console.log('Fetching', url);
		results.push(await probePage(url));
	}
	fs.writeFileSync(outPath, JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2));
	console.log('Wrote', outPath);
	for (const r of results) {
		console.log(`  ${r.status} ${r.title?.slice(0, 60)} | prices: ${r.priceMatches.length} | table rows: ${r.tableRows.length} | blocked: ${r.blocked}`);
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
