<template>
  <div class="editor-container">
    <EditorHeader class="header-bar" />

    <div class="workspace">
      <ToolboxPanel />

      <div class="canvas-wrapper">
        <CanvasRenderer />
      </div>

      <PropertyPanel class="property-sidebar" />
    </div>
  </div>
</template>

<script setup>
import EditorHeader from '../components/layout/EditorHeader.vue';
import ToolboxPanel from '../components/layout/ToolboxPanel.vue';
import PropertyPanel from '../components/layout/PropertyPanel.vue';
import CanvasRenderer from '../rendering/vue/CanvasRenderer.vue';

import { useKeyboard } from '../composables/useKeyboard';
useKeyboard();
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #f8f9fa; /* 整体浅灰底 */
  overflow: hidden;
  color: #1f2937;
  font-family: 'Inter', sans-serif;
}

.header-bar {
  z-index: 20;
  background: white;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.workspace {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  z-index: 0;
  background-color: #f3f4f6; /* 画布背景 */

  background-image: radial-gradient(#cfd8dc 1.5px, transparent 1.5px);
  background-size: 24px 24px; /* 网格间距 */
  box-shadow: inset 0 0 40px rgba(0,0,0,0.02);
}

.property-sidebar {
  width: 260px;
  background: white;
  border-left: 1px solid rgba(0,0,0,0.06);
  z-index: 10;
}
</style>