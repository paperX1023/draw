import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';

export type TransformHandleType =
  | 'tl' | 't'  | 'tr'
  | 'l'  | 'r'
  | 'bl' | 'b'  | 'br'
  | 'rotate';

interface HandleConfig {
  name: TransformHandleType;
  cursor: string;
  x: number; // 0 ~ 1, 相对于包围框宽度的位置
  y: number; // 0 ~ 1, 相对于包围框高度的位置
}

// 手柄配置：8 个缩放点
const HANDLES: HandleConfig[] = [
  { name: 'tl', cursor: 'nwse-resize', x: 0,   y: 0 },
  { name: 't',  cursor: 'ns-resize',   x: 0.5, y: 0 },
  { name: 'tr', cursor: 'nesw-resize', x: 1,   y: 0 },
  { name: 'r',  cursor: 'ew-resize',   x: 1,   y: 0.5 },
  { name: 'br', cursor: 'nwse-resize', x: 1,   y: 1 },
  { name: 'b',  cursor: 'ns-resize',   x: 0.5, y: 1 },
  { name: 'bl', cursor: 'nesw-resize', x: 0,   y: 1 },
  { name: 'l',  cursor: 'ew-resize',   x: 0,   y: 0.5 },
];

export interface TransformTargetLike {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

let transformerContainer: Container | null = null;
let stageReference: Container | null = null;

export const getTransformer = (stage: Container): Container => {
  if (!transformerContainer) {
    transformerContainer = new Container();
    transformerContainer.label = 'TransformerLayer';
    transformerContainer.eventMode = 'static';
    stage.addChild(transformerContainer);
    stageReference = stage;
  }

  // 始终保证 transformer 在最上层
  if (stage.children.length > 0) {
    stage.setChildIndex(transformerContainer, stage.children.length - 1);
  }

  return transformerContainer;
};


function computeSelectionBounds(selected: TransformTargetLike[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of selected) {
    const r = el.rotation ?? 0;
    const cos = Math.cos(r);
    const sin = Math.sin(r);
    const w = el.width;
    const h = el.height;

    // 元素本地坐标的四个角
    const localPoints = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ];

    for (const p of localPoints) {
      // 先绕 (0, 0) 旋转，再平移到 (el.x, el.y)
      const worldX = el.x + p.x * cos - p.y * sin;
      const worldY = el.y + p.x * sin + p.y * cos;

      if (worldX < minX) minX = worldX;
      if (worldY < minY) minY = worldY;
      if (worldX > maxX) maxX = worldX;
      if (worldY > maxY) maxY = worldY;
    }
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const width = Math.max(maxX - minX, 0);
  const height = Math.max(maxY - minY, 0);

  return { x: minX, y: minY, width, height };
}

export const drawTransformer = (
  selectedElements: TransformTargetLike[],
  onHandleDown: ((type: TransformHandleType, e: FederatedPointerEvent) => void) | null
) => {
  if (!stageReference) return;

  const transformer = getTransformer(stageReference);
  transformer.removeChildren();

  if (!selectedElements || selectedElements.length === 0) {
    return;
  }

  const BORDER_COLOR = 0x007AFF;
  const HANDLE_SIZE = 8;
  const ROTATE_OFFSET = 25;

  // - 单选：跟随该元素的 rotation，边框与元素一起倾斜
  // - 多选：计算整个选区的包围框，边框保持轴对齐（rotation = 0）
  let boundsX: number;
  let boundsY: number;
  let boundsWidth: number;
  let boundsHeight: number;
  let rotation: number;

  if (selectedElements.length === 1) {
    const el = selectedElements[0];
    boundsX = el.x;
    boundsY = el.y;
    boundsWidth = el.width;
    boundsHeight = el.height;
    rotation = el.rotation ?? 0;
  } else {
    const bounds = computeSelectionBounds(selectedElements);
    boundsX = bounds.x;
    boundsY = bounds.y;
    boundsWidth = bounds.width;
    boundsHeight = bounds.height;
    rotation = 0; // 多选统一用轴对齐外框，方便操作
  }

  // 同步位置 / 旋转
  transformer.x = boundsX;
  transformer.y = boundsY;
  transformer.rotation = rotation;

  // 绘制外框
  const border = new Graphics();
  border.stroke({ width: 1, color: BORDER_COLOR });
  border.rect(0, 0, boundsWidth, boundsHeight);
  transformer.addChild(border);

  if (!onHandleDown) return;

  // 旋转手柄
  const rotateHandle = new Graphics();

  rotateHandle.moveTo(boundsWidth / 2, 0);
  rotateHandle.lineTo(boundsWidth / 2, -ROTATE_OFFSET);
  rotateHandle.stroke({ width: 1, color: BORDER_COLOR });

  rotateHandle.circle(boundsWidth / 2, -ROTATE_OFFSET, 5);
  rotateHandle.fill({ color: 0xFFFFFF });
  rotateHandle.stroke({ width: 1, color: BORDER_COLOR });

  rotateHandle.eventMode = 'static';
  rotateHandle.cursor = 'grab';
  rotateHandle.on('pointerdown', (e: FederatedPointerEvent) => {
    e.stopPropagation();
    onHandleDown('rotate', e);
  });
  transformer.addChild(rotateHandle);

  // 缩放手柄
  HANDLES.forEach((config) => {
    const handle = new Graphics();
    handle.rect(-HANDLE_SIZE / 2, -HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    handle.fill({ color: 0xFFFFFF });
    handle.stroke({ width: 1, color: BORDER_COLOR });

    handle.x = boundsWidth * config.x;
    handle.y = boundsHeight * config.y;

    handle.eventMode = 'static';
    handle.cursor = config.cursor;

    handle.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      onHandleDown(config.name, e);
    });

    transformer.addChild(handle);
  });
};
