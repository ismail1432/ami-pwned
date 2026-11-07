// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { WebCryptoSha1Hasher } from './WebCryptoSha1Hasher';

describe('WebCryptoSha1Hasher', () => {
  const hasher = new WebCryptoSha1Hasher();

  it.each([
    ['password', '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8'],
    ['', 'DA39A3EE5E6B4B0D3255BFEF95601890AFD80709'],
    ['naïve café password', 'A1CB9D3E3B3CE020968293B2ED3552E22BA38A30'],
  ])('hashes "%s" as UTF-8', async (password, expected) => {
    await expect(hasher.sha1(password).then(String)).resolves.toBe(expected);
  });
});
