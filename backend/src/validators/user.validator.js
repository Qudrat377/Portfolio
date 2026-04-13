const Joi = require('joi');
const { ROLES } = require('../config/constants');

const createUserSchema = Joi.object({
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

const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  email: Joi.string().trim().email().allow('', null),
  avatar: Joi.string().uri().allow('', null),
  isActive: Joi.boolean(),
}).min(1);

const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  email: Joi.string().trim().email().allow('', null),
  avatar: Joi.string().uri().allow('', null),
}).min(1);

const userQuerySchema = Joi.object({
  role: Joi.string().valid(...Object.values(ROLES)),
  search: Joi.string().trim().max(100),
  isActive: Joi.boolean(),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  userQuerySchema,
};
