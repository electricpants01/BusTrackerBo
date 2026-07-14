#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const pricesPath = path.join(rootDir, 'data/prices.txt');

const VALID_CITIES = new Set([
	'santa-cruz',
	'la-paz',
	'cochabamba',
	'tarija',
	'sucre',
	'oruro',
	'potosi',
	'trinidad',
	'uyuni',
]);

function fail(message) {
	console.error(`Validation error: ${message}`);
	process.exit(1);
}

function validate() {
	if (!fs.existsSync(pricesPath)) {
		fail(`Missing prices file: ${pricesPath}`);
	}

	const lines = fs.readFileSync(pricesPath, 'utf-8').split('\n');
	const header = lines.find((line) => line.startsWith('#'));

	if (!header) {
		fail('Missing header row starting with #');
	}

	let rowCount = 0;

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const parts = trimmed.split('\t');
		if (parts.length !== 8) {
			fail(`Expected 8 columns, got ${parts.length}: ${trimmed}`);
		}

		const [fetchedAt, origin, destination, travelDate, operator, priceBob, currency, source] = parts;

		if (Number.isNaN(Date.parse(fetchedAt))) fail(`Invalid fetched_at: ${fetchedAt}`);
		if (!VALID_CITIES.has(origin)) fail(`Invalid origin_slug: ${origin}`);
		if (!VALID_CITIES.has(destination)) fail(`Invalid destination_slug: ${destination}`);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(travelDate)) fail(`Invalid travel_date: ${travelDate}`);
		if (!operator.trim()) fail('Missing operator');
		if (Number.isNaN(Number.parseFloat(priceBob)) || Number.parseFloat(priceBob) <= 0) {
			fail(`Invalid price_bob: ${priceBob}`);
		}
		if (currency !== 'BOB') fail(`Currency must be BOB, got: ${currency}`);
		if (!source.trim()) fail('Missing source');

		rowCount += 1;
	}

	console.log(`Validated ${rowCount} price rows in ${pricesPath}`);
}

validate();
