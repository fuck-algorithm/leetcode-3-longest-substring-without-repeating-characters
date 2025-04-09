import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { AlgorithmState } from './types';
import StepInfo from './StepInfo';
import CharacterDisplay from './CharacterDisplay';
import PointerDisplay from './PointerDisplay';
import HashSetDisplay from './HashSetDisplay';
import { initializeSvg, calculateCharDimensions } from './drawingUtils';

interface AlgorithmVisualizationProps {
  inputString: string;
  currentState: AlgorithmState;
  width?: number;
  height?: number;
}

/**
 * 算法可视化主组件
 * 负责协调不同可视化元素的展示
 */
const AlgorithmVisualization: React.FC<AlgorithmVisualizationProps> = ({
  inputString,
  currentState,
  width = 800,
  height = 300
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const prevStateRef = useRef<AlgorithmState | null>(null);
  const [animationStatus, setAnimationStatus] = useState<'idle' | 'animating'>('idle');
  const [svgInstance, setSvgInstance] = useState<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);

  // 创建颜色比例尺
  const colors = d3.scaleOrdinal(d3.schemeCategory10);

  // 计算字符显示相关尺寸
  const charWidth = calculateCharDimensions(inputString.length);
  const charHeight = charWidth;
  const startX = (width - inputString.length * charWidth) / 2;
  const startY = 70;

  // 在组件挂载后初始化D3
  useEffect(() => {
    if (svgRef.current) {
      const svg = initializeSvg(svgRef.current, width, height);
      if (svg) setSvgInstance(svg);
    }
  }, [width, height]);

  // 动画状态管理
  useEffect(() => {
    if (svgInstance) {
      setAnimationStatus('animating');
    }
  }, [svgInstance, currentState]);

  // 更新前一个状态的引用
  useEffect(() => {
    prevStateRef.current = currentState;
  }, [currentState]);

  return (
    <div className="algorithm-visualization">
      <svg ref={svgRef}></svg>
      
      {svgInstance && (
        <>
          {/* 步骤信息组件 */}
          <StepInfo 
            svg={svgInstance} 
            step={currentState.step} 
            width={width} 
          />
          
          {/* 字符显示组件 */}
          <CharacterDisplay 
            svg={svgInstance}
            inputString={inputString}
            currentState={currentState}
            startX={startX}
            startY={startY}
            charWidth={charWidth}
            charHeight={charHeight}
          />
          
          {/* 左指针显示组件 */}
          <PointerDisplay 
            svg={svgInstance}
            pointerType="left"
            currentPos={currentState.leftPointer}
            previousPos={prevStateRef.current?.leftPointer ?? 0}
            startX={startX}
            startY={startY}
            charWidth={charWidth}
            step={currentState.step}
          />
          
          {/* 右指针显示组件 */}
          <PointerDisplay 
            svg={svgInstance}
            pointerType="right"
            currentPos={currentState.rightPointer}
            previousPos={prevStateRef.current?.rightPointer ?? 0}
            startX={startX}
            startY={startY}
            charWidth={charWidth}
            step={currentState.step}
          />
          
          {/* 哈希集合显示组件 */}
          <HashSetDisplay 
            svg={svgInstance}
            currentState={currentState}
            width={width}
            height={height}
          />
        </>
      )}
    </div>
  );
};

export default AlgorithmVisualization; 