const Joi = require('joi');
const { HOMEWORK_TYPES } = require('../config/constants');

// ID yoki object ham qabul qiladi, oxirida string ID ga aylantiradi
const idOrObject = Joi.alternatives().try(
  Joi.string().hex().length(24),
  Joi.object({ _id: Joi.string().hex().length(24).required() }).unknown(true)
);

const createHomeworkSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().max(1000).optional().allow('', null),
  type: Joi.string().valid(...Object.values(HOMEWORK_TYPES)).required(),
  group: idOrObject.required(),
  dueDate: Joi.date().required(),
  isPublished: Joi.boolean().optional(),

  // URL type
  resourceUrl: Joi.when('type', {
    is: HOMEWORK_TYPES.URL,
    then: Joi.string().uri().required(),
    otherwise: Joi.string().uri().optional().allow('', null),
  }),
  urlDescription: Joi.string().trim().max(500).optional().allow('', null),

  // TEXT type
  textContent: Joi.when('type', {
    is: HOMEWORK_TYPES.TEXT,
    then: Joi.string().trim().min(1).max(5000).required(),
    otherwise: Joi.string().trim().max(5000).optional().allow('', null),
  }),

  // VOCABULARY type
  vocabulary: Joi.when('type', {
    is: HOMEWORK_TYPES.VOCABULARY,
    then: idOrObject.required(),
    otherwise: idOrObject.optional().allow(null),
  }),
  timeLimitSeconds: Joi.number().integer().min(10).max(600).optional(),
});

const updateHomeworkSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200),
  description: Joi.string().trim().max(1000).allow('', null),
  dueDate: Joi.date(),
  isPublished: Joi.boolean(),
  resourceUrl: Joi.string().uri().allow('', null),
  urlDescription: Joi.string().trim().max(500).allow('', null),
  textContent: Joi.string().trim().max(5000).allow('', null),
  timeLimitSeconds: Joi.number().integer().min(10).max(600),
}).min(1);

const homeworkQuerySchema = Joi.object({
  group: Joi.string().hex().length(24),
  type: Joi.string().valid(...Object.values(HOMEWORK_TYPES)),
  isPublished: Joi.boolean(),
  dueBefore: Joi.date(),
  dueAfter: Joi.date(),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string(),
});

module.exports = {
  createHomeworkSchema,
  updateHomeworkSchema,
  homeworkQuerySchema,
};


// const Joi = require("joi");
// const { HOMEWORK_TYPES } = require("../config/constants");

// const createHomeworkSchema = Joi.object({
//   title: Joi.string().trim().min(2).max(200).required(),
//   description: Joi.string().trim().max(1000).optional().allow("", null),
//   type: Joi.string().valid(...Object.values(HOMEWORK_TYPES)),
//   group: Joi.string().hex().length(24).required(),
//   dueDate: Joi.date().min("now").required(),
//   isPublished: Joi.boolean().optional(),

//   // URL type
//   resourceUrl: Joi.when("type", {
//     is: HOMEWORK_TYPES.URL,
//     then: Joi.string().uri().required(),
//     otherwise: Joi.string().uri().optional().allow("", null),
//   }),
//   urlDescription: Joi.string().trim().max(500).optional().allow("", null),

//   // TEXT type
//   textContent: Joi.when("type", {
//     is: HOMEWORK_TYPES.TEXT,
//     then: Joi.string().trim().min(1).max(5000).required(),
//     otherwise: Joi.string().trim().max(5000).optional().allow("", null),
//   }),

//   // VOCABULARY type
//   vocabulary: Joi.when("type", {
//     is: HOMEWORK_TYPES.VOCABULARY,
//     then: Joi.string().hex().length(24).required(),
//     otherwise: Joi.string().hex().length(24).optional().allow(null),
//   }),
//   timeLimitSeconds: Joi.number().integer().min(10).max(600).optional(),
// });

// const updateHomeworkSchema = Joi.object({
//   title: Joi.string().trim().min(2).max(200),
//   description: Joi.string().trim().max(1000).allow("", null),
//   dueDate: Joi.date(),
//   isPublished: Joi.boolean(),
//   resourceUrl: Joi.string().uri().allow("", null),
//   urlDescription: Joi.string().trim().max(500).allow("", null),
//   textContent: Joi.string().trim().max(5000).allow("", null),
//   timeLimitSeconds: Joi.number().integer().min(10).max(600),
// }).min(1);

// const homeworkQuerySchema = Joi.object({
//   group: Joi.string().hex().length(24),
//   type: Joi.string().valid(...Object.values(HOMEWORK_TYPES)),
//   isPublished: Joi.boolean(),
//   dueBefore: Joi.date(),
//   dueAfter: Joi.date(),
//   page: Joi.number().integer().min(1),
//   limit: Joi.number().integer().min(1).max(100),
//   sort: Joi.string(),
// });

// module.exports = {
//   createHomeworkSchema,
//   updateHomeworkSchema,
//   homeworkQuerySchema,
// };
