<template>
  <div
    ref="canvasContainer"
    class="canvas-wrapper"
    :class="{ 'is-panning': isPanning }"
  >
    <TextEditorOverlay 
      v-if="editingId" 
      :elementId="editingId" 
      @finish="finishEditing"
    />

    <div class="zoom-widget">
      <button @click="zoomOut">-</button>
      <span>{{ Math.round(currentZoom * 100) }}%</span>
      <button @click="zoomIn">+</button>
      <button class="reset" @click="resetView">重置</button>
    </div>

    <div v-if="showHint" class="canvas-hint">
      <span>滚轮缩放画布 Shift+鼠标左键拖动画布平移</span>
      <button @click="showHint = false">知道了</button>
    </div>
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

// 当前缩放显示
const currentZoom = ref(1);

// 是否在拖动画布
const isPanning = ref(false);

// 是否显示操作提示
const showHint = ref(true);

let wheelHandler: ((ev: WheelEvent) => void) | null = null;
let mouseDownHandler: ((ev: MouseEvent) => void) | null = null;
let mouseMoveHandler: ((ev: MouseEvent) => void) | null = null;
let mouseUpHandler: ((ev: MouseEvent) => void) | null = null;

let lastPanX = 0;
let lastPanY = 0;

// ✅ 编辑结束：恢复 Pixi 元素可见 + 更新 transformer
const finishEditing = () => {
  if (editingId.value) {
    // 结束编辑时，让该元素重新显示
    store.updateElement(editingId.value, { visible: true });
  }

  editingId.value = null;
  manager.updateTransformer(store.selectedElements);
};

// 以画布中心放大 / 缩小
const zoomAtCenter = (factor: number) => {
  if (!canvasContainer.value) return;
  const rect = canvasContainer.value.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  engine.setZoomAt(factor, cx, cy);
  currentZoom.value = engine.zoom;
};

const zoomIn = () => {
  zoomAtCenter(1.1);
};

const zoomOut = () => {
  zoomAtCenter(0.9);
};

const resetView = () => {
  if (!engine.stage) return;

  // 重置
  engine.stage.scale.x = 1;
  engine.stage.scale.y = 1;
  engine.stage.position.x = 0;
  engine.stage.position.y = 0;

  (engine as any)._zoom = 1;

  currentZoom.value = 1;
};

onMounted(async () => {
  if (!canvasContainer.value) return;

  // 初始化引擎
  await engine.init(canvasContainer.value);
  currentZoom.value = engine.zoom;

  // 初始化交互
  manager.initInteraction();

  // ✅ 双击开始编辑：记录 id + 隐藏 Pixi 文本
  manager.onEditStart = (id: string) => {
    editingId.value = id;
    // 在 store 里把该元素设为不可见
    store.updateElement(id, { visible: false });
  };

  // ✅ TextEditorOverlay 内部 blur / Enter 后 emit('finish') → 这里结束编辑
  manager.onEditEnd = () => {
    finishEditing();
  };

  // 初始数据渲染
  await store.initFromStorage();
  await nextTick();

  store.elements.forEach(el => manager.renderElement(el));

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
    const factor = ev.deltaY > 0 ? 0.9 : 1.1;
    engine.setZoomAt(factor, ev.clientX, ev.clientY);
    currentZoom.value = engine.zoom;
  };

  canvasContainer.value.addEventListener('wheel', wheelHandler, { passive: false });

  // Shift+左键 / 中键 拖动画布
  mouseDownHandler = (ev: MouseEvent) => {
    const isMiddle = ev.button === 1;
    const isShiftLeft = ev.button === 0 && ev.shiftKey;
    if (!isMiddle && !isShiftLeft) return;

    isPanning.value = true;
    lastPanX = ev.clientX;
    lastPanY = ev.clientY;
  };

  mouseMoveHandler = (ev: MouseEvent) => {
    if (!isPanning.value) return;
    const dx = ev.clientX - lastPanX;
    const dy = ev.clientY - lastPanY;
    lastPanX = ev.clientX;
    lastPanY = ev.clientY;
    engine.panBy(dx, dy);
  };

  mouseUpHandler = () => {
    isPanning.value = false;
  };

  canvasContainer.value.addEventListener('mousedown', mouseDownHandler);
  window.addEventListener('mousemove', mouseMoveHandler);
  window.addEventListener('mouseup', mouseUpHandler);

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

.canvas-wrapper.is-panning {
  cursor: grabbing;
}

.zoom-widget {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  box-shadow: 0 0 4px rgba(0,0,0,0.08);
  font-size: 12px;
  z-index: 10;
}

.zoom-widget button {
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  padding: 0 6px;
  cursor: pointer;
  font-size: 12px;
}

.zoom-widget .reset {
  margin-left: 4px;
  font-size: 11px;
}

.canvas-hint {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 6px 10px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

.canvas-hint button {
  border: none;
  background: transparent;
  color: #ffd86b;
  cursor: pointer;
  font-size: 12px;
}
</style>
