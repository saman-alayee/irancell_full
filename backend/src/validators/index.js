const { body } = require('express-validator');
const { isValidNationalId } = require('../utils/helpers');

const loginValidator = [
  body('email').isEmail().withMessage('ایمیل نامعتبر است'),
  body('password').notEmpty().withMessage('رمز عبور الزامی است'),
];

const numberValidator = [
  body('number').matches(/^09\d{9}$/).withMessage('فرمت شماره تلفن نامعتبر است'),
  body('price').isFloat({ min: 0 }).withMessage('قیمت نامعتبر است'),
  body('status').optional().isIn(['available', 'reserved', 'sold']).withMessage('وضعیت نامعتبر است'),
];

const productValidator = [
  body('title').trim().notEmpty().withMessage('عنوان محصول الزامی است'),
  body('price').isFloat({ min: 0 }).withMessage('قیمت نامعتبر است'),
  body('stock').isInt({ min: 0 }).withMessage('موجودی نامعتبر است'),
  body('images').optional().isArray().withMessage('فرمت تصاویر نامعتبر است'),
  body('images.*').optional().isString().withMessage('آدرس تصویر نامعتبر است'),
];

const checkoutValidator = [
  body('firstName').trim().notEmpty().withMessage('نام الزامی است'),
  body('lastName').trim().notEmpty().withMessage('نام خانوادگی الزامی است'),
  body('mobile').matches(/^09\d{9}$/).withMessage('شماره موبایل نامعتبر است'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('ایمیل نامعتبر است'),
  body('cartItems').isArray({ min: 1 }).withMessage('سبد خرید خالی است'),
];

const discountValidator = [
  body('code').trim().notEmpty().withMessage('کد تخفیف الزامی است'),
  body('type').isIn(['percent', 'fixed']).withMessage('نوع تخفیف نامعتبر است'),
  body('value').isFloat({ min: 0 }).withMessage('مقدار تخفیف نامعتبر است'),
  body('expiresAt').isISO8601().withMessage('تاریخ انقضا نامعتبر است'),
];

const userRegisterValidator = [
  body('firstName').trim().notEmpty().withMessage('نام الزامی است'),
  body('lastName').trim().notEmpty().withMessage('نام خانوادگی الزامی است'),
  body('fatherName').trim().notEmpty().withMessage('نام پدر الزامی است'),
  body('nationalId')
    .custom((val) => isValidNationalId(val))
    .withMessage('کد ملی نامعتبر است'),
  body('address').trim().notEmpty().withMessage('آدرس پستی الزامی است'),
  body('mobile').matches(/^09\d{9}$/).withMessage('شماره موبایل نامعتبر است'),
  body('secondMobile')
    .matches(/^09\d{9}$/)
    .withMessage('شماره تلفن جایگزین نامعتبر است')
    .custom((val, { req }) => {
      const main = String(req.body.mobile || '').replace(/\D/g, '');
      const second = String(val || '').replace(/\D/g, '');
      if (main && second && main === second) {
        throw new Error('شماره تلفن جایگزین نباید با موبایل اصلی یکسان باشد');
      }
      return true;
    }),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('ایمیل نامعتبر است'),
  body('password').isLength({ min: 6 }).withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد'),
  body('code').matches(/^\d{4}$/).withMessage('کد تأیید ۴ رقمی نامعتبر است'),
];

const otpSendValidator = [
  body('mobile').matches(/^09\d{9}$/).withMessage('شماره موبایل نامعتبر است'),
  body('purpose').isIn(['register', 'login']).withMessage('نوع درخواست نامعتبر است'),
];

const userLoginValidator = [
  body('mobile').matches(/^09\d{9}$/).withMessage('شماره موبایل نامعتبر است'),
  body('password').notEmpty().withMessage('رمز عبور الزامی است'),
];

const userLoginOtpValidator = [
  body('mobile').matches(/^09\d{9}$/).withMessage('شماره موبایل نامعتبر است'),
  body('code').matches(/^\d{4}$/).withMessage('کد تأیید ۴ رقمی نامعتبر است'),
];

const payValidator = [
  body('gateway').optional().isIn(['zarinpal', 'zibal']).withMessage('درگاه پرداخت نامعتبر است'),
];

const adminCreateValidator = [
  body('email').isEmail().withMessage('ایمیل نامعتبر است'),
  body('password').isLength({ min: 6 }).withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد'),
  body('name').trim().notEmpty().withMessage('نام الزامی است'),
];

module.exports = {
  loginValidator,
  numberValidator,
  productValidator,
  checkoutValidator,
  discountValidator,
  userRegisterValidator,
  otpSendValidator,
  userLoginValidator,
  userLoginOtpValidator,
  adminCreateValidator,
  payValidator,
};
