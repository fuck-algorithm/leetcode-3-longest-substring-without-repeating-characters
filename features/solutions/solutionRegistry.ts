import type { AlgorithmStep, InputValidationResult, SolutionDefinition } from '../../types';
import { buildSampleCodes } from './sampleCodes';

const examples = [
  { id: 's1', label: 'abcabcbb', labelEn: 'abcabcbb', value: 'abcabcbb' },
  { id: 's2', label: 'bbbbb', labelEn: 'bbbbb', value: 'bbbbb' },
  { id: 's3', label: 'pwwkew', labelEn: 'pwwkew', value: 'pwwkew' }
];

function validateInput(raw: string): InputValidationResult {
  if (Array.from(raw).length > 50000) {
    return { valid: false, error: { 'zh-CN': '字符串长度不能超过 50000', en: 'String length must not exceed 50,000 characters' } };
  }
  return { valid: true, parsed: raw };
}

type Phase = 'init' | 'inspect' | 'shrink' | 'include' | 'record' | 'finish';
type FrameData = {
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
  let focusIndex: number | null = null;
  let previousFocus: number | null = null;

  const pushFrame = (data: FrameData, title: string, titleEn: string, narration: string, narrationEn: string, operation: NonNullable<AlgorithmStep['operation']>, anchor: string, notes: string, notesEn: string) => {
    const { left: l, right: r, windowStart, windowEnd, candidate, previous } = data;
    const ids = new Set<number>();
    lastSeen.forEach((index) => ids.add(index));
    if (candidate !== null) ids.add(candidate);
    const indexList = [...ids].sort((a, b) => a - b);
    const tableStart = chars.length > 0 ? 100 + Math.max(chars.length, 1) * 52 + 84 : 350;
    const nodes = chars.map((label, index) => {
      const inWindow = index >= windowStart && index <= windowEnd;
      const isCandidate = index === candidate;
      const isBest = data.bestLength > 0 && index >= data.bestStart && index < data.bestStart + data.bestLength;
      const status = data.phase === 'finish' && isBest ? 'done' as const
        : data.phase === 'inspect' && (index === previous || isCandidate) ? 'compare' as const
        : isCandidate ? (data.phase === 'inspect' ? 'compare' as const : 'current' as const)
        : inWindow && index === focusIndex && !isCandidate ? 'current' as const
        : index === focusIndex && !isCandidate ? 'current' as const
        : inWindow && data.phase !== 'inspect' ? 'visited' as const
        : isBest ? 'done' as const
        : index === previousFocus ? 'visited' as const : 'idle' as const;
      return {
        id: `char-${index}`, label, x: chars.length <= 1 ? 600 : 100 + index * (1000 / (chars.length - 1)), y: 275,
        radius: chars.length > 20 ? 18 : 28, badge: String(index), sublabel: `s[${index}]`, status
      };
    });
    const byIndex = (index: number) => nodes[index]?.x ?? 600;
    const pointers = [
      { id: 'left-pointer', from: { x: byIndex(Math.min(l, Math.max(chars.length - 1, 0))), y: 349 }, to: { x: byIndex(Math.min(l, Math.max(chars.length - 1, 0))), y: 315 }, text: { 'zh-CN': `左指针 L=${l}`, en: `Left L=${l}` }, kind: 'pointer' as const },
      ...(r >= 0 && r < chars.length ? [{ id: 'right-pointer', from: { x: byIndex(r), y: 429 }, to: { x: byIndex(r), y: 385 }, text: { 'zh-CN': `右指针 R=${r}`, en: `Right R=${r}` }, kind: 'pointer' as const }] : [])
    ];
    const flowArrows = data.phase === 'inspect' && candidate !== null && previous !== null ? [{
      id: `repeat-${steps.length}`, from: { x: byIndex(candidate), y: 236 }, to: { x: byIndex(previous), y: 236 },
      text: { 'zh-CN': `${chars[candidate]} 已见于 ${previous}`, en: `${chars[candidate]} last seen at ${previous}` },
      kind: 'flow' as const, curve: -20, labelOffset: { x: 0, y: -10 }
    }] : data.phase === 'shrink' && previous !== null ? [{
      id: `jump-${steps.length}`, from: { x: byIndex(Math.min(data.previousLeft ?? l, Math.max(chars.length - 1, 0))), y: 430 }, to: { x: byIndex(Math.min(l, Math.max(chars.length - 1, 0))), y: 430 },
      text: { 'zh-CN': `left: ${data.previousLeft ?? l} → ${l}`, en: `left: ${data.previousLeft ?? l} → ${l}` },
      kind: 'transfer' as const, curve: 18, labelOffset: { x: 0, y: 14 }
    }] : data.phase === 'include' && candidate !== null ? [{
      id: `include-${steps.length}`, from: { x: byIndex(candidate), y: 429 }, to: { x: byIndex(candidate), y: 385 },
      text: { 'zh-CN': `加入窗口 ${chars[candidate]}`, en: `Include ${chars[candidate]}` },
      kind: 'transfer' as const, labelOffset: { x: 56, y: -4 }
    }] : data.phase === 'record' && data.bestLength > 0 ? [{
      id: `best-${steps.length}`, from: { x: byIndex(data.bestStart), y: 474 }, to: { x: byIndex(data.bestStart + data.bestLength - 1), y: 474 },
      text: { 'zh-CN': `记录最长长度 ${data.bestLength}`, en: `Record best length ${data.bestLength}` },
      kind: 'return' as const, labelOffset: { x: 0, y: 14 }
    }] : [];
    const cellX = (column: number) => tableStart + column * 104;
    const hashRows = indexList.map((index, row) => {
      const char = chars[index];
      const id = `last-${index}`;
      const status = 'visited' as const;
      const x = cellX(row % Math.max(1, Math.floor((1120 - tableStart) / 104)));
      const y = 545 + Math.floor(row / Math.max(1, Math.floor((1120 - tableStart) / 104))) * 58;
      return { id, char, index, x, y, status };
    });
    const positions = new Map(hashRows.map(row => [row.index, { x: row.x, y: row.y }]));
    const allNodes = [
      ...nodes,
      ...hashRows.map(row => ({ id: row.id, label: `${row.char}→${row.index}`, x: row.x, y: row.y, radius: 31, badge: 'lastSeen', sublabel: `index ${row.index}`, status: row.status }))
    ];
    const frameArrows = [
      ...pointers,
      ...flowArrows,
      ...(data.phase === 'inspect' && candidate !== null && previous !== null && positions.has(previous) ? [{
        id: `lookup-${steps.length}`, from: { x: byIndex(candidate), y: 230 }, to: positions.get(previous)!,
        text: { 'zh-CN': `查 lastSeen[${chars[candidate]}]`, en: `Lookup lastSeen[${chars[candidate]}]` }, kind: 'flow' as const, curve: 28
      }] : []),
      ...(data.phase === 'record' && candidate !== null ? [{
        id: `store-${steps.length}`, from: { x: byIndex(candidate), y: 420 }, to: { x: cellX(indexList.length % Math.max(1, Math.floor((1120 - tableStart) / 104))), y: 510 },
        text: { 'zh-CN': `写入 ${chars[candidate]}→${candidate}`, en: `Store ${chars[candidate]}→${candidate}` }, kind: 'transfer' as const, curve: 24
      }] : [])
    ];
    const effectiveWindow = windowStart <= windowEnd && chars.length ? chars.slice(windowStart, windowEnd + 1).join('') : '';
    const rangeText = windowStart <= windowEnd ? `[${windowStart}, ${windowEnd}]` : '空';
    const labels: AlgorithmStep['frame']['labels'] = effectiveWindow ? [{
      id: 'window-label', targetId: `char-${Math.max(windowStart, 0)}`,
      text: { 'zh-CN': `有效窗口 ${rangeText}「${effectiveWindow}」`, en: `Valid window ${rangeText} “${effectiveWindow}”` },
      detail: { 'zh-CN': `${data.currentLength} 个字符 · 无重复`, en: `${data.currentLength} character(s) · no duplicates` },
      position: 'top', variant: 'callout', tone: 'accent'
    }] : [];
    if (!chars.length) labels.push({
      id: 'empty-label', targetId: 'empty-anchor', text: { 'zh-CN': '空字符串', en: 'Empty string' },
      detail: { 'zh-CN': '没有字符可读', en: 'No characters to read' }, position: 'top', variant: 'callout', tone: 'neutral'
    });
    const narrationFull = narration;
    const step: AlgorithmStep = {
      id: steps.length, title, titleEn, description: narrationFull, descriptionEn: narrationEn,
      narration: narrationFull, narrationEn, operation,
      binding: { anchorIds: [anchor], variables: { left: l, right: Math.max(r, 0), window: effectiveWindow, currentLength: data.currentLength, bestLength: data.bestLength, lastSeen: Object.fromEntries([...lastSeen.entries()]) } },
      frame: {
        decorations: chars.length ? [
          { id: 'pointer-left', label: `L=${l}`, x: byIndex(Math.min(l, Math.max(chars.length - 1, 0))), y: 315, radius: 17, status: 'current' as const },
          ...(r >= 0 && r < chars.length ? [{ id: 'pointer-right', label: `R=${r}`, x: byIndex(r), y: 385, radius: 17, status: 'compare' as const }] : [])
        ] : [],
        decorationsEn: chars.length ? [
          { id: 'pointer-left', label: `L=${l}`, x: byIndex(Math.min(l, Math.max(chars.length - 1, 0))), y: 315, radius: 17, status: 'current' as const },
          ...(r >= 0 && r < chars.length ? [{ id: 'pointer-right', label: `R=${r}`, x: byIndex(r), y: 385, radius: 17, status: 'compare' as const }] : [])
        ] : [],
        nodes: chars.length ? allNodes : [{ id: 'empty-anchor', label: '∅', x: 600, y: 335, radius: 42, status: 'idle' }],
        nodesEn: chars.length ? allNodes.map(node => ({ ...node, label: node.label })) : [{ id: 'empty-anchor', label: '∅', x: 600, y: 335, radius: 42, status: 'idle' }],
        edges: [], arrows: frameArrows, arrowsEn: frameArrows,
        labels, labelsEn: labels.map(label => ({ ...label, text: typeof label.text === 'string' ? label.text : label.text.en, detail: typeof label.detail === 'string' ? label.detail : label.detail?.en })),
        notes: [{ 'zh-CN': notes, en: notesEn }], notesEn: [notesEn],
        metrics: [
          { label: { 'zh-CN': '窗口区间', en: 'Window range' }, value: rangeText },
          { label: { 'zh-CN': '当前长度', en: 'Current length' }, value: data.currentLength },
          { label: { 'zh-CN': '最长长度', en: 'Best length' }, value: data.bestLength }
        ],
        metricsEn: [
          { label: { 'zh-CN': 'Window range', en: 'Window range' }, value: rangeText },
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
    focusIndex = right;
    const oldLeft = left;
    const repeatedInside = previous !== undefined && previous >= left;
    if (repeatedInside) {
      steps.push(pushFrame({ left, right, windowStart: left, windowEnd: right - 1, currentLength: right - left, bestStart, bestLength, candidate: right, previous: previous ?? null, highlightedMapIndex: previous ?? null, phase: 'inspect' },
        `检查「${char}」：发现重复`, `Check “${char}”: duplicate found`,
        `候选字符 s[${right}]=「${char}」与窗口内旧字符 s[${previous}]=「${char}」相同。当前有效窗口仍是 [${left},${right - 1}]「${chars.slice(left, right).join('')}」；lastSeen 查询命中 ${previous}，因此暂不能把候选字符算入窗口。`,
        `Candidate s[${right}]=“${char}” matches s[${previous}]=“${char}” inside the window. The valid window remains [${left},${right - 1}] “${chars.slice(left, right).join('')}”; lastSeen lookup returns ${previous}, so the candidate is not included yet.`,
        'compare', 'duplicate', `哈希表中 ${char}→${previous} 指向窗口内旧位置。`, `The map entry ${char}→${previous} points to the earlier in-window occurrence.`));
      left = Math.max(left, previous + 1);
      steps.push(pushFrame({ left, right, previousLeft: oldLeft, windowStart: left, windowEnd: right - 1, currentLength: right - left, bestStart, bestLength, candidate: right, previous: previous ?? null, highlightedMapIndex: previous ?? null, phase: 'shrink' },
        '左边界越过旧字符', 'Move left past the old character',
        `旧 left=${oldLeft}；重复字符旧索引=${previous}，所以 left=max(${oldLeft}, ${previous}+1)=${left}。右指针保持 ${right} 不回退，当前窗口缩为 [${left},${right - 1}]「${chars.slice(left, right).join('')}」，长度 ${right - left}。`,
        `Old left=${oldLeft}; prior duplicate index=${previous}, so left=max(${oldLeft}, ${previous}+1)=${left}. Right stays at ${right}; the valid window shrinks to [${left},${right - 1}] “${chars.slice(left, right).join('')}”, length ${right - left}.`,
        'move', 'shrink', `跳过已证明会造成重复的前缀；left 只前进不后退。`, `Skip the proven conflicting prefix; left only moves forward.`));
    } else if (previous !== undefined) {
      steps.push(pushFrame({ left, right, windowStart: left, windowEnd: right - 1, currentLength: right - left, bestStart, bestLength, candidate: right, previous, highlightedMapIndex: previous, phase: 'inspect' },
        `检查「${char}」：旧位置已在窗口外`, `Check “${char}”: previous index is outside`,
        `lastSeen[${char}]=${previous}，但旧位置 ${previous}<left ${left}，已在有效窗口之外。因此 left 保持 ${left}，无需删除任何窗口字符。`,
        `lastSeen[${char}]=${previous}, but ${previous}<left ${left}, outside the valid window. Keep left at ${left}; no current window character needs removal.`,
        'compare', 'duplicate', `旧出现位置 ${previous} 已被边界排除，不构成当前重复。`, `The prior occurrence at ${previous} is already excluded by the left boundary.`));
    }
    const beforeIncludeLength = right - left;
    steps.push(pushFrame({ left, right, windowStart: left, windowEnd: right - 1, currentLength: beforeIncludeLength, bestStart, bestLength, candidate: right, previous: previous ?? null, highlightedMapIndex: previous ?? null, phase: 'include' },
      `读取 s[${right}] 并加入窗口`, `Read s[${right}] and include it`,
      `读取候选字符「${char}」。从 left=${left} 到 right=${right} 的窗口现在无重复，加入后区间为 [${left},${right}]「${chars.slice(left, right + 1).join('')}」，当前长度 ${right - left + 1}。`,
      `Read candidate “${char}”. The range from left=${left} to right=${right} is now unique; including it forms [${left},${right}] “${chars.slice(left, right + 1).join('')}”, current length ${right - left + 1}.`,
      'read', 'read', `字符进入窗口，接下来更新 lastSeen[${char}]。`, `The character enters the window; next update lastSeen[${char}].`));
    lastSeen.set(char, right);
    focusIndex = right;
    const currentLength = right - left + 1;
    if (currentLength > bestLength) {
      const previousBest = bestLength;
      bestStart = left;
      bestLength = currentLength;
      steps.push(pushFrame({ left, right, windowStart: left, windowEnd: right, currentLength, bestStart, bestLength, candidate: right, previous: previous ?? null, highlightedMapIndex: right, phase: 'record' },
        '更新最长记录', 'Update the longest record',
        `当前窗口长度 ${currentLength} 大于旧 best=${previousBest}，因此记录子串 [${bestStart},${bestStart + bestLength})「${chars.slice(bestStart, bestStart + bestLength).join('')}」，best 更新为 ${bestLength}；同时 lastSeen[${char}] 写入 ${right}。`,
        `Current window length ${currentLength} exceeds old best=${previousBest}. Record [${bestStart},${bestStart + bestLength}) “${chars.slice(bestStart, bestStart + bestLength).join('')}”, set best=${bestLength}, and write lastSeen[${char}]=${right}.`,
        'match', 'update-best', `更长窗口替换最佳答案；start/end 使用左闭右开区间。`, `A longer window replaces the best answer; start/end use a half-open interval.`));
    } else {
      steps.push(pushFrame({ left, right, windowStart: left, windowEnd: right, currentLength, bestStart, bestLength, candidate: right, previous: previous ?? null, highlightedMapIndex: right, phase: 'record' },
        '记录字符的最新位置', 'Store the latest character position',
        `窗口 [${left},${right}]「${chars.slice(left, right + 1).join('')}」长度 ${currentLength} 未超过 best=${bestLength}，答案保持不变；lastSeen[${char}] 更新为 ${right}。`,
        `Window [${left},${right}] “${chars.slice(left, right + 1).join('')}” has length ${currentLength}, not greater than best=${bestLength}; keep the answer and update lastSeen[${char}]=${right}.`,
        'insert', 'store', `即使答案不变，也要更新字符最近位置供后续查询。`, `Even when best stays unchanged, update the last-seen index for future lookups.`));
    }
    previousFocus = right;
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
