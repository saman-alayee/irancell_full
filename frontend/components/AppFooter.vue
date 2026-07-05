<template>
  <footer class="bg-irancell-black text-white mt-auto">
    <div class="container mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="md:col-span-2">
          <SiteLogo img-class="h-10 w-auto mb-4" />
          <p class="text-gray-400 text-sm leading-relaxed max-w-sm mb-4">
            فروشگاه محصولات دیجیتال ایرانسل — شماره VIP و محصولات جانبی با ضمانت اصالت
          </p>
          <div class="space-y-3 text-sm text-gray-400">
            <div>
              <p class="text-irancell-yellow font-bold mb-1">شعبه (یک)</p>
              <p>تبریز — میدان جهاد — جنب کوی تبریزنو</p>
              <p class="mt-1 font-bold text-white">مرکز ارتباط ایرانسل: ۳۱۰۳۸</p>
            </div>
            <div>
              <p class="text-irancell-yellow font-bold mb-1">شعبه (دو)</p>
              <p>میدان یاغچیان — روبروی بلوار بهشت — پلاک ۳</p>
              <ul class="mt-2 space-y-1">
                <li v-for="phone in phones" :key="phone">{{ phone }}</li>
              </ul>
            </div>
          </div>
        </div>
        <div>
          <h4 class="font-bold mb-4 text-irancell-yellow text-sm">دسترسی سریع</h4>
          <ul class="space-y-2 text-sm text-gray-400">
            <li><NuxtLink to="/" class="hover:text-white transition">صفحه اصلی</NuxtLink></li>
            <li><NuxtLink to="/check-number" class="hover:text-white transition">بررسی شماره</NuxtLink></li>
            <li><NuxtLink to="/numbers" class="hover:text-white transition">شماره‌های موجود</NuxtLink></li>
            <li><NuxtLink to="/products" class="hover:text-white transition">محصولات</NuxtLink></li>
            <li><NuxtLink to="/order-tracking" class="hover:text-white transition">پیگیری سفارش</NuxtLink></li>
            <li><NuxtLink to="/about" class="hover:text-white transition">درباره ما</NuxtLink></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold mb-4 text-irancell-yellow text-sm">قوانین و تماس</h4>
          <ul class="space-y-2 text-sm text-gray-400">
            <li><NuxtLink to="/terms" class="hover:text-white transition">قوانین و مقررات</NuxtLink></li>
            <li><NuxtLink to="/login" class="hover:text-white transition">ورود</NuxtLink></li>
            <li><NuxtLink to="/register" class="hover:text-white transition">ثبت‌نام</NuxtLink></li>
            <li v-for="mobile in mobiles" :key="mobile">{{ mobile }}</li>
          </ul>
        </div>
      </div>
      <div class="border-t border-white/10 mt-8 pt-6 text-center text-sm text-gray-500">
        © {{ new Date().getFullYear() }} فروشگاه ۳۱۰۳۸ ایرانسل — تمامی حقوق محفوظ است.
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { formatContactPhone } from '~/composables/useApi'

const phones = [
  formatContactPhone('041-344 007 07'),
  formatContactPhone('041-344 008 08'),
]

const mobiles = [
  formatContactPhone('0900 914 05 02'),
  formatContactPhone('0900 40 946 40'),
]
</script>
