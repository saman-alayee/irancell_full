const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]+/g, '')
    .replace(/--+/g, '-');

const generateOrderNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
};

const normalizeMobile = (mobile) => {
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.startsWith('98') && cleaned.length === 12) {
    return '0' + cleaned.slice(2);
  }
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return '0' + cleaned;
  }
  return cleaned;
};

const normalizeNumber = (num) => {
  const cleaned = String(num).replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('09')) return cleaned;
  if (cleaned.length === 10 && cleaned.startsWith('9')) return '0' + cleaned;
  return cleaned;
};

const toSmsIrMobile = (mobile) => {
  const normalized = normalizeMobile(mobile);
  return normalized.startsWith('0') ? normalized.slice(1) : normalized;
};

const formatPrice = (price) => new Intl.NumberFormat('fa-IR').format(price);

const normalizeNationalId = (code) => String(code || '').replace(/\D/g, '');

const isValidNationalId = (code) => {
  const id = normalizeNationalId(code);
  if (!/^\d{10}$/.test(id)) return false;
  if (/^(\d)\1{9}$/.test(id)) return false;
  const check = parseInt(id[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(id[i], 10) * (10 - i);
  const remainder = sum % 11;
  return remainder < 2 ? check === remainder : check === 11 - remainder;
};

module.exports = {
  slugify,
  generateOrderNumber,
  normalizeMobile,
  normalizeNumber,
  toSmsIrMobile,
  formatPrice,
  normalizeNationalId,
  isValidNationalId,
};
