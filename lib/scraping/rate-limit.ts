type SetIfAbsent = (key: string, value: string, mode: 'PX', ttlMs: number, condition: 'NX') => Promise<string | null>;

export function scrapeRateLimitMs(raw = process.env.SCRAPE_MIN_INTERVAL_MS): number {
  const parsed = Number(raw ?? 1000);
  return Number.isSafeInteger(parsed) && parsed >= 250 && parsed <= 60_000 ? parsed : 1000;
}

export async function reserveScrapeSlot(hostname: string, setIfAbsent: SetIfAbsent): Promise<boolean> {
  const key = `aiscrape:rate-limit:${hostname.toLowerCase()}`;
  return (await setIfAbsent(key, '1', 'PX', scrapeRateLimitMs(), 'NX')) === 'OK';
}
