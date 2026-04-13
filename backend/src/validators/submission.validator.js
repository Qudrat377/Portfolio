const Joi = require('joi');
const { SUBMISSION_STATUS } = require('../config/constants');

const wordResultSchema = Joi.object({
  vocabularyItemId: Joi.string().hex().length(24).required(),
  word: Joi.string().required(),
  isCorrect: Joi.boolean().required(),
  timeTakenSeconds: Joi.number().min(0).optional(),
});

const submitHomeworkSchema = Joi.object({
  textAnswer: Joi.string().trim().max(10000).optional().allow('', null),
  urlNote: Joi.string().trim().max(1000).optional().allow('', null),
  vocabularyAnswers: Joi.array().items(
    Joi.object({
      vocabularyItemId: Joi.string().hex().length(24).required(),
      word: Joi.string().required(),
      isCorrect: Joi.boolean().required(),
      studentAnswer: Joi.string().optional().allow('', null),
      timeTakenSeconds: Joi.number().min(0).optional(),
    })
  ).optional(),
});

const reviewSubmissionSchema = Joi.object({
  status: Joi.string()
    .valid(SUBMISSION_STATUS.APPROVED, SUBMISSION_STATUS.REJECTED, SUBMISSION_STATUS.REVIEWED)
    .required(),
  feedback: Joi.string().trim().max(1000).optional().allow('', null),
  score: Joi.number().min(0).max(100).optional(),
});

const submissionQuerySchema = Joi.object({
  homework: Joi.string().hex().length(24),
  group: Joi.string().hex().length(24),
  student: Joi.string().hex().length(24),
  status: Joi.string().valid(...Object.values(SUBMISSION_STATUS)),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string(),
});

module.exports = {
  submitHomeworkSchema,
  reviewSubmissionSchema,
  submissionQuerySchema,
};
