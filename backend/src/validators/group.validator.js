const Joi = require('joi');
const { DAYS_OF_WEEK } = require('../config/constants');

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const scheduleSchema = Joi.object({
  days: Joi.array()
    .items(Joi.string().valid(...DAYS_OF_WEEK))
    .min(1)
    .required(),
  startTime: Joi.string().pattern(timePattern).required(),
  endTime: Joi.string().pattern(timePattern).required(),
  room: Joi.string().trim().max(50).optional(),
});

const createGroupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500).optional().allow('', null),
  teacher: Joi.string().hex().length(24).required(),
  assistant: Joi.string().hex().length(24).optional().allow(null),
  schedule: scheduleSchema.required(),
  level: Joi.string()
    .valid('BEGINNER', 'ELEMENTARY', 'PRE_INTERMEDIATE', 'INTERMEDIATE', 'UPPER_INTERMEDIATE', 'ADVANCED')
    .optional(),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional(),
  maxStudents: Joi.number().integer().min(1).max(50).optional(),
});

const updateGroupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500).allow('', null),
  teacher: Joi.string().hex().length(24),
  assistant: Joi.string().hex().length(24).allow(null),
  schedule: scheduleSchema,
  level: Joi.string().valid(
    'BEGINNER', 'ELEMENTARY', 'PRE_INTERMEDIATE',
    'INTERMEDIATE', 'UPPER_INTERMEDIATE', 'ADVANCED'
  ),
  startDate: Joi.date(),
  endDate: Joi.date(),
  maxStudents: Joi.number().integer().min(1).max(50),
  isActive: Joi.boolean(),
}).min(1);

const addStudentSchema = Joi.object({
  studentId: Joi.string().hex().length(24).required(),
});

const groupQuerySchema = Joi.object({
  teacher: Joi.string().hex().length(24),
  level: Joi.string(),
  isActive: Joi.boolean(),
  search: Joi.string().trim().max(100),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string(),
});

module.exports = {
  createGroupSchema,
  updateGroupSchema,
  addStudentSchema,
  groupQuerySchema,
};
