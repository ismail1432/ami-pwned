import { BreachRegistryUnavailableError } from '../src/domain/errors';
import type { BreachedPasswordRegistry } from '../src/domain/ports/BreachedPasswordRegistry';
import type { PasswordHasher } from '../src/domain/ports/PasswordHasher';
import { Sha1Hash } from '../src/domain/Sha1Hash';

/** Deterministic hasher: returns pre-registered digests, records calls. */
export class FakePasswordHasher implements PasswordHasher {
  readonly calls: string[] = [];

  constructor(private readonly digests: Record<string, string>) {}

  async sha1(password: string): Promise<Sha1Hash> {
    this.calls.push(password);
    const hex = this.digests[password];
    if (!hex) throw new Error(`No digest registered for "${password}"`);
    return Sha1Hash.fromHex(hex);
  }
}

/** In-memory registry built from full hashes → occurrences; records queried prefixes. */
export class InMemoryBreachedPasswordRegistry implements BreachedPasswordRegistry {
  readonly queriedPrefixes: string[] = [];

  constructor(private readonly breaches: Record<string, number> = {}) {}

  async occurrencesByPrefix(prefix: string): Promise<ReadonlyMap<string, number>> {
    this.queriedPrefixes.push(prefix);
    const range = new Map<string, number>();
    for (const [hex, count] of Object.entries(this.breaches)) {
      const hash = Sha1Hash.fromHex(hex);
      if (hash.prefix === prefix) range.set(hash.suffix, count);
    }
    return range;
  }
}

export class UnavailableBreachedPasswordRegistry implements BreachedPasswordRegistry {
  async occurrencesByPrefix(): Promise<ReadonlyMap<string, number>> {
    throw new BreachRegistryUnavailableError('down');
  }
}

export class BuggyBreachedPasswordRegistry implements BreachedPasswordRegistry {
  async occurrencesByPrefix(): Promise<ReadonlyMap<string, number>> {
    throw new RangeError('programming error');
  }
}
