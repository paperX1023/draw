import { Command } from './Command';
import { useEditorStore } from '@/stores/editorStore';
import type { IElement } from '@/types/elements';

export class CreateElementCommand extends Command {
  private element: IElement;

  constructor(element: IElement) {
    super('CreateElement');
    this.element = element;
  }

  execute() {
    const store = useEditorStore();
    const exists = store.elements.find(e => e.id === this.element.id);
    if (!exists) {
      store.elements.push(this.element);
    }
    store.selectElement(this.element.id);
  }

  undo() {
    const store = useEditorStore();
    const index = store.elements.findIndex(e => e.id === this.element.id);
    if (index > -1) {
      store.elements.splice(index, 1);
    }
    store.selectElement(null);
  }
}