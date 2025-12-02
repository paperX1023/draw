import { Container, FederatedPointerEvent } from 'pixi.js';
import { PixiEngine } from './PixiEngine'; 
import { updateOrCreateShape } from '@/rendering/pixi/ShapeFactory';
import { getTransformer, drawTransformer, type TransformHandleType } from '@/rendering/pixi/Transformer';
import { useInteraction, type IInteractionPayload } from '@/composables/useInteraction';
import { useEditorStore } from '@/stores/editorStore';

interface IElementData {
  id: string;
  [key: string]: any;
}

export class CanvasManager {
  private engine: PixiEngine;
  private pixiObjectMap = new Map<string, Container>();
  
  // 双击检测状态
  private lastClickTime = 0;
  private lastClickId: string | null = null;

  // 回调函数：通知 Vue 组件显示/隐藏编辑器
  public onEditStart: (id: string) => void = () => {};
  public onEditEnd: () => void = () => {};

  constructor() {
    this.engine = PixiEngine.getInstance();
  }

  // 初始化交互事件
  public initInteraction() {
    const stage = this.engine.stage;
    
    if (!stage) {
      console.error('PixiJS v8 Stage not initialized yet.');
      return;
    }

    const { handlePointerDown, handlePointerMove, handlePointerUp } = useInteraction();
    const store = useEditorStore();

    // 点击
    stage.on('pointerdown', (e: FederatedPointerEvent) => {
      // 如果正在编辑，点击背景关闭编辑
      this.onEditEnd();
      
      store.selectElement(null); 
      
      const payload: IInteractionPayload = { globalX: e.global.x, globalY: e.global.y };
      handlePointerDown(payload, null);
    });

    stage.on('pointermove', (e: FederatedPointerEvent) => {
        const payload: IInteractionPayload = { globalX: e.global.x, globalY: e.global.y };
        handlePointerMove(payload);
    });
    
    stage.on('pointerup', handlePointerUp);
    stage.on('pointerupoutside', handlePointerUp);

    // 初始化 Transformer
    getTransformer(stage);
  }

  // 渲染单个元素
  public renderElement(elementData: IElementData) {
    const stage = this.engine.stage;
    if (!stage) return;

    let displayObject = this.pixiObjectMap.get(elementData.id);
    
    const newDisplayObject = updateOrCreateShape(elementData as any, displayObject);

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

      displayObject.on('pointerdown', (e: FederatedPointerEvent) => {
        this.handleElementClick(elementData.id, e);
      });
    }
  }

  // 核心点击逻辑
  private handleElementClick(elementId: string, e: FederatedPointerEvent) {
    e.stopPropagation();
    
    const store = useEditorStore(); // 🟢 获取 Store
    const { handlePointerDown } = useInteraction();

    const now = Date.now();
    const diff = now - this.lastClickTime;

    if (this.lastClickId === elementId && diff < 300) {
      // 双击
      this.onEditStart(elementId);
      drawTransformer([], null); 
    } else {
      // 单击
      const isMultiple = e.ctrlKey || e.metaKey; 
      
      store.selectElement(elementId, isMultiple); 
      
      const payload: IInteractionPayload = { globalX: e.global.x, globalY: e.global.y };
      handlePointerDown(payload, elementId);
    }

    this.lastClickTime = now;
    this.lastClickId = elementId;
  }

  // 垃圾回收
  public garbageCollect(currentElements: IElementData[]) {
    const stage = this.engine.stage;
    if (!stage) return;

    const validIds = new Set(currentElements.map(e => e.id));
    
    for (const [id, displayObject] of this.pixiObjectMap.entries()) {
      if (!validIds.has(id)) {
        stage.removeChild(displayObject);
        displayObject.destroy();
        this.pixiObjectMap.delete(id);
      }
    }
  }

  // 更新 Transformer
  public updateTransformer(selectedElements: any[]) {
    const { handleTransformStart } = useInteraction();
    
    if (!selectedElements || selectedElements.length === 0) {
      drawTransformer([], null);
      return;
    }

    drawTransformer(selectedElements, (handleType: TransformHandleType, e: FederatedPointerEvent) => {
      e.stopPropagation(); 
      
      const payload: IInteractionPayload = { globalX: e.global.x, globalY: e.global.y };
      handleTransformStart(handleType, payload);
    });
  }
}