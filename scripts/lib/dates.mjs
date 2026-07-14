export function toTicketsBoliviaDate(isoDate) {
	const [year, month, day] = isoDate.split('-');
	return `${day}/${month}/${year}`;
}

export function upcomingIsoDates(daysAhead = 14, fromDate = new Date()) {
	const dates = [];
	const cursor = new Date(fromDate);
	cursor.setDate(cursor.getDate() + 1);

	for (let i = 0; i < daysAhead; i += 1) {
		dates.push(cursor.toISOString().slice(0, 10));
		cursor.setDate(cursor.getDate() + 1);
	}

	return dates;
}

export function utcTimestamp() {
	return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}
