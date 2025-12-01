import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';

// 导出类型，供 CanvasManager 使用
export type TransformHandleType = 
  | 'tl' | 't' | 'tr' 
  | 'l'  | 'r' 
  | 'bl' | 'b' | 'br' 
  | 'rotate';

interface HandleConfig {
    name: TransformHandleType;
    cursor: string;
    x: number;
    y: number;
}

const HANDLES: HandleConfig[] = [
    { name: 'tl', cursor: 'nwse-resize', x: 0, y: 0 },
    { name: 't',  cursor: 'ns-resize',   x: 0.5, y: 0 },
    { name: 'tr', cursor: 'nesw-resize', x: 1, y: 0 },
    { name: 'r',  cursor: 'ew-resize',   x: 1, y: 0.5 },
    { name: 'br', cursor: 'nwse-resize', x: 1, y: 1 },
    { name: 'b',  cursor: 'ns-resize',   x: 0.5, y: 1 },
    { name: 'bl', cursor: 'nesw-resize', x: 0, y: 1 },
    { name: 'l',  cursor: 'ew-resize',   x: 0, y: 0.5 },
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
    if (stage.children.length > 0) {
        stage.setChildIndex(transformerContainer, stage.children.length - 1);
    }
    return transformerContainer;
};

export const drawTransformer = (
    selectedElements: any[], // 暂时用 any，后续替换为 IElement[]
    onHandleDown: ((type: TransformHandleType, e: FederatedPointerEvent) => void) | null
) => {
    if (!stageReference) return;

    const transformer = getTransformer(stageReference);
    transformer.removeChildren();

    if (!selectedElements || selectedElements.length === 0) {
        return;
    }

    const element = selectedElements[0];

    // 同步位置
    transformer.x = element.x;
    transformer.y = element.y;
    transformer.rotation = element.rotation || 0;

    // 绘制边框
    const border = new Graphics();
    const BORDER_COLOR = 0x007AFF;
    
    border.stroke({ width: 1, color: BORDER_COLOR });
    border.rect(0, 0, element.width, element.height);
    transformer.addChild(border);

    if (!onHandleDown) return;

    // 旋转手柄
    const rotateHandle = new Graphics();
    const ROTATE_OFFSET = 25;

    rotateHandle.moveTo(element.width / 2, 0);
    rotateHandle.lineTo(element.width / 2, -ROTATE_OFFSET);
    rotateHandle.stroke({ width: 1, color: BORDER_COLOR });

    rotateHandle.circle(element.width / 2, -ROTATE_OFFSET, 5);
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
    const HANDLE_SIZE = 8;
    HANDLES.forEach(config => {
        const handle = new Graphics();
        handle.rect(-HANDLE_SIZE/2, -HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
        handle.fill({ color: 0xFFFFFF });
        handle.stroke({ width: 1, color: BORDER_COLOR });

        handle.x = element.width * config.x;
        handle.y = element.height * config.y;

        handle.eventMode = 'static';
        handle.cursor = config.cursor;
        
        handle.on('pointerdown', (e: FederatedPointerEvent) => {
            e.stopPropagation();
            onHandleDown(config.name, e);
        });

        transformer.addChild(handle);
    });
};