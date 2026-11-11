import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { AlgorithmStep, ProblemData, SolutionDefinition } from '../../types';
import {
  deriveMetrics,
  operationLabel,
  prefersReducedMotion,
  resolveLegend
} from '../../features/animation/motion';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../features/animation/layout';
import { renderFrame } from '../../features/animation/render/renderFrame';

type Props = {
  locale: 'en' | 'zh-CN';
  data: ProblemData | null;
  step: AlgorithmStep;
  solution: SolutionDefinition;
  speed?: number;
};

const WIDTH = CANVAS_WIDTH;
const HEIGHT = CANVAS_HEIGHT;
/**
 * 逻辑画布固定 1200×720；viewBox 按容器比例扩展，避免 preserveAspectRatio
 * 产生上下/左右黑边，把画布容器的空间真正交给绘图区。
 */
export function viewBoxFor(width: number, height: number): string {
  if (!width || !height) return `0 0 ${WIDTH} ${HEIGHT}`;
  const ratio = width / height;
  if (ratio >= WIDTH / HEIGHT) {
    const viewWidth = HEIGHT * ratio;
    return `${(WIDTH - viewWidth) / 2} 0 ${viewWidth} ${HEIGHT}`;
  }
  const viewHeight = WIDTH / ratio;
  return `0 ${(HEIGHT - viewHeight) / 2} ${WIDTH} ${viewHeight}`;
}

const MARKERS = [
  { id: 'flow-arrow', color: '#2f9e7d' },
  { id: 'transfer-arrow', color: '#b07a12' },
  { id: 'return-arrow', color: '#18765a' }
] as const;

