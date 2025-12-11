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
            @update:modelValue="val => handleNumericPropChange('x', val)"
          />
          <InputControl
            label="Y"
            :modelValue="currentElement.y"
            @update:modelValue="val => handleNumericPropChange('y', val)"
          />
          <InputControl
            label="W"
            :modelValue="currentElement.width"
            @update:modelValue="val => handleNumericPropChange('width', val)"
          />
          <InputControl
            label="H"
            :modelValue="currentElement.height"
            @update:modelValue="val => handleNumericPropChange('height', val)"
          />
        </div>
      </div>

      <div v-if="currentElement.type === 'image'" class="control-group">
        <h5>图像滤镜</h5>

        <div class="slider-row">
          <label>模糊: {{ currentFilters.blur }}px</label>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            :value="currentFilters.blur"
            @input="e => handleFilterChange('blur', (e.target as HTMLInputElement).value)"
            @change="e => handleFilterFinish('blur', (e.target as HTMLInputElement).value)"
          />
        </div>

        <div class="slider-row">
          <label>亮度: {{ Math.round(currentFilters.brightness * 100) }}%</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            :value="currentFilters.brightness"
            @input="e => handleFilterChange('brightness', (e.target as HTMLInputElement).value)"
            @change="e => handleFilterFinish('brightness', (e.target as HTMLInputElement).value)"
          />
        </div>

        <div class="slider-row">
          <label>对比度: {{ Math.round(currentFilters.contrast * 100) }}%</label>
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            :value="currentFilters.contrast"
            @input="e => handleFilterChange('contrast', (e.target as HTMLInputElement).value)"
            @change="e => handleFilterFinish('contrast', (e.target as HTMLInputElement).value)"
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
              @input="e => handleColorUpdate('fillColor', (e.target as HTMLInputElement).value)"
            />
            <button @click="clearFill" class="mini-btn" title="无填充">🚫</button>
          </div>
        </div>

        <div class="color-row">
          <label>边框</label>
          <input
            type="color"
            :value="safeColorToHex(currentElement.style.lineColor)"
            @input="e => handleColorUpdate('lineColor', (e.target as HTMLInputElement).value)"
          />
        </div>

        <InputControl
          label="线宽"
          :modelValue="currentElement.style.lineWidth"
          @update:modelValue="val => handleStylePropChange('lineWidth', val)"
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
            :modelValue="currentElement.style.fontSize ?? 14"
            @update:modelValue="val => handleStylePropChange('fontSize', val)"
          />
        </div>

        <div class="color-row">
          <label>颜色</label>
          <input
            type="color"
            :value="safeColorToHex(currentElement.style.fontColor)"
            @input="e => handleColorUpdate('fontColor', (e.target as HTMLInputElement).value)"
          />
        </div>

        <textarea
          class="text-content-edit"
          :value="currentElement.text || ''"
          @input="e => handleTextChange((e.target as HTMLTextAreaElement).value)"
          rows="3"
          placeholder="输入文本内容"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useEditorStore } from '@/stores/editorStore';
import { executeCommand } from '@/core/history/HistoryManager';
import { UpdateElementCommand } from '@/core/commands/UpdateElementCommand';
import InputControl from '../base/InputControl.vue';
import type { IElement, IElementStyle, IFilters } from '@/types/elements';

const store = useEditorStore();

const DEFAULT_FILTERS: IFilters = {
  blur: 0,
  brightness: 1,
  contrast: 1,
};

const currentElement = computed<IElement | null>(() => {
  return store.selectedElements.length === 1
    ? (store.selectedElements[0] as IElement)
    : null;
});

const currentFilters = computed<IFilters>(() => {
  if (!currentElement.value) return DEFAULT_FILTERS;
  return currentElement.value.filters ?? DEFAULT_FILTERS;
});

const safeColorToHex = (color: string | null | undefined): string => {
  return color ?? '#FFFFFF';
};

const applyUpdateCommand = (
  elementId: IElement['id'],
  oldPatch: Partial<IElement>,
  newPatch: Partial<IElement>,
): void => {
  const command = new UpdateElementCommand(elementId, oldPatch, newPatch);
  executeCommand(command);
};

