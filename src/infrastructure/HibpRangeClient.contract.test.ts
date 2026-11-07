// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CheckPasswordCompromise } from '../domain/CheckPasswordCompromise';
import { HibpRangeClient } from './HibpRangeClient';
import { WebCryptoSha1Hasher } from './WebCryptoSha1Hasher';

/**
 * Hits the real HIBP API. Opt-in only: `npm run test:contract`.
 */
describe.runIf(process.env.HIBP_CONTRACT)('HIBP contract', () => {
  const useCase = new CheckPasswordCompromise(new WebCryptoSha1Hasher(), new HibpRangeClient());

  it('flags "password" as heavily compromised', async () => {
    const verdict = await useCase.execute('password');

    expect(verdict.kind).toBe('compromised');
    expect(verdict.kind === 'compromised' && verdict.occurrences).toBeGreaterThan(1_000_000);
  });

  it('does not flag a random password', async () => {
    const random = crypto.randomUUID() + crypto.randomUUID();

    await expect(useCase.execute(random)).resolves.toEqual({ kind: 'not-compromised' });
  });
});
