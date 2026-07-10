<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-8">ثبت اطلاعات و پرداخت</h1>

    <div class="max-w-lg mx-auto">
      <form class="card p-6 space-y-4" @submit.prevent="submit">
        <div class="bg-subtle rounded-xl p-4 space-y-2 text-sm">
          <p class="font-bold mb-2">اطلاعات خریدار</p>
          <p><span class="text-muted">نام:</span> {{ userStore.user?.firstName }} {{ userStore.user?.lastName }}</p>
          <p dir="ltr"><span class="text-muted">موبایل:</span> {{ userStore.user?.mobile }}</p>
          <p v-if="userStore.user?.email" dir="ltr"><span class="text-muted">ایمیل:</span> {{ userStore.user?.email }}</p>
        </div>

        <label class="flex items-start gap-2 text-sm">
          <input v-model="acceptTerms" type="checkbox" class="mt-1" required />
          <span>
            <NuxtLink to="/terms" target="_blank" class="link-accent hover:underline">قوانین و مقررات</NuxtLink>
            را مطالعه کرده و می‌پذیرم
          </span>
        </label>

        <div class="bg-subtle rounded-xl p-4">
          <div class="flex justify-between font-bold text-lg">
            <span>مبلغ قابل پرداخت</span>
            <span>{{ formatPrice(cartStore.total) }}</span>
          </div>
        </div>

        <button type="submit" class="btn-primary w-full py-4 text-lg" :disabled="loading || !acceptTerms">
          {{ loading ? 'در حال پردازش...' : 'پرداخت' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth-user' })

const cartStore = useCartStore()
const userStore = useUserStore()
const router = useRouter()
const { apiFetch, formatPrice } = useApi()
const toast = useToastStore()

const acceptTerms = ref(false)
const loading = ref(false)

onMounted(() => {
  cartStore.loadFromStorage()
  userStore.loadFromStorage()
  if (cartStore.isEmpty) router.push('/cart')
})

const submit = async () => {
  if (!userStore.user) return
  loading.value = true
  try {
    const res = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        firstName: userStore.user.firstName,
        lastName: userStore.user.lastName,
        mobile: userStore.user.mobile,
        email: userStore.user.email || undefined,
        cartItems: cartStore.toApiItems(),
        discountCode: cartStore.discountCode || undefined,
      }),
    })
    const payRes = await apiFetch(`/orders/${res.data._id}/pay`, { method: 'POST' })
    cartStore.clear()
    window.location.href = payRes.data.paymentUrl
  } catch (e: any) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}
</script>
