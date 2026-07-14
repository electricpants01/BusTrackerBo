import * as cheerio from 'cheerio';

import { USER_AGENT, sleep } from '../lib/http.mjs';

const BASE_URL = 'https://www.ticketsbolivia.com';
export const SOURCE_TAG = 'ticketsbolivia-travel';

function parseMoney(value, usdBobRate) {
	if (!value) return null;
	const text = value.replace(/\s+/g, ' ').trim();
	const usdMatch = text.match(/\$\s*us?\s*(\d{1,4}(?:[.,]\d{2})?)/i);
	if (usdMatch) {
		const usd = Number.parseFloat(usdMatch[1].replace(',', '.'));
		if (Number.isFinite(usd) && usd > 0) {
			return Number((usd * usdBobRate).toFixed(2));
		}
	}
	const bobMatch = text.match(/(?:Bs\.?\s*|BOB\s*)(\d{1,4}(?:[.,]\d{2})?)/i);
	if (bobMatch) {
		const bob = Number.parseFloat(bobMatch[1].replace(',', '.'));
		if (Number.isFinite(bob) && bob > 0) return bob;
	}
	return null;
}

export function slugToTravelSegment(slug) {
	return slug.replace(/-/g, '_');
}

export function buildTravelPageUrl(originSlug, destinationSlug) {
	const path = `${slugToTravelSegment(originSlug)}-${slugToTravelSegment(destinationSlug)}`;
	return `${BASE_URL}/travel-by-bus/${path}.php`;
}

export function parseTravelGuidePage(html, usdBobRate = 6.96) {
	if (/bad bot|captcha|access denied/i.test(html)) {
		return { rows: [], blocked: true };
	}

	const $ = cheerio.load(html);
	const rows = [];

	$('table').each((_, table) => {
		const tableEl = $(table);
		const headerCells = tableEl
			.find('tr')
			.first()
			.find('td,th')
			.map((__, cell) => $(cell).text().replace(/\s+/g, ' ').trim())
			.get();

		const header = headerCells.join(' ').toLowerCase();
		const isPriceTable =
			(header.includes('company') || header.includes('bus company')) &&
			(header.includes('price') || header.includes('departure'));

		if (!isPriceTable) return;

		const priceIndex = headerCells.findIndex((cell) => /price/i.test(cell));

		tableEl.find('tr').slice(1).each((__, row) => {
			const cells = $(row)
				.find('td,th')
				.map((___, cell) => $(cell).text().replace(/\s+/g, ' ').trim())
				.get();

			if (cells.length < 2) return;

			const operator = cells[0];
			if (!operator || /^(company|bus company)$/i.test(operator)) return;

			const priceText =
				priceIndex >= 0 && cells[priceIndex] ? cells[priceIndex] : cells.find((c) => /\$|bs\.|bob/i.test(c));

			const priceBob = parseMoney(priceText ?? '', usdBobRate);
			if (!priceBob) return;

			rows.push({ operator, priceBob: priceBob.toFixed(2) });
		});
	});

	const deduped = new Map();
	for (const row of rows) {
		const key = row.operator.toLowerCase();
		const existing = deduped.get(key);
		if (!existing || Number.parseFloat(row.priceBob) < Number.parseFloat(existing.priceBob)) {
			deduped.set(key, row);
		}
	}

	return { rows: [...deduped.values()], blocked: false };
}

export async function fetchTicketsBoliviaTravelRoute(originSlug, destinationSlug, config = {}) {
	const url = buildTravelPageUrl(originSlug, destinationSlug);
	const usdBobRate = config.usdBobRate ?? 6.96;

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': USER_AGENT,
				Accept: 'text/html',
			},
			signal: AbortSignal.timeout(20000),
		});

		if (response.status === 404) {
			return { rows: [], error: null, url };
		}

		if (!response.ok) {
			return { rows: [], error: `HTTP ${response.status}`, url };
		}

		const html = await response.text();
		const parsed = parseTravelGuidePage(html, usdBobRate);

		if (parsed.blocked) {
			return { rows: [], error: 'Blocked by travel page bot filter', url };
		}

		if (config.delayMsBetweenRequests) {
			await sleep(config.delayMsBetweenRequests);
		}

		return { rows: parsed.rows, error: null, url };
	} catch (error) {
		return { rows: [], error: error instanceof Error ? error.message : String(error), url };
	}
}
