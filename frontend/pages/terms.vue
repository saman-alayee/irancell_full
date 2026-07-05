<template>
  <div>
    <section class="section-muted py-12">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-3xl font-black mb-2">قوانین و مقررات</h1>
        <p class="text-muted">آخرین به‌روزرسانی: {{ updateDate }}</p>
      </div>
    </section>

    <section class="py-12">
      <div class="container mx-auto px-4 max-w-3xl">
        <div class="card p-6 mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p class="text-body leading-relaxed text-sm">
            کاربر گرامی، لطفاً پیش از ثبت سفارش این قوانین را با دقت مطالعه نمایید.
            <strong>ثبت پیش‌خرید به منزله پذیرش کامل قوانین است.</strong>
          </p>
        </div>

        <div class="space-y-6 text-body leading-relaxed">
          <div v-for="section in sections" :key="section.title" class="card p-6">
            <h2 class="text-lg font-bold text-heading mb-3">{{ section.title }}</h2>
            <p class="text-sm leading-relaxed">{{ section.text }}</p>
          </div>

          <div class="card p-6 bg-subtle border border-yellow-400/30">
            <p class="text-sm font-bold text-heading leading-relaxed">
              با ثبت سفارش در سایت، شما اعلام می‌کنید که کلیه قوانین فوق را مطالعه کرده و به آن‌ها پایبند هستید.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const updateDate = '۱۴۰۴/۰۴/۱۵'

const sections = [
  {
    title: 'مبلغ سفارش',
    text: 'مبلغ پرداختی به عنوان مبلغ نهایی می‌باشد و هیچ هزینه دیگری از شما دریافت نخواهد شد. همچنین امکان لغو سفارش و یا بازگشت وجه پس از ثبت سفارش وجود ندارد.',
  },
  {
    title: 'ماهیت سفارش',
    text: 'تمامی سفارش‌های ثبت‌شده در این سایت در مرحله اول پیش‌خرید محسوب می‌شود. پرداخت اولیه تنها به‌عنوان رزرو شماره انتخابی شما است. هزینه ثبت‌نام و فعال‌سازی به صورت رایگان و هزینه ارسال و پستی به صورت پس‌کرایه می‌باشد.',
  },
  {
    title: 'تماس جهت تکمیل خرید',
    text: 'پس از ثبت پیش‌خرید، طی ۱۵ تا ۲۰ روز کاری کارشناسان ما با شما تماس گرفته و جهت تأیید نهایی اطلاعات، دریافت کد تأیید و تکمیل مراحل انتقال مالکیت و سند سیم‌کارت اقدام خواهد شد.',
  },
  {
    title: 'احتمال فروش همزمان',
    text: 'ممکن است شماره سیم‌کارت به دلیل فروش هم‌زمان توسط فرد دیگر، پیش از تماس نهایی به فروش برسد. در این صورت سایت هیچ مسئولیتی ندارد و مبلغ پرداختی به‌طور کامل عودت داده می‌شود یا می‌توانید شماره دیگری انتخاب کنید.',
  },
  {
    title: 'مدارک موردنیاز',
    text: 'ارائه مدارک هویتی مانند کارت ملی برای تکمیل فرآیند ثبت‌نام و انتقال مالکیت الزامی است. ارائه مدرک جهت ثبت‌نام توسط خریدار الزامی می‌باشد.',
  },
  {
    title: 'تعهدات کاربر',
    text: 'کاربر موظف است هنگام ثبت اطلاعات، مشخصات صحیح و قابل تماس وارد کند. در صورت عدم پاسخگویی، ارسال انجام نمی‌شود.',
  },
  {
    title: 'حریم خصوصی و امنیت',
    text: 'سایت موظف است اطلاعات شما را محرمانه نگه دارد و از آن تنها برای نهایی‌سازی خرید استفاده کند.',
  },
]
</script>
