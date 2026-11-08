import { useEffect, useMemo, useState } from 'react';
import {
  clearRetryAfter,
  getCached,
  getCachedEvenExpired,
  getRetryAfter,
  setCached,
  setRetryAfter
} from '../../services/storage/indexedDbStore';

type Props = {
  repoUrl: string;
  locale: 'en' | 'zh-CN';
};

const STAR_TTL_SECONDS = 1800;
const STAR_RETRY_COOLDOWN_MS = STAR_TTL_SECONDS * 1000;
const pendingRequests = new Map<string, Promise<number>>();

function fetchStarsOnce(key: string, url: string): Promise<number> {
  const pending = pendingRequests.get(key);
  if (pending) return pending;

  const request = fetch(url).then(async (response) => {
    if (!response.ok) throw new Error('GitHub API request failed');
    const payload = (await response.json()) as { stargazers_count?: number };
    const count = payload.stargazers_count;
    if (typeof count !== 'number' || !Number.isFinite(count) || count < 0) {
      throw new Error('GitHub API returned an invalid star count');
    }
    return count;
  });
  pendingRequests.set(key, request);
  void request.finally(() => pendingRequests.delete(key)).catch(() => undefined);
  return request;
}

function parseRepo(repoUrl: string): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/?#]+?)(?:\.git)?\/?$/i);
  if (!match) {
    return null;
  }
  return { owner: match[1], repo: match[2] };
}

export function GitHubBadge({ repoUrl, locale }: Props) {
  const [stars, setStars] = useState<number>(0);
  const repo = useMemo(() => parseRepo(repoUrl), [repoUrl]);

  useEffect(() => {
    if (!repo) {
      setStars(0);
      return;
    }

    const key = `github-stars:${repo.owner}/${repo.repo}`;

    let cancelled = false;
    void (async () => {
      const fresh = await getCached<number>(key);
      if (typeof fresh === 'number' && Number.isFinite(fresh) && fresh >= 0) {
        setStars(fresh);
        return;
      }

      const fallback = await getCachedEvenExpired<number>(key);
      const stale = typeof fallback === 'number' && Number.isFinite(fallback) && fallback >= 0
        ? fallback
        : 0;
      const retryAfter = await getRetryAfter(`${key}:retry`);
      if (retryAfter && retryAfter > Date.now()) {
        setStars(stale);
        return;
      }

      try {
        const next = await fetchStarsOnce(
          key,
          `https://api.github.com/repos/${repo.owner}/${repo.repo}`
        );
        await setCached<number>(key, next, STAR_TTL_SECONDS);
        await clearRetryAfter(`${key}:retry`);
        if (!cancelled) setStars(next);
      } catch {
        await setRetryAfter(`${key}:retry`, STAR_RETRY_COOLDOWN_MS);
        if (!cancelled) setStars(stale);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [repo]);

  return (
    <a
      className="github-badge"
      data-testid="github-badge"
      href={repoUrl}
      target="_blank"
      rel="noreferrer"
      title={locale === 'en' ? 'Star this repository on GitHub' : '去 GitHub 仓库 Star 支持一下'}
    >
      <span aria-hidden>GitHub</span>
      <span className="github-stars" data-testid="github-stars">⭐ {stars}</span>
    </a>
  );
}
