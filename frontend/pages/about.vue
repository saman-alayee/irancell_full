<template>
  <div>
    <section class="bg-irancell-black text-white py-16">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-3xl lg:text-4xl font-black mb-4">درباره ما</h1>
        <p class="text-gray-400 max-w-xl mx-auto">نمایندگی رسمی ایرانسل — ارائه‌دهنده شماره‌های VIP و محصولات جانبی</p>
      </div>
    </section>

    <section class="py-16">
      <div class="container mx-auto px-4 max-w-3xl">
        <div class="prose prose-lg dark:prose-invert mx-auto space-y-6 text-body leading-relaxed">
          <p>
            ما به‌عنوان <strong>نمایندگی رسمی ایرانسل</strong>، با بیش از ۱۰ سال تجربه در حوزه فروش شماره‌های رند و محصولات مخابراتی،
            خدمات حرفه‌ای و مطمئن به مشتریان ارائه می‌دهیم.
          </p>
          <p>
            هر ماه بیش از <strong>۲۰۰۰ شماره جدید</strong> دریافت می‌کنیم و با ارسال لینک اختصاصی، امکان خرید آنلاین سریع و آسان را فراهم کرده‌ایم.
          </p>

          <h2 class="text-xl font-bold text-heading mt-10">ارزش‌های ما</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
            <div v-for="v in values" :key="v.title" class="card p-5">
              <div class="text-2xl mb-2">{{ v.icon }}</div>
              <h3 class="font-bold mb-1">{{ v.title }}</h3>
              <p class="text-sm text-muted">{{ v.desc }}</p>
            </div>
          </div>

          <h2 class="text-xl font-bold text-heading mt-10">شعب و تماس</h2>
          <div class="space-y-4 not-prose">
            <div v-for="branch in branches" :key="branch.title" class="card p-5">
              <h3 class="font-bold text-heading mb-3">{{ branch.title }}</h3>
              <ul class="space-y-2 text-sm text-body">
                <li v-for="(line, i) in branch.lines" :key="i" class="flex gap-2">
                  <span class="flex-shrink-0">{{ line.icon }}</span>
                  <span>{{ line.text }}</span>
                </li>
              </ul>
            </div>
          </div>

          <p class="text-sm text-muted not-prose mt-6">
            🕐 ساعات کاری: شنبه تا پنج‌شنبه، ۹ تا ۱۸
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const values = [
  { icon: '✅', title: 'اصالت', desc: 'تمامی محصولات و سیم‌کارت‌ها اصل و دارای ضمانت' },
  { icon: '⚡', title: 'سرعت', desc: 'تحویل و فعال‌سازی در سریع‌ترین زمان ممکن' },
  { icon: '🤝', title: 'اعتماد', desc: 'شفافیت کامل در قیمت‌گذاری و فرآیند خرید' },
  { icon: '💬', title: 'پشتیبانی', desc: 'تیم پشتیبانی متخصص در تمام مراحل' },
]

const branches = [
  {
    title: 'شعبه (یک)',
    lines: [
      { icon: '📍', text: 'تبریز — میدان جهاد — جنب کوی تبریزنو' },
      { icon: '📞', text: 'مرکز ارتباط با ایرانسل: ۳۱۰۳۸ (فول سرویس)' },
    ],
  },
  {
    title: 'شعبه (دو)',
    lines: [
      { icon: '📍', text: 'میدان یاغچیان — روبروی بلوار بهشت — پلاک ۳ — دفتر پیشخوان دولت ستاری' },
      { icon: '📞', text: '۰۴۱-۳۴۴ ۰۰۷ ۰۷' },
      { icon: '📞', text: '۰۴۱-۳۴۴ ۰۰۸ ۰۸' },
      { icon: '📱', text: '۰۹۰۰ ۹۱۴ ۰۵ ۰۲' },
      { icon: '📱', text: '۰۹۰۰ ۴۰ ۹۴۶ ۴۰' },
    ],
  },
]
</script>
