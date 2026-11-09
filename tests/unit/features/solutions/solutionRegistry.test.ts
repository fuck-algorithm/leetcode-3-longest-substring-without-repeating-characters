import { describe, it, expect } from 'vitest';
import { createSolutionRegistry } from '../../../../features/solutions/solutionRegistry';

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

  it('teaches repeated characters as a lookup, shrink and re-entry sequence with observable map rows', () => {
    const solution = createSolutionRegistry('abcabcbb')[0];
    const duplicate = solution.steps.find((step) => step.narration?.includes('候选字符 s[3]'))!;
    expect(duplicate.binding.variables).toMatchObject({ left: 0, right: 3, window: 'abc' });
    expect(duplicate.frame.nodes.some((node) => node.id === 'last-97' && node.label === 'a → 0')).toBe(true);
    expect(duplicate.frame.arrows.some((arrow) => JSON.stringify(arrow.text).includes('Repeat?'))).toBe(true);
    const shrink = solution.steps.find((step) => step.operation === 'move' && step.binding.variables.right === 3)!;
    expect(shrink.narration).toContain('left=max(0, 0+1)=1');
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
