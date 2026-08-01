import { assertPublicScrapeTarget, DnsLookup } from './target-policy';

type FetchResponse = {
  ok: boolean;
  status?: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
};
type FetchLike = (input: string, init?: RequestInit) => Promise<FetchResponse>;

type RobotsRule = { directive: 'allow' | 'disallow'; pattern: string };
type RobotsGroup = { agents: string[]; rules: RobotsRule[] };

function parseRobots(robots: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let group: RobotsGroup | null = null;
  let sawRule = false;

  for (const sourceLine of robots.split(/\r?\n/)) {
    const line = sourceLine.split('#', 1)[0].trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (key === 'user-agent') {
      if (!value) continue;
      if (!group || sawRule) {
        group = { agents: [], rules: [] };
        groups.push(group);
        sawRule = false;
      }
      group.agents.push(value.toLowerCase());
      continue;
    }
    if (!group || (key !== 'allow' && key !== 'disallow')) continue;
    sawRule = true;
    // An empty Disallow explicitly permits all paths; it is not a rule.
    if (value) group.rules.push({ directive: key, pattern: value });
  }
  return groups;
}

function matchingGroups(groups: RobotsGroup[], userAgent: string): RobotsGroup[] {
  const agent = userAgent.toLowerCase();
  let longest = 0;
  const matches = groups.filter((group) => {
    const groupLongest = Math.max(0, ...group.agents
      .filter((candidate) => candidate === '*' || agent.startsWith(candidate))
      .map((candidate) => candidate === '*' ? 0 : candidate.length));
    if (!groupLongest && !group.agents.includes('*')) return false;
    longest = Math.max(longest, groupLongest);
    return true;
  });
  return matches.filter((group) => group.agents.some((candidate) =>
    candidate === '*' ? longest === 0 : candidate.length === longest && agent.startsWith(candidate)));
}

function ruleMatches(path: string, pattern: string): boolean {
  const anchored = pattern.endsWith('$');
  const rawPattern = anchored ? pattern.slice(0, -1) : pattern;
  const body = rawPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`).test(path);
}

export function isAllowedByRobots(robots: string, target: URL, userAgent = 'AIScrape-Bot'): boolean {
  const rules = matchingGroups(parseRobots(robots), userAgent).flatMap((group) => group.rules);
  const path = `${target.pathname || '/'}${target.search}`;
  const matches = rules.filter((rule) => ruleMatches(path, rule.pattern));
  if (matches.length === 0) return true;
  matches.sort((left, right) => right.pattern.length - left.pattern.length ||
    (left.directive === 'allow' ? -1 : 1));
  return matches[0].directive === 'allow';
}

/**
 * Fetches with redirects handled explicitly, validating DNS immediately before
 * every hop. This gives robots and workflow HTTP calls the same SSRF boundary
 * as browser navigation.
 */
export async function fetchPublicUrl(
  initialUrl: string | URL,
  init: RequestInit = {},
  options: { fetchImpl?: FetchLike; lookup?: DnsLookup; maxRedirects?: number } = {},
): Promise<FetchResponse> {
  const fetchImpl = options.fetchImpl ?? (fetch as unknown as FetchLike);
  const maxRedirects = options.maxRedirects ?? 5;
  let current = new URL(initialUrl.toString());

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const targetError = await assertPublicScrapeTarget(current, { lookup: options.lookup });
    if (targetError) throw new Error(targetError);
    const response = await fetchImpl(current.toString(), { ...init, redirect: 'manual' });
    const location = response.headers.get('location');
    const isRedirect = !!response.status && response.status >= 300 && response.status < 400 && !!location;
    if (!isRedirect) return response;
    if (redirects === maxRedirects) throw new Error('Too many redirects while fetching target');
    current = new URL(location!, current);
  }
  throw new Error('Too many redirects while fetching target');
}

export async function assertRobotsAllowed(
  target: URL,
  fetchImpl?: FetchLike,
  lookup?: DnsLookup,
): Promise<string | null> {
  const mode = process.env.SCRAPE_ROBOTS_MODE ?? 'strict';
  if (mode === 'off') return null;
  try {
    const response = await fetchPublicUrl(`${target.protocol}//${target.host}/robots.txt`, {
      signal: AbortSignal.timeout(5_000),
    }, { fetchImpl, lookup });
    if (!response.ok) return mode === 'strict' ? 'Could not retrieve robots.txt' : null;
    return isAllowedByRobots(await response.text(), target) ? null : 'robots.txt disallows this target path';
  } catch {
    return mode === 'strict' ? 'Could not retrieve robots.txt' : null;
  }
}
