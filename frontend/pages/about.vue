<template>
  <div>
    <section class="bg-irancell-black text-white py-16">
      <div class="container mx-auto px-4 text-center">
        <SiteLogo img-class="h-12 w-auto mx-auto mb-6" />
        <h1 class="text-3xl lg:text-4xl font-black mb-4">درباره ما</h1>
      </div>
    </section>

    <section class="py-16">
      <div class="container mx-auto px-4 max-w-3xl">
        <div class="space-y-6 text-body leading-relaxed text-lg">
          <p>
            در بازار پر رقیب امروزی ، نحوه ارائه یک محصول یا خدمت تا حد زیادی میتواند در موفقیت یک کسب و کار تعیین کننده باشد .
          </p>
          <p>
            ما در خدمتتان هستیم تا شماره تلفن برازنده شما را در اختیارتان بگذاریم و محصولات دیجیتال ایرانسل را در هر کجای کشورمان باشید برایتان ارسال نماییم .
          </p>

          <div class="card p-6 bg-subtle text-center space-y-2">
            <p class="font-bold text-heading text-xl">مرکز خدمات ارتباطی ایرانسل ۳۱۰۳۸</p>
            <p class="text-muted">( فول سرویس )</p>
            <p class="text-sm text-body">با مجوز رسمی از سازمان تنظیم مقررات و ارتباطات رادیویی</p>
          </div>

          <h2 class="text-xl font-bold text-heading pt-6">ارتباط با ما</h2>
          <div class="space-y-4">
            <div class="card p-5">
              <h3 class="font-bold text-heading mb-3">شعبه (یک)</h3>
              <p class="text-sm mb-2">📍 تبریز — میدان جهاد — جنب کوی تبریزنو</p>
              <p class="text-sm font-bold text-heading">📞 مرکز ارتباط با ایرانسل: ۳۱۰۳۸ (فول سرویس)</p>
            </div>
            <div class="card p-5">
              <h3 class="font-bold text-heading mb-3">شعبه (دو)</h3>
              <p class="text-sm mb-3">📍 میدان یاغچیان — روبروی بلوار بهشت — پلاک ۳ — دفتر پیشخوان دولت ستاری</p>
              <ul class="space-y-1 text-sm">
                <li v-for="phone in branchTwoPhones" :key="phone" dir="ltr" class="text-right">📞 {{ phone }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const branchTwoPhones = [
  '041-344 007 07',
  '041-344 008 08',
  '0900 914 05 02',
  '0900 40 946 40',
]
</script>
