export function tomorrowIsoDate(fromDate = new Date()): string {
	const date = new Date(fromDate);
	date.setDate(date.getDate() + 1);
	return date.toISOString().slice(0, 10);
}

export function todayIsoDate(fromDate = new Date()): string {
	return fromDate.toISOString().slice(0, 10);
}
