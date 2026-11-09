import { describe, expect, it } from 'vitest';
import { layoutSequence } from '../../../../features/animation/sequenceLayout';

describe('layoutSequence', () => {
  it('keeps short sequences centered with stable evenly spaced positions', () => {
    const layout = layoutSequence(6, { left: 1, right: 3 });
    expect(layout.indices).toEqual([0, 1, 2, 3, 4, 5]);
    expect(layout.xByIndex.get(0)).toBeGreaterThan(0);
    expect(layout.xByIndex.get(5)).toBeLessThan(620);
    expect([...layout.xByIndex.values()].every(Number.isFinite)).toBe(true);
  });

  it('focuses a ten-character context while preserving candidate and previous match', () => {
    const layout = layoutSequence(50000, { left: 25000, right: 25020, candidate: 25020, previous: 12 }, { width: 620, maxNodes: 8 });
    expect(layout.indices.length).toBeLessThanOrEqual(8);
    expect(layout.indices).toContain(25020);
    expect(layout.indices).toContain(12);
    expect(layout.indices.every((index) => index >= 0 && index < 50000)).toBe(true);
    expect([...layout.xByIndex.values()].every((x) => x >= 0 && x <= 620)).toBe(true);
  });

  it('keeps the complete best answer range when it fits the canvas', () => {
    const layout = layoutSequence(100, { left: 80, right: 90, bestStart: 12, bestLength: 3 });
    expect(layout.indices).toEqual(expect.arrayContaining([12, 13, 14]));
  });

  it('returns an empty finite layout for empty input', () => {
    expect(layoutSequence(0, { left: 0, right: -1 })).toMatchObject({ indices: [], viewport: { start: 0, end: -1 } });
  });
});
