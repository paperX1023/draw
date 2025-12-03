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

// 初始化核心类
const engine = PixiEngine.getInstance();
const manager = new CanvasManager(); 
const store = useEditorStore();

const finishEditing = () => {
  editingId.value = null;
  // 编辑结束，刷新选中框
  manager.updateTransformer(store.selectedElements);
};

onMounted(async () => {
  if (canvasContainer.value) {
    // 初始化引擎
    await engine.init(canvasContainer.value);
    
    // 初始化交互 (所有事件逻辑都在 Manager 里)
    manager.initInteraction();

    // 绑定双击编辑回调 (从 Core 通知 UI)
    manager.onEditStart = (id: string) => {
      editingId.value = id;
    };
    manager.onEditEnd = () => {
      finishEditing();
    };

    // 初始数据渲染
    await store.initFromStorage(); 
    await nextTick();
    console.log('🔄 渲染器启动，加载图元:', store.elements.length);
    
    // 初始全量渲染
    store.elements.forEach(el => manager.renderElement(el));
    
    // 监听数据变化 (UI -> Core)
    watch(() => store.elements, (newElements) => {
      newElements.forEach(el => manager.renderElement(el));
      manager.garbageCollect(newElements);
      
      if (!editingId.value) {
        manager.updateTransformer(store.selectedElements);
      }
    }, { deep: true });

    // 监听选中变化
    watch(() => store.selectedElements, (newSelected) => {
      if (!editingId.value) {
        manager.updateTransformer(newSelected);
      }
    }, { deep: true });

    // 监听工具变化 (连接 ToolManager)
    watch(() => store.activeTool, (newTool) => {
      manager.setTool(newTool);
    }, { immediate: true });
  }
});

onUnmounted(() => {
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