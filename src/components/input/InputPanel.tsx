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
const generateRandomString = (minLength = 3, maxLength = 50) => {
  // 只包含小写字母
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
  onStart
}) => {
  // 使用随机字符串作为初始值，而不是固定字符串
  const [input, setInput] = useState<string>(() => generateRandomString());
  const [error, setError] = useState<string>('');

  // 验证字符串是否符合要求
  const validateInput = (value: string): boolean => {
    if (!value.trim()) {
      setError('输入不能为空！');
      return false;
    }
    
    if (value.length > 50) {
      setError('字符串长度不能超过50个字符！');
      return false;
    }
    
    if (!/^[a-z]+$/.test(value)) {
      setError('字符串只能包含小写字母！');
      return false;
    }
    
    setError('');
    return true;
  };

  // 组件挂载后通知父组件初始值，并开始演示
  React.useEffect(() => {
    if (validateInput(input)) {
      onInputChange(input);
      // 使用setTimeout确保状态更新后再开始算法
      setTimeout(() => {
        onStart();
      }, 10);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 仅在组件挂载时执行一次

  // 处理示例选择
  const handleExampleSelect = (value: string) => {
    setInput(value);
    
    if (validateInput(value)) {
      // 使用Promise和setTimeout确保状态更新顺序正确
      // 先触发重置
      onInputChange(value);
      
      // 然后延迟启动算法，确保重置完成
      setTimeout(() => {
        console.log('示例切换：开始算法', value);
        onStart();
      }, 100); // 使用更长的延迟确保状态完全更新
    }
  };

  // 处理随机字符串生成
  const handleRandomGenerate = () => {
    const randomString = generateRandomString();
    setInput(randomString);
    setError(''); // 随机生成的字符串一定是有效的

    // 先重置算法状态
    onInputChange(randomString);
    
    // 延迟启动算法，确保状态完全重置
    setTimeout(() => {
      console.log('随机字符串：开始算法', randomString);
      onStart();
    }, 100); // 使用更长的延迟确保状态完全更新
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    // 实时验证但不显示错误，提交时再显示
    if (error) validateInput(value);
  };

  // 提交输入
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateInput(input)) {
      onInputChange(input);
      onStart();
    }
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
            placeholder="请输入1-50个小写字母"
            disabled={false}
            className={error ? 'input-error' : ''}
          />
          <button 
            type="button" 
            className="random-button"
            onClick={handleRandomGenerate}
            disabled={false}
            title="生成1-50个随机字母"
          >
            🎲
          </button>
          <button 
            type="submit" 
            className="start-button"
            disabled={!input.trim()}
          >
            确定
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </form>

      <ExampleButtons 
        onSelect={handleExampleSelect} 
        disabled={false}
      />
    </div>
  );
};

export default InputPanel; 