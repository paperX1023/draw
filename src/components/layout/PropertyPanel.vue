<template>
  <div class="property-panel">
    <h3>属性面板</h3>

    <div v-if="!currentElement" class="hint">
      <p>请在画布上选择一个元素</p>
    </div>

    <div v-else class="controls">
      <div class="section-header">
        <strong>元素 ID:</strong>
        <span class="id-text">{{ currentElement.id.slice(-6) }}</span>
      </div>

      <div class="control-group">
        <h5>位置与尺寸</h5>
        <div class="grid-2">
          <InputControl label="X" v-model.number="currentElement.x" @change="handleUpdate" />
          <InputControl label="Y" v-model.number="currentElement.y" @change="handleUpdate" />
          <InputControl label="W" v-model.number="currentElement.width" @change="handleUpdate" />
          <InputControl label="H" v-model.number="currentElement.height" @change="handleUpdate" />
        </div>
      </div>

      <div class="control-group">
        <h5>样式</h5>

        <div class="color-row">
          <label>填充</label>
          <div class="color-wrapper">
            <input
                type="color"
                :value="safeColorToHex(currentElement.style.fillColor)"
                @input="(e) => handleColorUpdate('fillColor', e.target.value)"
            />
            <button @click="clearFill" class="mini-btn" title="无填充">🚫</button>
          </div>
        </div>

        <div class="color-row">
          <label>边框</label>
          <input
              type="color"
              :value="safeColorToHex(currentElement.style.lineColor)"
              @input="(e) => handleColorUpdate('lineColor', e.target.value)"
          />
        </div>

        <InputControl label="线宽" v-model.number="currentElement.style.lineWidth" @change="handleStyleUpdate" />
      </div>

      <div v-if="currentElement.type === 'text' || currentElement.text" class="control-group">
        <h5>文本</h5>
        <div class="grid-2">
          <InputControl label="字号" v-model.number="currentElement.style.fontSize" @change="handleStyleUpdate" />
        </div>
        <div class="color-row">
          <label>颜色</label>
          <input
              type="color"
              :value="safeColorToHex(currentElement.style.color)"
              @input="(e) => handleColorUpdate('color', e.target.value)"
          />
        </div>
        <textarea
            class="text-content-edit"
            v-model="currentElement.text"
            @change="handleUpdate"
            rows="3"
            placeholder="输入文本内容"
        ></textarea>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useEditorState } from '../../composables/useEditorState';
// 假设您已经创建了 InputControl，如果没有，下面会提供简单的内联实现替代方案
import InputControl from '../base/InputControl.vue';

const { selectedElements, updateElement } = useEditorState();

const currentElement = computed(() => {
  return selectedElements.value.length === 1 ? selectedElements.value[0] : null;
});

// --- 核心修复：安全的颜色转换函数 ---
const safeColorToHex = (colorNum) => {
  // 【关键修复】如果颜色是 null 或 undefined，返回白色作为默认显示，防止报错
  if (colorNum === null || colorNum === undefined) {
    return '#FFFFFF';
  }
  return '#' + colorNum.toString(16).padStart(6, '0').toUpperCase();
};

// 通用更新
const handleUpdate = () => {
  if (currentElement.value) {
    // 触发响应式更新
    updateElement(currentElement.value.id, { ...currentElement.value });
  }
};

// 样式更新 (深层对象)
const handleStyleUpdate = () => {
  if (currentElement.value) {
    updateElement(currentElement.value.id, { style: { ...currentElement.value.style } });
  }
};

// 颜色更新
const handleColorUpdate = (key, hexString) => {
  if (currentElement.value) {
    const colorNum = parseInt(hexString.slice(1), 16);
    updateElement(currentElement.value.id, {
      style: { [key]: colorNum }
    });
  }
};

// 清除填充色 (变透明)
const clearFill = () => {
  if (currentElement.value) {
    updateElement(currentElement.value.id, {
      style: { fillColor: null }
    });
  }
};
</script>

<style scoped>
.property-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  font-size: 14px;
  color: #333;
}

h3, h5 { margin: 0 0 10px 0; color: #555; }
h5 { font-size: 12px; text-transform: uppercase; color: #999; margin-top: 10px; }

.hint { color: #999; text-align: center; margin-top: 50px; }

.control-group {
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.color-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.color-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mini-btn {
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 10px;
}

.text-content-edit {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px;
  font-family: inherit;
  resize: vertical;
}
</style>