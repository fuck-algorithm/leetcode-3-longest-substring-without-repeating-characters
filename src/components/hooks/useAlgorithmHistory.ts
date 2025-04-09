import { useCallback } from 'react';
import { AlgorithmState, AlgorithmStep } from '../algorithm/types';

/**
 * 生成算法执行历史的钩子函数
 * 实现滑动窗口算法逻辑，并返回每一步的执行状态
 */
export function useAlgorithmHistory() {
  /**
   * 生成算法状态历史记录
   * @param input 输入字符串
   * @returns 算法执行的每一步状态
   */
  const generateStateHistory = useCallback((input: string) => {
    const history: AlgorithmState[] = [];
    
    // 初始状态
    history.push({
      inputString: input,
      leftPointer: 0,
      rightPointer: 0,
      currentWindow: input.charAt(0) || '',
      charSet: new Set(input.charAt(0) ? [input.charAt(0)] : []),
      maxLength: input.charAt(0) ? 1 : 0,
      maxSubstring: input.charAt(0) || '',
      step: AlgorithmStep.INITIALIZE,
      duplicateFound: false
    });

    if (!input) {
      return history;
    }

    let left = 0;
    let right = 0;
    let maxLength = input.charAt(0) ? 1 : 0;
    let maxSubstring = input.charAt(0) || '';
    const charMap = new Map<string, number>();
    
    if (input.charAt(0)) {
      charMap.set(input.charAt(0), 0);
    }

    while (right < input.length) {
      // 如果不是初始位置，则移动右指针
      if (right > 0 || left > 0) {
        right++;
        
        // 如果到达字符串末尾，则退出
        if (right >= input.length) break;

        const currentChar = input.charAt(right);
        const duplicateFound = charMap.has(currentChar) && charMap.get(currentChar)! >= left;
        
        // 添加当前状态（右指针移动）
        const currentWindow = input.substring(left, right + 1);
        const charSet = new Set<string>();
        for (let i = left; i <= right; i++) {
          charSet.add(input.charAt(i));
        }
        
        history.push({
          inputString: input,
          leftPointer: left,
          rightPointer: right,
          currentWindow,
          charSet,
          maxLength,
          maxSubstring,
          step: AlgorithmStep.MOVE_RIGHT_POINTER,
          duplicateFound: false
        });

        // 检查是否有重复字符
        if (duplicateFound) {
          // 添加当前状态（检测到重复）
          history.push({
            inputString: input,
            leftPointer: left,
            rightPointer: right,
            currentWindow,
            charSet,
            maxLength,
            maxSubstring,
            step: AlgorithmStep.DETECT_DUPLICATE,
            duplicateFound: true,
            duplicateChar: currentChar
          });

          // 调整左指针
          const prevIndex = charMap.get(currentChar)!;
          left = prevIndex + 1;
          
          // 更新哈希集合
          const newCharSet = new Set<string>();
          for (let i = left; i <= right; i++) {
            newCharSet.add(input.charAt(i));
          }
          
          // 添加当前状态（左指针移动）
          history.push({
            inputString: input,
            leftPointer: left,
            rightPointer: right,
            currentWindow: input.substring(left, right + 1),
            charSet: newCharSet,
            maxLength,
            maxSubstring,
            step: AlgorithmStep.MOVE_LEFT_POINTER,
            duplicateFound: false
          });
        }
        
        // 更新最长子串
        const currentLength = right - left + 1;
        if (currentLength > maxLength) {
          maxLength = currentLength;
          maxSubstring = input.substring(left, right + 1);
          
          // 添加当前状态（更新结果）
          const resultCharSet = new Set<string>();
          for (let i = left; i <= right; i++) {
            resultCharSet.add(input.charAt(i));
          }
          
          history.push({
            inputString: input,
            leftPointer: left,
            rightPointer: right,
            currentWindow: input.substring(left, right + 1),
            charSet: resultCharSet,
            maxLength,
            maxSubstring,
            step: AlgorithmStep.UPDATE_RESULT,
            duplicateFound: false
          });
        }
      }
      
      // 更新字符的最后位置
      charMap.set(input.charAt(right), right);
      
      // 如果没有重复字符且不是初始状态，直接继续
      if (right === 0 && left === 0) {
        right++;
      }
    }

    return history;
  }, []);

  return { generateStateHistory };
} 