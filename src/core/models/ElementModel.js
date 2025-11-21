export const createElement = ({
                                  type,
                                  x,
                                  y,
                                  width = 1, // 初始宽度极小，等待拖拽变大
                                  height = 1,
                                  style = {}
                              }) => ({
    id: 'el-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    type, // 'rect', 'circle', 'triangle', 'text'
    x,
    y,
    width,
    height,
    rotation: 0,
    text: type === 'text' ? '双击输入文本' : '',

    style: {
        // 核心需求：默认无背景色 (null)，只有边框
        fillColor: null,
        lineColor: 0x000000, // 黑色边框
        lineWidth: 2,

        // 文本属性
        fontFamily: 'Arial',
        fontSize: 24,
        color: 0x000000,

        ...style, // 允许覆盖
    },
});