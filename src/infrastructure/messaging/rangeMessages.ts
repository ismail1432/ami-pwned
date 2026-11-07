/**
 * Message contract between content scripts and the background service worker.
 * Only the 5-char SHA-1 prefix ever crosses this boundary, never the password.
 * Payloads must be JSON-serializable (no Map), hence the entries array.
 */
export interface RangeRequest {
  readonly type: 'ami-pwned:range';
  readonly prefix: string;
}

export type RangeResponse =
  | { readonly ok: true; readonly occurrences: ReadonlyArray<readonly [string, number]> }
  | { readonly ok: false; readonly error: string };

export const rangeRequest = (prefix: string): RangeRequest => ({ type: 'ami-pwned:range', prefix });

export function isRangeRequest(message: unknown): message is RangeRequest {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as RangeRequest).type === 'ami-pwned:range' &&
    typeof (message as RangeRequest).prefix === 'string'
  );
}

export function isRangeResponse(message: unknown): message is RangeResponse {
  if (typeof message !== 'object' || message === null) return false;
  const response = message as RangeResponse;
  if (response.ok === false) return typeof response.error === 'string';
  return (
    response.ok === true &&
    Array.isArray(response.occurrences) &&
    response.occurrences.every(
      (entry) => Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'number',
    )
  );
}
