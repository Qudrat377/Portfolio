const Joi = require('joi');
const { ROLES } = require('../config/constants');

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[\d\s\-()\u{0660}-\u{0669}]{7,20}$/u)
    .required(),
  email: Joi.string().trim().email().optional().allow('', null),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .required(),
});

const loginSchema = Joi.object({
  phone: Joi.string().trim().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(100).required(),
  confirmPassword: Joi.any()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
};
