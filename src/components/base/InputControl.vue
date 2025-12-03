<template>
  <div class="input-control">
    <label>{{ label }}</label>
    <input type="number" :value="modelValue" @input="handleInput" />
  </div>
</template>
<script setup>
const props = defineProps(['label', 'modelValue']);
const emit = defineEmits(['update:modelValue', 'change']);

const handleInput = (e) => {
  const val = parseFloat(e.target.value);
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