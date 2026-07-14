import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../..');
const pricesPath = path.join(rootDir, 'data/prices.txt');

export const PRICES_HEADER =
	'# fetched_at\torigin_slug\tdestination_slug\ttravel_date\toperator\tprice_bob\tcurrency\tsource\n';

export function ensureHeader(content) {
	if (!content.startsWith('#')) {
		return PRICES_HEADER + content;
	}
	return content.endsWith('\n') ? content : `${content}\n`;
}

export function appendPriceRows(rows, filePath = pricesPath) {
	const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
	const body = rows.map((row) => row.join('\t')).join('\n');
	fs.writeFileSync(filePath, ensureHeader(existing) + `${body}\n`, 'utf-8');
}
