import { Command } from './Command';
import { useEditorStore } from '@/stores/editorStore';
import type { IElement } from '@/types/elements';
import { toRaw } from 'vue';

export class DeleteElementCommand extends Command {
  private deletedElements: IElement[];

  constructor(elements: IElement[]) {
    super('DeleteElement');
    this.deletedElements = elements.map(el => structuredClone(toRaw(el)));
  }

  execute() {
    const store = useEditorStore();
    const ids = this.deletedElements.map(e => e.id);
    store.elements = store.elements.filter(e => !ids.includes(e.id));
    store.selectElement(null);
  }

  undo() {
    const store = useEditorStore();
    store.elements.push(...this.deletedElements);
    // 恢复
    if (this.deletedElements.length > 0) {
      store.selectElement(this.deletedElements[0].id);
    }
  }
}