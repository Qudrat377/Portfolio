const Joi = require('joi');

// O'quvchi o'zi so'z qo'shadi
const addSelfWordSchema = Joi.object({
  word:        Joi.string().trim().min(1).max(100).required(),
  translation: Joi.string().trim().max(200).optional().allow('', null),
  language:    Joi.string().valid('EN', 'UZ').default('EN'),
});

// SM-2 review
// wordId = PersonalWord._id (MongoDB ObjectId)
const submitReviewSchema = Joi.object({
  reviews: Joi.array()
    .items(
      Joi.object({
        wordId:    Joi.string().hex().length(24).required(),
        isCorrect: Joi.boolean().required(),
      })
    )
    .min(1)
    .required(),
});

// Ustoz lug'atidan o'quvchilarga qo'shish
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
        vocabularyId:     Joi.string().hex().length(24).required(),
        word:             Joi.string().required(),
        translation:      Joi.string().allow('', null).optional(),
        language:         Joi.string().valid('EN', 'UZ').default('EN'),
        isCorrect:        Joi.boolean().required(),
      })
    )
    .min(1)
    .required(),
});

// GET query params
const getAllWordsQuerySchema = Joi.object({
  source: Joi.string().valid('self', 'teacher', 'vocabcheck').optional(),
  status: Joi.string().valid('new', 'learning', 'review', 'mastered').optional(),
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
});

// O'quvchi o'zi qo'shgan so'zni tahrirlaydi
// Kamida bitta field bo'lishi shart
const updateSelfWordSchema = Joi.object({
  word:        Joi.string().trim().min(1).max(100).optional(),
  translation: Joi.string().trim().max(200).optional().allow('', null),
  language:    Joi.string().valid('EN', 'UZ').optional(),
}).min(1);   // ← kamida bitta field yuborilishi kerak

module.exports = {
  addSelfWordSchema,
  updateSelfWordSchema,
  submitReviewSchema,
  addFromVocabSchema,
  addFromVocabCheckSchema,
  getAllWordsQuerySchema,
};

// const Joi = require('joi');

// // O'quvchi o'zi so'z qo'shadi
// const addSelfWordSchema = Joi.object({
//   word:        Joi.string().trim().min(1).max(100).required(),
//   translation: Joi.string().trim().max(200).optional().allow('', null),
//   language:    Joi.string().valid('EN', 'UZ').default('EN'),
// });

// // SM-2 review
// // wordId = PersonalWord._id (MongoDB ObjectId)
// const submitReviewSchema = Joi.object({
//   reviews: Joi.array()
//     .items(
//       Joi.object({
//         wordId:    Joi.string().hex().length(24).required(),
//         isCorrect: Joi.boolean().required(),
//       })
//     )
//     .min(1)
//     .required(),
// });

// // Ustoz lug'atidan o'quvchilarga qo'shish
// const addFromVocabSchema = Joi.object({
//   studentIds: Joi.array()
//     .items(Joi.string().hex().length(24))
//     .min(1)
//     .required(),
// });

// // VocabCheck natijalaridan qo'shish
// const addFromVocabCheckSchema = Joi.object({
//   studentId: Joi.string().hex().length(24).required(),
//   wordResults: Joi.array()
//     .items(
//       Joi.object({
//         vocabularyItemId: Joi.string().hex().length(24).required(),
//         vocabularyId:     Joi.string().hex().length(24).required(),
//         word:             Joi.string().required(),
//         translation:      Joi.string().allow('', null).optional(),
//         language:         Joi.string().valid('EN', 'UZ').default('EN'),
//         isCorrect:        Joi.boolean().required(),
//       })
//     )
//     .min(1)
//     .required(),
// });

// // GET query params
// const getAllWordsQuerySchema = Joi.object({
//   source: Joi.string().valid('self', 'teacher', 'vocabcheck').optional(),
//   status: Joi.string().valid('new', 'learning', 'review', 'mastered').optional(),
//   page:   Joi.number().integer().min(1).default(1),
//   limit:  Joi.number().integer().min(1).max(100).default(20),
// });

// module.exports = {
//   addSelfWordSchema,
//   submitReviewSchema,
//   addFromVocabSchema,
//   addFromVocabCheckSchema,
//   getAllWordsQuerySchema,
// };