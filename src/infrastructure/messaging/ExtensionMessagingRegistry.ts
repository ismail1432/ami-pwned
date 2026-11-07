import { BreachRegistryUnavailableError } from '../../domain/errors';
import type { BreachedPasswordRegistry } from '../../domain/ports/BreachedPasswordRegistry';
import { isRangeResponse, type RangeRequest, rangeRequest } from './rangeMessages';

export type SendMessage = (message: RangeRequest) => Promise<unknown>;

/**
 * BreachedPasswordRegistry adapter for content scripts: delegates the range
 * lookup to the background service worker through extension messaging
 * (in production: `chrome.runtime.sendMessage`).
 */
export class ExtensionMessagingRegistry implements BreachedPasswordRegistry {
  constructor(private readonly sendMessage: SendMessage) {}

  async occurrencesByPrefix(prefix: string): Promise<ReadonlyMap<string, number>> {
    let response: unknown;
    try {
      response = await this.sendMessage(rangeRequest(prefix));
    } catch (error) {
      throw new BreachRegistryUnavailableError('Background worker unreachable.', { cause: error });
    }

    if (!isRangeResponse(response)) {
      throw new BreachRegistryUnavailableError('Malformed response from background worker.');
    }
    if (!response.ok) {
      throw new BreachRegistryUnavailableError(response.error);
    }

    return new Map(response.occurrences);
  }
}
