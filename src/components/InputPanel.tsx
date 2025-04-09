import React, { useState } from 'react';

interface InputPanelProps {
  onInputChange: (input: string) => void;
  onStart: () => void;
  disabled: boolean;
}

// 预设示例
const examples = [
  { label: '示例1: "abcabcbb"', value: 'abcabcbb' },
  { label: '示例2: "bbbbb"', value: 'bbbbb' },
  { label: '示例3: "pwwkew"', value: 'pwwkew' },
  { label: '示例4: "abcdefgh"', value: 'abcdefgh' },
  { label: '示例5: "aab"', value: 'aab' },
  { label: '示例6: "dvdf"', value: 'dvdf' },
];

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

      <div className="examples">
        <div className="examples-header">
          <p className="examples-title">选择示例:</p>
        </div>
        <div className="example-buttons">
          {examples.map((example, index) => (
            <button
              key={index}
              className="example-button"
              onClick={() => handleExampleSelect(example.value)}
              disabled={disabled}
              title={example.label}
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InputPanel; 