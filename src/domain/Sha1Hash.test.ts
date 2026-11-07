import { describe, expect, it } from 'vitest';
import { InvalidSha1HashError } from './errors';
import { Sha1Hash } from './Sha1Hash';

describe('Sha1Hash', () => {
  it('splits the digest into a 5-char prefix and a 35-char suffix', () => {
    const hash = Sha1Hash.fromHex('5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8');

    expect(hash.prefix).toBe('5BAA6');
    expect(hash.suffix).toBe('1E4C9B93F3F0682250B6CF8331B7EE68FD8');
  });

  it('normalizes to uppercase', () => {
    expect(Sha1Hash.fromHex('5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8').toString()).toBe(
      '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8',
    );
  });

  it.each(['', 'ABC', '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD', '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FDZ'])(
    'rejects "%s"',
    (hex) => {
      expect(() => Sha1Hash.fromHex(hex)).toThrow(InvalidSha1HashError);
    },
  );
});
