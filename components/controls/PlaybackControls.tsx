import { useMemo, useRef } from 'react';

type Props = {
  locale: 'en' | 'zh-CN';
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onReset: () => void;
  onSpeedChange: (value: number) => void;
  onSeek: (step: number) => void;
};

const SPEED_OPTIONS = [0.5, 1, 1.5, 2, 3];

export function PlaybackControls(props: Props) {
  const {
    locale,
    currentStep,
    totalSteps,
    isPlaying,
    speed,
    onPrev,
    onNext,
    onPlayPause,
    onReset,
    onSpeedChange,
    onSeek
  } = props;

  const trackRef = useRef<HTMLDivElement | null>(null);
  const t = (english: string, chinese: string) => locale === 'en' ? english : chinese;

  const progressPercent = useMemo(() => {
    if (totalSteps <= 1) {
      return 0;
    }
    return (currentStep / (totalSteps - 1)) * 100;
  }, [currentStep, totalSteps]);

  function seekByClientX(clientX: number) {
    const track = trackRef.current;
    if (!track || totalSteps <= 1) {
      return;
    }
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const step = Math.round(ratio * (totalSteps - 1));
    onSeek(step);
  }

  return (
    <footer className="playback-footer" data-testid="playback-controls">
      <div className="playback-row">
        <button type="button" data-testid="prev-step-btn" className="playback-btn" onClick={onPrev}>
          {t('Previous [←]', '上一步 [←]')}
        </button>
        <button type="button" data-testid="play-pause-btn" className="playback-btn primary" onClick={onPlayPause}>
          {isPlaying ? t('Pause [Space]', '暂停 [Space]') : t('Play [Space]', '播放 [Space]')}
        </button>
        <button type="button" data-testid="next-step-btn" className="playback-btn" onClick={onNext}>
          {t('Next [→]', '下一步 [→]')}
        </button>
        <button type="button" data-testid="reset-playback-btn" className="playback-btn" onClick={onReset}>
          {t('Reset [R]', '重置 [R]')}
        </button>

        <div className="speed-group">
          {SPEED_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={item === speed ? 'speed-btn active' : 'speed-btn'}
              data-testid={`speed-${item}x`}
              onClick={() => onSpeedChange(item)}
            >
              {item}x
            </button>
          ))}
        </div>
      </div>

      <div
        ref={trackRef}
        data-testid="timeline-track"
        className="timeline-track"
        onMouseDown={(event) => {
          seekByClientX(event.clientX);
          const move = (moveEvent: MouseEvent) => seekByClientX(moveEvent.clientX);
          const up = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
          };
          window.addEventListener('mousemove', move);
          window.addEventListener('mouseup', up);
        }}
      >
        <div className="timeline-played" data-testid="timeline-played" style={{ width: `${progressPercent}%` }} />
        <div className="timeline-thumb" style={{ left: `${progressPercent}%` }} />
      </div>

      <div className="timeline-meta" data-testid="timeline-meta">
        {t('Step', '步骤')} {Math.min(currentStep + 1, Math.max(totalSteps, 1))} / {Math.max(totalSteps, 1)}
      </div>
    </footer>
  );
}
