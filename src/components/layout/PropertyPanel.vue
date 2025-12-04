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
          <InputControl
            label="X"
            :modelValue="currentElement.x"
            @update:modelValue="(val) => handleNumericPropChange('x', val)"
          />
          <InputControl
            label="Y"
            :modelValue="currentElement.y"
            @update:modelValue="(val) => handleNumericPropChange('y', val)"
          />
          <InputControl
            label="W"
            :modelValue="currentElement.width"
            @update:modelValue="(val) => handleNumericPropChange('width', val)"
          />
          <InputControl
            label="H"
            :modelValue="currentElement.height"
            @update:modelValue="(val) => handleNumericPropChange('height', val)"
          />
        </div>
      </div>

      <div v-if="currentElement.type === 'image'" class="control-group">
        <h5>图像滤镜</h5>
        <div class="slider-row">
          <label>模糊: {{ currentElement.filters.blur }}px</label>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            :value="currentElement.filters.blur"
            @input="(e) => handleFilterChange('blur', e.target.value)"
            @change="(e) => handleFilterFinish('blur', e.target.value)"
          />
        </div>
        <div class="slider-row">
          <label>亮度: {{ Math.round(currentElement.filters.brightness * 100) }}%</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            :value="currentElement.filters.brightness"
            @input="(e) => handleFilterChange('brightness', e.target.value)"
            @change="(e) => handleFilterFinish('brightness', e.target.value)"
          />
        </div>
        <div class="slider-row">
          <label>对比度: {{ Math.round(currentElement.filters.contrast * 100) }}%</label>
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            :value="currentElement.filters.contrast"
            @input="(e) => handleFilterChange('contrast', e.target.value)"
            @change="(e) => handleFilterFinish('contrast', e.target.value)"
          />
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
        <InputControl
          label="线宽"
          :modelValue="currentElement.style.lineWidth"
          @update:modelValue="(val) => handleStylePropChange('lineWidth', val)"
        />
      </div>

      <div
        v-if="currentElement.type === 'text' || currentElement.text"
        class="control-group"
      >
        <h5>文本</h5>
        <div class="grid-2">
          <InputControl
            label="字号"
            :modelValue="currentElement.style.fontSize"
            @update:modelValue="(val) => handleStylePropChange('fontSize', val)"
          />
        </div>
        <div class="color-row">
          <label>颜色</label>
          <input
            type="color"
            :value="safeColorToHex(currentElement.style.fontColor)"
            @input="(e) => handleColorUpdate('fontColor', e.target.value)"
          />
        </div>
        <textarea
          class="text-content-edit"
          :value="currentElement.text || ''"
          @input="(e) => handleTextChange(e.target.value)"
          rows="3"
          placeholder="输入文本内容"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useEditorStore } from '@/stores/editorStore';
import { executeCommand } from '../../core/history/HistoryManager';
import { UpdateElementCommand } from '../../core/commands/UpdateElementCommand';
import InputControl from '../base/InputControl.vue';

const store = useEditorStore();

// 当前选中元素
const currentElement = computed(() => {
  return store.selectedElements.length === 1 ? store.selectedElements[0] : null;
});

const safeColorToHex = (colorNum) => {
  if (colorNum === null || colorNum === undefined) return '#FFFFFF';
  if (typeof colorNum === 'string') return colorNum;
  return '#' + colorNum.toString(16).padStart(6, '0').toUpperCase();
};

// 创建并执行更新命令
const applyUpdateCommand = (elementId, oldPatch, newPatch) => {
  const command = new UpdateElementCommand(elementId, oldPatch, newPatch);
  executeCommand(command);
};

const handleNumericPropChange = (key, value) => {
  if (!currentElement.value) return;

  const el = currentElement.value;
  const newVal = Number(value);

  if (Number.isNaN(newVal)) return;

  const oldPatch = { [key]: el[key] };
  const newPatch = { [key]: newVal };

  applyUpdateCommand(el.id, oldPatch, newPatch);
};


const handleTextChange = (text) => {
  if (!currentElement.value) return;

  const el = currentElement.value;
  const oldPatch = { text: el.text };
  const newPatch = { text };

  applyUpdateCommand(el.id, oldPatch, newPatch);
};

const handleStylePropChange = (key, value) => {
  if (!currentElement.value) return;

  const el = currentElement.value;
  const numKeys = ['lineWidth', 'fontSize'];
  const finalValue = numKeys.includes(key) ? Number(value) : value;

  if (numKeys.includes(key) && Number.isNaN(finalValue)) return;

  const oldStyle = { ...el.style };
  const newStyle = { ...el.style, [key]: finalValue };

  applyUpdateCommand(el.id, { style: oldStyle }, { style: newStyle });
};

const handleColorUpdate = (key, hexString) => {
  if (!currentElement.value) return;

  const el = currentElement.value;
  const colorNum = parseInt(hexString.slice(1), 16);

  const oldStyle = { ...el.style };
  const newStyle = { ...el.style, [key]: colorNum };

  applyUpdateCommand(el.id, { style: oldStyle }, { style: newStyle });
};

const clearFill = () => {
  if (!currentElement.value) return;

  const el = currentElement.value;
  const oldStyle = { ...el.style };
  const newStyle = { ...el.style, fillColor: null };

  applyUpdateCommand(el.id, { style: oldStyle }, { style: newStyle });
};

// 记录拖动开始前的滤镜旧值
const filterSnapshot = ref(null);

const handleFilterChange = (key, value) => {
  if (!currentElement.value) return;

  const el = currentElement.value;

  // 首次拖动时记录旧值
  if (!filterSnapshot.value) {
    filterSnapshot.value = { ...el.filters };
  }

  const numValue = Number(value);
  if (Number.isNaN(numValue)) return;

  const newFilters = {
    ...el.filters,
    [key]: numValue,
  };

  store.updateElement(el.id, { filters: newFilters });
};

// 拖动结束，写入历史
const handleFilterFinish = (key, value) => {
  if (!currentElement.value || !filterSnapshot.value) return;

  const el = currentElement.value;
  const numValue = Number(value);
  if (Number.isNaN(numValue)) return;

  const oldFilters = filterSnapshot.value;
  const newFilters = {
    ...el.filters,
    [key]: numValue,
  };

  applyUpdateCommand(el.id, { filters: oldFilters }, { filters: newFilters });

  filterSnapshot.value = null;
};

// 重置滤镜
const resetFilters = () => {
  if (!currentElement.value) return;

  const el = currentElement.value;
  const oldFilters = { ...el.filters };
  const defaultFilters = { blur: 0, brightness: 1, contrast: 1 };

  applyUpdateCommand(el.id, { filters: oldFilters }, { filters: defaultFilters });
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

.slider-row input[type='range'] {
  width: 100%;
  display: block;
}
</style>
