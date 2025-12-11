import type { IElement, ElementType, IElementStyle } from '@/types/elements';

// ID 生成器
const generateId = () => 'el-' + Date.now() + Math.random().toString(36).slice(2, 6);

// 默认滤镜配置
const DEFAULT_FILTERS = { blur: 0, brightness: 1, contrast: 1 };

// 入参类型定义
interface CreateElementPayload {
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  style?: Partial<IElementStyle>; 
  text?: string;
  imageKey?: string;
  _runtimeURL?: string;
  filters?: any;
}

// 元素创建工厂函数
export const createElement = (payload: CreateElementPayload): IElement => {
  const { 
    type, 
    x, 
    y, 
    style = {},
    ...rest // 捕获剩余参数
  } = payload;

  let width = payload.width;
  let height = payload.height;

  if (width === undefined || height === undefined) {
      if (type === 'text') {
          width = 100;
          height = 30;
      } else if (type === 'image') {
          width = 200;
          height = 200;
      } else {
          width = 1;
          height = 1;
      }
  }

  // 默认样式策略
  const defaultStyle: IElementStyle = {
    fillColor: null,
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
    width: width!,
    height: height!,
    rotation: 0,
    visible: true,
    locked: false,
    text: '',
    
    style: defaultStyle,
    
    filters: type === 'image' ? { ...DEFAULT_FILTERS, ...rest.filters } : undefined,
    
    ...rest
  };
};