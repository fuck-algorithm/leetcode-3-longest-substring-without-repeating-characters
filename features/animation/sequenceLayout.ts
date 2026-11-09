export type SequenceFocus = {
  left?: number;
  right?: number;
  candidate?: number | null;
  previous?: number | null;
  bestStart?: number;
  bestLength?: number;
};

export type SequenceGap = { leftIndex: number; rightIndex: number; omitted: number; x: number };

export type SequenceLayout = {
  indices: number[];
  xByIndex: Map<number, number>;
  viewport: { start: number; end: number };
  gaps: SequenceGap[];
  pitch: number;
  radius: number;
};

export function layoutSequence(
  total: number,
  focus: SequenceFocus,
  options: { width?: number; maxNodes?: number; radius?: number; gap?: number; left?: number } = {}
): SequenceLayout {
  const width = options.width ?? 760;
  const maxNodes = Math.max(1, options.maxNodes ?? 9);
  const radius = Math.max(12, options.radius ?? 26);
  const gap = Math.max(8, options.gap ?? 20);
  if (total <= 0) return { indices: [], xByIndex: new Map(), viewport: { start: 0, end: -1 }, gaps: [], pitch: 0, radius };

  const isValid = (index: number | null | undefined): index is number =>
    index !== null && index !== undefined && Number.isInteger(index) && index >= 0 && index < total;
  const center = isValid(focus.candidate) ? focus.candidate : isValid(focus.right) ? focus.right : isValid(focus.left) ? focus.left : 0;
  const physicalCapacity = Math.max(1, Math.floor((width - radius * 2) / (radius * 2 + gap)) + 1);
  const capacity = Math.min(maxNodes, physicalCapacity);
  const start = Math.max(0, Math.min(total - capacity, center - Math.floor(capacity / 2)));
  const required = new Set<number>();
  for (const index of [focus.left, focus.right, focus.candidate, focus.previous]) if (isValid(index)) required.add(index);
  if (isValid(focus.bestStart) && (focus.bestLength ?? 0) <= capacity) {
    for (let index = focus.bestStart; index < Math.min(total, focus.bestStart + focus.bestLength!); index += 1) required.add(index);
  }
  const selected = new Set<number>();
  for (let i = start; i < Math.min(total, start + capacity); i += 1) selected.add(i);
  required.forEach((index) => selected.add(index));
  const indices = [...selected].sort((a, b) => a - b);
  const maxVisible = Math.max(capacity, required.size);
  while (indices.length > maxVisible) {
    const removable = indices.findIndex((index) => !required.has(index));
    if (removable < 0) break;
    indices.splice(removable, 1);
  }
  const pitch = indices.length < 2 ? 0 : Math.min(radius * 2 + gap, (width - radius * 2) / (indices.length - 1));
  const usedWidth = pitch * Math.max(indices.length - 1, 0);
  const offset = Math.max(radius + 8, (width - usedWidth - radius * 2) / 2);
  const xByIndex = new Map(indices.map((index, order) => [index, offset + radius + order * pitch]));
  const gaps = indices.slice(1).flatMap((rightIndex, order) => {
    const leftIndex = indices[order];
    const omitted = rightIndex - leftIndex - 1;
    return omitted > 0 ? [{ leftIndex, rightIndex, omitted, x: (xByIndex.get(leftIndex)! + xByIndex.get(rightIndex)!) / 2 }] : [];
  });
  return { indices, xByIndex, viewport: { start: indices[0] ?? 0, end: indices.length ? indices[indices.length - 1] : -1 }, gaps, pitch, radius };
}
