import { describe, it, expect } from 'vitest';
import { createSolutionRegistry } from '../../../../features/solutions/solutionRegistry';
import { fitFrameToCanvas } from '../../../../features/animation/render/renderFrame';

describe('createSolutionRegistry', () => {
  it('builds readable semantic frames with operation, narration and valid bindings', () => {
    const solution = createSolutionRegistry('abcabcbb')[0];
    expect(solution.steps.length).toBeGreaterThan(20);
    expect(solution.steps.map((step) => step.id)).toEqual(solution.steps.map((_step, index) => index));
    for (const [index, step] of solution.steps.entries()) {
      expect(step.operation).toBeTruthy();
      expect(step.narration).toBeTruthy();
      expect(step.narrationEn).toBeTruthy();
      expect(step.binding.anchorIds.length).toBeGreaterThan(0);
      expect(step.frame.metrics).toHaveLength(3);
      expect(step.frame.nodes.filter((node) => node.status === 'current').length).toBeLessThanOrEqual(1);
      expect(step.frame.nodes.filter((node) => node.status === 'compare').length).toBeLessThanOrEqual(2);
      if (index > 0) expect(step.narration).not.toBe(solution.steps[index - 1].narration);
      for (const arrow of step.frame.arrows) expect(arrow.text || arrow.kind === 'pointer').toBeTruthy();
      for (const label of step.frame.labels) expect(label.text).toBeTruthy();
    }
  });

  it('keeps shared character coordinates unchanged and all plotted glyphs inside the logical canvas', () => {
    const solution = createSolutionRegistry('abcabcbb')[0];
    for (let index = 0; index < solution.steps.length; index += 1) {
      const frame = solution.steps[index].frame;
      const fitted = fitFrameToCanvas(frame);
      for (const node of fitted.nodes) {
        expect(node.x - (node.radius ?? 24)).toBeGreaterThanOrEqual(0);
        expect(node.x + (node.radius ?? 24)).toBeLessThanOrEqual(1200);
        expect(node.y - (node.radius ?? 24)).toBeGreaterThanOrEqual(0);
        expect(node.y + (node.radius ?? 24)).toBeLessThanOrEqual(720);
      }
      if (index === 0) continue;
      const previous = new Map(fitFrameToCanvas(solution.steps[index - 1].frame).nodes.map((node) => [node.id, { x: node.x, y: node.y }]));
      for (const node of fitted.nodes) {
        const position = previous.get(node.id);
        if (position && node.id.startsWith('char-')) expect({ x: node.x, y: node.y }).toEqual(position);
      }
    }
  });

  it('keeps map snapshots immutable and distinguishes lookup from the subsequent write', () => {
    const solution = createSolutionRegistry('abcaa')[0];
    const initialWrite = solution.steps.find((step) => step.operation === 'insert' && step.binding.variables.right === 0)!;
    const readB = solution.steps.find((step) => step.title.includes('查找「b」'))!;
    const writeB = solution.steps.find((step) => step.operation === 'insert' && step.binding.variables.right === 1)!;
    const queryA = solution.steps.find((step) => step.operation === 'compare' && step.binding.variables.right === 3)!;
    const shrinkA = solution.steps.find((step) => step.operation === 'move' && step.binding.variables.right === 3)!;
    const overwriteA = solution.steps.find((step) => step.operation === 'insert' && step.binding.variables.right === 3)!;

    expect(initialWrite.binding.variables.lastSeen).toEqual({ a: 0 });
    expect(readB.binding.variables.lastSeen).toEqual({ a: 0 });
    expect(readB.frame.nodes.some((node) => node.id === 'last-97' && node.label === 'a → 0')).toBe(true);
    expect(readB.frame.arrows.some((arrow) => JSON.stringify(arrow.text).includes('b 未命中'))).toBe(true);
    expect(readB.binding.variables.lookupChar).toBe('b');
    expect(readB.binding.variables.lookupIndex).toBeNull();
    expect(readB.binding.variables.lookupFound).toBe(false);
    expect(readB.binding.variables.lastSeenWrite).toBeUndefined();
    expect(writeB.binding.variables.lastSeen).toEqual({ a: 0, b: 1 });
    expect(solution.steps[0].binding.variables.lastSeen).toEqual({});
    expect(queryA.binding.variables).toMatchObject({ lookupChar: 'a', lookupIndex: 0, lookupFound: true, left: 0 });
    expect(queryA.binding.variables.lastSeen).toEqual({ a: 0, b: 1, c: 2 });
    expect(shrinkA.binding.variables).toMatchObject({ lookupChar: 'a', lookupIndex: 0, lookupFound: true, previousLeft: 0, left: 1 });
    expect(overwriteA.binding.variables).toMatchObject({ lastSeenWrite: 'a', lastSeenPrevious: 0 });
    expect(overwriteA.binding.variables.lastSeen).toEqual({ a: 3, b: 1, c: 2 });
  });

  it('resolves every semantic step anchor to valid lines in all supported languages', () => {
    const solution = createSolutionRegistry('abcabcbb')[0];
    for (const step of solution.steps) {
      for (const language of ['java', 'python', 'go', 'javascript'] as const) {
        const code = solution.codes[language];
        const highlighted = step.binding.anchorIds.flatMap((anchor) => code.anchorLineMap[anchor] ?? []);
        expect(highlighted.length, `${language} ${step.title}`).toBeGreaterThan(0);
        for (const line of highlighted) expect(line).toBeGreaterThanOrEqual(1);
        for (const line of highlighted) expect(line).toBeLessThanOrEqual(code.code.split('\n').length);
      }
    }
  });

  it('marks the active window and connects an in-window duplicate to its earlier occurrence', () => {
    const solution = createSolutionRegistry('abcabcbb')[0];
    const include = solution.steps.find((step) => step.operation === 'read' && step.binding.variables.right === 2)!;
    const duplicate = solution.steps.find((step) => step.narration?.includes('候选字符 s[3]'))!;
    expect(include.frame.windowRange).toEqual({ startId: 'char-0', endId: 'char-2' });
    expect(duplicate.frame.pendingNodeId).toBe('char-3');
    expect(duplicate.frame.pendingAnchorNodeId).toBe('char-0');
  });

  it('separates map writes from best-window updates and explains when the best stays unchanged', () => {
    const solution = createSolutionRegistry('aaa')[0];
    const writeIndex = solution.steps.findIndex((step) => step.operation === 'insert' && step.binding.variables.right === 1);
    const unchangedIndex = solution.steps.findIndex((step) => step.title === '保留当前最长答案' && step.binding.variables.right === 1);
    expect(writeIndex).toBeGreaterThan(-1);
    expect(unchangedIndex).toBe(writeIndex + 1);
    expect(solution.steps[writeIndex].narration).toContain('lastSeen[a]');
    expect(solution.steps[unchangedIndex].narration).toContain('答案区间 [0,1) 保持不变');

    const longer = createSolutionRegistry('abc')[0];
    const writeC = longer.steps.findIndex((step) => step.operation === 'insert' && step.binding.variables.right === 2);
    const bestIndex = longer.steps.findIndex((step) => step.operation === 'match' && step.binding.variables.right === 2);
    expect(bestIndex).toBe(writeC + 1);
    expect(longer.steps[bestIndex].narration).toContain('旧 best=2');
  });

  it('teaches repeated characters as a lookup, shrink and re-entry sequence with observable map rows', () => {
    const solution = createSolutionRegistry('abcabcbb')[0];
    const duplicate = solution.steps.find((step) => step.narration?.includes('候选字符 s[3]'))!;
    expect(duplicate.binding.variables).toMatchObject({ left: 0, right: 3, window: 'abc' });
    expect(duplicate.frame.nodes.some((node) => node.id === 'last-97' && node.label === 'a → 0')).toBe(true);
    expect(duplicate.frame.arrows.some((arrow) => JSON.stringify(arrow.text).includes('Repeat?'))).toBe(true);
    const shrink = solution.steps.find((step) => step.operation === 'move' && step.binding.variables.right === 3)!;
    expect(shrink.narration).toContain('left=max(0, 0+1)=1');
    expect(shrink.binding.variables).toMatchObject({ lookupChar: 'a', lookupIndex: 0, lookupFound: true, previousLeft: 0, left: 1 });
    expect(shrink.frame.arrows.some((arrow) => JSON.stringify(arrow.text).includes('Move left'))).toBe(true);
    const final = solution.steps.at(-1)!;
    expect(final.narration).toContain('[0,3)');
    expect(final.frame.nodes.filter((node) => node.status === 'done').map((node) => node.label)).toEqual(['a', 'b', 'c']);
  });

  it('explains why a duplicate before left does not move the boundary', () => {
    const solution = createSolutionRegistry('abba')[0];
    const outside = solution.steps.find((step) => step.narration?.includes('lastSeen[a]=0'))!;
    expect(outside.binding.variables.left).toBe(2);
    expect(outside.narration).toContain('left 保持 2');
    expect(outside.frame.nodes.some((node) => node.id === 'last-97' && node.label === 'a → 0')).toBe(true);
  });

  it('explains repeated-only inputs and exposes the first answer location', () => {
    const solution = createSolutionRegistry('bbbbb')[0];
    const final = solution.steps.at(-1)!;
    expect(final.binding.variables.bestLength).toBe(1);
    expect(final.narration).toContain('[0,1)');
    expect(final.frame.nodes.find((node) => node.id === 'char-0')?.status).toBe('done');
  });

  it('shows an explicit empty-input frame and returns zero', () => {
    const solution = createSolutionRegistry('')[0];
    expect(solution.steps).toHaveLength(2);
    expect(solution.steps[0].frame.nodes[0].id).toBe('empty-anchor');
    expect(solution.steps.at(-1)?.binding.variables.bestLength).toBe(0);
    expect(solution.steps.at(-1)?.narrationEn).toContain('length 0');
  });

  it('accepts readable Unicode input and rejects visualization workloads that would overflow', () => {
    const solution = createSolutionRegistry()[0];
    expect(solution.validateInput('').valid).toBe(true);
    expect(solution.validateInput('a'.repeat(200)).valid).toBe(true);
    expect(solution.validateInput('a'.repeat(201)).valid).toBe(false);
    expect(solution.validateInput('你好 😀 !').valid).toBe(true);
    expect(solution.validateInput(solution.generateRandom()).valid).toBe(true);
  });

  it('uses unique stable ids and valid frame references', () => {
    const solution = createSolutionRegistry()[0];
    for (const step of solution.steps) {
      const ids = step.frame.nodes.map((node) => node.id);
      expect(new Set(ids).size).toBe(ids.length);
      const nodeIds = new Set(ids);
      for (const edge of step.frame.edges) {
        expect(nodeIds.has(edge.from)).toBe(true);
        expect(nodeIds.has(edge.to)).toBe(true);
      }
      for (const label of step.frame.labels) expect(nodeIds.has(label.targetId)).toBe(true);
      for (const arrow of step.frame.arrows) expect(arrow.id.length).toBeGreaterThan(0);
    }
    expect(solution.codes.java).toBeDefined();
    expect(solution.codes.python).toBeDefined();
    expect(solution.codes.go).toBeDefined();
    expect(solution.codes.javascript).toBeDefined();
  });
});
