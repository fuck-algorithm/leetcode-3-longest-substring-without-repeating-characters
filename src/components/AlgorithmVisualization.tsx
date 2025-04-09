import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// 算法步骤类型
export enum AlgorithmStep {
  INITIALIZE,
  MOVE_RIGHT_POINTER,
  DETECT_DUPLICATE,
  MOVE_LEFT_POINTER,
  UPDATE_RESULT
}

// 算法状态接口
export interface AlgorithmState {
  inputString: string;
  leftPointer: number;
  rightPointer: number;
  currentWindow: string;
  charSet: Set<string>;
  maxLength: number;
  maxSubstring: string;
  step: AlgorithmStep;
  duplicateFound: boolean;
  duplicateChar?: string;
}

interface AlgorithmVisualizationProps {
  inputString: string;
  currentState: AlgorithmState;
  width?: number;
  height?: number;
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

const AlgorithmVisualization: React.FC<AlgorithmVisualizationProps> = ({
  inputString,
  currentState,
  width = 800,
  height = 300
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const prevStateRef = useRef<AlgorithmState | null>(null);
  const [animationStatus, setAnimationStatus] = useState<'idle' | 'animating'>('idle');

  // 创建颜色比例尺
  const colors = d3.scaleOrdinal(d3.schemeCategory10);

  // 在组件挂载后初始化D3
  useEffect(() => {
    if (svgRef.current) {
      // 清除之前的内容
      d3.select(svgRef.current).selectAll('*').remove();
      
      // 创建SVG元素，使用父容器尺寸
      const svg = d3.select(svgRef.current)
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    }
  }, [width, height]);

  // 当算法状态变化时更新可视化
  useEffect(() => {
    if (!svgRef.current) return;
    
    // 设置正在执行动画
    setAnimationStatus('animating');
    
    const svg = d3.select(svgRef.current);
    // 调整字符显示的大小和间距
    const charWidth = Math.min(35, Math.max(20, 600 / Math.max(inputString.length, 1)));
    const charHeight = charWidth;
    const startX = (width - inputString.length * charWidth) / 2;
    const startY = 70; // 将字符串显示区域上移

    // 绘制步骤描述和解释
    svg.selectAll('.step-info').remove();
    svg.append('text')
      .attr('class', 'step-info')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text(`当前步骤: ${stepDescriptions[currentState.step]}`)
      .style('opacity', 0)
      .transition()
      .duration(300)
      .style('opacity', 1);
    
    svg.selectAll('.step-explanation').remove();
    svg.append('text')
      .attr('class', 'step-explanation')
      .attr('x', width / 2)
      .attr('y', 45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#555')
      .text(stepExplanations[currentState.step])
      .style('opacity', 0)
      .transition()
      .duration(300)
      .delay(150)
      .style('opacity', 1);

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

    // 绘制字符串
    const charGroup = svg.selectAll('.char-group')
      .data(inputString.split(''))
      .join(
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
        update => {
          // 更新字符背景颜色
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
      .delay((d, i) => i * 50)
      .duration(300)
      .style('opacity', 1);

    // 绘制左指针，带动画
    const leftPointerOld = prevStateRef.current?.leftPointer ?? 0;
    svg.selectAll('.left-pointer').remove();
    const leftPointer = svg.append('g')
      .attr('class', 'left-pointer')
      .attr('transform', `translate(${startX + leftPointerOld * charWidth + charWidth / 2}, ${startY - 20})`)
      .style('opacity', 0);
    
    leftPointer.append('path')
      .attr('d', 'M-8,0 L8,0 L0,15 Z')
      .attr('fill', '#4caf50');
    
    leftPointer.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -5)
      .attr('font-size', '10px')
      .text('左');
    
    // 左指针移动动画
    leftPointer
      .transition()
      .duration(300)
      .style('opacity', 1)
      .transition()
      .duration(400)
      .attr('transform', `translate(${startX + currentState.leftPointer * charWidth + charWidth / 2}, ${startY - 20})`)
      .on('end', () => {
        // 如果是左指针移动步骤，则添加突出动画
        if (currentState.step === AlgorithmStep.MOVE_LEFT_POINTER) {
          leftPointer
            .transition()
            .duration(300)
            .attr('transform', `translate(${startX + currentState.leftPointer * charWidth + charWidth / 2}, ${startY - 25})`)
            .transition()
            .duration(300)
            .attr('transform', `translate(${startX + currentState.leftPointer * charWidth + charWidth / 2}, ${startY - 20})`);
        }
      });

    // 绘制右指针，带动画
    const rightPointerOld = prevStateRef.current?.rightPointer ?? 0;
    svg.selectAll('.right-pointer').remove();
    const rightPointer = svg.append('g')
      .attr('class', 'right-pointer')
      .attr('transform', `translate(${startX + rightPointerOld * charWidth + charWidth / 2}, ${startY - 20})`)
      .style('opacity', 0);
    
    rightPointer.append('path')
      .attr('d', 'M-8,0 L8,0 L0,15 Z')
      .attr('fill', '#2196f3');
    
    rightPointer.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -5)
      .attr('font-size', '10px')
      .text('右');
    
    // 右指针移动动画
    rightPointer
      .transition()
      .duration(300)
      .style('opacity', 1)
      .transition()
      .duration(400)
      .attr('transform', `translate(${startX + currentState.rightPointer * charWidth + charWidth / 2}, ${startY - 20})`)
      .on('end', () => {
        // 如果是右指针移动步骤，则添加突出动画
        if (currentState.step === AlgorithmStep.MOVE_RIGHT_POINTER) {
          rightPointer
            .transition()
            .duration(300)
            .attr('transform', `translate(${startX + currentState.rightPointer * charWidth + charWidth / 2}, ${startY - 25})`)
            .transition()
            .duration(300)
            .attr('transform', `translate(${startX + currentState.rightPointer * charWidth + charWidth / 2}, ${startY - 20})`);
        }
      });

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

    // 绘制当前窗口信息，带淡入效果
    svg.selectAll('.window-info').remove();
    svg.append('text')
      .attr('class', 'window-info')
      .attr('x', width / 2)
      .attr('y', startY + charHeight + 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text(`当前窗口: "${currentState.currentWindow}", 长度: ${currentState.currentWindow.length}`)
      .style('opacity', 0)
      .transition()
      .delay(200)
      .duration(400)
      .style('opacity', 1);

    // 绘制最长子串信息，带强调效果
    svg.selectAll('.max-info').remove();
    const maxInfo = svg.append('text')
      .attr('class', 'max-info')
      .attr('x', width / 2)
      .attr('y', startY + charHeight + 45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#d32f2f')
      .text(`最长无重复子串: "${currentState.maxSubstring}", 长度: ${currentState.maxLength}`)
      .style('opacity', 0)
      .transition()
      .delay(300)
      .duration(400)
      .style('opacity', 1);
    
    // 如果是更新结果的步骤，添加强调动画
    if (currentState.step === AlgorithmStep.UPDATE_RESULT) {
      maxInfo
        .transition()
        .delay(700)
        .duration(300)
        .attr('fill', '#4caf50')
        .transition()
        .duration(300)
        .attr('fill', '#d32f2f');
    }

    // 绘制哈希集合容器
    const setY = startY + charHeight + 70;
    const setWidth = Math.min(500, Math.max(200, inputString.length * 25));
    const setX = (width - setWidth) / 2;
    const setHeight = 50;

    svg.selectAll('.set-container').remove();
    const setContainer = svg.append('g')
      .attr('class', 'set-container');
    
    setContainer.append('rect')
      .attr('class', 'set-rect')
      .attr('x', setX)
      .attr('y', setY)
      .attr('width', setWidth)
      .attr('height', setHeight)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', '#f9f9f9')
      .attr('stroke', '#ddd')
      .style('opacity', 0)
      .transition()
      .delay(100)
      .duration(400)
      .style('opacity', 1);

    setContainer.append('text')
      .attr('class', 'set-title')
      .attr('x', setX + 10)
      .attr('y', setY - 8)
      .attr('font-size', '12px')
      .attr('fill', '#666')
      .text('哈希集合:')
      .style('opacity', 0)
      .transition()
      .delay(200)
      .duration(400)
      .style('opacity', 1);

    // 获取先前和当前的哈希集合
    const prevSet = prevStateRef.current?.charSet || new Set<string>();
    const currentSet = currentState.charSet;
    
    // 确定哪些字符被添加，哪些被移除
    const addedChars = Array.from(currentSet).filter(char => !prevSet.has(char));
    const removedChars = Array.from(prevSet).filter(char => !currentSet.has(char));
    const remainingChars = Array.from(currentSet).filter(char => prevSet.has(char));
    
    // 计算字符在集合中的位置
    const getCharPosition = (char: string, index: number, array: string[]) => {
      const itemWidth = setWidth / Math.max(10, array.length);
      return {
        x: setX + index * itemWidth + itemWidth / 2,
        y: setY + setHeight / 2
      };
    };
    
    // 绘制哈希集合中的字符
    svg.selectAll('.set-char').remove();
    
    // 添加保留的字符
    remainingChars.forEach((char, i) => {
      const pos = getCharPosition(char, i, Array.from(currentSet));
      const charGroup = svg.append('g')
        .attr('class', 'set-char')
        .attr('transform', `translate(${pos.x}, ${pos.y})`);
      
      charGroup.append('circle')
        .attr('r', 12)
        .attr('fill', colors(char));
      
      charGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .attr('fill', 'white')
        .text(char);
    });
    
    // 添加新字符，带飞入动画
    addedChars.forEach((char, i) => {
      const sourceIndex = inputString.lastIndexOf(char);
      const sourceX = startX + sourceIndex * charWidth + charWidth / 2;
      const sourceY = startY;
      
      const targetPos = getCharPosition(char, remainingChars.length + i, Array.from(currentSet));
      
      const charGroup = svg.append('g')
        .attr('class', 'set-char added-char')
        .attr('transform', `translate(${sourceX}, ${sourceY})`)
        .style('opacity', 0);
      
      charGroup.append('circle')
        .attr('r', 0)
        .attr('fill', colors(char));
      
      charGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .attr('fill', 'white')
        .text(char);
      
      // 飞入动画
      charGroup.transition()
        .delay(300 + i * 100)
        .duration(100)
        .style('opacity', 1)
        .transition()
        .duration(600)
        .attr('transform', `translate(${targetPos.x}, ${targetPos.y})`)
        .select('circle')
        .attr('r', 12);
    });
    
    // 移除的字符，带飞出动画
    if (removedChars.length > 0 && currentState.step === AlgorithmStep.MOVE_LEFT_POINTER) {
      removedChars.forEach((char, i) => {
        const sourcePos = getCharPosition(char, prevStateRef.current?.charSet.size || 0, Array.from(prevSet));
        
        const targetIndex = currentState.leftPointer - 1; // 假设移除的字符在左指针移动前的位置
        const targetX = startX + targetIndex * charWidth + charWidth / 2;
        const targetY = startY;
        
        const charGroup = svg.append('g')
          .attr('class', 'set-char removed-char')
          .attr('transform', `translate(${sourcePos.x}, ${sourcePos.y})`);
        
        charGroup.append('circle')
          .attr('r', 12)
          .attr('fill', colors(char));
        
        charGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('font-size', '12px')
          .attr('fill', 'white')
          .text(char);
        
        // 飞出动画
        charGroup.transition()
          .delay(200 + i * 100)
          .duration(600)
          .attr('transform', `translate(${targetX}, ${targetY})`)
          .style('opacity', 0)
          .select('circle')
          .attr('r', 0);
      });
    }

    // 添加重复字符闪烁效果
    if (currentState.duplicateFound && currentState.duplicateChar) {
      // 查找所有重复字符的位置
      const duplicateRects = svg.selectAll('.char-group rect')
        .filter((d: any, i: number) => inputString[i] === currentState.duplicateChar);
      
      let flashCount = 0;
      const flashInterval = setInterval(() => {
        duplicateRects
          .transition()
          .duration(150)
          .attr('stroke', flashCount % 2 === 0 ? '#f44336' : '#ff9800')
          .attr('stroke-width', flashCount % 2 === 0 ? 3 : 4)
          .attr('fill', flashCount % 2 === 0 ? '#ffebee' : '#fff3e0');
        
        flashCount++;
        if (flashCount >= 6) { // 闪烁3次
          clearInterval(flashInterval);
          duplicateRects
            .transition()
            .duration(150)
            .attr('stroke', '#f44336')
            .attr('stroke-width', 3)
            .attr('fill', '#e0f7fa');
          
          // 设置动画完成
          setAnimationStatus('idle');
        }
      }, 200);
      
      // 清除闪烁定时器
      return () => clearInterval(flashInterval);
    } else {
      // 如果没有闪烁动画，设置300ms后动画完成
      const animationTimer = setTimeout(() => {
        setAnimationStatus('idle');
      }, 800);
      
      return () => clearTimeout(animationTimer);
    }
  }, [inputString, currentState, width, height, colors]);

  // 更新前一个状态的引用
  useEffect(() => {
    prevStateRef.current = currentState;
  }, [currentState]);

  return (
    <div className="algorithm-visualization">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default AlgorithmVisualization; 