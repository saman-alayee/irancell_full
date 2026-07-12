require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiPublicUrl: process.env.API_PUBLIC_URL || `http://127.0.0.1:${process.env.PORT || 3001}`,
  zarinpal: {
    merchantId: process.env.ZARINPAL_MERCHANT_ID || '',
    sandbox: process.env.ZARINPAL_SANDBOX === 'true',
    callbackUrl: process.env.ZARINPAL_CALLBACK_URL || 'http://127.0.0.1:3001/api/payment/verify',
  },
  zibal: {
    merchantId: process.env.ZIBAL_MERCHANT_ID || '',
    callbackUrl: process.env.ZIBAL_CALLBACK_URL || 'http://127.0.0.1:3001/api/payment/verify/zibal',
  },
  smsIr: {
    apiKey: (process.env.SMS_IR_API_KEY || '').trim(),
    templateId: (process.env.SMS_IR_TEMPLATE_ID || '').trim(),
    codeParam: (process.env.SMS_IR_CODE_PARAM || 'VERIFICATIONCODE').trim(),
    paymentTemplateId: (process.env.SMS_IR_PAYMENT_TEMPLATE_ID || '352975').trim(),
    paymentOrderParam: (process.env.SMS_IR_PAYMENT_ORDER_PARAM || 'ORDER_NUMBER').trim(),
    paymentRefParam: (process.env.SMS_IR_PAYMENT_REF_PARAM || 'REFID').trim(),
    devMode: process.env.SMS_IR_DEV_MODE === 'true',
  },
  irancellShop: {
    apiBase: process.env.IRANCELL_SHOP_API_BASE || 'https://apishop.irancell.ir',
    channel: process.env.IRANCELL_SHOP_CHANNEL || 'eShop',
    devMode: process.env.IRANCELL_SHOP_DEV_MODE === 'true',
    timeoutMs: Number(process.env.IRANCELL_SHOP_TIMEOUT_MS) || 12000,
    lookupDelayMs: Number(process.env.IRANCELL_LOOKUP_DELAY_MS) || 250,
    lookupConcurrency: Number(process.env.IRANCELL_LOOKUP_CONCURRENCY) || 4,
  },
};
