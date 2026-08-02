import { Readable } from 'node:stream';
import {
  assertRobotsAllowed,
  fetchPublicUrl,
  isAllowedByRobots,
  MAX_ROBOTS_RESPONSE_BYTES,
  readBoundedResponseText,
} from './robots-policy';

const publicLookup = async () => [{ address: '93.184.216.34', family: 4 as const }];

describe('robots policy', () => {
  it('uses the most specific matching user agent group', () => {
    const robots = `User-agent: *\nAllow: /\n\nUser-agent: AIScrape-Bot\nDisallow: /private\nAllow: /public`;
    expect(isAllowedByRobots(robots, new URL('https://example.com/public'), 'AIScrape-Bot/1.0')).toBe(true);
    expect(isAllowedByRobots(robots, new URL('https://example.com/private'), 'AIScrape-Bot/1.0')).toBe(false);
  });

  it('uses the shared browser/HTTP user-agent by default', () => {
    const robots = 'User-agent: AIScrape-Bot/1.0 (Security-Enhanced)\nDisallow: /private';
    expect(isAllowedByRobots(robots, new URL('https://example.com/private'))).toBe(false);
  });

  it('uses longest rule match and lets Allow win equal-length ties', () => {
    const robots = `User-agent: *\nDisallow: /private\nAllow: /private/public\nDisallow: /same\nAllow: /same`;
    expect(isAllowedByRobots(robots, new URL('https://example.com/private/file'))).toBe(false);
    expect(isAllowedByRobots(robots, new URL('https://example.com/private/public/file'))).toBe(true);
    expect(isAllowedByRobots(robots, new URL('https://example.com/same'))).toBe(true);
  });

  it('honors wildcard and end-anchor patterns', () => {
    const robots = 'User-agent: *\nDisallow: /*.pdf$';
    expect(isAllowedByRobots(robots, new URL('https://example.com/a.pdf'))).toBe(false);
    expect(isAllowedByRobots(robots, new URL('https://example.com/a.pdf?download=1'))).toBe(true);
  });

  it('follows only redirects whose destinations still resolve publicly', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 302,
        headers: { get: () => 'https://private.example/robots.txt' },
        text: jest.fn(async () => ''),
        discardBody: jest.fn(),
      });
    await expect(fetchPublicUrl('https://example.com/robots.txt', {}, {
      fetchImpl,
      lookup: async (host) => [{ address: host === 'private.example' ? '127.0.0.1' : '93.184.216.34', family: 4 }],
    })).rejects.toThrow('resolves');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('drains redirect responses without reading their untrusted body', async () => {
    const text = jest.fn(async () => 'this body must not be read');
    const discardBody = jest.fn();
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 302, headers: { get: () => 'https://public.example/next' }, text, discardBody })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: { get: () => null }, text: async () => 'ok' });

    const result = await fetchPublicUrl('https://example.com/start', {}, {
      fetchImpl,
      lookup: publicLookup,
    });

    await expect(result.text()).resolves.toBe('ok');
    expect(discardBody).toHaveBeenCalledTimes(1);
    expect(text).not.toHaveBeenCalled();
  });

  it('rejects a chunked body before retaining chunks beyond its configured limit', async () => {
    let chunksRead = 0;
    const stream = Readable.from((function* () {
      for (const chunk of ['abc', 'def', 'ghi']) {
        chunksRead += 1;
        yield Buffer.from(chunk);
      }
    })());
    const headers = { get: () => null };

    await expect(readBoundedResponseText(stream as any, headers, 5)).rejects.toThrow('5-byte limit');
    expect(chunksRead).toBeLessThanOrEqual(3);
  });

  it('fails closed when robots.txt declares a body over its bounded limit', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? String(MAX_ROBOTS_RESPONSE_BYTES + 1) : null },
      text: async () => 'ignored',
    });
    await expect(assertRobotsAllowed(new URL('https://example.com/'), fetchImpl, publicLookup)).resolves.toBe('Could not retrieve robots.txt');
  });

  it('blocks paths disallowed for the wildcard agent', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200, headers: { get: () => null }, text: async () => 'User-agent: *\nDisallow: /private' });
    await expect(assertRobotsAllowed(new URL('https://example.com/private/a'), fetchImpl, publicLookup)).resolves.toContain('disallows');
  });
});
