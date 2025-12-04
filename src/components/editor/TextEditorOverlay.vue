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
import { useEditorStore } from '@/stores/editorStore';
import { executeCommand } from '@/core/history/HistoryManager';
import { UpdateElementCommand } from '@/core/commands/UpdateElementCommand';

const props = defineProps<{ elementId: string }>();
const emit = defineEmits(['finish']);

const store = useEditorStore();
const inputRef = ref<HTMLTextAreaElement | null>(null);
const localText = ref('');
let initialText = '';

// 从 Store 获取当前正在编辑的元素
const element = computed(() => {
  return store.elements.find(e => e.id === props.elementId);
});

// 计算输入框样式
const styleObject = computed<CSSProperties>(() => {
  if (!element.value) return { display: 'none' };
  const el = element.value;
  
  const x = Number(el.x);
  const y = Number(el.y);
  const w = Number(el.width);
  const h = Number(el.height);
  
  // 字体样式同步
  const fontSize = Number(el.style.fontSize || 24);
  const fontFamily = el.style.fontFamily || 'Arial';
  // 垂直居中
  const lineHeight = fontSize * 1.2;
  const paddingTop = (h - lineHeight) / 2;

  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${w}px`,
    height: `${h}px`,
    
    // 旋转支持
    transform: `rotate(${el.rotation || 0}rad)`,
    transformOrigin: '0 0', // 绕左上角旋转
    
    // 字体样式
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    lineHeight: `${lineHeight}px`,
    textAlign: 'center', 
    color: '#000000',    
    
    // 垂直居中
    paddingTop: `${paddingTop}px`, 
    paddingLeft: '4px',
    paddingRight: '4px',
    
    background: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    overflow: 'hidden',
    margin: '0',
    boxSizing: 'border-box'
  };
});

// 读取文字并聚焦
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
            { text: initialText },       // 旧值
            { text: localText.value }    // 新值
        );
        executeCommand(command);
    }
    emit('finish');
};

const handleEnter = (e: KeyboardEvent) => {
    if (!e.shiftKey) {
        e.preventDefault();
        inputRef.value?.blur();
    }
};
</script>