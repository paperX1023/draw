import * as PIXI from 'pixi.js';

const drawShapeGeometry = (g, elementData) => {
    const { type, width, height, style } = elementData;
    g.clear();
    g.lineStyle(style.lineWidth || 2, style.lineColor || 0x000000, 1);

    if (style.fillColor !== null && style.fillColor !== undefined) {
        g.beginFill(style.fillColor);
    } else {
        g.beginFill(0xFFFFFF, 0.001);
    }

    switch (type) {
        case 'rect': g.drawRect(0, 0, width, height); break;
        case 'circle': g.drawCircle(width/2, height/2, Math.min(width, height)/2); break;
        case 'triangle': g.drawPolygon([width/2, 0, 0, height, width, height]); break;
    }
    g.endFill();
};

const updateShapeLabel = (container, elementData) => {
    // 寻找名为 'label' 的子对象
    let label = container.getChildByName('label');

    // 如果数据里没字，且存在 label，则移除
    if (!elementData.text) {
        if (label) container.removeChild(label);
        return;
    }

    // 如果没有 label 对象，创建一个
    if (!label) {
        label = new PIXI.Text('', { align: 'center' });
        label.name = 'label';
        label.anchor.set(0.5, 0.5);
        container.addChild(label);
    }

    // 更新文字
    label.text = elementData.text;
    label.style.fontFamily = elementData.style.fontFamily || 'Arial';
    label.style.fontSize = elementData.style.fontSize || 14;
    label.style.fill = elementData.style.color || 0x000000; // 确保有颜色

    // 居中
    label.x = elementData.width / 2;
    label.y = elementData.height / 2;
};

export const updateOrCreateShape = (elementData, existingObject) => {
    let displayObject = existingObject;

    if (!displayObject) {
        if (elementData.type === 'text') {
            displayObject = new PIXI.Text(elementData.text, { fontSize: elementData.style.fontSize });
        } else {
            displayObject = new PIXI.Graphics();
        }
        displayObject.eventMode = 'static';
        displayObject.cursor = 'pointer';
    }

    if (displayObject instanceof PIXI.Graphics) {
        drawShapeGeometry(displayObject, elementData);
        // 【关键】：必须调用这个函数
        updateShapeLabel(displayObject, elementData);
    } else if (displayObject instanceof PIXI.Text) {
        displayObject.text = elementData.text || '双击编辑';
        // ...
    }

    displayObject.x = elementData.x;
    displayObject.y = elementData.y;
    displayObject.rotation = elementData.rotation || 0;
    displayObject.pivot.set(0, 0);

    return displayObject;
};