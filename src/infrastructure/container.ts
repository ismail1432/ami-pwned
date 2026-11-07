import { CheckPasswordCompromise } from '../domain/CheckPasswordCompromise';
import type { CheckPassword } from '../domain/ports/CheckPassword';
import { ExtensionMessagingRegistry, type SendMessage } from './messaging/ExtensionMessagingRegistry';
import { WebCryptoSha1Hasher } from './WebCryptoSha1Hasher';

/**
 * Composition root: the only place wiring concrete adapters into the domain.
 * (The background worker builds its own HibpRangeClient, the registry behind the messaging bridge.)
 */

/** Content script: hashes in the page, delegates the range lookup to the background worker. */
export function createContentScriptCheck(sendMessage: SendMessage): CheckPassword {
  const useCase = new CheckPasswordCompromise(new WebCryptoSha1Hasher(), new ExtensionMessagingRegistry(sendMessage));
  return (password) => useCase.execute(password);
}
