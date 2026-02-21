// AC代码解决方案 - 支持Java/Python/Golang/JavaScript四种语言
// 行号绑定机制：使用StepToLinesMap，每个算法步骤对应一组代码行号

export type Language = 'java' | 'python' | 'golang' | 'javascript';

export interface CodeLine {
  lineNumber: number;
  code: string;
  // 该行对应的变量及其显示格式
  variables?: { name: string; value: string }[];
}

export interface CodeSolution {
  language: Language;
  displayName: string;
  // 完整代码文本
  fullCode: string;
  // 按行分割的代码（用于显示）
  lines: CodeLine[];
}

// 算法步骤到代码行号的映射（用于高亮当前执行行）
// 每个步骤可能对应多个语言的代码行
export interface StepToLinesMap {
  [step: number]: {
    java: number[];
    python: number[];
    golang: number[];
    javascript: number[];
  };
}

// Java 解决方案
export const javaSolution: CodeSolution = {
  language: 'java',
  displayName: 'Java',
  fullCode: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // 使用HashSet存储当前窗口内的字符
        Set<Character> charSet = new HashSet<>();
        int left = 0;                      // 左指针
        int right = 0;                     // 右指针
        int maxLength = 0;                 // 最大长度
        int maxStart = 0;                  // 最长子串起始位置
        
        // 滑动窗口遍历字符串
        while (right < s.length()) {
            char currentChar = s.charAt(right);
            
            // 如果当前字符已在窗口中，移动左指针缩小窗口
            while (charSet.contains(currentChar)) {
                charSet.remove(s.charAt(left));
                left++;
            }
            
            // 将当前字符加入窗口
            charSet.add(currentChar);
            
            // 更新最大长度和起始位置
            if (right - left + 1 > maxLength) {
                maxLength = right - left + 1;
                maxStart = left;
            }
            
            right++;  // 扩展窗口
        }
        
        return maxLength;
    }
}`,
  lines: [
    { lineNumber: 1, code: 'class Solution {' },
    { lineNumber: 2, code: '    public int lengthOfLongestSubstring(String s) {' },
    { lineNumber: 3, code: '        // 使用HashSet存储当前窗口内的字符', variables: [{ name: 's', value: '输入字符串' }] },
    { lineNumber: 4, code: '        Set<Character> charSet = new HashSet<>();', variables: [{ name: 'charSet', value: '∅' }] },
    { lineNumber: 5, code: '        int left = 0;                      // 左指针', variables: [{ name: 'left', value: '0' }] },
    { lineNumber: 6, code: '        int right = 0;                     // 右指针', variables: [{ name: 'right', value: '0' }] },
    { lineNumber: 7, code: '        int maxLength = 0;                 // 最大长度', variables: [{ name: 'maxLength', value: '0' }] },
    { lineNumber: 8, code: '        int maxStart = 0;                  // 最长子串起始位置', variables: [{ name: 'maxStart', value: '0' }] },
    { lineNumber: 9, code: '' },
    { lineNumber: 10, code: '        // 滑动窗口遍历字符串' },
    { lineNumber: 11, code: '        while (right < s.length()) {' },
    { lineNumber: 12, code: '            char currentChar = s.charAt(right);', variables: [{ name: 'currentChar', value: '' }] },
    { lineNumber: 13, code: '' },
    { lineNumber: 14, code: '            // 如果当前字符已在窗口中，移动左指针缩小窗口' },
    { lineNumber: 15, code: '            while (charSet.contains(currentChar)) {' },
    { lineNumber: 16, code: '                charSet.remove(s.charAt(left));' },
    { lineNumber: 17, code: '                left++;' },
    { lineNumber: 18, code: '            }' },
    { lineNumber: 19, code: '' },
    { lineNumber: 20, code: '            // 将当前字符加入窗口' },
    { lineNumber: 21, code: '            charSet.add(currentChar);' },
    { lineNumber: 22, code: '' },
    { lineNumber: 23, code: '            // 更新最大长度和起始位置' },
    { lineNumber: 24, code: '            if (right - left + 1 > maxLength) {' },
    { lineNumber: 25, code: '                maxLength = right - left + 1;' },
    { lineNumber: 26, code: '                maxStart = left;' },
    { lineNumber: 27, code: '            }' },
    { lineNumber: 28, code: '' },
    { lineNumber: 29, code: '            right++;  // 扩展窗口' },
    { lineNumber: 30, code: '        }' },
    { lineNumber: 31, code: '' },
    { lineNumber: 32, code: '        return maxLength;' },
    { lineNumber: 33, code: '    }' },
    { lineNumber: 34, code: '}' },
  ]
};

// Python 解决方案
export const pythonSolution: CodeSolution = {
  language: 'python',
  displayName: 'Python',
  fullCode: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # 使用set存储当前窗口内的字符
        char_set = set()
        left = 0              # 左指针
        right = 0             # 右指针
        max_length = 0        # 最大长度
        max_start = 0         # 最长子串起始位置
        
        # 滑动窗口遍历字符串
        while right < len(s):
            current_char = s[right]
            
            # 如果当前字符已在窗口中，移动左指针缩小窗口
            while current_char in char_set:
                char_set.remove(s[left])
                left += 1
            
            # 将当前字符加入窗口
            char_set.add(current_char)
            
            # 更新最大长度
            if right - left + 1 > max_length:
                max_length = right - left + 1
                max_start = left
            
            right += 1  # 扩展窗口
        
        return max_length`,
  lines: [
    { lineNumber: 1, code: 'class Solution:' },
    { lineNumber: 2, code: '    def lengthOfLongestSubstring(self, s: str) -> int:' },
    { lineNumber: 3, code: '        # 使用set存储当前窗口内的字符', variables: [{ name: 's', value: '输入字符串' }] },
    { lineNumber: 4, code: '        char_set = set()', variables: [{ name: 'char_set', value: 'set()' }] },
    { lineNumber: 5, code: '        left = 0              # 左指针', variables: [{ name: 'left', value: '0' }] },
    { lineNumber: 6, code: '        right = 0             # 右指针', variables: [{ name: 'right', value: '0' }] },
    { lineNumber: 7, code: '        max_length = 0        # 最大长度', variables: [{ name: 'max_length', value: '0' }] },
    { lineNumber: 8, code: '        max_start = 0         # 最长子串起始位置', variables: [{ name: 'max_start', value: '0' }] },
    { lineNumber: 9, code: '' },
    { lineNumber: 10, code: '        # 滑动窗口遍历字符串' },
    { lineNumber: 11, code: '        while right < len(s):' },
    { lineNumber: 12, code: '            current_char = s[right]', variables: [{ name: 'current_char', value: '' }] },
    { lineNumber: 13, code: '' },
    { lineNumber: 14, code: '            # 如果当前字符已在窗口中，移动左指针缩小窗口' },
    { lineNumber: 15, code: '            while current_char in char_set:' },
    { lineNumber: 16, code: '                char_set.remove(s[left])' },
    { lineNumber: 17, code: '                left += 1' },
    { lineNumber: 18, code: '' },
    { lineNumber: 19, code: '            # 将当前字符加入窗口' },
    { lineNumber: 20, code: '            char_set.add(current_char)' },
    { lineNumber: 21, code: '' },
    { lineNumber: 22, code: '            # 更新最大长度' },
    { lineNumber: 23, code: '            if right - left + 1 > max_length:' },
    { lineNumber: 24, code: '                max_length = right - left + 1' },
    { lineNumber: 25, code: '                max_start = left' },
    { lineNumber: 26, code: '' },
    { lineNumber: 27, code: '            right += 1  # 扩展窗口' },
    { lineNumber: 28, code: '' },
    { lineNumber: 29, code: '        return max_length' },
  ]
};

