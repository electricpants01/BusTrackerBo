import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getCitySlugs } from './cities.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../..');
const routesPath = path.join(rootDir, 'data/routes.txt');

export function generateBidirectionalRoutes(citySlugs = getCitySlugs()) {
	const routes = [];

	for (const origin of citySlugs) {
		for (const destination of citySlugs) {
			if (origin === destination) continue;
			routes.push({ origin, destination });
		}
	}

	return routes;
}

export function readRoutesFile(filePath = routesPath) {
	if (!fs.existsSync(filePath)) {
		return generateBidirectionalRoutes();
	}

	return fs
		.readFileSync(filePath, 'utf-8')
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

export function writeRoutesFile(routes, filePath = routesPath) {
	const body = routes.map(({ origin, destination }) => `${origin}\t${destination}`).join('\n');
	fs.writeFileSync(filePath, `${body}\n`, 'utf-8');
}

export function syncBidirectionalRoutesFile() {
	const routes = generateBidirectionalRoutes();
	writeRoutesFile(routes);
	return routes;
}
