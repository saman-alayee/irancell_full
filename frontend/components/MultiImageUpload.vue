<template>
  <div>
    <label v-if="label" class="block text-sm font-bold mb-2">{{ label }}</label>
    <div v-if="images.length" class="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
      <div
        v-for="(url, index) in images"
        :key="url + index"
        class="relative aspect-square rounded-lg overflow-hidden border dark:border-gray-600 bg-placeholder"
      >
        <img :src="resolveImageUrl(url)" alt="" class="w-full h-full object-cover" />
        <button
          type="button"
          class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs leading-none"
          @click="remove(index)"
        >×</button>
      </div>
    </div>
    <div
      class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-irancell-yellow transition cursor-pointer"
      @click="inputRef?.click()"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <div class="py-4 text-gray-400 dark:text-gray-500">
        <div class="text-3xl mb-2">📷</div>
        <p class="text-sm">افزودن تصویر — کلیک یا رها کردن فایل</p>
        <p class="text-xs mt-1">JPG, PNG, WEBP — حداکثر ۵MB — تا {{ maxImages }} تصویر</p>
      </div>
    </div>
    <input ref="inputRef" type="file" accept="image/*" multiple class="hidden" @change="onSelect" />
    <p v-if="uploading" class="text-sm text-heading mt-2">در حال آپلود...</p>
    <p v-if="error" class="text-sm text-red-500 mt-2">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string[]
  label?: string
  maxImages?: number
}>(), {
  modelValue: () => [],
  maxImages: 8,
})

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const { apiUploadImage, resolveImageUrl } = useApi()
const inputRef = ref<HTMLInputElement>()
const uploading = ref(false)
const error = ref('')

const images = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val),
})

const upload = async (file: File) => {
  if (images.value.length >= props.maxImages) {
    error.value = `حداکثر ${props.maxImages} تصویر مجاز است`
    return
  }
  if (!file.type.startsWith('image/')) {
    error.value = 'فقط فایل تصویری مجاز است'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'حداکثر حجم هر تصویر ۵ مگابایت است'
    return
  }
  uploading.value = true
  error.value = ''
  try {
    const url = await apiUploadImage(file)
    images.value = [...images.value, url]
  } catch (e: any) {
    error.value = e.message
  } finally {
    uploading.value = false
  }
}

const onSelect = async (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  for (const file of files) {
    if (images.value.length >= props.maxImages) break
    await upload(file)
  }
  if (inputRef.value) inputRef.value.value = ''
}

const onDrop = async (e: DragEvent) => {
  const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'))
  for (const file of files) {
    if (images.value.length >= props.maxImages) break
    await upload(file)
  }
}

const remove = (index: number) => {
  images.value = images.value.filter((_, i) => i !== index)
}
</script>
