import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { IncomingMessage } from 'node:http';
import { DnsLookup, resolvePublicScrapeTarget, ResolvedScrapeTarget } from './target-policy';
import { SCRAPE_USER_AGENT } from './user-agent';
import { readBoundedResponseText as readFetchResponseText } from './response-body';

type FetchResponse = {
  ok: boolean;
  status?: number;
  headers: { get(name: string): string | null };
  body?: ReadableStream<Uint8Array> | null;
  text(): Promise<string>;
  /** Drain a response that will not be read (for example, a redirect body). */
  discardBody?(): void;
};
type FetchInit = RequestInit & { dispatcher?: unknown };
type FetchLike = (input: string, init?: FetchInit) => Promise<FetchResponse>;

type RobotsRule = { directive: 'allow' | 'disallow'; pattern: string };
type RobotsGroup = { agents: string[]; rules: RobotsRule[] };

export const DEFAULT_PUBLIC_RESPONSE_BYTES = 50 * 1024 * 1024;
export const MAX_ROBOTS_RESPONSE_BYTES = 512 * 1024;

export class PublicResponseTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Response exceeds the ${maxBytes}-byte limit`);
    this.name = 'PublicResponseTooLargeError';
  }
}

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

export function isAllowedByRobots(robots: string, target: URL, userAgent = SCRAPE_USER_AGENT): boolean {
  const rules = matchingGroups(parseRobots(robots), userAgent).flatMap((group) => group.rules);
  const path = `${target.pathname || '/'}${target.search}`;
  const matches = rules.filter((rule) => ruleMatches(path, rule.pattern));
  if (matches.length === 0) return true;
  matches.sort((left, right) => right.pattern.length - left.pattern.length ||
    (left.directive === 'allow' ? -1 : 1));
  return matches[0].directive === 'allow';
}

function responseHeaders(headers: Record<string, string | string[] | undefined>): Headers {
  const result = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (value !== undefined) result.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  return result;
}

function declaredContentLength(headers: { get(name: string): string | null }): number | null {
  const header = headers.get('content-length');
  if (!header) return null;
  const size = Number.parseInt(header, 10);
  return Number.isFinite(size) && size >= 0 ? size : null;
}

function wrapFetchResponse(response: FetchResponse, maxBytes: number): FetchResponse {
  const contentLength = declaredContentLength(response.headers);
  if (contentLength !== null && contentLength > maxBytes) {
    response.body?.cancel();
    response.discardBody?.();
    throw new PublicResponseTooLargeError(maxBytes);
  }
  if (!response.body) return response;

  let textPromise: Promise<string> | null = null;
  return {
    ...response,
    text: () => {
      if (!textPromise) textPromise = readFetchResponseText(response, maxBytes);
      return textPromise;
    },
    discardBody: () => {
      response.body?.cancel();
      response.discardBody?.();
    },
  };
}

/**
 * Consume a response incrementally.  The limit is checked before retaining
 * each chunk, so a peer without a Content-Length cannot force a full body into
 * memory before rejection.
 */
export function readBoundedResponseText(
  response: IncomingMessage,
  headers: { get(name: string): string | null },
  maxBytes: number,
): Promise<string> {
  const contentLength = declaredContentLength(headers);
  if (contentLength !== null && contentLength > maxBytes) {
    response.resume();
    return Promise.reject(new PublicResponseTooLargeError(maxBytes));
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      response.removeListener('data', onData);
      response.removeListener('end', onEnd);
      response.removeListener('error', onError);
      response.removeListener('aborted', onAborted);
      callback();
    };
    const onData = (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      received += buffer.length;
      if (received > maxBytes) {
        const error = new PublicResponseTooLargeError(maxBytes);
        finish(() => reject(error));
        // The promise already carries the bounded-body error; destroy without
        // an error argument so Node does not emit an unhandled second error.
        response.destroy();
        return;
      }
      chunks.push(buffer);
    };
    const onEnd = () => finish(() => resolve(Buffer.concat(chunks).toString('utf8')));
    const onError = (error: Error) => finish(() => reject(error));
    const onAborted = () => finish(() => reject(new Error('Response aborted before completion')));

    response.on('data', onData);
    response.once('end', onEnd);
    response.once('error', onError);
    response.once('aborted', onAborted);
  });
}

/**
 * Make the socket use the address selected by resolvePublicScrapeTarget.
 * Passing a lookup callback to the actual Node transport closes the
 * validation/use race that exists when a hostname is checked and then passed
 * to the default resolver again.
 */
function fetchPinnedUrl(
  target: URL,
  init: RequestInit,
  resolved: ResolvedScrapeTarget,
  maxResponseBytes: number,
): Promise<FetchResponse> {
  const transport = target.protocol === 'https:' ? httpsRequest : httpRequest;
  const headers = new Headers(init.headers);
  headers.set('User-Agent', SCRAPE_USER_AGENT);
  const requestBody = init.body;

  return new Promise((resolve, reject) => {
    const request = transport({
      hostname: target.hostname,
      port: target.port || undefined,
      path: `${target.pathname}${target.search}`,
      method: init.method ?? 'GET',
      headers: Object.fromEntries(headers.entries()),
      lookup: (_hostname, _options, callback) => callback(null, resolved.address, resolved.family),
      ...(target.protocol === 'https:' ? { servername: target.hostname } : {}),
    }, (response) => {
      const headers = responseHeaders(response.headers);
      let consumed = false;
      let textPromise: Promise<string> | null = null;
      resolve({
        ok: (response.statusCode ?? 500) >= 200 && (response.statusCode ?? 500) < 300,
        status: response.statusCode,
        headers,
        text: () => {
          if (!textPromise) {
            consumed = true;
            textPromise = readBoundedResponseText(response, headers, maxResponseBytes);
          }
          return textPromise;
        },
        discardBody: () => {
          if (!consumed) {
            consumed = true;
            response.resume();
          }
        },
      });
    });
    request.once('error', reject);
    if (init.signal) {
      const abort = () => request.destroy(new Error('Request aborted'));
      if (init.signal.aborted) abort();
      else init.signal.addEventListener('abort', abort, { once: true });
    }
    if (typeof requestBody === 'string' || Buffer.isBuffer(requestBody)) request.write(requestBody);
    else if (requestBody instanceof Uint8Array) request.write(Buffer.from(requestBody));
    else if (requestBody !== undefined && requestBody !== null) {
      request.destroy(new Error('Unsupported request body type'));
      return;
    }
    request.end();
  });
}

/**
 * Fetches with redirects handled explicitly, validating DNS immediately before
 * every hop. This gives robots and workflow HTTP calls the same SSRF boundary
 * as browser navigation.
 */
export async function fetchPublicUrl(
  initialUrl: string | URL,
  init: RequestInit = {},
  options: {
    fetchImpl?: FetchLike;
    lookup?: DnsLookup;
    maxRedirects?: number;
    maxResponseBytes?: number;
  } = {},
): Promise<FetchResponse> {
  const fetchImpl = options.fetchImpl ?? (fetch as unknown as FetchLike);
  const maxRedirects = options.maxRedirects ?? 5;
  const maxResponseBytes = options.maxResponseBytes ?? DEFAULT_PUBLIC_RESPONSE_BYTES;
  let current = new URL(initialUrl.toString());

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const resolved = await resolvePublicScrapeTarget(current, { lookup: options.lookup });
    if (typeof resolved === 'string') throw new Error(resolved);
    const response = options.fetchImpl
      ? await fetchImpl(current.toString(), { ...init, redirect: 'manual' })
      : await fetchPinnedUrl(current, { ...init, redirect: 'manual' }, resolved, maxResponseBytes);
    const boundedResponse = options.fetchImpl
      ? wrapFetchResponse(response, maxResponseBytes)
      : response;
    const location = boundedResponse.headers.get('location');
    const isRedirect = !!boundedResponse.status && boundedResponse.status >= 300 && boundedResponse.status < 400 && !!location;
    if (!isRedirect) return boundedResponse;
    // Redirect responses are never useful to callers. Drain them instead of
    // retaining an untrusted body while the next hop is validated.
    boundedResponse.discardBody?.();
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
    }, { fetchImpl, lookup, maxResponseBytes: MAX_ROBOTS_RESPONSE_BYTES });
    if (!response.ok) return mode === 'strict' ? 'Could not retrieve robots.txt' : null;
    return isAllowedByRobots(await response.text(), target, SCRAPE_USER_AGENT)
      ? null
      : 'robots.txt disallows this target path';
  } catch {
    return mode === 'strict' ? 'Could not retrieve robots.txt' : null;
  }
}
