<template>
  <div ref="canvasRef" class="canvas-wrapper">
    <TextEditorOverlay
        v-if="editingElementId"
        :elementId="editingElementId"
        @finish="endEditing"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRenderer } from '../../composables/useRenderer';
import { useEditorState } from '../../composables/useEditorState';
import { useInteraction } from '../../composables/useInteraction';
import { updateOrCreateShape } from '../pixi/ShapeFactory';
import { drawTransformer } from '../pixi/Transformer';
import TextEditorOverlay from '../../components/editor/TextEditorOverlay.vue';

const canvasRef = ref(null);
const editingElementId = ref(null);

const { initRenderer, cleanupHandler, getStage } = useRenderer();
const { state, selectElement, selectedElements } = useEditorState();
const { handlePointerDown, handlePointerMove, handlePointerUp } = useInteraction();

const pixiObjectMap = new Map();
let lastClickTime = 0;
let lastClickId = null;

const endEditing = () => {
  console.log('✅ 结束编辑');
  editingElementId.value = null;
};

// --- 核心修复区域 ---
const handleElementClick = (elementId, e) => {
  // 【修复 1】：无论单击还是双击，第一件事就是阻止事件冒泡！
  // 这样舞台（Stage）就永远收不到这次点击，就不会触发 endEditing 了
  e.stopPropagation();

  const now = Date.now();
  const diff = now - lastClickTime;

  // 双击判断
  if (lastClickId === elementId && diff < 300) {
    console.log('🚀 触发双击！进入编辑模式');
    editingElementId.value = elementId;
    selectElement(null); // 隐藏蓝色选中框，避免遮挡
  } else {
    // 单击判断
    console.log('🖱️ 单击选中');
    const isMultiple = e.ctrlKey || e.metaKey;
    selectElement(elementId, isMultiple);
    handlePointerDown({ globalX: e.global.x, globalY: e.global.y }, elementId);
  }

  lastClickTime = now;
  lastClickId = elementId;
};
// --------------------

const renderElement = (elementData) => {
  const stage = getStage();
  if (!stage) return;

  let displayObject = pixiObjectMap.get(elementData.id);
  displayObject = updateOrCreateShape(elementData, displayObject);

  if (!pixiObjectMap.has(elementData.id)) {
    pixiObjectMap.set(elementData.id, displayObject);
    stage.addChild(displayObject);

    displayObject.on('pointerdown', (e) => {
      handleElementClick(elementData.id, e);
    });
  }
};

onMounted(() => {
  if (canvasRef.value) {
    initRenderer(canvasRef.value);
    const stage = getStage();

    // 舞台背景点击
    stage.on('pointerdown', (e) => {
      // 只有当点击真正落在背景上（没被 stopPropagation 拦截）时才会执行这里
      if (editingElementId.value) {
        console.log('点击背景 -> 关闭编辑器');
        endEditing();
        return;
      }
      console.log('点击背景 -> 取消选中');
      selectElement(null); // 确保清空选中
      handlePointerDown({ globalX: e.global.x, globalY: e.global.y }, null);
    });

    stage.on('pointermove', (e) => {
      handlePointerMove({ globalX: e.global.x, globalY: e.global.y });
    });

    stage.on('pointerup', handlePointerUp);
    stage.on('pointerupoutside', handlePointerUp);

    state.elements.forEach(renderElement);
    watch(() => state.elements, (newElements) => {
      newElements.forEach(renderElement);
    }, { deep: true });

    watch(selectedElements, (newSelected) => {
      if (editingElementId.value) return;
      drawTransformer(newSelected);
    }, { deep: true });
  }
});

onUnmounted(() => {
  if (cleanupHandler) cleanupHandler();
});
</script>

<style scoped>
.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>