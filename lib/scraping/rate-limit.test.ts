import { reserveScrapeSlot, scrapeRateLimitMs } from './rate-limit';

describe('scrape rate limit', () => {
  it('uses a bounded conservative default', () => {
    expect(scrapeRateLimitMs(undefined)).toBe(1000);
    expect(scrapeRateLimitMs('10')).toBe(1000);
    expect(scrapeRateLimitMs('500')).toBe(500);
  });

  it('reserves a single Redis slot per host', async () => {
    const set = jest.fn().mockResolvedValue('OK');
    await expect(reserveScrapeSlot('Example.COM', set)).resolves.toBe(true);
    expect(set).toHaveBeenCalledWith('aiscrape:rate-limit:example.com', '1', 'PX', 1000, 'NX');
  });
});
