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
  ></textarea>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useEditorState } from '../../composables/useEditorState';

const props = defineProps(['elementId']);
const emit = defineEmits(['finish']);

const { state, updateElement } = useEditorState();
const inputRef = ref(null);
const localText = ref('');

// 获取当前正在编辑的元素数据
const element = computed(() => {
  return state.elements.find(e => e.id === props.elementId);
});

// 计算输入框的位置和样式
const styleObject = computed(() => {
  if (!element.value) return {};
  const el = element.value;

  return {
    left: `${el.x}px`,
    top: `${el.y}px`,
    width: `${el.width}px`,
    height: `${el.height}px`,
    // 字体样式同步
    fontSize: `${el.style.fontSize || 14}px`,
    fontFamily: el.style.fontFamily || 'Arial',
    color: 'black', // 编辑时用黑色，或者同步 el.style.color
    // 让文字在输入框中居中
    textAlign: 'center',
    paddingTop: `${el.height / 2 - 10}px`, // 简单垂直居中模拟
    transform: `rotate(${el.rotation}rad)`,
    transformOrigin: '0 0'
  };
});

// 初始化文字
onMounted(() => {
  if (element.value) {
    localText.value = element.value.text || '';
    // 自动聚焦
    nextTick(() => inputRef.value?.focus());
  }
});

const save = () => {
  if (element.value) {
    updateElement(element.value.id, { text: localText.value });
  }
};

const handleFinish = () => {
  save();
  emit('finish'); // 通知父组件关闭编辑器
};

// 按下 Shift+Enter 换行，直接 Enter 完成
const handleEnter = (e) => {
  if (!e.shiftKey) {
    e.preventDefault(); // 阻止换行
    inputRef.value?.blur(); // 触发 blur 从而保存
  }
};
</script>

<style scoped>
.text-editor-overlay {
  position: absolute;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.5); /* 半透明背景，方便看清位置 */
  border: 1px dashed #007bff;
  outline: none;
  resize: none;
  overflow: hidden;
  line-height: 1.2;
  padding: 0;
  margin: 0;
}
</style>