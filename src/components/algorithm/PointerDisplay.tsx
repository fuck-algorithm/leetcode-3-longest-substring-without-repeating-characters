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
    
    // 安全获取有效的指针位置
    const validCurrentPos = Math.max(0, currentPos);
    const validPreviousPos = Math.max(0, previousPos);
    
    // 移除先前的指针元素
    svg.selectAll(`.${pointerType}-pointer`).remove();
    
    // 设置指针基本属性
    const className = `${pointerType}-pointer`;
    const color = pointerType === 'left' ? '#4caf50' : '#2196f3';
    const label = pointerType === 'left' ? '左' : '右';
    const spacing = 10; // 字符间距
    
    // 计算指针位置，考虑字符间距
    const getPointerX = (pos: number) => startX + pos * (charWidth + spacing) + charWidth / 2;
    const y = pointerType === 'left' ? startY - 40 : startY - 20;
    
    // 创建指针组
    const pointer = svg.append('g')
      .attr('class', className)
      .attr('transform', `translate(${getPointerX(validPreviousPos)}, ${y})`)
      .style('opacity', 0);
    
    // 添加指针箭头
    pointer.append('path')
      .attr('d', 'M-8,0 L8,0 L0,15 Z')
      .attr('fill', color);
    
    // 添加指针标签
    pointer.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -5)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(label);
    
    // 指针动画效果：淡入 + 移动
    pointer
      .transition()
      .duration(300)
      .style('opacity', 1)
      .transition()
      .duration(400)
      .attr('transform', `translate(${getPointerX(validCurrentPos)}, ${y})`)
      .on('end', () => {
        // 对应步骤时添加额外的动画效果
        const isRelevantStep = 
          (pointerType === 'left' && step === AlgorithmStep.MOVE_LEFT_POINTER) ||
          (pointerType === 'right' && step === AlgorithmStep.MOVE_RIGHT_POINTER);
          
        if (isRelevantStep) {
          pointer
            .transition()
            .duration(300)
            .attr('transform', `translate(${getPointerX(validCurrentPos)}, ${y - 5})`)
            .transition()
            .duration(300)
            .attr('transform', `translate(${getPointerX(validCurrentPos)}, ${y})`);
        }
      });
  }, [svg, pointerType, currentPos, previousPos, startX, startY, charWidth, step]);
  
  return null; // 这是一个功能性组件，不渲染实际DOM
};

export default PointerDisplay; 