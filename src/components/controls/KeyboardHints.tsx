import React from 'react';

/**
 * 键盘快捷键提示组件
 * 显示可用的键盘快捷键信息
 */
const KeyboardHints: React.FC = () => {
  return (
    <div className="keyboard-hints">
      <p>键盘快捷键: ← 上一步 | → 下一步 | 空格 播放/暂停 | R 重置</p>
    </div>
  );
};

export default KeyboardHints; 