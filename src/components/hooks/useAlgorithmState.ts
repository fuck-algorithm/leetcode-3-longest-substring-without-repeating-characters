import { useState, useCallback } from 'react';
import { AlgorithmState } from '../algorithm/types';
import { useAlgorithmHistory } from './useAlgorithmHistory';

/**
 * 算法状态管理钩子
 * 处理算法可视化的状态管理和历史记录
 */
export function useAlgorithmState() {
  // 获取历史记录生成函数
  const { generateStateHistory } = useAlgorithmHistory();
  
  // 状态
  const [inputString, setInputString] = useState<string>('abcabcbb');
  const [stateHistory, setStateHistory] = useState<AlgorithmState[]>([]);
  const [currentStateIndex, setCurrentStateIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // 获取当前状态
  const currentState = stateHistory[currentStateIndex] || {
    inputString: '',
    leftPointer: 0,
    rightPointer: 0,
    currentWindow: '',
    charSet: new Set<string>(),
    maxLength: 0,
    maxSubstring: '',
    step: 0,
    duplicateFound: false
  };

  // 启动算法
  const startAlgorithm = useCallback(() => {
    // 生成状态历史
    const history = generateStateHistory(inputString);
    setStateHistory(history);
    setCurrentStateIndex(0);
    setIsRunning(true);
  }, [inputString, generateStateHistory]);

  // 重置算法
  const resetAlgorithm = useCallback(() => {
    setCurrentStateIndex(-1);
    setIsPlaying(false);
    setIsRunning(false);
  }, []);

  // 前进一步
  const stepForward = useCallback(() => {
    if (currentStateIndex < stateHistory.length - 1) {
      setCurrentStateIndex(prevIndex => prevIndex + 1);
      return true;
    } else {
      return false;
    }
  }, [currentStateIndex, stateHistory.length]);

  // 后退一步
  const stepBackward = useCallback(() => {
    if (currentStateIndex > 0) {
      setCurrentStateIndex(prevIndex => prevIndex - 1);
      return true;
    } else {
      return false;
    }
  }, [currentStateIndex]);

  // 播放算法
  const playAlgorithm = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // 暂停算法
  const pauseAlgorithm = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // 切换播放/暂停状态
  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // 处理输入变化
  const handleInputChange = useCallback((input: string) => {
    setInputString(input);
    resetAlgorithm();
  }, [resetAlgorithm]);

  // 处理播放速度变化
  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);

  return {
    inputString,
    currentState,
    stateHistory,
    currentStateIndex,
    isPlaying,
    playbackSpeed,
    isRunning,
    canGoBack: currentStateIndex > 0,
    canGoForward: currentStateIndex < stateHistory.length - 1,
    isAtEnd: currentStateIndex === stateHistory.length - 1,
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
  };
} 