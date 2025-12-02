import { BaseTool } from "./BaseTool";
import type { FederatedPointerEvent } from "pixi.js";
import { executeCommand } from "@/core/history/HistoryManager";
import { MoveElementCommand } from "@/core/commands/MoveElementCommand";

export class SelectTool extends BaseTool {
  name: string;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private initialStates: Array<{ id: string; x: number; y: number }> = [];

  constructor() {
    super();
    this.name = "select";
  }

  onPointerDown(e: FederatedPointerEvent) {
    if (this.store.selectedElements.length > 0) {
      this.isDragging = true;
      this.startX = e.global.x;
      this.startY = e.global.y;

      // 记录初始状态
      this.initialStates = this.store.selectedElements.map((el) => ({
        id: el.id,
        x: el.x,
        y: el.y,
      }));
    }
  }

  onPointerMove(e: FederatedPointerEvent) {
    if (!this.isDragging) return;

    const dx = e.global.x - this.startX;
    const dy = e.global.y - this.startY;

    // 更新所有选中元素的位置
    this.initialStates.forEach((init) => {
      this.store.updateElement(init.id, {
        x: init.x + dx,
        y: init.y + dy,
      });
    });
  }

  onPointerUp(e: FederatedPointerEvent) {
    if (this.isDragging) {
      // 记录结束状态并执行命令
      if (this.initialStates.length > 0) {
        const moves = this.initialStates
          .map((init) => {
            const current = this.store.elements.find((el) => el.id === init.id);
            if (!current) return null;
            return {
              id: init.id,
              fromX: init.x,
              fromY: init.y,
              toX: current.x,
              toY: current.y,
            };
          })
          .filter((m) => m && (m.fromX !== m.toX || m.fromY !== m.toY));

        if (moves.length > 0) {
          executeCommand(new MoveElementCommand(moves as any));
        }
      }
    }
    this.isDragging = false;
    this.initialStates = [];
  }
}
