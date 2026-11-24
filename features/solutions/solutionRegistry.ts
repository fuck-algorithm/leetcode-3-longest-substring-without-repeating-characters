import type { AlgorithmStep, InputValidationResult, SolutionDefinition } from '../../types';
import { buildSampleCodes } from './sampleCodes';
import { layoutSequence } from '../animation/sequenceLayout';
import { CANVAS_WIDTH, CANVAS_HEIGHT, NODE_RADIUS, trimSegment } from '../animation/layout';

const examples = [
  { id: 's1', label: 'abcabcbb', labelEn: 'abcabcbb', value: 'abcabcbb' },
  { id: 's2', label: 'bbbbb', labelEn: 'bbbbb', value: 'bbbbb' },
  { id: 's3', label: 'pwwkew', labelEn: 'pwwkew', value: 'pwwkew' }
];

function validateInput(raw: string): InputValidationResult {
  if (Array.from(raw).length > 200) {
    return { valid: false, error: { 'zh-CN': '为了清晰演示，字符串长度不能超过 200 个字符', en: 'For a readable visualization, strings must not exceed 200 characters' } };
  }
  return { valid: true, parsed: raw };
}

type Phase = 'init' | 'inspect' | 'shrink' | 'include' | 'record' | 'compare-best' | 'finish';
type FrameData = {
  lastSeenLookupChar?: string;
  lastSeenLookupIndex?: number | null;
  left: number;
  right: number;
  previousLeft?: number;
  windowStart: number;
  windowEnd: number;
  currentLength: number;
  bestStart: number;
  bestLength: number;
  candidate: number | null;
  previous: number | null;
  highlightedMapIndex: number | null;
  phase: Phase;
};

