import { safeJsonParse } from './safe-json';

describe('safeJsonParse', () => {
  it('allows many shallow sibling objects without confusing count for depth', () => {
    const input = JSON.stringify({
      rows: Array.from({ length: 100 }, (_, index) => ({ index })),
    });

    expect(safeJsonParse(input, { maxDepth: 4 }).success).toBe(true);
  });

  it('rejects JSON that actually exceeds the nesting limit', () => {
    const input = JSON.stringify({ a: { b: { c: { d: 1 } } } });
    const result = safeJsonParse(input, { maxDepth: 3 });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('maximum depth');
  });

  it('rejects dangerous property names without rejecting harmless string values', () => {
    expect(safeJsonParse(JSON.stringify({ value: 'constructor prototype' })).success).toBe(true);
    expect(safeJsonParse('{"__proto__":{"polluted":true}}').success).toBe(false);
  });
});
