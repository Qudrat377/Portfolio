const Joi = require('joi');
const { ATTENDANCE_STATUS } = require('../config/constants');

const recordSchema = Joi.object({
  student: Joi.string().hex().length(24).required(),
  status: Joi.string()
    .valid(...Object.values(ATTENDANCE_STATUS))
    .required(),
  note: Joi.string().trim().max(200).optional().allow('', null),
});

const markAttendanceSchema = Joi.object({
  group: Joi.string().hex().length(24).required(),
  date: Joi.date().required(),
  records: Joi.array().items(recordSchema).min(1).required(),
  topic: Joi.string().trim().max(200).optional().allow('', null),
  notes: Joi.string().trim().max(500).optional().allow('', null),
});

const updateAttendanceSchema = Joi.object({
  records: Joi.array().items(recordSchema).min(1),
  topic: Joi.string().trim().max(200).allow('', null),
  notes: Joi.string().trim().max(500).allow('', null),
}).min(1);

const attendanceQuerySchema = Joi.object({
  group: Joi.string().hex().length(24),
  student: Joi.string().hex().length(24),
  startDate: Joi.date(),
  endDate: Joi.date(),
  status: Joi.string().valid(...Object.values(ATTENDANCE_STATUS)),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
});

module.exports = {
  markAttendanceSchema,
  updateAttendanceSchema,
  attendanceQuerySchema,
};
