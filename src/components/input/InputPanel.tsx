import React, { useState } from 'react';
import ExampleButtons from './ExampleButtons';

interface InputPanelProps {
  onInputChange: (input: string) => void;
  onStart: () => void;
  disabled: boolean;
}

/**
 * 生成随机字符串
 * @param minLength 最小长度
 * @param maxLength 最大长度
 * @returns 随机生成的字符串
 */
const generateRandomString = (minLength = 5, maxLength = 15) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    // 增加一些重复字符的概率，使得示例更有意义
    if (i > 0 && Math.random() < 0.3 && result.length > 2) {
      // 30%的概率使用已有的字符
      const randomIndex = Math.floor(Math.random() * result.length);
      result += result[randomIndex];
    } else {
      // 70%的概率使用新字符
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
  }
  
  return result;
};

/**
 * 输入面板组件
 * 处理用户输入和示例选择
 */
const InputPanel: React.FC<InputPanelProps> = ({
  onInputChange,
  onStart,
  disabled
}) => {
  const [input, setInput] = useState<string>('abcabcbb');

  // 处理示例选择
  const handleExampleSelect = (value: string) => {
    setInput(value);
    onInputChange(value);
  };

  // 处理随机字符串生成
  const handleRandomGenerate = () => {
    const randomString = generateRandomString();
    setInput(randomString);
    onInputChange(randomString);
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // 提交输入
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInputChange(input);
    onStart();
  };

  return (
    <div className="input-panel">
      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-field">
          <label htmlFor="string-input">输入字符串:</label>
          <input
            id="string-input"
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="请输入一个字符串，例如: abcabcbb"
            disabled={disabled}
          />
          <button 
            type="button" 
            className="random-button"
            onClick={handleRandomGenerate}
            disabled={disabled}
            title="生成随机字符串"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="3" ry="3"></rect>
              <circle cx="8" cy="8" r="2"></circle>
              <circle cx="16" cy="8" r="2"></circle>
              <circle cx="8" cy="16" r="2"></circle>
              <circle cx="16" cy="16" r="2"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
          </button>
          <button 
            type="submit" 
            className="start-button"
            disabled={!input.trim() || disabled}
          >
            开始演示
          </button>
        </div>
      </form>

      <ExampleButtons 
        onSelect={handleExampleSelect} 
        disabled={disabled} 
      />
    </div>
  );
};

export default InputPanel; 