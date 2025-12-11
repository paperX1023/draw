<template>
  <header class="editor-header">
    <div class="left-section">
      <div class="menu-btn">☰</div>
      <div class="file-name">未命名文件</div>
    </div>

    <div class="center-controls">
      <button @click="undo" :disabled="!canUndoState" class="icon-btn" title="撤销">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6M3 10l6-6" />
        </svg>
      </button>
      <button @click="redo" :disabled="!canRedoState" class="icon-btn" title="重做">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10H11a8 8 0 0 0-8 8v2M21 10l-6 6M21 10l-6-6" />
        </svg>
      </button>
    </div>

  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { undo, redo, canUndo, canRedo, subscribe } from '@/core/history/HistoryManager';

const canUndoState = ref<boolean>(canUndo());
const canRedoState = ref<boolean>(canRedo());

const updateHistoryState = () => {
  canUndoState.value = canUndo();
  canRedoState.value = canRedo();
};

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  unsubscribe = subscribe(updateHistoryState);
  updateHistoryState();
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<style scoped>
.editor-header {
  height: 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background: #fff;
}

.left-section,
.right-section,
.center-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-name {
  font-weight: 500;
  font-size: 14px;
}

.menu-btn {
  cursor: pointer;
  padding: 4px;
}

.center-controls {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #000;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.primary-btn {
  background: #000;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
</style>