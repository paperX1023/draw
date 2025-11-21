// src/composables/useInteraction.js
import { useEditorState } from './useEditorState';
// 如果您之前实现了 Command，可以import executeCommand，这里为了保证链路通畅暂时简化

export function useInteraction() {
    const {
        state,
        updateElement,
        selectedElements,
        createNewElementAt,
        selectElement,
        setActiveTool
    } = useEditorState();

    // 开始交互的通用设置
    const startInteraction = (type, x, y) => {
        state.interactionData.isInteracting = true;
        state.interactionData.interactionType = type;
        state.interactionData.startPointer = { x, y };
    };

    // 1. 指针按下
    const handlePointerDown = (e, elementId = null) => {
        const globalX = e.globalX;
        const globalY = e.globalY;

        // 模式 A: 选择工具
        if (state.activeTool === 'select') {
            if (elementId) {
                // 点击了元素 -> 选中并准备拖拽
                if (!state.selectedElementIds.includes(elementId)) {
                    selectElement(elementId);
                }
                if (selectedElements.value.length > 0) {
                    startInteraction('drag', globalX, globalY);
                    // 记录初始位置
                    state.interactionData.initialElementStates = selectedElements.value.map(el => ({
                        id: el.id, initialX: el.x, initialY: el.y
                    }));
                }
            } else {
                // 点击空白 -> 取消选中
                selectElement(null);
            }
        }
        // 模式 B: 绘图工具 (Rect, Circle...)
        else {
            // 在当前位置创建一个新元素
            const newId = createNewElementAt(state.activeTool, globalX, globalY);

            state.interactionData.creatingElementId = newId;
            startInteraction('create', globalX, globalY);

            selectElement(null); // 绘图时暂时不选中
        }
    };

    // 2. 指针移动
    const handlePointerMove = (e) => {
        if (!state.interactionData.isInteracting) return;

        const currentX = e.globalX;
        const currentY = e.globalY;
        const { startPointer, interactionType, creatingElementId, initialElementStates } = state.interactionData;

        const deltaX = currentX - startPointer.x;
        const deltaY = currentY - startPointer.y;

        // 拖拽移动
        if (interactionType === 'drag') {
            initialElementStates.forEach(item => {
                updateElement(item.id, {
                    x: item.initialX + deltaX,
                    y: item.initialY + deltaY
                });
            });
        }
        // 拖拽绘图 (拉伸)
        else if (interactionType === 'create' && creatingElementId) {
            // 计算拉伸后的矩形 (支持反向拉伸)
            const newX = deltaX > 0 ? startPointer.x : currentX;
            const newY = deltaY > 0 ? startPointer.y : currentY;
            const newW = Math.abs(deltaX);
            const newH = Math.abs(deltaY);

            updateElement(creatingElementId, {
                x: newX, y: newY, width: newW, height: newH
            });
        }
    };

    // 3. 指针抬起
    const handlePointerUp = (e) => {
        if (!state.interactionData.isInteracting) return;

        const type = state.interactionData.interactionType;

        if (type === 'create') {
            const newId = state.interactionData.creatingElementId;
            if (newId) {
                // 画完后：选中它，并自动切回选择工具 (符合主流软件习惯)
                selectElement(newId);
                setActiveTool('select');
            }
        }
        // 如果是 drag，这里可以记录 Undo 历史

        // 重置
        state.interactionData.isInteracting = false;
        state.interactionData.interactionType = null;
        state.interactionData.creatingElementId = null;
        state.interactionData.initialElementStates = [];
    };

    return { handlePointerDown, handlePointerMove, handlePointerUp };
}