export function VisualizationCanvas({ locale, data, step, solution, speed = 1 }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomLayerRef = useRef<SVGGElement | null>(null);
  const [viewBox, setViewBox] = useState(`0 0 ${WIDTH} ${HEIGHT}`);

  const summary = useMemo(
    () => `${locale === 'en' ? solution.nameEn ?? solution.name : solution.name} - ${locale === 'en' ? 'Step' : '步骤'} ${step.id + 1}: ${locale === 'en' ? step.titleEn ?? step.title : step.title}`,
    [locale, solution.name, solution.nameEn, step.id, step.title, step.titleEn]
  );
  const legend = useMemo(() => resolveLegend(step.frame, locale), [step.frame, locale]);
  const metrics = useMemo(() => deriveMetrics(step.frame, locale), [step.frame, locale]);
  const operation = operationLabel(step.operation, locale);
  const narration = locale === 'en'
    ? step.narrationEn ?? step.descriptionEn ?? ''
    : step.narration ?? step.description;
  const renderedNodes = locale === 'en' ? step.frame.nodesEn ?? step.frame.nodes : step.frame.nodes;
  const focusedNodes = renderedNodes.filter((node) => node.status === 'current');
  const comparedNodes = renderedNodes.filter((node) => node.status === 'compare');
  const completedNodes = renderedNodes.filter((node) => node.status === 'done');
  const stepContext = locale === 'en'
    ? `Step ${step.id + 1}: ${narration} ${focusedNodes.length ? `Focus: ${focusedNodes.map((node) => node.label).join(', ')}.` : ''} ${comparedNodes.length ? `Compare: ${comparedNodes.map((node) => node.label).join(' vs ')}.` : ''} ${completedNodes.length ? `Completed result: ${completedNodes.map((node) => node.label).join(', ')}.` : ''}`
    : `第 ${step.id + 1} 步：${narration}${focusedNodes.length ? ` 当前焦点：${focusedNodes.map((node) => node.label).join('、')}。` : ''}${comparedNodes.length ? ` 正在比较：${comparedNodes.map((node) => node.label).join(' 与 ')}。` : ''}${completedNodes.length ? ` 已确认结果：${completedNodes.map((node) => node.label).join('、')}。` : ''}`;
  const localize = (value: string | { 'zh-CN': string; en: string }) => typeof value === 'string' ? value : value[locale];
  const notes = locale === 'en' ? step.frame.notesEn ?? [] : step.frame.notes;
  const t = (english: string, chinese: string) => locale === 'en' ? english : chinese;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === 'undefined') {
      return;
    }
    const update = () => {
      const rect = svg.getBoundingClientRect();
      setViewBox(viewBoxFor(rect.width, rect.height));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !zoomLayerRef.current) {
      return;
    }

    const svg = d3.select(svgRef.current);
    const zoomLayer = d3.select(zoomLayerRef.current);

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.4, 2.5]).on('zoom', (event) => {
      zoomLayer.attr('transform', event.transform.toString());
    });

    svg.call(zoom as never);
    if (!svg.attr('data-zoom-initialized')) {
      svg.call(zoom.transform as never, d3.zoomIdentity);
      svg.attr('data-zoom-initialized', 'true');
    }
  }, []);

  useEffect(() => {
    if (!zoomLayerRef.current) {
      return;
    }

    renderFrame(
      d3.select(zoomLayerRef.current),
      step.frame,
      speed,
      prefersReducedMotion(),
      locale
    );
  }, [step, speed, locale]);

  return (
    <div
      className="canvas-card"
      data-testid="visualization-canvas"
      data-step-id={step.id}
      data-operation={step.operation ?? ''}
    >
      <div className="canvas-title" data-testid="canvas-title">
        <span className="canvas-title-text">{summary}</span>
        {step.operation ? (
          <span className="operation-badge" data-testid="operation-badge" data-operation={step.operation}>
            {operation}
          </span>
        ) : null}
        <span className="step-focus-summary" data-testid="step-focus-summary">
          {comparedNodes.length
            ? locale === 'en'
              ? `Comparing ${comparedNodes.map(node => node.label).join(' and ')}`
              : `比较 ${comparedNodes.map(node => node.label).join(' 和 ')}`
            : completedNodes.length
              ? locale === 'en'
                ? `Answer: ${completedNodes.map(node => node.label).join('')}`
                : `答案：${completedNodes.map(node => node.label).join('')}`
              : focusedNodes.length
                ? locale === 'en'
                  ? `Current: ${focusedNodes[0].label}`
                  : `当前：${focusedNodes[0].label}`
                : locale === 'en' ? 'Ready' : '准备开始'}
        </span>
      </div>

      <svg
        ref={svgRef}
        data-testid="canvas-svg"
        className="viz-canvas"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        aria-label={stepContext}
      >
        <defs>
          {MARKERS.map((marker) => (
            <marker
              key={marker.id}
              id={marker.id}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 z" fill={marker.color} />
            </marker>
          ))}
        </defs>
        <g ref={zoomLayerRef} className="zoom-layer">
          <rect className="canvas-backdrop" x={0} y={0} width={WIDTH} height={HEIGHT} />
          <g className="layout-fit-layer">
            <g className="layer-containers" />
            <g className="layer-edges" />
            <g className="layer-arrows" />
            <g className="layer-decorations" />
            <g className="layer-nodes" />
            <g className="layer-labels" />
            <g className="layer-annotations" />
          </g>
        </g>
      </svg>

      <div className="canvas-caption">
        <p className="caption-text" data-testid="step-narration">
          {narration}
        </p>
        <div className="canvas-notes" data-testid="canvas-notes">
          {notes.map((note, index) => (
            <span key={`${index}-${note}`} className="note-item">
              {localize(note)}
            </span>
          ))}
        </div>
      </div>

      <div className="canvas-meta-row">
        <div className="canvas-legend" data-testid="canvas-legend">
          <span className="legend-title" data-testid="legend-title">{t('Legend', '图例')}</span>
          {legend.map((item) => (
            <span key={item.status} className="legend-chip" data-testid={`legend-item-${item.status}`}>
              <i className={`legend-dot state-${item.status}`} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
        <div className="canvas-metrics" data-testid="canvas-metrics">
          {metrics.map((metric) => (
            <span key={localize(metric.label)} className="metric-chip">
              <b>{metric.value}</b>
              {localize(metric.label)}
            </span>
          ))}
        </div>
      </div>

      {data ? (
        <div className="canvas-input-echo" data-testid="canvas-input-echo">
          {t('Input: ', '当前输入: ')}{data.raw}
        </div>
      ) : null}
    </div>
  );
}
