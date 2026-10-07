export const MAX_TEXT_OUTPUT_BYTES = 5 * 1024 * 1024;
export const MAX_COLLECTION_ITEMS = 10_000;
export const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;

export function exceedsUtf8Limit(value: string, maxBytes = MAX_TEXT_OUTPUT_BYTES): boolean {
  return Buffer.byteLength(value, 'utf8') > maxBytes;
}
