import { InvalidSha1HashError } from './errors';

/**
 * SHA-1 digest of a password, as used by the k-anonymity range model:
 * only the first 5 hex chars (prefix) ever leave the device, the remaining
 * 35 (suffix) are compared locally.
 */
export class Sha1Hash {
  static readonly PREFIX_LENGTH = 5;

  private constructor(private readonly hex: string) {}

  static fromHex(hex: string): Sha1Hash {
    const normalized = hex.toUpperCase();
    if (!/^[0-9A-F]{40}$/.test(normalized)) {
      throw new InvalidSha1HashError(hex);
    }
    return new Sha1Hash(normalized);
  }

  get prefix(): string {
    return this.hex.slice(0, Sha1Hash.PREFIX_LENGTH);
  }

  get suffix(): string {
    return this.hex.slice(Sha1Hash.PREFIX_LENGTH);
  }

  toString(): string {
    return this.hex;
  }
}
