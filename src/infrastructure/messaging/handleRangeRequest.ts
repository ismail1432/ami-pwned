import type { BreachedPasswordRegistry } from '../../domain/ports/BreachedPasswordRegistry';
import type { RangeRequest, RangeResponse } from './rangeMessages';

/** Background side: answers a RangeRequest using any registry (HIBP in production). Never throws. */
export async function handleRangeRequest(
  registry: BreachedPasswordRegistry,
  request: RangeRequest,
): Promise<RangeResponse> {
  try {
    const occurrences = await registry.occurrencesByPrefix(request.prefix);
    return { ok: true, occurrences: [...occurrences] };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
