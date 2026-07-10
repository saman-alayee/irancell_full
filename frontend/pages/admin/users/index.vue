<template>
  <div>
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">کاربران ثبت‌نام‌شده</h1>
        <p class="text-sm text-muted mt-1">لیست کاربران همراه با سفارش‌های آن‌ها</p>
      </div>
      <p class="text-sm text-muted">مجموع: {{ pagination.total }} کاربر</p>
    </div>

    <div class="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
      <input
        v-model="filters.search"
        placeholder="جستجو (نام، موبایل، کد ملی، ایمیل)"
        class="input-field flex-1"
        dir="ltr"
        @keyup.enter="applyFilters"
      />
      <button class="btn-primary py-2 px-6" @click="applyFilters">جستجو</button>
    </div>

    <div class="space-y-4">
      <div v-for="(user, idx) in users" :key="user._id" class="card overflow-hidden">
        <button
          type="button"
          class="w-full p-4 flex flex-col lg:flex-row lg:items-center gap-4 text-right hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
          @click="toggleExpand(user._id)"
        >
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <span class="text-muted text-sm w-6">{{ rowIndex(idx) }}</span>
            <div class="min-w-0 flex-1">
              <p class="font-bold">{{ user.firstName }} {{ user.lastName }}</p>
              <p class="text-sm text-muted" dir="ltr">{{ user.mobile }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm flex-shrink-0">
            <div>
              <p class="text-muted text-xs">کد ملی</p>
              <p dir="ltr">{{ user.nationalId }}</p>
            </div>
            <div>
              <p class="text-muted text-xs">تاریخ ثبت‌نام</p>
              <p>{{ formatDate(user.createdAt) }}</p>
            </div>
            <div>
              <p class="text-muted text-xs">تعداد سفارش</p>
              <p class="font-bold">{{ user.orderCount }}</p>
            </div>
            <div>
              <p class="text-muted text-xs">مجموع پرداخت</p>
              <p class="font-bold">{{ formatPrice(user.totalSpent) }}</p>
            </div>
          </div>

          <span class="text-muted text-lg">{{ expanded[user._id] ? '▲' : '▼' }}</span>
        </button>

        <div v-if="expanded[user._id]" class="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
          <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-b dark:border-gray-700">
            <div><span class="text-muted">نام پدر:</span> {{ user.fatherName }}</div>
            <div><span class="text-muted">موبایل دوم:</span> <span dir="ltr">{{ user.secondMobile }}</span></div>
            <div v-if="user.email"><span class="text-muted">ایمیل:</span> <span dir="ltr">{{ user.email }}</span></div>
            <div class="md:col-span-2"><span class="text-muted">آدرس:</span> {{ user.address }}</div>
          </div>

          <div v-if="!user.orders?.length" class="p-6 text-center text-muted">
            این کاربر هنوز سفارشی ثبت نکرده است
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th class="text-right p-3">شماره سفارش</th>
                  <th class="text-right p-3">اقلام</th>
                  <th class="text-right p-3">مبلغ</th>
                  <th class="text-right p-3">وضعیت</th>
                  <th class="text-right p-3">پرداخت</th>
                  <th class="text-right p-3">تاریخ</th>
                </tr>
              </thead>
              <tbody class="divide-y dark:divide-gray-700">
                <tr v-for="order in user.orders" :key="order._id">
                  <td class="p-3 font-bold" dir="ltr">{{ order.orderNumber }}</td>
                  <td class="p-3">
                    <div v-for="item in order.items" :key="item._id" class="text-xs mb-1">
                      <span>{{ item.type === 'number' ? '📱' : '📦' }}</span>
                      {{ item.title }}
                      <span v-if="item.quantity > 1">×{{ item.quantity }}</span>
                    </div>
                  </td>
                  <td class="p-3 whitespace-nowrap">{{ formatPrice(order.totalAmount) }}</td>
                  <td class="p-3">
                    <span :class="statusColor[order.status]" class="text-xs px-2 py-1 rounded-full">
                      {{ statusLabel[order.status] }}
                    </span>
                  </td>
                  <td class="p-3">
                    <span :class="paymentColor[order.paymentStatus]" class="text-xs px-2 py-1 rounded-full">
                      {{ paymentLabel[order.paymentStatus] }}
                    </span>
                  </td>
                  <td class="p-3 text-muted whitespace-nowrap">{{ formatDate(order.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="!users.length && !loading" class="card p-12 text-center text-muted">
        کاربری یافت نشد
      </div>
    </div>

    <Pagination :page="page" :total-pages="pagination.pages" :total="pagination.total" @update:page="onPageChange" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { apiFetch, formatPrice, statusLabel, statusColor } = useApi()

const users = ref<any[]>([])
const page = ref(1)
const loading = ref(false)
const pagination = ref({ pages: 1, total: 0 })
const filters = reactive({ search: '' })
const expanded = reactive<Record<string, boolean>>({})

const paymentLabel: Record<string, string> = {
  pending: 'در انتظار',
  paid: 'پرداخت شده',
  failed: 'ناموفق',
  refunded: 'بازگشت',
}

const paymentColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

const rowIndex = (idx: number) => (page.value - 1) * 20 + idx + 1
const formatDate = (d: string) => new Date(d).toLocaleDateString('fa-IR')

const toggleExpand = (id: string) => {
  expanded[id] = !expanded[id]
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), limit: '20' })
    if (filters.search) params.set('search', filters.search)
    const res = await apiFetch(`/admin/users?${params}`)
    users.value = res.data
    pagination.value = res.pagination
  } finally {
    loading.value = false
  }
}

const applyFilters = () => { page.value = 1; fetchUsers() }
const onPageChange = (p: number) => { page.value = p; fetchUsers() }

onMounted(fetchUsers)
</script>
