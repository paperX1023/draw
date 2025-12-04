<template>
  <div class="property-panel">
    <h3>属性面板</h3>

    <div v-if="!currentElement" class="hint">
      <p>请在画布上选择一个元素</p>
    </div>

    <div v-else class="controls">
      <div class="control-group">
        <h5>位置与尺寸</h5>
        <div class="grid-2">
          <InputControl label="X" v-model.number="currentElement.x" @change="handleUpdate" />
          <InputControl label="Y" v-model.number="currentElement.y" @change="handleUpdate" />
          <InputControl label="W" v-model.number="currentElement.width" @change="handleUpdate" />
          <InputControl label="H" v-model.number="currentElement.height" @change="handleUpdate" />
        </div>
      </div>

      <div v-if="currentElement.type === 'image'" class="control-group">
        <h5>图像滤镜</h5>
        <div class="slider-row">
          <label>模糊: {{ currentElement.filters.blur }}px</label>
          <input type="range" min="0" max="20" step="0.5" :value="currentElement.filters.blur"
            @input="(e) => handleFilterChange('blur', e.target.value)"
            @change="(e) => handleFilterFinish('blur', e.target.value)" />
        </div>
        <div class="slider-row">
          <label>亮度: {{ Math.round(currentElement.filters.brightness * 100) }}%</label>
          <input type="range" min="0" max="2" step="0.05" :value="currentElement.filters.brightness"
            @input="(e) => handleFilterChange('brightness', e.target.value)"
            @change="(e) => handleFilterFinish('brightness', e.target.value)" />
        </div>
        <div class="slider-row">
          <label>对比度: {{ Math.round(currentElement.filters.contrast * 100) }}%</label>
          <input type="range" min="0" max="3" step="0.05" :value="currentElement.filters.contrast"
            @input="(e) => handleFilterChange('contrast', e.target.value)"
            @change="(e) => handleFilterFinish('contrast', e.target.value)" />
        </div>
        <div style="text-align: right; margin-top: 8px;">
          <button class="mini-btn" @click="resetFilters">重置滤镜</button>
        </div>
      </div>

      <div class="control-group">
        <h5>样式</h5>
        <div class="color-row">
          <label>填充</label>
          <div class="color-wrapper">
            <input type="color" :value="safeColorToHex(currentElement.style.fillColor)"
              @input="(e) => handleColorUpdate('fillColor', e.target.value)" />
            <button @click="clearFill" class="mini-btn" title="无填充">🚫</button>
          </div>
        </div>
        <div class="color-row">
          <label>边框</label>
          <input type="color" :value="safeColorToHex(currentElement.style.lineColor)"
            @input="(e) => handleColorUpdate('lineColor', e.target.value)" />
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
          <input type="color" :value="safeColorToHex(currentElement.style.color)"
            @input="(e) => handleColorUpdate('color', e.target.value)" />
        </div>
        <textarea class="text-content-edit" v-model="currentElement.text" @change="handleUpdate" rows="3"
          placeholder="输入文本内容"></textarea>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useEditorStore } from '@/stores/editorStore';
import { executeCommand } from '../../core/history/HistoryManager';
import { UpdateElementCommand } from '../../core/commands/UpdateElementCommand';
import InputControl from '../base/InputControl.vue';

const store = useEditorStore();

const currentElement = computed(() => {
  return store.selectedElements.length === 1 ? store.selectedElements[0] : null;
});

const safeColorToHex = (colorNum) => {
  if (colorNum === null || colorNum === undefined) return '#FFFFFF';
  if (typeof colorNum === 'string') return colorNum;
  return '#' + colorNum.toString(16).padStart(6, '0').toUpperCase();
};

const handleUpdate = () => {
  if (currentElement.value) {
    store.updateElement(currentElement.value.id, { ...currentElement.value });
  }
};

const handleStyleUpdate = () => {
  if (currentElement.value) {
    store.updateElement(currentElement.value.id, { style: { ...currentElement.value.style } });
  }
};

const handleColorUpdate = (key, hexString) => {
  if (currentElement.value) {
    const colorNum = parseInt(hexString.slice(1), 16);
    const oldColor = currentElement.value.style[key];

    const command = new UpdateElementCommand(
      currentElement.value.id,
      { style: { ...currentElement.value.style, [key]: oldColor } }, // 旧
      { style: { ...currentElement.value.style, [key]: colorNum } }  // 新
    );
    executeCommand(command);
  }
};

const clearFill = () => {
  if (currentElement.value) {
    const oldFill = currentElement.value.style.fillColor;
    const command = new UpdateElementCommand(
      currentElement.value.id,
      { style: { ...currentElement.value.style, fillColor: oldFill } },
      { style: { ...currentElement.value.style, fillColor: null } }
    );
    executeCommand(command);
  }
};

const handleFilterChange = (key, value) => {
  if (!currentElement.value) return;
  const numValue = Number(value);
  currentElement.value.filters[key] = numValue;
};

const handleFilterFinish = (key, value) => {
  if (!currentElement.value) return;
  const numValue = Number(value);
  const currentFilters = { ...currentElement.value.filters };

  const command = new UpdateElementCommand(
    currentElement.value.id,
    { filters: { ...currentFilters, [key]: currentFilters[key] } },
    { filters: { ...currentFilters, [key]: numValue } }
  );
  executeCommand(command);
};

const resetFilters = () => {
  if (!currentElement.value) return;
  const defaultFilters = { blur: 0, brightness: 1, contrast: 1 };
  const command = new UpdateElementCommand(
    currentElement.value.id,
    { filters: { ...currentElement.value.filters } },
    { filters: defaultFilters }
  );
  executeCommand(command);
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

h3,
h5 {
  margin: 0 0 10px 0;
  color: #555;
}

h5 {
  font-size: 12px;
  text-transform: uppercase;
  color: #999;
  margin-top: 10px;
}

.hint {
  color: #999;
  text-align: center;
  margin-top: 50px;
}

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

.slider-row {
  margin-bottom: 12px;
  font-size: 12px;
}

.slider-row label {
  display: block;
  margin-bottom: 4px;
  color: #666;
}

.slider-row input[type=range] {
  width: 100%;
  display: block;
}
</style>