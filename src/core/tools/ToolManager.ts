import { useEditorStore } from "@/stores/editorStore";
import type { ITool } from "./ITool";
import { SelectTool } from "./SelectTool";
import { DrawTool } from "./DrawTool";
import type { FederatedPointerEvent } from "pixi.js";

export class ToolManager {
  private tools: Map<string, ITool> = new Map();
  private _currentTool: ITool;

  constructor() {
    this.register(new SelectTool());
    this.register(new DrawTool("rect"));
    this.register(new DrawTool("circle"));
    this.register(new DrawTool("triangle"));
    this.register(new DrawTool("text"));

    this._currentTool = this.tools.get("select")!;
  }

  private register(tool: ITool) {
    this.tools.set(tool.name, tool);
  }

  public get currentTool(): ITool {
    return this._currentTool;
  }

  public setTool(name: string) {
    const nextTool = this.tools.get(name);
    if (!nextTool) {
      console.warn(`Tool "${name}" not found.`);
      return;
    }

    if (this.currentTool === nextTool) return;

    this._currentTool.onDeactivate();
    this._currentTool = nextTool;
    this._currentTool.onActivate();
  }

  onDown(e: FederatedPointerEvent, hitElementId: string | null) {
    this._currentTool?.onPointerDown(e, hitElementId);
  }

  public onMove(e: FederatedPointerEvent) {
    this._currentTool.onPointerMove(e);
  }

  public onUp(e: FederatedPointerEvent) {
    this._currentTool.onPointerUp(e);
  }
}
