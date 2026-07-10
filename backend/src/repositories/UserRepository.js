const User = require('../models/User');
const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByMobile(mobile) {
    return this.model.findOne({ mobile }).select('+password');
  }

  async findByMobilePublic(mobile) {
    return this.model.findOne({ mobile });
  }

  async findByNationalId(nationalId) {
    return this.model.findOne({ nationalId });
  }

  async adminSearch(query = {}, options = {}) {
    const filter = {};
    if (query.search) {
      const s = query.search.trim();
      const digits = s.replace(/\D/g, '');
      filter.$or = [
        { firstName: { $regex: s, $options: 'i' } },
        { lastName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
      ];
      if (digits) {
        filter.$or.push({ mobile: { $regex: digits } });
        filter.$or.push({ nationalId: { $regex: digits } });
      }
    }
    return this.find(filter, { ...options, sort: { createdAt: -1 } });
  }
}

module.exports = new UserRepository();
