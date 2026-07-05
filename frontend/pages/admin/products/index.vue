<template>
  <div>
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <h1 class="text-2xl font-bold">مدیریت محصولات</h1>
      <button class="btn-primary" @click="openForm()">+ افزودن محصول</button>
    </div>

    <div class="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
      <input v-model="search" placeholder="جستجوی محصول..." class="input-field flex-1" @keyup.enter="applySearch" />
      <button class="btn-secondary py-2 px-6" @click="applySearch">جستجو</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="product in products" :key="product._id" class="card overflow-hidden">
        <div class="aspect-video bg-placeholder flex items-center justify-center overflow-hidden">
          <img v-if="product.images?.[0]" :src="resolveImageUrl(product.images[0])" :alt="product.title" class="w-full h-full object-cover" />
          <span v-else class="text-4xl">{{ product.category === 'modem' ? '📡' : '📦' }}</span>
        </div>
        <div class="p-4">
          <h3 class="font-bold mb-1">{{ product.title }}</h3>
          <ProductDiscount :product="product" />
          <p class="text-sm mb-4 mt-1">موجودی: {{ product.stock }}</p>
          <div class="flex gap-2">
            <button class="btn-outline flex-1 py-2 text-sm" @click="openForm(product)">ویرایش</button>
            <button class="text-red-600 py-2 px-3 text-sm" @click="remove(product._id)">حذف</button>
          </div>
        </div>
      </div>
    </div>

    <Pagination :page="page" :total-pages="pagination.pages" :total="pagination.total" @update:page="onPageChange" />

    <div v-if="showForm" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="showForm = false">
      <div class="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">{{ editing ? 'ویرایش محصول' : 'افزودن محصول' }}</h2>
        <form class="space-y-4" @submit.prevent="save">
          <FormField label="عنوان محصول" hint="نام نمایشی محصول در سایت — مثال: مودم TD-LTE 350" required>
            <input v-model="form.title" class="input-field" required />
          </FormField>
          <FormField label="Slug" hint="آدرس URL محصول — اگر خالی باشد خودکار ساخته می‌شود">
            <input v-model="form.slug" class="input-field" dir="ltr" placeholder="modem-td-lte-350" />
          </FormField>
          <FormField label="توضیحات" hint="شرح کامل محصول برای صفحه جزئیات">
            <textarea v-model="form.description" class="input-field" rows="3" />
          </FormField>
          <div class="grid grid-cols-2 gap-4">
            <FormField label="قیمت (تومان)" hint="قیمت فروش به تومان" required>
              <input v-model.number="form.price" type="number" class="input-field" required />
            </FormField>
            <FormField label="موجودی" hint="تعداد موجود در انبار" required>
              <input v-model.number="form.stock" type="number" class="input-field" required />
            </FormField>
          </div>
          <FormField label="دسته‌بندی" hint="نوع محصول برای فیلتر و نمایش">
            <select v-model="form.category" class="input-field">
              <option value="modem">مودم</option>
              <option value="accessory">لوازم جانبی</option>
            </select>
          </FormField>
          <MultiImageUpload v-model="form.images" label="تصاویر محصول" />

          <div class="border-t dark:border-gray-700 pt-4">
            <h3 class="font-bold mb-3">تخفیف نمایشی (الکی)</h3>
            <label class="flex items-center gap-2 text-sm mb-3">
              <input v-model="form.discountEnabled" type="checkbox" />
              <span>فعال‌سازی تخفیف نمایشی</span>
            </label>
            <div v-if="form.discountEnabled" class="space-y-3">
              <FormField label="درصد تخفیف" hint="مثلاً ۲۰ — قیمت خط‌خورده خودکار محاسبه می‌شود">
                <input v-model.number="form.discountPercent" type="number" min="1" max="99" class="input-field" />
              </FormField>
              <FormField label="تاریخ انقضای تخفیف" hint="بعد از این تاریخ تخفیف نمایش داده نمی‌شود">
                <input v-model="form.discountExpiresAt" type="datetime-local" class="input-field" />
              </FormField>
              <label class="flex items-center gap-2 text-sm">
                <input v-model="form.showDiscountTimer" type="checkbox" />
                <span>نمایش تایمر شمارش معکوس</span>
              </label>
            </div>
          </div>

          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.isActive" type="checkbox" />
            <span>فعال (نمایش در سایت)</span>
          </label>
          <div class="flex gap-3">
            <button type="submit" class="btn-primary flex-1">ذخیره</button>
            <button type="button" class="btn-outline flex-1" @click="showForm = false">انصراف</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { apiFetch, resolveImageUrl } = useApi()
const products = ref<any[]>([])
const page = ref(1)
const search = ref('')
const pagination = ref({ pages: 1, total: 0 })
const showForm = ref(false)
const editing = ref<any>(null)
const form = reactive({
  title: '', slug: '', description: '', price: 0, stock: 0,
  category: 'modem', isActive: true, images: [] as string[],
  discountEnabled: false, discountPercent: 20, discountExpiresAt: '', showDiscountTimer: true,
})

const fetchProducts = async () => {
  const params = new URLSearchParams({ page: String(page.value), limit: '12' })
  if (search.value) params.set('search', search.value)
  const res = await apiFetch(`/admin/products?${params}`)
  products.value = res.data
  pagination.value = res.pagination
}

const applySearch = () => { page.value = 1; fetchProducts() }
const onPageChange = (p: number) => { page.value = p; fetchProducts() }

const openForm = (product?: any) => {
  editing.value = product || null
  if (product) {
    Object.assign(form, {
      ...product,
      images: [...(product.images || [])],
      discountExpiresAt: product.discountExpiresAt
        ? new Date(product.discountExpiresAt).toISOString().slice(0, 16)
        : '',
    })
  } else {
    Object.assign(form, {
      title: '', slug: '', description: '', price: 0, stock: 0,
      category: 'modem', isActive: true, images: [],
      discountEnabled: false, discountPercent: 20, discountExpiresAt: '', showDiscountTimer: true,
    })
  }
  showForm.value = true
}

const save = async () => {
  try {
    const payload: any = {
      title: form.title,
      slug: form.slug || undefined,
      description: form.description,
      price: form.price,
      stock: form.stock,
      category: form.category,
      isActive: form.isActive,
      images: form.images.filter(Boolean),
      discountEnabled: form.discountEnabled,
      discountPercent: form.discountPercent,
      showDiscountTimer: form.showDiscountTimer,
      discountExpiresAt: form.discountExpiresAt ? new Date(form.discountExpiresAt).toISOString() : null,
    }
    if (editing.value) {
      await apiFetch(`/admin/products/${editing.value._id}`, { method: 'PUT', body: JSON.stringify(payload) })
    } else {
      await apiFetch('/admin/products', { method: 'POST', body: JSON.stringify(payload) })
    }
    showForm.value = false
    await fetchProducts()
  } catch (e: any) { alert(e.message) }
}

const remove = async (id: string) => {
  if (!confirm('آیا مطمئن هستید؟')) return
  await apiFetch(`/admin/products/${id}`, { method: 'DELETE' })
  await fetchProducts()
}

onMounted(fetchProducts)
</script>
