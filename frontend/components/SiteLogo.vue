<template>
  <img :src="src" :alt="alt" :class="imgClass" class="object-contain" />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  alt?: string
  imgClass?: string
}>(), {
  alt: 'ایرانسل',
  imgClass: 'h-10 w-auto',
})

const src = '/irancell-logo.jfif'
</script>
