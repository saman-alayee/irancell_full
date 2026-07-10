const userRepository = require('../repositories/UserRepository');
const Order = require('../models/Order');

class UserManageService {
  async listWithOrders(query = {}) {
    const options = {
      page: Number(query.page) || 1,
      limit: Math.min(Number(query.limit) || 20, 50),
    };

    const userResult = await userRepository.adminSearch({ search: query.search }, options);
    const mobiles = userResult.items.map((u) => u.mobile);

    let ordersByMobile = {};
    if (mobiles.length) {
      const orders = await Order.find({ 'user.mobile': { $in: mobiles } })
        .sort({ createdAt: -1 })
        .select('orderNumber user status paymentStatus totalAmount items createdAt')
        .lean();

      ordersByMobile = orders.reduce((acc, order) => {
        const key = order.user.mobile;
        if (!acc[key]) acc[key] = [];
        acc[key].push(order);
        return acc;
      }, {});
    }

    const items = userResult.items.map((user) => {
      const obj = user.toObject ? user.toObject() : user;
      const orders = ordersByMobile[obj.mobile] || [];
      const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
      return {
        ...obj,
        orders,
        orderCount: orders.length,
        paidOrderCount: paidOrders.length,
        totalSpent: paidOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      };
    });

    return { items, pagination: userResult.pagination };
  }
}

module.exports = new UserManageService();
