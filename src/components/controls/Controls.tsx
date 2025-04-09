import React from 'react';
import ControlButton from './ControlButton';
import SpeedControl from './SpeedControl';
import KeyboardHints from './KeyboardHints';

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
  hideProgressBar?: boolean;
}

/**
 * 算法控制面板组件
 * 包含控制算法执行的所有按钮和控件
 */
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
  totalSteps = 1,
  hideProgressBar = false
}) => {
  // 计算进度百分比
  const progressPercentage = Math.round((currentStep / (totalSteps - 1)) * 100) || 0;
  
  return (
    <>
      <div className="controls">
        <div className="control-buttons">
          {/* 重置按钮 */}
          <ControlButton 
            onClick={onReset}
            title="重置"
            className="reset-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v6h6"></path>
              <path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path>
            </svg>
            <span className="button-text">重置</span>
          </ControlButton>

          {/* 上一步按钮 */}
          <ControlButton 
            onClick={onPrev} 
            disabled={!canGoBack}
            title="上一步"
            className="prev-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="19 20 9 12 19 4 19 20"></polygon>
              <line x1="5" y1="19" x2="5" y2="5"></line>
            </svg>
            <span className="button-text">上一步</span>
          </ControlButton>

          {/* 播放/暂停按钮 */}
          {isPlaying ? (
            <ControlButton 
              onClick={onPause}
              title="暂停"
              className="pause-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
              <span className="button-text">暂停</span>
            </ControlButton>
          ) : (
            <ControlButton 
              onClick={onPlay}
              disabled={!canGoForward}
              title="自动播放"
              className="play-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span className="button-text">播放</span>
            </ControlButton>
          )}

          {/* 下一步按钮 */}
          <ControlButton 
            onClick={onNext} 
            disabled={!canGoForward}
            title="下一步"
            className="next-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
            <span className="button-text">下一步</span>
          </ControlButton>
        </div>

        {/* 进度条 - 仅在不隐藏时显示 */}
        {!hideProgressBar && (
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
        )}

        {/* 速度控制 */}
        <SpeedControl 
          playbackSpeed={playbackSpeed}
          onSpeedChange={onSpeedChange}
        />
      </div>
      
      {/* 键盘快捷键提示 */}
      <KeyboardHints />
    </>
  );
};

export default Controls; 