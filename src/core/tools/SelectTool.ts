import { BaseTool } from "./BaseTool";
import { FederatedPointerEvent, Graphics } from "pixi.js";
import { executeCommand } from "@/core/history/HistoryManager";
import { MoveElementCommand } from "@/core/commands/MoveElementCommand";
import { PixiEngine } from "@/core/render/PixiEngine";
import type { TransformHandleType } from "@/rendering/pixi/Transformer";

interface IPointData {
  globalX: number;
  globalY: number;
}

interface TransformItemState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  centerX: number;
  centerY: number;
}

export class SelectTool extends BaseTool {
  name = "select";

  // 拖拽移动
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialMoveStates: Array<{ id: string; x: number; y: number }> = [];

  // 组变形（旋转 / 缩放）
  private isTransforming = false;
  private transformHandle: TransformHandleType | null = null;
  private transformStartX = 0;
  private transformStartY = 0;
  private groupCenterX = 0;
  private groupCenterY = 0;
  private groupInitialBounds = { x: 0, y: 0, width: 0, height: 0 };
  private transformItems: TransformItemState[] = [];

  // 框选（拖动矩形）
  private marquee: Graphics | null = null;
  private isMarqueeSelecting = false;
  private marqueeStartX = 0;
  private marqueeStartY = 0;
  private marqueeEndX = 0;
  private marqueeEndY = 0;

  private ensureMarquee() {
    if (this.marquee) return;
    const stage = PixiEngine.getInstance().stage;
    if (!stage) return;

    const g = new Graphics();
    g.label = "SelectionMarquee";
    g.eventMode = "none";
    g.visible = false;
    stage.addChild(g);
    this.marquee = g;
  }

  private updateMarqueeVisual() {
    if (!this.marquee) return;
    const g = this.marquee;

    const x1 = Math.min(this.marqueeStartX, this.marqueeEndX);
    const y1 = Math.min(this.marqueeStartY, this.marqueeEndY);
    const w = Math.abs(this.marqueeEndX - this.marqueeStartX);
    const h = Math.abs(this.marqueeEndY - this.marqueeStartY);

    g.clear();
    if (w < 2 || h < 2) {
      g.visible = false;
      return;
    }

    g.rect(x1, y1, w, h);
    g.fill({ color: 0x007aff, alpha: 0.08 }); // 半透明填充
    g.stroke({ width: 1, color: 0x007aff, alpha: 0.9 }); // 实线边框
    g.visible = true;
  }

  private hideMarquee() {
    if (!this.marquee) return;
    this.marquee.visible = false;
    this.marquee.clear();
  }

  // 开始组变形
  public onTransformStart(handle: TransformHandleType, p: IPointData) {
    const selected = this.store.selectedElements;
    if (!selected || selected.length === 0) return;

    if (handle === "move") {
      this.isTransforming = false;
      this.isDragging = true;
      this.dragStartX = p.globalX;
      this.dragStartY = p.globalY;
      this.initialMoveStates = selected.map((el) => ({
        id: el.id,
        x: Number(el.x),
        y: Number(el.y),
      }));
      return;
    }

    this.isTransforming = true;
    this.transformHandle = handle;
    this.transformStartX = p.globalX;
    this.transformStartY = p.globalY;

    // 计算选中元素合并包围盒
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    selected.forEach((el) => {
      const x = Number(el.x);
      const y = Number(el.y);
      const w = Number(el.width);
      const h = Number(el.height);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });

    const w = maxX - minX;
    const h = maxY - minY;
    this.groupInitialBounds = { x: minX, y: minY, width: w, height: h };
    this.groupCenterX = minX + w / 2;
    this.groupCenterY = minY + h / 2;

    // 每个元素初始状态
    this.transformItems = selected.map((el) => {
      const x = Number(el.x);
      const y = Number(el.y);
      const w = Number(el.width);
      const h = Number(el.height);
      const rot = Number(el.rotation) || 0;
      const cx = x + w / 2;
      const cy = y + h / 2;
      return {
        id: el.id,
        x,
        y,
        width: w,
        height: h,
        rotation: rot,
        centerX: cx,
        centerY: cy,
      };
    });
  }

  onPointerDown(e: FederatedPointerEvent, hitElementId: string | null) {
    if (this.isTransforming) return;

    // 处理选中 + 准备拖拽
    if (hitElementId) {
      const selected = this.store.selectedElements;

      if (!selected.some((el) => el.id === hitElementId)) {
        const isMultiple = e.ctrlKey || e.metaKey || e.shiftKey;
        this.store.selectElement(hitElementId, isMultiple);
      }

      const afterSelect = this.store.selectedElements;
      if (afterSelect.length > 0 && e.button === 0) {
        this.isDragging = true;
        this.dragStartX = e.global.x;
        this.dragStartY = e.global.y;
        this.initialMoveStates = afterSelect.map((el) => ({
          id: el.id,
          x: Number(el.x),
          y: Number(el.y),
        }));
      }
      return;
    }

    // 点击空白：开始框选或清空选中
    if (!hitElementId && e.button === 0) {
      this.ensureMarquee();
      this.isMarqueeSelecting = true;
      this.marqueeStartX = e.global.x;
      this.marqueeStartY = e.global.y;
      this.marqueeEndX = e.global.x;
      this.marqueeEndY = e.global.y;
      this.updateMarqueeVisual();

      if (!e.ctrlKey && !e.metaKey) {
        this.store.selectElement(null);
      }
    }
  }

