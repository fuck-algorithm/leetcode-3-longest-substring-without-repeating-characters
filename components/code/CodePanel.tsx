import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import { getSetting, setSetting } from '../../services/storage/indexedDbStore';
import type { AlgorithmStep, CodeArtifact, Language } from '../../types';

type Props = {
  locale: 'en' | 'zh-CN';
  language: Language;
  onLanguageChange: (language: Language) => void;
  codeArtifacts: Record<Language, CodeArtifact>;
  previousStep?: AlgorithmStep;
  step: AlgorithmStep;
};

function mappingStatus(previous: Record<string, number> | undefined, current: Record<string, number>, key: string): 'added' | 'updated' | 'unchanged' {
  if (!previous) return 'unchanged';
  if (!(key in previous)) return 'added';
  return previous[key] === current[key] ? 'unchanged' : 'updated';
}

const LANGUAGE_LABELS: Record<Language, string> = {
  java: 'Java',
  python: 'Python',
  go: 'Go',
  javascript: 'JavaScript'
};

const LANGUAGE_KEY = 'preferred-language';

const PRISM_LANGUAGE_MAP: Record<Language, string> = {
  java: 'java',
  python: 'python',
  go: 'go',
  javascript: 'javascript'
};

function resolveLines(step: AlgorithmStep, artifact: CodeArtifact): number[] {
  const merged = new Set<number>();
  for (const anchorId of step.binding.anchorIds) {
    const lines = artifact.anchorLineMap[anchorId] ?? [];
    for (const line of lines) {
      merged.add(line);
    }
  }
  return [...merged].sort((a, b) => a - b);
}

type PrismTokenLike = {
  type: string | string[];
  content: string | PrismTokenLike | PrismTokenLike[];
};

function renderPrismTokens(tokens: Array<string | PrismTokenLike>, keyPrefix: string): ReactNode[] {
  return tokens.map((token, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (typeof token === 'string') {
      return token;
    }

    const className = `token ${Array.isArray(token.type) ? token.type.join(' ') : token.type}`;
    const content = Array.isArray(token.content)
      ? renderPrismTokens(token.content, key)
      : typeof token.content === 'string'
        ? token.content
        : renderPrismTokens([token.content], key);

    return (
      <span key={key} className={className}>
        {content}
      </span>
    );
  });
}

