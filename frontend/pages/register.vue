<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-md mx-auto">
      <div class="card p-8">
        <div class="text-center mb-8">
          <SiteLogo img-class="h-12 w-auto mx-auto mb-4" />
          <h1 class="text-2xl font-bold">ثبت‌نام</h1>
          <p class="text-sm text-muted mt-2">
            {{ otpSent ? 'کد تأیید پیامک‌شده را وارد کنید' : 'حساب کاربری رایگان بسازید' }}
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="otpSent ? submit() : sendOtp()">
          <FormField label="نام خانوادگی" hint="نام خانوادگی واقعی خریدار سیم‌کارت مورد نظر — مطابق شناسنامه" required :error="fieldErrors.lastName">
            <input v-model="form.lastName" class="input-field" required :disabled="loading" @input="clearError('lastName')" />
          </FormField>
          <FormField label="نام" hint="نام واقعی شما" required :error="fieldErrors.firstName">
            <input v-model="form.firstName" class="input-field" required :disabled="loading" @input="clearError('firstName')" />
          </FormField>

          <FormField label="نام پدر" hint="نام پدر برای ثبت‌نام سیم‌کارت" required :error="fieldErrors.fatherName">
            <input v-model="form.fatherName" class="input-field" required :disabled="loading" @input="clearError('fatherName')" />
          </FormField>

          <FormField label="کد ملی" hint="۱۰ رقم — بدون خط تیره" required :error="fieldErrors.nationalId">
            <input
              v-model="form.nationalId"
              type="text"
              inputmode="numeric"
              maxlength="10"
              class="input-field"
              dir="ltr"
              placeholder="0123456789"
              required
              :disabled="loading"
              @input="onNationalIdInput"
            />
          </FormField>

          <FormField label="آدرس پستی" hint="آدرس کامل برای ارسال سیم‌کارت" required :error="fieldErrors.address">
            <textarea
              v-model="form.address"
              class="input-field min-h-[88px] resize-y"
              required
              :disabled="loading"
              @input="clearError('address')"
            />
          </FormField>

          <FormField label="شماره موبایل" hint="کد تأیید به این شماره ارسال می‌شود" required :error="fieldErrors.mobile">
            <input
              v-model="form.mobile"
              type="tel"
              maxlength="11"
              class="input-field"
              dir="ltr"
              placeholder="09xxxxxxxxx"
              required
              :disabled="loading || sendingOtp"
              @input="onMobileInput"
            />
          </FormField>

          <FormField label="شماره تلفن جایگزین" hint="شماره دیگری برای تماس کارشناسان" required :error="fieldErrors.secondMobile">
            <input
              v-model="form.secondMobile"
              type="tel"
              maxlength="11"
              class="input-field"
              dir="ltr"
              placeholder="09xxxxxxxxx"
              required
              :disabled="loading"
              @input="onSecondMobileInput"
            />
          </FormField>

          <FormField label="ایمیل" hint="اختیاری — برای دریافت رسید خرید" :error="fieldErrors.email">
            <input v-model="form.email" type="email" class="input-field" dir="ltr" :disabled="loading" @input="clearError('email')" />
          </FormField>

          <FormField label="رمز عبور" hint="حداقل ۶ کاراکتر — برای ورود بعدی" required :error="fieldErrors.password">
            <input v-model="form.password" type="password" class="input-field" dir="ltr" minlength="6" required :disabled="loading" @input="clearError('password')" />
          </FormField>

          <div v-if="otpSent">
            <FormField label="کد تأیید پیامک" hint="کد ۴ رقمی ارسال‌شده به موبایل" required :error="fieldErrors.code">
              <input
                v-model="form.code"
                type="text"
                inputmode="numeric"
                maxlength="4"
                class="input-field text-center text-2xl tracking-[0.5em] font-bold"
                dir="ltr"
                placeholder="----"
                required
                :disabled="loading"
                @input="clearError('code')"
              />
            </FormField>
            <div class="flex items-center justify-between text-sm mt-2">
              <button
                type="button"
                class="text-muted hover:text-heading disabled:opacity-50"
                :disabled="countdown > 0 || sendingOtp"
                @click="sendOtp"
              >
                {{ countdown > 0 ? `ارسال مجدد (${countdown}s)` : 'ارسال مجدد کد' }}
              </button>
              <span class="text-muted">اعتبار: ۵ دقیقه</span>
            </div>
          </div>

          <label class="flex items-start gap-2 text-sm">
            <input v-model="acceptTerms" type="checkbox" class="mt-1" required :disabled="loading" />
            <span>
              <NuxtLink to="/terms" class="link-accent hover:underline">قوانین و مقررات</NuxtLink>
              را مطالعه کرده و می‌پذیرم
            </span>
          </label>

          <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
          <p v-if="successMsg" class="text-green-600 dark:text-green-400 text-sm">{{ successMsg }}</p>

          <button
            type="submit"
            class="btn-primary w-full py-3"
            :disabled="loading || sendingOtp || !acceptTerms"
          >
            {{
              loading ? 'در حال ثبت...'
              : sendingOtp ? 'در حال ارسال...'
              : otpSent ? 'تأیید و ثبت‌نام'
              : 'ارسال کد تأیید'
            }}
          </button>
        </form>

        <p class="text-center text-sm text-muted mt-6">
          قبلاً ثبت‌نام کردید؟
          <NuxtLink to="/login" class="link-accent hover:underline">ورود</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { sanitizeMobile, sanitizeNationalId, validateRegisterForm, firstError } from '~/utils/validation'

