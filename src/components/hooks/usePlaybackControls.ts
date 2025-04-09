import { useEffect, useRef, useCallback } from 'react';

interface PlaybackControlsOptions {
  isPlaying: boolean;
  playbackSpeed: number;
  onStepForward: () => void;
  isAtEnd: boolean;
  onPlaybackEnd?: () => void;
}

/**
 * 播放控制钩子
 * 处理算法可视化的自动播放逻辑
 */
export function usePlaybackControls({
  isPlaying,
  playbackSpeed,
  onStepForward,
  isAtEnd,
  onPlaybackEnd
}: PlaybackControlsOptions) {
  // 定时器引用
  const playbackTimerRef = useRef<number | null>(null);

  // 清除定时器
  const clearPlaybackTimer = useCallback(() => {
    if (playbackTimerRef.current !== null) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);

  // 自动播放逻辑
  useEffect(() => {
    if (isPlaying && !isAtEnd) {
      clearPlaybackTimer();
      
      playbackTimerRef.current = setInterval(() => {
        onStepForward();
      }, 1000 / playbackSpeed);
    } else {
      clearPlaybackTimer();
      
      if (isAtEnd && isPlaying && onPlaybackEnd) {
        onPlaybackEnd();
      }
    }
    
    return clearPlaybackTimer;
  }, [isPlaying, playbackSpeed, onStepForward, isAtEnd, onPlaybackEnd, clearPlaybackTimer]);

  return { clearPlaybackTimer };
} 