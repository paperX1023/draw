<template>
  <div class="input-control">
    <label>{{ label }}</label>
    <input
      type="number"
      :value="modelValue"
      @input="handleInput"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  modelValue: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
  (e: 'change', value: number): void;
}>();

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const val = parseFloat(target.value);

  emit('update:modelValue', val);
  emit('change', val);
};
</script>

<style scoped>
.input-control {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.input-control label {
  width: 20px;
  color: #888;
  font-size: 12px;
}

.input-control input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px;
  width: 100%;
}
</style>