import { lookup as dnsLookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * URL validation for every outbound scrape request.  Hostname validation alone
 * is not sufficient: an attacker can point a public DNS name at a private
 * address after validation (DNS rebinding).  Call assertPublicScrapeTarget
 * immediately before each network request as well as before navigation.
 */
const BLOCKED_HOSTS = new Set(['localhost', 'localhost.localdomain', 'ip6-localhost']);

export type DnsRecord = { address: string; family: 4 | 6 };
export type DnsLookup = (hostname: string) => Promise<DnsRecord[]>;
export type ResolvedScrapeTarget = {
  url: URL;
  address: string;
  family: 4 | 6;
};

const defaultLookup: DnsLookup = async (hostname) =>
  (await dnsLookup(hostname, { all: true, verbatim: true })) as DnsRecord[];

function ipv4Number(address: string): number | null {
  const parts = address.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return null;
  const octets = parts.map(Number);
  if (octets.some((part) => part > 255)) return null;
  return (((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3]) >>> 0;
}

function inIpv4Range(address: string, start: string, prefix: number): boolean {
  const value = ipv4Number(address);
  const rangeStart = ipv4Number(start);
  if (value === null || rangeStart === null) return true;
  const mask = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0);
  return (value & mask) === (rangeStart & mask);
}

function isBlockedIpv4(address: string): boolean {
  // RFC 1918, loopback, link-local, carrier-grade NAT, documentation/test,
  // benchmarking, multicast, and reserved ranges must never be scrape targets.
  const blockedRanges: Array<[string, number]> = [
    ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
    ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24],
    ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
    ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
    ['224.0.0.0', 4], ['240.0.0.0', 4],
  ];
  return blockedRanges.some(([start, prefix]) => inIpv4Range(address, start, prefix));
}

function expandIpv6(address: string): number[] | null {
  const normalized = address.toLowerCase().split('%')[0];
  const [left, right] = normalized.split('::');
  if (normalized.split('::').length > 2) return null;
  const leftParts = left ? left.split(':') : [];
  const rightParts = right ? right.split(':') : [];
  const parts = [...leftParts, ...rightParts];
  if (parts.some((part) => !/^[0-9a-f]{0,4}$/.test(part))) return null;
  const missing = 8 - parts.length;
  if ((normalized.includes('::') && missing < 1) || (!normalized.includes('::') && parts.length !== 8)) return null;
  return [...leftParts, ...Array(Math.max(0, missing)).fill('0'), ...rightParts].map((part) => parseInt(part || '0', 16));
}

function isBlockedIpv6(address: string): boolean {
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return isBlockedIpv4(mapped[1]);
  const segments = expandIpv6(address);
  if (!segments) return true;
  const first = segments[0];
  const allZero = segments.every((segment) => segment === 0);
  const loopback = segments.slice(0, 7).every((segment) => segment === 0) && segments[7] === 1;
  // ::/128, ::1/128, fc00::/7 (ULA), fe80::/10 (link-local), ff00::/8
  // (multicast), and the IPv6 documentation range are non-public.
  return allZero || loopback || (first & 0xfe00) === 0xfc00 ||
    (first & 0xffc0) === 0xfe80 || (first & 0xff00) === 0xff00 ||
    (first === 0x2001 && segments[1] === 0x0db8);
}

export function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isBlockedIpv4(address);
  if (family === 6) return isBlockedIpv6(address);
  return true;
}

export function validateScrapeTarget(rawUrl: string, allowedHosts = process.env.SCRAPE_ALLOWED_HOSTS): string | null {
  if (!rawUrl || rawUrl.length > 2048) return 'URL is missing or exceeds 2048 characters';
  let url: URL;
  try { url = new URL(rawUrl.trim()); } catch { return 'Invalid URL format'; }
  if (!['http:', 'https:'].includes(url.protocol)) return 'Only HTTP and HTTPS targets are permitted';
  if (url.username || url.password) return 'URLs with embedded credentials are forbidden';
  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname) || (isIP(hostname) && isBlockedAddress(hostname))) {
    return 'Private, loopback, link-local, and reserved targets are forbidden';
  }

  const allowed = allowedHosts?.split(',').map(host => host.trim().toLowerCase()).filter(Boolean) ?? [];
  if (allowed.length > 0 && !allowed.includes(hostname)) return 'Target host is not in SCRAPE_ALLOWED_HOSTS';
  return null;
}

/** Resolve a target and return the exact public address to which the connection must bind. */
export async function resolvePublicScrapeTarget(
  rawUrl: string | URL,
  options: { allowedHosts?: string; lookup?: DnsLookup } = {},
): Promise<ResolvedScrapeTarget | string> {
  const value = rawUrl instanceof URL ? rawUrl.toString() : rawUrl;
  const syntaxError = validateScrapeTarget(value, options.allowedHosts);
  if (syntaxError) return syntaxError;
  const target = rawUrl instanceof URL ? rawUrl : new URL(rawUrl.trim());

  const literalFamily = isIP(target.hostname);
  if (literalFamily) {
    return { url: target, address: target.hostname, family: literalFamily as 4 | 6 };
  }
  try {
    const records = await (options.lookup ?? defaultLookup)(target.hostname);
    if (records.length === 0 || records.some((record) => isBlockedAddress(record.address))) {
      return 'Target resolves to a private, loopback, link-local, or reserved address';
    }
    return { url: target, address: records[0].address, family: records[0].family };
  } catch {
    // Fail closed rather than falling back to a browser or fetch DNS lookup.
    return 'Target hostname could not be safely resolved';
  }
}

/** Resolve and reject any non-public answer. Re-run for each request/redirect. */
export async function assertPublicScrapeTarget(
  rawUrl: string | URL,
  options: { allowedHosts?: string; lookup?: DnsLookup } = {},
): Promise<string | null> {
  const result = await resolvePublicScrapeTarget(rawUrl, options);
  return typeof result === 'string' ? result : null;
}
