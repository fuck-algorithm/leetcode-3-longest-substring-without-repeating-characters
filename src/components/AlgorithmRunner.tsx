import React, { useState } from 'react';
import AlgorithmVisualization from './algorithm/AlgorithmVisualization';
import Controls from './controls/Controls';
import DraggableProgressBar from './controls/DraggableProgressBar';
import Header from './Header';
import AlgorithmIdeaModal from './AlgorithmIdeaModal';
import CompactInputPanel from './CompactInputPanel';
import CodeDisplay from './code/CodeDisplay';
import WeChatFloatButton from './WeChatFloatButton';
import { useAlgorithmState } from './hooks/useAlgorithmState';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { usePlaybackControls } from './hooks/usePlaybackControls';
import './AlgorithmRunner.css';

interface AlgorithmRunnerProps {
  width?: number;
}

/**
 * 算法运行器主组件 - 单屏幕固定布局
 * 所有区域默认展示，isRunning只控制内容填充
 */
const AlgorithmRunner: React.FC<AlgorithmRunnerProps> = ({
  width = 800
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    inputString,
    currentState,
    stateHistory,
    currentStateIndex,
    isPlaying,
    playbackSpeed,
    isRunning,
    canGoBack,
    canGoForward,
    isAtEnd,
    startAlgorithm,
    resetAlgorithm,
    resetToFirstStep,
    stepForward,
    stepBackward,
    playAlgorithm,
    pauseAlgorithm,
    togglePlayPause,
    handleInputChange,
    handleSpeedChange,
    setIsPlaying,
    goToStep
  } = useAlgorithmState();

  // 使用播放控制钩子
  usePlaybackControls({
    isPlaying,
    playbackSpeed,
    onStepForward: stepForward,
    isAtEnd,
    onPlaybackEnd: () => setIsPlaying(false)
  });

  // 使用键盘控制钩子
  useKeyboardControls({
    isRunning,
    canGoBack,
    canGoForward,
    isPlaying,
    onStepBack: stepBackward,
    onStepForward: stepForward,
    onPlayPause: togglePlayPause,
    onReset: resetToFirstStep
  });

  // 构建变量值映射用于代码显示
  const variableValues: { [key: string]: string } = currentState ? {
    's': inputString,
    'left': String(currentState.leftPointer ?? 0),
    'right': String(currentState.rightPointer ?? 0),
    'maxLength': String(currentState.maxLength ?? 0),
    'maxStart': String((currentState as { maxStart?: number }).maxStart ?? 0),
    'currentChar': (currentState as { currentChar?: string }).currentChar || '',
  } : {};

  return (
    <div className="algorithm-runner">
      {/* 头部导航 - 固定高度 */}
      <Header onShowAlgorithmIdea={() => setIsModalOpen(true)} />

      {/* 算法思路弹窗 */}
      <AlgorithmIdeaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* 输入面板 - 固定高度 */}
      <div className="input-section">
        <CompactInputPanel
          onInputChange={handleInputChange}
          onStart={() => {
            resetAlgorithm();
            setTimeout(() => {
              startAlgorithm();
            }, 100);
          }}
          disabled={isPlaying}
        />
      </div>

      {/* 主内容区：画布 + 代码 - 固定高度填充剩余空间 */}
      <div className="main-content">
        {/* 左侧画布 - 始终展示 */}
        <div className="canvas-section">
          <AlgorithmVisualization
            inputString={inputString}
            currentState={currentState}
            width={width}
            height={0}
            currentStateIndex={currentStateIndex}
            totalSteps={stateHistory.length}
          />
        </div>

        {/* 右侧代码 - 始终展示 */}
        <div className="code-section">
          <CodeDisplay 
            currentStep={currentStateIndex}
            variableValues={variableValues}
          />
        </div>
      </div>

      {/* 底部控制区 - 固定高度 */}
      <div className="bottom-controls">
        {/* 可拖拽进度条 - 无数据时禁用 */}
        <DraggableProgressBar
          currentStep={currentStateIndex}
          totalSteps={stateHistory.length}
          onStepChange={goToStep}
        />

        {/* 播放控制 - 无数据时禁用 */}
        <Controls
          onPrev={stepBackward}
          onNext={stepForward}
          onPlay={playAlgorithm}
          onPause={pauseAlgorithm}
          onReset={resetToFirstStep}
          isPlaying={isPlaying}
          canGoBack={canGoBack && isRunning}
          canGoForward={canGoForward && isRunning}
          playbackSpeed={playbackSpeed}
          onSpeedChange={handleSpeedChange}
          currentStep={currentStateIndex}
          totalSteps={stateHistory.length}
        />
      </div>

      {/* 微信悬浮球 */}
      <WeChatFloatButton />
    </div>
  );
};

export default AlgorithmRunner; 