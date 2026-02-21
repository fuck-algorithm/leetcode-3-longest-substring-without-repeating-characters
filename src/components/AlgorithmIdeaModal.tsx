import React from 'react';
import './AlgorithmIdeaModal.css';

interface AlgorithmIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AlgorithmIdeaModal: React.FC<AlgorithmIdeaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>算法思路 - 滑动窗口</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <section className="idea-section">
            <h3>🎯 问题分析</h3>
            <p>
              给定一个字符串，需要找出<strong>不含有重复字符的最长子串</strong>的长度。
              例如："abcabcbb" 的最长子串是 "abc"，长度为 3。
            </p>
          </section>

          <section className="idea-section">
            <h3>💡 核心思想：滑动窗口</h3>
            <p>
              使用<strong>滑动窗口</strong>技术来高效地解决问题：
            </p>
            <ul>
              <li>
                <strong>窗口定义</strong>：使用两个指针 <code>left</code> 和 <code>right</code> 表示一个窗口，
                窗口内的字符串就是当前正在检查的无重复字符子串
              </li>
              <li>
                <strong>右指针移动</strong>：右指针向右移动，不断将新字符加入窗口
              </li>
              <li>
                <strong>左指针移动</strong>：当发现重复字符时，左指针向右移动，缩小窗口直到没有重复字符
              </li>
              <li>
                <strong>HashSet辅助</strong>：使用 HashSet 快速判断窗口内是否有重复字符
              </li>
            </ul>
          </section>

          <section className="idea-section">
            <h3>🔍 算法步骤详解</h3>
            <ol className="steps-list">
              <li>
                <strong>初始化</strong>：
                <code>left = 0, right = 0, maxLength = 0</code>，创建空的 HashSet
              </li>
              <li>
                <strong>扩展窗口</strong>：
                移动右指针，将新字符加入 HashSet，更新最大长度
              </li>
              <li>
                <strong>遇到重复</strong>：
                如果新字符已在 HashSet 中，说明出现重复
              </li>
              <li>
                <strong>收缩窗口</strong>：
                移动左指针，从 HashSet 中移除字符，直到重复字符被移出
              </li>
              <li>
                <strong>重复步骤2-4</strong>：
                直到右指针遍历完整个字符串
              </li>
            </ol>
          </section>

          <section className="idea-section">
            <h3>📊 示例演示："abcabcbb"</h3>
            <div className="example-table">
              <table>
                <thead>
                  <tr>
                    <th>步骤</th>
                    <th>右指针</th>
                    <th>窗口</th>
                    <th>操作</th>
                    <th>最大长度</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>'a'</td>
                    <td>[a]</td>
                    <td>加入'a'</td>
                    <td>1</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>'b'</td>
                    <td>[ab]</td>
                    <td>加入'b'</td>
                    <td>2</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>'c'</td>
                    <td>[abc]</td>
                    <td>加入'c'</td>
                    <td>3</td>
                  </tr>
                  <tr>
                    <td>4</td>
                    <td>'a'</td>
                    <td>[abca]</td>
                    <td>发现重复'a'，移动左指针移出'a'</td>
                    <td>3</td>
                  </tr>
                  <tr>
                    <td>5</td>
                    <td>'b'</td>
                    <td>[abcab]</td>
                    <td>发现重复'b'，移动左指针移出'b'</td>
                    <td>3</td>
                  </tr>
                  <tr>
                    <td>...</td>
                    <td>...</td>
                    <td>...</td>
                    <td>继续遍历...</td>
                    <td>3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="idea-section">
            <h3>⏱️ 复杂度分析</h3>
            <div className="complexity-box">
              <p><strong>时间复杂度：O(n)</strong></p>
              <p>左右指针各自最多遍历字符串一次，每个字符最多被访问两次</p>
              <p><strong>空间复杂度：O(min(m, n))</strong></p>
              <p>其中 m 是字符集大小，n 是字符串长度。HashSet 最多存储一个窗口内的字符</p>
            </div>
          </section>

          <section className="idea-section">
            <h3>✨ 为什么滑动窗口高效？</h3>
            <p>
              传统的暴力解法需要 O(n³) 或 O(n²) 的时间复杂度来检查所有子串。
              而滑动窗口利用<strong>双指针</strong>，使得每个字符最多被访问两次（左指针一次，右指针一次），
              将时间复杂度优化到 O(n)，空间复杂度仅需 O(min(m, n))。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmIdeaModal;
