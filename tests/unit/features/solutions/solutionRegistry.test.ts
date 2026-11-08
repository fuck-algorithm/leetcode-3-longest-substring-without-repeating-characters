import { describe, it, expect } from 'vitest';
import { createSolutionRegistry } from '../../../../features/solutions/solutionRegistry';

describe('createSolutionRegistry', () => {
  it('should return at least one solution', () => {
    const registry = createSolutionRegistry();
    expect(registry.length).toBeGreaterThan(0);
  });

  it('should have valid, anchored, unique semantic steps for the actual demo input', () => {
    const solution = createSolutionRegistry('abcabcbb')[0];
    expect(solution.steps.length).toBeGreaterThan(8);
    expect(solution.steps.map((step) => step.id)).toEqual(solution.steps.map((_step, index) => index));
    for (const [index, step] of solution.steps.entries()) {
      expect(step.operation).toBeTruthy();
      expect(step.narration).toBeTruthy();
      expect(step.narrationEn).toBeTruthy();
      expect(step.binding.anchorIds.length).toBeGreaterThan(0);
      expect(step.frame.nodes.length).toBe(8);
      expect(step.frame.metrics).toHaveLength(3);
      const current = step.frame.nodes.filter((node) => node.status === 'current');
      expect(current.length).toBeLessThanOrEqual(1);
      if (index > 0) expect(step.narration).not.toBe(solution.steps[index - 1].narration);
      for (const arrow of step.frame.arrows) expect(arrow.text || arrow.kind === 'pointer').toBeTruthy();
      for (const label of step.frame.labels) expect(label.text).toBeTruthy();
    }
  });

  it('should generate a semantic snapshot sequence for the requested input', () => {
    const solution = createSolutionRegistry('pwwkew')[0];
    expect(solution.steps.some((step) => step.frame.nodes.some((node) => node.label === 'p'))).toBe(true);
    expect(solution.steps.some((step) => step.operation === 'compare')).toBe(true);
    expect(solution.steps.at(-1)?.narrationEn).toContain('wke');
  });

  it('should validate LeetCode input boundaries and random legal strings', () => {
    const solution = createSolutionRegistry()[0];
    expect(solution.validateInput('').valid).toBe(true);
    expect(solution.validateInput('a'.repeat(50000)).valid).toBe(true);
    expect(solution.validateInput('a'.repeat(50001)).valid).toBe(false);
    expect(solution.validateInput('你好 😀 !').valid).toBe(true);
    expect(solution.validateInput(solution.generateRandom()).valid).toBe(true);
  });

  it('should use unique stable node ids and valid references in every frame', () => {
    const registry = createSolutionRegistry();
    const sol = registry[0];

    for (const step of sol.steps) {
      const ids = step.frame.nodes.map((node) => node.id);
      expect(new Set(ids).size).toBe(ids.length);

      const idSet = new Set(ids);
      for (const edge of step.frame.edges) {
        expect(idSet.has(edge.from)).toBe(true);
        expect(idSet.has(edge.to)).toBe(true);
      }
      for (const label of step.frame.labels) {
        expect(idSet.has(label.targetId)).toBe(true);
      }
      for (const arrow of step.frame.arrows) {
        expect(arrow.id.length).toBeGreaterThan(0);
      }

      const focused = step.frame.nodes.filter(
        (node) => node.status === 'current' || (!node.status && node.kind === 'highlight')
      );
      expect(focused.length).toBeLessThanOrEqual(1);
    }
  });

  it('should keep node ids stable across animation steps', () => {
    const registry = createSolutionRegistry();
    const sol = registry[0];
    const first = new Set(sol.steps[0].frame.nodes.map((node) => node.id));
    const reused = sol.steps[1].frame.nodes.filter((node) => first.has(node.id));

    expect(reused.length).toBeGreaterThan(0);
  });

  it('should contain all four language code artifacts', () => {
    const registry = createSolutionRegistry();
    const sol = registry[0];
    expect(sol.codes.java).toBeDefined();
    expect(sol.codes.python).toBeDefined();
    expect(sol.codes.go).toBeDefined();
    expect(sol.codes.javascript).toBeDefined();
  });

  it('should validate problem string input and random legal strings', () => {
    const solution = createSolutionRegistry()[0];
    expect(solution.validateInput('a'.repeat(50001)).valid).toBe(false);
    expect(solution.validateInput('ab c!').valid).toEqual(true);
    expect(solution.validateInput(solution.generateRandom()).valid).toBe(true);
  });
});
