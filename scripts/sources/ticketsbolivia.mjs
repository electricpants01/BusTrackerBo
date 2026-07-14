import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as cheerio from 'cheerio';

import { getTicketsBoliviaCity } from '../lib/cities.mjs';
import { toTicketsBoliviaDate } from '../lib/dates.mjs';
import { CookieJar, USER_AGENT, fetchWithCookies, sleep } from '../lib/http.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../..');
const operatorsPath = path.join(rootDir, 'data/operators.json');

const BASE_URL = 'https://www.ticketsbolivia.com';

function loadOperatorAliases() {
	if (!fs.existsSync(operatorsPath)) return new Map();
	const entries = Object.entries(JSON.parse(fs.readFileSync(operatorsPath, 'utf-8')));
	return new Map(entries.map(([key, value]) => [key.toLowerCase(), value]));
}

function parseMoney(value) {
	if (!value) return null;
	const normalized = value.replace(/[^\d.,]/g, '').replace(',', '.');
	const amount = Number.parseFloat(normalized);
	return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function normalizeOperator(raw, aliases) {
	const cleaned = raw.replace(/\s+/g, ' ').trim();
	if (!cleaned) return null;
	const alias = aliases.get(cleaned.toLowerCase());
	return alias ?? cleaned;
}

export function parseTicketsBoliviaResults(html, usdBobRate = 6.96) {
	const $ = cheerio.load(html);
	const aliases = loadOperatorAliases();

	if ($('.nottrip').length > 0) {
		return [];
	}

	const providerLabels = new Map();
	$('.filtroproveedor').each((_, input) => {
		const value = $(input).attr('value');
		const label = $(input).closest('label').text().replace(/\s+/g, ' ').trim();
		if (value && label) providerLabels.set(value, label);
	});

	const rows = [];

	$('.results .search_block').each((_, element) => {
		const block = $(element);
		const operatorRaw =
			block.find('h4').first().text().replace(/\s+/g, ' ').trim() ||
			block.find('h3').first().text().replace(/\s+/g, ' ').trim() ||
			block.find('img[alt]').first().attr('alt')?.replace(/\s*logo\s*$/i, '').trim() ||
			providerLabels.get(block.attr('proveedor-type1') ?? '') ||
			providerLabels.get(block.attr('proveedor-type2') ?? '');

		let priceBob = parseMoney(block.find('.valorbob').first().text());
		if (!priceBob) {
			const usd = parseMoney(block.find('.valorusd').first().text());
			if (usd) priceBob = Number((usd * usdBobRate).toFixed(2));
		}
		if (!priceBob) {
			priceBob = parseMoney(block.find('.price_new').first().text());
		}

		const operator = normalizeOperator(operatorRaw ?? '', aliases);
		if (!operator || !priceBob) return;

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

	return [...deduped.values()];
}

async function warmSession(jar) {
	await fetchWithCookies(`${BASE_URL}/`, { method: 'GET' }, jar);
}

export async function fetchTicketsBoliviaRoute(originSlug, destinationSlug, travelDate, config = {}) {
	const origin = getTicketsBoliviaCity(originSlug);
	const destination = getTicketsBoliviaCity(destinationSlug);

	if (!origin || !destination) {
		return { rows: [], error: `Missing Tickets Bolivia city mapping for ${originSlug} → ${destinationSlug}` };
	}

	const jar = new CookieJar();
	await warmSession(jar);

	const body = new URLSearchParams({
		journey: '0',
		origen_0: origin.id,
		origen_0_autocomplete: `${origin.name}, BO`,
		destino_0: destination.id,
		destino_0_autocomplete: `${destination.name}, BO`,
		fecha_0: toTicketsBoliviaDate(travelDate),
		fecha_1: '',
		cantidad: '1',
		paginaorigen: `${BASE_URL}/`,
	});

	const { response } = await fetchWithCookies(
		`${BASE_URL}/buses_paso1.php`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Referer: `${BASE_URL}/`,
				Origin: BASE_URL,
			},
			body,
		},
		jar,
	);

	if (!response.ok) {
		return { rows: [], error: `HTTP ${response.status} for ${originSlug} → ${destinationSlug} on ${travelDate}` };
	}

	const html = await response.text();
	const parsed = parseTicketsBoliviaResults(html, config.usdBobRate ?? 6.96);

	if (config.delayMsBetweenRequests) {
		await sleep(config.delayMsBetweenRequests);
	}

	return { rows: parsed, error: null };
}

export const SOURCE_TAG = 'ticketsbolivia';
