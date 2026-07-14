#!/usr/bin/env node
/**
 * TEMP — probe whether Tickets Bolivia (and fallbacks) return price data.
 * Delete after debugging. Run: node scripts/temp-probe-sources.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as cheerio from 'cheerio';

import { toTicketsBoliviaDate } from './lib/dates.mjs';
import { CookieJar, USER_AGENT, fetchWithCookies, sleep } from './lib/http.mjs';
import { fetchTicketsBoliviaRoute, parseTicketsBoliviaResults } from './sources/ticketsbolivia.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const outPath = path.join(rootDir, 'scripts/temp-probe-results.json');

const ROUTES = [
	['la-paz', 'cochabamba', '2026-07-15'],
	['la-paz', 'uyuni', '2026-07-20'],
	['santa-cruz', 'tarija', '2026-07-15'],
	['cochabamba', 'santa-cruz', '2026-07-16'],
	['uyuni', 'sucre', '2026-07-18'],
];

const TB_CITY_IDS = {
	'la-paz': '1',
	cochabamba: '8',
	'santa-cruz': '15',
	tarija: '16',
	sucre: '10',
	uyuni: '17',
};

async function probeTicketsBoliviaHtml(originSlug, destSlug, isoDate) {
	const originId = TB_CITY_IDS[originSlug];
	const destId = TB_CITY_IDS[destSlug];
	if (!originId || !destId) return { error: 'missing city id mapping' };

	const originName = originSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	const destName = destSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

	const jar = new CookieJar();
	await fetchWithCookies('https://www.ticketsbolivia.com/', { method: 'GET' }, jar);

	const body = new URLSearchParams({
		journey: '0',
		origen_0: originId,
		origen_0_autocomplete: `${originName}, BO`,
		destino_0: destId,
		destino_0_autocomplete: `${destName}, BO`,
		fecha_0: toTicketsBoliviaDate(isoDate),
		fecha_1: '',
		cantidad: '1',
		paginaorigen: 'https://www.ticketsbolivia.com/',
	});

	const { response } = await fetchWithCookies(
		'https://www.ticketsbolivia.com/buses_paso1.php',
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Referer: 'https://www.ticketsbolivia.com/',
				Origin: 'https://www.ticketsbolivia.com',
			},
			body,
		},
		jar,
	);

	const html = await response.text();
	const $ = cheerio.load(html);
	const parsed = parseTicketsBoliviaResults(html, 6.96);

	return {
		status: response.status,
		htmlLength: html.length,
		nottrip: $('.nottrip').length,
		searchBlocks: $('.search_block').length,
		parsedRows: parsed.length,
		sampleRows: parsed.slice(0, 3),
		heading: $('h3').first().text().trim(),
	};
}

async function probeUrl(label, url, options = {}) {
	try {
		const res = await fetch(url, {
			headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/json' },
			redirect: 'follow',
			signal: AbortSignal.timeout(15000),
			...options,
		});
		const text = await res.text();
		const hasPrice = /Bs\.?\s*\d+|BOB\s*\d+|\$\s*\d+/.test(text);
		const blocked = /bad bot|captcha|access denied|cloudflare/i.test(text);
		return {
			label,
			url,
			status: res.status,
			length: text.length,
			hasPrice,
			blocked,
			title: text.match(/<title>([^<]+)/i)?.[1]?.trim() ?? null,
		};
	} catch (error) {
		return { label, url, error: error.message };
	}
}

async function main() {
	const report = {
		ranAt: new Date().toISOString(),
		ticketsBoliviaScraper: [],
		ticketsBoliviaHtml: [],
		alternateUrls: [],
	};

	console.log('Probing Tickets Bolivia scraper (5 routes)…');
	for (const [origin, destination, date] of ROUTES) {
		const result = await fetchTicketsBoliviaRoute(origin, destination, date, {
			usdBobRate: 6.96,
			delayMsBetweenRequests: 500,
		});
		report.ticketsBoliviaScraper.push({
			route: `${origin} → ${destination}`,
			date,
			rowCount: result.rows.length,
			rows: result.rows.slice(0, 3),
			error: result.error,
		});
		console.log(`  ${origin} → ${destination} ${date}: ${result.rows.length} rows`);
		await sleep(500);
	}

	console.log('Probing raw paso1 HTML…');
	for (const [origin, destination, date] of ROUTES.slice(0, 2)) {
		const htmlProbe = await probeTicketsBoliviaHtml(origin, destination, date);
		report.ticketsBoliviaHtml.push({ route: `${origin} → ${destination}`, date, ...htmlProbe });
		console.log(`  ${origin} → ${destination}: nottrip=${htmlProbe.nottrip}, blocks=${htmlProbe.searchBlocks}`);
		await sleep(500);
	}

	console.log('Probing alternate sites…');
	const alternates = [
		['Busbud SC-Tarija', 'https://www.busbud.com/es/bo/bus/santa-cruz/tarija'],
		['Busbud LP-CBB', 'https://www.busbud.com/es/bo/bus/la-paz/cochabamba'],
		['Trans Copacabana', 'https://www.transcopacabana.com/'],
		['Tickets Bolivia travel LP-CBB', 'https://www.ticketsbolivia.com/travel-by-bus/la_paz-cochabamba.php'],
	];
	for (const [label, url] of alternates) {
		const probe = await probeUrl(label, url);
		report.alternateUrls.push(probe);
		console.log(`  ${label}: status=${probe.status ?? 'err'} hasPrice=${probe.hasPrice ?? false} blocked=${probe.blocked ?? false}`);
		await sleep(800);
	}

	fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
	console.log(`\nWrote ${outPath}`);
	console.log('Summary:', {
		scraperHits: report.ticketsBoliviaScraper.filter((r) => r.rowCount > 0).length,
		htmlBlocks: report.ticketsBoliviaHtml.some((r) => r.searchBlocks > 0),
		alternateWithPrices: report.alternateUrls.filter((r) => r.hasPrice).map((r) => r.label),
	});
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
