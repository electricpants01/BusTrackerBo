import { fetchBusbudRoute, SOURCE_TAG as BUSBUD_SOURCE } from '../sources/busbud.mjs';
import { fetchTicketsBoliviaRoute, SOURCE_TAG as TICKETS_BOLIVIA_SOURCE } from '../sources/ticketsbolivia.mjs';
import {
	fetchTicketsBoliviaTravelRoute,
	SOURCE_TAG as TICKETS_BOLIVIA_TRAVEL_SOURCE,
} from '../sources/ticketsbolivia-travel.mjs';

/** @typedef {{ operator: string, priceBob: string }} PriceRow */
/** @typedef {{ rows: PriceRow[], error?: string|null, url?: string|null, unavailable?: boolean }} FetchResult */

/** @type {Record<string, { tag: string, fetch: (origin: string, dest: string, travelDate: string, config: object) => Promise<FetchResult>, usesTravelDate?: boolean }>} */
export const SOURCE_REGISTRY = {
	'ticketsbolivia-travel': {
		tag: TICKETS_BOLIVIA_TRAVEL_SOURCE,
		usesTravelDate: false,
		fetch: (origin, destination, _travelDate, config) =>
			fetchTicketsBoliviaTravelRoute(origin, destination, config),
	},
	ticketsbolivia: {
		tag: TICKETS_BOLIVIA_SOURCE,
		usesTravelDate: true,
		fetch: (origin, destination, travelDate, config) =>
			fetchTicketsBoliviaRoute(origin, destination, travelDate, config),
	},
	busbud: {
		tag: BUSBUD_SOURCE,
		usesTravelDate: false,
		fetch: (origin, destination, _travelDate, config) =>
			fetchBusbudRoute(origin, destination, config),
	},
};

export function resolveSourceTag(sourceName) {
	return SOURCE_REGISTRY[sourceName]?.tag ?? sourceName;
}

export function listRegisteredSources() {
	return Object.keys(SOURCE_REGISTRY);
}
