const express = require('express');
const multer = require('multer');
const path = require('path');
const { authAdmin } = require('../middleware/auth');
const { authUser } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { productImageUpload } = require('../middleware/upload');
const {
  loginValidator,
  numberValidator,
  productValidator,
  checkoutValidator,
  discountValidator,
  userRegisterValidator,
  userLoginValidator,
  otpSendValidator,
  userLoginOtpValidator,
  adminCreateValidator,
} = require('../validators');

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const numberController = require('../controllers/numberController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const discountController = require('../controllers/discountController');
const excelController = require('../controllers/excelController');
const shopSettingsController = require('../controllers/shopSettingsController');
const adminManageController = require('../controllers/adminManageController');
const userManageController = require('../controllers/userManageController');
const uploadController = require('../controllers/uploadController');
const rateLimit = require('../middleware/rateLimit');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'تعداد تلاش ورود بیش از حد — ۱۵ دقیقه صبر کنید' });
const otpLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: 'لطفاً یک دقیقه صبر کنید' });
const excelUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Public routes
router.get('/numbers/search', numberController.search);
router.get('/numbers/sim-search', numberController.simSearch);
router.get('/numbers/check/:number', numberController.checkNumber);
router.get('/numbers/:number', numberController.getByNumber);
router.get('/products', productController.list);
router.get('/products/:slug', productController.getBySlug);
router.get('/discounts/active', orderController.getActiveDiscount);
router.post('/discounts/validate', orderController.validateDiscount);
router.post('/orders', checkoutValidator, validate, orderController.create);
router.post('/orders/:id/pay', orderController.pay);
router.get('/orders/track', orderController.track);
router.get('/orders/mine', authUser, orderController.listMine);
router.get('/payment/verify', orderController.verify);

// User auth
router.post('/auth/otp/send', otpLimiter, otpSendValidator, validate, userController.sendOtp);
router.post('/auth/register', authLimiter, userRegisterValidator, validate, userController.register);
router.post('/auth/login', authLimiter, userLoginValidator, validate, userController.login);
router.post('/auth/login/otp', authLimiter, userLoginOtpValidator, validate, userController.loginWithOtp);
router.get('/auth/me', authUser, userController.me);

// Admin auth
router.post('/admin/login', authLimiter, loginValidator, validate, authController.login);
router.get('/admin/me', authAdmin, authController.me);

// Admin dashboard
router.get('/admin/dashboard', authAdmin, orderController.dashboard);

// Admin management
router.get('/admin/admins', authAdmin, adminManageController.list);
router.post('/admin/admins', authAdmin, adminCreateValidator, validate, adminManageController.create);
router.put('/admin/admins/:id', authAdmin, adminManageController.update);
router.delete('/admin/admins/:id', authAdmin, adminManageController.remove);

// Admin upload
router.post('/admin/upload/product-image', authAdmin, productImageUpload.single('image'), uploadController.uploadProductImage);

// Admin numbers
router.get('/admin/numbers', authAdmin, numberController.search);
router.get('/admin/numbers/stats', authAdmin, numberController.stats);
router.post('/admin/numbers', authAdmin, numberValidator, validate, numberController.create);
router.put('/admin/numbers/:id', authAdmin, numberController.update);
router.delete('/admin/numbers/:id', authAdmin, numberController.remove);
router.post('/admin/numbers/import/preview', authAdmin, excelUpload.single('file'), excelController.preview);
router.post('/admin/numbers/import', authAdmin, excelUpload.single('file'), excelController.import);
router.get('/admin/settings/pricing', authAdmin, shopSettingsController.getPricing);
router.put('/admin/settings/pricing', authAdmin, shopSettingsController.updatePricing);
router.post('/admin/numbers/irancell-lookup', authAdmin, shopSettingsController.lookupNumber);

// Admin products
router.get('/admin/products', authAdmin, productController.adminList);
router.post('/admin/products', authAdmin, productValidator, validate, productController.create);
router.put('/admin/products/:id', authAdmin, productController.update);
router.delete('/admin/products/:id', authAdmin, productController.remove);

// Admin orders
router.get('/admin/orders', authAdmin, orderController.adminList);
router.get('/admin/orders/:id', authAdmin, orderController.getById);
router.patch('/admin/orders/:id/status', authAdmin, orderController.updateStatus);

// Admin users
router.get('/admin/users', authAdmin, userManageController.list);

// Admin discounts
router.get('/admin/discounts', authAdmin, discountController.list);
router.post('/admin/discounts', authAdmin, discountValidator, validate, discountController.create);
router.put('/admin/discounts/:id', authAdmin, discountController.update);
router.delete('/admin/discounts/:id', authAdmin, discountController.remove);

module.exports = router;
