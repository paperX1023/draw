import { useEditorStore } from "@/stores/editorStore";
import { executeCommand } from "@/core/history/HistoryManager";
import { MoveElementCommand } from "@/core/commands/MoveElementCommand";
import { CreateElementCommand } from "@/core/commands/CreateElementCommand";
import type { TransformHandleType } from "@/rendering/pixi/Transformer";

export interface IInteractionPayload {
  globalX: number;
  globalY: number;
}

interface ITransformData {
  handle?: TransformHandleType;
  id?: string;
  initialX?: number;
  initialY?: number;
  initialW?: number;
  initialH?: number;
  initialRotation?: number;
  centerX?: number;
  centerY?: number;
  initialElementStates?: Array<{
    id: string;
    initialX: number;
    initialY: number;
  }>;
}


export function useInteraction() {
    const store = useEditorStore();

    const startInteraction = (type: string, x: number, y: number, extraData: ITransformData = {}) => {
        store.$patch((state: any) => {
            state.interactionData.isInteracting = true;
            state.interactionData.interactionType = type;
            state.interactionData.startPointer = { x, y };
            state.interactionData.transformData = extraData;
        });
    };

    // 处理变换开始
    const handleTransformStart = (handleType: TransformHandleType, e: IInteractionPayload) => {
        const el = store.selectedElements[0];
        if (!el) return;

        const elX = Number(el.x);
        const elY = Number(el.y);
        const elW = Number(el.width);
        const elH = Number(el.height);

        startInteraction('transform', e.globalX, e.globalY, {
            handle: handleType,
            id: el.id,
            initialX: elX,
            initialY: elY,
            initialW: elW,
            initialH: elH,
            initialRotation: Number(el.rotation) || 0,
            centerX: elX + elW / 2,
            centerY: elY + elH / 2
        });
    };

    // 处理指针按下
    const handlePointerDown = (e: IInteractionPayload, elementId: string | null = null) => {
        const globalX = e.globalX;
        const globalY = e.globalY;

        // 选择工具
        if (store.activeTool === 'select') {
            if (elementId) {
                if (!store.selectedElementIds.includes(elementId)) {
                    store.selectElement(elementId);
                }
                if (store.selectedElements.length > 0) {
                    const initialElementStates = store.selectedElements.map(el => ({
                        id: el.id, initialX: el.x, initialY: el.y
                    }));
                    startInteraction('drag', globalX, globalY, { initialElementStates });
                }
            } else {
                store.selectElement(null);
            }
        }
        // 绘图工具
        else {
            const newId = store.createNewElementAt(store.activeTool as any, globalX, globalY);
            
            // 通过 patch 修改 store 里的临时状态
            store.$patch((state: any) => {
                state.interactionData.creatingElementId = newId;
            });
            
            startInteraction('create', globalX, globalY);
            store.selectElement(null);
        }
    };

    const handlePointerMove = (e: IInteractionPayload) => {
        // 访问 Pinia state (需断言，因为 interactionData 可能未在 TS 接口中完全定义)
        const iData = (store as any).interactionData;
        
        if (!iData.isInteracting) return;

        const currentX = e.globalX;
        const currentY = e.globalY;
        const { startPointer, interactionType, transformData, creatingElementId } = iData;
        
        const dx = currentX - startPointer.x;
        const dy = currentY - startPointer.y;

        // 变形
        if (interactionType === 'transform' && transformData) {
            const { handle, initialX, initialY, initialW, initialH, initialRotation, id, centerX, centerY } = transformData;

            if (handle === 'rotate') {
                const startAngle = Math.atan2(startPointer.y - centerY!, startPointer.x - centerX!);
                const currentAngle = Math.atan2(currentY - centerY!, currentX - centerX!);
                let rawRotation = initialRotation! + (currentAngle - startAngle);
                
                // 吸附
                const SNAP = 45 * (Math.PI / 180);
                const THRESHOLD = 5 * (Math.PI / 180);
                const closest = Math.round(rawRotation / SNAP) * SNAP;
                if (Math.abs(rawRotation - closest) < THRESHOLD) rawRotation = closest;

                store.updateElement(id!, { rotation: rawRotation });
            } else {
                let newX = initialX!, newY = initialY!, newW = initialW!, newH = initialH!;
                
                // 简单的手柄逻辑
                if (handle.includes('r')) newW = initialW! + dx;
                if (handle.includes('l')) { newX = initialX! + dx; newW = initialW! - dx; }
                if (handle.includes('b')) newH = initialH! + dy;
                if (handle.includes('t')) { newY = initialY! + dy; newH = initialH! - dy; }

                if (newW < 5) newW = 5;
                if (newH < 5) newH = 5;

                if (handle.includes('l')) newX = initialX! + (initialW! - newW);
                if (handle.includes('t')) newY = initialY! + (initialH! - newH);

                store.updateElement(id!, { x: newX, y: newY, width: newW, height: newH });
            }
        }
        // 拖拽
        else if (interactionType === 'drag' && transformData?.initialElementStates) {
            transformData.initialElementStates.forEach((item: any) => {
                store.updateElement(item.id, {
                    x: item.initialX + dx,
                    y: item.initialY + dy
                });
            });
        }
        // 绘图
        else if (interactionType === 'create' && creatingElementId) {
            const newX = dx > 0 ? startPointer.x : currentX;
            const newY = dy > 0 ? startPointer.y : currentY;
            const newW = Math.abs(dx);
            const newH = Math.abs(dy);
            store.updateElement(creatingElementId, {
                x: newX, y: newY, width: newW, height: newH
            });
        }
    };

    // 指针抬起
    const handlePointerUp = (e: any) => { 
        const iData = (store as any).interactionData;
        if (!iData.isInteracting) return;

        const type = iData.interactionType;

        if (type === 'create') {
            const newId = iData.creatingElementId;
            if (newId) {
                // 获取新元素用于记录历史
                const newEl = store.elements.find(el => el.id === newId);
                if (newEl) {
                    executeCommand(new CreateElementCommand(newEl));
                }
                store.selectElement(newId);
                store.setActiveTool('select');
            }
        }
        
        if (type === 'drag' && iData.transformData?.initialElementStates) {
             const { initialElementStates } = iData.transformData;
             const elementMoves = initialElementStates.map((initial: any) => {
                 const current = store.elements.find(el => el.id === initial.id);
                 if (!current) return null;
                 return {
                     id: initial.id,
                     fromX: initial.initialX, fromY: initial.initialY,
                     toX: current.x, toY: current.y
                 };
             }).filter((m: any) => m && (m.fromX !== m.toX || m.fromY !== m.toY));

             if (elementMoves.length > 0) {
                 executeCommand(new MoveElementCommand(elementMoves));
             }
        }

        // 重置状态
        store.$patch((state: any) => {
            state.interactionData.isInteracting = false;
            state.interactionData.interactionType = null;
            state.interactionData.creatingElementId = null;
            state.interactionData.transformData = null;
        });
    };

    return { 
        handlePointerDown, 
        handlePointerMove, 
        handlePointerUp,
        handleTransformStart
    };
}