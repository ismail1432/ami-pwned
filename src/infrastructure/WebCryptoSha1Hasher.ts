import type { PasswordHasher } from '../domain/ports/PasswordHasher';
import { Sha1Hash } from '../domain/Sha1Hash';

/** PasswordHasher adapter backed by the Web Crypto API (available in extensions, browsers and Node ≥ 19). */
export class WebCryptoSha1Hasher implements PasswordHasher {
  constructor(private readonly subtle: SubtleCrypto = globalThis.crypto.subtle) {}

  async sha1(password: string): Promise<Sha1Hash> {
    const digest = await this.subtle.digest('SHA-1', new TextEncoder().encode(password));
    const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    return Sha1Hash.fromHex(hex);
  }
}
