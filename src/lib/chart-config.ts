export const CHART_COLORS = {
	line: '#0075EB',
	fill: 'rgba(0, 117, 235, 0.12)',
	point: '#0075EB',
	highlight: '#E8750A',
	grid: '#E2E8F0',
	text: '#718096',
} as const;

/** Distinct colors for multi-operator line charts (one line per company). */
export const OPERATOR_LINE_COLORS = [
	'#0075EB',
	'#E8750A',
	'#10B981',
	'#8B5CF6',
	'#EF4444',
	'#0891B2',
	'#D946EF',
	'#CA8A04',
] as const;

export const CHART_DEFAULTS = {
	height: 320,
	mobileHeight: 240,
	currencyPrefix: 'Bs.',
} as const;
