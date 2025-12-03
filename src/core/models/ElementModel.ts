import type { IElement, ElementType, IElementStyle } from '@/types/elements';

// ID 生成
const generateId = () => 'el-' + Date.now() + Math.random().toString(36).slice(2, 6);

// 入参类型
interface CreateElementPayload {
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  style?: Partial<IElementStyle>; 
  [key: string]: any; // src, filters 等
}

// 元素创建工厂函数
export const createElement = (payload: CreateElementPayload): IElement => {
  const { 
    type, 
    x, 
    y, 
    width = 100, 
    height = 100, 
    style = {},
    ...rest // 捕获 src, filters 等
  } = payload;

  // 默认样式
  const defaultStyle: IElementStyle = {
    fillColor: type === 'image' ? null : '#ffffff',
    lineColor: '#000000',
    lineWidth: type === 'image' ? 0 : 2,
    fontSize: 24,
    fontFamily: 'Arial',
    fontColor: '#000000',
    ...style
  };

  // 组装最终对象
  return {
    id: generateId(),
    type,
    x,
    y,
    width,
    height,
    rotation: 0,
    visible: true,
    locked: false,
    text: type === 'text' ? '双击输入' : '',
    
    style: defaultStyle,
    
    ...rest
  };
};