import { useEffect, useMemo, useState } from 'react';
import { ProblemHeader } from './components/header/ProblemHeader';
import { AlgorithmThoughtModal } from './components/overlay/AlgorithmThoughtModal';
import { DataInputBar } from './components/input/DataInputBar';
import { VisualizationCanvas } from './components/canvas/VisualizationCanvas';
import { CodePanel } from './components/code/CodePanel';
import { PlaybackControls } from './components/controls/PlaybackControls';
import { CommunityFloat } from './components/overlay/CommunityFloat';
import { LanguageToggle } from './components/header/LanguageToggle';
import { usePlayback } from './features/playback/usePlayback';
import { createSolutionRegistry } from './features/solutions/solutionRegistry';
import type { Language, ProblemConfig, ProblemData, SolutionDefinition } from './types';

/**
 * 注意:
 * 1) App 仅做页面编排，不做重逻辑
 * 2) 具体算法动画、代码映射、输入校验都应在 feature/component 层实现
 * 3) 题目有多种解法时，每种解法必须有独立 SolutionDefinition（独立步骤与画布渲染）
 */
const PROBLEM_CONFIG: ProblemConfig = {
  number: Number('3'),
  title: '无重复字符的最长子串',
  titleEn: 'Longest Substring Without Repeating Characters',
  slug: 'longest-substring-without-repeating-characters',
  leetcodeUrl: 'https://leetcode.cn/problems/longest-substring-without-repeating-characters/',
  hot100Url: 'https://fuck-algorithm.github.io/leetcode-hot-100/',
  githubRepoUrl: 'https://github.com/fuck-algorithm/leetcode-3-longest-substring-without-repeating-characters'
};

const DEFAULT_LANGUAGE: Language = 'java';

function App() {
  const [locale, setLocale] = useState<'en' | 'zh-CN'>(() => {
    try {
      const saved = window.localStorage.getItem('ui-locale');
      return saved === 'zh-CN' ? 'zh-CN' : 'en';
    } catch {
      return 'en';
    }
  });
  const [inputData, setInputData] = useState<ProblemData | null>(null);
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isThoughtOpen, setThoughtOpen] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
    try {
      window.localStorage.setItem('ui-locale', locale);
    } catch {
      // Storage may be disabled; the current page still follows the selected locale.
    }
  }, [locale]);

  const t = (english: string, chinese: string) => locale === 'en' ? english : chinese;

  const stepsInput = typeof inputData?.parsed === 'string' ? inputData.parsed : 'abcabcbb';
  const solutions = useMemo(() => createSolutionRegistry(stepsInput), [stepsInput]);
  const [activeSolutionId, setActiveSolutionId] = useState<string>(solutions[0]?.id ?? '');

  const activeSolution: SolutionDefinition | undefined = useMemo(
    () => solutions.find((s) => s.id === activeSolutionId),
    [activeSolutionId, solutions]
  );

  const playback = usePlayback({
    totalSteps: activeSolution?.steps.length ?? 0,
    initialSpeed: 1
  });

  if (!activeSolution) {
    return <div className="app-empty">未找到可用解法配置</div>;
  }

  return (
    <div className="app-root" data-testid="app-root" lang={locale}>
      <ProblemHeader config={PROBLEM_CONFIG} locale={locale} />

      <div className="top-actions" data-testid="top-actions">
        <LanguageToggle locale={locale} onChange={setLocale} />
        <button
          className="thought-btn"
          data-testid="thought-btn"
          type="button"
          onClick={() => setThoughtOpen(true)}
        >
          {t('Algorithm', '算法思路')}
        </button>
      </div>

      <AlgorithmThoughtModal
        open={isThoughtOpen}
        title={locale === 'en' ? activeSolution.nameEn ?? activeSolution.name : activeSolution.name}
        content={locale === 'en' ? activeSolution.thoughtEn ?? activeSolution.thought : activeSolution.thought}
        locale={locale}
        onClose={() => setThoughtOpen(false)}
      />

      <DataInputBar
        locale={locale}
        samples={activeSolution.samples}
        validator={activeSolution.validateInput}
        randomGenerator={activeSolution.generateRandom}
        onChange={(data) => {
          setInputData(data);
          playback.reset();
        }}
      />

      <div className="solution-tabs" data-testid="solution-tabs">
        {solutions.map((solution) => (
          <button
            lang={locale}
            key={solution.id}
            data-testid={`solution-tab-${solution.id}`}
            className={solution.id === activeSolutionId ? 'tab-btn active' : 'tab-btn'}
            type="button"
            onClick={() => {
              setActiveSolutionId(solution.id);
              playback.reset();
            }}
          >
            {locale === 'en' ? solution.nameEn ?? solution.name : solution.name}
          </button>
        ))}
      </div>

      <main className="workspace">
        <section className="canvas-section">
          <VisualizationCanvas
            locale={locale}
            data={inputData}
            step={activeSolution.steps[playback.currentStep]}
            solution={activeSolution}
            speed={playback.speed}
          />
        </section>

        <aside className="code-section">
          <CodePanel
            locale={locale}
            language={language}
            onLanguageChange={setLanguage}
            codeArtifacts={activeSolution.codes}
            step={activeSolution.steps[playback.currentStep]}
          />
        </aside>
      </main>

      <PlaybackControls
        locale={locale}
        currentStep={playback.currentStep}
        totalSteps={activeSolution.steps.length}
        isPlaying={playback.isPlaying}
        speed={playback.speed}
        onPrev={playback.prev}
        onNext={playback.next}
        onPlayPause={playback.togglePlay}
        onReset={playback.reset}
        onSpeedChange={playback.setSpeed}
        onSeek={playback.seek}
      />

      <CommunityFloat locale={locale} />
    </div>
  );
}

export default App;
