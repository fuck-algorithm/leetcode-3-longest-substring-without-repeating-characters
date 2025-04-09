import React from 'react';

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * 控制按钮组件
 * 封装了算法可视化控制按钮的通用样式和行为
 */
const ControlButton: React.FC<ControlButtonProps> = ({
  onClick,
  disabled = false,
  title,
  className = '',
  children
}) => {
  return (
    <button 
      className={`control-button ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
};

export default ControlButton; 