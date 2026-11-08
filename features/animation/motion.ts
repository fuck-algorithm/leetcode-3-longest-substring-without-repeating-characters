import type {
  CanvasFrame,
  CanvasNode,
  LegendItem,
  MetricItem,
  NodeStatus,
  StepOperation
} from '../../types';

/**
 * 全站统一的动效时间基线。时长必须短于播放停留时间，
 * 倍速播放时动画与停留一起缩放（见 references/08-animation-motion-design.md）。
 */
export const MOTION = {
  enterMs: 220,
  updateMs: 360,
  exitMs: 180,
  arrowMs: 420,
  dwellMs: 1000,
  minDurationMs: 60
} as const;

export const STATUS_LABELS: Record<NodeStatus, string> = {
  idle: '未处理', current: '当前', compare: '比较', visited: '已访问', done: '已完成', path: '最终路径', error: '冲突'
};

const STATUS_LABELS_EN: Record<NodeStatus, string> = {
  idle: 'Idle', current: 'Current', compare: 'Comparing', visited: 'Visited', done: 'Done', path: 'Result path', error: 'Conflict'
};

export function statusLabel(status: NodeStatus, locale: 'en' | 'zh-CN'): string {
  return locale === 'en' ? STATUS_LABELS_EN[status] : STATUS_LABELS[status];
}

/** 固定四色图例：不随步骤增删，观众不需要反复学习颜色。 */
export const DEFAULT_LEGEND: LegendItem[] = [
  { status: 'current', label: STATUS_LABELS.current },
  { status: 'compare', label: STATUS_LABELS.compare },
  { status: 'visited', label: STATUS_LABELS.visited },
  { status: 'done', label: STATUS_LABELS.done }
];

const DEFAULT_LEGEND_EN: LegendItem[] = [
  { status: 'current', label: STATUS_LABELS_EN.current },
  { status: 'compare', label: STATUS_LABELS_EN.compare },
  { status: 'visited', label: STATUS_LABELS_EN.visited },
  { status: 'done', label: STATUS_LABELS_EN.done }
];

const OPERATION_LABELS: Record<StepOperation, string> = {
  init: '初始化',
  read: '读取',
  compare: '比较',
  swap: '交换',
  move: '移动',
  insert: '插入',
  remove: '删除',
  visit: '访问',
  match: '命中',
  push: '入栈',
  pop: '出栈',
  enqueue: '入队',
  dequeue: '出队',
  recurse: '递归',
  return: '返回',
  done: '完成'
};

export function normalizeNodeStatus(node: CanvasNode): NodeStatus {
  if (node.status) {
    return node.status;
  }
  if (node.kind === 'highlight') {
    return 'current';
  }
  return 'idle';
}

export function resolveLegend(frame: CanvasFrame, locale: 'en' | 'zh-CN' = 'zh-CN'): LegendItem[] {
  const labels = locale === 'en' ? STATUS_LABELS_EN : STATUS_LABELS;
  if (frame.legend && frame.legend.length > 0) {
    return frame.legend.map((item) => ({ ...item, label: labels[item.status] }));
  }

  const used = new Set(frame.nodes.map(normalizeNodeStatus));
  const base = locale === 'en' ? DEFAULT_LEGEND_EN : DEFAULT_LEGEND;
  const extras: NodeStatus[] = ['path', 'error'];
  return [
    ...base,
    ...extras
      .filter((status) => used.has(status))
      .map((status) => ({ status, label: labels[status] }))
  ];
}

export function deriveMetrics(frame: CanvasFrame, locale: 'en' | 'zh-CN' = 'zh-CN'): MetricItem[] {
  const metrics = locale === 'en' ? frame.metricsEn ?? frame.metrics : frame.metrics;
  if (metrics && metrics.length > 0) {
    return metrics;
  }

  let active = 0;
  let visited = 0;
  for (const node of frame.nodes) {
    const status = normalizeNodeStatus(node);
    if (status === 'current' || status === 'compare') {
      active += 1;
    } else if (status === 'visited' || status === 'done' || status === 'path') {
      visited += 1;
    }
  }

  return locale === 'en'
    ? [
        { label: 'Nodes', value: frame.nodes.length },
        { label: 'Active', value: active },
        { label: 'Visited', value: visited }
      ]
    : [
        { label: '节点', value: frame.nodes.length },
        { label: '进行中', value: active },
        { label: '已访问', value: visited }
      ];
}

const OPERATION_LABELS_EN: Record<StepOperation, string> = {
  init: 'Initialize',
  read: 'Read',
  compare: 'Compare',
  swap: 'Swap',
  move: 'Move',
  insert: 'Insert',
  remove: 'Remove',
  visit: 'Visit',
  match: 'Match',
  push: 'Push',
  pop: 'Pop',
  enqueue: 'Enqueue',
  dequeue: 'Dequeue',
  recurse: 'Recurse',
  return: 'Return',
  done: 'Done'
};

export function operationLabel(operation?: StepOperation, locale: 'en' | 'zh-CN' = 'zh-CN'): string {
  if (!operation) return '';
  return locale === 'en' ? OPERATION_LABELS_EN[operation] : OPERATION_LABELS[operation];
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 倍速缩放 + reduced motion 归零 + 下限保护。
 */
export function motionDuration(baseMs: number, speed = 1, reduced = false): number {
  if (reduced) {
    return 0;
  }
  const factor = Number.isFinite(speed) ? Math.max(speed, 0.25) : 1;
  return Math.max(MOTION.minDurationMs, Math.round(baseMs / factor));
}
