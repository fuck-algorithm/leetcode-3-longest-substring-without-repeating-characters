import type { AlgorithmStep, InputValidationResult, SolutionDefinition } from '../../types';
import { buildSampleCodes } from './sampleCodes';

const examples = [
  { id: 's1', label: 'abcabcbb', labelEn: 'abcabcbb', value: 'abcabcbb' },
  { id: 's2', label: 'bbbbb', labelEn: 'bbbbb', value: 'bbbbb' },
  { id: 's3', label: 'pwwkew', labelEn: 'pwwkew', value: 'pwwkew' }
];

function validateInput(raw: string): InputValidationResult {
  const value = raw;
  if (Array.from(value).length > 50000) {
    return { valid: false, error: { 'zh-CN': '字符串长度不能超过 50000', en: 'String length must not exceed 50,000 characters' } };
  }
  return { valid: true, parsed: value };
}

function createSteps(input: string): AlgorithmStep[] {
  const chars = Array.from(input);
  const steps: AlgorithmStep[] = [];
  const lastSeen = new Map<string, number>();
  let left = 0;
  let bestStart = 0;
  let bestLength = 0;

  const snapshot = (
    title: string, titleEn: string, description: string, descriptionEn: string,
    operation: AlgorithmStep['operation'], anchor: string, focus: number | null,
    compare: number | null, visitedTo: number, right: number, bestStartAtFrame: number, bestLengthAtFrame: number,
    notes: string, notesEn: string
  ): AlgorithmStep => {
    const rightBound = Math.max(0, Math.min(right, chars.length - 1));
    const leftBound = Math.max(0, Math.min(left, chars.length));
    const nodes = chars.map((label, index) => ({
      id: `char-${index}`, label, x: 80 + index * 72, y: 350, radius: 24,
      badge: String(index), sublabel: `s[${index}]`,
      status: index === focus ? 'current' as const : index === compare ? 'compare' as const :
        index < visitedTo ? 'visited' as const :
        bestLengthAtFrame > 0 && index >= bestStartAtFrame && index < bestStartAtFrame + bestLengthAtFrame ? 'done' as const : 'idle' as const
    }));
    const currentLeft = leftBound;
    const currentWindow = right >= left ? chars.slice(currentLeft, rightBound + 1) : [];
    const xAt = (index: number) => chars.length <= 1 ? 600 : 80 + index * (1040 / (chars.length - 1));
    const arrows = operation === 'move' && focus !== null ? [{
      id: `left-move-${steps.length}`, from: { x: xAt(Math.max(0, focus)), y: 420 },
      to: { x: xAt(left), y: 420 }, text: { 'zh-CN': `左边界移至 ${left}`, en: `Move left boundary to ${left}` }, kind: 'transfer' as const, curve: -18
    }] : [];
    return {
      id: steps.length, title, titleEn, description, descriptionEn,
      narration: description, narrationEn: descriptionEn, operation,
      binding: { anchorIds: [anchor], variables: { left, right: Math.max(right, 0), window: currentWindow.join(''), bestLength: bestLengthAtFrame } },
      frame: {
        nodes: nodes.map((node, index) => ({
          ...node,
          x: chars.length <= 1 ? 600 : 80 + index * (1040 / (chars.length - 1))
        })),
        nodesEn: nodes.map((node, index) => ({ ...node, x: chars.length <= 1 ? 600 : 80 + index * (1040 / (chars.length - 1)), label: String(node.label), sublabel: `s[${node.badge}]`, status: node.status === 'visited' ? 'done' as const : node.status })),
      arrowsEn: arrows.map((arrow) => ({ ...arrow, text: typeof arrow.text === 'string' ? arrow.text : arrow.text?.en })),
      labelsEn: currentWindow.length ? [{
        id: 'window-label', targetId: `char-${currentLeft}`,
        text: `Window “${currentWindow.join('')}”`, detail: `${currentWindow.length} unique character(s)`,
        position: 'top', variant: 'pointer', tone: 'accent'
      }] : [],
        edges: [], arrows, labels: currentWindow.length ? [{
          id: 'window-label', targetId: `char-${currentLeft}`,
          text: { 'zh-CN': `窗口「${currentWindow.join('')}」`, en: `Window “${currentWindow.join('')}”` },
          detail: { 'zh-CN': `共 ${currentWindow.length} 个互异字符`, en: `${currentWindow.length} unique character(s)` },
          position: 'top', variant: 'pointer', tone: 'accent'
        }] : [], notes: [{ 'zh-CN': notes, en: notesEn }],
        metrics: [
          { label: { 'zh-CN': '窗口长度', en: 'Window length' }, value: currentWindow.length },
          { label: { 'zh-CN': '左边界', en: 'Left boundary' }, value: left },
          { label: { 'zh-CN': '最长长度', en: 'Best length' }, value: bestLengthAtFrame }
        ],
        metricsEn: [
          { label: { 'zh-CN': 'Window length', en: 'Window length' }, value: currentWindow.length },
          { label: { 'zh-CN': 'Left boundary', en: 'Left boundary' }, value: left },
          { label: { 'zh-CN': 'Best length', en: 'Best length' }, value: bestLengthAtFrame }
        ],
      }
    };
  };

  steps.push(snapshot('初始化窗口', 'Initialize the window', '建立空滑动窗口；左边界从 0 开始，之后只向右移动以保持扫描线性。', 'Create an empty sliding window; the left boundary starts at 0 and only moves right, keeping the scan linear.', 'init', 'init', null, null, 0, -1, 0, 0, '窗口为空，等待读取字符。', 'The window is empty and ready to read a character.'));

  for (let right = 0; right < chars.length; right += 1) {
    const char = chars[right];
    const previous = lastSeen.get(char);
    const duplicate = previous !== undefined && previous >= left;
    if (duplicate) {
      steps.push(snapshot('发现重复字符', 'Detect a repeated character', `读取「${char}」时发现它仍在当前窗口；必须先越过旧位置 ${previous} 才能维持互异条件。`, `Reading “${char}” finds it inside the current window; move past index ${previous} to preserve uniqueness.`, 'compare', 'duplicate', right, previous, left, right, bestStart, bestLength, `重复字符「${char}」位于窗口内。`, `The repeated character “${char}” is inside the window.`));
      left = previous + 1;
      steps.push(snapshot('移动左边界', 'Move the left boundary', `左边界越过旧「${char}」并到达 ${left}；右指针不回退，已排除字符保留 visited 轨迹。`, `Move the left boundary past the old “${char}” to ${left}; the right pointer never retreats, and excluded characters remain visited.`, 'move', 'shrink', right, null, left, right, bestStart, bestLength, `当前窗口已恢复无重复。`, `The current window is unique again.`));
    }
    const windowLength = right - left + 1;
    steps.push(snapshot('扩展窗口', 'Extend the window', `将索引 ${right} 的「${char}」纳入窗口；窗口长度为 ${windowLength}，因为此前已排除所有重复字符。`, `Include “${char}” at index ${right}; the window now has ${windowLength} characters because prior duplicates were removed.`, 'read', 'read', right, null, left, right, bestStart, bestLength, `窗口内容：${chars.slice(left, right + 1).join('') || '空'}。`, `Window contents: ${chars.slice(left, right + 1).join('') || 'empty'}.`));
    lastSeen.set(char, right);
    if (windowLength > bestLength) {
      bestStart = left;
      bestLength = windowLength;
      steps.push(snapshot('更新最长结果', 'Update the longest result', `当前窗口「${chars.slice(bestStart, bestStart + bestLength).join('')}」长度 ${bestLength}，超过历史最大值，因此更新答案。`, `The current window “${chars.slice(bestStart, bestStart + bestLength).join('')}” has length ${bestLength}, exceeding the previous maximum, so update the answer.`, 'match', 'update-best', right, null, left, right, bestStart, bestLength, `最长子串记录已更新。`, `The longest-substring record is updated.`));
    }
  }
  if (chars.length === 0) {
    steps.push(snapshot('返回空字符串结果', 'Return the empty-string result', '输入为空，因此没有字符可加入窗口；最长无重复子串长度为 0。', 'The input is empty, so no character enters the window; the longest unique substring has length 0.', 'done', 'return', null, null, 0, -1, 0, 0, '最终长度：0。', 'Final length: 0.'));
  } else {
    steps.push(snapshot('完成扫描', 'Finish the scan', `扫描结束，最长无重复子串为「${chars.slice(bestStart, bestStart + bestLength).join('')}」，长度 ${bestLength}。`, `The scan is complete. The longest unique substring is “${chars.slice(bestStart, bestStart + bestLength).join('')}”, with length ${bestLength}.`, 'done', 'return', null, null, chars.length, chars.length - 1, bestStart, bestLength, `答案长度：${bestLength}。`, `Answer length: ${bestLength}.`));
  }
  return steps;
}

export function createSolutionRegistry(input = 'abcabcbb'): SolutionDefinition[] {
  return [{
    id: 'sliding-window', name: '滑动窗口', nameEn: 'Sliding window',
    thought: '用哈希表记录字符最后出现位置。右边界逐个扫描；遇到仍在当前窗口内的重复字符时，把左边界跳到该字符旧位置的后一格。每一步维持窗口无重复，因此总复杂度 O(n)，空间复杂度 O(min(n, 字符集大小))。',
    thoughtEn: 'Track each character’s last index in a map. Scan with a right boundary; when a repeated character is still inside the window, jump the left boundary to one past its prior index. The window stays unique, giving O(n) time and O(min(n, alphabet size)) space.',
    samples: examples, samplesEn: examples, codes: buildSampleCodes(), steps: createSteps(input),
    validateInput,
    generateRandom: () => Array.from({ length: 5 + Math.floor(Math.random() * 7) }, () => String.fromCharCode(97 + Math.floor(Math.random() * 5))).join('')
  }];
}
