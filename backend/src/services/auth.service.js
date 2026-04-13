const User = require('../models/User');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  AuthorizationError,
} = require('../utils/AppError');
const { audit, ACTIONS } = require('../utils/auditLog');

class AuthService {
  async register(data, creatorUser = null) {
    const { phone, email, role } = data;

    // Check phone uniqueness
    const existing = await User.findOne({ phone, isDeleted: false });
    if (existing) throw new ConflictError('Phone number already registered');

    if (email) {
      const emailExists = await User.findOne({ email, isDeleted: false });
      if (emailExists) throw new ConflictError('Email already registered');
    }

    const userData = { ...data };
    if (creatorUser) userData.createdBy = creatorUser._id;

    const user = await User.create(userData);
    return user.toSafeObject();
  }

  async login(phone, password, ip, userAgent) {
    const user = await User.findOne({ phone, isDeleted: false }).select('+password +refreshToken');
    if (!user) throw new AuthenticationError('Invalid phone or password');
    if (!user.isActive) throw new AuthenticationError('Account is deactivated');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new AuthenticationError('Invalid phone or password');

    const payload = { userId: user._id, role: user.role };
    const tokens = generateTokenPair(payload);

    user.refreshToken = tokens.refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    await audit({
      userId: user._id,
      action: ACTIONS.LOGIN,
      resource: 'User',
      resourceId: user._id,
      ip,
      userAgent,
    });

    return {
      user: user.toSafeObject(),
      ...tokens,
    };
  }

  async refreshTokens(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      throw new AuthenticationError('Invalid refresh token');
    }
    if (!user.isActive || user.isDeleted) {
      throw new AuthenticationError('Account unavailable');
    }

    const payload = { userId: user._id, role: user.role };
    const tokens = generateTokenPair(payload);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  }

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    await audit({
      userId,
      action: ACTIONS.LOGOUT,
      resource: 'User',
      resourceId: userId,
    });
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new NotFoundError('User');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new AuthenticationError('Current password is incorrect');

    user.password = newPassword;
    user.refreshToken = null; // Invalidate sessions
    await user.save();
  }
}

module.exports = new AuthService();
