#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { upcomingIsoDates, utcTimestamp } from './lib/dates.mjs';
import { appendPriceRows } from './lib/prices-file.mjs';
import { readRoutesFile, syncBidirectionalRoutesFile } from './lib/routes.mjs';
import { sleep } from './lib/http.mjs';
import { SOURCE_REGISTRY, resolveSourceTag } from './lib/sources.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const configPath = path.join(rootDir, 'data/fetch-config.json');

function loadConfig() {
	return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function parseArgs(argv) {
	const options = {
		limitRoutes: 0,
		daysAhead: null,
		syncRoutes: false,
	};

	for (const arg of argv) {
		if (arg === '--sync-routes') options.syncRoutes = true;
		if (arg.startsWith('--limit-routes=')) {
			options.limitRoutes = Number.parseInt(arg.split('=')[1], 10);
		}
		if (arg.startsWith('--days=')) {
			options.daysAhead = Number.parseInt(arg.split('=')[1], 10);
		}
	}

	return options;
}

function rowsForDates(fetchedAt, origin, destination, dates, operatorRows, sourceName) {
	const tag = resolveSourceTag(sourceName);
	const rows = [];
	for (const travelDate of dates) {
		for (const row of operatorRows) {
			rows.push([
				fetchedAt,
				origin,
				destination,
				travelDate,
				row.operator,
				row.priceBob,
				'BOB',
				tag,
			]);
		}
	}
	return rows;
}

async function fetchFromSource(sourceName, origin, destination, travelDate, config) {
	const handler = SOURCE_REGISTRY[sourceName];
	if (!handler) {
		return { rows: [], error: `Unknown source: ${sourceName}` };
	}
	return handler.fetch(origin, destination, travelDate, config);
}

async function main() {
	const cli = parseArgs(process.argv.slice(2));
	const config = loadConfig();
	const daysAhead = cli.daysAhead ?? config.daysAhead ?? 1;
	const fetchedAt = utcTimestamp();
	const sources = config.sources ?? ['ticketsbolivia-travel', 'busbud'];
	const dates = upcomingIsoDates(daysAhead);
	const travelDate = dates[0];

	if (!travelDate) {
		console.error('Could not determine target travel date.');
		process.exit(1);
	}

	const unknownSources = sources.filter((name) => !SOURCE_REGISTRY[name]);
	if (unknownSources.length > 0) {
		console.error(`Unknown sources in fetch-config.json: ${unknownSources.join(', ')}`);
		process.exit(1);
	}

	if (cli.syncRoutes) {
		const routes = syncBidirectionalRoutesFile();
		console.log(`Synced ${routes.length} bidirectional routes to data/routes.txt`);
		if (process.argv.slice(2).every((arg) => arg === '--sync-routes')) {
			return;
		}
	}

	let routes = readRoutesFile();
	const routeLimit = cli.limitRoutes || config.maxRoutesPerRun || 0;
	if (routeLimit > 0) {
		routes = routes.slice(0, routeLimit);
	}

	console.log(
		`Fetching ${routes.length} routes from ${sources.join(', ')} for travel date ${travelDate}…`,
	);

	let totalRows = 0;
	const errors = [];

	for (const [routeIndex, { origin, destination }] of routes.entries()) {
		const routeRows = [];

		for (const sourceName of sources) {
			const result = await fetchFromSource(sourceName, origin, destination, travelDate, config);
			if (result.error) {
				errors.push(`${sourceName} ${origin} → ${destination}: ${result.error}`);
			}

			if (result.rows.length > 0) {
				routeRows.push(
					...rowsForDates(fetchedAt, origin, destination, [travelDate], result.rows, sourceName),
				);
				console.log(
					`  ✓ ${origin} → ${destination} [${sourceName}]: ${result.rows.length} operator(s)`,
				);
			}
		}

		if (routeRows.length > 0) {
			appendPriceRows(routeRows);
			totalRows += routeRows.length;
		}

		console.log(
			`[${routeIndex + 1}/${routes.length}] ${origin} → ${destination}: ${routeRows.length} rows (total ${totalRows})`,
		);

		if (config.delayMsBetweenRoutes) {
			await sleep(config.delayMsBetweenRoutes);
		}
	}

	if (totalRows === 0) {
		console.error(`No real price rows fetched for ${routes.length} routes.`);
		if (errors.length > 0) {
			console.error('Sample errors:');
			for (const message of errors.slice(0, 5)) {
				console.error(`  - ${message}`);
			}
		}
		if (config.failIfNoRows !== false) {
			process.exit(1);
		}
		return;
	}

	console.log(`Done. Appended ${totalRows} real rows from ${sources.join(', ')}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
