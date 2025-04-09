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
  currentStep: number;
  totalSteps: number;
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
  onSpeedChange,
  currentStep = 0,
  totalSteps = 1
}) => {
  // 计算进度百分比
  const progressPercentage = Math.round((currentStep / (totalSteps - 1)) * 100) || 0;
  
  return (
    <>
      <div className="controls">
        <div className="control-buttons">
          <button 
            className="control-button reset-button" 
            onClick={onReset}
            title="重置"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v6h6"></path>
              <path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path>
            </svg>
          </button>

          <button 
            className="control-button prev-button" 
            onClick={onPrev} 
            disabled={!canGoBack}
            title="上一步"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="19 20 9 12 19 4 19 20"></polygon>
              <line x1="5" y1="19" x2="5" y2="5"></line>
            </svg>
          </button>

          {isPlaying ? (
            <button 
              className="control-button pause-button" 
              onClick={onPause}
              title="暂停"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            </button>
          ) : (
            <button 
              className="control-button play-button" 
              onClick={onPlay}
              disabled={!canGoForward}
              title="自动播放"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
          )}

          <button 
            className="control-button next-button" 
            onClick={onNext} 
            disabled={!canGoForward}
            title="下一步"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
          </button>
        </div>

        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
              title={`${progressPercentage}%`}
            ></div>
          </div>
          <div className="progress-text">
            步骤 {currentStep + 1}/{totalSteps}
          </div>
        </div>

        <div className="speed-control">
          <label htmlFor="speed-control">速度</label>
          <select 
            id="speed-control" 
            value={playbackSpeed} 
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            title="播放速度控制"
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1.0×</option>
            <option value={1.5}>1.5×</option>
            <option value={2}>2.0×</option>
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