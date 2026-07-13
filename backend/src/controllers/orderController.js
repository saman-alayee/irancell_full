const asyncHandler = require('../utils/asyncHandler');
const { success, paginated } = require('../utils/response');
const orderService = require('../services/OrderService');
const discountService = require('../services/DiscountService');

exports.create = asyncHandler(async (req, res) => {
  const { cartItems, discountCode } = req.body;
  const order = await orderService.createOrder({
    user: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      mobile: req.user.mobile,
      email: req.user.email,
    },
    cartItems,
    discountCode,
  });
  success(res, order, 'Order created', 201);
});

exports.pay = asyncHandler(async (req, res) => {
  const gateway = req.body?.gateway || 'zarinpal';
  const result = await orderService.initiatePayment(req.params.id, gateway, req.user);
  success(res, result);
});

exports.getGateways = asyncHandler(async (req, res) => {
  success(res, orderService.getAvailableGateways());
});

exports.verify = asyncHandler(async (req, res) => {
  const { Authority, Status } = req.query;
  if (Status !== 'OK') {
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
  }
  const result = await orderService.verifyPayment(Authority);
  res.redirect(
    `${process.env.FRONTEND_URL}/payment/success?order=${result.order.orderNumber}&ref=${result.refId}`
  );
});

exports.verifyZibal = asyncHandler(async (req, res) => {
  const { success, trackId } = req.query;
  if (String(success) !== '1' || !trackId) {
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
  }
  const result = await orderService.verifyPayment(String(trackId));
  res.redirect(
    `${process.env.FRONTEND_URL}/payment/success?order=${result.order.orderNumber}&ref=${result.refId}`
  );
});

exports.track = asyncHandler(async (req, res) => {
  const orders = await orderService.track(req.query);
  success(res, orders);
});

exports.listMine = asyncHandler(async (req, res) => {
  const result = await orderService.listMine(req.user, req.query);
  paginated(res, result.items, result.pagination);
});

exports.adminList = asyncHandler(async (req, res) => {
  const result = await orderService.adminList(req.query);
  paginated(res, result.items, result.pagination);
});

exports.getById = asyncHandler(async (req, res) => {
  const order = await orderService.getById(req.params.id);
  success(res, order);
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(req.params.id, req.body.status);
  success(res, order, 'Status updated');
});

exports.dashboard = asyncHandler(async (req, res) => {
  const stats = await orderService.getDashboardStats();
  success(res, stats);
});

exports.validateDiscount = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const result = await discountService.validateCode(code, subtotal);
  success(res, { amount: result.amount, discount: result.discount });
});

exports.getActiveDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.getActiveTimer();
  success(res, discount);
});
