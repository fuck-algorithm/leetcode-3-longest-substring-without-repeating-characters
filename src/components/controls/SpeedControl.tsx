import React from 'react';

interface SpeedControlProps {
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

/**
 * 播放速度控制组件
 * 用于调整算法演示的播放速度
 */
const SpeedControl: React.FC<SpeedControlProps> = ({
  playbackSpeed,
  onSpeedChange
}) => {
  return (
    <div className="speed-control">
      <label htmlFor="speed-control">速度</label>
      <select 
        id="speed-control" 
        value={playbackSpeed} 
        onChange={(e) => onSpeedChange(Number(e.target.value))}
        title="播放速度控制"
      >
        <option value={0.5}>0.5×</option>
        <option value={1}>1.0×</option>
        <option value={1.5}>1.5×</option>
        <option value={2}>2.0×</option>
      </select>
    </div>
  );
};

export default SpeedControl; 