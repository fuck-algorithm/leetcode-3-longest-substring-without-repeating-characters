import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { AlgorithmState } from './types';
import StepInfo from './StepInfo';
import CharacterDisplay from './CharacterDisplay';
import PointerDisplay from './PointerDisplay';
import HashSetDisplay from './HashSetDisplay';
import AnswerDisplay from './AnswerDisplay';
import { initializeSvg, calculateCharDimensions } from './drawingUtils';

// 算法步骤类型
export enum AlgorithmStep {
  INITIALIZE,
  MOVE_RIGHT_POINTER,
  DETECT_DUPLICATE,
  MOVE_LEFT_POINTER,
  UPDATE_RESULT
}

// 算法步骤详细描述
const stepDescriptions = {
  [AlgorithmStep.INITIALIZE]: '初始化窗口',
  [AlgorithmStep.MOVE_RIGHT_POINTER]: '右指针向右移动',
  [AlgorithmStep.DETECT_DUPLICATE]: '检测到重复字符',
  [AlgorithmStep.MOVE_LEFT_POINTER]: '左指针向右移动',
  [AlgorithmStep.UPDATE_RESULT]: '更新最长子串'
};

// 算法详细解释
const stepExplanations = {
  [AlgorithmStep.INITIALIZE]: '初始化窗口，设置左右指针指向字符串起始位置。窗口初始只包含第一个字符。',
  [AlgorithmStep.MOVE_RIGHT_POINTER]: '右指针向右移动一位，扩展当前窗口，并检查是否引入重复字符。',
  [AlgorithmStep.DETECT_DUPLICATE]: '检测到重复字符！窗口中已存在该字符，需要移动左指针调整窗口。',
  [AlgorithmStep.MOVE_LEFT_POINTER]: '左指针向右移动至重复字符后一位，保持窗口内无重复字符。',
  [AlgorithmStep.UPDATE_RESULT]: '当前窗口长度超过先前记录的最大长度，更新最长无重复子串记录。'
};

interface AlgorithmVisualizationProps {
  inputString: string;
  currentState: AlgorithmState;
  width?: number;
  height?: number;
  currentStateIndex?: number;  // 添加当前步骤索引
  totalSteps?: number;         // 添加总步骤数
}

/**
 * 算法可视化主组件
 * 负责协调不同可视化元素的展示
 */
const AlgorithmVisualization: React.FC<AlgorithmVisualizationProps> = ({
  inputString,
  currentState,
  width = 800,
  height = 400,  // 设置一个合理的默认最小高度
  currentStateIndex = 0,  // 默认为0
  totalSteps = 0          // 默认为0
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const prevStateRef = useRef<AlgorithmState | null>(null);
  const [animationStatus, setAnimationStatus] = useState<'idle' | 'animating'>('idle');
  const [svgInstance, setSvgInstance] = useState<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  
  // 创建一个清理过的状态对象，确保charSet只包含currentWindow中的字符
  const sanitizedState = React.useMemo(() => {
    if (!currentState) {
      return currentState;
    }
    
    // 直接从inputString和指针位置计算当前窗口字符集，完全忽略charSet属性
    const validCharSet = new Set<string>();
    const inputString = currentState.inputString || '';
    const leftPointer = currentState.leftPointer || 0;
    const rightPointer = currentState.rightPointer || 0;
    
    // 从指针位置重新计算窗口内容
    if (leftPointer <= rightPointer && rightPointer < inputString.length) {
      for (let i = leftPointer; i <= rightPointer; i++) {
        validCharSet.add(inputString[i]);
      }
    }
    
    // 创建重新确定的窗口字符串
    const recalculatedWindow = inputString.substring(leftPointer, rightPointer + 1);
    
    console.log(`AlgorithmVisualization - 原始窗口: "${currentState.currentWindow}"`);
    console.log(`AlgorithmVisualization - 重新计算的窗口: "${recalculatedWindow}"`);
    console.log(`AlgorithmVisualization - 字符集大小: ${validCharSet.size}`);
    
    // 返回一个新的状态对象，替换charSet和currentWindow
    return {
      ...currentState,
      charSet: validCharSet,
      currentWindow: recalculatedWindow
    };
  }, [currentState]);

  // 计算字符显示相关尺寸
  const charWidth = calculateCharDimensions(inputString.length);
  const charHeight = charWidth;
  const startX = Math.max(10, (width - (inputString.length * charWidth + (inputString.length - 1) * 10)) / 2);
  const startY = Math.round(height * 0.25);

  // 在组件挂载后初始化D3
  useEffect(() => {
    if (svgRef.current) {
      // 先清除所有内容
      d3.select(svgRef.current).selectAll('*').remove();
      
      // 重新初始化
      const svg = initializeSvg(svgRef.current, width, height);
      if (svg) setSvgInstance(svg);
    }
  }, [width, height, inputString]); // 添加inputString作为依赖，这样当输入改变时会重新初始化

  // 更新前一个状态的引用
  useEffect(() => {
    prevStateRef.current = sanitizedState;
  }, [sanitizedState]);

  return (
    <div className="algorithm-visualization">
      <svg ref={svgRef}></svg>
      
      {svgInstance && (
        <>
          {/* 步骤信息组件 */}
          <StepInfo 
            svg={svgInstance} 
            step={sanitizedState.step} 
            width={width}
            currentStep={currentStateIndex + 1}
            totalSteps={totalSteps}
          />
          
          {/* 字符显示组件 */}
          <CharacterDisplay 
            svg={svgInstance}
            inputString={inputString}
            currentState={sanitizedState}
            startX={startX}
            startY={startY}
            charWidth={charWidth}
            charHeight={charHeight}
          />
          
          {/* 左指针显示组件 */}
          <PointerDisplay 
            svg={svgInstance}
            pointerType="left"
            currentPos={sanitizedState.leftPointer}
            previousPos={prevStateRef.current?.leftPointer ?? 0}
            startX={startX}
            startY={startY}
            charWidth={charWidth}
            step={sanitizedState.step}
          />
          
          {/* 右指针显示组件 */}
          <PointerDisplay 
            svg={svgInstance}
            pointerType="right"
            currentPos={sanitizedState.rightPointer}
            previousPos={prevStateRef.current?.rightPointer ?? 0}
            startX={startX}
            startY={startY}
            charWidth={charWidth}
            step={sanitizedState.step}
          />
          
          {/* 哈希集合显示组件 */}
          <HashSetDisplay 
            svg={svgInstance}
            currentState={sanitizedState}
            width={width}
            height={height}
          />
          
          {/* 最长子串答案显示组件 */}
          <AnswerDisplay 
            svg={svgInstance}
            currentState={sanitizedState}
            width={width}
            height={height}
          />
        </>
      )}
    </div>
  );
};

export default AlgorithmVisualization; 