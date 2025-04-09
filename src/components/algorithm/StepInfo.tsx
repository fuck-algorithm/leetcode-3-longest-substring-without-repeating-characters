import React from 'react';
import * as d3 from 'd3';
import { AlgorithmStep, stepDescriptions, stepExplanations } from './types';

interface StepInfoProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
  step: AlgorithmStep;
  width: number;
}

/**
 * 渲染算法步骤信息
 */
const StepInfo: React.FC<StepInfoProps> = ({ svg, step, width }) => {
  React.useEffect(() => {
    if (!svg) return;
    
    // 清除先前的步骤信息
    svg.selectAll('.step-info').remove();
    svg.selectAll('.step-explanation').remove();
    
    // 绘制步骤标题
    svg.append('text')
      .attr('class', 'step-info')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text(`当前步骤: ${stepDescriptions[step]}`)
      .style('opacity', 0)
      .transition()
      .duration(300)
      .style('opacity', 1);
    
    // 绘制步骤解释
    svg.append('text')
      .attr('class', 'step-explanation')
      .attr('x', width / 2)
      .attr('y', 45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#555')
      .text(stepExplanations[step])
      .style('opacity', 0)
      .transition()
      .duration(300)
      .delay(150)
      .style('opacity', 1);
  }, [svg, step, width]);
  
  return null; // 这是一个功能性组件，不渲染实际DOM
};

export default StepInfo; 