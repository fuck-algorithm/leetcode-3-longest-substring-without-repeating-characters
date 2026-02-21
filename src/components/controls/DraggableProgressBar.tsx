import React, { useRef, useState, useEffect, useCallback } from 'react';
import './DraggableProgressBar.css';

interface DraggableProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
}

const DraggableProgressBar: React.FC<DraggableProgressBarProps> = ({
  currentStep,
  totalSteps,
  onStepChange
}) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverStep, setHoverStep] = useState<number | null>(null);

  const progressPercentage = totalSteps > 1 
    ? (currentStep / (totalSteps - 1)) * 100 
    : 0;

  // 计算点击/拖拽位置对应的步骤
  const calculateStepFromPosition = useCallback((clientX: number): number => {
    if (!progressRef.current) return 0;
    
    const rect = progressRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const step = Math.round(percentage * (totalSteps - 1));
    
    return step;
  }, [totalSteps]);

  // 处理鼠标/触摸按下
  const handleStart = useCallback((clientX: number) => {
    setIsDragging(true);
    const step = calculateStepFromPosition(clientX);
    if (step !== currentStep) {
      onStepChange(step);
    }
  }, [calculateStepFromPosition, currentStep, onStepChange]);

  // 处理鼠标/触摸移动
  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) {
      // 仅显示hover提示
      const step = calculateStepFromPosition(clientX);
      setHoverStep(step);
      return;
    }
    
    const step = calculateStepFromPosition(clientX);
    if (step !== currentStep) {
      onStepChange(step);
    }
  }, [isDragging, calculateStepFromPosition, currentStep, onStepChange]);

  // 处理鼠标/触摸结束
  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setHoverStep(null);
  }, []);

  // 鼠标事件
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const onMouseLeave = () => {
    setHoverStep(null);
  };

  // 全局鼠标事件（用于拖拽时鼠标移出元素）
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };

    const handleGlobalMouseUp = () => {
      handleEnd();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  // 触摸事件
  const onTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // 防止滚动
    handleMove(e.touches[0].clientX);
  };

  const onTouchEnd = () => {
    handleEnd();
  };

  // 全局触摸事件
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };

    const handleGlobalTouchEnd = () => {
      handleEnd();
    };

    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  // 键盘快捷键：Home/End 跳转到开始/结束
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Home':
        e.preventDefault();
        onStepChange(0);
        break;
      case 'End':
        e.preventDefault();
        onStepChange(totalSteps - 1);
        break;
    }
  };

  return (
    <div 
      className="draggable-progress-container"
      role="slider"
      aria-valuemin={0}
      aria-valuemax={totalSteps - 1}
      aria-valuenow={currentStep}
      aria-label="算法步骤进度条"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* 进度信息显示 */}
      <div className="progress-info">
        <span className="step-text">
          步骤 {currentStep + 1} / {totalSteps}
        </span>
        <span className="percentage-text">
          {Math.round(progressPercentage)}%
        </span>
      </div>

      {/* 可拖拽进度条 */}
      <div 
        ref={progressRef}
        className={`progress-track ${isDragging ? 'dragging' : ''}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 已播放部分（绿色） */}
        <div 
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
        
        {/* 未播放部分（灰色） */}
        <div 
          className="progress-remaining"
          style={{ 
            left: `${progressPercentage}%`,
            width: `${100 - progressPercentage}%`
          }}
        />

        {/* 拖拽手柄 */}
        <div 
          className="progress-handle"
          style={{ left: `${progressPercentage}%` }}
        >
          <div className="handle-inner" />
        </div>

        {/* 悬停提示 */}
        {hoverStep !== null && !isDragging && (
          <div 
            className="hover-tooltip"
            style={{ 
              left: `${(hoverStep / (totalSteps - 1)) * 100}%` 
            }}
          >
            步骤 {hoverStep + 1}
          </div>
        )}
      </div>

      {/* 步骤标记点 */}
      <div className="step-markers">
        {totalSteps <= 20 && Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`step-marker ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'passed' : ''}`}
            style={{ left: `${(i / (totalSteps - 1)) * 100}%` }}
            onClick={() => onStepChange(i)}
            title={`步骤 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default DraggableProgressBar;
