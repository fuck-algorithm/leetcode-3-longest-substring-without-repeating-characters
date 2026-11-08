import type { CanvasContainer, CanvasLabel, CanvasNode } from '../../types';
import { measureTextWidth, textOf } from './text';

/** 逻辑画布尺寸；viewBox 只做等比扩展，坐标规则始终基于这套尺寸。 */
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 720;
export const NODE_RADIUS = 24;

/** 标签与目标节点之间的呼吸间距。 */
export const LABEL_GAP = 14;
/** 标签框与逻辑画布边缘的安全距离。 */
export const LABEL_MARGIN = 8;

export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type LabelPosition = CanvasLabel['position'];
export type LabelPlacement = Size & {
  x: number;
  y: number;
  position: LabelPosition;
  /** 相对标签组中心的引导线端点。 */
  leader: { x1: number; y1: number; x2: number; y2: number };
};

export function nodeRadius(node: Pick<CanvasNode, 'radius'>): number {
  return node.radius ?? NODE_RADIUS;
}

/**
 * 估算标签框尺寸。SVG 没有布局测量 API，这里用保守的中英文宽度估算：
 * 中文按 1em、拉丁字符按 0.6em，宁大勿小，保证底色能包住文字。
 */
export function measureLabel(label: Pick<CanvasLabel, 'text' | 'detail'>): Size {
  const mainWidth = Math.max(52, measureTextWidth(textOf(label.text), 12));
  const detailWidth = label.detail ? measureTextWidth(textOf(label.detail), 10) : 0;
  return {
    width: Math.max(mainWidth, detailWidth) + 20,
    height: label.detail ? 40 : 24
  };
}

export function rectAt(center: Point, size: Size): Rect {
  return {
    x: center.x - size.width / 2,
    y: center.y - size.height / 2,
    width: size.width,
    height: size.height
  };
}

export function rectsOverlap(a: Rect, b: Rect, padding = 0): boolean {
  return (
    a.x - padding < b.x + b.width &&
    a.x + a.width + padding > b.x &&
    a.y - padding < b.y + b.height &&
    a.y + a.height + padding > b.y
  );
}

export function overlapArea(a: Rect, b: Rect): number {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 0 && height > 0 ? width * height : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 把标签中心钳制在逻辑画布安全区内。
 * 标签比画布还大时退化为居中，避免 min > max 导致 NaN。
 */
export function clampLabelCenter(center: Point, size: Size): Point {
  const minX = LABEL_MARGIN + size.width / 2;
  const maxX = CANVAS_WIDTH - LABEL_MARGIN - size.width / 2;
  const minY = LABEL_MARGIN + size.height / 2;
  const maxY = CANVAS_HEIGHT - LABEL_MARGIN - size.height / 2;
  return {
    x: minX > maxX ? CANVAS_WIDTH / 2 : clamp(center.x, minX, maxX),
    y: minY > maxY ? CANVAS_HEIGHT / 2 : clamp(center.y, minY, maxY)
  };
}

export function labelOffset(position: LabelPosition, size: Size, radius: number): Point {
  switch (position) {
    case 'left':
      return { x: -(size.width / 2 + radius + LABEL_GAP), y: 0 };
    case 'right':
      return { x: size.width / 2 + radius + LABEL_GAP, y: 0 };
    case 'top':
      return { x: 0, y: -(size.height / 2 + radius + LABEL_GAP) };
    default:
      return { x: 0, y: size.height / 2 + radius + LABEL_GAP };
  }
}

export type LabelLayoutOptions = {
  containers?: CanvasContainer[];
  /** 碰撞惩罚之外，给首选方向保留的轻微偏好分。 */
  positionBias?: number;
};

export { placeLabels } from './labelLayout';

/**
 * 把“圆心 → 圆心”的边裁到节点外沿。
 * 两节点相切或重叠时返回 null：此时画线只会糊成一团，应由数据避免。
 */
export function trimSegment(
  from: Point,
  to: Point,
  fromRadius: number,
  toRadius: number,
  gap = 2
): { from: Point; to: Point } | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const startGap = fromRadius + gap;
  const endGap = toRadius + gap;
  if (length <= startGap + endGap) {
    return null;
  }
  const ux = dx / length;
  const uy = dy / length;
  return {
    from: { x: from.x + ux * startGap, y: from.y + uy * startGap },
    to: { x: to.x - ux * endGap, y: to.y - uy * endGap }
  };
}
