import * as d3 from 'd3';
import type { CanvasAnnotation, CanvasFrame, CanvasNode } from '../../../types';
import { MOTION, motionDuration } from '../motion';
import { fadeOutAndRemove, type LayerSelection, type RenderTiming } from './common';
import { renderArrows } from './arrows';
import { renderContainers } from './containers';
import { renderEdges } from './edges';
import { renderLabels } from './labels';
import { renderNodes } from './nodes';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../layout';


/**
 * 单帧渲染入口：分层 keyed join + 过渡。
 * 必须在画布挂载后调用；每帧只更新有变化的元素，不做整屏重建。
 */
export function fitFrameToCanvas(frame: CanvasFrame): CanvasFrame {
  const glyphs = [...frame.nodes, ...(frame.decorations ?? [])];
  if (glyphs.length === 0 && !(frame.containers?.length)) return frame;
  const containerRects = frame.containers ?? [];
  const arrows = [...frame.arrows, ...(frame.arrowsEn ?? [])];
  const annotations = [...(frame.annotations ?? []), ...(frame.annotationsEn ?? [])];
  const xCoordinates = [
    ...glyphs.flatMap((node) => [node.x - (node.radius ?? 24), node.x + (node.radius ?? 24)]),
    ...containerRects.flatMap((container) => [container.x, container.x + container.width]),
    ...arrows.flatMap((arrow) => [arrow.from.x, arrow.to.x]),
    ...annotations.map((annotation) => annotation.x)
  ];
  const yCoordinates = [
    ...glyphs.flatMap((node) => [node.y - (node.radius ?? 24), node.y + (node.radius ?? 24)]),
    ...containerRects.flatMap((container) => [container.y, container.y + container.height]),
    ...arrows.flatMap((arrow) => [arrow.from.y, arrow.to.y]),
    ...annotations.map((annotation) => annotation.y)
  ];
  const minX = Math.min(...xCoordinates);
  const maxX = Math.max(...xCoordinates);
  const minY = Math.min(...yCoordinates);
  const maxY = Math.max(...yCoordinates);
  const padding = 8;
  if (minX >= 0 && maxX <= CANVAS_WIDTH && minY >= 0 && maxY <= CANVAS_HEIGHT) return frame;
  const sourceWidth = Math.max(maxX - minX, 1);
  const sourceHeight = Math.max(maxY - minY, 1);
  const scale = Math.min((CANVAS_WIDTH - padding * 2) / sourceWidth, (CANVAS_HEIGHT - padding * 2) / sourceHeight, 1);
  const tx = (CANVAS_WIDTH - sourceWidth * scale) / 2 - minX * scale;
  const ty = (CANVAS_HEIGHT - sourceHeight * scale) / 2 - minY * scale;
  const mapNode = (node: (typeof glyphs)[number]) => ({ ...node, x: tx + node.x * scale, y: ty + node.y * scale, radius: (node.radius ?? 24) * scale });
  const mapArrow = (arrow: CanvasFrame['arrows'][number]) => ({
    ...arrow,
    from: { x: tx + arrow.from.x * scale, y: ty + arrow.from.y * scale },
    to: { x: tx + arrow.to.x * scale, y: ty + arrow.to.y * scale },
    curve: (arrow.curve ?? 0) * scale,
    labelOffset: arrow.labelOffset ? { x: arrow.labelOffset.x * scale, y: arrow.labelOffset.y * scale } : undefined
  });
  return {
    ...frame,
    arrows: frame.arrows.map(mapArrow),
    arrowsEn: frame.arrowsEn?.map(mapArrow),
    nodes: frame.nodes.map(mapNode),
    nodesEn: frame.nodesEn?.map(mapNode),
    decorations: frame.decorations?.map(mapNode),
    decorationsEn: frame.decorationsEn?.map(mapNode),
    annotations: frame.annotations?.map((annotation) => ({ ...annotation, x: tx + annotation.x * scale, y: ty + annotation.y * scale })),
    annotationsEn: frame.annotationsEn?.map((annotation) => ({ ...annotation, x: tx + annotation.x * scale, y: ty + annotation.y * scale })),
    labels: frame.labels,
    labelsEn: frame.labelsEn,
    containers: frame.containers?.map((container) => ({ ...container, x: tx + container.x * scale, y: ty + container.y * scale, width: container.width * scale, height: container.height * scale }))
  };
}

