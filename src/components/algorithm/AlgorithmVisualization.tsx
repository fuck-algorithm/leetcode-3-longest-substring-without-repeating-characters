import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { AlgorithmState, AlgorithmStep } from './types';

interface AlgorithmVisualizationProps {
  inputString: string;
  currentState: AlgorithmState;
  width?: number;
  height?: number;
  currentStateIndex?: number;
  totalSteps?: number;
}

type VisualNode = {
  id: string; label: string; x: number; y: number; status: 'idle' | 'current' | 'compare' | 'visited' | 'done'; badge?: string;
};

const COLORS = {
  idle: { fill: '#e8efec', stroke: '#9aada6', text: '#243b34' },
  current: { fill: '#25856a', stroke: '#12674f', text: '#ffffff' },
  compare: { fill: '#f0bd62', stroke: '#bb851f', text: '#382900' },
  visited: { fill: '#b9d9ce', stroke: '#78a797', text: '#243b34' },
  done: { fill: '#12674f', stroke: '#084e3b', text: '#ffffff' },
};

function describe(state: AlgorithmState): { operation: string; narration: string } {
  switch (state.step) {
    case AlgorithmStep.INITIALIZE:
      return { operation: '初始化', narration: '建立空窗口与左右边界；接下来逐个读取字符，维持窗口内字符不重复。' };
    case AlgorithmStep.DETECT_DUPLICATE:
      return { operation: '发现重复', narration: `检查字符「${state.duplicateChar ?? ''}」时发现它已在窗口中；必须收缩左边界，才能恢复无重复条件。` };
    case AlgorithmStep.MOVE_LEFT_POINTER:
      return { operation: '收缩窗口', narration: `左边界移动到索引 ${state.leftPointer}，排除旧的「${state.duplicateChar ?? ''}」；右边界不回退，因此扫描保持线性。` };
    case AlgorithmStep.UPDATE_RESULT:
      return { operation: '更新答案', narration: `当前无重复窗口「${state.maxSubstring}」长度为 ${state.maxLength}，刷新已知最长结果。` };
    default:
      return { operation: '扩展窗口', narration: `读取索引 ${state.rightPointer} 的「${state.inputString[state.rightPointer] ?? ''}」，窗口扩展为「${state.currentWindow}」并继续检查唯一性。` };
  }
}

