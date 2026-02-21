import React, { useState, useCallback } from 'react';
import './CompactInputPanel.css';

interface CompactInputPanelProps {
  onInputChange: (input: string) => void;
  onStart: () => void;
  disabled: boolean;
}

// 预设示例
const examples = [
  { label: 'abcabcbb', value: 'abcabcbb' },
  { label: 'bbbbb', value: 'bbbbb' },
  { label: 'pwwkew', value: 'pwwkew' },
  { label: 'abcdef', value: 'abcdef' },
  { label: 'aab', value: 'aab' },
];

// 生成随机字符串
const generateRandomString = (minLength = 5, maxLength = 12) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    if (i > 0 && Math.random() < 0.3) {
      const randomIndex = Math.floor(Math.random() * result.length);
      result += result[randomIndex];
    } else {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
  }
  
  return result;
};

// 验证输入
const validateInput = (input: string): { valid: boolean; error?: string } => {
  if (!input || input.trim() === '') {
    return { valid: false, error: '请输入字符串' };
  }
  
  if (input.length > 100) {
    return { valid: false, error: '字符串长度不能超过100' };
  }
  
  // 只允许小写字母（符合LeetCode题目要求）
  const validPattern = /^[a-z]*$/;
  if (!validPattern.test(input)) {
    return { valid: false, error: '只能包含小写字母 a-z' };
  }
  
  return { valid: true };
};

const CompactInputPanel: React.FC<CompactInputPanelProps> = ({
  onInputChange,
  onStart,
  disabled
}) => {
  const [input, setInput] = useState<string>('abcabcbb');
  const [error, setError] = useState<string>('');

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setError('');
  }, []);

  const handleExampleSelect = useCallback((value: string) => {
    setInput(value);
    setError('');
    onInputChange(value);
  }, [onInputChange]);

  const handleRandomGenerate = useCallback(() => {
    const randomString = generateRandomString();
    setInput(randomString);
    setError('');
    onInputChange(randomString);
  }, [onInputChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateInput(input);
    if (!validation.valid) {
      setError(validation.error || '输入无效');
      return;
    }
    
    setError('');
    onInputChange(input);
    onStart();
  }, [input, onInputChange, onStart]);

  return (
    <div className="compact-input-panel">
      <form onSubmit={handleSubmit} className="input-row">
        {/* 输入框 */}
        <div className="input-group">
          <label htmlFor="string-input">输入:</label>
          <input
            id="string-input"
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="输入小写字母字符串"
            disabled={disabled}
            className={error ? 'error' : ''}
          />
          {error && <span className="error-tooltip">{error}</span>}
        </div>

        {/* 随机生成按钮 */}
        <button
          type="button"
          className="icon-button random-button"
          onClick={handleRandomGenerate}
          disabled={disabled}
          title="随机生成"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
          </svg>
          <span>随机</span>
        </button>

        {/* 开始按钮 */}
        <button
          type="submit"
          className="icon-button start-button"
          disabled={disabled || !input.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span>开始</span>
        </button>
      </form>

      {/* 示例选择 - 单行平铺 */}
      <div className="examples-row">
        <span className="examples-label">示例:</span>
        <div className="example-chips">
          {examples.map((example, index) => (
            <button
              key={index}
              className={`example-chip ${input === example.value ? 'active' : ''}`}
              onClick={() => handleExampleSelect(example.value)}
              disabled={disabled}
              type="button"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompactInputPanel;