export function fitFrameScale(source: CanvasFrame, fitted: CanvasFrame): number {
  const sourceNode = source.nodes[0];
  const fittedNode = fitted.nodes.find((node) => node.id === sourceNode?.id);
  if (!sourceNode || !fittedNode) return 1;
  return (fittedNode.radius ?? 24) / (sourceNode.radius ?? 24);
}

function renderWindowRange(parentLayer: LayerSelection, frame: CanvasFrame, locale: 'en' | 'zh-CN', timing: RenderTiming): void {
  const layer = parentLayer.select<SVGGElement>('.layer-window');
  const range = frame.windowRange;
  const nodes = new Map(frame.nodes.map((node) => [node.id, node]));
  const allNodes = new Map([...frame.nodes, ...(frame.decorations ?? [])].map((node) => [node.id, node]));
  const start = range ? nodes.get(range.startId) : undefined;
  const end = range ? nodes.get(range.endId) : undefined;
  const valid = start && end && start.y === end.y ? [{ start, end }] : [];
  const band = layer.selectAll<SVGRectElement, (typeof valid)[number]>('rect.window-range').data(valid);
  fadeOutAndRemove(band.exit(), timing);
  const activeBand = band.enter().append('rect').attr('class', 'window-range').merge(band).interrupt('exit');
  const setBand = (selection: typeof activeBand) => selection
    .attr('x', ({ start }) => start.x - (start.radius ?? 24) - 12)
    .attr('y', ({ start }) => start.y - (start.radius ?? 24) - 16)
    .attr('width', ({ start, end }) => end.x - start.x + (start.radius ?? 24) + (end.radius ?? 24) + 24)
    .attr('height', ({ start }) => (start.radius ?? 24) * 2 + 32)
    .attr('rx', 18)
    .attr('opacity', 1);
  if (timing.reduced) setBand(activeBand);
  else setBand(activeBand.transition('move').duration(MOTION.updateMs).ease(d3.easeCubicOut) as unknown as typeof activeBand);

  const labelLayer = parentLayer.select<SVGGElement>('.layer-window-labels');
  const rangeGroup = labelLayer.selectAll<SVGGElement, (typeof valid)[number]>('g.window-range-content').data(valid);
  fadeOutAndRemove(rangeGroup.exit(), timing);
  const rangeEnter = rangeGroup.enter().append('g').attr('class', 'window-range-content').attr('opacity', 0);
  const rangeContent = rangeEnter.merge(rangeGroup).interrupt('exit');
  const caption = locale === 'en' ? 'valid window · no repeats' : '有效窗口 · 无重复';
  const captionX = (datum: (typeof valid)[number]) => datum.end.x - datum.start.x > 220
    ? (datum.start.x + datum.end.x) / 2
    : datum.start.x - (datum.start.radius ?? 24) - 12;
  const repeatedCaptionX = (datum: (typeof valid)[number]) => (datum.start.x + datum.end.x) / 2;
  const rangeLabel = rangeContent.selectAll<SVGTextElement, (typeof valid)[number]>('text.window-range-label')
    .data((datum) => [datum]);
  rangeLabel.exit().remove();
  const labels = rangeLabel.enter().append('text').attr('class', 'window-range-label').merge(rangeLabel).interrupt('exit');
  const setLabels = (selection: typeof labels) => selection
    .attr('x', (datum) => frame.pendingNodeId && frame.pendingAnchorNodeId ? repeatedCaptionX(datum) : captionX(datum))
    .attr('text-anchor', 'middle')
    .attr('y', ({ start, end }) => {
      const radius = start.radius ?? 24;
      const hasDuplicate = frame.pendingNodeId !== undefined && frame.pendingAnchorNodeId !== undefined;
      const duplicateNode = hasDuplicate ? nodes.get(frame.pendingNodeId!) : undefined;
      const duplicateAbove = duplicateNode !== undefined && duplicateNode.y < start.y;
      const offset = 19 + (duplicateAbove ? Math.max(radius, end.radius ?? 24) * 2.3 : 0);
      return start.y - radius - offset;
    })
    .text(caption);
  if (timing.reduced) {
    setLabels(labels);
    rangeContent.attr('opacity', 1);
  } else {
    setLabels(labels.transition('move').duration(MOTION.updateMs).ease(d3.easeCubicOut) as unknown as typeof labels);
    rangeContent.interrupt('move').transition('move').duration(MOTION.updateMs).ease(d3.easeCubicOut).attr('opacity', 1);
  }

  const activePending = frame.pendingNodeId && frame.pendingAnchorNodeId && valid.length
    ? { node: allNodes.get(frame.pendingNodeId), anchor: allNodes.get(frame.pendingAnchorNodeId) }
    : undefined;
  const duplicate = activePending?.node && activePending.anchor ? [activePending as { node: CanvasNode; anchor: CanvasNode }] : [];
  const arrowLayer = parentLayer.select<SVGGElement>('.layer-window-arrows');
  const arrows = arrowLayer.selectAll<SVGPathElement, { node: CanvasNode; anchor: CanvasNode }>('path.pending-duplicate')
    .data(duplicate, ({ node }) => node.id);
  fadeOutAndRemove(arrows.exit(), timing);
  const activeArrows = arrows.enter().append('path').attr('class', 'pending-duplicate').attr('opacity', 0).merge(arrows).interrupt('exit');
  const setArrows = (selection: typeof activeArrows) => selection
    .attr('d', ({ node, anchor }) => {
      const radius = Math.max(anchor.radius ?? 24, node.radius ?? 24);
      const y1 = anchor.y - radius * 0.75;
      const y2 = node.y - radius * 0.75;
      const controlY = Math.min(anchor.y, node.y) - radius * 1.65;
      return `M${anchor.x},${y1} Q${(anchor.x + node.x) / 2},${controlY} ${node.x},${y2}`;
    })
    .attr('marker-end', 'url(#window-arrow)')
    .attr('aria-label', ({ node, anchor }) => `${typeof node.label === 'string' ? node.label : node.label[locale]}: ${locale === 'en' ? 'duplicate of' : '与旧位置重复'} ${typeof anchor.label === 'string' ? anchor.label : anchor.label[locale]}`)
    .attr('opacity', 1);
  if (timing.reduced) setArrows(activeArrows);
  else setArrows(activeArrows.transition('move').duration(timing.updateMs).ease(d3.easeCubicOut) as unknown as typeof activeArrows);

  const duplicateLabelLayer = parentLayer.select<SVGGElement>('.layer-window-labels');
  const duplicateLabel = duplicateLabelLayer.selectAll<SVGTextElement, { node: CanvasNode; anchor: CanvasNode }>('text.pending-duplicate-label')
    .data(duplicate, ({ node }) => node.id);
  fadeOutAndRemove(duplicateLabel.exit(), timing);
  const activeLabels = duplicateLabel.enter().append('text').attr('class', 'pending-duplicate-label').attr('opacity', 0).merge(duplicateLabel).interrupt('exit');
  const setDuplicateLabels = (selection: typeof activeLabels) => selection
    .attr('x', ({ node, anchor }) => (anchor.x + node.x) / 2)
    .attr('y', ({ node, anchor }) => Math.min(anchor.y, node.y) + Math.max(anchor.radius ?? 24, node.radius ?? 24) * 1.65 + 15)
    .attr('text-anchor', 'middle')
    .attr('paint-order', 'stroke')
    .attr('stroke', '#f7fbfa')
    .attr('stroke-width', 5)
    .attr('stroke-linejoin', 'round')
    .text(({ node, anchor }) => locale === 'en'
      ? `${typeof node.label === 'string' ? node.label : node.label[locale]} @${node.id.replace('char-', '')} repeats @${anchor.id.replace('char-', '')}`
      : `索引${node.id.replace('char-', '')}「${typeof node.label === 'string' ? node.label : node.label[locale]}」重复于${anchor.id.replace('char-', '')}`)
    .attr('opacity', 1);
  if (timing.reduced) setDuplicateLabels(activeLabels);
  else setDuplicateLabels(activeLabels.transition('move').duration(MOTION.updateMs).ease(d3.easeCubicOut) as unknown as typeof activeLabels);

  parentLayer.select<SVGGElement>('.layer-nodes').selectAll<SVGGElement, CanvasNode>('g.canvas-node')
    .classed('is-repeat-candidate', (node) => node.id === frame.pendingNodeId && duplicate.length > 0);
  const rings = parentLayer.select<SVGGElement>('.layer-window-nodes')
    .selectAll<SVGCircleElement, CanvasNode>('circle.repeat-candidate-ring')
    .data(duplicate.map(({ node }) => node), (node) => node.id);
  fadeOutAndRemove(rings.exit(), timing);
  const activeRings = rings.enter().append('circle').attr('class', 'repeat-candidate-ring').attr('opacity', 0).merge(rings).interrupt('exit');
  const setRings = (selection: typeof activeRings) => selection
    .attr('data-target-id', (node) => node.id)
    .attr('cx', (node) => node.x)
    .attr('cy', (node) => node.y)
    .attr('r', (node) => (node.radius ?? 24) + 7)
    .attr('aria-label', (node) => `${typeof node.label === 'string' ? node.label : node.label[locale]}: ${locale === 'en' ? 'duplicate candidate' : '重复候选'}`)
    .attr('opacity', 1);
  if (timing.reduced) setRings(activeRings);
  else setRings(activeRings.transition('move').duration(MOTION.updateMs).ease(d3.easeCubicOut) as unknown as typeof activeRings);
}