const AlgorithmVisualization: React.FC<AlgorithmVisualizationProps> = ({
  inputString, currentState, width = 800, height = 300, currentStateIndex = 0, totalSteps = 1,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { operation, narration } = useMemo(() => describe(currentState), [currentState]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const duration = reduced ? 0 : 220;
    svg.attr('viewBox', '0 0 1200 720').attr('preserveAspectRatio', 'xMidYMid meet');
    let root = svg.select<SVGGElement>('.viz-root');
    if (root.empty()) {
      root = svg.append('g').attr('class', 'viz-root');
      root.append('g').attr('class', 'layer-window');
      root.append('g').attr('class', 'layer-nodes');
      root.append('g').attr('class', 'layer-pointers');
      root.append('g').attr('class', 'layer-support');
      root.append('g').attr('class', 'layer-teaching');
    }
    root.selectAll('*').interrupt();

    const chars = Array.from(inputString);
    const pitch = Math.min(92, 960 / Math.max(chars.length, 1));
    const cell = Math.min(68, pitch - 8);
    const originX = (1200 - pitch * chars.length) / 2 + pitch / 2;
    const state = currentState;
    const nodes: VisualNode[] = chars.map((label, index) => {
      const inWindow = index >= state.leftPointer && index <= state.rightPointer && state.currentWindow.length > 0;
      const isAnswer = state.maxSubstring.length > 0 && index >= state.inputString.indexOf(state.maxSubstring) && index < state.inputString.indexOf(state.maxSubstring) + state.maxLength;
      const status = state.step === AlgorithmStep.INITIALIZE ? 'idle' :
        state.duplicateFound && index === state.rightPointer ? 'compare' :
        index === state.rightPointer ? 'current' : inWindow ? 'visited' : isAnswer ? 'done' : 'idle';
      return { id: `char-${index}`, label, x: originX + index * pitch, y: 230, status, badge: String(index) };
    });

    const windowLayer = root.select<SVGGElement>('.layer-window');
    const windowVisible = state.currentWindow.length > 0 && state.rightPointer >= state.leftPointer;
    windowLayer.selectAll<SVGRectElement, number>('rect.window-range').data(windowVisible ? [1] : []).join(
      enter => enter.append('rect').attr('class', 'window-range').attr('rx', 14).attr('fill', '#e3f3ed').attr('stroke', '#8ebbaa').attr('stroke-dasharray', '5 4'),
      update => update,
      exit => exit.remove(),
    ).transition('range').duration(duration)
      .attr('x', originX + state.leftPointer * pitch - cell / 2 - 12)
      .attr('y', 184).attr('width', Math.max(cell + 24, (state.rightPointer - state.leftPointer) * pitch + cell + 24)).attr('height', 100);

    const groups = root.select<SVGGElement>('.layer-nodes').selectAll<SVGGElement, VisualNode>('g.char-node')
      .data(nodes, d => d.id).join(
        enter => {
          const group = enter.append('g').attr('class', 'char-node').attr('data-node-id', d => d.id).attr('opacity', 0);
          group.append('rect').attr('rx', 12);
          group.append('text').attr('class', 'char-label').attr('text-anchor', 'middle').attr('dominant-baseline', 'central');
          group.append('text').attr('class', 'index-label').attr('text-anchor', 'middle');
          return group;
        }, update => update, exit => exit.transition('exit').duration(duration).attr('opacity', 0).remove(),
      );
    groups.attr('data-status', d => d.status)
      .transition('move').duration(duration).attr('opacity', 1).attr('transform', d => `translate(${d.x},${d.y})`);
    groups.select('rect').attr('width', cell).attr('height', cell).attr('x', -cell / 2).attr('y', -cell / 2)
      .attr('fill', d => COLORS[d.status].fill).attr('stroke', d => COLORS[d.status].stroke).attr('stroke-width', d => d.status === 'current' ? 3 : 1.5);
    groups.select('.char-label').text(d => d.label).attr('fill', d => COLORS[d.status].text).attr('font-size', Math.min(28, cell * 0.42)).attr('font-weight', 700);
    groups.select('.index-label').text(d => `[${d.badge}]`).attr('y', cell / 2 + 21).attr('fill', '#63776f').attr('font-size', 13);

    const pointers = [
      { id: 'left', label: `left ${state.leftPointer}`, x: originX + state.leftPointer * pitch, y: 325 },
      { id: 'right', label: `right ${state.rightPointer}`, x: originX + state.rightPointer * pitch, y: 360 },
    ];
    root.select<SVGGElement>('.layer-pointers').selectAll<SVGTextElement, typeof pointers[number]>('text.pointer')
      .data(pointers, d => d.id).join('text').attr('class', 'pointer').attr('text-anchor', 'middle')
      .attr('font-size', 14).attr('font-weight', 700).attr('fill', d => d.id === 'left' ? '#18765a' : '#b07a12')
      .text(d => `▼ ${d.label}`).transition('pointer').duration(duration).attr('x', d => d.x).attr('y', d => d.y);

    const support = root.select<SVGGElement>('.layer-support');
    const set = Array.from(state.charSet ?? []);
    const supportItems = [
      { id: 'set-title', x: 100, y: 455, size: 16, fill: '#53675f', text: '窗口字符集合' },
      { id: 'set-detail', x: 100, y: 484, size: 13, fill: '#71837c', text: set.length ? '去重后仍需与窗口边界保持一致' : '当前为空：尚未纳入字符' },
      ...set.map((text, index) => ({ id: `set-${text}`, x: 100 + index * 54, y: 535, size: 20, fill: '#12674f', text })),
      { id: 'answer-title', x: 690, y: 455, size: 16, fill: '#53675f', text: '目前最长子串' },
      { id: 'answer-detail', x: 690, y: 484, size: 13, fill: '#71837c', text: `长度 ${state.maxLength} · 窗口长度 ${state.currentWindow.length}` },
      { id: 'answer-value', x: 690, y: 535, size: 24, fill: '#12674f', text: state.maxSubstring || '等待更新' },
    ];
    support.selectAll<SVGTextElement, typeof supportItems[number]>('text.support-item').data(supportItems, d => d.id).join('text')
      .attr('class', 'support-item').attr('x', d => d.x).attr('y', d => d.y).attr('font-size', d => d.size)
      .attr('font-weight', d => d.id === 'answer-value' || d.id.startsWith('set-') ? 700 : 400)
      .attr('text-anchor', d => d.id.startsWith('set-') && d.id !== 'set-title' && d.id !== 'set-detail' ? 'middle' : 'start')
      .attr('fill', d => d.fill).text(d => d.text);

    const teaching = root.select<SVGGElement>('.layer-teaching');
    const legend = [ ['current', '当前字符'], ['compare', '重复检查'], ['visited', '窗口内'], ['done', '最长结果'] ] as const;
    const textItems = [
      { id: 'step-title', x: 42, y: 44, fill: '#1e352d', size: 18, weight: 700, text: `滑动窗口 · 步骤 ${Math.min(currentStateIndex + 1, totalSteps)} / ${totalSteps}` },
      { id: 'operation', x: 1078, y: 42, fill: '#12674f', size: 14, weight: 700, text: operation },
      { id: 'narration', x: 42, y: 78, fill: '#41574f', size: 15, weight: 400, text: narration.length > 100 ? `${narration.slice(0, 97)}…` : narration },
      { id: 'metrics', x: 720, y: 664, fill: '#53675f', size: 13, weight: 400, text: `当前窗口 ${state.currentWindow.length} · 已处理 ${Math.max(0, state.rightPointer + 1)} · 最长 ${state.maxLength}` },
      ...legend.map(([key, text], i) => ({ id: `legend-${key}`, x: 61 + i * 155, y: 664, fill: '#53675f', size: 13, weight: 400, text })),
    ];
    teaching.selectAll<SVGTextElement, typeof textItems[number]>('text.teaching-item').data(textItems, d => d.id).join('text')
      .attr('class', d => `teaching-item${d.id === 'narration' ? ' step-narration' : ''}`)
      .attr('x', d => d.x).attr('y', d => d.y).attr('fill', d => d.fill).attr('font-size', d => d.size)
      .attr('font-weight', d => d.weight).attr('text-anchor', d => d.id.startsWith('legend-') ? 'start' : d.id === 'operation' ? 'middle' : 'start')
      .attr('data-operation', d => d.id === 'operation' ? operation : null).text(d => d.text);
    teaching.selectAll<SVGRectElement, number>('rect.operation-badge').data([1]).join('rect')
      .attr('class', 'operation-badge').attr('x', 1000).attr('y', 20).attr('width', 155).attr('height', 34).attr('rx', 17).attr('fill', '#dff1e9');
    teaching.selectAll<SVGCircleElement, typeof legend[number]>('circle.legend-swatch').data(legend, d => d[0]).join('circle')
      .attr('class', 'legend-swatch').attr('cx', (_d, i) => 48 + i * 155).attr('cy', 660).attr('r', 7)
      .attr('fill', d => COLORS[d[0]].fill).attr('stroke', d => COLORS[d[0]].stroke);
  }, [inputString, currentState, currentStateIndex, totalSteps, operation, narration, width, height]);

  return <div className="algorithm-visualization"><svg ref={svgRef} className="visualization-svg" role="img" aria-label={`滑动窗口步骤 ${currentStateIndex + 1}：${narration}`} /></div>;
};

export default AlgorithmVisualization;
