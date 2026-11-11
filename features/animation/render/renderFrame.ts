import type { CanvasAnnotation, CanvasFrame } from '../../../types';
import { MOTION, motionDuration } from '../motion';
import type { LayerSelection } from './common';
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
  renderLabels(fitLayer.select<SVGGElement>('.layer-labels'), visibleLabels, localizedNodeById, timing, visibleFrame.containers ?? [], locale);
  const annotationJoin = fitLayer.select<SVGGElement>('.layer-annotations').selectAll<SVGTextElement, CanvasAnnotation>('text.canvas-annotation').data(visibleAnnotations ?? [], item => item.id);
  annotationJoin.exit().remove();
  annotationJoin.enter().append('text').attr('class', 'canvas-annotation').merge(annotationJoin)
    .attr('x', item => item.x).attr('y', item => item.y)
    .text(item => typeof item.text === 'string' ? item.text : item.text[locale]);
}