function createSteps(input: string): AlgorithmStep[] {
  const chars = Array.from(input);
  const steps: AlgorithmStep[] = [];
  const lastSeen = new Map<string, number>();
  let left = 0;
  let bestStart = 0;
  let bestLength = 0;

  const pushFrame = (data: FrameData, title: string, titleEn: string, narration: string, narrationEn: string, operation: NonNullable<AlgorithmStep['operation']>, anchor: string, notes: string, notesEn: string) => {
    const { left: l, right: r, windowStart, windowEnd, candidate, previous } = data;
    const repeatedInside = candidate !== null && previous !== null && previous >= l;
    const showMap = data.phase !== 'init' && data.phase !== 'finish';
    const layout = layoutSequence(chars.length, {
      left: l,
      right: r,
      candidate,
      previous,
      bestStart: data.phase === 'finish' ? data.bestStart : undefined,
      bestLength: data.phase === 'finish' ? data.bestLength : undefined
    }, { width: CANVAS_WIDTH - 360, maxNodes: 8, radius: NODE_RADIUS + 10, gap: 40, left: 36 });
    const displayIndices = layout.indices;
    const allMapEntries = [...lastSeen.entries()];
    const candidateChar = candidate === null ? undefined : chars[candidate];
    const candidateEntry = candidateChar === undefined ? undefined : allMapEntries.find(([char]) => char === candidateChar);
    const recentEntries = allMapEntries.filter(([char]) => char !== candidateChar).slice(-1);
    const mapEntries = showMap ? [...recentEntries, ...(candidateEntry ? [candidateEntry] : [])] : [];
    const tableStart = CANVAS_WIDTH - 285;
    const nodeX = (index: number) => layout.xByIndex.get(index) ?? layout.xByIndex.get(candidate ?? -1) ?? 600;
    const displayBounds = { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
    const nodes = displayIndices.map((index) => {
      const label = chars[index];
      const inWindow = index >= windowStart && index <= windowEnd;
      const isCandidate = index === candidate;
      const isBest = data.bestLength > 0 && index >= data.bestStart && index < data.bestStart + data.bestLength;
      const isFuture = index > r && data.phase !== 'finish';
      const status = isFuture ? 'idle' as const : data.phase === 'finish' && isBest ? 'done' as const
        : data.phase === 'compare-best' && isBest && !isCandidate ? 'visited' as const
        : data.phase === 'inspect' && previous === null && isCandidate ? 'current' as const
        : data.phase === 'inspect' && previous !== null && (index === previous || isCandidate) ? 'compare' as const
        : isCandidate ? (data.phase === 'inspect' ? 'compare' as const : 'current' as const)
        : data.phase === 'shrink' && index === previous ? 'compare' as const
        : inWindow ? 'visited' as const
        : isBest ? 'done' as const
        : 'idle' as const;
      return {
        id: `char-${index}`, label, x: nodeX(index), y: 300,
        radius: layout.radius, badge: String(index), sublabel: String(index), status
      };
    });
    const byIndex = (index: number) => {
      const position = layout.xByIndex.get(index);
      if (position !== undefined) return position;
      const nearestIndex = layout.indices.reduce((best, item) => Math.abs(item - index) < Math.abs(best - index) ? item : best, layout.indices[0] ?? 0);
      return layout.xByIndex.get(nearestIndex) ?? 600;
    }
    const pointers = !showMap && data.phase !== 'finish' ? [
      ...(displayIndices.includes(l) ? [{ id: 'left-pointer', from: { x: byIndex(l), y: 390 }, to: { x: byIndex(l), y: 365 }, text: { 'zh-CN': `左 L=${l}`, en: `Left L=${l}` }, kind: 'pointer' as const }] : []),
      ...(r >= 0 && displayIndices.includes(r) ? [{ id: 'right-pointer', from: { x: byIndex(r), y: 465 }, to: { x: byIndex(r), y: 440 }, text: { 'zh-CN': `右 R=${r}`, en: `Right R=${r}` }, kind: 'pointer' as const }] : [])
    ] : [];
    const flowArrows = data.phase === 'shrink' && previous !== null ? [{
      id: `jump-${steps.length}`, from: { x: byIndex(data.previousLeft ?? l), y: 430 }, to: { x: byIndex(l), y: 430 },
      text: { 'zh-CN': `移动左边界`, en: `Move left` },
      kind: 'transfer' as const, curve: 0, labelOffset: { x: 0, y: 18 }
    }] : [];
    const mapY = Math.max(470, Math.min(590, CANVAS_HEIGHT - (Math.ceil(displayIndices.length / 2) * (layout.radius * 2 + 100))));
    const mapCell = (column: number) => ({ x: tableStart + (column % 2) * 100, y: mapY + Math.floor(column / 2) * 58 });
    const hashRows = mapEntries.map(([char, index], row) => ({ char, index, id: `last-${char.codePointAt(0) ?? row}`, ...mapCell(row) }));
    const positions = new Map(hashRows.map(row => [row.char, { x: row.x, y: row.y }]));
    const lookupChar = data.lastSeenLookupChar ?? (data.phase === 'inspect' ? candidateChar : undefined);
    const lookupIndex = data.lastSeenLookupIndex ?? (data.phase === 'inspect' ? previous : undefined);
    const lookupHit = data.phase === 'inspect' || data.phase === 'shrink'
      ? previous !== undefined
      : lookupChar !== undefined && lookupIndex !== null;
    const allNodes = [
      ...nodes,
      ...(showMap ? hashRows.map(row => ({ id: row.id, label: `${row.char} → ${row.index}`, x: row.x, y: row.y, radius: 25, kind: 'highlight' as const, badge: undefined, sublabel: undefined, status: lookupHit && lookupIndex === row.index && lookupChar === row.char ? 'visited' as const : 'idle' as const })) : [])
    ];
    const lookupFrom = candidate === null ? null : { x: byIndex(candidate), y: 300 };
    const lookupTo = candidateChar ? positions.get(candidateChar) ?? null : null;
    const lookupEdge = lookupFrom && lookupTo
      ? trimSegment(lookupFrom, lookupTo, NODE_RADIUS + 6, 25, 10)
      : null;
    const frameArrows = [
      ...pointers,
      ...flowArrows,
      ...(data.phase === 'inspect' && candidate !== null && previous === null ? [{
        id: `lookup-${steps.length}`, from: { x: byIndex(candidate), y: 300 }, to: { x: byIndex(candidate), y: 300 },
        text: { 'zh-CN': `${candidateChar} 未命中`, en: `${candidateChar} not found` }, kind: 'flow' as const, curve: 24, labelOffset: { x: 0, y: -42 }
      }] : []),
      ...(data.phase === 'inspect' && candidate !== null && previous !== null && lookupEdge ? [{
        id: `lookup-${steps.length}`, from: lookupEdge.from, to: lookupEdge.to,
        text: { 'zh-CN': '重复？', en: 'Repeat?' }, kind: 'flow' as const, curve: 0, labelOffset: { x: 12, y: -24 }
      }] : [])
    ];
    const effectiveWindow = windowStart <= windowEnd && chars.length ? chars.slice(windowStart, windowEnd + 1).join('') : '';
    const rangeText = windowStart <= windowEnd ? `[${windowStart}, ${windowEnd}]` : '空';
    const labels: AlgorithmStep['frame']['labels'] = data.phase === 'finish' && data.bestLength > 0 ? [{
      id: 'best-label', targetId: `char-${data.bestStart}`,
      text: { 'zh-CN': `答案「${chars.slice(data.bestStart, data.bestStart + data.bestLength).join('')}」`, en: `Answer “${chars.slice(data.bestStart, data.bestStart + data.bestLength).join('')}”` },
      detail: { 'zh-CN': `区间 [${data.bestStart}, ${data.bestStart + data.bestLength}) · 长度 ${data.bestLength}`, en: `Range [${data.bestStart}, ${data.bestStart + data.bestLength}) · length ${data.bestLength}` },
      position: 'bottom', variant: 'callout', tone: 'accent'
    }] : [];
    if (data.phase === 'finish' && data.bestLength > 0) {
      const answerText = `答案「${chars.slice(data.bestStart, data.bestStart + data.bestLength).join('')}」`;
      const existingIndex = labels.findIndex(label => label.id === 'best-label');
      if (existingIndex >= 0) labels[existingIndex] = { ...labels[existingIndex], position: 'bottom' };
      else labels.push({ id: 'best-label', targetId: `char-${data.bestStart}`, text: { 'zh-CN': answerText, en: `Answer “${chars.slice(data.bestStart, data.bestStart + data.bestLength).join('')}”` }, detail: { 'zh-CN': `长度 ${data.bestLength}`, en: `Length ${data.bestLength}` }, position: 'bottom', variant: 'callout', tone: 'accent' });
    }
    if (!chars.length) labels.push({
      id: 'empty-label', targetId: 'empty-anchor', text: { 'zh-CN': '空字符串', en: 'Empty string' },
      detail: { 'zh-CN': '没有字符可读', en: 'No characters to read' }, position: 'top', variant: 'callout', tone: 'neutral'
    });
    const narrationFull = narration;
    const step: AlgorithmStep = {
      id: steps.length, title, titleEn, description: narrationFull, descriptionEn: narrationEn,
      narration: narrationFull, narrationEn, operation,
      binding: {
        anchorIds: [anchor],
        variables: {
          left: l,
          right: Math.max(r, 0),
          previousLeft: data.phase === 'shrink' ? data.previousLeft : undefined,
          lookupChar,
          lookupIndex,
          lookupFound: data.lastSeenLookupChar !== undefined
            ? data.lastSeenLookupIndex !== null
            : data.phase === 'inspect' || data.phase === 'shrink' ? lookupHit : undefined,
          lookupCharacter: data.phase === 'inspect' || data.phase === 'shrink' ? candidateChar : undefined,
          lookupCandidate: data.phase === 'inspect' && !lookupHit ? candidateChar : undefined,
          lastSeenWrite: data.phase === 'record' ? candidateChar : undefined,
          lastSeenPrevious: data.phase === 'record' ? previous : undefined,
          window: effectiveWindow,
          bestRange: data.bestLength > 0 ? [data.bestStart, data.bestStart + data.bestLength] : null,
          currentLength: data.currentLength,
          bestLength: data.bestLength,
          lastSeen: Object.fromEntries(lastSeen.entries())
        }
      },
      frame: {
        layoutBounds: displayBounds,
        windowRange: chars.length > 0 && windowStart >= 0 && windowStart < chars.length && windowStart <= (data.phase === 'include' ? r : windowEnd)
          ? { startId: `char-${windowStart}`, endId: `char-${data.phase === 'include' ? r : windowEnd}` }
          : undefined,
        pendingNodeId: candidate !== null && data.phase === 'inspect' && repeatedInside ? `char-${candidate}` : undefined,
        pendingAnchorNodeId: previous !== null && data.phase === 'inspect' && repeatedInside ? `char-${previous}` : undefined,
        annotations: layout.gaps.map((gap) => ({ id: `gap-${gap.leftIndex}-${gap.rightIndex}`, x: gap.x, y: 285, text: { 'zh-CN': `… 跳过 ${gap.omitted} 个字符 …`, en: `… ${gap.omitted} characters skipped …` } })),
        annotationsEn: layout.gaps.map((gap) => ({ id: `gap-${gap.leftIndex}-${gap.rightIndex}`, x: gap.x, y: 285, text: `… ${gap.omitted} characters skipped …` })),
        notes: [{ 'zh-CN': notes, en: notesEn }], notesEn: [notesEn],
        decorations: chars.length ? [
          ...(displayIndices.includes(l) ? [{ id: 'pointer-left', label: `L=${l}`, x: byIndex(l), y: 390, radius: 16, status: 'current' as const, sublabel: '左边界' }] : []),
          ...(r >= 0 && r < chars.length && displayIndices.includes(r) ? [{ id: 'pointer-right', label: `R=${r}`, x: byIndex(r), y: 465, radius: 16, status: 'compare' as const, sublabel: '右边界' }] : [])
        ] : [],
        decorationsEn: chars.length ? [
          ...(displayIndices.includes(l) ? [{ id: 'pointer-left', label: `L=${l}`, x: byIndex(l), y: 390, radius: 16, status: 'current' as const, sublabel: 'left' }] : []),
          ...(r >= 0 && r < chars.length && displayIndices.includes(r) ? [{ id: 'pointer-right', label: `R=${r}`, x: byIndex(r), y: 465, radius: 16, status: 'compare' as const, sublabel: 'right' }] : [])
        ] : [],
        nodes: chars.length ? allNodes : [{ id: 'empty-anchor', label: '∅', x: 600, y: 335, radius: 42, status: 'idle' }],
        nodesEn: chars.length ? allNodes.map(node => ({ ...node, label: node.label })) : [{ id: 'empty-anchor', label: '∅', x: 600, y: 335, radius: 42, status: 'idle' }],
        edges: [], arrows: frameArrows, arrowsEn: frameArrows,
        labels, labelsEn: labels.map(label => ({ ...label, text: typeof label.text === 'string' ? label.text : label.text.en, detail: typeof label.detail === 'string' ? label.detail : label.detail?.en })),
        metrics: [
          { label: { 'zh-CN': '当前窗口', en: 'Current window' }, value: rangeText },
          { label: { 'zh-CN': '当前长度', en: 'Current length' }, value: data.currentLength },
          { label: { 'zh-CN': '最长长度', en: 'Best length' }, value: data.bestLength }
        ],
        metricsEn: [
          { label: { 'zh-CN': 'Current window', en: 'Current window' }, value: rangeText },
          { label: { 'zh-CN': 'Current length', en: 'Current length' }, value: data.currentLength },
          { label: { 'zh-CN': 'Best length', en: 'Best length' }, value: data.bestLength }
        ]
      }
    };
    return step;
  };

  if (!chars.length) {
    steps.push(pushFrame({ left: 0, right: -1, windowStart: 0, windowEnd: -1, currentLength: 0, bestStart: 0, bestLength: 0, candidate: null, previous: null, highlightedMapIndex: null, phase: 'init' },
      '初始化空字符串', 'Initialize empty input', '输入为空：没有字符可读取，当前窗口与最长结果长度都是 0。', 'The input is empty: there are no characters to read, so both current and best lengths are 0.', 'init', 'init', '空字符串没有字符索引，最终返回长度 0。', 'An empty string has no character indices; return length 0.'));
    steps.push(pushFrame({ left: 0, right: -1, windowStart: 0, windowEnd: -1, currentLength: 0, bestStart: 0, bestLength: 0, candidate: null, previous: null, highlightedMapIndex: null, phase: 'finish' },
      '完成并返回 0', 'Finish and return 0', '无需进入循环；空串本身是唯一候选，长度为 0。', 'The loop never runs; the empty string is the only candidate, with length 0.', 'done', 'return', '结果为空子串，长度 0。', 'The result is the empty substring with length 0.'));
    return steps;
  }

  steps.push(pushFrame({ left: 0, right: -1, windowStart: 0, windowEnd: -1, currentLength: 0, bestStart: 0, bestLength: 0, candidate: null, previous: null, highlightedMapIndex: null, phase: 'init' },
    '初始化双指针与记录表', 'Initialize pointers and last-seen map', '先设 left=0、right 从 -1 开始；lastSeen 为空，最长长度 best=0，准备从索引 0 开始扫描。', 'Set left=0 and right=-1; lastSeen is empty and best=0, ready to scan from index 0.', 'init', 'init', '空表表示尚未读到任何字符。', 'An empty map means no character has been read yet.'));

  for (let right = 0; right < chars.length; right += 1) {
    const char = chars[right];
    const previous = lastSeen.get(char);
    const oldLeft = left;
    const repeatedInside = previous !== undefined && previous >= left;
    if (repeatedInside) {
      steps.push(pushFrame({ left, right, windowStart: left, windowEnd: right - 1, currentLength: right - left, bestStart, bestLength, candidate: right, previous: previous ?? null, highlightedMapIndex: previous ?? null, phase: 'inspect' },
        `检查「${char}」：发现重复`, `Check “${char}”: duplicate found`,
        `候选字符 s[${right}]=「${char}」与窗口内旧字符 s[${previous}]=「${char}」相同。当前有效窗口仍是 [${left},${right - 1}]「${chars.slice(left, right).join('')}」；lastSeen 查询命中 ${previous}，因此暂不能把候选字符算入窗口。`,
        `Candidate s[${right}]=“${char}” matches s[${previous}]=“${char}” inside the window. The valid window remains [${left},${right - 1}] “${chars.slice(left, right).join('')}”; lastSeen lookup returns ${previous}, so the candidate is not included yet.`,
        'compare', 'lookup', `哈希表中 ${char}→${previous} 指向窗口内旧位置。`, `The map entry ${char}→${previous} points to the earlier in-window occurrence.`));
      left = Math.max(left, previous + 1);
      steps.push(pushFrame({ left, right, previousLeft: oldLeft, windowStart: left, windowEnd: right - 1, currentLength: right - left, bestStart, bestLength, candidate: right, previous: previous ?? null, highlightedMapIndex: previous ?? null, phase: 'shrink', lastSeenLookupChar: char, lastSeenLookupIndex: previous },
        '左边界越过旧字符', 'Move left past the old character',
        `旧 left=${oldLeft}；重复字符旧索引=${previous}，所以 left=max(${oldLeft}, ${previous}+1)=${left}。右指针保持 ${right} 不回退，当前窗口缩为 [${left},${right - 1}]「${chars.slice(left, right).join('')}」，长度 ${right - left}。`,
        `Old left=${oldLeft}; prior duplicate index=${previous}, so left=max(${oldLeft}, ${previous}+1)=${left}. Right stays at ${right}; the valid window shrinks to [${left},${right - 1}] “${chars.slice(left, right).join('')}”, length ${right - left}.`,
        'move', 'shrink', `跳过已证明会造成重复的前缀；left 只前进不后退。`, `Skip the proven conflicting prefix; left only moves forward.`));
    } else if (previous !== undefined) {
      steps.push(pushFrame({ left, right, windowStart: left, windowEnd: right - 1, currentLength: right - left, bestStart, bestLength, candidate: right, previous, highlightedMapIndex: previous, lastSeenLookupChar: char, lastSeenLookupIndex: previous, phase: 'inspect' },
        `检查「${char}」：旧位置已在窗口外`, `Check “${char}”: previous index is outside`,
        `lastSeen[${char}]=${previous}，但旧位置 ${previous}<left ${left}，已在有效窗口之外。因此 left 保持 ${left}，无需删除任何窗口字符。`,
        `lastSeen[${char}]=${previous}, but ${previous}<left ${left}, outside the valid window. Keep left at ${left}; no current window character needs removal.`,
        'compare', 'lookup', `旧出现位置 ${previous} 已被边界排除，不构成当前重复。`, `The prior occurrence at ${previous} is already excluded by the left boundary.`));
    } else {
      steps.push(pushFrame({ left, right, windowStart: left, windowEnd: right - 1, currentLength: right - left, bestStart, bestLength, candidate: right, previous: null, highlightedMapIndex: null, lastSeenLookupChar: char, lastSeenLookupIndex: null, phase: 'inspect' },
        `查找「${char}」：记录表中没有`, `Lookup “${char}”: no map entry`,
        `读取 s[${right}] =「${char}」，查询 lastSeen 未命中；记录表中尚无这个字符，因此不会造成窗口冲突。`,
        `Read s[${right}] = “${char}”; lastSeen has no entry, so it cannot conflict with the current window.`,
        'compare', 'lookup', `查询 ${char} 未命中，当前映射保持不变。`, `Lookup ${char} misses; the map remains unchanged.`));
    }
    const beforeIncludeLength = right - left;
    steps.push(pushFrame({ left, right, windowStart: left, windowEnd: right, currentLength: beforeIncludeLength + 1, bestStart, bestLength, candidate: right, previous: previous ?? null, highlightedMapIndex: previous ?? null, phase: 'include' },
      `读取 s[${right}] 并加入窗口`, `Read s[${right}] and include it`,
      `读取候选字符「${char}」。从 left=${left} 到 right=${right} 的窗口现在无重复，加入后区间为 [${left},${right}]「${chars.slice(left, right + 1).join('')}」，当前长度 ${right - left + 1}。`,
      `Read candidate “${char}”. The range from left=${left} to right=${right} is now unique; including it forms [${left},${right}] “${chars.slice(left, right + 1).join('')}”, current length ${right - left + 1}.`,
      'read', 'read', `字符进入窗口，并准备写入 lastSeen[${char}]=${right}。`, `The character enters the window; prepare to write lastSeen[${char}]=${right}.`));
    lastSeen.set(char, right);
    const currentLength = right - left + 1;
    steps.push(pushFrame({ left, right, windowStart: left, windowEnd: right, currentLength, bestStart, bestLength, candidate: right, previous: previous ?? null, highlightedMapIndex: right, phase: 'record' },
      '写入字符的最新位置', 'Store the latest character position',
      `将 lastSeen[${char}] 更新为 ${right}，供后续重复查询使用；当前窗口长度为 ${currentLength}，已有最长长度 ${bestLength}。`,
      `Set lastSeen[${char}]=${right} for future duplicate checks; the current window length is ${currentLength}, with best length ${bestLength}.`,
      'insert', 'store', `映射卡片保存字符 ${char} 最近出现的索引 ${right}。`, `The map card stores the latest index ${right} for ${char}.`));
    if (currentLength <= bestLength) {
      steps.push(pushFrame({ left, right, windowStart: left, windowEnd: right, currentLength, bestStart, bestLength, candidate: right, previous: previous ?? null, highlightedMapIndex: right, phase: 'compare-best' },
        '保留当前最长答案', 'Keep the current longest answer',
        `当前窗口长度 ${currentLength} 未超过 best=${bestLength}，所以答案区间 [${bestStart},${bestStart + bestLength}) 保持不变。`,
        `The current window length ${currentLength} does not exceed best=${bestLength}, so keep answer range [${bestStart},${bestStart + bestLength}).`,
        'compare', 'compare-best', `比较当前长度与 best，答案不变。`, `Compare the current length with best; the answer stays unchanged.`));
    } else {
      const previousBest = bestLength;
      bestStart = left;
      bestLength = currentLength;
      steps.push(pushFrame({ left, right, windowStart: left, windowEnd: right, currentLength, bestStart, bestLength, candidate: right, previous: previous ?? null, highlightedMapIndex: right, phase: 'record' },
        '用更长窗口更新答案', 'Update the answer with a longer window',
        `当前窗口长度 ${currentLength} 大于旧 best=${previousBest}，因此把 [${bestStart},${bestStart + bestLength})「${chars.slice(bestStart, bestStart + bestLength).join('')}」记为新答案。`,
        `The current window length ${currentLength} exceeds old best=${previousBest}, so record [${bestStart},${bestStart + bestLength}) “${chars.slice(bestStart, bestStart + bestLength).join('')}” as the new answer.`,
        'match', 'update-best', `更长窗口替换最佳答案；start/end 使用左闭右开区间。`, `A longer window replaces the best answer; start/end use a half-open interval.`));
    }
  }
  steps.push(pushFrame({ left, right: chars.length - 1, windowStart: left, windowEnd: chars.length - 1, currentLength: chars.length - left, bestStart, bestLength, candidate: null, previous: null, highlightedMapIndex: null, phase: 'finish' },
    '返回最终答案', 'Return the final answer',
    `扫描完毕。最长子串是 [${bestStart},${bestStart + bestLength})「${chars.slice(bestStart, bestStart + bestLength).join('')}」，长度 ${bestLength}。若最长解并列，本演示保留最先达到的区间。`,
    `Scan complete. The longest substring is [${bestStart},${bestStart + bestLength}) “${chars.slice(bestStart, bestStart + bestLength).join('')}”, length ${bestLength}. If several answers tie, this demo keeps the first one found.`,
    'done', 'return', `最终子串的字符标记为 done，长度 ${bestLength}。`, `Characters in the final substring are marked done; result length is ${bestLength}.`));
  return steps;
}

export function createSolutionRegistry(input = 'abcabcbb'): SolutionDefinition[] {
  return [{
    id: 'sliding-window', name: '滑动窗口', nameEn: 'Sliding window',
    thought: '使用 lastSeen 记录字符最近出现的索引。扫描 right：若 lastSeen[ch]≥left，旧位置仍在窗口内，就将 left 跳到 oldIndex+1；否则边界不动。加入当前字符后计算长度，只有严格变长才更新最佳半开区间 [start,end)。因此每个边界至多前进 n 次，时间 O(n)，空间 O(min(n, 字符集大小))。',
    thoughtEn: 'Use lastSeen to map characters to their latest indices. Scan right: if lastSeen[ch]≥left, the old occurrence is still in the window, so jump left to oldIndex+1; otherwise keep left unchanged. Include the character, then update the best half-open range [start,end) only when its length grows. Both boundaries advance at most n times: O(n) time and O(min(n, alphabet size)) space.',
    samples: examples, samplesEn: examples, codes: buildSampleCodes(), steps: createSteps(input),
    validateInput,
    generateRandom: () => Array.from({ length: 5 + Math.floor(Math.random() * 7) }, () => String.fromCharCode(97 + Math.floor(Math.random() * 5))).join('')
  }];
}
