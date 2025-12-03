<template>
  <div class="input-control">
    <label>{{ label }}</label>
    <input type="color" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
  </div>
</template>
<script setup>
defineProps(['label', 'modelValue']);
defineEmits(['update:modelValue']);
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