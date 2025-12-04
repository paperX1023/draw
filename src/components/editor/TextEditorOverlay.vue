<template>
  <textarea
    v-if="element"
    ref="inputRef"
    class="text-editor-overlay"
    :style="styleObject"
    v-model="localText"
    @blur="handleFinish"
    @keydown.enter.stop="handleEnter"
    @mousedown.stop
    placeholder=""
  ></textarea>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, type CSSProperties } from 'vue';
import { Point } from 'pixi.js';
import { useEditorStore } from '@/stores/editorStore';
import { executeCommand } from '@/core/history/HistoryManager';
import { UpdateElementCommand } from '@/core/commands/UpdateElementCommand';
import { PixiEngine } from '@/core/render/PixiEngine';

const props = defineProps<{ elementId: string }>();
const emit = defineEmits(['finish']);

const store = useEditorStore();
const engine = PixiEngine.getInstance();

const inputRef = ref<HTMLTextAreaElement | null>(null);
const localText = ref('');
let initialText = '';

// 当前元素
const element = computed(() => {
  return store.elements.find(e => e.id === props.elementId);
});

const toCssColor = (color: number | string | null | undefined) => {
  if (color == null) return '#000000';
  if (typeof color === 'string') return color;
  return '#' + color.toString(16).padStart(6, '0').toUpperCase();
};


function worldToScreen(world: Point): Point {
  const app = engine.app;
  const stage = engine.stage;
  if (!app || !stage) return world.clone();

  const res = app.renderer.resolution ?? (window.devicePixelRatio || 1);
  const rect = app.canvas.getBoundingClientRect();

  const global = stage.toGlobal(world);

  return new Point(
    rect.left + global.x / res,
    rect.top + global.y / res
  );
}

const styleObject = computed<CSSProperties>(() => {
  const el = element.value;
  if (!el || !engine.app || !engine.stage) return { display: 'none' };

  const s = el.style ?? {};
  const worldX = Number(el.x);
  const worldY = Number(el.y);
  const worldW = Number(el.width);
  const worldH = Number(el.height);

  // 当前缩放
  const zoom = engine.zoom || 1;

  // 世界坐标 -> 屏幕坐标
  const topLeftScreen = engine.worldToScreen(new Point(worldX, worldY));
  const screenX = topLeftScreen.x;
  const screenY = topLeftScreen.y;

  const screenW = worldW * zoom;
  const screenH = worldH * zoom;

  // 字体样式同步
  const baseFontSize = Number(s.fontSize || 24);
  const fontSize = baseFontSize * zoom;
  const fontFamily = s.fontFamily || 'Arial';
  const fontColor = toCssColor(s.fontColor);

  const lineHeight = fontSize * 1.2;
  const paddingTop = (screenH - lineHeight) / 2;

  return {
    position: 'absolute',
    left: `${screenX}px`,
    top: `${screenY}px`,
    width: `${screenW}px`,
    height: `${screenH}px`,

    transform: `rotate(${el.rotation || 0}rad)`,
    transformOrigin: '0 0',

    fontSize: `${fontSize}px`,
    fontFamily,
    lineHeight: `${lineHeight}px`,
    textAlign: 'center',
    color: fontColor,

    paddingTop: `${paddingTop}px`,
    paddingLeft: '4px',
    paddingRight: '4px',

    background: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    overflow: 'hidden',
    margin: '0',
    boxSizing: 'border-box',
  };
});

// 初始值 + 聚焦
onMounted(() => {
  if (element.value) {
    initialText = element.value.text || '';
    localText.value = initialText;

    nextTick(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    });
  }
});

// 完成编辑
const handleFinish = () => {
  if (element.value && localText.value !== initialText) {
    const command = new UpdateElementCommand(
      element.value.id,
      { text: initialText },
      { text: localText.value }
    );
    executeCommand(command);
  }
  emit('finish');
};

const handleEnter = (e: KeyboardEvent) => {
  if ((e as any).isComposing) return;
  if (!e.shiftKey) {
    e.preventDefault();
    inputRef.value?.blur();
  }
};
</script>