import React from 'react';

interface ControlsProps {
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  isPlaying: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const Controls: React.FC<ControlsProps> = ({
  onPrev,
  onNext,
  onPlay,
  onPause,
  onReset,
  isPlaying,
  canGoBack,
  canGoForward,
  playbackSpeed,
  onSpeedChange
}) => {
  return (
    <>
      <div className="controls">
        <div className="control-buttons">
          <button 
            className="control-button reset-button" 
            onClick={onReset}
            title="重置"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v6h6"></path>
              <path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path>
            </svg>
            <span className="button-text">重置</span>
          </button>

          <button 
            className="control-button prev-button" 
            onClick={onPrev} 
            disabled={!canGoBack}
            title="上一步"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="19 20 9 12 19 4 19 20"></polygon>
              <line x1="5" y1="19" x2="5" y2="5"></line>
            </svg>
            <span className="button-text">上一步</span>
          </button>

          {isPlaying ? (
            <button 
              className="control-button pause-button" 
              onClick={onPause}
              title="暂停"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
              <span className="button-text">暂停</span>
            </button>
          ) : (
            <button 
              className="control-button play-button" 
              onClick={onPlay}
              disabled={!canGoForward}
              title="自动播放"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span className="button-text">播放</span>
            </button>
          )}

          <button 
            className="control-button next-button" 
            onClick={onNext} 
            disabled={!canGoForward}
            title="下一步"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
            <span className="button-text">下一步</span>
          </button>
        </div>

        <div className="speed-control">
          <label htmlFor="speed-control">速度:</label>
          <select 
            id="speed-control" 
            value={playbackSpeed} 
            onChange={(e) => onSpeedChange(Number(e.target.value))}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      </div>
      <div className="keyboard-hints">
        <p>键盘快捷键: ← 上一步 | → 下一步 | 空格 播放/暂停 | R 重置</p>
      </div>
    </>
  );
};

export default Controls; 