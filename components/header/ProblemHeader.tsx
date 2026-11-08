import type { ProblemConfig } from '../../types';
import { GitHubBadge } from './GitHubBadge';

type Props = {
  config: ProblemConfig;
  locale: 'en' | 'zh-CN';
};

export function ProblemHeader({ config, locale }: Props) {
  return (
    <header className="problem-header" data-testid="problem-header">
      <a
        className="hot100-link"
        data-testid="hot100-link"
        href={config.hot100Url}
        target="_blank"
        rel="noreferrer"
      >
        {locale === 'en' ? 'LeetCode Hot 100' : '返回 LeetCode Hot 100'}
      </a>

      <a
        className="problem-title-link"
        data-testid="problem-title-link"
        href={config.leetcodeUrl}
        target="_blank"
        rel="noreferrer"
      >
        LeetCode {config.number}. {locale === 'en' ? config.titleEn : config.title}
      </a>
      <GitHubBadge repoUrl={config.githubRepoUrl} locale={locale} />
    </header>
  );
}
