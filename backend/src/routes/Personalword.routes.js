const router = require('express').Router();
const ctrl   = require('../controllers/Personalword.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  addSelfWordSchema,
  submitReviewSchema,
  addFromVocabSchema,
  addFromVocabCheckSchema,
  getAllWordsQuerySchema,
  updateSelfWordSchema,
} = require('../validators/Personalword.validator');
const { ROLES } = require('../config/constants');

const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

router.use(authenticate);

// ═══════════════════════════════════════════════════════════════════════════════
// O'QUVCHI ENDPOINTLARI
// ═══════════════════════════════════════════════════════════════════════════════

// Bugun takrorlanishi kerak so'zlar
router.get('/due',
  authorize(STUDENT),
  ctrl.getDueWords
);

// Statistika
router.get('/stats',
  authorize(STUDENT),
  ctrl.getStats
);

// To'liq lug'at xazinasi — barcha manbadan, bittada
// ?source=self|teacher|vocabcheck  ?status=...  ?page=1&limit=20
router.get('/my-vocabulary',
  authorize(STUDENT),
  validate(getAllWordsQuerySchema, 'query'),
  ctrl.getMyVocabulary
);

// Barcha so'zlar (filter/pagination)
router.get('/',
  authorize(STUDENT),
  validate(getAllWordsQuerySchema, 'query'),
  ctrl.getAllWords
);

// O'quvchi yangi so'z qo'shadi (cheksiz)
// Body: { word, translation, language }
router.post('/',
  authorize(STUDENT),
  validate(addSelfWordSchema),
  ctrl.addSelfWord
);

// O'quvchi faqat o'zi qo'shgan so'zni o'chiradi
router.delete('/:wordId',
  authorize(STUDENT),
  ctrl.deleteSelfWord
);

// O'quvchi faqat o'zi qo'shgan so'zni tahrirlaydi (ustoz kabi)
// Body: { word?, translation?, language? }
router.patch('/:wordId',
  authorize(STUDENT),
  validate(updateSelfWordSchema),
  ctrl.updateSelfWord
);

// SM-2 review
// Body: { reviews: [{ wordId, isCorrect }] }
router.post('/review',
  authorize(STUDENT),
  validate(submitReviewSchema),
  ctrl.submitReview
);

// ═══════════════════════════════════════════════════════════════════════════════
// O'QITUVCHI / ASSISTANT ENDPOINTLARI
// ═══════════════════════════════════════════════════════════════════════════════

// Ustoz lug'atini o'quvchilarga qo'shish
// Body: { studentIds: [...] }
router.post('/from-vocab/:vocabularyId',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  validate(addFromVocabSchema),
  ctrl.addFromVocabulary
);

// VocabCheck natijalaridan qo'shish
// Body: { studentId, wordResults: [...] }
router.post('/from-vocabcheck',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  validate(addFromVocabCheckSchema),
  ctrl.addFromVocabCheck
);

