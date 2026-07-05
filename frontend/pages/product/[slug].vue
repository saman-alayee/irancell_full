<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="pending" class="flex justify-center py-20">
      <div class="w-12 h-12 border-4 border-irancell-yellow border-t-transparent rounded-full animate-spin" />
    </div>

    <div v-else-if="product" class="max-w-4xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div class="card aspect-square flex items-center justify-center bg-placeholder overflow-hidden mb-3">
            <img
              v-if="activeImage"
              :src="resolveImageUrl(activeImage)"
              :alt="product.title"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-8xl">{{ product.category === 'modem' ? '📡' : '📦' }}</span>
          </div>
          <div v-if="product.images?.length > 1" class="flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="(img, i) in product.images"
              :key="img + i"
              type="button"
              class="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition"
              :class="activeIndex === i ? 'border-irancell-yellow' : 'border-transparent opacity-70 hover:opacity-100'"
              @click="activeIndex = i"
            >
              <img :src="resolveImageUrl(img)" :alt="`${product.title} ${i + 1}`" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <div>
          <h1 class="text-2xl lg:text-3xl font-bold mb-4">{{ product.title }}</h1>
          <div class="mb-6">
            <ProductDiscount :product="product" />
          </div>
          <div class="mb-6">
            <span :class="product.stock > 0 ? 'badge-green' : 'badge-red'" class="px-3 py-1 rounded-full text-sm font-bold">
              {{ product.stock > 0 ? `موجود (${product.stock} عدد)` : 'ناموجود' }}
            </span>
          </div>
          <p class="text-body mb-8 leading-relaxed">{{ product.description }}</p>

          <div v-if="product.stock > 0" class="flex items-center gap-4 mb-6">
            <div class="flex items-center border dark:border-gray-600 rounded-xl overflow-hidden">
              <button class="px-4 py-2 qty-btn" @click="qty = Math.max(1, qty - 1)">−</button>
              <span class="px-4 py-2 font-bold">{{ qty }}</span>
              <button class="px-4 py-2 qty-btn" @click="qty = Math.min(product.stock, qty + 1)">+</button>
            </div>
          </div>

          <button class="btn-primary w-full py-4 text-lg" :disabled="product.stock === 0" @click="addToCart">
            افزودن به سبد خرید
          </button>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-20 text-muted">
      <div class="text-5xl mb-4">📦</div>
      <h2 class="text-xl font-bold mb-2">محصول یافت نشد</h2>
      <NuxtLink to="/products" class="btn-primary inline-block mt-4 py-2 px-6">بازگشت به محصولات</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const cartStore = useCartStore()
const { apiFetch, resolveImageUrl } = useApi()
const qty = ref(1)
const activeIndex = ref(0)

const { data: product, pending } = await useAsyncData(`product-${route.params.slug}`, async () => {
  try {
    const res = await apiFetch(`/products/${route.params.slug}`)
    return res.data
  } catch {
    return null
  }
}, { default: () => null })

const activeImage = computed(() => product.value?.images?.[activeIndex.value] || product.value?.images?.[0] || '')

watch(() => product.value?.images, () => { activeIndex.value = 0 })

const addToCart = () => {
  if (!product.value) return
  cartStore.addProduct(product.value, qty.value)
  alert('محصول به سبد خرید اضافه شد')
}
</script>
