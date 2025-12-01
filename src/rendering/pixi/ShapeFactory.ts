import { 
    Container, 
    Graphics, 
    Text, 
    Sprite, 
    Texture, 
    BlurFilter, 
    ColorMatrixFilter 
} from 'pixi.js';

interface ElementData {
    id: string;
    type: 'rect' | 'circle' | 'triangle' | 'text' | 'image';
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    text?: string;
    src?: string;
    style?: {
        fillColor?: number | null;
        lineColor?: number;
        lineWidth?: number;
        fontSize?: number;
        fontFamily?: string;
        color?: number;
    };
    filters?: {
        blur: number;
        brightness: number;
        contrast: number;
    };
}

// 绘制几何图形
const drawShapeGeometry = (g: Graphics, elementData: ElementData) => {
    const { type, width, height } = elementData;
    const style = elementData.style || {}; 
    const lineWidth = style.lineWidth !== undefined ? style.lineWidth : 2;
    const lineColor = style.lineColor !== undefined ? style.lineColor : 0x000000;
    const fillColor = style.fillColor;

    g.clear();

    switch (type) {
        case 'rect':
            g.rect(0, 0, width, height);
            break;
        case 'circle':
            g.ellipse(width / 2, height / 2, width / 2, height / 2);
            break;
        case 'triangle':
            g.poly([
                width / 2, 0,
                0, height,
                width, height
            ]);
            break;
    }

    if (fillColor !== null && fillColor !== undefined) {
        g.fill({ color: fillColor });
    } else {
        g.fill({ color: 0xFFFFFF, alpha: 0.001 });
    }

    if (lineWidth > 0) {
        g.stroke({ width: lineWidth, color: lineColor });
    }
};

const updateShapeLabel = (container: Container, elementData: ElementData) => {
    let label = container.getChildByLabel('label') as Text;

    if (!elementData.text) {
        if (label) container.removeChild(label);
        return;
    }

    if (!label) {
        label = new Text({ text: '', style: { align: 'center' } });
        label.label = 'label';
        label.anchor.set(0.5, 0.5);
        container.addChild(label);
    }

    const style = elementData.style || {};
    label.text = elementData.text;
    label.style.fontFamily = style.fontFamily || 'Arial';
    label.style.fontSize = style.fontSize || 14;
    label.style.fill = style.color || 0x000000;

    label.x = elementData.width / 2;
    label.y = elementData.height / 2;
};

const applyFilters = (displayObject: Container, filterData: any) => {
    if (!filterData) {
        displayObject.filters = [];
        return;
    }
    const filtersToApply = [];
    if (filterData.blur > 0) {
        filtersToApply.push(new BlurFilter({ strength: filterData.blur }));
    }
    if (filterData.brightness !== 1 || filterData.contrast !== 1) {
        const colorMatrix = new ColorMatrixFilter();
        colorMatrix.brightness(filterData.brightness, false);
        colorMatrix.contrast(filterData.contrast, false);
        filtersToApply.push(colorMatrix);
    }
    displayObject.filters = filtersToApply;
};

export const updateOrCreateShape = (
    elementData: ElementData, 
    existingObject?: Container
): Container | null => {
    
    if (elementData.type === 'image' && !elementData.src) {
        return null;
    }

    let displayObject = existingObject;

    // 创建阶段
    if (!displayObject) {
        if (elementData.type === 'text') {
             displayObject = new Text({ text: elementData.text || '', style: { fontSize: 24 } });
        } 
        else if (elementData.type === 'image') {
            displayObject = new Container();
            const hitArea = new Graphics();
            hitArea.label = 'hitArea'; 
            displayObject.addChild(hitArea);
            
            if (elementData.src) {
                const texture = Texture.from(elementData.src);
                const sprite = new Sprite(texture);
                sprite.label = 'imageContent';
                displayObject.addChild(sprite);
            }
        }
        else {
             displayObject = new Graphics();
        }
        displayObject.eventMode = 'static';
        displayObject.cursor = 'pointer';
    }

    // 更新阶段
    if (displayObject instanceof Graphics) {
        drawShapeGeometry(displayObject, elementData);
        updateShapeLabel(displayObject, elementData);
    } 
    else if (displayObject instanceof Text) {
        displayObject.text = elementData.text || '双击编辑';
        const style = elementData.style || {};
        displayObject.style.fontSize = style.fontSize || 24;
        displayObject.style.fill = style.color || 0x000000;
    }
    else if (elementData.type === 'image' && displayObject instanceof Container) {
        let hitArea = displayObject.getChildByLabel('hitArea') as Graphics;
        if (!hitArea) {
            hitArea = new Graphics();
            hitArea.label = 'hitArea';
            displayObject.addChildAt(hitArea, 0);
        }
        hitArea.clear();
        hitArea.rect(0, 0, elementData.width, elementData.height);
        hitArea.fill({ color: 0xFFFFFF, alpha: 0.0001 });
        
        let sprite = displayObject.getChildByLabel('imageContent') as Sprite;
        if (elementData.src) {
            if (!sprite) {
                const newSprite = new Sprite(Texture.from(elementData.src));
                newSprite.label = 'imageContent';
                displayObject.addChild(newSprite);
            } else if (sprite.texture.label !== elementData.src) { 
                 sprite.texture = Texture.from(elementData.src);
            }
            if (sprite) {
                sprite.width = elementData.width;
                sprite.height = elementData.height;
                sprite.visible = true;
            }
        } else {
            if (sprite) sprite.visible = false;
        }
        applyFilters(displayObject, elementData.filters);
    }

    // 变换
    displayObject.x = elementData.x;
    displayObject.y = elementData.y;
    displayObject.rotation = elementData.rotation || 0;
    displayObject.pivot.set(0, 0);

    return displayObject;
};