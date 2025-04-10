import React, { useEffect, useRef, useState } from 'react';
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
  height = 600
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visualizationHeight, setVisualizationHeight] = useState(500);

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
    resetToFirstStep,
    stepForward,
    stepBackward,
    playAlgorithm,
    pauseAlgorithm,
    togglePlayPause,
    handleInputChange,
    handleSpeedChange,
    setIsPlaying
  } = useAlgorithmState();

  // 动态计算可视化区域的高度
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        // 获取容器元素
        const container = containerRef.current;
        
        // 获取各个元素的实际高度
        const headerElement = container.querySelector('h1');
        const descriptionElement = container.querySelector('.description');
        const inputPanelElement = container.querySelector('.input-panel');
        const controlsElement = document.querySelector('.bottom-controls-container');
        
        // 计算实际的各部分高度
        const headerHeight = headerElement ? headerElement.clientHeight : 50;
        const descriptionHeight = descriptionElement ? descriptionElement.clientHeight : 50;
        const inputPanelHeight = inputPanelElement ? inputPanelElement.clientHeight : 120;
        const controlsHeight = controlsElement ? controlsElement.clientHeight : 70;
        
        // 为间距和边距预留空间
        const spacing = 40;
        
        // 计算窗口视口高度
        const windowHeight = window.innerHeight;
        
        // 计算可视化区域应有的高度
        const newHeight = windowHeight - headerHeight - descriptionHeight - inputPanelHeight - controlsHeight - spacing;
        
        // 设置最小高度
        const minHeight = 300;
        setVisualizationHeight(Math.max(newHeight, minHeight));
      }
    };
    
    // 初始计算
    updateHeight();
    
    // 设置多个时间点的更新，以确保DOM完全渲染后能够获取正确的高度
    const timers = [
      setTimeout(updateHeight, 100),
      setTimeout(updateHeight, 300),
      setTimeout(updateHeight, 500)
    ];
    
    // 创建一个监听器，监测DOM变化
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    
    // 监听容器大小变化
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // 添加窗口大小改变事件监听
    window.addEventListener('resize', updateHeight);
    
    // 清理事件监听和定时器
    return () => {
      window.removeEventListener('resize', updateHeight);
      timers.forEach(timer => clearTimeout(timer));
      resizeObserver.disconnect();
    };
  }, [isRunning]);

  // 计算进度百分比
  const progressPercentage = Math.round((currentStateIndex / (stateHistory.length - 1)) * 100) || 0;

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

  // 页面加载时不再自动开始演示，因为已在InputPanel中处理
  // useEffect(() => {
  //   // 启动算法并显示第一步，但不自动播放
  //   startAlgorithm();
  //   
  //   // 移除自动播放逻辑
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []); // 空依赖数组确保只在组件挂载时执行一次

  return (
    <div className="algorithm-runner" ref={containerRef}>
      <h1>滑动窗口算法可视化 - 无重复字符的最长子串</h1>
      <p className="description">
        LeetCode #3: 给定一个字符串，请你找出其中不含有重复字符的最长子串的长度。
      </p>

      <InputPanel
        onInputChange={handleInputChange}
        onStart={() => {
          // 首先确保算法完全重置
          resetAlgorithm();
          
          // 添加额外的日志用于调试
          console.log('准备启动算法，输入:', inputString);
          
          // 使用更长的延迟确保重置完成
          setTimeout(() => {
            console.log('正在启动算法...');
            startAlgorithm();
          }, 150);
        }}
        disabled={false}
      />

      {isRunning && (
        <>
          <div className="visualization-container">
            <AlgorithmVisualization
              inputString={inputString}
              currentState={currentState}
              width={width}
              height={visualizationHeight}
              currentStateIndex={currentStateIndex}
              totalSteps={stateHistory.length}
            />
          </div>

          {/* 底部控制容器 */}
          <div className="bottom-controls-container">
            {/* 全屏宽度进度条 */}
            <div className="fullwidth-progress-container">
              <div className="fullwidth-progress-bar">
                <div 
                  className="fullwidth-progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                  title={`${progressPercentage}%`}
                ></div>
              </div>
              <div className="fullwidth-progress-text">
                步骤 {currentStateIndex + 1}/{stateHistory.length}
              </div>
            </div>

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
              hideProgressBar={true}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AlgorithmRunner; 