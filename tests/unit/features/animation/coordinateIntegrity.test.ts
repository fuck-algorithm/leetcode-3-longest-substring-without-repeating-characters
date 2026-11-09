import { describe, expect, it } from 'vitest';
import type { CanvasFrame } from '../../../../types';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../../../features/animation/layout';
import { fitFrameToCanvas } from '../../../../features/animation/render/renderFrame';
import { layoutSequence } from '../../../../features/animation/sequenceLayout';

function frameWithBounds(): CanvasFrame {
  return {
    layoutBounds: { x: 100, y: 120, width: 600, height: 420 },
    nodes: [{ id: 'a', label: 'a', x: 0, y: 0, radius: 26, status: 'current' }],
    decorations: [{ id: 'left', label: 'L', x: 80, y: 100, radius: 18, status: 'current' }],
    edges: [], arrows: [{ id: 'lookup', from: { x: 0, y: 10 }, to: { x: 80, y: 100 }, text: 'check' }],
    labels: [], notes: []
  };
}

describe('algorithm visualization coordinate integrity', () => {
  it('bounds every visible sequence node and keeps required focus anchors', () => {
    for (const length of [0, 1, 8, 14, 200]) {
      const layout = layoutSequence(length, { left: Math.min(3, Math.max(0, length - 1)), right: Math.max(0, length - 1), candidate: Math.max(0, length - 1), previous: 0 }, { width: 760, maxNodes: 9, radius: 30, gap: 18 });
      expect(layout.indices.length).toBeLessThanOrEqual(9);
      if (length > 0 && length <= 9) expect(layout.indices).toHaveLength(length);
      for (const [index, x] of layout.xByIndex) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(length);
        expect(x - layout.radius).toBeGreaterThanOrEqual(0);
        expect(x + layout.radius).toBeLessThanOrEqual(760);
      }
    }
  });

  it('preserves node, decoration, arrow and edge coordinate references when fitting a frame', () => {
    const frame = frameWithBounds();
    const fitted = fitFrameToCanvas(frame);
    expect(fitted.nodes[0].x).toBeGreaterThanOrEqual(0);
    expect(fitted.nodes[0].x).toBeLessThanOrEqual(CANVAS_WIDTH);
    expect(fitted.decorations?.[0].y).toBeGreaterThanOrEqual(0);
    expect(fitted.arrows[0].from.x).toBeGreaterThanOrEqual(0);
    expect(fitted.arrows[0].to.y).toBeLessThanOrEqual(CANVAS_HEIGHT);
    expect(fitted.decorations?.[0].x).toBe(fitted.nodes[0].x + 80);
    expect(fitted.layoutBounds).toEqual(frame.layoutBounds);
  });

  it('keeps the shared viewBox dimensions aligned to animation layout dimensions', () => {
    expect(CANVAS_WIDTH).toBe(1200);
    expect(CANVAS_HEIGHT).toBe(720);
  });
});
