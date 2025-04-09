import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { AlgorithmState } from './types';
import { getCharPosition, createFlashingEffect } from './drawingUtils';

interface HashSetDisplayProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  currentState: AlgorithmState;
  width?: number;
  height?: number;
}

const HashSetDisplay: React.FC<HashSetDisplayProps> = ({ svg, currentState, width = 800, height = 300 }) => {
  useEffect(() => {
    if (!svg) return;
    
    const cellSize = 50;
    const cellSpacing = 10;
    const rowLength = 10;
    const setY = height - 150; // 将哈希集合放在底部
    
    // 从currentState中提取hashSetData
    const hashSetData = Array.from(currentState.charSet);

    // 清除先前的内容 (仅清除此组件相关的元素)
    svg.selectAll('.hashset-container').remove();
    
    // 创建一个容器组
    const container = svg.append('g')
      .attr('class', 'hashset-container');
      
    // 添加标题
    container.append('text')
      .attr('x', width / 2)
      .attr('y', setY - 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#333')
      .text('哈希集合（无重复字符集）');

    // 更新哈希集合显示
    const hashSetGroup = container.selectAll<SVGGElement, string>('.hashset-cell')
      .data(hashSetData)
      .join(
        // 添加新字符
        enter => {
          const group = enter.append('g')
            .attr('class', 'hashset-cell')
            .attr('transform', (d, i) => {
              const pos = getCharPosition(i, rowLength, cellSize, cellSpacing, (width - rowLength * (cellSize + cellSpacing)) / 2, setY);
              return `translate(${pos.x}, ${pos.y})`;
            })
            .style('opacity', 0);

          // 添加背景矩形
          group.append('rect')
            .attr('width', cellSize)
            .attr('height', cellSize)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('fill', '#e3f2fd')
            .attr('stroke', '#90caf9')
            .attr('stroke-width', 2);

          // 添加字符文本
          group.append('text')
            .attr('x', cellSize / 2)
            .attr('y', cellSize / 2 + 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '20px')
            .attr('font-family', 'monospace')
            .text(d => d);

          group.transition()
            .duration(300)
            .style('opacity', 1);

          return group;
        },
        // 更新现有字符
        update => {
          update.transition()
            .duration(300)
            .attr('transform', (d, i) => {
              const pos = getCharPosition(i, rowLength, cellSize, cellSpacing, (width - rowLength * (cellSize + cellSpacing)) / 2, setY);
              return `translate(${pos.x}, ${pos.y})`;
            });
          
          // 如果是刚添加的字符，但不是重复字符，创建闪烁效果
          update.each(function(d) {
            if (currentState.rightPointer > 0 && 
                currentState.inputString[currentState.rightPointer] === d &&
                !currentState.duplicateFound) {
              createFlashingEffect(d3.select(this), 600, 3, '#e3f2fd', '#bbdefb');
            }
          });
          
          return update;
        },
        // 移除退出的字符
        exit => {
          exit.transition()
            .duration(300)
            .style('opacity', 0)
            .remove();
        }
      );

    // 如果发现重复字符，高亮显示它
    if (currentState.duplicateFound && currentState.duplicateChar) {
      const duplicateCell = container.selectAll('.hashset-cell')
        .filter((d: any) => d === currentState.duplicateChar);
        
      if (!duplicateCell.empty()) {
        duplicateCell.select('rect')
          .transition()
          .duration(300)
          .attr('fill', '#ffcdd2')
          .attr('stroke', '#ef9a9a')
          .attr('stroke-width', 2);
          
        createFlashingEffect(duplicateCell, 500, 4, '#ffcdd2', '#ef5350');
      }
    }
  }, [svg, currentState, width, height]);
  
  // 不需要返回任何内容，因为我们直接修改传入的svg
  return null;
};

export default HashSetDisplay; 