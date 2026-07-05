<template>
  <header class="bg-irancell-black text-white sticky top-0 z-50 shadow-lg">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <NuxtLink to="/" class="flex items-center gap-2">
          <SiteLogo img-class="h-9 w-auto" />
        </NuxtLink>

        <nav class="hidden lg:flex items-center gap-5 text-sm">
          <NuxtLink to="/" class="hover:text-irancell-yellow transition">صفحه اصلی</NuxtLink>
          <NuxtLink to="/numbers" class="hover:text-irancell-yellow transition">شماره‌ها</NuxtLink>
          <NuxtLink to="/check-number" class="hover:text-irancell-yellow transition">بررسی شماره</NuxtLink>
          <NuxtLink to="/products" class="hover:text-irancell-yellow transition">محصولات</NuxtLink>
          <NuxtLink to="/order-tracking" class="hover:text-irancell-yellow transition">پیگیری سفارش</NuxtLink>
          <NuxtLink to="/about" class="hover:text-irancell-yellow transition">درباره ما</NuxtLink>
        </nav>

        <div class="flex items-center gap-2">
          <template v-if="userStore.isLoggedIn">
            <span class="hidden sm:block text-sm text-gray-300">{{ userStore.fullName }}</span>
            <button class="text-sm hover:text-irancell-yellow transition px-2" @click="logout">خروج</button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="text-sm hover:text-irancell-yellow transition px-2">ورود</NuxtLink>
            <NuxtLink to="/register" class="hidden sm:block btn-primary text-sm py-1.5 px-3">ثبت‌نام</NuxtLink>
          </template>

          <button class="p-2 hover:bg-white/10 rounded-lg transition text-lg" :title="themeStore.dark ? 'حالت روشن' : 'حالت تاریک'" @click="themeStore.toggle()">
            {{ themeStore.dark ? '☀️' : '🌙' }}
          </button>

          <NuxtLink to="/cart" class="relative p-2 hover:bg-white/10 rounded-lg transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span v-if="cartStore.count > 0" class="absolute -top-1 -right-1 bg-irancell-yellow text-irancell-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {{ cartStore.count }}
            </span>
          </NuxtLink>

          <button class="lg:hidden p-2 hover:bg-white/10 rounded-lg" @click="menuOpen = !menuOpen">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="menuOpen" class="lg:hidden pb-4 border-t border-white/10 pt-4">
        <nav class="flex flex-col gap-3">
          <NuxtLink to="/" class="py-2 hover:text-irancell-yellow" @click="menuOpen = false">صفحه اصلی</NuxtLink>
          <NuxtLink to="/numbers" class="py-2 hover:text-irancell-yellow" @click="menuOpen = false">شماره‌ها</NuxtLink>
          <NuxtLink to="/check-number" class="py-2 hover:text-irancell-yellow" @click="menuOpen = false">بررسی شماره</NuxtLink>
          <NuxtLink to="/products" class="py-2 hover:text-irancell-yellow" @click="menuOpen = false">محصولات</NuxtLink>
          <NuxtLink to="/order-tracking" class="py-2 hover:text-irancell-yellow" @click="menuOpen = false">پیگیری سفارش</NuxtLink>
          <NuxtLink to="/about" class="py-2 hover:text-irancell-yellow" @click="menuOpen = false">درباره ما</NuxtLink>
          <NuxtLink to="/terms" class="py-2 hover:text-irancell-yellow" @click="menuOpen = false">قوانین</NuxtLink>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const cartStore = useCartStore()
const userStore = useUserStore()
const themeStore = useThemeStore()
const menuOpen = ref(false)

onMounted(() => {
  userStore.loadFromStorage()
  themeStore.init()
})

const logout = () => {
  userStore.logout()
}
</script>
