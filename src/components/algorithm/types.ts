// 算法步骤类型
export enum AlgorithmStep {
  INITIALIZE = 0,      // 初始化算法
  MOVE_RIGHT_POINTER = 1, // 右指针向右移动
  DETECT_DUPLICATE = 2,   // 检测到重复字符
  MOVE_LEFT_POINTER = 3,  // 左指针向右移动
  UPDATE_RESULT = 4       // 更新最长子串结果
}

// 算法状态接口
export interface AlgorithmState {
  inputString: string;     // 输入字符串
  leftPointer: number;     // 左指针位置
  rightPointer: number;    // 右指针位置
  currentWindow: string;   // 当前窗口内容
  charSet: Set<string>;    // 当前窗口内字符集合
  maxLength: number;       // 当前找到的最长子串长度
  maxSubstring: string;    // 当前找到的最长子串
  step: AlgorithmStep;     // 当前算法步骤
  duplicateFound: boolean; // 是否发现重复字符
  duplicateChar?: string;  // 重复的字符 (可选)
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
  [AlgorithmStep.INITIALIZE]: '初始化窗口，设置左右指针指向字符串起始位置，准备开始执行算法。',
  [AlgorithmStep.MOVE_RIGHT_POINTER]: '右指针向右移动一位，扩展当前窗口，并检查是否引入重复字符。',
  [AlgorithmStep.DETECT_DUPLICATE]: '检测到重复字符！窗口中已存在该字符，需要移动左指针调整窗口。',
  [AlgorithmStep.MOVE_LEFT_POINTER]: '左指针向右移动至重复字符后一位，保持窗口内无重复字符。',
  [AlgorithmStep.UPDATE_RESULT]: '当前窗口长度超过先前记录的最大长度，更新最长无重复子串记录。'
}; 