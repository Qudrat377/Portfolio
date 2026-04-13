const Joi = require('joi');
const { SPEAKING_TEST_STATUS } = require('../config/constants');

const wordResultSchema = Joi.object({
  vocabularyItemId: Joi.string().hex().length(24).required(),
  word: Joi.string().required(),
  isCorrect: Joi.boolean().required(),
  timeTakenSeconds: Joi.number().min(0).optional(),
  aiConfidence: Joi.number().min(0).max(1).optional().allow(null),
});

const submitSpeakingResultSchema = Joi.object({
  homework: Joi.string().hex().length(24).required(),
  vocabulary: Joi.string().hex().length(24).required(),
  wordResults: Joi.array().items(wordResultSchema).min(1).required(),
  durationSeconds: Joi.number().min(0).required(),
  startedAt: Joi.date().optional(),
  completedAt: Joi.date().optional(),
});

const approveSpeakingSchema = Joi.object({
  homework: Joi.string().hex().length(24).required(),
  student: Joi.string().hex().length(24).required(),
});

const teacherNoteSchema = Joi.object({
  teacherNote: Joi.string().trim().max(500).required(),
});

module.exports = {
  submitSpeakingResultSchema,
  approveSpeakingSchema,
  teacherNoteSchema,
};
