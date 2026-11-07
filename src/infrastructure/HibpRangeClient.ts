import { BreachRegistryUnavailableError } from '../domain/errors';
import type { BreachedPasswordRegistry } from '../domain/ports/BreachedPasswordRegistry';

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

export const HIBP_RANGE_ENDPOINT = 'https://api.pwnedpasswords.com/range/{prefix}';

/**
 * BreachedPasswordRegistry adapter for the Have I Been Pwned "range" API.
 * https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange
 *
 * Like Symfony, the endpoint is configurable (self-hosted mirror, tests…).
 * "Add-Padding" asks HIBP to pad the response with fake 0-count entries so
 * the response size does not leak the prefix; those entries are dropped here.
 */
export class HibpRangeClient implements BreachedPasswordRegistry {
  constructor(
    private readonly fetchFn: FetchFn = (url, init) => globalThis.fetch(url, init),
    private readonly endpoint: string = HIBP_RANGE_ENDPOINT,
  ) {}

  async occurrencesByPrefix(prefix: string): Promise<ReadonlyMap<string, number>> {
    if (!/^[0-9A-F]{5}$/.test(prefix)) {
      throw new TypeError(`Expected a 5-char uppercase hex prefix, got "${prefix}".`);
    }

    const url = this.endpoint.replace('{prefix}', prefix);

    let response: Response;
    let body: string;
    try {
      response = await this.fetchFn(url, { headers: { 'Add-Padding': 'true' } });
      body = await response.text();
    } catch (error) {
      throw new BreachRegistryUnavailableError(`Could not reach ${url}.`, { cause: error });
    }

    if (!response.ok) {
      throw new BreachRegistryUnavailableError(`${url} answered HTTP ${response.status}.`);
    }

    return parseRangeBody(body);
  }
}

/** Parses "SUFFIX:COUNT" lines; ignores blank lines and padding (count 0). */
export function parseRangeBody(body: string): ReadonlyMap<string, number> {
  const occurrences = new Map<string, number>();

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '') continue;

    const [suffix, count] = line.split(':');
    const occurrenceCount = Number.parseInt(count ?? '', 10);
    if (!suffix || !Number.isFinite(occurrenceCount) || occurrenceCount <= 0) continue;

    occurrences.set(suffix.toUpperCase(), occurrenceCount);
  }

  return occurrences;
}
