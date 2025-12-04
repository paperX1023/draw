<template>
  <div ref="canvasContainer" class="canvas-wrapper">
    <TextEditorOverlay 
      v-if="editingId" 
      :elementId="editingId" 
      @finish="finishEditing"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { PixiEngine } from '@/core/render/PixiEngine';
import { CanvasManager } from '@/core/render/CanvasManager';
import { useEditorStore } from '@/stores/editorStore';
import TextEditorOverlay from '@/components/editor/TextEditorOverlay.vue';

const canvasContainer = ref<HTMLElement | null>(null);
const editingId = ref<string | null>(null);

const engine = PixiEngine.getInstance();
const manager = new CanvasManager();
const store = useEditorStore();

let wheelHandler: ((ev: WheelEvent) => void) | null = null;

// 画布拖动状态
let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;
let mouseDownHandler: ((ev: MouseEvent) => void) | null = null;
let mouseMoveHandler: ((ev: MouseEvent) => void) | null = null;
let mouseUpHandler: ((ev: MouseEvent) => void) | null = null;

const finishEditing = () => {
  editingId.value = null;
  manager.updateTransformer(store.selectedElements);
};

onMounted(async () => {
  if (!canvasContainer.value) return;

  // 初始化引擎
  await engine.init(canvasContainer.value);

  // 初始化交互
  manager.initInteraction();

  // 双击开始编辑
  manager.onEditStart = (id: string) => {
    editingId.value = id;
  };
  manager.onEditEnd = () => {
    finishEditing();
  };

  // 初始数据渲染
  await store.initFromStorage();
  await nextTick();

  store.elements.forEach(el => manager.renderElement(el));

  // elements 变化 -> 渲染 + 垃圾回收 + 更新 transformer
  watch(
    () => store.elements,
    (newElements) => {
      newElements.forEach(el => manager.renderElement(el));
      manager.garbageCollect(newElements);

      if (!editingId.value) {
        manager.updateTransformer(store.selectedElements);
      }
    },
    { deep: true },
  );

  // 滚轮缩放
  wheelHandler = (ev: WheelEvent) => {
    ev.preventDefault();
    const delta = ev.deltaY;
    const factor = delta > 0 ? 0.9 : 1.1;
    engine.setZoomAt(factor, ev.clientX, ev.clientY);
  };

  canvasContainer.value.addEventListener('wheel', wheelHandler, { passive: false });

  // 中键 / Shift+左键 拖动画布
  mouseDownHandler = (ev: MouseEvent) => {
    const isMiddle = ev.button === 1;
    const isShiftLeft = ev.button === 0 && ev.shiftKey;
    if (!isMiddle && !isShiftLeft) return;

    isPanning = true;
    lastPanX = ev.clientX;
    lastPanY = ev.clientY;
  };

  mouseMoveHandler = (ev: MouseEvent) => {
    if (!isPanning) return;
    const dx = ev.clientX - lastPanX;
    const dy = ev.clientY - lastPanY;
    lastPanX = ev.clientX;
    lastPanY = ev.clientY;
    engine.panBy(dx, dy);
  };

  mouseUpHandler = () => {
    isPanning = false;
  };

  canvasContainer.value.addEventListener('mousedown', mouseDownHandler);
  window.addEventListener('mousemove', mouseMoveHandler);
  window.addEventListener('mouseup', mouseUpHandler);

  // 选中变化 -> 更新 transformer
  watch(
    () => store.selectedElements,
    (newSelected) => {
      if (!editingId.value) {
        manager.updateTransformer(newSelected);
      }
    },
    { deep: true },
  );

  // 工具变化
  watch(
    () => store.activeTool,
    (newTool) => {
      manager.setTool(newTool);
    },
    { immediate: true },
  );
});

onUnmounted(() => {
  if (canvasContainer.value && wheelHandler) {
    canvasContainer.value.removeEventListener('wheel', wheelHandler);
    wheelHandler = null;
  }
  if (canvasContainer.value && mouseDownHandler) {
    canvasContainer.value.removeEventListener('mousedown', mouseDownHandler);
  }
  if (mouseMoveHandler) {
    window.removeEventListener('mousemove', mouseMoveHandler);
  }
  if (mouseUpHandler) {
    window.removeEventListener('mouseup', mouseUpHandler);
  }

  engine.destroy();
});
</script>

<style scoped>
.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>