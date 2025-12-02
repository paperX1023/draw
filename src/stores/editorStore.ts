import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { AssetManager } from '@/core/storage/AssetManager'; 
import type { IElement, ElementType, IElementStyle } from '@/types/elements';

const STORAGE_KEY = 'my-editor-data';
const DEFAULT_FILTERS = { blur: 0, brightness: 1, contrast: 1 };

const generateId = () => 'el-' + Date.now() + Math.random().toString(36).slice(2, 6);

export const useEditorStore = defineStore('editor', () => {
  const elements = ref<IElement[]>([]);
  const selectedElementIds = ref<string[]>([]);
  const activeTool = ref<string>('select');

  const selectedElements = computed(() => 
    elements.value.filter(el => selectedElementIds.value.includes(el.id))
  );

  // 从 LocalStorage 读取
  const initFromStorage = async () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsedElements = JSON.parse(data);

      for (const el of parsedElements) {
        // 如果是图片且有 Key，去 IndexedDB 取数据
        if (el.type === 'image' && el.imageKey) {
          const url = await AssetManager.getImageUrl(el.imageKey); 
          if (url) el._runtimeURL = url;
        }
      }
      elements.value = parsedElements;
    }
  };

  // 处理图片上传
  const addImageToCanvas = async (file: File) => {
    // 先存 DB
    const imageKey = await AssetManager.saveImage(file);
    const runtimeUrl = URL.createObjectURL(file);

    // 获取尺寸
    const img = new Image();
    img.src = runtimeUrl;
    await new Promise(r => img.onload = r);

    // 创建数据
    createNewElementAt('image', window.innerWidth/2 - 100, window.innerHeight/2 - 100, {
        width: img.width / 2,
        height: img.height / 2,
        imageKey: imageKey,
        _runtimeURL: runtimeUrl,
        src: ''
    });
  };

  // 选中逻辑
  const selectElement = (id: string | null, multiple = false) => {
    if (!id) {
      selectedElementIds.value = [];
      return;
    }
    if (multiple) {
      const index = selectedElementIds.value.indexOf(id);
      if (index > -1) selectedElementIds.value.splice(index, 1);
      else selectedElementIds.value.push(id);
    } else {
      selectedElementIds.value = [id];
    }
  };

  // 切换工具
  const setActiveTool = (tool: string) => {
    activeTool.value = tool;
    if (tool !== 'select') selectedElementIds.value = [];
  };

  // 创建新元素
  const createNewElementAt = (type: ElementType, x: number, y: number, extraData: any = {}) => {
    let width = 100, height = 100;
    
    if (type === 'rect' || type === 'circle' || type === 'triangle') {
        width = 1; height = 1; 
    } else if (type === 'text') {
        width = 100; height = 30;
    } else if (type === 'image') {
        width = extraData.width || 200;
        height = extraData.height || 200;
    }

    const style: IElementStyle = {
      fillColor: type === 'image' ? null : '#ffffff', 
      lineColor: '#000000',
      lineWidth: type === 'image' ? 0 : 2, 
      fontSize: 24,
      fontFamily: 'Arial',
      fontColor: '#000000', 
    };

    const newElement: IElement = {
      id: generateId(),
      type,
      x, y, width, height,
      rotation: 0,
      visible: true,
      locked: false,
      text: type === 'text' ? '双击输入' : '',
      style, 
      ...extraData 
    };

    if (type === 'image') {
        newElement.filters = { ...DEFAULT_FILTERS };
    }

    elements.value.push(newElement);
    return newElement.id;
  };

  // 更新元素
  const updateElement = (id: string, updates: Partial<IElement>) => {
    const el = elements.value.find(e => e.id === id);
    if (!el) return;

    if (updates.style) {
        el.style = { ...el.style, ...updates.style };
        const { style, ...rest } = updates;
        Object.assign(el, rest);
    } else if (updates.filters) {
        el.filters = { ...el.filters, ...updates.filters };
        const { filters, ...rest } = updates;
        Object.assign(el, rest);
    } else {
        Object.assign(el, updates);
    }
  };

  watch(elements, (newVal) => {
    const json = JSON.stringify(newVal, (key, value) => {
      if (key === '_runtimeURL') return undefined;
      return value;
    });
    localStorage.setItem(STORAGE_KEY, json);
  }, { deep: true });

  return {
    elements,
    selectedElements,
    selectedElementIds,
    activeTool,
    initFromStorage,
    selectElement,
    setActiveTool,
    createNewElementAt,
    updateElement,
    addImageToCanvas 
  };
});