<template>
  <div class="bg-gradient-to-b from-irancell-black to-gray-900 dark:to-gray-950 min-h-screen">
    <ClientOnly>
      <DiscountTimer />
    </ClientOnly>

    <div class="container mx-auto px-4 py-8 lg:py-16">
      <div v-if="pending" class="flex justify-center py-20">
        <div class="w-12 h-12 border-4 border-irancell-yellow border-t-transparent rounded-full animate-spin" />
      </div>

      <div v-else-if="!numberData" class="text-center py-20">
        <div class="text-6xl mb-4">❌</div>
        <h1 class="text-2xl font-bold text-white mb-2">شماره یافت نشد</h1>
        <p class="text-gray-400 mb-6">شماره مورد نظر در سیستم ثبت نشده است</p>
        <div class="flex flex-wrap justify-center gap-3">
          <NuxtLink to="/numbers" class="btn-primary">مشاهده شماره‌های موجود</NuxtLink>
          <NuxtLink to="/" class="btn-outline border-white text-white">صفحه اصلی</NuxtLink>
        </div>
      </div>

      <div v-else-if="numberData" class="max-w-lg mx-auto">
        <div class="card overflow-hidden shadow-2xl">
          <div class="bg-irancell-yellow p-6 text-center">
            <p class="text-sm text-irancell-black/70 mb-2">شماره انتخابی شما</p>
            <h1 class="text-3xl lg:text-4xl font-black tracking-wider text-irancell-black" dir="ltr">
              {{ formatNumber(numberData.number) }}
            </h1>
            <div class="mt-3 flex justify-center">
              <NumberDigits :number="numberData.number" />
            </div>
          </div>

          <div class="p-6 lg:p-8">
            <div v-if="numberData.status === 'sold'" class="text-center py-8">
              <div class="text-5xl mb-4">🔴</div>
              <h2 class="text-xl font-bold text-red-600 dark:text-red-400 mb-2">این شماره قبلاً فروخته شده است</h2>
              <p class="text-muted mb-6">لطفاً شماره دیگری انتخاب کنید</p>
              <NuxtLink to="/numbers" class="btn-outline">مشاهده شماره‌های موجود</NuxtLink>
            </div>

            <div v-else-if="numberData.status === 'reserved'" class="text-center py-8">
              <div class="text-5xl mb-4">⏳</div>
              <h2 class="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">این شماره رزرو شده است</h2>
              <p class="text-muted">لطفاً چند دقیقه دیگر مراجعه کنید</p>
            </div>

            <div v-else>
              <div class="text-center mb-8">
                <p class="text-muted mb-2">قیمت</p>
                <p class="text-4xl font-black text-heading">{{ formatPrice(numberData.price) }}</p>
              </div>

              <div v-if="numberData.description" class="bg-subtle rounded-xl p-4 mb-6 text-sm text-body">
                {{ numberData.description }}
              </div>

              <div class="space-y-3 mb-6">
                <div v-for="feature in features" :key="feature" class="flex items-center gap-2 text-sm">
                  <span class="text-green-500">✓</span>
                  <span>{{ feature }}</span>
                </div>
              </div>

              <button class="btn-primary w-full text-lg py-4" @click="addToCart">
                🛒 افزودن به سبد خرید
              </button>

              <button class="btn-secondary w-full mt-3 py-4" @click="buyNow">
                خرید فوری
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 mt-6">
          <div v-for="badge in badges" :key="badge.label" class="text-center text-white/80">
            <div class="text-2xl mb-1">{{ badge.icon }}</div>
            <p class="text-xs">{{ badge.label }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const { apiFetch, formatPrice, formatNumber } = useApi()

const number = route.params.number as string

const { data: numberData, pending } = await useAsyncData(
  `number-${number}`,
  async () => {
    try {
      const res = await apiFetch(`/numbers/${number}`)
      return res.data
    } catch {
      return null
    }
  },
  { default: () => null }
)

const features = [
  'اپراتور ایرانسل',
  'صفر ( بدون سابقه سلب امتیاز )',
  'فعالسازی ۷ روز کاری',
  'ضمانت بازگشت وجه',
  'قابلیت تحویل حضوری و ارسال پستی',
]

const badges = [
  { icon: '🔒', label: 'پرداخت امن' },
  { icon: '⚡', label: 'تحویل فوری' },
  { icon: '✅', label: 'ضمانت اصالت' },
]

const addToCart = () => {
  if (!numberData.value) return
  const added = cartStore.addNumber(numberData.value.number, numberData.value.price)
  if (added) {
    alert('شماره به سبد خرید اضافه شد')
  } else {
    alert('این شماره قبلاً در سبد خرید است')
  }
}

const buyNow = () => {
  addToCart()
  router.push('/cart')
}
</script>
