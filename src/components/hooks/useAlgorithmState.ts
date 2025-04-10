import { useState, useCallback, useEffect } from 'react';
import { AlgorithmState, AlgorithmStep } from '../algorithm/types';
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

  // 获取当前状态 - 如果历史为空或索引无效，返回初始状态
  let currentState = stateHistory[currentStateIndex] || {
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

  // 确保当前状态的数据完整性，特别是Set和String类型
  // 添加调试代码
  useEffect(() => {
    if (currentStateIndex >= 0 && stateHistory.length > 0) {
      console.log('useAlgorithmState - 当前状态索引:', currentStateIndex);
      console.log('useAlgorithmState - 状态历史长度:', stateHistory.length);
      
      const state = stateHistory[currentStateIndex];
      if (state) {
        console.log('useAlgorithmState - 当前状态charSet类型:', state.charSet instanceof Set ? 'Set' : typeof state.charSet);
        console.log('useAlgorithmState - 当前状态charSet内容:', Array.from(state.charSet));
      }
    }
  }, [currentStateIndex, stateHistory]);

  // 启动算法 - 生成新的状态历史并设置到第一步
  const startAlgorithm = useCallback(() => {
    console.log('启动算法处理输入字符串:', inputString);
    
    // 先确保当前状态干净
    if (stateHistory.length > 0) {
      console.log('发现旧状态历史，先清空');
      setStateHistory([]);
      setCurrentStateIndex(-1);
    }
    
    // 生成状态历史 - 基于当前输入字符串动态计算
    const history = generateStateHistory(inputString);
    
    // 调试输出：检查生成的状态历史
    console.log('启动算法 - 生成历史长度:', history.length);
    if (history.length > 0) {
      console.log('启动算法 - 第一个状态:', {
        step: history[0].step,
        charSet: Array.from(history[0].charSet)
      });
      
      // 检查最后一个状态
      const lastState = history[history.length - 1];
      console.log('启动算法 - 最终结果:', {
        maxLength: lastState.maxLength,
        maxSubstring: lastState.maxSubstring
      });
    }
    
    // 确保每个状态的数据一致性
    const verifiedHistory = history.map((state, index) => {
      // 确保inputString是正确的
      if (state.inputString !== inputString) {
        console.warn(`状态${index}的inputString不匹配:`, state.inputString, '!=', inputString);
        state.inputString = inputString;
      }
      
      // 确保charSet是Set类型
      let verifiedCharSet = state.charSet;
      if (!(state.charSet instanceof Set)) {
        console.warn(`状态${index}的charSet不是Set类型:`, typeof state.charSet);
        verifiedCharSet = new Set(Array.isArray(state.charSet) ? state.charSet : []);
      }
      
      // 确保charSet内容与currentWindow一致
      if (state.currentWindow) {
        const expectedChars = new Set(state.currentWindow.split(''));
        if (state.step !== AlgorithmStep.DETECT_DUPLICATE) {
          // 只有在非重复检测步骤时，charSet才应该与currentWindow中的字符完全匹配
          verifiedCharSet = new Set(expectedChars);
        }
      }
      
      // 确保maxSubstring是字符串类型
      let verifiedMaxSubstring = '';
      if (typeof state.maxSubstring === 'string') {
        verifiedMaxSubstring = state.maxSubstring;
      } else if (state.maxSubstring) {
        try {
          verifiedMaxSubstring = String(state.maxSubstring);
        } catch {
          console.error(`状态${index}的maxSubstring无法转换为字符串:`, state.maxSubstring);
          verifiedMaxSubstring = '';
        }
      }
      
      // 检查maxLength与maxSubstring是否一致
      const expectedLength = verifiedMaxSubstring.length;
      if (state.maxLength !== expectedLength) {
        console.warn(`状态${index}的maxLength(${state.maxLength})与maxSubstring长度(${expectedLength})不一致`);
      }
      
      // 记录更详细的日志
      if (state.step === AlgorithmStep.UPDATE_RESULT) {
        console.log(`更新结果状态${index} - 最长子串:`, verifiedMaxSubstring, '长度:', state.maxLength);
      }
        
      return {
        ...state,
        inputString,
        charSet: verifiedCharSet,
        maxSubstring: verifiedMaxSubstring,
        maxLength: state.maxLength || verifiedMaxSubstring.length
      };
    });
    
    // 最后一次验证所有数据
    console.log('最终验证历史数据:', verifiedHistory.map((state, index) => ({
      index,
      step: AlgorithmStep[state.step],
      charSet: Array.from(state.charSet),
      maxSubstring: state.maxSubstring,
      maxLength: state.maxLength
    })));
    
    // 更新状态
    setStateHistory(verifiedHistory);
    setCurrentStateIndex(0); // 从第一步开始
    setIsRunning(true);
  }, [inputString, generateStateHistory]);

  // 重置算法 - 清空所有状态
  const resetAlgorithm = useCallback(() => {
    setStateHistory([]);
    setCurrentStateIndex(-1);
    setIsPlaying(false);
    setIsRunning(false);
    
    // 重置当前状态，防止旧状态残留
    currentState = {
      inputString: '',
      leftPointer: 0,
      rightPointer: 0,
      currentWindow: '',
      charSet: new Set<string>(),
      maxLength: 0,
      maxSubstring: '',
      step: AlgorithmStep.INITIALIZE,
      duplicateFound: false
    };
  }, []);

  // 重置到第一步（不清空画布）
  const resetToFirstStep = useCallback(() => {
    if (stateHistory.length > 0) {
      setCurrentStateIndex(0);
      setIsPlaying(false);
    }
  }, [stateHistory.length]);

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

  // 在返回之前确保currentState的数据完整性
  if (currentState) {
    // 确保charSet是Set类型
    if (!(currentState.charSet instanceof Set)) {
      currentState = {
        ...currentState,
        charSet: new Set(Array.isArray(currentState.charSet) ? currentState.charSet : [])
      };
    }
    
    // 确保maxSubstring是字符串
    if (typeof currentState.maxSubstring !== 'string') {
      currentState = {
        ...currentState,
        maxSubstring: String(currentState.maxSubstring || '')
      };
    }
  }

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
    resetToFirstStep,
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