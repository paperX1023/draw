import { Command } from './Command';
import { useEditorStore } from '@/stores/editorStore';
import { toRaw } from 'vue';

export class UpdateElementCommand extends Command {
  private elementId: string;
  private oldProps: any;
  private newProps: any;

  constructor(elementId: string, oldProps: any, newProps: any) {
    super('UpdateElement');
    this.elementId = elementId;
    // 深拷贝
    this.oldProps = structuredClone(toRaw(oldProps));
    this.newProps = structuredClone(toRaw(newProps));
  }

  execute() {
    const store = useEditorStore();
    store.updateElement(this.elementId, this.newProps);
  }

  undo() {
    const store = useEditorStore();
    store.updateElement(this.elementId, this.oldProps);
  }
}