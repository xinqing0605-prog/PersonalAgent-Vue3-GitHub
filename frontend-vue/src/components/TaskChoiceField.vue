<script setup lang="ts">
defineProps<{
  id: string
  label: string
  options: { value: string; label: string }[]
  initial: string
}>()
</script>

<template>
  <div class="task-choice-field">
    <select :id="id" class="task-choice-native" :aria-label="label" :value="initial">
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
    <span class="task-choice-chevron" aria-hidden="true">⌄</span>
  </div>
</template>
