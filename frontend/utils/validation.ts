export const sanitizeMobile = (value: string) => value.replace(/\D/g, '').slice(0, 11)

export const sanitizeNationalId = (value: string) => value.replace(/\D/g, '').slice(0, 10)

export const isValidMobile = (mobile: string) => /^09\d{9}$/.test(sanitizeMobile(mobile))

export const isValidNationalId = (code: string) => {
  const id = sanitizeNationalId(code)
  if (!/^\d{10}$/.test(id)) return false
  if (/^(\d)\1{9}$/.test(id)) return false
  const check = parseInt(id[9], 10)
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(id[i], 10) * (10 - i)
  const remainder = sum % 11
  return remainder < 2 ? check === remainder : check === 11 - remainder
}

export const validateRegisterForm = (form: {
  firstName: string
  lastName: string
  fatherName: string
  nationalId: string
  mobile: string
  secondMobile: string
  email?: string
  password: string
  code?: string
}, options?: { requireOtp?: boolean }) => {
  const errors: Record<string, string> = {}

  if (!form.firstName.trim()) errors.firstName = 'نام الزامی است'
  if (!form.lastName.trim()) errors.lastName = 'نام خانوادگی الزامی است'
  if (!form.fatherName.trim()) errors.fatherName = 'نام پدر الزامی است'

  if (!form.nationalId.trim()) errors.nationalId = 'کد ملی الزامی است'
  else if (!isValidNationalId(form.nationalId)) errors.nationalId = 'کد ملی نامعتبر است'

  if (!form.mobile.trim()) errors.mobile = 'شماره موبایل الزامی است'
  else if (!isValidMobile(form.mobile)) errors.mobile = 'شماره موبایل نامعتبر است'

  if (!form.secondMobile.trim()) errors.secondMobile = 'شماره تماس دوم الزامی است'
  else if (!isValidMobile(form.secondMobile)) errors.secondMobile = 'شماره تماس دوم نامعتبر است'
  else if (sanitizeMobile(form.mobile) === sanitizeMobile(form.secondMobile)) {
    errors.secondMobile = 'شماره تماس دوم نباید با موبایل اصلی یکسان باشد'
  }

  if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'ایمیل نامعتبر است'
  }

  if (!form.password) errors.password = 'رمز عبور الزامی است'
  else if (form.password.length < 6) errors.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد'

  if (options?.requireOtp) {
    if (!form.code?.match(/^\d{4}$/)) errors.code = 'کد تأیید ۴ رقمی نامعتبر است'
  }

  return errors
}

export const firstError = (errors: Record<string, string>) => Object.values(errors)[0] || ''
