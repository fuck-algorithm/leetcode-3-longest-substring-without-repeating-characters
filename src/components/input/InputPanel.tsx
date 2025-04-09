import React, { useState } from 'react';
import ExampleButtons from './ExampleButtons';

interface InputPanelProps {
  onInputChange: (input: string) => void;
  onStart: () => void;
  disabled: boolean;
}

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