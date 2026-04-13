const userService = require('../services/user.service');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

exports.getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getUsers(req.query, req.user);
  sendSuccess(res, { data: result.users, meta: result.meta });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  sendSuccess(res, { data: { user } });
});

exports.createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body, req.user);
  sendSuccess(res, { data: { user }, message: 'User created successfully', statusCode: 201 });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user);
  sendSuccess(res, { data: { user }, message: 'User updated successfully' });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  sendSuccess(res, { data: { user }, message: 'Profile updated successfully' });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  await userService.softDeleteUser(req.params.id, req.user);
  sendSuccess(res, { message: 'User deleted successfully' });
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const result = await userService.toggleUserStatus(req.params.id, req.user);
  sendSuccess(res, { data: result, message: `User ${result.isActive ? 'activated' : 'deactivated'}` });
});
