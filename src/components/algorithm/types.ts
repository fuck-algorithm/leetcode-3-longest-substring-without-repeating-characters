// 算法步骤类型
export enum AlgorithmStep {
  INITIALIZE,
  MOVE_RIGHT_POINTER,
  DETECT_DUPLICATE,
  MOVE_LEFT_POINTER,
  UPDATE_RESULT
}

// 算法状态接口
export interface AlgorithmState {
  inputString: string;
  leftPointer: number;
  rightPointer: number;
  currentWindow: string;
  charSet: Set<string>;
  maxLength: number;
  maxSubstring: string;
  step: AlgorithmStep;
  duplicateFound: boolean;
  duplicateChar?: string;
}

// 算法步骤描述映射
export const stepDescriptions = {
  [AlgorithmStep.INITIALIZE]: '初始化窗口',
  [AlgorithmStep.MOVE_RIGHT_POINTER]: '右指针向右移动',
  [AlgorithmStep.DETECT_DUPLICATE]: '检测到重复字符',
  [AlgorithmStep.MOVE_LEFT_POINTER]: '左指针向右移动',
  [AlgorithmStep.UPDATE_RESULT]: '更新最长子串'
};

// 算法步骤详细解释
export const stepExplanations = {
  [AlgorithmStep.INITIALIZE]: '初始化窗口，设置左右指针指向字符串起始位置。窗口初始只包含第一个字符。',
  [AlgorithmStep.MOVE_RIGHT_POINTER]: '右指针向右移动一位，扩展当前窗口，并检查是否引入重复字符。',
  [AlgorithmStep.DETECT_DUPLICATE]: '检测到重复字符！窗口中已存在该字符，需要移动左指针调整窗口。',
  [AlgorithmStep.MOVE_LEFT_POINTER]: '左指针向右移动至重复字符后一位，保持窗口内无重复字符。',
  [AlgorithmStep.UPDATE_RESULT]: '当前窗口长度超过先前记录的最大长度，更新最长无重复子串记录。'
}; 