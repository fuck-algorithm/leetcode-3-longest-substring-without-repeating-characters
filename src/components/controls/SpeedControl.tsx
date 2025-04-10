import React, { useState, useRef, useEffect } from 'react';

interface SpeedControlProps {
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

// 预设速度选项
const speedOptions = [
  { value: 0.5, label: '0.5×' },
  { value: 1, label: '1.0×' },
  { value: 1.5, label: '1.5×' },
  { value: 2, label: '2.0×' },
];

/**
 * 播放速度控制组件
 * 用于调整算法演示的播放速度
 */
const SpeedControl: React.FC<SpeedControlProps> = ({
  playbackSpeed,
  onSpeedChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 获取当前选中速度的标签
  const currentSpeedLabel = speedOptions.find(option => option.value === playbackSpeed)?.label || '1.0×';

  // 处理点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理选择速度
  const handleSelectSpeed = (speed: number) => {
    onSpeedChange(speed);
    setIsOpen(false);
  };

  return (
    <div className="custom-speed-control" ref={dropdownRef}>
      <button 
        className="speed-display" 
        onClick={() => setIsOpen(!isOpen)}
        title="播放速度控制"
      >
        <span className="speed-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </span>
        <span className="current-speed">{currentSpeedLabel}</span>
        <span className="dropdown-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>
      
      {isOpen && (
        <div className="speed-dropdown">
          {speedOptions.map(option => (
            <button
              key={option.value}
              className={`speed-option ${option.value === playbackSpeed ? 'active' : ''}`}
              onClick={() => handleSelectSpeed(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpeedControl; 