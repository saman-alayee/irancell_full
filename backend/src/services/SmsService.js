const axios = require('axios');
const config = require('../config');
const AppError = require('../utils/AppError');
const { toSmsIrMobile } = require('../utils/helpers');

class SmsService {
  async _sendTemplate(mobile, templateId, parameters, { throwOnError = true } = {}) {
    const { apiKey, devMode } = config.smsIr;

    if (devMode) {
      console.log(`[SMS DEV] template ${templateId} to ${mobile}:`, parameters);
      return { dev: true };
    }

    if (!apiKey) {
      if (throwOnError) throw new AppError('تنظیمات پیامک ناقص است — API Key تعریف نشده', 500);
      return null;
    }

    if (!templateId) {
      if (throwOnError) throw new AppError('تنظیمات پیامک ناقص است — TemplateId تعریف نشده', 500);
      return null;
    }

    const payload = {
      mobile: toSmsIrMobile(mobile),
      templateId: Number(templateId),
      parameters: parameters.map(({ name, value }) => ({
        name,
        value: String(value),
      })),
    };

    try {
      const response = await axios.post(
        'https://api.sms.ir/v1/send/verify',
        payload,
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 15000,
        }
      );

      const data = response.data;
      if (data?.status !== 1) {
        const msg = data?.message || 'ارسال پیامک ناموفق بود';
        if (throwOnError) throw new AppError(msg, 502);
        console.error('[SMS.ir] template failed:', msg);
        return null;
      }

      return data;
    } catch (err) {
      if (err instanceof AppError) {
        if (throwOnError) throw err;
        console.error('[SMS.ir]', err.message);
        return null;
      }

      const apiData = err.response?.data;
      const msg = apiData?.message || apiData?.Message || err.message;
      if (throwOnError) throw new AppError(`خطا در ارسال پیامک: ${msg}`, 502);
      console.error('[SMS.ir] request error:', msg);
      return null;
    }
  }

  async sendVerifyCode(mobile, code) {
    const { templateId, codeParam } = config.smsIr;
    return this._sendTemplate(mobile, templateId, [{ name: codeParam, value: code }]);
  }

  async sendPaymentSuccess(mobile, orderNumber) {
    const { paymentTemplateId, paymentOrderParam } = config.smsIr;
    if (!paymentTemplateId) return null;

    return this._sendTemplate(
      mobile,
      paymentTemplateId,
      [{ name: paymentOrderParam, value: String(orderNumber || '').trim() || '—' }],
      { throwOnError: false }
    );
  }
}

module.exports = new SmsService();
