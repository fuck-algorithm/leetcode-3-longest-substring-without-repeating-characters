import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { AlgorithmState } from './types';
import { calculateCharDimensions } from './drawingUtils';

interface AnswerDisplayProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  currentState: AlgorithmState;
  width?: number;
  height?: number;
}

/**
 * 最长子串答案展示组件
 * 显示算法找到的最长无重复字符子串
 */
const AnswerDisplay: React.FC<AnswerDisplayProps> = ({ svg, currentState, width = 800, height = 300 }) => {
  // 组件ID用于调试和确保唯一性
  const componentId = React.useRef(`answer-${Math.random().toString(36).substring(2, 11)}`);
  const containerId = `answer-container-${componentId.current}`;
  const titleId = `answer-title-${componentId.current}`;
  const cellClass = `answer-cell-${componentId.current}`;
  
  useEffect(() => {
    if (!svg) return;
    
    // 确保删除所有相关元素，包括可能存在的旧版本组件
    svg.selectAll('.answer-container, .answer-char, .answer-title, .answer-empty, [id^="answer-"]').remove();
    
    // 详细日志记录当前状态
    console.log(`[${componentId.current}] RENDER START ==================`);
    console.log(`[${componentId.current}] 当前状态步骤: ${currentState.step}`);
    
    // 确保获取有效的最长子串和长度，从当前状态中直接获取
    const maxSubstring = typeof currentState.maxSubstring === 'string' ? currentState.maxSubstring : '';
    const maxLength = typeof currentState.maxLength === 'number' ? currentState.maxLength : 0;
    
    // 将最长子串拆分为字符数组
    const answerData = maxSubstring.split('');
    
    // 调试输出
    console.log(`[${componentId.current}] 最长子串: "${maxSubstring}"`);
    console.log(`[${componentId.current}] 最长长度: ${maxLength}`);
    
    // 设置网格布局
    const cellSize = 40;
    const cellSpacing = 5;
    const answerY = height - 110;
    const answerX = width * 0.55;
    const rightAreaWidth = width * 0.4;
    
    // 计算每行最大显示字符数
    const maxCharsPerRow = Math.max(1, Math.floor(rightAreaWidth / (cellSize + cellSpacing)));
    
    // 创建容器，使用唯一ID
    const container = svg.append('g')
      .attr('class', 'answer-container')
      .attr('id', containerId);
      
    // 添加标题，使用唯一ID
    container.append('text')
      .attr('class', 'answer-title')
      .attr('id', titleId)
      .attr('x', answerX + rightAreaWidth / 2)
      .attr('y', answerY - 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('最长无重复子串 (长度: ' + maxLength + ')');

    // 如果没有最长子串，显示提示信息
    if (answerData.length === 0) {
      container.append('text')
        .attr('class', 'answer-empty')
        .attr('id', `answer-empty-${componentId.current}`)
        .attr('x', answerX + rightAreaWidth / 2)
        .attr('y', answerY + 30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#666')
        .text('暂无结果');
      console.log(`[${componentId.current}] 无结果，显示提示`);
      console.log(`[${componentId.current}] RENDER END ==================`);
      return;
    }

    // 创建字符元素，每个都有唯一ID
    answerData.forEach((char, i) => {
      const cellId = `${cellClass}-${i}`;
      const row = Math.floor(i / maxCharsPerRow);
      const col = i % maxCharsPerRow;
      const x = answerX + col * (cellSize + cellSpacing);
      const y = answerY + row * (cellSize + cellSpacing);
      
      // 创建组
      const group = container.append('g')
        .attr('class', 'answer-char')
        .attr('id', cellId)
        .attr('transform', `translate(${x}, ${y})`)
        .style('opacity', 0);
      
      // 添加背景矩形
      group.append('rect')
        .attr('id', `${cellId}-rect`)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', '#e8f5e9')
        .attr('stroke', '#81c784')
        .attr('stroke-width', 2);
      
      // 添加字符文本
      group.append('text')
        .attr('id', `${cellId}-text`)
        .attr('x', cellSize / 2)
        .attr('y', cellSize / 2 + 6)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', '#2e7d32')
        .text(char);
      
      // 添加淡入动画
      group.transition()
        .duration(300)
        .style('opacity', 1);
    });
    
    // 动画效果 - 更新结果步骤时
    if (currentState.step === 4) { // UPDATE_RESULT步骤
      container.selectAll('.answer-char rect')
        .attr('fill', '#c8e6c9')
        .transition()
        .duration(500)
        .attr('fill', '#e8f5e9');
    }
    
    console.log(`[${componentId.current}] 创建了 ${answerData.length} 个字符元素`);
    console.log(`[${componentId.current}] RENDER END ==================`);
    
  }, [svg, currentState, width, height, componentId]);
  
  return null;
};

export default AnswerDisplay; 