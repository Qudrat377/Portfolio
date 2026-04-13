const Joi = require('joi');

const vocabularyItemSchema = Joi.object({
  word: Joi.string().trim().min(1).max(100).required(),
  language: Joi.string().valid('EN', 'UZ').required(),
  translation: Joi.string().trim().max(200).optional().allow('', null),
  autoTranslation: Joi.string().trim().max(200).optional().allow('', null),
  editedTranslation: Joi.string().trim().max(200).optional().allow('', null),
  pronunciation: Joi.string().trim().optional().allow('', null),
  example: Joi.string().trim().max(300).optional().allow('', null),
  imageUrl: Joi.string().uri().optional().allow('', null),
});

const createVocabularySchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().max(500).optional().allow('', null),
  topic: Joi.string().trim().max(100).optional().allow('', null),
  // group endi yo'q — lug'at global yaratiladi
  items: Joi.array().items(vocabularyItemSchema).min(1).required(),
});

const updateVocabularySchema = Joi.object({
  title: Joi.string().trim().min(2).max(200),
  description: Joi.string().trim().max(500).allow('', null),
  topic: Joi.string().trim().max(100).allow('', null),
  items: Joi.array().items(vocabularyItemSchema).min(1),
}).min(1);

const updateTranslationSchema = Joi.object({
  itemId: Joi.string().hex().length(24).required(),
  editedTranslation: Joi.string().trim().max(200).required(),
});

const assignToGroupSchema = Joi.object({
  dueDate: Joi.date().optional().allow(null),
  note: Joi.string().trim().max(500).optional().allow('', null),
});

module.exports = {
  createVocabularySchema,
  updateVocabularySchema,
  updateTranslationSchema,
  assignToGroupSchema,
};


// const Joi = require('joi');

// const vocabularyItemSchema = Joi.object({
//   word: Joi.string().trim().min(1).max(100).required(),
//   language: Joi.string().valid('EN', 'UZ').required(),
//   translation: Joi.string().trim().max(200).optional().allow('', null),
//   autoTranslation: Joi.string().trim().max(200).optional().allow('', null),
//   editedTranslation: Joi.string().trim().max(200).optional().allow('', null),
//   pronunciation: Joi.string().trim().optional().allow('', null),
//   example: Joi.string().trim().max(300).optional().allow('', null),
//   imageUrl: Joi.string().uri().optional().allow('', null),
// });

// const createVocabularySchema = Joi.object({
//   title: Joi.string().trim().min(2).max(200).required(),
//   group: Joi.string().hex().length(24).required(),
//   items: Joi.array().items(vocabularyItemSchema).min(1).required(),
// });

// const updateVocabularySchema = Joi.object({
//   title: Joi.string().trim().min(2).max(200),
//   items: Joi.array().items(vocabularyItemSchema).min(1),
// }).min(1);

// const updateTranslationSchema = Joi.object({
//   itemId: Joi.string().hex().length(24).required(),
//   editedTranslation: Joi.string().trim().max(200).required(),
// });

// module.exports = {
//   createVocabularySchema,
//   updateVocabularySchema,
//   updateTranslationSchema,
// };
