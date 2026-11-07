import type { Sha1Hash } from '../Sha1Hash';

/** Driven port: computes the SHA-1 of a password, locally. */
export interface PasswordHasher {
  sha1(password: string): Promise<Sha1Hash>;
}
