const orderRepository = require('../repositories/OrderRepository');
const paymentRepository = require('../repositories/PaymentRepository');
const numberRepository = require('../repositories/NumberRepository');
const productRepository = require('../repositories/ProductRepository');
const numberService = require('./NumberService');
const discountService = require('./DiscountService');
const zarinPalService = require('./ZarinPalService');
const zibalService = require('./ZibalService');
const config = require('../config');
const smsService = require('./SmsService');
const AppError = require('../utils/AppError');
const { generateOrderNumber, normalizeMobile } = require('../utils/helpers');

class OrderService {
  async buildItems(cartItems) {
    const items = [];

    for (const cartItem of cartItems) {
      if (cartItem.type === 'number') {
        const priced = await numberService.lookupForShop(cartItem.number);
        if (!priced.available) {
          throw new AppError(`شماره ${cartItem.number} موجود نیست`, 400);
        }
        const num = await numberRepository.findByNumber(cartItem.number);
        items.push({
          type: 'number',
          number: priced.number,
          numberId: num?._id,
          title: priced.number,
          quantity: 1,
          unitPrice: priced.price,
          totalPrice: priced.price,
        });
      } else if (cartItem.type === 'product') {
        const product = await productRepository.findById(cartItem.productId);
        if (!product || !product.isActive) {
          throw new AppError('Product not found', 404);
        }
        const qty = cartItem.quantity || 1;
        if (product.stock < qty) throw new AppError(`Insufficient stock for ${product.title}`, 400);
        items.push({
          type: 'product',
          productId: product._id,
          title: product.title,
          quantity: qty,
          unitPrice: product.price,
          totalPrice: product.price * qty,
        });
      }
    }

    return items;
  }

  async createOrder({ user, cartItems, discountCode }) {
    const items = await this.buildItems(cartItems);
    if (!items.length) throw new AppError('سبد خرید نامعتبر است', 400);

    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    if (subtotal <= 0) throw new AppError('مبلغ سفارش نامعتبر است', 400);

    let discountAmount = 0;
    let discount = null;
    if (discountCode) {
      const result = await discountService.validateCode(discountCode, subtotal);
      discountAmount = result.amount;
      discount = result.discount;
    }

    const totalAmount = subtotal - discountAmount;
    const orderNumber = generateOrderNumber();

    const order = await orderRepository.create({
      orderNumber,
      user: {
        ...user,
        mobile: normalizeMobile(user.mobile),
      },
      items,
      subtotal,
      discountAmount,
      totalAmount,
      discountCode: discount?.code,
      status: 'pending',
      paymentStatus: 'pending',
    });

    for (const item of items) {
      if (item.type === 'number' && item.numberId) {
        await numberService.reserve(item.numberId);
      }
    }

    if (discount) {
      await discountService.incrementUsage(discount._id);
    }

    return order;
  }

  getAvailableGateways() {
    const gateways = [];
    if (config.zarinpal.merchantId) {
      gateways.push({ id: 'zarinpal', name: 'زرین‌پال' });
    }
    if (config.zibal.merchantId) {
      gateways.push({ id: 'zibal', name: 'زیبال' });
    }
    return gateways;
  }

  async initiatePayment(orderId, gateway = 'zarinpal', user = null) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (order.paymentStatus === 'paid') throw new AppError('Order already paid', 400);

    if (user && normalizeMobile(order.user.mobile) !== normalizeMobile(user.mobile)) {
      throw new AppError('دسترسی به این سفارش مجاز نیست', 403);
    }

    const available = this.getAvailableGateways().map((g) => g.id);
    if (!available.includes(gateway)) {
      throw new AppError('درگاه پرداخت انتخاب‌شده در دسترس نیست', 400);
    }

    const paymentInput = {
      amount: order.totalAmount * 10,
      description: `Order ${order.orderNumber}`,
      mobile: order.user.mobile,
      email: order.user.email,
      orderId: order._id,
    };

    let paymentResult;
    if (gateway === 'zibal') {
      paymentResult = await zibalService.requestPayment(paymentInput);
    } else {
      paymentResult = await zarinPalService.requestPayment(paymentInput);
    }

    await paymentRepository.create({
      order: order._id,
      amount: order.totalAmount,
      authority: paymentResult.authority,
      status: 'pending',
      gateway,
    });

