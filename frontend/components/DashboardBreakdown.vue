<template>
  <div class="card p-6">
    <h3 class="font-bold mb-4">{{ title }}</h3>
    <div v-if="!items.length" class="text-sm text-muted text-center py-6">داده‌ای موجود نیست</div>
    <div v-else class="space-y-3">
      <div v-for="item in items" :key="item.label" class="space-y-1">
        <div class="flex justify-between text-sm gap-2">
          <span class="text-muted">{{ item.label }}</span>
          <span class="font-bold shrink-0">{{ item.display ?? item.value }}</span>
        </div>
        <div class="h-2 rounded-full bg-subtle overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :style="{ width: `${barWidth(item.value)}%`, backgroundColor: item.color || color }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  items: Array<{ label: string; value: number; display?: string; color?: string }>
  color?: string
}>(), {
  color: '#FFCC00',
})

const max = computed(() => Math.max(...props.items.map((i) => i.value), 1))

const barWidth = (value: number) => Math.max(4, Math.round((value / max.value) * 100))
</script>
