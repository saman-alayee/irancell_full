<template>
  <div>
    <ClientOnly>
      <DiscountTimer />
    </ClientOnly>

    <!-- Hero -->
    <section class="relative bg-gradient-to-br from-irancell-black via-gray-900 to-irancell-black text-white overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-10 right-10 w-72 h-72 bg-irancell-yellow rounded-full blur-3xl" />
        <div class="absolute bottom-10 left-10 w-96 h-96 bg-irancell-yellow rounded-full blur-3xl" />
      </div>
      <div class="container mx-auto px-4 py-16 lg:py-24 relative">
        <div class="max-w-3xl mx-auto text-center">
          <span class="inline-block bg-irancell-yellow text-irancell-black text-sm font-bold px-4 py-1 rounded-full mb-6">
            نمایندگی رسمی ایرانسل
          </span>
          <h1 class="mb-6 leading-tight">
            <span class="block text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              فروشگاه محصولات دیجیتال
            </span>
            <span class="block text-5xl sm:text-6xl lg:text-7xl font-black text-irancell-yellow">
              ایرانسل
            </span>
          </h1>
          <p class="text-gray-300 text-lg mb-10 max-w-xl mx-auto">
            شماره VIP، مودم 4G و محصولات دیجیتال — ارسال به سراسر کشور
          </p>
          <form class="max-w-lg mx-auto mb-4" @submit.prevent="doHomeSearch">
            <NumberSearch
              v-model="homeSearchQuery"
              variant="hero"
              placeholder="مثال: 09309988235"
              @search="doHomeSearch"
            />
          </form>
          <div class="flex flex-wrap justify-center gap-4 mt-8">
            <NuxtLink to="/numbers" class="btn-primary">مشاهده شماره‌ها</NuxtLink>
            <NuxtLink to="/products" class="btn-outline border-white text-white hover:bg-white hover:text-irancell-black">محصولات</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="py-12 section-muted">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="stat in stats" :key="stat.label" class="text-center">
            <p class="text-3xl lg:text-4xl font-black text-heading mb-1">{{ stat.value }}</p>
            <p class="text-sm text-muted">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Numbers -->
    <section v-if="featuredNumbers.length" class="py-16 section-muted">
      <div class="container mx-auto px-4">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 class="text-2xl font-bold mb-1">شماره‌های پیشنهادی</h2>
            <p class="text-muted text-sm">منتخب شماره‌های VIP موجود</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <NuxtLink to="/sim-search" class="btn-outline py-2 px-4 text-sm">جستجوی شماره</NuxtLink>
            <NuxtLink to="/numbers" class="text-sm font-bold link-accent hover:text-irancell-yellow transition">مشاهده همه ←</NuxtLink>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink
            v-for="num in featuredNumbers"
            :key="num._id"
            :to="`/i/${num.number}`"
            class="card group overflow-hidden hover:shadow-xl hover:border-irancell-yellow border-2 border-transparent transition-all duration-300"
          >
            <div class="bg-gradient-to-br from-irancell-black to-gray-800 p-4 text-center relative overflow-hidden">
              <div class="absolute inset-0 opacity-20 bg-irancell-yellow blur-2xl scale-150 group-hover:opacity-30 transition" />
              <p class="relative text-xl font-black tracking-wider text-white mb-3 group-hover:text-irancell-yellow transition" dir="ltr">
                {{ formatNumber(num.number) }}
              </p>
              <div class="relative flex justify-center">
                <NumberDigits :number="num.number" />
              </div>
            </div>
            <div class="p-4 flex items-center justify-between gap-2">
              <NumberPriceDisplay :price="num.price" size="sm" align="start" />
              <span class="badge-green text-xs px-2 py-1 rounded-full shrink-0">موجود</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Services -->
    <section class="py-16 section-alt">
      <div class="container mx-auto px-4">
        <h2 class="text-2xl font-bold text-center mb-3">چرا ما؟</h2>
        <p class="text-muted text-center mb-10">خدمات حرفه‌ای با استاندارد نمایندگی رسمی</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="service in services" :key="service.title" class="card p-6 text-center hover:shadow-md transition group">
            <div class="w-14 h-14 bg-irancell-yellow/20 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 group-hover:bg-irancell-yellow transition">{{ service.icon }}</div>
            <h3 class="font-bold mb-2">{{ service.title }}</h3>
            <p class="text-sm text-muted leading-relaxed">{{ service.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section v-if="featuredProducts.length" class="py-16 section-muted">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-bold">محصولات پرفروش</h2>
          <NuxtLink to="/products" class="text-sm font-bold link-accent hover:text-irancell-yellow transition">مشاهده همه ←</NuxtLink>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="product in featuredProducts"
            :key="product._id"
            :to="`/product/${product.slug}`"
            class="card hover:shadow-lg transition group overflow-hidden"
          >
            <div class="aspect-video bg-placeholder flex items-center justify-center overflow-hidden">
              <img v-if="product.images?.[0]" :src="resolveImageUrl(product.images[0])" :alt="product.title" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <span v-else class="text-5xl">{{ product.category === 'modem' ? '📡' : '📦' }}</span>
            </div>
            <div class="p-4">
              <h3 class="font-bold mb-1 group-hover:text-irancell-yellow transition">{{ product.title }}</h3>
              <ProductDiscount :product="product" />
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <FaqSection />

    <!-- CTA -->
    <section class="py-16 bg-irancell-yellow">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-2xl lg:text-3xl font-black text-irancell-black mb-4">همین الان شماره رند خود را پیدا کنید</h2>
        <p class="text-irancell-black/70 mb-8">بیش از ۲۰۰۰۰ شماره جدید در ماه</p>
        <div class="flex flex-wrap justify-center gap-4">
          <NuxtLink to="/numbers" class="btn-secondary">مشاهده شماره‌ها</NuxtLink>
          <NuxtLink to="/products" class="btn-outline border-irancell-black">محصولات جانبی</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { digitCount, payloadToQuery, type SimSearchPayload } from '~/utils/numberSearch'

useHead({ title: 'فروشگاه ایرانسل' })

const router = useRouter()
const { apiFetch, formatNumber, resolveImageUrl } = useApi()
const toast = useToastStore()
const homeSearchQuery = ref('')
const featuredNumbers = ref<any[]>([])
const featuredProducts = ref<any[]>([])

const doHomeSearch = () => {
  const q = homeSearchQuery.value.trim()
  if (digitCount(q) < 3) {
    toast.warning('حداقل ۳ رقم برای جستجو وارد کنید')
    return
  }
  const payload: SimSearchPayload = { mode: 'simple', query: q }
  router.push({ path: '/sim-search', query: payloadToQuery(payload) })
}

const stats = [
  { value: '+۲۰۰۰۰', label: 'شماره جدید در ماه' },
  { value: '+۵۰۰۰', label: 'مشتری راضی' },
  { value: '۲۴/۷', label: 'پشتیبانی' },
  { value: '۱۰۰٪', label: 'ضمانت اصالت' },
]

const services = [
  { icon: '📱', title: 'شماره رند VIP', desc: 'انتخاب از بین هزاران شماره خاص و به‌یادماندنی' },
  { icon: '⚡', title: 'تحویل فوری', desc: 'فعال‌سازی و تحویل سیم‌کارت در کمترین زمان' },
  { icon: '🔒', title: 'پرداخت امن', desc: 'درگاه معتبر زرین‌پال با رمزنگاری SSL' },
  { icon: '💬', title: 'پشتیبانی تخصصی', desc: 'مشاوره رایگان قبل و بعد از خرید' },
]

onMounted(async () => {
  try {
    const [numsRes, prodsRes] = await Promise.all([
      apiFetch('/numbers/search?limit=4&status=available'),
      apiFetch('/products?limit=3'),
    ])
    featuredNumbers.value = numsRes.data || []
    featuredProducts.value = prodsRes.data || []
  } catch {}
})
</script>

<style scoped>
.btn-outline.border-white { border-color: white; }
</style>