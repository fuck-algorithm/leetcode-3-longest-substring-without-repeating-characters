import * as d3 from 'd3';

/**
 * 计算字符在网格中的位置
 * @param index 字符索引
 * @param rowLength 每行字符数量
 * @param cellSize 单元格大小
 * @param cellSpacing 单元格间距
 * @param startX 起始X坐标
 * @param startY 起始Y坐标
 * @returns 位置坐标对象
 */
export const getCharPosition = (
  index: number, 
  rowLength: number, 
  cellSize: number, 
  cellSpacing: number, 
  startX: number, 
  startY: number
) => {
  const row = Math.floor(index / rowLength);
  const col = index % rowLength;
  
  return {
    x: startX + col * (cellSize + cellSpacing),
    y: startY + row * (cellSize + cellSpacing)
  };
};

/**
 * 创建闪烁效果
 * @param selection D3选择集
 * @param duration 每次闪烁的持续时间
 * @param times 闪烁次数
 * @param color1 主色
 * @param color2 闪烁色
 */
export const createFlashingEffect = (
  selection: d3.Selection<any, unknown, any, unknown>,
  duration: number,
  times: number,
  color1: string,
  color2: string
) => {
  let t = 0;
  
  const flash = () => {
    if (t >= times * 2) return;
    
    const targetColor = t % 2 === 0 ? color2 : color1;
    
    selection.select('rect')
      .transition()
      .duration(duration / 2)
      .attr('fill', targetColor);
      
    t++;
    setTimeout(flash, duration / 2);
  };
  
  flash();
};

/**
 * 创建下划线效果
 * @param svg SVG选择集
 * @param x 起始X坐标
 * @param y Y坐标
 * @param width 宽度
 * @param color 颜色
 * @param className CSS类名
 */
export const createUnderline = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  x: number,
  y: number,
  width: number,
  color: string,
  className: string
) => {
  svg.selectAll(`.${className}`).remove();
  
  svg.append('line')
    .attr('class', className)
    .attr('x1', x)
    .attr('y1', y)
    .attr('x2', x + width)
    .attr('y2', y)
    .attr('stroke', color)
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '4,2');
};

/**
 * 创建高亮窗口指示器
 * @param svg SVG选择集
 * @param startX 起始X坐标
 * @param startY 起始Y坐标 
 * @param width 宽度
 * @param height 高度
 * @param className CSS类名
 */
export const createWindowIndicator = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  startX: number,
  startY: number,
  width: number,
  height: number,
  className: string
) => {
  svg.selectAll(`.${className}`).remove();
  
  svg.append('rect')
    .attr('class', className)
    .attr('x', startX - 5)
    .attr('y', startY - 5)
    .attr('width', width + 10)
    .attr('height', height + 10)
    .attr('rx', 10)
    .attr('fill', 'none')
    .attr('stroke', '#2196f3')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '8,4')
    .attr('opacity', 0.7);
};

/**
 * 计算合适的字符尺寸
 */
export function calculateCharDimensions(inputLength: number, minSize: number = 20, maxSize: number = 50) {
  // 根据输入字符的长度计算合适的字符尺寸
  // 计算逻辑：尝试让字符占满可用宽度的80%，同时设置上下限
  const availableWidth = window.innerWidth * 0.85; // 使用屏幕宽度的85%作为参考
  const spacing = 10; // 字符间距
  
  // 计算每个字符的理想宽度 = (可用宽度 - 字符间距) / 字符数量
  const idealSize = (availableWidth - (inputLength - 1) * spacing) / inputLength;
  
  // 确保字符尺寸在合理范围内
  return Math.min(maxSize, Math.max(minSize, idealSize));
}

/**
 * 初始化SVG元素
 */
export function initializeSvg(
  svgRef: SVGSVGElement | null, 
  width: number, 
  height: number
): d3.Selection<SVGSVGElement, unknown, null, undefined> | null {
  if (!svgRef) return null;
  
  // 清除之前的内容
  const svg = d3.select(svgRef);
  svg.selectAll('*').remove();
  
  // 设置SVG属性
  return svg
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet') as d3.Selection<SVGSVGElement, unknown, null, undefined>;
} 