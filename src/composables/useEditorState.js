// src/composables/useEditorState.js
import { reactive, computed, toRefs } from 'vue';
import { createElement } from '../core/models/ElementModel';

// 1. 定义状态
const state = reactive({
    elements: [],
    selectedElementIds: [],
    activeTool: 'select', // 'select', 'rect', 'circle', 'triangle', 'text'

    // 交互临时数据
    interactionData: {
        isInteracting: false,
        interactionType: null, // 'drag' (移动), 'create' (绘图)
        startPointer: { x: 0, y: 0 },
        initialElementStates: [],
        creatingElementId: null, // 正在创建的元素 ID
    }
});

// 2. 计算属性
const selectedElements = computed(() => {
    return state.elements.filter(e => state.selectedElementIds.includes(e.id));
});

// 3. 操作方法

const setActiveTool = (tool) => {
    state.activeTool = tool;
    if (tool !== 'select') {
        state.selectedElementIds = []; // 切换工具时清空选中
    }
};

const selectElement = (id, multiple = false) => {
    if (!id) {
        state.selectedElementIds = [];
        return;
    }
    if (multiple) {
        const idx = state.selectedElementIds.indexOf(id);
        if (idx > -1) state.selectedElementIds.splice(idx, 1);
        else state.selectedElementIds.push(id);
    } else {
        state.selectedElementIds = [id];
    }
};

// 核心：创建并添加到列表
const createNewElementAt = (type, x, y) => {
    const newElement = createElement({
        type,
        x,
        y,
        // 文本默认给个大小，图形默认 1x1 等待拖拽
        width: type === 'text' ? 100 : 1,
        height: type === 'text' ? 30 : 1,
        style: {
            fillColor: null, // 默认透明
            lineColor: 0x000000,
            lineWidth: 2
        }
    });
    state.elements.push(newElement);
    return newElement.id;
};

const updateElement = (id, updates) => {
    const index = state.elements.findIndex(e => e.id === id);
    if (index !== -1) {
        const current = state.elements[index];
        const newStyle = updates.style ? { ...current.style, ...updates.style } : current.style;
        state.elements[index] = { ...current, ...updates, style: newStyle };
    }
};

// 4. 导出
export function useEditorState() {
    return {
        state,
        ...toRefs(state), // 让组件能解构 { activeTool }
        selectedElements,

        setActiveTool,
        selectElement,
        createNewElementAt,
        updateElement
    };
}