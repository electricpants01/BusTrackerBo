import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as cheerio from 'cheerio';

import { getBusbudCity } from '../lib/cities.mjs';
import { USER_AGENT, sleep } from '../lib/http.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../..');
const operatorsPath = path.join(rootDir, 'data/operators.json');

const BASE_URL = 'https://www.busbud.com';
export const SOURCE_TAG = 'busbud';

function loadOperatorAliases() {
	if (!fs.existsSync(operatorsPath)) return new Map();
	const entries = Object.entries(JSON.parse(fs.readFileSync(operatorsPath, 'utf-8')));
	return new Map(entries.map(([key, value]) => [key.toLowerCase(), value]));
}

function normalizeOperator(raw, aliases) {
	const cleaned = raw.replace(/\s+/g, ' ').trim();
	if (!cleaned) return null;
	return aliases.get(cleaned.toLowerCase()) ?? cleaned;
}

function parseClpAmount(text) {
	const match = text.match(/CLP\s*([\d.,]+)/i);
	if (!match) return null;
	const normalized = match[1].replace(/,/g, '');
	const amount = Number.parseFloat(normalized);
	return Number.isFinite(amount) && amount > 0 ? amount : null;
}

/** Busbud labels Bolivia prices as CLP; values align with USD × 1000 on sampled routes. */
export function clpDisplayToBob(clpAmount, config = {}) {
	const divisor = config.busbudClpDivisor ?? 1000;
	const usdBobRate = config.usdBobRate ?? 6.96;
	const priceUsd = clpAmount / divisor;
	return Number((priceUsd * usdBobRate).toFixed(2));
}

export function buildBusbudRouteUrl(originSlug, destinationSlug) {
	const origin = getBusbudCity(originSlug);
	const destination = getBusbudCity(destinationSlug);
	if (!origin?.geohash || !destination?.geohash) return null;

	const originPath = origin.busbudSlug ?? origin.slug;
	const destinationPath = destination.busbudSlug ?? destination.slug;
	return `${BASE_URL}/es-mx/autobus-${originPath}-${destinationPath}/r/${origin.geohash}-${destination.geohash}`;
}

export function parseBusbudPage(html, config = {}) {
	if (/couldn't find|no hemos podido|went wrong|algo fue mal/i.test(html)) {
		return { rows: [], unavailable: true };
	}

	const $ = cheerio.load(html);
	const aliases = loadOperatorAliases();
	const rows = [];

	$('table tr').each((_, row) => {
		const rowEl = $(row);
		const text = rowEl.text().replace(/\s+/g, ' ').trim();
		if (!/CLP\s*[\d.,]+/i.test(text)) return;
		if (/operado por|operated by|tipo de veh/i.test(text)) return;

		const operatorRaw =
			rowEl.find('img[alt]').first().attr('alt')?.replace(/\s*logo\s*$/i, '').trim() ?? '';
		const clpAmount = parseClpAmount(text);
		if (!clpAmount) return;

		const operator = normalizeOperator(operatorRaw, aliases);
		if (!operator) return;

		const priceBob = clpDisplayToBob(clpAmount, config);
		rows.push({ operator, priceBob: priceBob.toFixed(2) });
	});

	const deduped = new Map();
	for (const row of rows) {
		const key = row.operator.toLowerCase();
		const existing = deduped.get(key);
		if (!existing || Number.parseFloat(row.priceBob) < Number.parseFloat(existing.priceBob)) {
			deduped.set(key, row);
		}
	}

	return { rows: [...deduped.values()], unavailable: false };
}

export async function fetchBusbudRoute(originSlug, destinationSlug, config = {}) {
	const url = buildBusbudRouteUrl(originSlug, destinationSlug);
	if (!url) {
		return {
			rows: [],
			error: `Missing Busbud mapping for ${originSlug} → ${destinationSlug}`,
			url: null,
		};
	}

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': USER_AGENT,
				Accept: 'text/html',
				'Accept-Language': 'es-BO,es;q=0.9',
			},
			signal: AbortSignal.timeout(25000),
			redirect: 'follow',
		});

		if (response.status === 404) {
			return { rows: [], error: null, url, unavailable: true };
		}

		if (!response.ok) {
			return { rows: [], error: `HTTP ${response.status}`, url };
		}

		const html = await response.text();
		const parsed = parseBusbudPage(html, config);

		if (config.delayMsBetweenRequests) {
			await sleep(config.delayMsBetweenRequests);
		}

		return { rows: parsed.rows, error: null, url, unavailable: parsed.unavailable };
	} catch (error) {
		return {
			rows: [],
			error: error instanceof Error ? error.message : String(error),
			url,
		};
	}
}
