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

        <div v-if="gateways.length" class="space-y-3">
          <p class="font-bold text-sm">انتخاب درگاه پرداخت</p>
          <label
            v-for="gateway in gateways"
            :key="gateway.id"
            class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition"
            :class="selectedGateway === gateway.id ? 'border-irancell-yellow bg-irancell-yellow/10' : 'border-gray-200 hover:border-gray-300'"
          >
            <input
              v-model="selectedGateway"
              type="radio"
              name="gateway"
              :value="gateway.id"
              class="accent-irancell-yellow"
            />
            <span class="font-medium">{{ gateway.name }}</span>
          </label>
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

        <button type="submit" class="btn-primary w-full py-4 text-lg" :disabled="loading || !acceptTerms || !selectedGateway">
          {{ loading ? 'در حال پردازش...' : 'پرداخت' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth-user' })

interface PaymentGateway {
  id: string
  name: string
}

const cartStore = useCartStore()
const userStore = useUserStore()
const router = useRouter()
const { apiFetch, formatPrice } = useApi()
const toast = useToastStore()

const acceptTerms = ref(false)
const loading = ref(false)
const gateways = ref<PaymentGateway[]>([])
const selectedGateway = ref('')

onMounted(async () => {
  cartStore.loadFromStorage()
  userStore.loadFromStorage()
  if (cartStore.isEmpty) router.push('/cart')

  try {
    const res = await apiFetch('/payment/gateways')
    gateways.value = res.data || []
    selectedGateway.value = gateways.value[0]?.id || ''
  } catch {
    toast.error('خطا در دریافت درگاه‌های پرداخت')
  }
})

const submit = async () => {
  if (!userStore.user || !selectedGateway.value) return
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
    const payRes = await apiFetch(`/orders/${res.data._id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ gateway: selectedGateway.value }),
    })
    cartStore.clear()
    window.location.href = payRes.data.paymentUrl
  } catch (e: any) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}
</script>
