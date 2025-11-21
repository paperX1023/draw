<template>
  <div class="toolbox-dock">
    <div class="tool-item" data-tooltip="选择 (V)">
      <button
          :class="{ active: state.activeTool === 'select' }"
          @click="setTool('select')"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5.65376 2.44967C5.20266 2.2332 4.68855 2.56986 4.70012 3.07008L5.46573 21.1685C5.48737 21.6801 6.09938 21.9519 6.47945 21.6186L10.4936 18.0984L15.2686 21.7424L17.1467 19.2812L12.2895 15.5923L17.0536 14.7229C17.5454 14.6332 17.7752 14.0278 17.4432 13.652L5.65376 2.44967Z" fill="currentColor"/></svg>
      </button>
    </div>

    <div class="divider"></div>

    <div
        class="tool-item has-submenu"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
    >
      <button :class="{ active: isShapeTool }">
        <span v-if="state.activeTool === 'circle'" class="shape-icon circle"></span>
        <span v-else-if="state.activeTool === 'triangle'" class="shape-icon triangle"></span>
        <span v-else class="shape-icon rect"></span>
      </button>

      <div class="submenu-wrapper" v-show="showShapes">
        <div class="submenu">
          <button @click="setTool('rect')" title="矩形" :class="{ active: state.activeTool === 'rect' }">
            <div class="shape-preview rect"></div>
          </button>
          <button @click="setTool('circle')" title="圆形" :class="{ active: state.activeTool === 'circle' }">
            <div class="shape-preview circle"></div>
          </button>
          <button @click="setTool('triangle')" title="三角形" :class="{ active: state.activeTool === 'triangle' }">
            <div class="shape-preview triangle"></div>
          </button>
        </div>
      </div>
    </div>

    <div class="tool-item" data-tooltip="文本 (T)">
      <button
          :class="{ active: state.activeTool === 'text' }"
          @click="setTool('text')"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useEditorState } from '../../composables/useEditorState';

const { state, setActiveTool } = useEditorState();
const showShapes = ref(false);
let timer = null;

const isShapeTool = computed(() => {
  return ['rect', 'circle', 'triangle', 'round-rect'].includes(state.activeTool);
});

const setTool = (tool) => {
  setActiveTool(tool);
  // 点击后立刻关闭菜单，提升反馈感
  showShapes.value = false;
};

// 优化悬停体验：添加延时关闭
const handleMouseEnter = () => {
  if (timer) clearTimeout(timer);
  showShapes.value = true;
};

const handleMouseLeave = () => {
  // 给 300ms 的缓冲时间，防止鼠标误移出导致菜单消失
  timer = setTimeout(() => {
    showShapes.value = false;
  }, 300);
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
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  z-index: 100;
  border: 1px solid rgba(0,0,0,0.08);
}

button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
}

button:hover { background-color: #f3f4f6; color: #000; }
button.active { background-color: #e6f4ff; color: #007aff; }

.divider { height: 1px; background-color: #eee; margin: 2px 4px; }

/* 图形图标样式 */
.shape-icon { display: block; border: 2px solid currentColor; box-sizing: border-box; }
.shape-icon.rect { width: 18px; height: 18px; border-radius: 2px; }
.shape-icon.circle { width: 20px; height: 20px; border-radius: 50%; }
.shape-icon.triangle {
  width: 0; height: 0; border: none;
  border-left: 9px solid transparent; border-right: 9px solid transparent; border-bottom: 18px solid currentColor;
}

/* 子菜单容器：关键优化 */
.submenu-wrapper {
  position: absolute;
  left: 100%;
  top: 0;
  /* 增加左侧内边距，创建一个“隐形桥梁”，防止鼠标移动过程中断 */
  padding-left: 12px;
  height: 100%; /* 增加高度容错 */
  display: flex;
  align-items: center;
}

.submenu {
  background: white;
  padding: 4px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: row;
  gap: 4px;
  border: 1px solid #eee;
  /* 动画 */
  animation: fadeIn 0.2s ease;
}

.shape-preview { border: 2px solid #555; }
.shape-preview.rect { width: 14px; height: 14px; }
.shape-preview.circle { width: 14px; height: 14px; border-radius: 50%; }
.shape-preview.triangle {
  width: 0; height: 0; border: none;
  border-left: 7px solid transparent; border-right: 7px solid transparent; border-bottom: 12px solid #555;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-5px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>