const userRepository = require('../repositories/UserRepository');
const otpService = require('./OtpService');
const { signToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const { normalizeMobile } = require('../utils/helpers');

class UserService {
  _userPayload(user) {
    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fatherName: user.fatherName,
      nationalId: user.nationalId,
      mobile: user.mobile,
      secondMobile: user.secondMobile,
      email: user.email,
    };
  }

  _authResult(user) {
    const token = signToken({ id: user._id, mobile: user.mobile, role: 'user' });
    return { token, user: this._userPayload(user) };
  }

  async sendOtp(mobile, purpose) {
    return otpService.send(mobile, purpose);
  }

  async register({ firstName, lastName, fatherName, nationalId, mobile, secondMobile, email, password, code }) {
    await otpService.verify(mobile, code, 'register');

    const normalizedMobile = normalizeMobile(mobile);
    const normalizedSecond = normalizeMobile(secondMobile);
    const normalizedNationalId = String(nationalId).replace(/\D/g, '');

    const existing = await userRepository.findByMobilePublic(normalizedMobile);
    if (existing) throw new AppError('این شماره موبایل قبلاً ثبت شده است', 409);

    const existingNationalId = await userRepository.findByNationalId(normalizedNationalId);
    if (existingNationalId) throw new AppError('این کد ملی قبلاً ثبت شده است', 409);

    const user = await userRepository.create({
      firstName,
      lastName,
      fatherName,
      nationalId: normalizedNationalId,
      mobile: normalizedMobile,
      secondMobile: normalizedSecond,
      email,
      password,
      isVerified: true,
    });

    return this._authResult(user);
  }

  async login(mobile, password) {
    const normalizedMobile = normalizeMobile(mobile);
    const user = await userRepository.findByMobile(normalizedMobile);
    if (!user) throw new AppError('شماره موبایل یا رمز عبور اشتباه است', 401);

    const valid = await user.comparePassword(String(password || ''));
    if (!valid) throw new AppError('شماره موبایل یا رمز عبور اشتباه است', 401);

    return this._authResult(user);
  }

  async loginWithOtp(mobile, code) {
    await otpService.verify(mobile, code, 'login');

    const normalizedMobile = normalizeMobile(mobile);
    const user = await userRepository.findByMobile(normalizedMobile);
    if (!user) throw new AppError('کاربری با این شماره یافت نشد', 404);

    return this._authResult(user);
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('کاربر یافت نشد', 404);
    return this._userPayload(user);
  }
}

module.exports = new UserService();
