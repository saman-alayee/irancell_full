const numberRepository = require('../repositories/NumberRepository');
const irancellShopService = require('./IrancellShopService');
const { toAsciiDigits } = require('./IrancellShopService');
const numberPricingService = require('./NumberPricingService');
const AppError = require('../utils/AppError');
const { normalizeNumber } = require('../utils/helpers');

class NumberService {
  localToExact(record) {
    return {
      number: record.number,
      price: record.price,
      basePrice: record.basePrice || record.price,
      available: true,
      source: 'local',
    };
  }

  async lookupForShop(number) {
    const settings = await numberPricingService.getSettings();
    const normalized = normalizeNumber(number);

    if (settings.irancellFetchEnabled) {
      const lookup = await irancellShopService.lookupNumber(normalized);
      const priced = numberPricingService.buildPricing(lookup, settings);
      if (priced.available) return priced;
    }

    const local = await numberRepository.findByNumber(normalized);
    if (local && local.status === 'available') {
      return this.localToExact(local);
    }

    if (!settings.irancellFetchEnabled) {
      throw new AppError('استعلام ایرانسل غیرفعال است', 503);
    }

    return numberPricingService.buildPricing(
      { found: true, number: normalized, available: false, basePrice: 0 },
      settings
    );
  }

  async getByNumber(number) {
    const normalized = normalizeNumber(number);
    if (!/^09\d{9}$/.test(normalized)) {
      throw new AppError('Number not found', 404);
    }
    const priced = await this.lookupForShop(normalized);
    return {
      number: priced.number,
      price: priced.price,
      basePrice: priced.basePrice,
      status: priced.available ? 'available' : 'unavailable',
      available: priced.available,
      msisdnDisplay: priced.msisdnDisplay,
      pool: priced.pool || '',
      source: priced.source || 'irancell',
    };
  }

  async lookupFromIrancell(number) {
    return this.lookupForShop(number);
  }

  async checkAndSync(number) {
    return this.lookupForShop(number);
  }

  async search(query, options) {
    return numberRepository.search(query, options);
  }

  async getLocalByPattern(pattern, limit = 20) {
    const records = await numberRepository.findAvailableByPattern(pattern, limit);
    return records.map((r) => this.localToExact(r));
  }

  mergeSearchResults(apiItems, localItems, limit) {
    const map = new Map();
    for (const item of [...localItems, ...apiItems]) {
      if (item?.number && item.available !== false && !map.has(item.number)) {
        map.set(item.number, item);
      }
    }
    return [...map.values()].slice(0, limit);
  }

  async simSearch(params = {}, limit = 20) {
    const {
      q = '',
      mode = 'advanced',
      prefix = '0930',
      middle = '',
      end = '',
      offset = 0,
    } = params;

    const settings = await numberPricingService.getSettings();
    if (!settings.irancellFetchEnabled) {
      throw new AppError('جستجوی ایرانسل غیرفعال است', 503);
    }

    const searchMode = mode === 'simple' ? 'simple' : 'advanced';

    let pattern;
    let fullNumber = null;

    if (searchMode === 'simple') {
      const clean = toAsciiDigits(q).replace(/\D/g, '');
      if (/^09\d{9}$/.test(normalizeNumber(clean))) {
        fullNumber = normalizeNumber(clean);
      } else if (/^9\d{9}$/.test(clean)) {
        fullNumber = normalizeNumber(`0${clean}`);
      }
      pattern = irancellShopService.buildPartialPattern(clean);
    } else {
      pattern = irancellShopService.buildAdvancedPattern(prefix, middle, end);
      fullNumber = irancellShopService.advancedToFullNumber(prefix, middle, end);
    }

    const digitCount = searchMode === 'simple'
      ? toAsciiDigits(q).replace(/\D/g, '').length
      : toAsciiDigits(`${prefix}${middle}${end}`).replace(/\D/g, '').length;

    if (digitCount < 3) {
      throw new AppError('حداقل ۳ رقم برای جستجو وارد کنید', 400);
    }

    const response = {
      query: q,
      mode: searchMode,
      pattern,
      exact: null,
      similar: [],
      unavailable: false,
      similarNumbers: false,
      hasMore: false,
      offset,
    };

    const isFullNumber = fullNumber && /^09\d{9}$/.test(fullNumber);
    const isFullSimple = searchMode === 'simple' && isFullNumber && offset === 0;
    const isFullSegment = searchMode === 'advanced' && isFullNumber && offset === 0;

    if (isFullSimple || isFullSegment) {
      const lookup = await irancellShopService.lookupNumber(fullNumber);
      const priced = numberPricingService.buildPricing(lookup, settings);
      if (priced.available) {
        response.exact = priced;
        return response;
      }

      const localExact = await numberRepository.findByNumber(fullNumber);
      if (localExact && localExact.status === 'available') {
        response.exact = this.localToExact(localExact);
        return response;
      }

      response.unavailable = true;
    }

    try {
      let searchResult;

      if ((isFullSimple || isFullSegment) && fullNumber) {
        searchResult = await irancellShopService.searchSimilarForNumber(fullNumber, limit, offset);
        response.searchPattern = searchResult.pattern;
        response.similarNumbers = true;
      } else {
        searchResult = await irancellShopService.searchWithPattern(pattern, limit, offset);
        response.searchPattern = searchResult.pattern;
        response.similarNumbers = searchResult.similarNumbers;
      }

      let similar = searchResult.items.map((item) => numberPricingService.buildPricing(item, settings));

      if (fullNumber) {
        similar = similar.filter((item) => item.number !== fullNumber);
      }

      if ((isFullSimple || isFullSegment) && fullNumber) {
        similar = irancellShopService.filterSimilarByLeadingDigits(fullNumber, similar, limit);
        response.similarNumbers = similar.length > 0;
      }

      if (offset === 0 && pattern && pattern.length === 10) {
        const localItems = await this.getLocalByPattern(pattern, limit);
        similar = this.mergeSearchResults(similar, localItems, limit);
      }

      response.similar = similar;
      response.hasMore = searchResult.hasMore;

      if (response.similar.length) {
        response.similarNumbers = true;
      }

      if (!response.exact && !response.similar.length) {
        response.unavailable = true;
      }
    } catch (err) {
      if (offset === 0 && pattern && pattern.length === 10) {
        const localItems = await this.getLocalByPattern(pattern, limit);
        if (localItems.length) {
          response.similar = localItems;
          response.similarNumbers = true;
        }
      }
      if (!response.exact && !response.similar.length) {
        response.unavailable = true;
        response.error = err.message;
      }
    }

    return response;
  }

  async create(data) {
    data.number = normalizeNumber(data.number);
    const existing = await numberRepository.findByNumber(data.number);
    if (existing) throw new AppError('Number already exists', 409);
    return numberRepository.create(data);
  }

  async update(id, data) {
    if (data.number) {
      data.number = normalizeNumber(data.number);
    }
    return numberRepository.updateById(id, data);
  }

  async delete(id) {
    return numberRepository.deleteById(id);
  }

  async getStats() {
    return numberRepository.getStats();
  }

  async reserve(id) {
    return numberRepository.updateById(id, { status: 'reserved' });
  }

  async markSold(id) {
    return numberRepository.updateById(id, { status: 'sold' });
  }
}

module.exports = new NumberService();
