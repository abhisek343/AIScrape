import { assertPublicScrapeTarget, isBlockedAddress, resolvePublicScrapeTarget, validateScrapeTarget } from './target-policy';

describe('scrape target policy', () => {
  it.each(['file:///etc/passwd', 'http://127.0.0.1:3000', 'http://10.0.0.1', 'http://169.254.169.254/latest/meta-data'])
    ('rejects unsafe target %s', (target) => expect(validateScrapeTarget(target)).toBeTruthy());

  it('supports an explicit public host allowlist', () => {
    expect(validateScrapeTarget('https://example.com/path', 'example.com')).toBeNull();
    expect(validateScrapeTarget('https://not-example.com', 'example.com')).toContain('not in');
  });

  it.each(['127.0.0.1', '169.254.169.254', '192.0.2.1', '198.18.0.1', '::1', 'fe80::1', 'fc00::1', '2001:db8::1'])
    ('blocks private, link-local, and reserved address %s', (address) => expect(isBlockedAddress(address)).toBe(true));

  it('fails closed when DNS resolves a public hostname to a private address', async () => {
    await expect(assertPublicScrapeTarget('https://rebind.example', {
      lookup: async () => [{ address: '10.0.0.8', family: 4 }],
    })).resolves.toContain('resolves');
  });

  it('accepts only public answers for DNS names', async () => {
    await expect(assertPublicScrapeTarget('https://public.example', {
      lookup: async () => [{ address: '93.184.216.34', family: 4 }, { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 }],
    })).resolves.toBeNull();
  });

  it('returns the public address that the transport must pin', async () => {
    await expect(resolvePublicScrapeTarget('https://public.example', {
      lookup: async () => [{ address: '93.184.216.34', family: 4 }],
    })).resolves.toMatchObject({ address: '93.184.216.34', family: 4 });
  });
});