// Golang 解决方案
export const golangSolution: CodeSolution = {
  language: 'golang',
  displayName: 'Go',
  fullCode: `func lengthOfLongestSubstring(s string) int {
    // 使用map模拟HashSet
    charSet := make(map[byte]bool)
    left := 0              // 左指针
    right := 0             // 右指针
    maxLength := 0         // 最大长度
    maxStart := 0          // 最长子串起始位置
    
    // 滑动窗口遍历字符串
    for right < len(s) {
        currentChar := s[right]
        
        // 如果当前字符已在窗口中，移动左指针缩小窗口
        for charSet[currentChar] {
            delete(charSet, s[left])
            left++
        }
        
        // 将当前字符加入窗口
        charSet[currentChar] = true
        
        // 更新最大长度
        if right - left + 1 > maxLength {
            maxLength = right - left + 1
            maxStart = left
        }
        
        right++  // 扩展窗口
    }
    
    return maxLength
}`,
  lines: [
    { lineNumber: 1, code: 'func lengthOfLongestSubstring(s string) int {' },
    { lineNumber: 2, code: '    // 使用map模拟HashSet', variables: [{ name: 's', value: '输入字符串' }] },
    { lineNumber: 3, code: '    charSet := make(map[byte]bool)', variables: [{ name: 'charSet', value: 'map[]' }] },
    { lineNumber: 4, code: '    left := 0              // 左指针', variables: [{ name: 'left', value: '0' }] },
    { lineNumber: 5, code: '    right := 0             // 右指针', variables: [{ name: 'right', value: '0' }] },
    { lineNumber: 6, code: '    maxLength := 0         // 最大长度', variables: [{ name: 'maxLength', value: '0' }] },
    { lineNumber: 7, code: '    maxStart := 0          // 最长子串起始位置', variables: [{ name: 'maxStart', value: '0' }] },
    { lineNumber: 8, code: '' },
    { lineNumber: 9, code: '    // 滑动窗口遍历字符串' },
    { lineNumber: 10, code: '    for right < len(s) {' },
    { lineNumber: 11, code: '        currentChar := s[right]', variables: [{ name: 'currentChar', value: '' }] },
    { lineNumber: 12, code: '' },
    { lineNumber: 13, code: '        // 如果当前字符已在窗口中，移动左指针缩小窗口' },
    { lineNumber: 14, code: '        for charSet[currentChar] {' },
    { lineNumber: 15, code: '            delete(charSet, s[left])' },
    { lineNumber: 16, code: '            left++' },
    { lineNumber: 17, code: '        }' },
    { lineNumber: 18, code: '' },
    { lineNumber: 19, code: '        // 将当前字符加入窗口' },
    { lineNumber: 20, code: '        charSet[currentChar] = true' },
    { lineNumber: 21, code: '' },
    { lineNumber: 22, code: '        // 更新最大长度' },
    { lineNumber: 23, code: '        if right - left + 1 > maxLength {' },
    { lineNumber: 24, code: '            maxLength = right - left + 1' },
    { lineNumber: 25, code: '            maxStart = left' },
    { lineNumber: 26, code: '        }' },
    { lineNumber: 27, code: '' },
    { lineNumber: 28, code: '        right++  // 扩展窗口' },
    { lineNumber: 29, code: '    }' },
    { lineNumber: 30, code: '' },
    { lineNumber: 31, code: '    return maxLength' },
    { lineNumber: 32, code: '}' },
  ]
};

