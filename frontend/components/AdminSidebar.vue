<template>
  <aside class="fixed top-0 right-0 h-full w-64 bg-irancell-black text-white z-40 transform transition-transform lg:translate-x-0" :class="open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'">
    <div class="p-6 border-b border-white/10">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-irancell-yellow rounded-full flex items-center justify-center">
          <span class="text-irancell-black font-black text-sm">I</span>
        </div>
        <span class="font-bold">پنل مدیریت</span>
      </div>
    </div>
    <nav class="p-4 space-y-1">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition"
        active-class="bg-irancell-yellow text-irancell-black font-bold"
        @click="$emit('close')"
      >
        <span>{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </aside>
  <div v-if="open" class="fixed inset-0 bg-black/50 z-30 lg:hidden" @click="$emit('close')" />
</template>

<script setup lang="ts">
defineProps<{ open?: boolean }>()
defineEmits<{ close: [] }>()

const menuItems = [
  { to: '/admin', icon: '📊', label: 'داشبورد' },
  { to: '/admin/numbers', icon: '📱', label: 'مدیریت شماره‌ها' },
  { to: '/admin/numbers/import', icon: '📤', label: 'ورود گروهی' },
  { to: '/admin/settings/pricing', icon: '💰', label: 'قیمت ایرانسل' },
  { to: '/admin/products', icon: '📦', label: 'مدیریت محصولات' },
  { to: '/admin/orders', icon: '🛒', label: 'مدیریت سفارش‌ها' },
  { to: '/admin/users', icon: '👥', label: 'کاربران' },
  { to: '/admin/discounts', icon: '🏷️', label: 'مدیریت تخفیف' },
  { to: '/admin/admins', icon: '👤', label: 'مدیریت مدیران' },
]
</script>
