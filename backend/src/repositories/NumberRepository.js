const Number = require('../models/Number');
const BaseRepository = require('./BaseRepository');

class NumberRepository extends BaseRepository {
  constructor() {
    super(Number);
  }

  async findByNumber(number) {
    return this.model.findOne({ number });
  }

  async search(query, options = {}) {
    const filter = {};

    if (query.search) {
      filter.number = { $regex: query.search.replace(/\D/g, ''), $options: 'i' };
    }
    if (query.status) filter.status = query.status;
    if (query.minPrice) filter.price = { ...filter.price, $gte: Number(query.minPrice) };
    if (query.maxPrice) filter.price = { ...filter.price, $lte: Number(query.maxPrice) };

    return this.find(filter, options);
  }

  async getStats() {
    const [available, reserved, sold, total] = await Promise.all([
      this.count({ status: 'available' }),
      this.count({ status: 'reserved' }),
      this.count({ status: 'sold' }),
      this.count(),
    ]);
    return { available, reserved, sold, total };
  }

  async bulkInsert(numbers) {
    return this.model.insertMany(numbers, { ordered: false });
  }

  async findExistingNumbers(numberList) {
    return this.model.find({ number: { $in: numberList } }).select('number');
  }

  patternToNumberRegex(p10) {
    const pat = String(p10 || '').replace(/\D/g, '');
    if (pat.length !== 10 || !/^[\d_]+$/.test(pat)) return null;
    const body = pat.split('').map((c) => (c === '_' ? '\\d' : c)).join('');
    return new RegExp(`^0${body}$`);
  }

  async findAvailableByPattern(p10, limit = 50) {
    const re = this.patternToNumberRegex(p10);
    if (!re) return [];
    return this.model.find({ status: 'available', number: re }).limit(limit).lean();
  }
}

module.exports = new NumberRepository();