    return {
      paymentUrl: paymentResult.paymentUrl,
      authority: paymentResult.authority,
      gateway,
    };
  }

  async verifyPayment(authority) {
    const payment = await paymentRepository.findByAuthority(authority);
    if (!payment) throw new AppError('Payment not found', 404);

    const order = payment.order;
    if (payment.status === 'success') {
      return { order, refId: payment.refId };
    }

    const gateway = payment.gateway || 'zarinpal';
    const verifyResult = gateway === 'zibal'
      ? await zibalService.verifyPayment(authority)
      : await zarinPalService.verifyPayment(authority, order.totalAmount * 10);

    await paymentRepository.updateById(payment._id, {
      status: 'success',
      refId: verifyResult.refId,
      rawResponse: verifyResult.raw,
    });

    await orderRepository.updateById(order._id, {
      status: 'paid',
      paymentStatus: 'paid',
    });

    for (const item of order.items) {
      if (item.type === 'number' && item.numberId) {
        await numberService.markSold(item.numberId);
      }
      if (item.type === 'product' && item.productId) {
        await productRepository.updateById(item.productId, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    const updatedOrder = await orderRepository.findById(order._id);

    smsService.sendPaymentSuccess(
      updatedOrder.user.mobile,
      updatedOrder.orderNumber,
      verifyResult.refId
    ).catch((err) => console.error('[SMS] payment success notify:', err.message));

    return { order: updatedOrder, refId: verifyResult.refId };
  }

  async track({ orderNumber, mobile }) {
    if (orderNumber) {
      const order = await orderRepository.findByOrderNumber(orderNumber);
      if (!order) throw new AppError('Order not found', 404);
      return [order];
    }
    if (mobile) {
      const result = await orderRepository.findByMobile(normalizeMobile(mobile));
      return result.items;
    }
    throw new AppError('Order number or mobile required', 400);
  }

  async listMine(user, query = {}) {
    const options = {
      page: Number(query.page) || 1,
      limit: Math.min(Number(query.limit) || 20, 50),
    };
    return orderRepository.findByMobile(normalizeMobile(user.mobile), options);
  }

  async adminList(query) {
    const options = {
      page: Number(query.page) || 1,
      limit: Math.min(Number(query.limit) || 20, 100),
    };
    return orderRepository.adminSearch(
      {
        fromDate: query.fromDate,
        toDate: query.toDate,
        itemType: query.itemType,
        status: query.status,
        search: query.search,
      },
      options
    );
  }

  async getById(id) {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

  async updateStatus(id, status) {
    const updated = await orderRepository.updateById(id, { status });
    if (!updated) throw new AppError('Order not found', 404);
    return updated;
  }

  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    const thirtyDaysAgo = new Date(todayStart);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const fillDays = (rows, days, field) => {
      const map = new Map(rows.map((r) => [r._id || r.date, r]));
      const out = [];
      for (let i = days - 1; i >= 0; i -= 1) {
        const d = new Date(todayStart);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const row = map.get(key);
        out.push({ date: key, [field]: row ? (row.count ?? row.total ?? 0) : 0 });
      }
      return out;
    };

    const [
      orderCount,
      numberStats,
      productCount,
      paidOrders,
      revenueAgg,
      todayOrders,
      todayRevenueAgg,
      weekOrders,
      weekRevenueAgg,
      pendingPayments,
      failedPayments,
      avgOrderAgg,
      ordersByDay,
      revenueByDay,
      ordersByStatus,
      paymentByStatus,
      salesByItemType,
      recentOrders,
    ] = await Promise.all([
      orderRepository.count(),
      numberRepository.getStats(),
      productRepository.count(),
      orderRepository.count({ paymentStatus: 'paid' }),
      orderRepository.model.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      orderRepository.count({ createdAt: { $gte: todayStart } }),
      orderRepository.model.aggregate([
        { $match: { createdAt: { $gte: todayStart }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      orderRepository.count({ createdAt: { $gte: weekStart } }),
      orderRepository.model.aggregate([
        { $match: { createdAt: { $gte: weekStart }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      orderRepository.count({ paymentStatus: 'pending' }),
      orderRepository.count({ paymentStatus: 'failed' }),
      orderRepository.model.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, avg: { $avg: '$totalAmount' } } },
      ]),
      orderRepository.model.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      orderRepository.model.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, paymentStatus: 'paid' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      orderRepository.model.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      orderRepository.model.aggregate([
        { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
      ]),
      orderRepository.model.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.type',
            count: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.totalPrice' },
          },
        },
      ]),
      orderRepository.model
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber user status paymentStatus totalAmount createdAt items')
        .lean(),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const todayRevenue = todayRevenueAgg[0]?.total || 0;
    const weekRevenue = weekRevenueAgg[0]?.total || 0;
    const avgOrderValue = Math.round(avgOrderAgg[0]?.avg || 0);

    const ordersDaySeries = fillDays(ordersByDay, 30, 'count');
    const revenueDaySeries = fillDays(revenueByDay, 30, 'total');

    return {
      orderCount,
      paidOrderCount: paidOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
      weekOrders,
      weekRevenue,
      avgOrderValue,
      pendingPayments,
      failedPayments,
      numberStats,
      productCount,
      charts: {
        ordersByDay: ordersDaySeries,
        revenueByDay: revenueDaySeries,
        ordersByStatus: ordersByStatus.map((d) => ({ status: d._id, count: d.count })),
        paymentByStatus: paymentByStatus.map((d) => ({ status: d._id, count: d.count })),
        salesByItemType: salesByItemType.map((d) => ({
          type: d._id,
          count: d.count,
          revenue: d.revenue,
        })),
      },
      recentOrders: recentOrders.map((o) => ({
        id: o._id,
        orderNumber: o.orderNumber,
        customer: `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.trim(),
        mobile: o.user?.mobile,
        status: o.status,
        paymentStatus: o.paymentStatus,
        totalAmount: o.totalAmount,
        itemCount: o.items?.length || 0,
        itemTypes: [...new Set((o.items || []).map((i) => i.type))],
        createdAt: o.createdAt,
      })),
    };
  }
}

module.exports = new OrderService();
