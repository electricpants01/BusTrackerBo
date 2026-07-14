import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../..');
const citiesPath = path.join(rootDir, 'data/cities.json');

export function loadCities() {
	const raw = fs.readFileSync(citiesPath, 'utf-8');
	return JSON.parse(raw);
}

export function getCityBySlug(slug) {
	return loadCities().find((city) => city.slug === slug);
}

export function getCitySlugs() {
	return loadCities().map((city) => city.slug);
}

export function getTicketsBoliviaCity(slug) {
	const city = getCityBySlug(slug);
	if (!city?.ticketsBoliviaId) return null;
	return { id: city.ticketsBoliviaId, name: city.name, slug: city.slug };
}

export function getBusbudCity(slug) {
	const city = getCityBySlug(slug);
	if (!city?.busbudGeohash) return null;
	return {
		slug: city.slug,
		name: city.name,
		geohash: city.busbudGeohash,
		busbudSlug: city.busbudSlug ?? city.slug,
	};
}
