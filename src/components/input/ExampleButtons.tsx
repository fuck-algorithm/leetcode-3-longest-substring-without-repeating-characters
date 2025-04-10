import React from 'react';

// 预设示例
export const examples = [
  { label: '示例1: "abcabcbb"', value: 'abcabcbb' },
  { label: '示例2: "bbbbb"', value: 'bbbbb' },
  { label: '示例3: "pwwkew"', value: 'pwwkew' },
  { label: '示例4: "abcdefgh"', value: 'abcdefgh' },
  { label: '示例5: "aab"', value: 'aab' },
  { label: '示例6: "abcdefghijk"', value: 'abcdefghijk' },
  { label: '示例7: "zyxwvutsrqp"', value: 'zyxwvutsrqp' },
];

interface ExampleButtonsProps {
  onSelect: (value: string) => void;
  disabled: boolean;
}

/**
 * 示例按钮组件
 * 显示预设的字符串示例，点击可选择对应的示例
 */
const ExampleButtons: React.FC<ExampleButtonsProps> = ({ onSelect, disabled }) => {
  return (
    <div className="examples">
      <div className="examples-header">
        <p className="examples-title">选择示例:</p>
      </div>
      <div className="example-buttons">
        {examples.map((example, index) => (
          <button
            key={index}
            className="example-button"
            onClick={() => onSelect(example.value)}
            disabled={disabled}
            title={example.label}
          >
            {`示例${index + 1}: "${example.value}"`}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExampleButtons; 