import type { ITool } from './ITool';
import { useEditorStore } from '@/stores/editorStore';
import type { FederatedPointerEvent } from 'pixi.js';

export abstract class BaseTool implements ITool {
  abstract name: string;
  
  protected get store() {
    return useEditorStore();
  }

  onActivate() {}
  onDeactivate() {}
  abstract onPointerDown(e: FederatedPointerEvent): void;
  abstract onPointerMove(e: FederatedPointerEvent): void;
  abstract onPointerUp(e: FederatedPointerEvent): void;
}