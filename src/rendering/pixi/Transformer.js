import * as PIXI from 'pixi.js';

// 单例模式，用于在舞台上绘制选中边框和控制点
let transformerInstance = null;
let stageReference = null;

/**
 * 创建或获取 Transformer 实例
 * @param {PIXI.Container} stage - PixiJS 舞台
 */
const getTransformer = (stage) => {
    if (!transformerInstance) {
        transformerInstance = new PIXI.Container();
        transformerInstance.name = 'TransformerLayer';
        stage.addChild(transformerInstance);
        stageReference = stage;
    }
    return transformerInstance;
};

/**
 * 绘制选中边框和控制点
 * @param {Array} selectedElements - 选中的元素数据数组
 */
export const drawTransformer = (selectedElements) => {
    if (!stageReference) return;

    const transformer = getTransformer(stageReference);
    transformer.removeChildren(); // 清空上次的绘制

    if (selectedElements.length === 0) {
        return; // 没有选中元素，直接退出
    }

    // --- 暂时只处理单个元素选中 ---
    const element = selectedElements[0];

    // 1. 创建 Graphics 对象用于绘制边框
    const border = new PIXI.Graphics();

    // 2. 计算边界 (假设元素是矩形，且 x,y 是左上角)
    // 注意：旋转的边界计算非常复杂，MVP 阶段我们只画简单的轴对齐边框
    const BORDER_COLOR = 0x007AFF;
    const BORDER_WIDTH = 2;

    border.lineStyle(BORDER_WIDTH, BORDER_COLOR, 1);

    // 在元素的局部坐标系 (0, 0) 处绘制，然后通过 TransformerInstance 的位置进行定位
    // 为了简单，我们直接在全局坐标系中绘制

    // 绘制边框
    // 边框应比元素本身稍大，但为了简单，我们先画在元素边界上
    border.drawRect(
        element.x - BORDER_WIDTH/2,
        element.y - BORDER_WIDTH/2,
        element.width + BORDER_WIDTH,
        element.height + BORDER_WIDTH
    );

    // 3. 将边框添加到 Transformer 容器
    transformer.addChild(border);

    // TODO: 后续添加旋转和缩放控制点 (小方块或小圆圈)

    // 确保 Transformer Layer 始终在顶部
    stageReference.setChildIndex(transformer, stageReference.children.length - 1);
};