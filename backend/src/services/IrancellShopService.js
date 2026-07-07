const axios = require('axios');
const config = require('../config');
const { normalizeNumber } = require('../utils/helpers');

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Origin: 'https://shop.irancell.ir',
  Referer: 'https://shop.irancell.ir/fa/sim-search',
};

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const SIM_PRODUCT_IDS = [820, 157, 126];
const NETWORK_ERRORS = /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|ECONNRESET|timeout|Network Error/i;

const toAsciiDigits = (value) =>
  String(value ?? '').replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));

const normalizeIrancellMsisdn = (value) => {
  const digits = toAsciiDigits(value).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('09')) return digits;
  if (digits.length === 10 && digits.startsWith('9')) return `0${digits}`;
  if (digits.length === 10 && digits.startsWith('90')) return `0${digits}`;
  return digits;
};

/** 09001022053 → 9001022053 */
const toIrancellPattern = (number) => {
  const normalized = normalizeNumber(toAsciiDigits(number));
  if (normalized.length === 11 && normalized.startsWith('09')) return normalized.slice(1);
  if (normalized.length === 10 && normalized.startsWith('9')) return normalized;
  return toAsciiDigits(number).replace(/\D/g, '');
};

const sameMsisdn = (a, b) => {
  const da = normalizeIrancellMsisdn(a);
  const db = normalizeIrancellMsisdn(b);
  if (!da || !db) return false;
  return da === db || da.slice(-10) === db.slice(-10);
};

/**
 * قیمت پایه = netPrice (همان «۱.۹ میلیون» که سایت ایرانسل نشان می‌دهد)
 * finalPrice = netPrice + VAT (مثلاً ۲.۰۹ میلیون)
 */
const extractPrices = (item, products = {}) => {
  const product = products[item?.pool] || {};
  const netPrice = Math.round(Number(product.netPrice ?? 0));
  const finalPrice = Math.round(
    Number(product.finalPrice ?? product.price ?? item?.price ?? 0)
  );
  const vat = Math.round(Number(product.vat ?? 0));

  let basePrice = netPrice;
  if (!basePrice && finalPrice) basePrice = finalPrice;
  if (!basePrice && Number(item?.price) > 0) basePrice = Math.round(Number(item.price));

  return {
    basePrice,
    netPrice: netPrice || basePrice,
    finalPriceWithVat: finalPrice || (basePrice + vat) || basePrice,
    vat,
  };
};

const extractBasePrice = (item, products = {}) => extractPrices(item, products).basePrice;

const isNetworkError = (err) => NETWORK_ERRORS.test(String(err?.message || err?.code || ''));

class IrancellShopService {
  constructor() {
    this.client = axios.create({
      baseURL: config.irancellShop.apiBase,
      timeout: config.irancellShop.timeoutMs,
      headers: DEFAULT_HEADERS,
      validateStatus: () => true,
    });
    this.sessionCookie = '';
    this.sessionAt = 0;
    this.simProductIds = null;
    this.simProductIdsAt = 0;
  }

  async ensureSession(force = false) {
    const stale = Date.now() - this.sessionAt > 5 * 60 * 1000;
    if (!force && this.sessionCookie && !stale) return;
    try {
      const res = await axios.get('https://shop.irancell.ir/fa/sim-search', {
        timeout: Math.min(config.irancellShop.timeoutMs, 10000),
        headers: { 'User-Agent': DEFAULT_HEADERS['User-Agent'] },
        validateStatus: () => true,
      });
      const cookies = res.headers['set-cookie'] || [];
      this.sessionCookie = cookies.map((c) => c.split(';')[0]).join('; ');
      this.sessionAt = Date.now();
    } catch {
      this.sessionCookie = '';
      this.sessionAt = 0;
    }
  }

