export const USER_AGENT =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export class CookieJar {
	#cookies = new Map();

	merge(response) {
		const setCookies = response.headers.getSetCookie?.() ?? [];
		for (const cookie of setCookies) {
			const [pair] = cookie.split(';');
			const [name, ...valueParts] = pair.split('=');
			this.#cookies.set(name, valueParts.join('='));
		}
	}

	toString() {
		return [...this.#cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
	}
}

export async function fetchWithCookies(url, options = {}, jar = new CookieJar()) {
	const headers = {
		'User-Agent': USER_AGENT,
		'Accept-Language': 'es-BO,es;q=0.9,en;q=0.8',
		...options.headers,
	};

	if (jar.toString()) {
		headers.Cookie = jar.toString();
	}

	const response = await fetch(url, { ...options, headers });
	jar.merge(response);
	return { response, jar };
}