// Guruh statistikasi
// ?studentIds=id1,id2,id3
router.get('/group-stats',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  ctrl.getGroupStats
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ENDPOINTLARI
// ═══════════════════════════════════════════════════════════════════════════════

router.delete('/student/:studentId/reset',
  authorize(ADMIN),
  ctrl.resetStudentWords
);

module.exports = router;

// Cache qayta qurish (agar noto'g'ri bo'lib qolsa)
router.post('/student/:studentId/rebuild-cache',
  authorize(ADMIN),
  ctrl.rebuildCache
);

// const router = require('express').Router();
// const ctrl   = require('../controllers/Personalword.controller');
// const { authenticate, authorize } = require('../middlewares/auth.middleware');
// const { validate } = require('../middlewares/validate.middleware');
// const {
//   addSelfWordSchema,
//   submitReviewSchema,
//   addFromVocabSchema,
//   addFromVocabCheckSchema,
//   getAllWordsQuerySchema,
//   updateSelfWordSchema,
// } = require('../validators/Personalword.validator');
// const { ROLES } = require('../config/constants');

// const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

// router.use(authenticate);

// // ═══════════════════════════════════════════════════════════════════════════════
// // O'QUVCHI ENDPOINTLARI
// // ═══════════════════════════════════════════════════════════════════════════════

// // Bugun takrorlanishi kerak so'zlar
// router.get('/due',
//   authorize(STUDENT),
//   ctrl.getDueWords
// );

// // Statistika
// router.get('/stats',
//   authorize(STUDENT),
//   ctrl.getStats
// );

// // To'liq lug'at xazinasi — barcha manbadan, bittada
// // ?source=self|teacher|vocabcheck  ?status=...  ?page=1&limit=20
// router.get('/my-vocabulary',
//   authorize(STUDENT),
//   validate(getAllWordsQuerySchema, 'query'),
//   ctrl.getMyVocabulary
// );

// // Barcha so'zlar (filter/pagination)
// router.get('/',
//   authorize(STUDENT),
//   validate(getAllWordsQuerySchema, 'query'),
//   ctrl.getAllWords
// );

// // O'quvchi yangi so'z qo'shadi (cheksiz)
// // Body: { word, translation, language }
// router.post('/',
//   authorize(STUDENT),
//   validate(addSelfWordSchema),
//   ctrl.addSelfWord
// );

// // O'quvchi faqat o'zi qo'shgan so'zni o'chiradi
// router.delete('/:wordId',
//   authorize(STUDENT),
//   ctrl.deleteSelfWord
// );

// // O'quvchi faqat o'zi qo'shgan so'zni tahrirlaydi (ustoz kabi)
// // Body: { word?, translation?, language? }
// router.patch('/:wordId',
//   authorize(STUDENT),
//   validate(updateSelfWordSchema),
//   ctrl.updateSelfWord
// );

// // SM-2 review
// // Body: { reviews: [{ wordId, isCorrect }] }
// router.post('/review',
//   authorize(STUDENT),
//   validate(submitReviewSchema),
//   ctrl.submitReview
// );

// // ═══════════════════════════════════════════════════════════════════════════════
// // O'QITUVCHI / ASSISTANT ENDPOINTLARI
// // ═══════════════════════════════════════════════════════════════════════════════

// // Ustoz lug'atini o'quvchilarga qo'shish
// // Body: { studentIds: [...] }
// router.post('/from-vocab/:vocabularyId',
//   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
//   validate(addFromVocabSchema),
//   ctrl.addFromVocabulary
// );

// // VocabCheck natijalaridan qo'shish
// // Body: { studentId, wordResults: [...] }
// router.post('/from-vocabcheck',
//   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
//   validate(addFromVocabCheckSchema),
//   ctrl.addFromVocabCheck
// );

// // Guruh statistikasi
// // ?studentIds=id1,id2,id3
// router.get('/group-stats',
//   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
//   ctrl.getGroupStats
// );

// // ═══════════════════════════════════════════════════════════════════════════════
// // ADMIN ENDPOINTLARI
// // ═══════════════════════════════════════════════════════════════════════════════

// router.delete('/student/:studentId/reset',
//   authorize(ADMIN),
//   ctrl.resetStudentWords
// );

// module.exports = router;

// // Cache qayta qurish (agar noto'g'ri bo'lib qolsa)
// router.post('/student/:studentId/rebuild-cache',
//   authorize(ADMIN),
//   ctrl.rebuildCache
// );

// // const router = require('express').Router();
// // const ctrl   = require('../controllers/Personalword.controller');
// // const { authenticate, authorize } = require('../middlewares/auth.middleware');
// // const { validate } = require('../middlewares/validate.middleware');
// // const {
// //   addSelfWordSchema,
// //   submitReviewSchema,
// //   addFromVocabSchema,
// //   addFromVocabCheckSchema,
// //   getAllWordsQuerySchema,
// //   updateSelfWordSchema,
// // } = require('../validators/Personalword.validator');
// // const { ROLES } = require('../config/constants');

// // const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

// // router.use(authenticate);

// // // ═══════════════════════════════════════════════════════════════════════════════
// // // O'QUVCHI ENDPOINTLARI
// // // ═══════════════════════════════════════════════════════════════════════════════

// // // Bugun takrorlanishi kerak so'zlar
// // router.get('/due',
// //   authorize(STUDENT),
// //   ctrl.getDueWords
// // );

// // // Statistika
// // router.get('/stats',
// //   authorize(STUDENT),
// //   ctrl.getStats
// // );

// // // To'liq lug'at xazinasi — barcha manbadan, bittada
// // // ?source=self|teacher|vocabcheck  ?status=...  ?page=1&limit=20
// // router.get('/my-vocabulary',
// //   authorize(STUDENT),
// //   validate(getAllWordsQuerySchema, 'query'),
// //   ctrl.getMyVocabulary
// // );

// // // Barcha so'zlar (filter/pagination)
// // router.get('/',
// //   authorize(STUDENT),
// //   validate(getAllWordsQuerySchema, 'query'),
// //   ctrl.getAllWords
// // );

// // // O'quvchi yangi so'z qo'shadi (cheksiz)
// // // Body: { word, translation, language }
// // router.post('/',
// //   authorize(STUDENT),
// //   validate(addSelfWordSchema),
// //   ctrl.addSelfWord
// // );

// // // O'quvchi faqat o'zi qo'shgan so'zni o'chiradi
// // router.delete('/:wordId',
// //   authorize(STUDENT),
// //   ctrl.deleteSelfWord
// // );

// // // O'quvchi faqat o'zi qo'shgan so'zni tahrirlaydi (ustoz kabi)
// // // Body: { word?, translation?, language? }
// // router.patch('/:wordId',
// //   authorize(STUDENT),
// //   validate(updateSelfWordSchema),
// //   ctrl.updateSelfWord
// // );

// // // SM-2 review
// // // Body: { reviews: [{ wordId, isCorrect }] }
// // router.post('/review',
// //   authorize(STUDENT),
// //   validate(submitReviewSchema),
// //   ctrl.submitReview
// // );

// // // ═══════════════════════════════════════════════════════════════════════════════
// // // O'QITUVCHI / ASSISTANT ENDPOINTLARI
// // // ═══════════════════════════════════════════════════════════════════════════════

// // // Ustoz lug'atini o'quvchilarga qo'shish
// // // Body: { studentIds: [...] }
// // router.post('/from-vocab/:vocabularyId',
// //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// //   validate(addFromVocabSchema),
// //   ctrl.addFromVocabulary
// // );

// // // VocabCheck natijalaridan qo'shish
// // // Body: { studentId, wordResults: [...] }
// // router.post('/from-vocabcheck',
// //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// //   validate(addFromVocabCheckSchema),
// //   ctrl.addFromVocabCheck
// // );

// // // Guruh statistikasi
// // // ?studentIds=id1,id2,id3
// // router.get('/group-stats',
// //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// //   ctrl.getGroupStats
// // );

// // // ═══════════════════════════════════════════════════════════════════════════════
// // // ADMIN ENDPOINTLARI
// // // ═══════════════════════════════════════════════════════════════════════════════

// // router.delete('/student/:studentId/reset',
// //   authorize(ADMIN),
// //   ctrl.resetStudentWords
// // );

// // module.exports = router;

// // // const router = require('express').Router();
// // // const ctrl   = require('../controllers/Personalword.controller');
// // // const { authenticate, authorize } = require('../middlewares/auth.middleware');
// // // const { validate } = require('../middlewares/validate.middleware');
// // // const {
// // //   addSelfWordSchema,
// // //   submitReviewSchema,
// // //   addFromVocabSchema,
// // //   addFromVocabCheckSchema,
// // //   getAllWordsQuerySchema,
// // // } = require('../validators/Personalword.validator');
// // // const { ROLES } = require('../config/constants');

// // // const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

// // // router.use(authenticate);

// // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // O'QUVCHI ENDPOINTLARI
// // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // Bugun takrorlanishi kerak so'zlar
// // // router.get('/due',
// // //   authorize(STUDENT),
// // //   ctrl.getDueWords
// // // );

// // // // Statistika
// // // router.get('/stats',
// // //   authorize(STUDENT),
// // //   ctrl.getStats
// // // );

// // // // To'liq lug'at xazinasi — barcha manbadan, bittada
// // // // ?source=self|teacher|vocabcheck  ?status=...  ?page=1&limit=20
// // // router.get('/my-vocabulary',
// // //   authorize(STUDENT),
// // //   validate(getAllWordsQuerySchema, 'query'),
// // //   ctrl.getMyVocabulary
// // // );

// // // // Barcha so'zlar (filter/pagination)
// // // router.get('/',
// // //   authorize(STUDENT),
// // //   validate(getAllWordsQuerySchema, 'query'),
// // //   ctrl.getAllWords
// // // );

// // // // O'quvchi yangi so'z qo'shadi (cheksiz)
// // // // Body: { word, translation, language }
// // // router.post('/',
// // //   authorize(STUDENT),
// // //   validate(addSelfWordSchema),
// // //   ctrl.addSelfWord
// // // );

// // // // O'quvchi faqat o'zi qo'shgan so'zni o'chiradi
// // // router.delete('/:wordId',
// // //   authorize(STUDENT),
// // //   ctrl.deleteSelfWord
// // // );

// // // // SM-2 review
// // // // Body: { reviews: [{ wordId, isCorrect }] }
// // // router.post('/review',
// // //   authorize(STUDENT),
// // //   validate(submitReviewSchema),
// // //   ctrl.submitReview
// // // );

// // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // O'QITUVCHI / ASSISTANT ENDPOINTLARI
// // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // Ustoz lug'atini o'quvchilarga qo'shish
// // // // Body: { studentIds: [...] }
// // // router.post('/from-vocab/:vocabularyId',
// // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // //   validate(addFromVocabSchema),
// // //   ctrl.addFromVocabulary
// // // );

// // // // VocabCheck natijalaridan qo'shish
// // // // Body: { studentId, wordResults: [...] }
// // // router.post('/from-vocabcheck',
// // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // //   validate(addFromVocabCheckSchema),
// // //   ctrl.addFromVocabCheck
// // // );

// // // // Guruh statistikasi
// // // // ?studentIds=id1,id2,id3
// // // router.get('/group-stats',
// // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // //   ctrl.getGroupStats
// // // );

// // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // ADMIN ENDPOINTLARI
// // // // ═══════════════════════════════════════════════════════════════════════════════

// // // router.delete('/student/:studentId/reset',
// // //   authorize(ADMIN),
// // //   ctrl.resetStudentWords
// // // );

// // // module.exports = router;