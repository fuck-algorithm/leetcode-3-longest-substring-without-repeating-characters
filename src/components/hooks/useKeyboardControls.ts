import { useEffect } from 'react';

interface KeyboardControlsOptions {
  isRunning: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isPlaying: boolean;
  onStepBack: () => void;
  onStepForward: () => void;
  onPlayPause: () => void;
  onReset: () => void;
}

/**
 * 键盘控制钩子
 * 处理算法可视化的键盘快捷键
 */
export function useKeyboardControls({
  isRunning,
  canGoBack,
  canGoForward,
  isPlaying,
  onStepBack,
  onStepForward,
  onPlayPause,
  onReset
}: KeyboardControlsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isRunning) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          if (canGoBack) onStepBack();
          break;
        case 'ArrowRight':
          if (canGoForward) onStepForward();
          break;
        case ' ': // 空格键
          e.preventDefault(); // 防止页面滚动
          onPlayPause();
          break;
        case 'r':
        case 'R':
          onReset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isRunning, 
    canGoBack, 
    canGoForward, 
    onStepBack, 
    onStepForward, 
    onPlayPause, 
    onReset
  ]);
} 