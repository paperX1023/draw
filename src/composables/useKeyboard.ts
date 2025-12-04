import { onMounted, onUnmounted } from 'vue';
import { useEditorStore } from '@/stores/editorStore';
import { executeCommand, undo, redo } from '@/core/history/HistoryManager';
import { DeleteElementCommand } from '@/core/commands/DeleteElementCommand';
import { DuplicateElementsCommand } from '@/core/commands/DuplicateElementsCommand';
import type { IElement } from '@/types/elements';
import { toRaw } from 'vue';

export function useKeyboard() {
  const store = useEditorStore();

  // 内存剪贴板
  let clipboard: IElement[] | null = null;

  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    const isCtrl = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    // 撤销 / 重做
    if (isCtrl && !e.shiftKey && key === 'z') {
      e.preventDefault();
      undo();
      return;
    }

    if (isCtrl && (key === 'y' || (e.shiftKey && key === 'z'))) {
      e.preventDefault();
      redo();
      return;
    }

    // 删除
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isCtrl) {
      if (store.selectedElements.length > 0) {
        e.preventDefault();
        executeCommand(new DeleteElementCommand(store.selectedElements));
      }
      return;
    }

    // Ctrl + D 
    if (isCtrl && key === 'd') {
      if (store.selectedElements.length > 0) {
        e.preventDefault();
        executeCommand(new DuplicateElementsCommand(store.selectedElements));
      }
      return;
    }

    // Ctrl + C
    if (isCtrl && key === 'c') {
      if (store.selectedElements.length > 0) {
        e.preventDefault();
        // 深拷贝一份到内存剪贴板
        clipboard = store.selectedElements.map((el) =>
          structuredClone(toRaw(el))
        );
      }
      return;
    }

    // 从剪贴板粘贴 Ctrl + V
    if (isCtrl && key === 'v') {
      if (clipboard && clipboard.length > 0) {
        e.preventDefault();
        executeCommand(new DuplicateElementsCommand(clipboard));
      }
      return;
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
}