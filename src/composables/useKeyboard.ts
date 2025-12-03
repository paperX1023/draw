import { onMounted, onUnmounted } from 'vue';
import { useEditorStore } from '@/stores/editorStore';
import { executeCommand, undo, redo } from '@/core/history/HistoryManager';
import { DeleteElementCommand } from '@/core/commands/DeleteElementCommand';

export function useKeyboard() {
    const store = useEditorStore();

    const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        const isCtrl = e.ctrlKey || e.metaKey;

        // 撤销 Ctrl+Z
        if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            undo();
        }
        // 重做 Ctrl+Y
        else if (isCtrl && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            redo();
        }
        // 删除 Delete / Backspace
        else if (e.key === 'Delete' || e.key === 'Backspace') {
            if (store.selectedElements.length > 0) {
                e.preventDefault();
                
                executeCommand(new DeleteElementCommand(store.selectedElements));
            }
        }
    };

    onMounted(() => {
        window.addEventListener('keydown', handleKeyDown);
    });

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown);
    });
}