type NumericElementKey = 'x' | 'y' | 'width' | 'height';

const handleNumericPropChange = (
  key: NumericElementKey,
  value: string | number,
): void => {
  if (!currentElement.value) return;

  const el = currentElement.value;
  const newVal = Number(value);
  if (Number.isNaN(newVal)) return;

  const oldPatch: Partial<IElement> = { [key]: el[key] } as Partial<IElement>;
  const newPatch: Partial<IElement> = { [key]: newVal } as Partial<IElement>;

  applyUpdateCommand(el.id, oldPatch, newPatch);
};

const handleTextChange = (text: string): void => {
  if (!currentElement.value) return;

  const el = currentElement.value;
  const oldPatch: Partial<IElement> = { text: el.text };
  const newPatch: Partial<IElement> = { text };

  applyUpdateCommand(el.id, oldPatch, newPatch);
};

type StyleKey = keyof IElementStyle;
type NumericStyleKey = 'lineWidth' | 'fontSize';

const numericStyleKeys: NumericStyleKey[] = ['lineWidth', 'fontSize'];

const handleStylePropChange = (
  key: StyleKey,
  value: string | number,
): void => {
  if (!currentElement.value) return;

  const el = currentElement.value;
  const isNumericKey = numericStyleKeys.includes(key as NumericStyleKey);
  const finalValue = isNumericKey ? Number(value) : value;

  if (isNumericKey && Number.isNaN(finalValue)) return;

  const oldStyle: IElementStyle = { ...el.style };
  const newStyle: IElementStyle = {
    ...el.style,
    [key]: finalValue as never,
  };

  applyUpdateCommand(el.id, { style: oldStyle }, { style: newStyle });
};

type ColorStyleKey = 'fillColor' | 'lineColor' | 'fontColor';

const handleColorUpdate = (
  key: ColorStyleKey,
  hexString: string,
): void => {
  if (!currentElement.value) return;

  const el = currentElement.value;

  const oldStyle: IElementStyle = { ...el.style };
  const newStyle: IElementStyle = {
    ...el.style,
    [key]: hexString,
  };

  applyUpdateCommand(el.id, { style: oldStyle }, { style: newStyle });
};

const clearFill = (): void => {
  if (!currentElement.value) return;

  const el = currentElement.value;
  const oldStyle: IElementStyle = { ...el.style };
  const newStyle: IElementStyle = {
    ...el.style,
    fillColor: null,
  };

  applyUpdateCommand(el.id, { style: oldStyle }, { style: newStyle });
};

const filterSnapshot = ref<IFilters | null>(null);

type FilterKey = keyof IFilters;

const handleFilterChange = (
  key: FilterKey,
  value: string | number,
): void => {
  if (!currentElement.value) return;

  const el = currentElement.value;

  // 首次拖动时记录旧值
  if (!filterSnapshot.value) {
    filterSnapshot.value = el.filters ? { ...el.filters } : { ...DEFAULT_FILTERS };
  }

  const numValue = Number(value);
  if (Number.isNaN(numValue)) return;

  const baseFilters: IFilters = el.filters ? { ...el.filters } : { ...DEFAULT_FILTERS };
  const newFilters: IFilters = {
    ...baseFilters,
    [key]: numValue,
  };

  store.updateElement(el.id, { filters: newFilters });
};

const handleFilterFinish = (
  key: FilterKey,         
  value: string | number, 
): void => {
  if (!currentElement.value || !filterSnapshot.value) return;

  const el = currentElement.value;

  const oldFilters: IFilters = filterSnapshot.value;
  const newFilters: IFilters = el.filters ? { ...el.filters } : { ...DEFAULT_FILTERS };

  applyUpdateCommand(el.id, { filters: oldFilters }, { filters: newFilters });

  filterSnapshot.value = null;
};

const resetFilters = (): void => {
  if (!currentElement.value) return;

  const el = currentElement.value;
  const oldFilters: IFilters = el.filters ? { ...el.filters } : { ...DEFAULT_FILTERS };
  const defaultFilters: IFilters = { ...DEFAULT_FILTERS };

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
