import { Command } from './Command';
import { useEditorStore } from '@/stores/editorStore';

export interface IElementTransformState {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface IElementTransformChange {
  id: string;
  from: IElementTransformState;
  to: IElementTransformState;
}

export class TransformElementsCommand extends Command {
  private changes: IElementTransformChange[];

  constructor(changes: IElementTransformChange[]) {
    super('TransformElements');
    this.changes = changes;
  }

  execute() {
    const store = useEditorStore();
    this.changes.forEach(c => {
      store.updateElement(c.id, { 
        x: c.to.x,
        y: c.to.y,
        width: c.to.width,
        height: c.to.height,
        rotation: c.to.rotation,
      });
    });
  }

  undo() {
    const store = useEditorStore();
    this.changes.forEach(c => {
      store.updateElement(c.id, { 
        x: c.from.x,
        y: c.from.y,
        width: c.from.width,
        height: c.from.height,
        rotation: c.from.rotation,
      });
    });
  }
}
