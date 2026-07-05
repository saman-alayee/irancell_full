<template>
  <div class="space-y-1">
    <label v-if="label" class="block text-sm font-bold text-heading">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <p v-if="hint" class="text-xs text-muted leading-relaxed">{{ hint }}</p>
    <slot />
    <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  hint?: string
  required?: boolean
  error?: string
}>()
</script>
