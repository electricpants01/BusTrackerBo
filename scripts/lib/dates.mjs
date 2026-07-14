export function toTicketsBoliviaDate(isoDate) {
	const [year, month, day] = isoDate.split('-');
	return `${day}/${month}/${year}`;
}

function parseIsoDate(isoDate) {
	const [year, month, day] = isoDate.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date) {
	return date.toISOString().slice(0, 10);
}

/** Tomorrow through tomorrow + (days - 1), UTC-safe. */
export function upcomingIsoDates(daysAhead = 14, fromDate = new Date()) {
	return isoDatesFromStart(addDaysUtc(formatIsoDate(fromDate), 1), daysAhead);
}

/** Inclusive window: startIso, startIso+1, … for `dayCount` days. */
export function isoDatesFromStart(startIso, dayCount) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(startIso) || dayCount <= 0) return [];

	const dates = [];
	const cursor = parseIsoDate(startIso);

	for (let i = 0; i < dayCount; i += 1) {
		dates.push(formatIsoDate(cursor));
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}

	return dates;
}

function addDaysUtc(isoDate, days) {
	const cursor = parseIsoDate(isoDate);
	cursor.setUTCDate(cursor.getUTCDate() + days);
	return formatIsoDate(cursor);
}

/**
 * Production window for daily cron (no overlap on travel_date):
 * - Empty file → tomorrow for N days
 * - Existing data → (latest travel_date + 1) for N days
 * - Never starts before tomorrow (skips stale past dates)
 */
export function resolveFetchTravelDates({ latestTravelDate = null, dayCount = 7, fromDate = new Date() } = {}) {
	const tomorrow = addDaysUtc(formatIsoDate(fromDate), 1);

	if (!latestTravelDate) {
		return isoDatesFromStart(tomorrow, dayCount);
	}

	let start = addDaysUtc(latestTravelDate, 1);
	if (start < tomorrow) {
		start = tomorrow;
	}

	return isoDatesFromStart(start, dayCount);
}

export function utcTimestamp() {
	return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}
