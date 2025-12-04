import { Container, FederatedPointerEvent } from "pixi.js";
import { PixiEngine } from "./PixiEngine";
import { updateOrCreateShape } from "@/rendering/pixi/ShapeFactory";
import {
  getTransformer,
  drawTransformer,
  type TransformHandleType,
  type TransformTargetLike,
} from "@/rendering/pixi/Transformer";
import { useEditorStore } from "@/stores/editorStore";
import { ToolManager } from "@/core/tools/ToolManager";
import { SelectTool } from "@/core/tools/SelectTool";

interface IElementData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  [key: string]: any;
}

export class CanvasManager {
  private engine: PixiEngine;
  private toolManager: ToolManager;
  private pixiObjectMap = new Map<string, Container>();

  private store = useEditorStore();

  // 回调函数
  public onEditStart: (id: string) => void = () => {};
  public onEditEnd: () => void = () => {};

  constructor() {
    this.engine = PixiEngine.getInstance();
    this.toolManager = new ToolManager();
  }

  public setTool(toolName: string) {
    this.toolManager.setTool(toolName);
  }

  // 初始化交互事件
  public initInteraction() {
    const stage = this.engine.stage;
    if (!stage) return;

    const store = this.store;

    stage.on("pointerdown", (e: FederatedPointerEvent) => {
      this.onEditEnd();
      this.toolManager.onDown(e, null);
    });

    stage.on("pointermove", (e: FederatedPointerEvent) => {
      this.toolManager.onMove(e);
    });

    stage.on("pointerup", (e: FederatedPointerEvent) => {
      this.toolManager.onUp(e);
    });

    stage.on("pointerupoutside", (e: FederatedPointerEvent) => {
      this.toolManager.onUp(e);
    });

    getTransformer(stage);
  }

  // 渲染单个元素
  public renderElement(elementData: IElementData) {
    const stage = this.engine.stage;
    if (!stage) return;

    let displayObject = this.pixiObjectMap.get(elementData.id);

    const newDisplayObject = updateOrCreateShape(
      elementData as any,
      displayObject
    );

    if (!newDisplayObject) {
      if (displayObject) {
        stage.removeChild(displayObject);
        displayObject.destroy();
        this.pixiObjectMap.delete(elementData.id);
      }
      return;
    }

    displayObject = newDisplayObject as Container;

    if (!this.pixiObjectMap.has(elementData.id)) {
      this.pixiObjectMap.set(elementData.id, displayObject);
      stage.addChild(displayObject);

      displayObject.eventMode = "static";
      displayObject.cursor = "pointer";

      // 单击选中 + 工具交互
      displayObject.on("pointerdown", (e: FederatedPointerEvent) => {
        this.handleElementDown(elementData.id, e);
      });

      // 判断是否双击
      displayObject.on("pointertap", (e: FederatedPointerEvent) => {
        this.handleElementTap(elementData.id, e);
      });
    }
  }

  // 单击：选中 + 交给工具
  private handleElementDown(elementId: string, e: FederatedPointerEvent) {
    e.stopPropagation();

    const isMultiple = e.ctrlKey || e.metaKey;
    this.store.selectElement(elementId, isMultiple);

    this.toolManager.onDown(e, elementId);
  }

  private handleElementTap(elementId: string, e: FederatedPointerEvent) {
    e.stopPropagation();

    const detail = (e as any).detail ?? 1;

    if (detail >= 2) {
      console.log("[CanvasManager] double tap -> edit start", elementId);
      this.onEditStart(elementId);
      drawTransformer([], null);
    }
  }

  // 垃圾回收
  public garbageCollect(currentElements: IElementData[]) {
    const stage = this.engine.stage;
    if (!stage) return;

    const validIds = new Set(currentElements.map((e) => e.id));
    for (const [id, displayObject] of this.pixiObjectMap.entries()) {
      if (!validIds.has(id)) {
        stage.removeChild(displayObject);
        displayObject.destroy();
        this.pixiObjectMap.delete(id);
      }
    }
  }

  public updateTransformer(selectedElements: IElementData[]) {
    if (!selectedElements || selectedElements.length === 0) {
      drawTransformer([], null);
      return;
    }

    const targets: TransformTargetLike[] = selectedElements.map((el) => ({
      x: Number(el.x) || 0,
      y: Number(el.y) || 0,
      width: Number(el.width) || 0,
      height: Number(el.height) || 0,
      rotation: Number(el.rotation) || 0,
    }));

    drawTransformer(
      targets,
      (handleType: TransformHandleType, e: FederatedPointerEvent) => {
        e.stopPropagation();

        const currentTool = this.toolManager.currentTool;
        if (currentTool instanceof SelectTool) {
          currentTool.onTransformStart(handleType, {
            globalX: e.global.x,
            globalY: e.global.y,
          });
        }
      }
    );
  }
}
