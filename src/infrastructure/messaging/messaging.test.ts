import { describe, expect, it, vi } from 'vitest';
import { InMemoryBreachedPasswordRegistry, UnavailableBreachedPasswordRegistry } from '../../../test/doubles';
import { BreachRegistryUnavailableError } from '../../domain/errors';
import { ExtensionMessagingRegistry, type SendMessage } from './ExtensionMessagingRegistry';
import { handleRangeRequest } from './handleRangeRequest';
import { isRangeRequest, rangeRequest } from './rangeMessages';

const PASSWORD_HASH = '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8';

describe('handleRangeRequest (background side)', () => {
  it('answers with the range entries', async () => {
    const response = await handleRangeRequest(
      new InMemoryBreachedPasswordRegistry({ [PASSWORD_HASH]: 7 }),
      rangeRequest('5BAA6'),
    );

    expect(response).toEqual({ ok: true, occurrences: [['1E4C9B93F3F0682250B6CF8331B7EE68FD8', 7]] });
  });

  it('turns registry failures into an error response instead of throwing', async () => {
    const response = await handleRangeRequest(new UnavailableBreachedPasswordRegistry(), rangeRequest('5BAA6'));

    expect(response).toEqual({ ok: false, error: 'down' });
  });
});

describe('isRangeRequest', () => {
  it.each([null, 'x', {}, { type: 'other', prefix: '5BAA6' }, { type: 'ami-pwned:range' }])(
    'rejects foreign message %j',
    (message) => {
      expect(isRangeRequest(message)).toBe(false);
    },
  );

  it('accepts our request', () => {
    expect(isRangeRequest(rangeRequest('5BAA6'))).toBe(true);
  });
});

describe('ExtensionMessagingRegistry (content script side)', () => {
  it('sends only the prefix and rebuilds the map from the response', async () => {
    const sendMessage = vi.fn<SendMessage>(async () => ({ ok: true, occurrences: [['ABC', 3]] }));

    const range = await new ExtensionMessagingRegistry(sendMessage).occurrencesByPrefix('5BAA6');

    expect(sendMessage).toHaveBeenCalledWith({ type: 'ami-pwned:range', prefix: '5BAA6' });
    expect(range).toEqual(new Map([['ABC', 3]]));
  });

  it.each<[string, SendMessage]>([
    ['error response', async () => ({ ok: false, error: 'HTTP 503' })],
    ['no listener (undefined response)', async () => undefined],
    ['malformed response', async () => ({ ok: true, occurrences: 'nope' })],
    ['messaging failure', async () => Promise.reject(new Error('Extension context invalidated.'))],
  ])('raises BreachRegistryUnavailableError on %s', async (_, sendMessage) => {
    await expect(new ExtensionMessagingRegistry(sendMessage).occurrencesByPrefix('5BAA6')).rejects.toBeInstanceOf(
      BreachRegistryUnavailableError,
    );
  });

  it('round-trips through a JSON-serializing channel, like chrome.runtime messaging', async () => {
    const background = new InMemoryBreachedPasswordRegistry({ [PASSWORD_HASH]: 42 });
    const channel: SendMessage = async (message) =>
      JSON.parse(JSON.stringify(await handleRangeRequest(background, JSON.parse(JSON.stringify(message)))));

    const range = await new ExtensionMessagingRegistry(channel).occurrencesByPrefix('5BAA6');

    expect(range.get('1E4C9B93F3F0682250B6CF8331B7EE68FD8')).toBe(42);
  });
});