export function renderFrame(
  layer: LayerSelection,
  frame: CanvasFrame,
  speed: number,
  reduced: boolean,
  locale: 'en' | 'zh-CN' = 'zh-CN'
): void {
  const localizedFrame = locale === 'en'
    ? {
        ...frame,
        decorations: frame.decorationsEn ?? frame.decorations,
        nodes: frame.nodesEn ?? frame.nodes,
        arrows: frame.arrowsEn ?? frame.arrows,
        labels: frame.labelsEn ?? frame.labels
      }
    : frame;
  const visibleFrame = fitFrameToCanvas(localizedFrame);
  const timing = {
    enterMs: motionDuration(MOTION.enterMs, speed, reduced),
    updateMs: motionDuration(MOTION.updateMs, speed, reduced),
    exitMs: motionDuration(MOTION.exitMs, speed, reduced),
    arrowMs: motionDuration(MOTION.arrowMs, speed, reduced),
    reduced,
    locale
  };

  const visibleNodes = visibleFrame.nodes;
  const visibleLabels = visibleFrame.labels;
  const visibleAnnotations = locale === 'en' ? visibleFrame.annotationsEn ?? visibleFrame.annotations ?? [] : visibleFrame.annotations ?? [];
  const nestedLayer = layer.select<SVGGElement>('.layout-fit-layer');
  const fitLayer = nestedLayer.empty() ? layer : nestedLayer;
  fitLayer.attr('transform', null);
  const localizedNodeById = new Map(visibleNodes.map((node) => [node.id, node]));
  renderNodes(fitLayer.select<SVGGElement>('.layer-decorations'), visibleFrame.decorations ?? [], timing, locale);
  renderContainers(fitLayer.select<SVGGElement>('.layer-containers'), visibleFrame.containers ?? [], timing);
  renderEdges(fitLayer.select<SVGGElement>('.layer-edges'), visibleFrame.edges, localizedNodeById, timing);
  renderArrows(fitLayer.select<SVGGElement>('.layer-arrows'), visibleFrame.arrows, timing, locale);
  renderNodes(fitLayer.select<SVGGElement>('.layer-nodes'), visibleNodes, timing, locale);
  renderWindowRange(fitLayer, visibleFrame, locale, timing);
  renderLabels(fitLayer.select<SVGGElement>('.layer-labels'), visibleLabels, localizedNodeById, timing, visibleFrame.containers ?? [], locale);
  const annotationJoin = fitLayer.select<SVGGElement>('.layer-annotations').selectAll<SVGTextElement, CanvasAnnotation>('text.canvas-annotation').data(visibleAnnotations ?? [], item => item.id);
  annotationJoin.exit().remove();
  annotationJoin.enter().append('text').attr('class', 'canvas-annotation').merge(annotationJoin)
    .attr('x', item => item.x).attr('y', item => item.y)
    .text(item => typeof item.text === 'string' ? item.text : item.text[locale]);
}
