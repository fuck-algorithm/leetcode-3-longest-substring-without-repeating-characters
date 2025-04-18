import React, { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { AlgorithmState, AlgorithmStep } from './types';

interface AlgorithmVisualizationProps {
  inputString: string;
  currentState: AlgorithmState;
  width?: number;
  height?: number;
  currentStateIndex?: number;
  totalSteps?: number;
}

const AlgorithmVisualization: React.FC<AlgorithmVisualizationProps> = ({
  inputString,
  currentState,
  width = 800,
  height = 300,
  currentStateIndex = 0,
  totalSteps = 1
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const prevState = useRef<AlgorithmState | null>(null);

  // 计算字符宽度和高度
  const charWidth = Math.min(Math.max(20, (width * 0.8) / Math.max(1, inputString?.length || 1)), 50) * 1.2;
  const charHeight = charWidth;
  const startX = (width - (inputString?.length || 1) * charWidth) / 2;
  const startY = 100;

  // 确保当前窗口和字符集准确反映了输入字符串和指针位置
  const sanitizedState = useMemo(() => {
    if (!currentState) {
      // 返回一个默认安全状态
      return {
        inputString: inputString || '',
        leftPointer: 0,
        rightPointer: 0,
        currentWindow: '',
        charSet: new Set<string>(),
        maxLength: 0,
        maxSubstring: '',
        step: AlgorithmStep.INITIALIZE,
        duplicateFound: false
      };
    }
    
    if (!inputString) {
      // 如果没有输入字符串，保留当前状态但清空窗口和字符集
      return {
        ...currentState,
        currentWindow: '',
        charSet: new Set<string>(),
        leftPointer: 0,
        rightPointer: 0
      };
    }
    
    // 安全地获取指针位置
    const leftPointer = Math.max(0, Math.min(currentState.leftPointer || 0, inputString.length - 1));
    const rightPointer = Math.max(leftPointer, Math.min(currentState.rightPointer || 0, inputString.length - 1));
    
    // 始终从指针和输入字符串重新计算当前窗口
    let currentWindow = '';
    try {
      if (leftPointer <= rightPointer && rightPointer < inputString.length) {
        currentWindow = inputString.slice(leftPointer, rightPointer + 1);
      }
    } catch (e) {
      console.error('Error creating currentWindow:', e);
      currentWindow = '';
    }

    // 与其相信currentState.currentWindow，我们直接从计算的currentWindow获取
    if (currentWindow !== currentState.currentWindow) {
      console.warn('重新计算currentWindow:', 
        `原始: "${currentState.currentWindow || ''}" -> 计算: "${currentWindow}"`);
    }
    
    // 始终从当前窗口重建字符集
    let charSet = new Set<string>();
    try {
      // 只在非初始化步骤时创建字符集
      if (currentState.step !== AlgorithmStep.INITIALIZE) {
        // 从当前窗口字符串构建字符集
        for (const char of currentWindow) {
          charSet.add(char);
        }
      }
    } catch (e) {
      console.error('Error creating charSet from currentWindow:', e);
      charSet = new Set<string>();
    }

    // 检查是否与原始charSet一致
    if (currentState.charSet instanceof Set) {
      const originalCharSetSize = currentState.charSet.size;
      const newCharSetSize = charSet.size;
      if (originalCharSetSize !== newCharSetSize) {
        console.warn('重建charSet与原始不同:', 
          `原始大小: ${originalCharSetSize} -> 新大小: ${newCharSetSize}`);
      }
    }
    
    // 安全地获取最长子串
    let maxSubstring = '';
    if (typeof currentState.maxSubstring === 'string') {
      maxSubstring = currentState.maxSubstring;
    } else if (currentState.maxSubstring) {
      try {
        maxSubstring = String(currentState.maxSubstring);
      } catch {
        maxSubstring = '';
      }
    }
    
    // 确保最大长度有效
    const maxLength = typeof currentState.maxLength === 'number' && !isNaN(currentState.maxLength) 
      ? currentState.maxLength 
      : maxSubstring.length;
    
    // 确保maxLength与maxSubstring长度一致
    if (maxLength !== maxSubstring.length) {
      console.warn('maxLength与maxSubstring长度不一致，调整:', maxLength, '->', maxSubstring.length);
    }
    
    return {
      ...currentState,
      leftPointer,
      rightPointer,
      charSet,
      currentWindow,
      maxSubstring,
      maxLength: maxSubstring.length // 始终使用字符串长度作为maxLength
    };
  }, [currentState, inputString, currentState?.leftPointer, currentState?.rightPointer, currentState?.maxSubstring, currentState?.maxLength]);

  // 主要的渲染逻辑 - 每当输入或状态变化时更新SVG
  useEffect(() => {
    if (!svgRef.current || !inputString) return;
    
    console.log('更新SVG内容...');
    
    // 获取SVG元素
    const svg = d3.select(svgRef.current);
    
    // 设置SVG属性
    svg
      .attr('width', width)
      .attr('height', height)
      .style('background-color', '#f0f0f0')
      .style('border-radius', '8px');

    // 清除旧内容 (只清除主要元素，而不是整个SVG)
    svg.selectAll('.step-info, .char-group, .left-pointer, .right-pointer, .hashset-container, .answer-container').remove();
    
    // 渲染步骤信息
    if (sanitizedState) {
      // 直接调用渲染函数或传递props给组件
      renderStepInfo(svg, {
        step: sanitizedState.step,
        width,
        currentStep: currentStateIndex + 1,
        totalSteps
      });
      
      // 渲染字符显示
      renderCharacterDisplay(svg, {
        inputString,
        currentState: sanitizedState,
        startX,
        startY,
        charWidth,
        charHeight
      });
      
      // 渲染左指针
      renderPointerDisplay(svg, {
        pointerType: 'left',
        currentPos: sanitizedState.leftPointer,
        previousPos: prevState.current?.leftPointer || sanitizedState.leftPointer,
        startX,
        startY,
        charWidth,
        step: sanitizedState.step
      });
      
      // 渲染右指针
      renderPointerDisplay(svg, {
        pointerType: 'right',
        currentPos: sanitizedState.rightPointer,
        previousPos: prevState.current?.rightPointer || sanitizedState.rightPointer,
        startX,
        startY,
        charWidth,
        step: sanitizedState.step
      });
      
      // 渲染哈希集合显示
      renderHashSetDisplay(svg, {
        currentState: sanitizedState,
        width,
        height
      });
      
      // 渲染答案显示
      renderAnswerDisplay(svg, {
        currentState: sanitizedState,
        width,
        height
      });
    }
    
  }, [sanitizedState, inputString, width, height, startX, startY, charWidth, charHeight, currentStateIndex, totalSteps]);

  return (
    <div className="algorithm-visualization">
      <svg 
        ref={svgRef} 
        className="visualization-svg"
        width={width}
        height={height}
      />
    </div>
  );
};

// 渲染辅助函数
function renderStepInfo(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, props: any) {
  const { step, width, currentStep, totalSteps } = props;
  
  // 清除先前的步骤信息
  svg.selectAll('.step-info').remove();
  svg.selectAll('.step-explanation').remove();
  
  // 构建步骤信息文本，包含步骤序号
  const stepText = `当前步骤: ${AlgorithmStep[step]} (${currentStep}/${totalSteps})`;
  
  // 绘制步骤标题
  svg.append('text')
    .attr('class', 'step-info')
    .attr('x', width / 2)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .attr('font-size', '28px')
    .attr('font-weight', 'bold')
    .attr('fill', '#333')
    .text(stepText)
    .style('opacity', 0)
    .transition()
    .duration(300)
    .style('opacity', 1);
}

function renderCharacterDisplay(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, props: any) {
  const { inputString, currentState, startX, startY, charWidth, charHeight } = props;
  
  // 实现字符显示逻辑
  // 安全获取指针位置
  const leftPointer = Math.max(0, Math.min(currentState.leftPointer || 0, inputString.length - 1));
  const rightPointer = Math.max(leftPointer, Math.min(currentState.rightPointer || 0, inputString.length - 1));
  const duplicateFound = currentState.duplicateFound || false;
  const duplicateChar = currentState.duplicateChar || '';
  
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
  
  // 绘制字符
  const charGroup = svg.selectAll('.char-group')
    .data(inputString.split(''))
    .enter()
    .append('g')
    .attr('class', 'char-group')
    .attr('transform', (d, i) => `translate(${startX + i * (charWidth + spacing)}, ${startY})`)
    .style('opacity', 0);
    
  // 添加背景矩形
  charGroup.append('rect')
    .attr('width', charWidth)
    .attr('height', charHeight)
    .attr('rx', 5)
    .attr('ry', 5)
    .attr('fill', (_d, i) => {
      if (i >= leftPointer && i <= rightPointer) {
        return '#e0f7fa';
      }
      return '#f5f5f5';
    })
    .attr('stroke', d => {
      if (duplicateFound && d === duplicateChar) {
        return '#f44336';
      }
      return '#ccc';
    })
    .attr('stroke-width', d => {
      if (duplicateFound && d === duplicateChar) {
        return 3;
      }
      return 1;
    });
    
  // 根据字符大小动态计算字体大小
  const fontSize = Math.max(16, Math.min(charWidth * 0.5, 36));
    
  // 添加字符文本
  charGroup.append('text')
    .attr('x', charWidth / 2)
    .attr('y', charHeight / 2 + fontSize/3)
    .attr('text-anchor', 'middle')
    .attr('font-size', `${fontSize}px`)
    .attr('font-weight', 'bold')
    .attr('font-family', 'monospace')
    .attr('fill', '#333')
    .text(char => String(char));
    
  // 添加淡入动画
  charGroup.transition()
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
}

function renderPointerDisplay(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, props: any) {
  const { pointerType, currentPos, previousPos, startX, startY, charWidth, step } = props;
  
  // 安全获取有效的指针位置
  const validCurrentPos = Math.max(0, currentPos);
  const validPreviousPos = Math.max(0, previousPos);
  
  // 设置指针基本属性
  const className = `${pointerType}-pointer`;
  const color = pointerType === 'left' ? '#4caf50' : '#2196f3';
  const label = pointerType === 'left' ? '左' : '右';
  const spacing = 10; // 字符间距
  const y = pointerType === 'left' ? startY - 40 : startY - 20;
  
  // 移除先前的指针元素
  svg.selectAll(`.${className}`).remove();
  
  // 计算指针位置，考虑字符间距
  const getPointerX = (pos: number) => startX + pos * (charWidth + spacing) + charWidth / 2;
  
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
}

function renderHashSetDisplay(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, props: any) {
  const { currentState, width, height } = props;
  
  // 组件ID用于调试和确保唯一性
  const componentId = `hashset-${Math.random().toString(36).substring(2, 11)}`;
  const containerId = `hashset-container-${componentId}`;
  const titleId = `hashset-title-${componentId}`;
  const cellClass = `hashset-cell-${componentId}`;
  
  // 清理所有与哈希集合相关的元素，包括可能存在的旧版本组件
  // 使用更彻底的选择器确保清理完全
  svg.selectAll('.hashset-container, .hashset-cell, .hashset-title, .hashset-empty, [id^="hashset-"]').remove();
  
  // 输入字符串和指针位置
  const inputString = currentState.inputString || '';
  const leftPointer = currentState.leftPointer || 0;
  const rightPointer = currentState.rightPointer || 0;
  
  // 重建哈希集合 - 完全重写此部分逻辑
  let hashSetData: string[] = [];
  
  // 检查是否是初始状态，如果是则不需要显示任何字符
  if (currentState.step === AlgorithmStep.INITIALIZE) {
    // 初始状态，哈希集合为空
    hashSetData = [];
  } else if (currentState.charSet && currentState.charSet instanceof Set) {
    // 如果charSet是有效的Set，直接使用
    hashSetData = Array.from(currentState.charSet).map(char => String(char));
    console.log('使用状态中的charSet构建哈希集合:', hashSetData);
  } else if (currentState.currentWindow && typeof currentState.currentWindow === 'string') {
    // 使用currentWindow构建集合
    const windowChars = currentState.currentWindow.split('');
    hashSetData = [...new Set(windowChars)] as string[];
    console.log('使用currentWindow构建哈希集合:', currentState.currentWindow, '->', hashSetData);
  } else {
    // 回退方法：从指针位置重建
    const windowChars: string[] = [];
    if (leftPointer <= rightPointer && rightPointer < inputString.length) {
      for (let i = leftPointer; i <= rightPointer; i++) {
        windowChars.push(inputString[i]);
      }
    }
    hashSetData = [...new Set(windowChars)];
    console.log('使用指针位置构建哈希集合:', leftPointer, rightPointer, '->', hashSetData);
  }
  
  console.log('哈希集合最终数据:', {
    currentWindow: currentState.currentWindow,
    charSet: currentState.charSet instanceof Set ? Array.from(currentState.charSet) : [],
    leftPointer,
    rightPointer,
    hashSetData
  });
  
  // 设置网格布局
  const cellSize = 40;
  const cellSpacing = 5;
  const leftAreaWidth = width * 0.45;
  const setY = height - 110;
  const setX = width * 0.05;
  
  // 计算每行最大字符数
  const maxCharsPerRow = Math.max(1, Math.floor((leftAreaWidth - setX) / (cellSize + cellSpacing)));
  
  // 创建容器
  const container = svg.append('g')
    .attr('class', 'hashset-container')
    .attr('id', containerId);
  
  // 添加标题
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
      .attr('id', `hashset-empty-${componentId}`)
      .attr('x', setX + leftAreaWidth / 2)
      .attr('y', setY + 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#666')
      .text('(空)');
    return;
  }
  
  // 创建字符元素
  hashSetData.forEach((char: string, i: number) => {
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
      .text(String(char));
    
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
    }
  });
}

function renderAnswerDisplay(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, props: any) {
  const { currentState, width, height } = props;
  
  // 组件ID用于调试和确保唯一性
  const componentId = `answer-${Math.random().toString(36).substring(2, 11)}`;
  const containerId = `answer-container-${componentId}`;
  const titleId = `answer-title-${componentId}`;
  const cellClass = `answer-cell-${componentId}`;
  
  // 确保删除所有相关元素，包括可能存在的旧版本组件
  svg.selectAll('.answer-container, .answer-char, .answer-title, .answer-empty, [id^="answer-"], [class^="answer-"]').remove();
  
  // 如果是初始状态，不显示任何结果
  if (currentState.step === AlgorithmStep.INITIALIZE && currentState.maxLength === 0) {
    // 创建容器
    const container = svg.append('g')
      .attr('class', 'answer-container')
      .attr('id', containerId);
      
    // 添加标题
    container.append('text')
      .attr('class', 'answer-title')
      .attr('id', titleId)
      .attr('x', width * 0.75)
      .attr('y', height - 130)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('最长无重复子串');
    
    container.append('text')
      .attr('class', 'answer-empty')
      .attr('id', `answer-empty-${componentId}`)
      .attr('x', width * 0.75)
      .attr('y', height - 100)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#666')
      .text('算法尚未启动');
    
    return;
  }
  
  // 确保获取有效的最长子串和长度 - 重写此逻辑
  let maxSubstring = '';
  let maxLength = 0;
  
  if (typeof currentState.maxSubstring === 'string' && currentState.maxSubstring) {
    maxSubstring = currentState.maxSubstring;
    maxLength = currentState.maxLength || maxSubstring.length;
  } else if (currentState.maxSubstring) {
    try {
      maxSubstring = String(currentState.maxSubstring);
      maxLength = currentState.maxLength || maxSubstring.length;
    } catch (e) {
      console.error('无法转换maxSubstring为字符串:', e);
      maxSubstring = '';
      maxLength = 0;
    }
  } else {
    // 如果没有最长子串，使用第一个字符作为默认值（针对全重复的情况）
    if (currentState.inputString && currentState.inputString.length > 0) {
      maxSubstring = currentState.inputString[0];
      maxLength = 1;
    }
  }
  
  // 确保maxLength与maxSubstring长度一致
  if (maxLength !== maxSubstring.length) {
    console.warn('maxLength与maxSubstring长度不一致，强制同步:', maxLength, '->', maxSubstring.length);
    maxLength = maxSubstring.length;
  }
  
  console.log('答案数据:', { 
    inputString: currentState.inputString,
    maxSubstring, 
    maxLength, 
    type: typeof maxSubstring
  });
  
  // 检查是否有非ASCII字符或无效字符
  const validSubstring = maxSubstring.replace(/[^\x20-\x7E]/g, '');
  if (validSubstring !== maxSubstring) {
    console.warn('发现无效字符，已过滤:', maxSubstring, '->', validSubstring);
    maxSubstring = validSubstring;
  }
  
  // 将最长子串拆分为字符数组，确保每个字符都是有效的可显示字符
  const answerData = maxSubstring.split('');
  
  // 验证数据
  console.log('处理后的答案数据:', answerData);
  
  // 设置网格布局
  const cellSize = 40;
  const cellSpacing = 5;
  const answerY = height - 110;
  const answerX = width * 0.55;
  const rightAreaWidth = width * 0.4;
  
  // 计算每行最大显示字符数
  const maxCharsPerRow = Math.max(1, Math.floor(rightAreaWidth / (cellSize + cellSpacing)));
  
  // 创建容器
  const container = svg.append('g')
    .attr('class', 'answer-container')
    .attr('id', containerId);
    
  // 添加标题
  container.append('text')
    .attr('class', 'answer-title')
    .attr('id', titleId)
    .attr('x', answerX + rightAreaWidth / 2)
    .attr('y', answerY - 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')
    .attr('fill', '#333')
    .text('最长无重复子串 (长度: ' + maxLength + ')');

  // 如果没有最长子串，显示提示信息
  if (answerData.length === 0) {
    container.append('text')
      .attr('class', 'answer-empty')
      .attr('id', `answer-empty-${componentId}`)
      .attr('x', answerX + rightAreaWidth / 2)
      .attr('y', answerY + 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#666')
      .text('暂无结果');
    return;
  }

  // 创建字符元素
  answerData.forEach((char: string, i: number) => {
    const cellId = `${cellClass}-${i}`;
    const row = Math.floor(i / maxCharsPerRow);
    const col = i % maxCharsPerRow;
    const x = answerX + col * (cellSize + cellSpacing);
    const y = answerY + row * (cellSize + cellSpacing);
    
    // 创建组
    const group = container.append('g')
      .attr('class', 'answer-char')
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
      .attr('fill', '#e8f5e9')
      .attr('stroke', '#81c784')
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
      .attr('fill', '#2e7d32')
      .text(String(char));
    
    // 添加淡入动画
    group.transition()
      .duration(300)
      .style('opacity', 1);
  });
  
  // 动画效果 - 更新结果步骤时
  if (currentState.step === 4) { // UPDATE_RESULT步骤
    container.selectAll('.answer-char rect')
      .attr('fill', '#c8e6c9')
      .transition()
      .duration(500)
      .attr('fill', '#e8f5e9');
  }
}

export default AlgorithmVisualization; 