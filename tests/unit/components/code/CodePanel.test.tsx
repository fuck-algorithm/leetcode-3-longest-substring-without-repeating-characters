import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CodePanel } from '../../../../components/code/CodePanel';
import type { AlgorithmStep, CodeArtifact, Language } from '../../../../types';

vi.mock('../../../../services/storage/indexedDbStore', () => ({
  getSetting: vi.fn(async (_key: string, fallback: Language) => fallback),
  setSetting: vi.fn(async () => undefined)
}));

const step: AlgorithmStep = {
  id: 0,
  title: '初始化',
  description: '初始化指针',
  binding: {
    anchorIds: ['init'],
    variables: { i: 0, target: 9 }
  },
  frame: { nodes: [], edges: [], arrows: [], labels: [], notes: [] }
};

function stepWithVariables(id: number, variables: Record<string, unknown>, anchorIds = ['init']): AlgorithmStep {
  return {
    id,
    title: `步骤${id}`,
    description: `解释步骤${id}`,
    binding: { anchorIds, variables },
    frame: { nodes: [], edges: [], arrows: [], labels: [], notes: [] }
  };
}

function artifact(language: Language, code: string): CodeArtifact {
  return {
    language,
    code,
    anchorLineMap: { init: [1] }
  };
}

const codeArtifacts: Record<Language, CodeArtifact> = {
  java: artifact('java', 'int i = 0;\nint j = 1;'),
  python: artifact('python', 'i = 0\nj = 1'),
  go: artifact('go', 'i := 0\nj := 1'),
  javascript: artifact('javascript', 'let i = 0;\nlet j = 1;')
};

describe('CodePanel', () => {
  it('renders line numbers and highlights lines bound to the current step', () => {
    render(
      <CodePanel language="java" onLanguageChange={() => undefined} codeArtifacts={codeArtifacts} step={step} />
    );

    expect(screen.getByTestId('code-line-1').className).toContain('active');
    expect(screen.getByTestId('code-line-2').className).not.toContain('active');
    expect(screen.getByTestId('variable-watch').textContent).toContain('target');
  });

  it('shows complete lastSeen state, highlights the lookup result and prints updates as old to new', () => {
    const previous = stepWithVariables(3, {
      left: 0, right: 3, window: 'abc', bestLength: 3,
      lastSeen: { a: 0, b: 1, c: 2 }
    }, ['duplicate']);
    const query = stepWithVariables(4, {
      left: 0, right: 3, window: 'abc', bestLength: 3, bestRange: [0, 3],
      lookupChar: 'a', lookupIndex: 0, lookupFound: true, lookupCharacter: 'a',
      lastSeen: { a: 0, b: 1, c: 2 }
    }, ['lookup']);
    const { rerender } = render(
      <CodePanel language="java" onLanguageChange={() => undefined} codeArtifacts={codeArtifacts} previousStep={previous} step={query} />
    );

    expect(screen.getByTestId('last-seen-watch').textContent).toContain('3 项');
    expect(screen.getByTestId('last-seen-entry-a').getAttribute('data-lookup')).toBe('true');
    expect(screen.getByTestId('last-seen-entry-b').textContent).toContain('不变');
    expect(screen.getByTestId('lookup-result').textContent).toContain('命中索引 0');
    expect(screen.getByTestId('best-range-watch').textContent).toContain('[0,3]');

    const write = stepWithVariables(5, {
      left: 1, right: 3, previousLeft: 0, window: 'bca', bestLength: 3, bestRange: [0, 3],
      lastSeenWrite: 'a', lastSeenPrevious: 0, lastSeen: { a: 3, b: 1, c: 2 }
    }, ['store']);
    rerender(<CodePanel language="java" onLanguageChange={() => undefined} codeArtifacts={codeArtifacts} previousStep={query} step={write} />);
    expect(screen.getByTestId('last-seen-entry-a').textContent).toContain('0 → 3');
    expect(screen.getByTestId('last-seen-entry-a').getAttribute('data-write')).toBe('true');
    expect(screen.getByTestId('last-seen-write').textContent).toContain('0 → 3');
  });

  it('distinguishes a missing lookup candidate from an entry already stored in lastSeen', () => {
    const current = stepWithVariables(1, {
      left: 0, right: 0, lookupChar: 'a', lookupCandidate: 'a', lookupCharacter: 'a', lookupIndex: null, lookupFound: false, bestRange: null, lastSeen: {}
    }, ['read']);
    render(<CodePanel language="java" onLanguageChange={() => undefined} codeArtifacts={codeArtifacts} step={current} />);
    expect(screen.getByTestId('lookup-miss').textContent).toContain('尚未写入 lastSeen');
    expect(screen.getByTestId('last-seen-entry-a').getAttribute('data-change')).toBe('miss');
    expect(screen.getByTestId('last-seen-count').textContent).toContain('0 项');
    expect(screen.getByTestId('best-range-watch').textContent).toContain('null');
  });

  it('explains empty map and map entries removed relative to the previous snapshot', () => {
    const previous = stepWithVariables(0, { left: 0, right: 0, lastSeen: { a: 0 } });
    const empty = stepWithVariables(1, { left: 0, right: 0, lastSeen: {} });
    const { rerender } = render(
      <CodePanel language="java" onLanguageChange={() => undefined} codeArtifacts={codeArtifacts} previousStep={previous} step={empty} />
    );
    expect(screen.getByTestId('last-seen-entry-a').textContent).toContain('已移除');
    rerender(<CodePanel language="java" onLanguageChange={() => undefined} codeArtifacts={codeArtifacts} step={stepWithVariables(0, { lastSeen: {} })} />);
    expect(screen.getByTestId('last-seen-watch').textContent).toContain('尚未记录字符');
  });

  it('notifies the parent when switching languages', () => {
    const onLanguageChange = vi.fn();
    render(
      <CodePanel
        language="java"
        onLanguageChange={onLanguageChange}
        codeArtifacts={codeArtifacts}
        step={step}
      />
    );

    fireEvent.click(screen.getByTestId('language-python'));

    expect(onLanguageChange).toHaveBeenCalledWith('python');
  });
});
