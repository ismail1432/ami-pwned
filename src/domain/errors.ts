export class InvalidSha1HashError extends Error {
  constructor(value: string) {
    super(`"${value}" is not a valid SHA-1 hex digest.`);
    this.name = 'InvalidSha1HashError';
  }
}

/**
 * Raised by a BreachedPasswordRegistry adapter when the underlying source
 * cannot be reached or answers with something unusable.
 */
export class BreachRegistryUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'BreachRegistryUnavailableError';
  }
}

/**
 * Raised by the use case when the registry is unavailable (mirrors Symfony's RuntimeException
 * "Problem contacting the Have I been Pwned API.").
 */
export class CompromiseCheckFailedError extends Error {
  constructor(options?: { cause?: unknown }) {
    super('Problem contacting the breached password registry.', options);
    this.name = 'CompromiseCheckFailedError';
  }
}
