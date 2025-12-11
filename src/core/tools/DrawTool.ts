import { BaseTool } from "./BaseTool";
import type { FederatedPointerEvent } from "pixi.js";
import type { ElementType } from "@/types/elements";
import { executeCommand } from "@/core/history/HistoryManager";
import { CreateElementCommand } from "@/core/commands/CreateElementCommand";
import { PixiEngine } from "@/core/render/PixiEngine";

export class DrawTool extends BaseTool {
  name: string;
  private startX = 0;
  private startY = 0;
  private drawingId: string | null = null;
  private engine = PixiEngine.getInstance();

  constructor(toolName: string) {
    super();
    this.name = toolName;
  }

  onPointerDown(e: FederatedPointerEvent, hitElementId: string | null) {
    const world = this.engine.screenToWorld(e.global.clone());
    this.startX = world.x;
    this.startY = world.y;

    this.drawingId = this.store.createNewElementAt(
      this.name as ElementType,
      this.startX,
      this.startY
    );

    this.store.selectElement(null);
  }

  onPointerMove(e: FederatedPointerEvent) {
    if (!this.drawingId) return;
    const world = this.engine.screenToWorld(e.global.clone());
    const currentX = world.x;
    const currentY = world.y;

    const newX = currentX > this.startX ? this.startX : currentX;
    const newY = currentY > this.startY ? this.startY : currentY;
    const newW = Math.max(Math.abs(currentX - this.startX), 1);
    const newH = Math.max(Math.abs(currentY - this.startY), 1);

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
