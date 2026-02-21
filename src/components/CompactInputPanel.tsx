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
    <form onSubmit={handleSubmit} className="compact-input-panel">
      <span className="input-label">输入:</span>
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="输入小写字母字符串"
        disabled={disabled}
        className={`input-field ${error ? 'error' : ''}`}
      />
      {error && <span className="error-msg">{error}</span>}

      <div className="divider" />

      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleRandomGenerate}
        disabled={disabled}
        title="随机生成"
      >
        🎲
      </button>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={disabled || !input.trim()}
      >
        ▶ 开始
      </button>

      <div className="divider" />

      <span className="examples-label">示例:</span>
      <div className="example-chips">
        {examples.map((example, index) => (
          <button
            key={index}
            className={`chip ${input === example.value ? 'active' : ''}`}
            onClick={() => handleExampleSelect(example.value)}
            disabled={disabled}
            type="button"
          >
            {example.label}
          </button>
        ))}
      </div>
    </form>
  );
};

export default CompactInputPanel;
