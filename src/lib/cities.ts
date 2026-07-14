import citiesData from '../../data/cities.json';

export interface City {
	slug: string;
	name: string;
	ticketsBoliviaId?: string;
}

export const CITIES: City[] = citiesData as City[];

const cityMap = new Map(CITIES.map((city) => [city.slug, city]));
const nameToSlug = new Map(CITIES.map((city) => [city.name, city.slug]));

export function getCity(slug: string): City | undefined {
	return cityMap.get(slug);
}

export function getCityName(slug: string): string {
	return cityMap.get(slug)?.name ?? slug;
}

export function isValidCitySlug(slug: string): boolean {
	return cityMap.has(slug);
}

export function getAllCitySlugs(): string[] {
	return CITIES.map((city) => city.slug);
}

export function getSlugFromName(name: string): string | undefined {
	return nameToSlug.get(name.trim());
}

export function getTicketsBoliviaId(slug: string): string | undefined {
	return cityMap.get(slug)?.ticketsBoliviaId;
}

export function normalizeCityQuery(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}/gu, '');
}

export function filterCities(query: string): City[] {
	const normalized = normalizeCityQuery(query);
	if (!normalized) return CITIES;

	return CITIES.filter((city) =>
		normalizeCityQuery(city.name).includes(normalized),
	);
}
