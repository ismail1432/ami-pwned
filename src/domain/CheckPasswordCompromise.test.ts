import { describe, expect, it } from 'vitest';
import {
  BuggyBreachedPasswordRegistry,
  FakePasswordHasher,
  InMemoryBreachedPasswordRegistry,
  UnavailableBreachedPasswordRegistry,
} from '../../test/doubles';
import { CheckPasswordCompromise } from './CheckPasswordCompromise';
import { CompromiseCheckFailedError } from './errors';

// Real SHA-1 digests, so fixtures stay meaningful.
const PASSWORD_HASH = '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8'; // "password"
const STRONG_HASH = '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD9'; // same prefix, different suffix

const hasher = () => new FakePasswordHasher({ password: PASSWORD_HASH, 'correct horse': STRONG_HASH });

describe('CheckPasswordCompromise', () => {
  it('reports a breached password with its number of occurrences', async () => {
    const useCase = new CheckPasswordCompromise(hasher(), new InMemoryBreachedPasswordRegistry({ [PASSWORD_HASH]: 42 }));

    await expect(useCase.execute('password')).resolves.toEqual({ kind: 'compromised', occurrences: 42 });
  });

  it('reports a password absent from the range as not compromised', async () => {
    const useCase = new CheckPasswordCompromise(hasher(), new InMemoryBreachedPasswordRegistry({ [PASSWORD_HASH]: 42 }));

    await expect(useCase.execute('correct horse')).resolves.toEqual({ kind: 'not-compromised' });
  });

  it('only sends the 5-char hash prefix to the registry', async () => {
    const registry = new InMemoryBreachedPasswordRegistry();
    await new CheckPasswordCompromise(hasher(), registry).execute('password');

    expect(registry.queriedPrefixes).toEqual(['5BAA6']);
  });

  it('skips empty passwords without hashing nor calling the registry', async () => {
    const fakeHasher = hasher();
    const registry = new InMemoryBreachedPasswordRegistry();

    const verdict = await new CheckPasswordCompromise(fakeHasher, registry).execute('');

    expect(verdict).toEqual({ kind: 'skipped', reason: 'empty-password' });
    expect(fakeHasher.calls).toEqual([]);
    expect(registry.queriedPrefixes).toEqual([]);
  });

  it('is compromised from a single occurrence', async () => {
    const useCase = new CheckPasswordCompromise(hasher(), new InMemoryBreachedPasswordRegistry({ [PASSWORD_HASH]: 1 }));

    await expect(useCase.execute('password')).resolves.toEqual({ kind: 'compromised', occurrences: 1 });
  });

  describe('when the registry is unavailable', () => {
    it('throws CompromiseCheckFailedError, keeping the cause', async () => {
      const useCase = new CheckPasswordCompromise(hasher(), new UnavailableBreachedPasswordRegistry());

      const error = await useCase.execute('password').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(CompromiseCheckFailedError);
      expect((error as Error).cause).toBeInstanceOf(Error);
    });

    it('does not wrap unexpected errors (bugs)', async () => {
      const useCase = new CheckPasswordCompromise(hasher(), new BuggyBreachedPasswordRegistry());

      await expect(useCase.execute('password')).rejects.toThrow(RangeError);
    });
  });
});
