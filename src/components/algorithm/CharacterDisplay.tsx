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
    
    // 绘制字符串背景
    svg.selectAll('.char-background').remove();
    svg.append('rect')
      .attr('class', 'char-background')
      .attr('x', startX - charWidth/2)
      .attr('y', startY - charHeight/2)
      .attr('width', inputString.length * charWidth + charWidth)
      .attr('height', charHeight + 10)
      .attr('rx', 8)
      .attr('fill', '#f0f0f0')
      .attr('opacity', 0.5);
    
    // 绘制字符
    const charGroup = svg.selectAll('.char-group')
      .data(inputString.split(''))
      .join(
        // 添加新字符
        enter => {
          const g = enter.append('g')
            .attr('class', 'char-group')
            .attr('transform', (d, i) => `translate(${startX + i * charWidth}, ${startY})`)
            .style('opacity', 0);
            
          g.append('rect')
            .attr('width', charWidth - 4)
            .attr('height', charHeight)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('fill', (d, i) => {
              if (i >= currentState.leftPointer && i <= currentState.rightPointer) {
                return '#e0f7fa';
              }
              return '#f5f5f5';
            })
            .attr('stroke', (d, i) => {
              if (currentState.duplicateFound && d === currentState.duplicateChar) {
                return '#f44336';
              }
              return '#ccc';
            })
            .attr('stroke-width', (d, i) => {
              if (currentState.duplicateFound && d === currentState.duplicateChar) {
                return 3;
              }
              return 1;
            });
            
          g.append('text')
            .attr('x', charWidth / 2 - 2)
            .attr('y', charHeight / 2 + 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('fill', '#333')
            .text(d => d);
            
          return g;
        },
        // 更新现有字符
        update => {
          update.select('rect')
            .transition()
            .duration(400)
            .attr('fill', (d, i) => {
              if (i >= currentState.leftPointer && i <= currentState.rightPointer) {
                return '#e0f7fa';
              }
              return '#f5f5f5';
            })
            .attr('stroke', (d, i) => {
              if (currentState.duplicateFound && d === currentState.duplicateChar) {
                return '#f44336';
              }
              return '#ccc';
            })
            .attr('stroke-width', (d, i) => {
              if (currentState.duplicateFound && d === currentState.duplicateChar) {
                return 3;
              }
              return 1;
            });
          
          return update;
        }
      )
      .transition()
      .delay((d, i) => i * 50) // 连续展现动画效果
      .duration(300)
      .style('opacity', 1);
    
    // 绘制当前窗口指示器
    svg.selectAll('.window-indicator').remove();
    if (currentState.leftPointer <= currentState.rightPointer) {
      const windowWidth = (currentState.rightPointer - currentState.leftPointer + 1) * charWidth;
      svg.append('rect')
        .attr('class', 'window-indicator')
        .attr('x', startX + currentState.leftPointer * charWidth - 2)
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