export function CodePanel({ locale, language, onLanguageChange, codeArtifacts, previousStep, step }: Props) {
  const artifact = codeArtifacts[language];
  const highlighted = resolveLines(step, artifact);

  const tokenizedLines = useMemo(() => {
    const prismLanguage = PRISM_LANGUAGE_MAP[language] ?? 'javascript';
    const grammar = Prism.languages[prismLanguage] ?? Prism.languages.javascript;
    return artifact.code.split('\n').map((line) => {
      const tokens = Prism.tokenize(line || ' ', grammar);
      return renderPrismTokens(tokens, `${prismLanguage}-${line}`);
    });
  }, [artifact.code, language]);

  useEffect(() => {
    void getSetting<Language>(LANGUAGE_KEY, language)
      .then((saved) => {
        if (saved && codeArtifacts[saved]) {
          onLanguageChange(saved);
        }
      })
      .catch(() => {
        // 存储不可用时保持当前语言。
      });
  }, [codeArtifacts, language, onLanguageChange]);

  function handleLanguageChange(next: Language) {
    onLanguageChange(next);
    void setSetting<Language>(LANGUAGE_KEY, next);
  }

  return (
    <div className="code-panel" data-testid="code-panel" aria-label={locale === 'en' ? 'Source code' : '源代码'}>
      <div className="code-toolbar">
        {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
          <button
            key={lang}
            type="button"
            data-testid={`language-${lang}`}
            className={language === lang ? 'lang-btn active' : 'lang-btn'}
            onClick={() => handleLanguageChange(lang)}
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>

      <div className="code-content">
        {tokenizedLines.map((lineHtml, idx) => {
          const lineNo = idx + 1;
          const active = highlighted.includes(lineNo);
          return (
            <div
              key={lineNo}
              data-testid={`code-line-${lineNo}`}
              className={active ? 'code-line active' : 'code-line'}
            >
              <span className="line-no">{lineNo}</span>
              <span className="line-code">{lineHtml || ' '}</span>
            </div>
          );
        })}
      </div>

      <div className="variable-watch" data-testid="variable-watch" aria-label={locale === 'en' ? 'Variable values' : '变量值'}>
        {Object.entries(step.binding.variables).filter(([name]) => name !== 'lastSeen' && !['lookupChar', 'lookupIndex', 'lookupFound', 'lookupCharacter', 'lookupCandidate', 'lastSeenWrite', 'lastSeenPrevious'].includes(name)).map(([name, value]) => {
          const previousValue = previousStep?.binding.variables[name];
          const changed = previousStep !== undefined && JSON.stringify(previousValue) !== JSON.stringify(value);
          return (
            <div key={name} className={`var-row${changed ? ' var-row--changed' : ''}`} data-changed={changed ? 'true' : undefined}>
              <span>{name}</span>
              <span>{changed ? `${JSON.stringify(previousValue)} → ${JSON.stringify(value)}` : JSON.stringify(value)}</span>
            </div>
          );
        })}
        {step.binding.variables.bestRange !== undefined ? (
          <div className="var-inspection var-inspection--window" data-testid="best-range-watch">
            <span>{locale === 'en' ? 'Best' : '最佳区间'}</span>
            <span>{JSON.stringify(step.binding.variables.bestRange)}</span>
            <b>{locale === 'en' ? 'half-open' : '左闭右开'}</b>
          </div>
        ) : null}
        {typeof step.binding.variables.lastSeenWrite === 'string' ? (
          <div className="var-inspection var-inspection--write" data-testid="last-seen-write">
            <span>{locale === 'en' ? 'Write' : '写入'}</span>
            <span>{step.binding.variables.lastSeenWrite}</span>
            <b>{typeof step.binding.variables.lastSeenPrevious === 'number'
              ? `${step.binding.variables.lastSeenPrevious} → ${step.binding.variables.right}`
              : `${locale === 'en' ? 'new' : '新增'} → ${step.binding.variables.right}`}</b>
          </div>
        ) : null}
        {typeof step.binding.variables.lookupChar === 'string' && typeof step.binding.variables.lookupIndex === 'number' && step.binding.variables.lookupFound ? (
          <div className="var-inspection" data-testid="lookup-result">
            <span>{locale === 'en' ? 'Lookup' : '查找'}</span>
            <span>{step.binding.variables.lookupChar}</span>
            <b>{locale === 'en' ? 'found at' : '命中索引'} {step.binding.variables.lookupIndex}</b>
          </div>
        ) : null}
        {step.binding.variables.lastSeen !== undefined ? (() => {
          const current = step.binding.variables.lastSeen as Record<string, number>;
          const previous = previousStep?.binding.variables.lastSeen as Record<string, number> | undefined;
          const statusLabel: Record<'added' | 'updated' | 'removed' | 'unchanged', string> = locale === 'en'
            ? { added: 'added', updated: 'updated', removed: 'removed', unchanged: 'unchanged' }
            : { added: '新增', updated: '更新', removed: '已移除', unchanged: '不变' };
          const currentItems = Object.entries(current).map(([key, value]) => {
            const status = mappingStatus(previous, current, key);
            return { key, value, previousValue: previous?.[key], status };
          });
          const removedItems = previous
            ? Object.entries(previous).filter(([key]) => !(key in current)).map(([key, value]) => ({ key, value }))
            : [];
          const changes = currentItems.map((item) => ({ ...item, status: mappingStatus(previous, current, item.key) }));
          const lookupKey = typeof step.binding.variables.lookupChar === 'string' ? step.binding.variables.lookupChar : undefined;
          const lookupIndex = step.binding.variables.lookupIndex;
          const lookupCandidate = typeof step.binding.variables.lookupCandidate === 'string'
            ? step.binding.variables.lookupCandidate
            : step.binding.variables.lookupFound === false ? lookupKey : undefined;
          const candidateLookup = lookupCandidate !== undefined && step.binding.variables.lookupFound === false;
          const writtenKey = typeof step.binding.variables.lastSeenWrite === 'string' ? step.binding.variables.lastSeenWrite : undefined;
          const writtenFrom = step.binding.variables.lastSeenPrevious;
          const hasWrittenFrom = typeof writtenFrom === 'number';
          const status = (value: 'added' | 'updated' | 'removed' | 'unchanged') => statusLabel[value];
          return (
            <section className="mapping-watch" data-testid="last-seen-watch" aria-label={locale === 'en' ? 'Last seen indices' : '字符最近出现位置'}>
              <div className="mapping-watch-heading">
                <b>lastSeen</b>
                <span data-testid="last-seen-count">{locale === 'en' ? `${Object.keys(current).length} entries` : `${Object.keys(current).length} 项`}</span>
              </div>
              <div className="mapping-watch-legend" aria-label={locale === 'en' ? 'Change legend' : '变化标记说明'}>
                <span className="mapping-legend-added"><i aria-hidden="true" />{statusLabel.added}</span>
                <span className="mapping-legend-updated"><i aria-hidden="true" />{statusLabel.updated}</span>
                <span className="mapping-legend-removed"><i aria-hidden="true" />{statusLabel.removed}</span>
                <span className="mapping-legend-unchanged"><i aria-hidden="true" />{statusLabel.unchanged}</span>
              </div>
              {candidateLookup ? (
                <div className="var-inspection var-inspection--miss" data-testid="lookup-miss">
                  <span>{locale === 'en' ? 'Lookup' : '查找'}</span>
                  <span>{lookupCandidate}</span>
                  <b>{locale === 'en' ? 'not in lastSeen yet' : '尚未写入 lastSeen'}</b>
                </div>
              ) : null}
              {currentItems.length || removedItems.length || candidateLookup ? (
                <div className={`mapping-watch-list${candidateLookup ? ' mapping-watch-list--miss' : ''}`}>
                  {candidateLookup && !currentItems.some(({ key }) => key === lookupCandidate) ? (
                    <div className="mapping-watch-row mapping-watch-row--miss" data-change="miss" data-testid={`last-seen-entry-${encodeURIComponent(lookupCandidate!)}`}>
                      <span className="mapping-key">{lookupCandidate}?</span>
                      <span className="mapping-value">—</span>
                      <span className="mapping-change">{locale === 'en' ? 'not recorded' : '未记录'}</span>
                    </div>
                  ) : null}
                  {changes.map(({ key, value, previousValue, status: change }) => {
                    const isLookup = key === lookupKey && step.binding.variables.lookupFound === true && current[key] === lookupIndex;
                    const isWrite = key === writtenKey;
                    const displayChange = isWrite && hasWrittenFrom
                      ? `${writtenFrom} → ${value}`
                      : change === 'updated' ? `${previousValue} → ${value}` : String(value);
                    return (
                      <div
                        className={`mapping-watch-row mapping-watch-row--${change}${isLookup ? ' is-lookup' : ''}${isWrite ? ' is-write' : ''}`}
                        data-change={isWrite ? (hasWrittenFrom ? 'updated' : 'added') : change}
                        data-lookup={isLookup ? 'true' : undefined}
                        data-lookup-miss={key === lookupKey && step.binding.variables.lookupFound === false ? 'true' : undefined}
                        data-write={isWrite ? 'true' : undefined}
                        data-testid={`last-seen-entry-${encodeURIComponent(key)}`}
                        key={key}
                      >
                        <span className="mapping-key">{key}{key === lookupKey && step.binding.variables.lookupFound === false ? '?' : ''}</span>
                        <span className="mapping-value">{displayChange}</span>
                        <span className="mapping-change">{isLookup ? (locale === 'en' ? 'lookup hit' : '命中') : key === lookupKey && step.binding.variables.lookupFound === false ? (locale === 'en' ? 'not recorded' : '未记录') : isWrite ? (locale === 'en' ? 'write' : '写入') : status(change)}</span>
                      </div>
                    );
                  })}
                  {removedItems.map(({ key, value }) => (
                    <div className="mapping-watch-row mapping-watch-row--removed" data-change="removed" data-testid={`last-seen-entry-${encodeURIComponent(key)}`} key={key}>
                      <span className="mapping-key">{key}</span>
                      <span className="mapping-value">{value}</span>
                      <span className="mapping-change">{locale === 'en' ? 'removed' : '已移除'}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="mapping-watch-empty">{locale === 'en' ? 'No characters recorded yet' : '尚未记录字符'}</div>}
            </section>
          );
        })() : null}
      </div>
    </div>
  );
}
