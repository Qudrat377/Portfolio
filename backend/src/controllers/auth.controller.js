const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

exports.register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body, req.user || null);
  sendSuccess(res, { data: { user }, message: 'User registered successfully', statusCode: 201 });
});

exports.login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  const result = await authService.login(
    phone,
    password,
    req.ip,
    req.headers['user-agent']
  );
  sendSuccess(res, { data: result, message: 'Login successful' });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const tokens = await authService.refreshTokens(req.body.refreshToken);
  sendSuccess(res, { data: tokens, message: 'Tokens refreshed' });
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  sendSuccess(res, { message: 'Logged out successfully' });
});

exports.me = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { user: req.user } });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, currentPassword, newPassword);
  sendSuccess(res, { message: 'Password changed successfully' });
});
