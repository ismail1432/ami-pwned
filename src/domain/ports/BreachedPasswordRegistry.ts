/**
 * Driven port: a source of breached password hashes queried by prefix
 * (k-anonymity). Returns, for every known hash starting with `prefix`,
 * its 35-char uppercase suffix mapped to the number of times it was seen.
 *
 * Adapters must throw BreachRegistryUnavailableError on any I/O failure.
 */
export interface BreachedPasswordRegistry {
  occurrencesByPrefix(prefix: string): Promise<ReadonlyMap<string, number>>;
}
