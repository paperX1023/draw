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
  x: number;
  y: number;
}

const HANDLES: HandleConfig[] = [
  { name: 'tl', cursor: 'nwse-resize', x: 0,   y: 0   },
  { name: 't',  cursor: 'ns-resize',   x: 0.5, y: 0   },
  { name: 'tr', cursor: 'nesw-resize', x: 1,   y: 0   },
  { name: 'r',  cursor: 'ew-resize',   x: 1,   y: 0.5 },
  { name: 'br', cursor: 'nwse-resize', x: 1,   y: 1   },
  { name: 'b',  cursor: 'ns-resize',   x: 0.5, y: 1   },
  { name: 'bl', cursor: 'nesw-resize', x: 0,   y: 1   },
  { name: 'l',  cursor: 'ew-resize',   x: 0,   y: 0.5 },
];

let transformerContainer: Container | null = null;
let stageRef: Container | null = null;

export const getTransformer = (stage: Container): Container => {
  if (!transformerContainer) {
    transformerContainer = new Container();
    transformerContainer.label = 'TransformerLayer';
    transformerContainer.eventMode = 'static';
    stage.addChild(transformerContainer);
    stageRef = stage;
  }
  stage.setChildIndex(transformerContainer, stage.children.length - 1);
  return transformerContainer;
};

// 虚线矩形
function drawDashedRect(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  dash = 6,
  gap = 4,
) {
  const color = 0x007aff;
  g.clear();

  const drawSide = (x1: number, y1: number, x2: number, y2: number) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const dx = (x2 - x1) / len;
    const dy = (y2 - y1) / len;

    let dist = 0;
    let draw = true;

    while (dist < len) {
      const seg = Math.min(draw ? dash : gap, len - dist);
      if (draw) {
        g.moveTo(x1 + dx * dist, y1 + dy * dist);
        g.lineTo(x1 + dx * (dist + seg), y1 + dy * (dist + seg));
      }
      dist += seg;
      draw = !draw;
    }
  };

  drawSide(x,       y,       x + w,   y);
  drawSide(x + w,   y,       x + w,   y + h);
  drawSide(x + w,   y + h,   x,       y + h);
  drawSide(x,       y + h,   x,       y);

  g.stroke({ width: 1, color, alpha: 1 });
}

// 绘制变换器
export const drawTransformer = (
  targets: TransformTargetLike[],
  onHandleDown: ((type: TransformHandleType, e: FederatedPointerEvent) => void) | null,
) => {
  if (!stageRef) return;

  const transformer = getTransformer(stageRef);
  transformer.removeChildren();

  if (!targets || targets.length === 0) return;

  // 计算整体包围盒
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const t of targets) {
    const x1 = Number(t.x);
    const y1 = Number(t.y);
    const x2 = x1 + Number(t.width);
    const y2 = y1 + Number(t.height);

    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  }

  const boxX = minX;
  const boxY = minY;
  const boxW = maxX - minX;
  const boxH = maxY - minY;
  const rotation = targets[0].rotation || 0;

  transformer.x = boxX;
  transformer.y = boxY;
  transformer.rotation = rotation;

  // 虚线边框
  const border = new Graphics();
  drawDashedRect(border, 0, 0, boxW, boxH);
  transformer.addChild(border);

  if (!onHandleDown) return;

  // 旋转手柄
  const BORDER_COLOR = 0x007aff;
  const ROTATE_OFFSET = 25;

  const rotateHandle = new Graphics();
  rotateHandle.moveTo(boxW / 2, 0);
  rotateHandle.lineTo(boxW / 2, -ROTATE_OFFSET);
  rotateHandle.stroke({ width: 1, color: BORDER_COLOR });

  rotateHandle.circle(boxW / 2, -ROTATE_OFFSET, 5);
  rotateHandle.fill({ color: 0xffffff });
  rotateHandle.stroke({ width: 1, color: BORDER_COLOR });

  rotateHandle.eventMode = 'static';
  rotateHandle.cursor = 'grab';
  rotateHandle.on('pointerdown', (e: FederatedPointerEvent) => {
    e.stopPropagation();
    onHandleDown('rotate', e);
  });
  transformer.addChild(rotateHandle);

  // 缩放手柄
  const HANDLE_SIZE = 8;
  for (const cfg of HANDLES) {
    const handle = new Graphics();
    handle.rect(-HANDLE_SIZE / 2, -HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    handle.fill({ color: 0xffffff });
    handle.stroke({ width: 1, color: BORDER_COLOR });

    handle.x = boxW * cfg.x;
    handle.y = boxH * cfg.y;

    handle.eventMode = 'static';
    handle.cursor = cfg.cursor;
    handle.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      onHandleDown(cfg.name, e);
    });

    transformer.addChild(handle);
  }
};
