const Joi = require('joi');

// O'rganib javob berish
const submitReviewSchema = Joi.object({
  reviews: Joi.array()
    .items(
      Joi.object({
        vocabularyItemId: Joi.string().hex().length(24).required(),
        isCorrect: Joi.boolean().required(),
      })
    )
    .min(1)
    .required(),
});

// Lug'atdan o'quvchilarga qo'shish
const addFromVocabSchema = Joi.object({
  studentIds: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .required(),
});

// VocabCheck natijalaridan qo'shish
const addFromVocabCheckSchema = Joi.object({
  studentId: Joi.string().hex().length(24).required(),
  wordResults: Joi.array()
    .items(
      Joi.object({
        vocabularyItemId: Joi.string().hex().length(24).required(),
        vocabularyId: Joi.string().hex().length(24).required(),
        word: Joi.string().required(),
        translation: Joi.string().allow('', null).optional(),
        language: Joi.string().valid('EN', 'UZ').default('EN'),
        isCorrect: Joi.boolean().required(),
      })
    )
    .min(1)
    .required(),
});

// So'zlar ro'yxatini olish uchun query
const getAllWordsQuerySchema = Joi.object({
  status: Joi.string().valid('new', 'learning', 'review', 'mastered').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(30),
});

module.exports = {
  submitReviewSchema,
  addFromVocabSchema,
  addFromVocabCheckSchema,
  getAllWordsQuerySchema,
};