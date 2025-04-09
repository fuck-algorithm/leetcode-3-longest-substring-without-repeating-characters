import React, { useEffect } from 'react';
import AlgorithmVisualization from './algorithm/AlgorithmVisualization';
import Controls from './controls/Controls';
import InputPanel from './input/InputPanel';
import { useAlgorithmState } from './hooks/useAlgorithmState';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { usePlaybackControls } from './hooks/usePlaybackControls';

interface AlgorithmRunnerProps {
  width?: number;
  height?: number;
}

/**
 * 算法运行器主组件
 * 协调算法的输入、执行、控制和可视化
 */
const AlgorithmRunner: React.FC<AlgorithmRunnerProps> = ({
  width = 800,
  height = 400
}) => {
  // 使用算法状态钩子
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
    stepForward,
    stepBackward,
    playAlgorithm,
    pauseAlgorithm,
    togglePlayPause,
    handleInputChange,
    handleSpeedChange,
    setIsPlaying
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
    onReset: resetAlgorithm
  });

  // 页面加载时自动开始演示
  useEffect(() => {
    // 启动算法
    startAlgorithm();
    
    // 短暂延迟后开始自动播放，确保状态已更新
    const autoPlayTimer = setTimeout(() => {
      playAlgorithm();
    }, 500);
    
    return () => {
      clearTimeout(autoPlayTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组确保只在组件挂载时执行一次

  return (
    <div className="algorithm-runner">
      <h1>滑动窗口算法可视化 - 无重复字符的最长子串</h1>
      <p className="description">
        LeetCode #3: 给定一个字符串，请你找出其中不含有重复字符的最长子串的长度。
      </p>

      <InputPanel
        onInputChange={handleInputChange}
        onStart={startAlgorithm}
        disabled={isRunning && (isPlaying || currentState.leftPointer > -1)}
      />

      {isRunning && (
        <>
          <div className="visualization-container">
            <AlgorithmVisualization
              inputString={inputString}
              currentState={currentState}
              width={width}
              height={height}
            />
          </div>

          <Controls
            onPrev={stepBackward}
            onNext={stepForward}
            onPlay={playAlgorithm}
            onPause={pauseAlgorithm}
            onReset={resetAlgorithm}
            isPlaying={isPlaying}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            playbackSpeed={playbackSpeed}
            onSpeedChange={handleSpeedChange}
            currentStep={currentStateIndex}
            totalSteps={stateHistory.length}
          />
        </>
      )}
    </div>
  );
};

export default AlgorithmRunner; 