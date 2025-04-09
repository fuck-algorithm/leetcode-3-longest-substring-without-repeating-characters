import React from 'react';
import * as d3 from 'd3';
import { AlgorithmStep } from './types';

interface PointerDisplayProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
  pointerType: 'left' | 'right';
  currentPos: number;
  previousPos: number;
  startX: number;
  startY: number;
  charWidth: number;
  step: AlgorithmStep;
}

/**
 * 渲染算法指针（左指针或右指针）
 */
const PointerDisplay: React.FC<PointerDisplayProps> = ({
  svg,
  pointerType,
  currentPos,
  previousPos,
  startX,
  startY,
  charWidth,
  step
}) => {
  React.useEffect(() => {
    if (!svg) return;
    
    // 设置指针基本属性
    const className = `${pointerType}-pointer`;
    const color = pointerType === 'left' ? '#4caf50' : '#2196f3';
    const label = pointerType === 'left' ? '左' : '右';
    
    // 清除现有指针
    svg.selectAll(`.${className}`).remove();
    
    // 创建指针组
    const pointer = svg.append('g')
      .attr('class', className)
      .attr('transform', `translate(${startX + previousPos * charWidth + charWidth / 2}, ${startY - 20})`)
      .style('opacity', 0);
    
    // 添加指针箭头
    pointer.append('path')
      .attr('d', 'M-8,0 L8,0 L0,15 Z')
      .attr('fill', color);
    
    // 添加指针标签
    pointer.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -5)
      .attr('font-size', '10px')
      .text(label);
    
    // 指针动画效果：淡入 + 移动
    pointer
      .transition()
      .duration(300)
      .style('opacity', 1)
      .transition()
      .duration(400)
      .attr('transform', `translate(${startX + currentPos * charWidth + charWidth / 2}, ${startY - 20})`)
      .on('end', () => {
        // 对应步骤时添加额外的动画效果
        const isRelevantStep = 
          (pointerType === 'left' && step === AlgorithmStep.MOVE_LEFT_POINTER) ||
          (pointerType === 'right' && step === AlgorithmStep.MOVE_RIGHT_POINTER);
          
        if (isRelevantStep) {
          pointer
            .transition()
            .duration(300)
            .attr('transform', `translate(${startX + currentPos * charWidth + charWidth / 2}, ${startY - 25})`)
            .transition()
            .duration(300)
            .attr('transform', `translate(${startX + currentPos * charWidth + charWidth / 2}, ${startY - 20})`);
        }
      });
  }, [svg, pointerType, currentPos, previousPos, startX, startY, charWidth, step]);
  
  return null; // 这是一个功能性组件，不渲染实际DOM
};

export default PointerDisplay; 