  devLookup(number) {
    const n = normalizeNumber(number);
    const mocks = {
      '09001071252': { available: true, basePrice: 0, pool: '900S1', msisdnDisplay: '900 - 107 - 1252' },
      '09001022053': { available: true, basePrice: 1900000, netPrice: 1900000, finalPriceWithVat: 2090000, pool: '900S1', msisdnDisplay: '900 - 102 - 2053' },
      '09001234567': { available: true, basePrice: 8500000, pool: '900S4', msisdnDisplay: '900 - 123 - 4567' },
      '09009999999': { available: true, basePrice: 25000000, pool: '900S5', msisdnDisplay: '900 - 999 - 9999' },
    };
    if (mocks[n]) {
      return { found: true, number: n, ...mocks[n], source: 'dev-mock', pattern: toIrancellPattern(n) };
    }
    return {
      found: true,
      number: n,
      available: false,
      basePrice: 0,
      source: 'dev-mock',
      pattern: toIrancellPattern(n),
      error: 'DEV_MODE فعال است — فقط ۴ شماره تستی mock موجودند. IRANCELL_SHOP_DEV_MODE=false بگذارید.',
    };
  }

  findMatch(items, target, pattern) {
    if (!items?.length) return null;
    let match = items.find((item) => sameMsisdn(item.msisdn, target));
    if (match) return match;
    if (pattern.length === 10 && items.length === 1) return items[0];
    const patternTail = pattern.replace(/\D/g, '').slice(-10);
    match = items.find((item) => normalizeIrancellMsisdn(item.msisdn).slice(-10) === patternTail);
    return match || null;
  }

  parseGeneralResponse(number, data, pattern) {
    if (!data || data.result_code !== 0) {
      const msg = data?.info?.fa?.message || data?.result_message || 'خطا در استعلام ایرانسل';
      const rateLimited = data?.result_code === 429 || /تلاش|rate|limit/i.test(msg);
      return {
        found: true,
        number,
        available: false,
        basePrice: 0,
        error: msg,
        rateLimited,
        source: 'irancell-general',
        pattern,
      };
    }

    const result = data.result || {};
    const items = result.numbers || [];
    const products = result.products || {};
    const target = normalizeNumber(number);
    const match = this.findMatch(items, target, pattern);

    if (!match) {
      return {
        found: true,
        number: target,
        available: false,
        basePrice: 0,
        similarNumbers: items.length,
        source: 'irancell-general',
        pattern,
      };
    }

    const prices = extractPrices(match, products);
    return {
      found: true,
      number: target,
      available: true,
      ...prices,
      pool: match.pool,
      msisdnDisplay: match.msisdn,
      source: 'irancell-general',
      pattern,
    };
  }

  parseMsisdnsResponse(number, data, pattern, productId) {
    if (!data || data.result_code !== 0) {
      const msg = data?.info?.fa?.message || data?.result_message || 'خطا در استعلام ایرانسل';
      return {
        found: true,
        number,
        available: false,
        basePrice: 0,
        error: msg,
        source: 'irancell-msisdns',
        pattern,
        productId,
      };
    }

    const items = data.numbers || data.result?.numbers || [];
    const products = data.result?.products || data.products || {};
    const target = normalizeNumber(number);
    const match = this.findMatch(items, target, pattern);

    if (!match) {
      return {
        found: true,
        number: target,
        available: false,
        basePrice: 0,
        similarNumbers: items.length,
        source: 'irancell-msisdns',
        pattern,
        productId,
      };
    }

    const prices = extractPrices(match, products);
    return {
      found: true,
      number: target,
      available: true,
      ...prices,
      pool: match.pool || '',
      msisdnDisplay: match.msisdn,
      source: 'irancell-msisdns',
      pattern,
      productId,
    };
  }

  async callApi(path, body, retry = 0) {
    await this.ensureSession(retry > 0);
    const headers = { ...DEFAULT_HEADERS };
    if (this.sessionCookie) headers.Cookie = this.sessionCookie;

    let res;
    try {
      res = await this.client.post(path, body, { headers });
    } catch (err) {
      if (isNetworkError(err)) {
        const e = new Error('اتصال به apishop.irancell.ir برقرار نشد — backend باید روی سرور ایران اجرا شود');
        e.networkError = true;
        throw e;
      }
      throw err;
    }

    const rateLimited =
      res.data?.result_code === 429 || /تلاش/i.test(res.data?.info?.fa?.message || '');

    if (rateLimited && retry < 2) {
      await new Promise((r) => setTimeout(r, 2000 * (retry + 1)));
      return this.callApi(path, body, retry + 1);
    }

    return res.data;
  }

