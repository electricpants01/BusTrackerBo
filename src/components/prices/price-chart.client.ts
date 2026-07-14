import { Chart } from 'chart.js/auto';

interface OperatorDataset {
	label: string;
	color: string;
	data: (number | null)[];
}

interface ChartPayload {
	labels: string[];
	datasets: OperatorDataset[];
	highlightIndex: number;
	colors: {
		grid: string;
		text: string;
	};
	prefix: string;
}

const CHART_CANVAS_ID = 'price-history-chart';

function renderPriceChart() {
	const canvas = document.getElementById(CHART_CANVAS_ID);
	if (!(canvas instanceof HTMLCanvasElement)) return;

	const raw = canvas.dataset.chart;
	if (!raw) return;

	let payload: ChartPayload;
	try {
		payload = JSON.parse(raw) as ChartPayload;
	} catch {
		return;
	}

	const { labels, datasets, highlightIndex, colors, prefix } = payload;
	if (datasets.length === 0) return;

	const existing = Chart.getChart(canvas);
	if (existing) existing.destroy();

	new Chart(canvas, {
		type: 'line',
		data: {
			labels,
			datasets: datasets.map((series) => ({
				label: series.label,
				data: series.data,
				borderColor: series.color,
				backgroundColor: series.color,
				fill: false,
				tension: 0.35,
				spanGaps: false,
				pointRadius: series.data.map((_, index) =>
					index === highlightIndex ? 6 : 4,
				),
				pointBackgroundColor: series.color,
				pointBorderColor: '#ffffff',
				pointBorderWidth: 2,
				pointHoverRadius: 7,
			})),
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				mode: 'index',
				intersect: false,
			},
			plugins: {
				legend: {
					display: true,
					position: 'bottom',
					labels: {
						color: colors.text,
						boxWidth: 12,
						boxHeight: 12,
						usePointStyle: true,
						padding: 16,
					},
				},
				tooltip: {
					callbacks: {
						label(context) {
							const value = context.parsed.y;
							if (value == null) return `${context.dataset.label}: —`;
							return `${context.dataset.label}: ${prefix} ${value.toLocaleString('es-BO')}`;
						},
					},
				},
			},
			scales: {
				x: {
					grid: { color: colors.grid },
					ticks: { color: colors.text },
				},
				y: {
					grid: { color: colors.grid },
					ticks: {
						color: colors.text,
						callback(value) {
							return `${prefix} ${value}`;
						},
					},
				},
			},
		},
	});
}

renderPriceChart();
document.addEventListener('astro:page-load', renderPriceChart);
