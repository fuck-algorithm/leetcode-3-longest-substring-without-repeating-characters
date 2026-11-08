import type { CanvasFrame } from '../../../types';
import { MOTION, motionDuration } from '../motion';
import type { LayerSelection } from './common';
import { renderArrows } from './arrows';
import { renderContainers } from './containers';
import { renderEdges } from './edges';
import { renderLabels } from './labels';
import { renderNodes } from './nodes';

/**
 * 单帧渲染入口：分层 keyed join + 过渡。
 * 必须在画布挂载后调用；每帧只更新有变化的元素，不做整屏重建。
 */
export function renderFrame(
  layer: LayerSelection,
  frame: CanvasFrame,
  speed: number,
  reduced: boolean,
  locale: 'en' | 'zh-CN' = 'zh-CN'
): void {
  const visibleFrame = locale === 'en'
    ? {
        ...frame,
        decorations: frame.decorationsEn ?? frame.decorations,
        nodes: frame.nodesEn ?? frame.nodes,
        arrows: frame.arrowsEn ?? frame.arrows,
        labels: frame.labelsEn ?? frame.labels
      }
    : frame;
  const timing = {
    enterMs: motionDuration(MOTION.enterMs, speed, reduced),
    updateMs: motionDuration(MOTION.updateMs, speed, reduced),
    exitMs: motionDuration(MOTION.exitMs, speed, reduced),
    arrowMs: motionDuration(MOTION.arrowMs, speed, reduced),
    reduced,
    locale
  };

  const visibleNodes = locale === 'en' ? (visibleFrame.nodes ?? frame.nodes) : frame.nodes;
  const visibleLabels = locale === 'en' ? (visibleFrame.labels ?? frame.labels) : frame.labels;
  const visibleArrows = locale === 'en' ? (visibleFrame.arrows ?? frame.arrows) : frame.arrows;
  const localizedNodeById = new Map(visibleNodes.map((node) => [node.id, node]));
  renderNodes(layer.select<SVGGElement>('.layer-decorations'), visibleFrame.decorations ?? [], timing, locale);
  renderContainers(layer.select<SVGGElement>('.layer-containers'), frame.containers ?? [], timing);
  renderEdges(layer.select<SVGGElement>('.layer-edges'), frame.edges, localizedNodeById, timing);
  renderArrows(layer.select<SVGGElement>('.layer-arrows'), visibleArrows, timing, locale);
  renderNodes(layer.select<SVGGElement>('.layer-nodes'), visibleNodes, timing, locale);
  renderLabels(
    layer.select<SVGGElement>('.layer-labels'),
    visibleLabels,
    localizedNodeById,
    timing,
    frame.containers ?? [],
    locale
  );
}
