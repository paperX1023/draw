import { BaseTool } from "./BaseTool";
import type { FederatedPointerEvent } from "pixi.js";
import type { ElementType } from "@/types/elements";
import { executeCommand } from "@/core/history/HistoryManager";
import { CreateElementCommand } from "@/core/commands/CreateElementCommand";

export class DrawTool extends BaseTool {
  name: string;
  private startX = 0;
  private startY = 0;
  private drawingId: string | null = null;

  constructor(toolName: string) {
    super();
    this.name = toolName;
  }

  onPointerDown(e: FederatedPointerEvent, hitElementId: string | null) {
    this.startX = e.global.x;
    this.startY = e.global.y;

    this.drawingId = this.store.createNewElementAt(
      this.name as ElementType,
      this.startX,
      this.startY
    );

    this.store.selectElement(null);
  }

  onPointerMove(e: FederatedPointerEvent) {
    if (!this.drawingId) return;

    const currentX = e.global.x;
    const currentY = e.global.y;

    const newX = currentX > this.startX ? this.startX : currentX;
    const newY = currentY > this.startY ? this.startY : currentY;
    const newW = Math.abs(currentX - this.startX);
    const newH = Math.abs(currentY - this.startY);

    this.store.updateElement(this.drawingId, {
      x: newX,
      y: newY,
      width: newW,
      height: newH,
    });
  }

  onPointerUp(e: FederatedPointerEvent): void {
    if (!this.drawingId) return;

    const element = this.store.elements.find((el) => el.id === this.drawingId);
    if (element) {
      executeCommand(new CreateElementCommand(element));
      this.store.selectElement(this.drawingId);
      this.store.setActiveTool("select");
    }
    this.drawingId = null;
  }
}
