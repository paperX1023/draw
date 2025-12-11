<template>
  <div class="toolbox-dock">
    <div class="tool-item" data-tooltip="选择 (V)">
      <button
        :class="{ active: store.activeTool === 'select' }"
        @click="setTool('select')"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5.65376 2.44967C5.20266 2.2332 4.68855 2.56986 4.70012 3.07008L5.46573 21.1685C5.48737 21.6801 6.09938 21.9519 6.47945 21.6186L10.4936 18.0984L15.2686 21.7424L17.1467 19.2812L12.2895 15.5923L17.0536 14.7229C17.5454 14.6332 17.7752 14.0278 17.4432 13.652L5.65376 2.44967Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>

    <div class="divider"></div>

    <div
      class="tool-item has-submenu"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <button :class="{ active: isShapeTool }">
        <span
          v-if="store.activeTool === 'circle'"
          class="shape-icon circle"
        ></span>
        <span
          v-else-if="store.activeTool === 'triangle'"
          class="shape-icon triangle"
        ></span>
        <span v-else class="shape-icon rect"></span>
      </button>

      <div class="submenu-wrapper" v-show="showShapes">
        <div class="submenu">
          <button
            @click="setTool('rect')"
            title="矩形"
            :class="{ active: store.activeTool === 'rect' }"
          >
            <div class="shape-preview rect"></div>
          </button>
          <button
            @click="setTool('circle')"
            title="圆形 / 椭圆"
            :class="{ active: store.activeTool === 'circle' }"
          >
            <div class="shape-preview circle"></div>
          </button>
          <button
            @click="setTool('triangle')"
            title="三角形"
            :class="{ active: store.activeTool === 'triangle' }"
          >
            <div class="shape-preview triangle"></div>
          </button>
        </div>
      </div>
    </div>

    <div class="tool-item" data-tooltip="文本 (T)">
      <button
        :class="{ active: store.activeTool === 'text' }"
        @click="setTool('text')"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M4 7V4h16v3M9 20h6M12 4v16" />
        </svg>
      </button>
    </div>

    <div class="tool-item" data-tooltip="插入图片">
      <button @click="triggerUpload">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </button>

      <input
        type="file"
        ref="fileInputRef"
        accept="image/png, image/jpeg, image/jpg, image/gif"
        style="display: none"
        @change="handleFileChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useEditorStore } from '@/stores/editorStore';

type ShapeTool = 'rect' | 'circle' | 'triangle' | 'round-rect';
type ToolName = ShapeTool | 'select' | 'text';

const store = useEditorStore();

const showShapes = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

let timer: number | null = null;

// 当前是否处于任意形状工具
const isShapeTool = computed<boolean>(() => {
  const shapeTools: ShapeTool[] = ['rect', 'circle', 'triangle', 'round-rect'];
  return shapeTools.includes(store.activeTool as ShapeTool);
});

// 切换工具
const setTool = (tool: ToolName) => {
  store.setActiveTool(tool);
  showShapes.value = false;
};

const handleMouseEnter = () => {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  showShapes.value = true;
};

const handleMouseLeave = () => {
  if (timer !== null) {
    clearTimeout(timer);
  }
  timer = window.setTimeout(() => {
    showShapes.value = false;
    timer = null;
  }, 300);
};

const triggerUpload = () => {
  fileInputRef.value?.click();
};

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement | null;
  if (!target || !target.files || target.files.length === 0) return;

  const file = target.files[0];

  try {
    await store.addImageToCanvas(file);
  } catch (error) {
    console.error('图片加载失败:', error);
    alert('图片加载失败，请重试');
  } finally {
    target.value = '';
  }
};
</script>

<style scoped>
.toolbox-dock {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: #ffffff;
  padding: 6px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 100;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
}

button:hover {
  background-color: #f3f4f6;
  color: #000;
}

button.active {
  background-color: #e6f4ff;
  color: #007aff;
}

.divider {
  height: 1px;
  background-color: #eee;
  margin: 2px 4px;
}

.shape-icon {
  display: block;
  border: 2px solid currentColor;
  box-sizing: border-box;
}

.shape-icon.rect {
  width: 18px;
  height: 18px;
  border-radius: 2px;
}

.shape-icon.circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.shape-icon.triangle {
  width: 0;
  height: 0;
  border: none;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-bottom: 18px solid currentColor;
}

.submenu-wrapper {
  position: absolute;
  left: 100%;
  top: 0;
  padding-left: 12px;
  height: 100%;
  display: flex;
  align-items: center;
}

.submenu {
  background: white;
  padding: 4px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: row;
  gap: 4px;
  border: 1px solid #eee;
  animation: fadeIn 0.2s ease;
}

.shape-preview {
  border: 2px solid #555;
  box-sizing: border-box;
}

.shape-preview.rect {
  width: 14px;
  height: 14px;
}

.shape-preview.circle {
  width: 16px;
  height: 12px;
  border-radius: 50%;
}

.shape-preview.triangle {
  width: 0;
  height: 0;
  border: none;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 12px solid #555;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-5px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>