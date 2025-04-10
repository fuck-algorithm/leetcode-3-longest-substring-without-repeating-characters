import { useCallback } from 'react';
import { AlgorithmState, AlgorithmStep } from '../algorithm/types';

/**
 * 生成算法执行历史的钩子函数
 * 纯粹实现滑动窗口算法逻辑，并返回每一步的执行状态
 */
export function useAlgorithmHistory() {
  /**
   * 生成算法状态历史记录
   * @param input 输入字符串
   * @returns 算法执行的每一步状态
   */
  const generateStateHistory = useCallback((input: string) => {
    // 确保输入是一个字符串
    if (typeof input !== 'string') {
      input = String(input || '');
    }
    
    console.log('算法开始处理输入:', input);
    
    const history: AlgorithmState[] = [];
    
    // 处理边界情况：空字符串
    if (!input || input.length === 0) {
      history.push({
        inputString: input,
        leftPointer: 0,
        rightPointer: 0,
        currentWindow: '',
        charSet: new Set<string>(),
        maxLength: 0,
        maxSubstring: '',
        step: AlgorithmStep.INITIALIZE,
        duplicateFound: false
      });
      return history;
    }

    // 初始化状态（步骤0）- 此时窗口尚未包含任何字符
    history.push({
      inputString: input,
      leftPointer: 0,
      rightPointer: 0,
      currentWindow: '',
      charSet: new Set<string>(),
      maxLength: 0,
      maxSubstring: '',
      step: AlgorithmStep.INITIALIZE,
      duplicateFound: false
    });

    // 初始化变量
    let left = 0;                           // 左指针初始位置
    let right = -1;                         // 右指针初始位置（从-1开始，这样第一次移动后是0）
    let maxLength = 0;                      // 最长子串长度
    let maxSubstring = '';                  // 最长子串
    const charMap = new Map<string, number>(); // 记录每个字符最后出现的位置
    
    // 主循环：直到右指针到达字符串末尾
    while (right < input.length - 1) {
      // 步骤：移动右指针
      right++;
      const currentChar = input.charAt(right);
      console.log(`移动右指针: ${right}, 当前字符: ${currentChar}`);
      
      // 更新当前窗口
      const currentWindow = input.substring(left, right + 1);
      
      // 检测是否已存在于当前窗口（在当前窗口范围内）
      const duplicateFound = charMap.has(currentChar) && charMap.get(currentChar)! >= left;
      
      // 构建当前窗口的字符集
      const currentCharSet = new Set<string>();
      for (let i = left; i <= right; i++) {
        currentCharSet.add(input.charAt(i));
      }
      
      if (!duplicateFound) {
        // 添加当前状态（右指针移动）
        history.push({
          inputString: input,
          leftPointer: left,
          rightPointer: right,
          currentWindow,
          charSet: new Set<string>(currentCharSet),
          maxLength,
          maxSubstring,
          step: AlgorithmStep.MOVE_RIGHT_POINTER,
          duplicateFound: false
        });
        
        // 更新最长子串（如果当前窗口更长）
        const currentLength = right - left + 1;
        if (currentLength > maxLength) {
          maxLength = currentLength;
          maxSubstring = input.substring(left, right + 1);
          console.log(`更新最长子串: "${maxSubstring}", 长度: ${maxLength}`);
          
          // 添加当前状态（更新结果）
          history.push({
            inputString: input,
            leftPointer: left,
            rightPointer: right,
            currentWindow,
            charSet: new Set<string>(currentCharSet),
            maxLength,
            maxSubstring,
            step: AlgorithmStep.UPDATE_RESULT,
            duplicateFound: false
          });
        }
      } else {
        // 添加当前状态（检测到重复）
        history.push({
          inputString: input,
          leftPointer: left,
          rightPointer: right,
          currentWindow,
          charSet: new Set<string>(currentCharSet),
          maxLength,
          maxSubstring,
          step: AlgorithmStep.DETECT_DUPLICATE,
          duplicateFound: true,
          duplicateChar: currentChar
        });
        
        // 移动左指针至重复字符后一位
        const prevIndex = charMap.get(currentChar)!;
        left = prevIndex + 1;
        console.log(`检测到重复字符: ${currentChar}, 移动左指针到: ${left}`);
        
        // 更新当前窗口
        const newWindow = input.substring(left, right + 1);
        
        // 重新构建新窗口的字符集
        const newCharSet = new Set<string>();
        for (let i = left; i <= right; i++) {
          newCharSet.add(input.charAt(i));
        }
        
        // 添加当前状态（左指针移动）
        history.push({
          inputString: input,
          leftPointer: left,
          rightPointer: right,
          currentWindow: newWindow,
          charSet: new Set<string>(newCharSet),
          maxLength,
          maxSubstring,
          step: AlgorithmStep.MOVE_LEFT_POINTER,
          duplicateFound: false
        });
      }
      
      // 更新字符的最后位置
      charMap.set(currentChar, right);
    }
    
    // 如果历史为空（可能的边界情况），添加一个初始状态
    if (history.length === 0) {
      history.push({
        inputString: input,
        leftPointer: 0,
        rightPointer: 0,
        currentWindow: input.charAt(0) || '',
        charSet: new Set<string>([input.charAt(0) || '']),
        maxLength: 1,
        maxSubstring: input.charAt(0) || '',
        step: AlgorithmStep.UPDATE_RESULT,
        duplicateFound: false
      });
    }
    
    // 如果没有找到任何最长子串（可能是重复字符的情况）
    if (maxLength === 0 && input.length > 0) {
      maxLength = 1;
      maxSubstring = input.charAt(0);
      
      // 添加一个额外的状态来显示结果
      const lastState = history[history.length - 1];
      history.push({
        ...lastState,
        maxLength,
        maxSubstring,
        step: AlgorithmStep.UPDATE_RESULT,
        duplicateFound: false
      });
    }

    // 调试输出：检查生成的状态历史
    console.log('输入:', input);
    console.log('生成状态历史:', history.map((state, index) => ({
      step: index,
      stepType: AlgorithmStep[state.step],
      leftPointer: state.leftPointer,
      rightPointer: state.rightPointer,
      currentWindow: state.currentWindow,
      charSet: Array.from(state.charSet),
      maxLength: state.maxLength,
      maxSubstring: state.maxSubstring,
      duplicateFound: state.duplicateFound,
      duplicateChar: state.duplicateChar
    })));

    return history;
  }, []);

  return { generateStateHistory };
} 