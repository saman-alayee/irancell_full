<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-md mx-auto">
      <div class="card p-8">
        <div class="text-center mb-8">
          <SiteLogo img-class="h-12 w-auto mx-auto mb-4" />
          <h1 class="text-2xl font-bold">ورود به حساب</h1>
          <p class="text-sm text-muted mt-2">با رمز عبور یا پیامک وارد شوید</p>
        </div>

        <div class="flex gap-2 mb-6">
          <button
            type="button"
            :class="mode === 'password' ? 'bg-irancell-yellow text-irancell-black' : 'tab-inactive'"
            class="flex-1 py-2 rounded-xl font-bold transition"
            @click="switchMode('password')"
          >
            ورود با رمز
          </button>
          <button
            type="button"
            :class="mode === 'otp' ? 'bg-irancell-yellow text-irancell-black' : 'tab-inactive'"
            class="flex-1 py-2 rounded-xl font-bold transition"
            @click="switchMode('otp')"
          >
            ورود با پیامک
          </button>
        </div>

        <!-- Password login -->
        <form v-if="mode === 'password'" class="space-y-4" @submit.prevent="submitPassword">
          <FormField label="شماره موبایل" hint="شماره ۱۱ رقمی ثبت‌نام" required>
            <input v-model="form.mobile" type="tel" maxlength="11" class="input-field" dir="ltr" placeholder="09xxxxxxxxx" required @input="sanitizeMobile" />
          </FormField>
          <FormField label="رمز عبور" hint="رمز عبور حساب کاربری" required>
            <input v-model="form.password" type="password" class="input-field" dir="ltr" required />
          </FormField>
          <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
          <button type="submit" class="btn-primary w-full py-3" :disabled="loading">
            {{ loading ? 'در حال ورود...' : 'ورود' }}
          </button>
        </form>

        <!-- OTP login -->
        <form v-else class="space-y-4" @submit.prevent="otpSent ? submitOtp() : sendOtp()">
          <FormField label="شماره موبایل" hint="کد ورود به این شماره ارسال می‌شود" required>
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

          <div v-if="otpSent">
            <FormField label="کد تأیید" hint="کد ۴ رقمی پیامک‌شده" required>
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
            </div>
          </div>

          <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
          <p v-if="successMsg" class="text-green-600 dark:text-green-400 text-sm">{{ successMsg }}</p>

          <button type="submit" class="btn-primary w-full py-3" :disabled="loading || sendingOtp">
            {{
              loading ? 'در حال ورود...'
              : sendingOtp ? 'در حال ارسال...'
              : otpSent ? 'تأیید و ورود'
              : 'ارسال کد ورود'
            }}
          </button>
        </form>

        <p class="text-center text-sm text-muted mt-6">
          حساب ندارید؟
          <NuxtLink to="/register" class="link-accent hover:underline">ثبت‌نام</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'guest-only' })

const userStore = useUserStore()
const router = useRouter()
const mode = ref<'password' | 'otp'>('password')
const form = reactive({ mobile: '', password: '', code: '' })
const loading = ref(false)
const sendingOtp = ref(false)
const otpSent = ref(false)
const error = ref('')
const successMsg = ref('')
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval>

const sanitizeMobile = () => {
  form.mobile = form.mobile.replace(/\D/g, '').slice(0, 11)
}

const onMobileInput = () => {
  sanitizeMobile()
  if (otpSent.value) {
    otpSent.value = false
    form.code = ''
    successMsg.value = ''
  }
}

const switchMode = (m: 'password' | 'otp') => {
  mode.value = m
  error.value = ''
  successMsg.value = ''
  otpSent.value = false
  form.code = ''
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
  if (!form.mobile.match(/^09\d{9}$/)) {
    error.value = 'شماره موبایل نامعتبر است'
    return
  }
  sendingOtp.value = true
  error.value = ''
  successMsg.value = ''
  try {
    const res = await userStore.sendOtp(form.mobile, 'login')
    otpSent.value = true
    successMsg.value = res.message || 'کد ورود ارسال شد'
    startCountdown(res.data?.resendAfter || 60)
  } catch (e: any) {
    error.value = e.message
  } finally {
    sendingOtp.value = false
  }
}

const submitPassword = async () => {
  if (!form.mobile.match(/^09\d{9}$/)) {
    error.value = 'شماره موبایل نامعتبر است'
    return
  }
  if (!form.password) {
    error.value = 'رمز عبور الزامی است'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await userStore.login(form.mobile, form.password)
    router.push('/')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const submitOtp = async () => {
  if (!form.mobile.match(/^09\d{9}$/)) {
    error.value = 'شماره موبایل نامعتبر است'
    return
  }
  if (!form.code.match(/^\d{4}$/)) {
    error.value = 'کد تأیید ۴ رقمی نامعتبر است'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await userStore.loginWithOtp(form.mobile, form.code)
    router.push('/')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onUnmounted(() => clearInterval(countdownTimer))
</script>
