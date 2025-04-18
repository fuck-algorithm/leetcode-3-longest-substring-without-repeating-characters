import React from 'react';
import * as d3 from 'd3';
import { AlgorithmState } from './types';

interface CharacterDisplayProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
  inputString: string;
  currentState: AlgorithmState;
  startX: number;
  startY: number;
  charWidth: number;
  charHeight: number;
}

/**
 * 渲染字符串和字符背景
 */
const CharacterDisplay: React.FC<CharacterDisplayProps> = ({
  svg,
  inputString,
  currentState,
  startX,
  startY,
  charWidth,
  charHeight
}) => {
  React.useEffect(() => {
    if (!svg) return;
    
    // 字符间距
    const spacing = 10;
    
    // 绘制字符串背景
    svg.selectAll('.char-background').remove();
    svg.append('rect')
      .attr('class', 'char-background')
      .attr('x', startX - spacing/2)
      .attr('y', startY - charHeight/2)
      .attr('width', inputString.length * (charWidth + spacing) - spacing + spacing)
      .attr('height', charHeight + 10)
      .attr('rx', 8)
      .attr('fill', '#f0f0f0')
      .attr('opacity', 0.5);
    
    // 安全获取指针位置
    const leftPointer = Math.max(0, Math.min(currentState.leftPointer || 0, inputString.length - 1));
    const rightPointer = Math.max(leftPointer, Math.min(currentState.rightPointer || 0, inputString.length - 1));
    const duplicateFound = currentState.duplicateFound || false;
    const duplicateChar = currentState.duplicateChar || '';
    
    // 绘制字符
    svg.selectAll('.char-group')
      .data(inputString.split(''))
      .join(
        // 添加新字符
        enter => {
          const g = enter.append('g')
            .attr('class', 'char-group')
            .attr('transform', (_, i) => `translate(${startX + i * (charWidth + spacing)}, ${startY})`)
            .style('opacity', 0);
            
          g.append('rect')
            .attr('width', charWidth)
            .attr('height', charHeight)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('fill', (_, i) => {
              if (i >= leftPointer && i <= rightPointer) {
                return '#e0f7fa';
              }
              return '#f5f5f5';
            })
            .attr('stroke', (d) => {
              if (duplicateFound && d === duplicateChar) {
                return '#f44336';
              }
              return '#ccc';
            })
            .attr('stroke-width', (d) => {
              if (duplicateFound && d === duplicateChar) {
                return 3;
              }
              return 1;
            });
            
          // 根据字符大小动态计算字体大小
          const fontSize = Math.max(16, Math.min(charWidth * 0.5, 36));
            
          g.append('text')
            .attr('x', charWidth / 2)
            .attr('y', charHeight / 2 + fontSize/3)
            .attr('text-anchor', 'middle')
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'bold')
            .attr('font-family', 'monospace')
            .attr('fill', '#333')
            .text(d => d);
            
          return g;
        },
        // 更新现有字符
        update => {
          update.transition()
            .duration(400)
            .attr('transform', (_, i) => `translate(${startX + i * (charWidth + spacing)}, ${startY})`);
            
          update.select('rect')
            .transition()
            .duration(400)
            .attr('width', charWidth)
            .attr('height', charHeight)
            .attr('fill', (_, i) => {
              if (i >= leftPointer && i <= rightPointer) {
                return '#e0f7fa';
              }
              return '#f5f5f5';
            })
            .attr('stroke', (d) => {
              if (duplicateFound && d === duplicateChar) {
                return '#f44336';
              }
              return '#ccc';
            })
            .attr('stroke-width', (d) => {
              if (duplicateFound && d === duplicateChar) {
                return 3;
              }
              return 1;
            });
          
          // 更新字体大小
          const fontSize = Math.max(16, Math.min(charWidth * 0.5, 36));
          update.select('text')
            .attr('x', charWidth / 2)
            .attr('y', charHeight / 2 + fontSize/3)
            .attr('font-size', `${fontSize}px`);
          
          return update;
        }
      )
      .transition()
      .delay((_, i) => i * 50) // 连续展现动画效果
      .duration(300)
      .style('opacity', 1);
    
    // 绘制当前窗口指示器
    svg.selectAll('.window-indicator').remove();
    if (leftPointer <= rightPointer) {
      const windowWidth = (rightPointer - leftPointer + 1) * (charWidth + spacing) - spacing;
      svg.append('rect')
        .attr('class', 'window-indicator')
        .attr('x', startX + leftPointer * (charWidth + spacing))
        .attr('y', startY + charHeight + 5)
        .attr('width', windowWidth)
        .attr('height', 3)
        .attr('rx', 1.5)
        .attr('fill', '#2196f3')
        .style('opacity', 0)
        .transition()
        .delay(400)
        .duration(400)
        .style('opacity', 0.8);
    }
  }, [svg, inputString, currentState, startX, startY, charWidth, charHeight]);
  
  return null; // 这是一个功能性组件，不渲染实际DOM
};

export default CharacterDisplay; 