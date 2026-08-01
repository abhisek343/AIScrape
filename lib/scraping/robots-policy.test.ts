import { assertRobotsAllowed, fetchPublicUrl, isAllowedByRobots } from './robots-policy';

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
      .mockResolvedValueOnce({ ok: false, status: 302, headers: { get: () => 'https://private.example/robots.txt' }, text: async () => '' });
    await expect(fetchPublicUrl('https://example.com/robots.txt', {}, {
      fetchImpl,
      lookup: async (host) => [{ address: host === 'private.example' ? '127.0.0.1' : '93.184.216.34', family: 4 }],
    })).rejects.toThrow('resolves');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('blocks paths disallowed for the wildcard agent', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200, headers: { get: () => null }, text: async () => 'User-agent: *\nDisallow: /private' });
    await expect(assertRobotsAllowed(new URL('https://example.com/private/a'), fetchImpl, publicLookup)).resolves.toContain('disallows');
  });
});
