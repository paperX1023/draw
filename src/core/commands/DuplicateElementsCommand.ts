import { Command } from './Command';
import { useEditorStore } from '@/stores/editorStore';
import type { IElement } from '@/types/elements';
import { toRaw } from 'vue';

const genId = () =>
  'el-' + Date.now() + Math.random().toString(36).slice(2, 8);

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export class DuplicateElementsCommand extends Command {
  private created: IElement[];

  constructor(source: IElement[]) {
    super('DuplicateElements');

    this.created = source.map((el) => {
      // 深拷贝原元素
      const clone = structuredClone(toRaw(el)) as Mutable<IElement>;

      // 改 id、位置
      clone.id = genId();
      clone.x = Number(clone.x) + 20;
      clone.y = Number(clone.y) + 20;

      return clone as IElement;
    });
  }

  execute() {
    const store = useEditorStore();
    store.elements.push(...this.created);

    store.selectElement(null);
    this.created.forEach((el) => store.selectElement(el.id, true));
  }

  undo() {
    const store = useEditorStore();
    const ids = new Set(this.created.map((e) => e.id));
    store.elements = store.elements.filter((e) => !ids.has(e.id));
    store.selectElement(null);
  }
}
