<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <h1 class="text-2xl font-bold">داشبورد</h1>
      <p v-if="stats" class="text-sm text-muted">آخرین بروزرسانی: {{ lastUpdated }}</p>
    </div>

    <div v-if="pending" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="card animate-pulse h-32 bg-placeholder" />
    </div>

    <template v-else-if="stats">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard title="کل سفارش‌ها" :value="stats.orderCount || 0" icon="🛒" />
        <StatCard title="سفارش پرداخت‌شده" :value="stats.paidOrderCount || 0" icon="✅" />
        <StatCard title="درآمد کل" :value="formatPrice(stats.totalRevenue || 0)" icon="💰" />
        <StatCard title="میانگین سفارش" :value="formatPrice(stats.avgOrderValue || 0)" icon="📊" />
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="سفارش امروز" :value="stats.todayOrders || 0" icon="📅" />
        <StatCard title="درآمد امروز" :value="formatPrice(stats.todayRevenue || 0)" icon="💵" />
        <StatCard title="سفارش ۷ روز اخیر" :value="stats.weekOrders || 0" icon="📈" />
        <StatCard title="درآمد ۷ روز اخیر" :value="formatPrice(stats.weekRevenue || 0)" icon="🔥" />
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="در انتظار پرداخت" :value="stats.pendingPayments || 0" icon="⏳" />
        <StatCard title="پرداخت ناموفق" :value="stats.failedPayments || 0" icon="❌" />
        <StatCard title="شماره موجود" :value="stats.numberStats?.available || 0" icon="📱" />
        <StatCard title="محصولات" :value="stats.productCount || 0" icon="📦" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DashboardChart
          title="سفارشات ۳۰ روز اخیر"
          :labels="orderChartLabels"
          :data="orderChartData"
          color="#FFCC00"
          y-label="تعداد سفارش"
          x-label="تاریخ (روز/ماه)"
        />
        <DashboardChart
          title="درآمد ۳۰ روز اخیر"
          :labels="revenueChartLabels"
          :data="revenueChartData"
          color="#1A1A1A"
          y-format="money"
          y-label="درآمد (تومان)"
          x-label="تاریخ (روز/ماه)"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <DashboardBreakdown
          title="وضعیت سفارش"
          :items="statusBreakdown"
          color="#FFCC00"
        />
        <DashboardBreakdown
          title="وضعیت پرداخت"
          :items="paymentBreakdown"
          color="#22c55e"
        />
        <DashboardBreakdown
          title="فروش بر اساس نوع"
          :items="itemTypeBreakdown"
          color="#3b82f6"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div class="card p-5">
          <p class="text-sm text-muted mb-1">فروش شماره (پرداخت‌شده)</p>
          <p class="text-2xl font-black">{{ numberSales.count }} مورد</p>
          <p class="text-sm text-muted mt-1">{{ formatPrice(numberSales.revenue) }}</p>
        </div>
        <div class="card p-5">
          <p class="text-sm text-muted mb-1">فروش محصول (پرداخت‌شده)</p>
          <p class="text-2xl font-black">{{ productSales.count }} مورد</p>
          <p class="text-sm text-muted mt-1">{{ formatPrice(productSales.revenue) }}</p>
        </div>
        <div class="card p-5">
          <p class="text-sm text-muted mb-1">شماره‌های فروخته‌شده / رزرو</p>
          <p class="text-2xl font-black">{{ stats.numberStats?.sold || 0 }} / {{ stats.numberStats?.reserved || 0 }}</p>
          <p class="text-sm text-muted mt-1">موجود: {{ stats.numberStats?.available || 0 }}</p>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="p-5 border-b dark:border-gray-700 flex items-center justify-between gap-3">
          <h3 class="font-bold">آخرین سفارش‌ها</h3>
          <NuxtLink to="/admin/orders" class="text-sm text-irancell-yellow hover:underline">مشاهده همه</NuxtLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-subtle">
              <tr>
                <th class="p-3 text-right">شماره سفارش</th>
                <th class="p-3 text-right">مشتری</th>
                <th class="p-3 text-right">مبلغ</th>
                <th class="p-3 text-right">وضعیت</th>
                <th class="p-3 text-right">پرداخت</th>
                <th class="p-3 text-right">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="order in stats.recentOrders"
                :key="order.id"
                class="border-t dark:border-gray-700 hover:bg-subtle/50"
              >
                <td class="p-3 font-mono" dir="ltr">{{ order.orderNumber }}</td>
                <td class="p-3">
                  <p>{{ order.customer || '—' }}</p>
                  <p class="text-xs text-muted" dir="ltr">{{ order.mobile }}</p>
                </td>
                <td class="p-3 font-bold">{{ formatPrice(order.totalAmount) }}</td>
                <td class="p-3">{{ statusLabel[order.status] || order.status }}</td>
                <td class="p-3">{{ paymentLabel[order.paymentStatus] || order.paymentStatus }}</td>
                <td class="p-3 text-muted whitespace-nowrap">{{ formatDate(order.createdAt) }}</td>
              </tr>
              <tr v-if="!stats.recentOrders?.length">
                <td colspan="6" class="p-8 text-center text-muted">سفارشی ثبت نشده است</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { apiFetch, formatPrice, statusLabel } = useApi()

const paymentLabel: Record<string, string> = {
  pending: 'در انتظار',
  paid: 'پرداخت‌شده',
  failed: 'ناموفق',
  refunded: 'استرداد',
}

const itemTypeLabel: Record<string, string> = {
  number: 'شماره',
  product: 'محصول',
}

const { data: stats, pending, refresh } = await useAsyncData('dashboard', async () => {
  try {
    const res = await apiFetch('/admin/dashboard')
    return res.data
  } catch {
    return null
  }
}, { default: () => null })

const lastUpdated = computed(() => {
  const d = new Date()
  return d.toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit' })
})

const orderChartLabels = computed(() => stats.value?.charts?.ordersByDay?.map((d: any) => d.date) || [])
const orderChartData = computed(() => stats.value?.charts?.ordersByDay?.map((d: any) => d.count) || [])
const revenueChartLabels = computed(() => stats.value?.charts?.revenueByDay?.map((d: any) => d.date) || [])
const revenueChartData = computed(() => stats.value?.charts?.revenueByDay?.map((d: any) => d.total) || [])

const statusBreakdown = computed(() =>
  (stats.value?.charts?.ordersByStatus || []).map((s: any) => ({
    label: statusLabel[s.status] || s.status,
    value: s.count,
  }))
)

const paymentBreakdown = computed(() =>
  (stats.value?.charts?.paymentByStatus || []).map((s: any) => ({
    label: paymentLabel[s.status] || s.status,
    value: s.count,
  }))
)

const itemTypeBreakdown = computed(() =>
  (stats.value?.charts?.salesByItemType || []).map((s: any) => ({
    label: itemTypeLabel[s.type] || s.type,
    value: s.revenue,
    display: `${s.count} مورد · ${formatPrice(s.revenue)}`,
  }))
)

const numberSales = computed(() => {
  const row = stats.value?.charts?.salesByItemType?.find((s: any) => s.type === 'number')
  return { count: row?.count || 0, revenue: row?.revenue || 0 }
})

const productSales = computed(() => {
  const row = stats.value?.charts?.salesByItemType?.find((s: any) => s.type === 'product')
  return { count: row?.count || 0, revenue: row?.revenue || 0 }
})

const formatDate = (value: string) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('fa-IR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  const interval = setInterval(() => refresh(), 5 * 60 * 1000)
  onUnmounted(() => clearInterval(interval))
})
</script>
