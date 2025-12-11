<template>
  <div class="input-control">
    <label>{{ label }}</label>
    <input
      type="color"
      :value="modelValue"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

</script>

<style scoped>
.input-control {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.input-control label {
  width: 40px;
  font-size: 12px;
  margin-right: 5px;
  color: #666;
}

.input-control input {
  flex-grow: 1;
  padding: 0;
  height: 28px;
  border: none;
}
</style>