import { BreachRegistryUnavailableError, CompromiseCheckFailedError } from './errors';
import type { BreachedPasswordRegistry } from './ports/BreachedPasswordRegistry';
import type { PasswordHasher } from './ports/PasswordHasher';
import type { Verdict } from './Verdict';

/**
 * Use case (driving port), port of Symfony's NotCompromisedPasswordValidator:
 *  1. empty password → nothing to check
 *  2. SHA-1 the password locally
 *  3. ask the registry for every hash sharing the 5-char prefix
 *  4. look the suffix up locally: any occurrence means compromised
 */
export class CheckPasswordCompromise {
  constructor(
    private readonly hasher: PasswordHasher,
    private readonly registry: BreachedPasswordRegistry,
  ) {}

  async execute(password: string): Promise<Verdict> {
    if (password === '') {
      return { kind: 'skipped', reason: 'empty-password' };
    }

    const hash = await this.hasher.sha1(password);

    let range: ReadonlyMap<string, number>;
    try {
      range = await this.registry.occurrencesByPrefix(hash.prefix);
    } catch (error) {
      if (error instanceof BreachRegistryUnavailableError) {
        throw new CompromiseCheckFailedError({ cause: error });
      }
      throw error;
    }

    const occurrences = range.get(hash.suffix) ?? 0;

    return occurrences > 0 ? { kind: 'compromised', occurrences } : { kind: 'not-compromised' };
  }
}