  async getSimProductIds() {
    const stale = Date.now() - this.simProductIdsAt > 30 * 60 * 1000;
    if (this.simProductIds?.length && !stale) return this.simProductIds;
    try {
      const data = await this.callApi('/shop/api/v2/get_products_by_category', { slug: 'sim-prepaid' });
      const ids = (data?.products || []).map((p) => p.id).filter(Boolean);
      this.simProductIds = ids.length ? ids : SIM_PRODUCT_IDS;
    } catch {
      this.simProductIds = SIM_PRODUCT_IDS;
    }
    this.simProductIdsAt = Date.now();
    return this.simProductIds;
  }

  /** یک درخواست — pattern دقیق ۱۰ رقمی (سریع برای bulk import) */
  async lookupGeneralExact(normalized) {
    const pattern = toIrancellPattern(normalized);
    const data = await this.callApi('/shop/api/v2/search_msisdn_general', {
      channel: config.irancellShop.channel,
      pattern,
    });
    return this.parseGeneralResponse(normalized, data, pattern);
  }

  async lookupViaMsisdns(normalized) {
    const productIds = await this.getSimProductIds();
    const pattern = toIrancellPattern(normalized);
    let last = null;

    for (const productId of productIds) {
      const data = await this.callApi('/shop/api/v2/search_msisdns', {
        productId,
        pattern,
        offset: 0,
      });
      const parsed = this.parseMsisdnsResponse(normalized, data, pattern, productId);
      if (parsed.available) return parsed;
      last = parsed;
    }
    return last;
  }

  async lookupNumber(number) {
    const normalized = normalizeNumber(toAsciiDigits(number));
    if (!/^09\d{9}$/.test(normalized)) {
      return {
        found: false,
        number: normalized,
        available: false,
        basePrice: 0,
        error: 'فرمت شماره نامعتبر است',
      };
    }

    if (config.irancellShop.devMode) {
      return this.devLookup(normalized);
    }

    try {
      const general = await this.lookupGeneralExact(normalized);
      if (general.available) return general;

      if (!normalized.startsWith('0900')) {
        const viaMsisdns = await this.lookupViaMsisdns(normalized);
        if (viaMsisdns?.available) return viaMsisdns;
        return viaMsisdns || general;
      }

      return general;
    } catch (err) {
      return {
        found: false,
        number: normalized,
        available: false,
        basePrice: 0,
        error: err.message || 'اتصال به shop.irancell.ir برقرار نشد',
        networkError: !!err.networkError,
        source: 'irancell',
        pattern: toIrancellPattern(normalized),
      };
    }
  }

