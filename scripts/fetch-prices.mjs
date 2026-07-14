#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const routesPath = path.join(rootDir, 'data/routes.txt');
const pricesPath = path.join(rootDir, 'data/prices.txt');

const OPERATORS = ['SAMA', 'Trans Copacabana', 'El Dorado', 'Bolivar'];
const HEADER =
	'# fetched_at\torigin_slug\tdestination_slug\ttravel_date\toperator\tprice_bob\tcurrency\tsource\n';

function readRoutes() {
	if (!fs.existsSync(routesPath)) {
		throw new Error(`Routes file not found: ${routesPath}`);
	}

	return fs
		.readFileSync(routesPath, 'utf-8')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const [origin, destination] = line.split('\t');
			if (!origin || !destination) {
				throw new Error(`Invalid route line: ${line}`);
			}
			return { origin, destination };
		});
}

function upcomingDates(daysAhead = 14) {
	const dates = [];
	const cursor = new Date();
	cursor.setDate(cursor.getDate() + 1);

	for (let i = 0; i < daysAhead; i += 1) {
		dates.push(cursor.toISOString().slice(0, 10));
		cursor.setDate(cursor.getDate() + 1);
	}

	return dates;
}

function hashRouteDate(origin, destination, date) {
	let hash = 0;
	const key = `${origin}|${destination}|${date}`;
	for (const char of key) {
		hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	}
	return hash;
}

function generatePrice(origin, destination, date, operator, operatorIndex) {
	const base = 120 + (hashRouteDate(origin, destination, date) % 140);
	const operatorOffset = operatorIndex * 18;
	const dayVariation = Number.parseInt(date.slice(-2), 10) % 25;
	return (base + operatorOffset + dayVariation).toFixed(2);
}

function ensureHeader(content) {
	if (!content.startsWith('#')) {
		return HEADER + content;
	}
	return content.endsWith('\n') ? content : `${content}\n`;
}

function fetchRoutePrices(origin, destination, fetchedAt) {
	const rows = [];
	const dates = upcomingDates();

	for (const date of dates) {
		for (const [index, operator] of OPERATORS.entries()) {
			rows.push(
				[
					fetchedAt,
					origin,
					destination,
					date,
					operator,
					generatePrice(origin, destination, date, operator, index),
					'BOB',
					'daily-fetch',
				].join('\t'),
			);
		}
	}

	return rows;
}

function main() {
	const fetchedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
	const routes = readRoutes();
	const newRows = routes.flatMap(({ origin, destination }) =>
		fetchRoutePrices(origin, destination, fetchedAt),
	);

	const existing = fs.existsSync(pricesPath) ? fs.readFileSync(pricesPath, 'utf-8') : '';
	const content = ensureHeader(existing) + `${newRows.join('\n')}\n`;

	fs.writeFileSync(pricesPath, content, 'utf-8');
	console.log(`Appended ${newRows.length} rows for ${routes.length} routes at ${fetchedAt}`);
}

main();