  onPointerMove(e: FederatedPointerEvent) {
    const currentX = e.global.x;
    const currentY = e.global.y;

    // 组变形
    if (
      this.isTransforming &&
      this.transformHandle &&
      this.transformItems.length > 0
    ) {
      const handle = this.transformHandle;

      // 旋转
      if (handle === "rotate") {
        const startAngle = Math.atan2(
          this.transformStartY - this.groupCenterY,
          this.transformStartX - this.groupCenterX
        );
        const currentAngle = Math.atan2(
          currentY - this.groupCenterY,
          currentX - this.groupCenterX
        );
        const delta = currentAngle - startAngle;

        this.transformItems.forEach((item) => {
          const newRot = item.rotation + delta;

          const vx = item.centerX - this.groupCenterX;
          const vy = item.centerY - this.groupCenterY;
          const cos = Math.cos(delta);
          const sin = Math.sin(delta);
          const rx = vx * cos - vy * sin;
          const ry = vx * sin + vy * cos;

          const newCx = this.groupCenterX + rx;
          const newCy = this.groupCenterY + ry;

          const newX = newCx - item.width / 2;
          const newY = newCy - item.height / 2;

          this.store.updateElement(item.id, {
            x: newX,
            y: newY,
            rotation: newRot,
          });
        });
        return;
      }

      // 缩放
      const init = this.groupInitialBounds;
      let scaleX = 1;
      let scaleY = 1;
      const ddx = currentX - this.transformStartX;
      const ddy = currentY - this.transformStartY;

      if (handle.includes("r")) scaleX = (init.width + ddx) / init.width;
      if (handle.includes("l")) scaleX = (init.width - ddx) / init.width;
      if (handle.includes("b")) scaleY = (init.height + ddy) / init.height;
      if (handle.includes("t")) scaleY = (init.height - ddy) / init.height;

      scaleX = Math.max(scaleX, 0.1);
      scaleY = Math.max(scaleY, 0.1);

      this.transformItems.forEach((item) => {
        const relCx = item.centerX - this.groupCenterX;
        const relCy = item.centerY - this.groupCenterY;

        const newCx = this.groupCenterX + relCx * scaleX;
        const newCy = this.groupCenterY + relCy * scaleY;

        const newW = item.width * scaleX;
        const newH = item.height * scaleY;

        const newX = newCx - newW / 2;
        const newY = newCy - newH / 2;

        this.store.updateElement(item.id, {
          x: newX,
          y: newY,
          width: newW,
          height: newH,
        });
      });
      return;
    }

    // 框选中的拖动更新
    if (this.isMarqueeSelecting) {
      this.marqueeEndX = currentX;
      this.marqueeEndY = currentY;
      this.updateMarqueeVisual();
      return;
    }

    // 拖拽移动
    if (this.isDragging && this.initialMoveStates.length > 0) {
      const dx = currentX - this.dragStartX;
      const dy = currentY - this.dragStartY;

      this.initialMoveStates.forEach((init) => {
        this.store.updateElement(init.id, {
          x: init.x + dx,
          y: init.y + dy,
        });
      });
    }
  }

  onPointerUp(e: FederatedPointerEvent) {
    // 结束拖拽
    if (this.isDragging && this.initialMoveStates.length > 0) {
      const moves = this.initialMoveStates
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
        .filter((m) => m && (m.fromX !== m.toX || m.fromY !== m.toY)) as any[];

      if (moves.length > 0) {
        executeCommand(new MoveElementCommand(moves));
      }
    }

    // 结束框选
    if (this.isMarqueeSelecting) {
      const x1 = Math.min(this.marqueeStartX, this.marqueeEndX);
      const y1 = Math.min(this.marqueeStartY, this.marqueeEndY);
      const x2 = Math.max(this.marqueeStartX, this.marqueeEndX);
      const y2 = Math.max(this.marqueeStartY, this.marqueeEndY);

      const hitIds: string[] = [];
      this.store.elements.forEach((el) => {
        const ex1 = Number(el.x);
        const ey1 = Number(el.y);
        const ex2 = ex1 + Number(el.width);
        const ey2 = ey1 + Number(el.height);

        const intersect = !(ex2 < x1 || ex1 > x2 || ey2 < y1 || ey1 > y2);
        if (intersect) hitIds.push(el.id);
      });

      if (hitIds.length > 0) {
        if (!e.ctrlKey && !e.metaKey) {
          this.store.selectElement(null);
        }
        hitIds.forEach((id) => this.store.selectElement(id, true));
      }

      this.hideMarquee();
    }

    // 重置状态
    this.isDragging = false;
    this.initialMoveStates = [];

    this.isTransforming = false;
    this.transformHandle = null;
    this.transformItems = [];

    this.isMarqueeSelecting = false;
  }
}