  async lookupMany(numbers, { delayMs, concurrency, onProgress } = {}) {
    const delay = delayMs ?? config.irancellShop.lookupDelayMs;
    const parallel = concurrency ?? config.irancellShop.lookupConcurrency;
    const results = new Array(numbers.length);
    let done = 0;
    let next = 0;
    let networkFails = 0;

    const worker = async () => {
      while (next < numbers.length) {
        const i = next;
        next += 1;
        if (i >= numbers.length) break;

        if (i > 0 && i % 25 === 0) {
          await this.ensureSession(true);
        }

        const lookup = await this.lookupNumber(numbers[i]);
        results[i] = lookup;
        done += 1;

        if (lookup.networkError) {
          networkFails += 1;
          if (networkFails >= 3 && done <= 5) {
            const err = new Error(
              'اتصال به API ایرانسل برقرار نشد. backend را روی سرور ایران اجرا کنید یا VPN بزنید.'
            );
            err.networkError = true;
            throw err;
          }
        }

        if (onProgress) onProgress(done, numbers.length, lookup);

        if (delay > 0 && next < numbers.length) {
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    };

    const workers = Array.from({ length: Math.min(parallel, numbers.length) }, () => worker());
    await Promise.all(workers);
    return results;
  }

  isDevMode() {
    return config.irancellShop.devMode;
  }

  buildPartialPattern(rawDigits) {
    let p = toAsciiDigits(rawDigits).replace(/\D/g, '');
    if (p.startsWith('0')) p = p.slice(1);
    if (p.length > 10) p = p.slice(0, 10);
    if (!p) return '';
    return p + '_'.repeat(10 - p.length);
  }

  buildPatternPrefix(p10, prefixLen) {
    const head = String(p10).replace(/\D/g, '').slice(0, Math.min(prefixLen, 10));
    if (!head) return '';
    return head + '_'.repeat(10 - head.length);
  }

  buildAdvancedPattern(prefix, middle, end) {
    const p = toAsciiDigits(prefix || '').replace(/\D/g, '');
    const head = p.length >= 4 && p.startsWith('0') ? p.slice(1, 4) : p.slice(0, 3);
    const mid = toAsciiDigits(middle || '').replace(/\D/g, '');
    const tail = toAsciiDigits(end || '').replace(/\D/g, '');
    const midPart = Array.from({ length: 3 }, (_, i) => mid[i] || '_').join('');
    const endPart = Array.from({ length: 4 }, (_, i) => tail[i] || '_').join('');
    return `${head}${midPart}${endPart}`;
  }

  advancedToFullNumber(prefix, middle, end) {
    const pattern = this.buildAdvancedPattern(prefix, middle, end);
    if (pattern.includes('_')) return null;
    return normalizeNumber(`0${pattern}`);
  }

  buildIrancellPattern({ mode, query, prefix, restDigits, middle, end }) {
    if (mode === 'simple' || mode === 'advanced') {
      if (middle !== undefined || end !== undefined) {
        return this.buildAdvancedPattern(prefix, middle || '', end || '');
      }
      const p = toAsciiDigits(prefix || '').replace(/\D/g, '');
      const rest = (restDigits || Array(7).fill('')).map((d) => d || '_').join('');
      if (!p) return `___${rest}`;
      const head = p.length >= 4 && p.startsWith('0') ? p.slice(1) : p;
      return head + rest;
    }

    let a = toAsciiDigits(query || '').replace(/[^\d*_]/g, '').replace(/_/g, '');
    if (a.startsWith('0')) a = a.slice(1);
    if (a.length < 10 && a.length > 0 && !a.endsWith('*')) a += '*';
    return a;
  }

  simplePatternToFullNumber(prefix, restDigits) {
    const rest = restDigits || [];
    const middle = rest.slice(0, 3).join('');
    const end = rest.slice(3, 7).join('');
    return this.advancedToFullNumber(prefix, middle, end);
  }

  buildSearchPatterns(rawQuery, mode = 'advanced') {
    const q = toAsciiDigits(rawQuery).replace(/[^\d*]/g, '');
    if (!q || q.replace(/\*/g, '').length < 3) return [];

    if (q.includes('*')) {
      const p = q.replace(/^0+/, '').replace(/^90/, '9');
      return [p.startsWith('*') || p.endsWith('*') ? p : `*${p}*`];
    }

    const normalized = normalizeNumber(q);
    const p10 = normalized.length === 11 ? toIrancellPattern(normalized) : q.replace(/^0?9?/, '');

    if (mode === 'advanced' && /^09\d{9}$/.test(normalized)) {
      return [`${p10.slice(0, 7)}*`];
    }

    if (p10.length >= 3 && p10.length < 10) {
      return [`*${p10}*`];
    }

    if (p10.length >= 10) {
      return [`*${p10.slice(-4)}*`, `*${p10.slice(-3)}*`];
    }

    return [`*${p10}*`];
  }

  filterSimilarByLeadingDigits(targetNumber, candidates, limit = 20) {
    const target = normalizeNumber(toAsciiDigits(targetNumber));
    if (!/^09\d{9}$/.test(target)) return candidates.slice(0, limit);

    const scored = candidates
      .map((item) => {
        const num = normalizeNumber(item.number);
        let match = 0;
        while (match < target.length && match < num.length && target[match] === num[match]) match++;
        return { item, match };
      })
      .filter(({ item, match }) => item.number !== target && match >= 8 && match <= 10)
      .sort((a, b) => b.match - a.match || a.item.number.localeCompare(b.item.number));

    return scored.slice(0, limit).map((x) => x.item);
  }

  async searchSimilarForNumber(fullNumber, limit = 20, offset = 0) {
    const normalized = normalizeNumber(toAsciiDigits(fullNumber));
    if (!/^09\d{9}$/.test(normalized)) {
      return { pattern: null, items: [], similarNumbers: true, hasMore: false };
    }

    const p10 = toIrancellPattern(normalized);
    const fetchLimit = Math.max(limit * 5, 60);

    let pattern = null;
    let raw = { items: [], hasMore: false };
    for (const n of [10, 9, 8, 7, 6, 5]) {
      const p = this.buildPatternPrefix(p10, n);
      raw = await this.searchByPattern(p, { limit: fetchLimit, offset });
      if (raw.items.length) {
        pattern = p;
        break;
      }
    }

    if (!pattern) {
      pattern = this.buildPatternPrefix(p10, 8);
    }

    return {
      pattern,
      items: raw.items,
      similarNumbers: true,
      hasMore: raw.hasMore,
    };
  }

  mapSearchItems(items, products, limit) {
    return (items || []).slice(0, limit).map((item) => {
      const number = normalizeIrancellMsisdn(item.msisdn);
      const prices = extractPrices(item, products);
      return {
        found: true,
        number,
        available: true,
        ...prices,
        pool: item.pool,
        msisdnDisplay: item.msisdn,
        source: 'irancell-search',
      };
    }).filter((x) => /^09\d{9}$/.test(x.number));
  }

  async searchByPattern(pattern, options = {}) {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    if (config.irancellShop.devMode) {
      const mocks = ['09001022053', '09001071252', '09001234567', '09009999999'];
      const items = mocks.slice(offset, offset + limit).map((n) => this.devLookup(n)).filter((x) => x.available);
      return { items, similarNumbers: false, hasMore: false };
    }

    const data = await this.callApi('/shop/api/v2/search_msisdn_general', {
      channel: config.irancellShop.channel,
      pattern,
      offset,
    });

    if (!data || data.result_code !== 0) {
      return { items: [], similarNumbers: false, hasMore: false };
    }

    const items = this.mapSearchItems(data.result?.numbers, data.result?.products, limit);
    return {
      items,
      similarNumbers: !!data.result?.similar_numbers,
      hasMore: (data.result?.numbers || []).length >= limit,
    };
  }

  async searchSimilarLast3(fullNumber, limit = 20, offset = 0) {
    return this.searchSimilarForNumber(fullNumber, limit, offset);
  }

  async searchWithPattern(pattern, limit = 20, offset = 0) {
    const raw = await this.searchByPattern(pattern, { limit, offset });
    return { pattern, ...raw };
  }

  async searchSimilar(rawQuery, limit = 20, mode = 'advanced', offset = 0) {
    const q = toAsciiDigits(rawQuery).replace(/[^\d*]/g, '');
    const normalized = normalizeNumber(q.replace(/\*/g, ''));

    if (mode === 'advanced' && /^09\d{9}$/.test(normalized) && !q.includes('*') && !q.includes('_')) {
      const result = await this.searchSimilarForNumber(normalized, limit, offset);
      return { pattern: result.pattern, results: result.items, similarNumbers: result.similarNumbers, hasMore: result.hasMore };
    }

    const patterns = this.buildSearchPatterns(rawQuery, mode);
    for (const pattern of patterns) {
      const result = await this.searchByPattern(pattern, { limit, offset });
      if (result.items.length) {
        return { pattern, results: result.items, similarNumbers: result.similarNumbers, hasMore: result.hasMore };
      }
    }
    return { pattern: patterns[0] || null, results: [], similarNumbers: false, hasMore: false };
  }
}

module.exports = new IrancellShopService();
module.exports.normalizeIrancellMsisdn = normalizeIrancellMsisdn;
module.exports.toIrancellPattern = toIrancellPattern;
module.exports.extractBasePrice = extractBasePrice;
module.exports.extractPrices = extractPrices;
module.exports.toAsciiDigits = toAsciiDigits;