// JavaScript 解决方案
export const javascriptSolution: CodeSolution = {
  language: 'javascript',
  displayName: 'JavaScript',
  fullCode: `/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    // 使用Set存储当前窗口内的字符
    const charSet = new Set();
    let left = 0;              // 左指针
    let right = 0;             // 右指针
    let maxLength = 0;         // 最大长度
    let maxStart = 0;          // 最长子串起始位置
    
    // 滑动窗口遍历字符串
    while (right < s.length) {
        const currentChar = s[right];
        
        // 如果当前字符已在窗口中，移动左指针缩小窗口
        while (charSet.has(currentChar)) {
            charSet.delete(s[left]);
            left++;
        }
        
        // 将当前字符加入窗口
        charSet.add(currentChar);
        
        // 更新最大长度
        if (right - left + 1 > maxLength) {
            maxLength = right - left + 1;
            maxStart = left;
        }
        
        right++;  // 扩展窗口
    }
    
    return maxLength;
};`,
  lines: [
    { lineNumber: 1, code: '/**' },
    { lineNumber: 2, code: ' * @param {string} s' },
    { lineNumber: 3, code: ' * @return {number}' },
    { lineNumber: 4, code: ' */' },
    { lineNumber: 5, code: 'var lengthOfLongestSubstring = function(s) {', variables: [{ name: 's', value: '输入字符串' }] },
    { lineNumber: 6, code: '    // 使用Set存储当前窗口内的字符' },
    { lineNumber: 7, code: '    const charSet = new Set();', variables: [{ name: 'charSet', value: 'Set(0)' }] },
    { lineNumber: 8, code: '    let left = 0;              // 左指针', variables: [{ name: 'left', value: '0' }] },
    { lineNumber: 9, code: '    let right = 0;             // 右指针', variables: [{ name: 'right', value: '0' }] },
    { lineNumber: 10, code: '    let maxLength = 0;         // 最大长度', variables: [{ name: 'maxLength', value: '0' }] },
    { lineNumber: 11, code: '    let maxStart = 0;          // 最长子串起始位置', variables: [{ name: 'maxStart', value: '0' }] },
    { lineNumber: 12, code: '' },
    { lineNumber: 13, code: '    // 滑动窗口遍历字符串' },
    { lineNumber: 14, code: '    while (right < s.length) {' },
    { lineNumber: 15, code: '        const currentChar = s[right];', variables: [{ name: 'currentChar', value: '' }] },
    { lineNumber: 16, code: '' },
    { lineNumber: 17, code: '        // 如果当前字符已在窗口中，移动左指针缩小窗口' },
    { lineNumber: 18, code: '        while (charSet.has(currentChar)) {' },
    { lineNumber: 19, code: '            charSet.delete(s[left]);' },
    { lineNumber: 20, code: '            left++;' },
    { lineNumber: 21, code: '        }' },
    { lineNumber: 22, code: '' },
    { lineNumber: 23, code: '        // 将当前字符加入窗口' },
    { lineNumber: 24, code: '        charSet.add(currentChar);' },
    { lineNumber: 25, code: '' },
    { lineNumber: 26, code: '        // 更新最大长度' },
    { lineNumber: 27, code: '        if (right - left + 1 > maxLength) {' },
    { lineNumber: 28, code: '            maxLength = right - left + 1;' },
    { lineNumber: 29, code: '            maxStart = left;' },
    { lineNumber: 30, code: '        }' },
    { lineNumber: 31, code: '' },
    { lineNumber: 32, code: '        right++;  // 扩展窗口' },
    { lineNumber: 33, code: '    }' },
    { lineNumber: 34, code: '' },
    { lineNumber: 35, code: '    return maxLength;' },
    { lineNumber: 36, code: '};' },
  ]
};

