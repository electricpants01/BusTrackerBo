import { getCityName } from '../../lib/cities';
import type { DailyPrice } from '../../lib/prices';

interface RoutePayload {
	origin: string;
	destination: string;
	history: DailyPrice[];
}

function formatLongDate(date: string): string {
	return new Intl.DateTimeFormat('es-BO', { dateStyle: 'long' }).format(new Date(`${date}T12:00:00`));
}

function formatPrice(amount: number): string {
	return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }).format(amount);
}

function operatorsForDate(history: DailyPrice[], date: string) {
	return history.find((day) => day.date === date)?.operators ?? [];
}

function applyDateFromUrl() {
	const raw = document.getElementById('route-data')?.textContent;
	if (!raw) return;

	let payload: RoutePayload;
	try {
		payload = JSON.parse(raw) as RoutePayload;
	} catch {
		return;
	}

	const params = new URLSearchParams(window.location.search);
	const dateParam = params.get('date');
	if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return;

	const operators = operatorsForDate(payload.history, dateParam);
	const heading = document.getElementById('operators-heading');
	const list = document.getElementById('operators-list');
	const section = document.getElementById('operators-section');

	if (heading) {
		heading.textContent = `Operadores para ${formatLongDate(dateParam)}`;
	}

	if (list && section) {
		if (operators.length === 0) {
			section.hidden = true;
			list.replaceChildren();
		} else {
			section.hidden = false;
			list.innerHTML = operators
				.map(
					(op) => `
					<div class="rounded-lg border border-border bg-bg-card p-4 flex items-center justify-between gap-4">
						<div class="min-w-0"><p class="truncate font-semibold text-text">${op.name}</p></div>
						<div class="shrink-0 rounded-md bg-primary px-4 py-2 text-white">
							<span class="text-lg font-bold">Bs. ${formatPrice(op.price)}</span>
						</div>
					</div>`,
				)
				.join('');
		}
	}

	document.querySelectorAll('[data-carousel-date]').forEach((el) => {
		if (!(el instanceof HTMLElement)) return;
		const isSelected = el.dataset.carouselDate === dateParam;
		el.classList.toggle('border', isSelected);
		el.classList.toggle('border-b-0', isSelected);
		el.classList.toggle('bg-bg-card', isSelected);
		el.classList.toggle('shadow-[var(--shadow-card)]', isSelected);
		el.classList.toggle('-mb-px', isSelected);
		el.classList.toggle('text-text-muted', !isSelected);
	});

	document.title = `${getCityName(payload.origin)} → ${getCityName(payload.destination)} | BusTrackerBo`;
}

applyDateFromUrl();
document.addEventListener('astro:page-load', applyDateFromUrl);
