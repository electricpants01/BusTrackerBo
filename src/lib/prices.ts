import fs from 'node:fs';
import path from 'node:path';

import { isValidCitySlug } from './cities';

export interface PriceRow {
	fetchedAt: string;
	originSlug: string;
	destinationSlug: string;
	travelDate: string;
	operator: string;
	priceBob: number;
	currency: string;
	source: string;
}

export interface DailyPrice {
	date: string;
	minPrice: number;
	operators: { name: string; price: number }[];
}

const DEFAULT_PRICES_PATH = path.join(process.cwd(), 'data/prices.txt');

function rowKey(row: PriceRow): string {
	return `${row.originSlug}|${row.destinationSlug}|${row.travelDate}|${row.operator}`;
}

export function parsePricesContent(content: string): PriceRow[] {
	const rows: PriceRow[] = [];

	for (const line of content.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const parts = trimmed.split('\t');
		if (parts.length !== 8) continue;

		const priceBob = Number.parseFloat(parts[5]);
		if (Number.isNaN(priceBob) || priceBob <= 0) continue;

		rows.push({
			fetchedAt: parts[0],
			originSlug: parts[1],
			destinationSlug: parts[2],
			travelDate: parts[3],
			operator: parts[4],
			priceBob,
			currency: parts[6],
			source: parts[7],
		});
	}

	return rows;
}

export function parsePricesFile(filePath: string = DEFAULT_PRICES_PATH): PriceRow[] {
	if (!fs.existsSync(filePath)) return [];
	return parsePricesContent(fs.readFileSync(filePath, 'utf-8'));
}

export function dedupeRows(rows: PriceRow[]): PriceRow[] {
	const map = new Map<string, PriceRow>();

	for (const row of rows) {
		const key = rowKey(row);
		const existing = map.get(key);
		if (!existing || row.fetchedAt > existing.fetchedAt) {
			map.set(key, row);
		}
	}

	return [...map.values()];
}

function filterRoute(rows: PriceRow[], origin: string, destination: string): PriceRow[] {
	return rows.filter(
		(row) => row.originSlug === origin && row.destinationSlug === destination,
	);
}

export function getPriceHistory(
	origin: string,
	destination: string,
	days = 30,
	filePath?: string,
): DailyPrice[] {
	const rows = dedupeRows(filterRoute(parsePricesFile(filePath), origin, destination));
	const byDate = new Map<string, DailyPrice>();

	for (const row of rows) {
		const existing = byDate.get(row.travelDate) ?? {
			date: row.travelDate,
			minPrice: row.priceBob,
			operators: [],
		};

		existing.operators.push({ name: row.operator, price: row.priceBob });
		existing.minPrice = Math.min(existing.minPrice, row.priceBob);
		byDate.set(row.travelDate, existing);
	}

	const sorted = [...byDate.values()]
		.sort((a, b) => a.date.localeCompare(b.date))
		.map((day) => ({
			...day,
			operators: day.operators.sort((a, b) => a.price - b.price),
		}));

	if (days > 0 && sorted.length > days) {
		return sorted.slice(-days);
	}

	return sorted;
}

export function getMinPriceForDate(
	origin: string,
	destination: string,
	date: string,
	filePath?: string,
): number | null {
	const history = getPriceHistory(origin, destination, 0, filePath);
	const match = history.find((day) => day.date === date);
	return match?.minPrice ?? null;
}

export function getLatestFetch(
	origin: string,
	destination: string,
	filePath?: string,
): string | null {
	const rows = filterRoute(parsePricesFile(filePath), origin, destination);
	if (rows.length === 0) return null;

	return rows.reduce((latest, row) => (row.fetchedAt > latest ? row.fetchedAt : latest), rows[0].fetchedAt);
}

export function getOperatorsForDate(
	origin: string,
	destination: string,
	date: string,
	filePath?: string,
): { name: string; price: number }[] {
	const rows = dedupeRows(filterRoute(parsePricesFile(filePath), origin, destination));
	return rows
		.filter((row) => row.travelDate === date)
		.map((row) => ({ name: row.operator, price: row.priceBob }))
		.sort((a, b) => a.price - b.price);
}

export function getUpcomingDates(daysAhead: number, fromDate = new Date(), startOffsetDays = 0): string[] {
	const dates: string[] = [];
	const cursor = new Date(fromDate);
	cursor.setDate(cursor.getDate() + startOffsetDays);

	for (let i = 0; i < daysAhead; i += 1) {
		dates.push(cursor.toISOString().slice(0, 10));
		cursor.setDate(cursor.getDate() + 1);
	}

	return dates;
}

export function validatePriceRow(row: PriceRow): string[] {
	const errors: string[] = [];

	if (!row.fetchedAt || Number.isNaN(Date.parse(row.fetchedAt))) {
		errors.push('invalid fetched_at');
	}
	if (!isValidCitySlug(row.originSlug)) errors.push('invalid origin_slug');
	if (!isValidCitySlug(row.destinationSlug)) errors.push('invalid destination_slug');
	if (!/^\d{4}-\d{2}-\d{2}$/.test(row.travelDate)) errors.push('invalid travel_date');
	if (!row.operator.trim()) errors.push('missing operator');
	if (row.priceBob <= 0) errors.push('invalid price_bob');
	if (row.currency !== 'BOB') errors.push('currency must be BOB');

	return errors;
}
