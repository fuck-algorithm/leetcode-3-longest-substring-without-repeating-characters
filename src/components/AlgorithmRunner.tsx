import React, { useEffect, useRef, useState } from 'react';
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
 * 算法运行器主组件
 * 协调算法的输入、执行、控制和可视化
 */
const AlgorithmRunner: React.FC<AlgorithmRunnerProps> = ({
  width = 800
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visualizationHeight, setVisualizationHeight] = useState(500);
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

  // 动态计算可视化区域的高度
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const windowHeight = window.innerHeight;
        const headerHeight = 80;
        const inputHeight = 100;
        const controlsHeight = 120;
        const spacing = 60;
        
        const newHeight = windowHeight - headerHeight - inputHeight - controlsHeight - spacing;
        setVisualizationHeight(Math.max(newHeight, 300));
      }
    };
    
    updateHeight();
    
    const timers = [
      setTimeout(updateHeight, 100),
      setTimeout(updateHeight, 300)
    ];
    
    window.addEventListener('resize', updateHeight);
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [isRunning]);

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
    <div className="algorithm-runner" ref={containerRef}>
      {/* 头部导航 */}
      <Header onShowAlgorithmIdea={() => setIsModalOpen(true)} />

      {/* 算法思路弹窗 */}
      <AlgorithmIdeaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* 紧凑数据输入 */}
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

      {/* 主内容区：画布 + 代码 */}
      {isRunning && (
        <div className="main-content">
          {/* 左侧画布 */}
          <div className="canvas-section">
            <AlgorithmVisualization
              inputString={inputString}
              currentState={currentState}
              width={width}
              height={visualizationHeight}
              currentStateIndex={currentStateIndex}
              totalSteps={stateHistory.length}
            />
          </div>

          {/* 右侧代码 */}
          <div className="code-section">
            <CodeDisplay 
              currentStep={currentStateIndex}
              variableValues={variableValues}
            />
          </div>
        </div>
      )}

      {/* 底部控制区 */}
      {isRunning && (
        <div className="bottom-controls">
          {/* 可拖拽进度条 */}
          <DraggableProgressBar
            currentStep={currentStateIndex}
            totalSteps={stateHistory.length}
            onStepChange={goToStep}
          />

          {/* 播放控制 */}
          <Controls
            onPrev={stepBackward}
            onNext={stepForward}
            onPlay={playAlgorithm}
            onPause={pauseAlgorithm}
            onReset={resetToFirstStep}
            isPlaying={isPlaying}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            playbackSpeed={playbackSpeed}
            onSpeedChange={handleSpeedChange}
            currentStep={currentStateIndex}
            totalSteps={stateHistory.length}
          />
        </div>
      )}

      {/* 微信悬浮球 */}
      <WeChatFloatButton />
    </div>
  );
};

export default AlgorithmRunner; 