import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';

export type TransformHandleType =
  | 'tl' | 't' | 'tr'
  | 'l'  | 'r'
  | 'bl' | 'b' | 'br'
  | 'rotate';

export interface TransformTargetLike {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

interface HandleConfig {
  name: TransformHandleType;
  cursor: string;
  x: number; // 0~1，相对宽度
  y: number; // 0~1，相对高度
}

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

  // 始终保证在最上层
  if (stage.children.length > 0) {
    stage.setChildIndex(transformerContainer, stage.children.length - 1);
  }

  return transformerContainer;
};

function getMergedBounds(targets: TransformTargetLike[]) {
  if (targets.length === 1) {
    const t = targets[0];
    return {
      x: t.x,
      y: t.y,
      width: t.width,
      height: t.height,
      rotation: t.rotation || 0,
    };
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  targets.forEach((t) => {
    minX = Math.min(minX, t.x);
    minY = Math.min(minY, t.y);
    maxX = Math.max(maxX, t.x + t.width);
    maxY = Math.max(maxY, t.y + t.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    rotation: 0,
  };
}

// 绘制虚线边框
function drawDashedRect(g: Graphics, width: number, height: number) {
  const BORDER_COLOR = 0x007aff;
  const DASH = 8;
  const GAP = 4;

  g.clear();
  g.stroke({ width: 1, color: BORDER_COLOR });

  // top
  for (let x = 0; x < width; x += DASH + GAP) {
    g.moveTo(x, 0);
    g.lineTo(Math.min(x + DASH, width), 0);
  }
  // bottom
  for (let x = 0; x < width; x += DASH + GAP) {
    g.moveTo(x, height);
    g.lineTo(Math.min(x + DASH, width), height);
  }
  // left
  for (let y = 0; y < height; y += DASH + GAP) {
    g.moveTo(0, y);
    g.lineTo(0, Math.min(y + DASH, height));
  }
  // right
  for (let y = 0; y < height; y += DASH + GAP) {
    g.moveTo(width, y);
    g.lineTo(width, Math.min(y + DASH, height));
  }
}

// 绘制 transformer（支持多选）
export const drawTransformer = (
  targets: TransformTargetLike[],
  onHandleDown: ((type: TransformHandleType, e: FederatedPointerEvent) => void) | null
) => {
  if (!stageReference) return;
  const transformer = getTransformer(stageReference);
  transformer.removeChildren();

  if (!targets || targets.length === 0) {
    return;
  }

  const bounds = getMergedBounds(targets);

  transformer.x = bounds.x;
  transformer.y = bounds.y;
  transformer.rotation = bounds.rotation || 0;

  const w = bounds.width;
  const h = bounds.height;

  // 虚线边框
  const border = new Graphics();
  drawDashedRect(border, w, h);
  transformer.addChild(border);

  if (!onHandleDown) return;

  // 旋转手柄
  const BORDER_COLOR = 0x007aff;
  const ROTATE_OFFSET = 25;
  const rotateHandle = new Graphics();

  rotateHandle.moveTo(w / 2, 0);
  rotateHandle.lineTo(w / 2, -ROTATE_OFFSET);
  rotateHandle.stroke({ width: 1, color: BORDER_COLOR });

  rotateHandle.circle(w / 2, -ROTATE_OFFSET, 5);
  rotateHandle.fill({ color: 0xffffff });
  rotateHandle.stroke({ width: 1, color: BORDER_COLOR });

  rotateHandle.eventMode = 'static';
  rotateHandle.cursor = 'grab';
  rotateHandle.on('pointerdown', (e: FederatedPointerEvent) => {
    e.stopPropagation();
    onHandleDown('rotate', e);
  });
  transformer.addChild(rotateHandle);

  // 8 个缩放手柄
  const HANDLE_SIZE = 8;
  HANDLES.forEach((config) => {
    const handle = new Graphics();
    handle.rect(-HANDLE_SIZE / 2, -HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    handle.fill({ color: 0xffffff });
    handle.stroke({ width: 1, color: BORDER_COLOR });

    handle.x = w * config.x;
    handle.y = h * config.y;

    handle.eventMode = 'static';
    handle.cursor = config.cursor;
    handle.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      onHandleDown(config.name, e);
    });

    transformer.addChild(handle);
  });
};
