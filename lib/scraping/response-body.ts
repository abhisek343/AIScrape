export class ResponseBodyTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Response exceeds the ${maxBytes}-byte limit`);
    this.name = 'ResponseBodyTooLargeError';
  }
}

type ResponseBodyLike = {
  headers?: { get(name: string): string | null };
  body?: ReadableStream<Uint8Array> | null;
  text(): Promise<string>;
};

function declaredContentLength(response: ResponseBodyLike): number | null {
  const value = response.headers?.get('content-length');
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Read a fetch response incrementally and reject as soon as the byte budget is
 * exceeded. This prevents chunked or malicious responses from being fully
 * buffered before the size check runs.
 */
export async function readBoundedResponseText(
  response: ResponseBodyLike,
  maxBytes: number,
): Promise<string> {
  const contentLength = declaredContentLength(response);
  if (contentLength !== null && contentLength > maxBytes) {
    throw new ResponseBodyTooLargeError(maxBytes);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    // Custom fetch adapters may expose only text(). The production HTTP path
    // supplies a stream; keep this fallback bounded for adaptor callers.
    const text = await response.text();
    if (Buffer.byteLength(text, 'utf8') > maxBytes) {
      throw new ResponseBodyTooLargeError(maxBytes);
    }
    return text;
  }

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        throw new ResponseBodyTooLargeError(maxBytes);
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join('');
  } finally {
    reader.releaseLock();
  }
}
