export interface City {
	slug: string;
	name: string;
}

export const CITIES: City[] = [
	{ slug: 'santa-cruz', name: 'Santa Cruz de la Sierra' },
	{ slug: 'la-paz', name: 'La Paz' },
	{ slug: 'cochabamba', name: 'Cochabamba' },
	{ slug: 'tarija', name: 'Tarija' },
	{ slug: 'sucre', name: 'Sucre' },
	{ slug: 'oruro', name: 'Oruro' },
	{ slug: 'potosi', name: 'Potosí' },
	{ slug: 'trinidad', name: 'Trinidad' },
	{ slug: 'uyuni', name: 'Uyuni' },
];

const cityMap = new Map(CITIES.map((city) => [city.slug, city]));

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
