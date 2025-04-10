import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { AlgorithmState } from './types';
import { getCharPosition, createFlashingEffect, calculateCharDimensions } from './drawingUtils';

interface HashSetDisplayProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  currentState: AlgorithmState;
  width?: number;
  height?: number;
}

/**
 * 哈希集合展示组件 - 显示当前滑动窗口中的字符集
 */
const HashSetDisplay: React.FC<HashSetDisplayProps> = ({ svg, currentState, width = 800, height = 300 }) => {
  // 组件ID用于调试和确保唯一性
  const componentId = React.useRef(`hashset-${Math.random().toString(36).substring(2, 11)}`);
  const containerId = `hashset-container-${componentId.current}`;
  const titleId = `hashset-title-${componentId.current}`;
  const cellClass = `hashset-cell-${componentId.current}`;

  useEffect(() => {
    if (!svg) return;
    
    // 确保删除所有相关元素，包括可能存在的旧版本组件
    svg.selectAll('.hashset-container, .hashset-cell, .hashset-title, [id^="hashset-"]').remove();
    
    // 直接从currentState获取数据
    const inputString = currentState.inputString || '';
    const leftPointer = currentState.leftPointer || 0;
    const rightPointer = currentState.rightPointer || 0;
    
    // 调试日志 - 详细记录状态
    console.log(`[${componentId.current}] RENDER START ==================`);
    console.log(`[${componentId.current}] 输入字符串: "${inputString}"`);
    console.log(`[${componentId.current}] 左指针: ${leftPointer}`);
    console.log(`[${componentId.current}] 右指针: ${rightPointer}`);
    
    // 只考虑leftPointer到rightPointer之间的字符
    let windowChars = [];
    if (leftPointer <= rightPointer && rightPointer < inputString.length) {
      for (let i = leftPointer; i <= rightPointer; i++) {
        windowChars.push(inputString[i]);
      }
    }
    
    // 使用集合去重
    const hashSetData = [...new Set(windowChars)];
    
    console.log(`[${componentId.current}] 窗口字符: ${windowChars.join('')}`);
    console.log(`[${componentId.current}] 哈希集合: ${hashSetData.join('')}`);
    
    // 创建新容器，使用唯一ID
    const container = svg.append('g')
      .attr('class', 'hashset-container')
      .attr('id', containerId);
    
    // 设置网格布局
    const cellSize = 40;
    const cellSpacing = 5;
    const leftAreaWidth = width * 0.45;
    const setY = height - 110;
    const setX = width * 0.05;
    
    // 计算每行最大字符数
    const maxCharsPerRow = Math.max(1, Math.floor((leftAreaWidth - setX) / (cellSize + cellSpacing)));
    
    // 添加标题，使用唯一ID
    container.append('text')
      .attr('class', 'hashset-title')
      .attr('id', titleId)
      .attr('x', setX + leftAreaWidth / 2)
      .attr('y', setY - 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#333')
      .attr('font-weight', 'bold')
      .text('当前滑动窗口字符哈希集合');
    
    // 如果没有字符，显示提示
    if (hashSetData.length === 0) {
      container.append('text')
        .attr('class', 'hashset-empty')
        .attr('id', `hashset-empty-${componentId.current}`)
        .attr('x', setX + leftAreaWidth / 2)
        .attr('y', setY + 30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#666')
        .text('(空)');
      console.log(`[${componentId.current}] 无字符，显示空提示`);
      console.log(`[${componentId.current}] RENDER END ==================`);
      return;
    }
    
    // 创建字符元素，每个都有唯一ID
    hashSetData.forEach((char, i) => {
      const cellId = `${cellClass}-${i}`;
      const row = Math.floor(i / maxCharsPerRow);
      const col = i % maxCharsPerRow;
      const x = setX + col * (cellSize + cellSpacing);
      const y = setY + row * (cellSize + cellSpacing);
      
      // 创建组
      const group = container.append('g')
        .attr('class', 'hashset-cell')
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
        .attr('fill', '#e3f2fd')
        .attr('stroke', '#90caf9')
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
        .text(char);
      
      // 添加淡入动画
      group.transition()
        .duration(300)
        .style('opacity', 1);
      
      // 如果是重复字符，高亮显示
      if (currentState.duplicateFound && char === currentState.duplicateChar) {
        group.select('rect')
          .attr('fill', '#ffcdd2')
          .attr('stroke', '#ef9a9a')
          .attr('stroke-width', 2);
          
        createFlashingEffect(group, 500, 4, '#ffcdd2', '#ef5350');
      }
    });
    
    console.log(`[${componentId.current}] 创建了 ${hashSetData.length} 个字符元素`);
    console.log(`[${componentId.current}] RENDER END ==================`);
    
  }, [svg, currentState, width, height, componentId]);
  
  return null;
};

export default HashSetDisplay; 