// 所有解决方案
export const allSolutions: CodeSolution[] = [
  javaSolution,
  pythonSolution,
  golangSolution,
  javascriptSolution,
];

// 算法步骤到代码行号的映射
// 这个映射定义了每个算法步骤对应哪些代码行需要高亮
export const stepToLinesMap: StepToLinesMap = {
  // 0: 初始化
  0: {
    java: [1, 2, 3, 4, 5, 6, 7, 8],
    python: [1, 2, 3, 4, 5, 6, 7, 8],
    golang: [1, 2, 3, 4, 5, 6, 7],
    javascript: [5, 6, 7, 8, 9, 10, 11],
  },
  // 1: 检查右指针条件
  1: {
    java: [10, 11],
    python: [10, 11],
    golang: [9, 10],
    javascript: [13, 14],
  },
  // 2: 获取当前字符
  2: {
    java: [12],
    python: [12],
    golang: [11],
    javascript: [15],
  },
  // 3: 检查重复（进入while循环）
  3: {
    java: [14, 15],
    python: [14, 15],
    golang: [13, 14],
    javascript: [17, 18],
  },
  // 4: 移除字符，移动左指针
  4: {
    java: [16, 17],
    python: [16, 17],
    golang: [15, 16],
    javascript: [19, 20],
  },
  // 5: 添加当前字符到窗口
  5: {
    java: [20, 21],
    python: [19, 20],
    golang: [19, 20],
    javascript: [23, 24],
  },
  // 6: 更新最大长度
  6: {
    java: [23, 24, 25, 26],
    python: [22, 23, 24, 25],
    golang: [22, 23, 24, 25],
    javascript: [27, 28, 29, 30],
  },
  // 7: 移动右指针
  7: {
    java: [29],
    python: [27],
    golang: [28],
    javascript: [32],
  },
  // 8: 返回结果
  8: {
    java: [32],
    python: [29],
    golang: [31],
    javascript: [35],
  },
};

// 获取语言显示名称
export const getLanguageDisplayName = (lang: Language): string => {
  const solution = allSolutions.find(s => s.language === lang);
  return solution?.displayName || lang;
};

// 获取解决方案
export const getSolution = (lang: Language): CodeSolution => {
  return allSolutions.find(s => s.language === lang) || javaSolution;
};
