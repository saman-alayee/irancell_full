const axios = require('axios');
const config = require('../config');
const AppError = require('../utils/AppError');

const ZIBAL_ERROR_MESSAGES = {
  102: 'مرچنت زیبال یافت نشد.',
  103: 'درگاه زیبال غیرفعال است. لطفاً در پنل زیبال ترمینال را فعال کنید.',
  104: 'مرچنت زیبال نامعتبر است.',
  105: 'مبلغ پرداخت کمتر از حد مجاز است.',
  106: 'آدرس callback نامعتبر است.',
  113: 'تراکنش قبلاً تأیید شده است.',
};

class ZibalService {
  get baseUrl() {
    return 'https://gateway.zibal.ir/v1';
  }

  parseGatewayError(error) {
    const result = error?.response?.data?.result;
    if (result == null) return null;

    const message = ZIBAL_ERROR_MESSAGES[result]
      || error.response.data.message
      || 'خطا در اتصال به درگاه زیبال';
    return new AppError(message, 502);
  }

  async postGateway(path, payload) {
    try {
      return await axios.post(`${this.baseUrl}${path}`, payload);
    } catch (error) {
      throw this.parseGatewayError(error) || error;
    }
  }

  async requestPayment({ amount, description, mobile, orderId }) {
    if (!config.zibal.merchantId) {
      throw new AppError('درگاه زیبال پیکربندی نشده است', 503);
    }

    const payload = {
      merchant: config.zibal.merchantId,
      amount,
      callbackUrl: config.zibal.callbackUrl,
      description,
      orderId: String(orderId),
    };

    if (mobile) payload.mobile = mobile;

    const response = await this.postGateway('/request', payload);
    const data = response.data;

    if (data?.result === 100 && data?.trackId) {
      return {
        authority: String(data.trackId),
        paymentUrl: `https://gateway.zibal.ir/start/${data.trackId}`,
      };
    }

    const message = ZIBAL_ERROR_MESSAGES[data?.result] || data?.message || 'خطا در ایجاد تراکنش زیبال';
    throw new AppError(message, 502);
  }

  async verifyPayment(trackId) {
    const response = await this.postGateway('/verify', {
      merchant: config.zibal.merchantId,
      trackId: Number(trackId),
    });

    const data = response.data;
    if (data?.result === 100 || data?.result === 201) {
      return { refId: String(data.refNumber || trackId), raw: data };
    }

    const message = ZIBAL_ERROR_MESSAGES[data?.result] || data?.message || 'تأیید پرداخت زیبال ناموفق بود';
    throw new AppError(message, 402);
  }
}

module.exports = new ZibalService();
