import { describe, expect, it, vi } from 'vitest';
import { BreachRegistryUnavailableError } from '../domain/errors';
import { type FetchFn, HibpRangeClient, parseRangeBody } from './HibpRangeClient';

const respond = (body: string, status = 200): FetchFn => vi.fn(async () => new Response(body, { status }));

describe('HibpRangeClient', () => {
  it('calls the range endpoint with the prefix and asks for padding', async () => {
    const fetchFn = respond('');
    await new HibpRangeClient(fetchFn).occurrencesByPrefix('5BAA6');

    expect(fetchFn).toHaveBeenCalledWith('https://api.pwnedpasswords.com/range/5BAA6', {
      headers: { 'Add-Padding': 'true' },
    });
  });

  it('supports a custom endpoint', async () => {
    const fetchFn = respond('');
    await new HibpRangeClient(fetchFn, 'https://mirror.internal/pwned/{prefix}').occurrencesByPrefix('ABCDE');

    expect(fetchFn).toHaveBeenCalledWith('https://mirror.internal/pwned/ABCDE', expect.anything());
  });

  it('maps suffixes to occurrences', async () => {
    const body = '1E4C9B93F3F0682250B6CF8331B7EE68FD8:10434004\r\n011053FD0102E94D6AE2F8B83D76FAF94F6:1\r\n';

    const range = await new HibpRangeClient(respond(body)).occurrencesByPrefix('5BAA6');

    expect(range).toEqual(
      new Map([
        ['1E4C9B93F3F0682250B6CF8331B7EE68FD8', 10434004],
        ['011053FD0102E94D6AE2F8B83D76FAF94F6', 1],
      ]),
    );
  });

  it.each([
    ['HTTP error', respond('Too many requests', 429)],
    ['network failure', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch')))],
  ])('wraps %s into BreachRegistryUnavailableError', async (_, fetchFn) => {
    await expect(new HibpRangeClient(fetchFn).occurrencesByPrefix('5BAA6')).rejects.toBeInstanceOf(
      BreachRegistryUnavailableError,
    );
  });

  it.each(['5baa6', '5BAA', '5BAA61', 'ZZZZZ'])('refuses to send a malformed prefix "%s"', async (prefix) => {
    const fetchFn = respond('');

    await expect(new HibpRangeClient(fetchFn).occurrencesByPrefix(prefix)).rejects.toThrow(TypeError);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('parseRangeBody', () => {
  it('drops padding entries (count 0), blank and malformed lines, and uppercases suffixes', () => {
    const body = [
      '1e4c9b93f3f0682250b6cf8331b7ee68fd8:3',
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:0',
      '',
      'garbage',
      'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB:notanumber',
    ].join('\n');

    expect(parseRangeBody(body)).toEqual(new Map([['1E4C9B93F3F0682250B6CF8331B7EE68FD8', 3]]));
  });
});
