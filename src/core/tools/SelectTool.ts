import { BaseTool } from './BaseTool';
import type { FederatedPointerEvent } from 'pixi.js';
import { executeCommand } from '@/core/history/HistoryManager';
import { MoveElementCommand } from '@/core/commands/MoveElementCommand';
import type { TransformHandleType } from '@/rendering/pixi/Transformer';

export class SelectTool extends BaseTool {
  name = 'select';
  
  // 交互状态
  private isDragging = false;
  private isTransforming = false;
  
  // 拖拽数据
  private startX = 0;
  private startY = 0;
  private initialMoveStates: Array<{ id: string; x: number; y: number }> = [];

  // 变形数据
  private transformData: {
    handle: TransformHandleType;
    id: string;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
    initialRotation: number;
    centerX: number;
    centerY: number;
  } | null = null;

  public onTransformStart(handle: TransformHandleType, e: FederatedPointerEvent) {
    const el = this.store.selectedElements[0];
    if (!el) return;

    this.isTransforming = true;
    this.startX = e.global.x;
    this.startY = e.global.y;

    const elX = Number(el.x);
    const elY = Number(el.y);
    const elW = Number(el.width);
    const elH = Number(el.height);

    this.transformData = {
        handle,
        id: el.id,
        initialX: elX, initialY: elY, initialW: elW, initialH: elH,
        initialRotation: Number(el.rotation) || 0,
        centerX: elX + elW / 2,
        centerY: elY + elH / 2
    };
  }

  onPointerDown(e: FederatedPointerEvent) {
    if (this.isTransforming) return;

    // 点击目标判断
    if (this.store.selectedElements.length > 0) {
      this.isDragging = true;
      this.startX = e.global.x;
      this.startY = e.global.y;
      
      this.initialMoveStates = this.store.selectedElements.map(el => ({
        id: el.id, x: el.x, y: el.y
      }));
    }
  }

  onPointerMove(e: FederatedPointerEvent) {
    const currentX = e.global.x;
    const currentY = e.global.y;
    const dx = currentX - this.startX;
    const dy = currentY - this.startY;

    // 缩放/旋转
    if (this.isTransforming && this.transformData) {
        const { handle, initialX, initialY, initialW, initialH, initialRotation, id, centerX, centerY } = this.transformData;

        if (handle === 'rotate') {
            const startAngle = Math.atan2(this.startY - centerY, this.startX - centerX);
            const currentAngle = Math.atan2(currentY - centerY, currentX - centerX);
            let rawRotation = initialRotation + (currentAngle - startAngle);
            
            // 吸附
            const SNAP = 45 * (Math.PI / 180);
            if (Math.abs(rawRotation % SNAP) < 0.1) {
                rawRotation = Math.round(rawRotation / SNAP) * SNAP;
            }
            this.store.updateElement(id, { rotation: rawRotation });
        } else {
            // 缩放逻辑
            let newX = initialX, newY = initialY, newW = initialW, newH = initialH;
            if (handle.includes('r')) newW = initialW + dx;
            if (handle.includes('l')) { newX = initialX + dx; newW = initialW - dx; }
            if (handle.includes('b')) newH = initialH + dy;
            if (handle.includes('t')) { newY = initialY + dy; newH = initialH - dy; }

            if (newW < 5) newW = 5; if (newH < 5) newH = 5;
            if (handle.includes('l')) newX = initialX + (initialW - newW);
            if (handle.includes('t')) newY = initialY + (initialH - newH);

            this.store.updateElement(id, { x: newX, y: newY, width: newW, height: newH });
        }
        return;
    }

    // 处理拖拽
    if (this.isDragging) {
        this.initialMoveStates.forEach(init => {
            this.store.updateElement(init.id, { x: init.x + dx, y: init.y + dy });
        });
    }
  }

  onPointerUp(e: FederatedPointerEvent) {
    if (this.isDragging) {
        // 记录移动历史
        const moves = this.initialMoveStates.map(init => {
            const current = this.store.elements.find(el => el.id === init.id);
            if (!current) return null;
            return { id: init.id, fromX: init.x, fromY: init.y, toX: current.x, toY: current.y };
        }).filter(m => m && (m.fromX !== m.toX || m.fromY !== m.toY));

        if (moves.length > 0) {
            executeCommand(new MoveElementCommand(moves as any));
        }
    }

    // 重置所有状态
    this.isDragging = false;
    this.isTransforming = false;
    this.transformData = null;
    this.initialMoveStates = [];
  }
}