definePageMeta({ middleware: 'guest-only' })

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const form = reactive({
  firstName: '',
  lastName: '',
  fatherName: '',
  nationalId: '',
  address: '',
  mobile: '',
  secondMobile: '',
  email: '',
  password: '',
  code: '',
})
const fieldErrors = reactive<Record<string, string>>({})
const acceptTerms = ref(false)
const loading = ref(false)
const sendingOtp = ref(false)
const otpSent = ref(false)
const error = ref('')
const successMsg = ref('')
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval>

const clearError = (key: string) => { fieldErrors[key] = '' }

const applyErrors = (errors: Record<string, string>) => {
  Object.keys(fieldErrors).forEach(k => { fieldErrors[k] = '' })
  Object.assign(fieldErrors, errors)
  error.value = firstError(errors)
}

const onMobileInput = () => {
  form.mobile = sanitizeMobile(form.mobile)
  clearError('mobile')
  if (otpSent.value) {
    otpSent.value = false
    form.code = ''
    successMsg.value = ''
  }
}

const onSecondMobileInput = () => {
  form.secondMobile = sanitizeMobile(form.secondMobile)
  clearError('secondMobile')
}

const onNationalIdInput = () => {
  form.nationalId = sanitizeNationalId(form.nationalId)
  clearError('nationalId')
}

const startCountdown = (seconds: number) => {
  countdown.value = seconds
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(countdownTimer)
  }, 1000)
}

const sendOtp = async () => {
  const errors = validateRegisterForm(form)
  delete errors.code
  if (Object.keys(errors).length) {
    applyErrors(errors)
    return
  }
  sendingOtp.value = true
  error.value = ''
  successMsg.value = ''
  try {
    const res = await userStore.sendOtp(form.mobile, 'register')
    otpSent.value = true
    successMsg.value = res.message || 'کد تأیید ارسال شد'
    startCountdown(res.data?.resendAfter || 60)
  } catch (e: any) {
    error.value = e.message
  } finally {
    sendingOtp.value = false
  }
}

const submit = async () => {
  const errors = validateRegisterForm(form, { requireOtp: true })
  if (Object.keys(errors).length) {
    applyErrors(errors)
    return
  }
  loading.value = true
  error.value = ''
  try {
    await userStore.register({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      fatherName: form.fatherName.trim(),
      nationalId: form.nationalId,
      address: form.address.trim(),
      mobile: form.mobile,
      secondMobile: form.secondMobile,
      email: form.email.trim() || undefined,
      password: form.password,
      code: form.code,
    })
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/'
    router.push(redirect)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onUnmounted(() => clearInterval(countdownTimer))
</script>
