const router = require('express').Router();
const ctrl   = require('../controllers/Personalword.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  addSelfWordSchema,
  submitReviewSchema,
  addFromVocabSchema,
  addFromVocabCheckSchema,
  selfVocabCheckSchema,
  getAllWordsQuerySchema,
  updateSelfWordSchema,
} = require('../validators/Personalword.validator');
const { ROLES } = require('../config/constants');

const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

router.use(authenticate);

// ─────────────────────────────────────────────────────────────────────────────
// MUHIM: Express routes tartibiga rioya qilish shart
// Aniq (literal) routelar /:param routelaridan OLDIN kelishi kerak
// Aks holda Express "review", "due", "stats" larni wordId deb o'qiydi
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// 1. ANIQ (LITERAL) STUDENT ENDPOINTLAR — /:param dan OLDIN
// ═══════════════════════════════════════════════════════════════════════════

// GET /personal-words/due
router.get('/due',
  authorize(STUDENT),
  ctrl.getDueWords
);

// GET /personal-words/stats
router.get('/stats',
  authorize(STUDENT),
  ctrl.getStats
);

// GET /personal-words/my-vocabulary
router.get('/my-vocabulary',
  authorize(STUDENT),
  validate(getAllWordsQuerySchema, 'query'),
  ctrl.getMyVocabulary
);

// POST /personal-words/review  ← /:wordId dan OLDIN bo'lishi shart!
router.post('/review',
  authorize(STUDENT),
  validate(submitReviewSchema),
  ctrl.submitReview
);

// GET /personal-words  (barcha so'zlar, pagination)
router.get('/',
  authorize(STUDENT),
  validate(getAllWordsQuerySchema, 'query'),
  ctrl.getAllWords
);

// POST /personal-words  (yangi so'z qo'shish)
router.post('/',
  authorize(STUDENT),
  validate(addSelfWordSchema),
  ctrl.addSelfWord
);

// ═══════════════════════════════════════════════════════════════════════════
// 2. /:wordId/subresource routelar — /:wordId dan OLDIN
//    Chunki Express /:wordId/examples ni /:wordId match qilib qoladi
// ═══════════════════════════════════════════════════════════════════════════

// POST /personal-words/:wordId/examples
router.post('/:wordId/examples',
  authorize(STUDENT),
  ctrl.addExample
);

// PATCH /personal-words/:wordId/examples/:exampleId
router.patch('/:wordId/examples/:exampleId',
  authorize(STUDENT),
  ctrl.updateExample
);

// DELETE /personal-words/:wordId/examples/:exampleId
router.delete('/:wordId/examples/:exampleId',
  authorize(STUDENT),
  ctrl.deleteExample
);

// PATCH /personal-words/:wordId/notes
router.patch('/:wordId/notes',
  authorize(STUDENT),
  ctrl.updateNotes
);

// ═══════════════════════════════════════════════════════════════════════════
// 3. /:wordId routelar — eng oxirida (boshqa hamma aniq routelardan keyin)
// ═══════════════════════════════════════════════════════════════════════════

// PATCH /personal-words/:wordId  (so'zni tahrirlash, faqat source:'self')
router.patch('/:wordId',
  authorize(STUDENT),
  validate(updateSelfWordSchema),
  ctrl.updateSelfWord
);

// DELETE /personal-words/:wordId  (so'zni o'chirish, faqat source:'self')
router.delete('/:wordId',
  authorize(STUDENT),
  ctrl.deleteSelfWord
);

// ═══════════════════════════════════════════════════════════════════════════
// 4. O'QITUVCHI / ASSISTANT ENDPOINTLARI
// ═══════════════════════════════════════════════════════════════════════════

// POST /personal-words/from-vocab/:vocabularyId
router.post('/from-vocab/:vocabularyId',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  validate(addFromVocabSchema),
  ctrl.addFromVocabulary
);

// POST /personal-words/from-vocabcheck
router.post('/from-vocabcheck',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  validate(addFromVocabCheckSchema),
  ctrl.addFromVocabCheck
);

// POST /personal-words/from-vocabcheck-self
// O'quvchi o'zi uchun — studentId JWT dan olinadi
router.post('/from-vocabcheck-self',
  authorize(STUDENT),
  validate(selfVocabCheckSchema),
  ctrl.addSelfVocabCheckResult
);

// GET /personal-words/group-stats
router.get('/group-stats',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  ctrl.getGroupStats
);

// ═══════════════════════════════════════════════════════════════════════════
// 5. ADMIN ENDPOINTLARI
// ═══════════════════════════════════════════════════════════════════════════

// DELETE /personal-words/student/:studentId/reset
router.delete('/student/:studentId/reset',
  authorize(ADMIN),
  ctrl.resetStudentWords
);

// POST /personal-words/student/:studentId/rebuild-cache
router.post('/student/:studentId/rebuild-cache',
  authorize(ADMIN),
  ctrl.rebuildCache
);

module.exports = router;

// const router = require('express').Router();
// const ctrl   = require('../controllers/Personalword.controller');
// const { authenticate, authorize } = require('../middlewares/auth.middleware');
// const { validate } = require('../middlewares/validate.middleware');
// const {
//   addSelfWordSchema,
//   submitReviewSchema,
//   addFromVocabSchema,
//   addFromVocabCheckSchema,
//   selfVocabCheckSchema,
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


// // O'quvchi o'zi uchun speaking/vocabcheck natijalarini PersonalWord ga qo'shadi
// // studentId JWT dan olinadi — o'quvchi faqat o'ziga qo'sha oladi
// // Body: { wordResults: [...] }
// router.post('/from-vocabcheck-self',
//   authorize(STUDENT),
//   validate(selfVocabCheckSchema),
//   ctrl.addSelfVocabCheckResult
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


// // // O'quvchi o'zi uchun speaking/vocabcheck natijalarini PersonalWord ga qo'shadi
// // // studentId JWT dan olinadi — o'quvchi faqat o'ziga qo'sha oladi
// // // Body: { wordResults: [...] }
// // router.post('/from-vocabcheck-self',
// //   authorize(STUDENT),
// //   ctrl.addSelfVocabCheckResult
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

// // // Cache qayta qurish (agar noto'g'ri bo'lib qolsa)
// // router.post('/student/:studentId/rebuild-cache',
// //   authorize(ADMIN),
// //   ctrl.rebuildCache
// // );

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
// // //   updateSelfWordSchema,
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

// // // // O'quvchi faqat o'zi qo'shgan so'zni tahrirlaydi (ustoz kabi)
// // // // Body: { word?, translation?, language? }
// // // router.patch('/:wordId',
// // //   authorize(STUDENT),
// // //   validate(updateSelfWordSchema),
// // //   ctrl.updateSelfWord
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


// // // // O'quvchi o'zi uchun speaking/vocabcheck natijalarini PersonalWord ga qo'shadi
// // // // studentId JWT dan olinadi — o'quvchi faqat o'ziga qo'sha oladi
// // // // Body: { wordResults: [...] }
// // // router.post('/from-vocabcheck-self',
// // //   authorize(STUDENT),
// // //   ctrl.addSelfVocabCheckResult
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

// // // // Cache qayta qurish (agar noto'g'ri bo'lib qolsa)
// // // router.post('/student/:studentId/rebuild-cache',
// // //   authorize(ADMIN),
// // //   ctrl.rebuildCache
// // // );

// // // // const router = require('express').Router();
// // // // const ctrl   = require('../controllers/Personalword.controller');
// // // // const { authenticate, authorize } = require('../middlewares/auth.middleware');
// // // // const { validate } = require('../middlewares/validate.middleware');
// // // // const {
// // // //   addSelfWordSchema,
// // // //   submitReviewSchema,
// // // //   addFromVocabSchema,
// // // //   addFromVocabCheckSchema,
// // // //   getAllWordsQuerySchema,
// // // //   updateSelfWordSchema,
// // // // } = require('../validators/Personalword.validator');
// // // // const { ROLES } = require('../config/constants');

// // // // const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

// // // // router.use(authenticate);

// // // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // // O'QUVCHI ENDPOINTLARI
// // // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // // Bugun takrorlanishi kerak so'zlar
// // // // router.get('/due',
// // // //   authorize(STUDENT),
// // // //   ctrl.getDueWords
// // // // );

// // // // // Statistika
// // // // router.get('/stats',
// // // //   authorize(STUDENT),
// // // //   ctrl.getStats
// // // // );

// // // // // To'liq lug'at xazinasi — barcha manbadan, bittada
// // // // // ?source=self|teacher|vocabcheck  ?status=...  ?page=1&limit=20
// // // // router.get('/my-vocabulary',
// // // //   authorize(STUDENT),
// // // //   validate(getAllWordsQuerySchema, 'query'),
// // // //   ctrl.getMyVocabulary
// // // // );

// // // // // Barcha so'zlar (filter/pagination)
// // // // router.get('/',
// // // //   authorize(STUDENT),
// // // //   validate(getAllWordsQuerySchema, 'query'),
// // // //   ctrl.getAllWords
// // // // );

// // // // // O'quvchi yangi so'z qo'shadi (cheksiz)
// // // // // Body: { word, translation, language }
// // // // router.post('/',
// // // //   authorize(STUDENT),
// // // //   validate(addSelfWordSchema),
// // // //   ctrl.addSelfWord
// // // // );

// // // // // O'quvchi faqat o'zi qo'shgan so'zni o'chiradi
// // // // router.delete('/:wordId',
// // // //   authorize(STUDENT),
// // // //   ctrl.deleteSelfWord
// // // // );

// // // // // O'quvchi faqat o'zi qo'shgan so'zni tahrirlaydi (ustoz kabi)
// // // // // Body: { word?, translation?, language? }
// // // // router.patch('/:wordId',
// // // //   authorize(STUDENT),
// // // //   validate(updateSelfWordSchema),
// // // //   ctrl.updateSelfWord
// // // // );

// // // // // SM-2 review
// // // // // Body: { reviews: [{ wordId, isCorrect }] }
// // // // router.post('/review',
// // // //   authorize(STUDENT),
// // // //   validate(submitReviewSchema),
// // // //   ctrl.submitReview
// // // // );

// // // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // // O'QITUVCHI / ASSISTANT ENDPOINTLARI
// // // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // // Ustoz lug'atini o'quvchilarga qo'shish
// // // // // Body: { studentIds: [...] }
// // // // router.post('/from-vocab/:vocabularyId',
// // // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // // //   validate(addFromVocabSchema),
// // // //   ctrl.addFromVocabulary
// // // // );

// // // // // VocabCheck natijalaridan qo'shish
// // // // // Body: { studentId, wordResults: [...] }
// // // // router.post('/from-vocabcheck',
// // // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // // //   validate(addFromVocabCheckSchema),
// // // //   ctrl.addFromVocabCheck
// // // // );

// // // // // Guruh statistikasi
// // // // // ?studentIds=id1,id2,id3
// // // // router.get('/group-stats',
// // // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // // //   ctrl.getGroupStats
// // // // );

// // // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // // ADMIN ENDPOINTLARI
// // // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // router.delete('/student/:studentId/reset',
// // // //   authorize(ADMIN),
// // // //   ctrl.resetStudentWords
// // // // );

// // // // module.exports = router;

// // // // // Cache qayta qurish (agar noto'g'ri bo'lib qolsa)
// // // // router.post('/student/:studentId/rebuild-cache',
// // // //   authorize(ADMIN),
// // // //   ctrl.rebuildCache
// // // // );

// // // // // const router = require('express').Router();
// // // // // const ctrl   = require('../controllers/Personalword.controller');
// // // // // const { authenticate, authorize } = require('../middlewares/auth.middleware');
// // // // // const { validate } = require('../middlewares/validate.middleware');
// // // // // const {
// // // // //   addSelfWordSchema,
// // // // //   submitReviewSchema,
// // // // //   addFromVocabSchema,
// // // // //   addFromVocabCheckSchema,
// // // // //   getAllWordsQuerySchema,
// // // // //   updateSelfWordSchema,
// // // // // } = require('../validators/Personalword.validator');
// // // // // const { ROLES } = require('../config/constants');

// // // // // const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

// // // // // router.use(authenticate);

// // // // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // // // O'QUVCHI ENDPOINTLARI
// // // // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // // // Bugun takrorlanishi kerak so'zlar
// // // // // router.get('/due',
// // // // //   authorize(STUDENT),
// // // // //   ctrl.getDueWords
// // // // // );

// // // // // // Statistika
// // // // // router.get('/stats',
// // // // //   authorize(STUDENT),
// // // // //   ctrl.getStats
// // // // // );

// // // // // // To'liq lug'at xazinasi — barcha manbadan, bittada
// // // // // // ?source=self|teacher|vocabcheck  ?status=...  ?page=1&limit=20
// // // // // router.get('/my-vocabulary',
// // // // //   authorize(STUDENT),
// // // // //   validate(getAllWordsQuerySchema, 'query'),
// // // // //   ctrl.getMyVocabulary
// // // // // );

// // // // // // Barcha so'zlar (filter/pagination)
// // // // // router.get('/',
// // // // //   authorize(STUDENT),
// // // // //   validate(getAllWordsQuerySchema, 'query'),
// // // // //   ctrl.getAllWords
// // // // // );

// // // // // // O'quvchi yangi so'z qo'shadi (cheksiz)
// // // // // // Body: { word, translation, language }
// // // // // router.post('/',
// // // // //   authorize(STUDENT),
// // // // //   validate(addSelfWordSchema),
// // // // //   ctrl.addSelfWord
// // // // // );

// // // // // // O'quvchi faqat o'zi qo'shgan so'zni o'chiradi
// // // // // router.delete('/:wordId',
// // // // //   authorize(STUDENT),
// // // // //   ctrl.deleteSelfWord
// // // // // );

// // // // // // O'quvchi faqat o'zi qo'shgan so'zni tahrirlaydi (ustoz kabi)
// // // // // // Body: { word?, translation?, language? }
// // // // // router.patch('/:wordId',
// // // // //   authorize(STUDENT),
// // // // //   validate(updateSelfWordSchema),
// // // // //   ctrl.updateSelfWord
// // // // // );

// // // // // // SM-2 review
// // // // // // Body: { reviews: [{ wordId, isCorrect }] }
// // // // // router.post('/review',
// // // // //   authorize(STUDENT),
// // // // //   validate(submitReviewSchema),
// // // // //   ctrl.submitReview
// // // // // );

// // // // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // // // O'QITUVCHI / ASSISTANT ENDPOINTLARI
// // // // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // // // Ustoz lug'atini o'quvchilarga qo'shish
// // // // // // Body: { studentIds: [...] }
// // // // // router.post('/from-vocab/:vocabularyId',
// // // // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // // // //   validate(addFromVocabSchema),
// // // // //   ctrl.addFromVocabulary
// // // // // );

// // // // // // VocabCheck natijalaridan qo'shish
// // // // // // Body: { studentId, wordResults: [...] }
// // // // // router.post('/from-vocabcheck',
// // // // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // // // //   validate(addFromVocabCheckSchema),
// // // // //   ctrl.addFromVocabCheck
// // // // // );

// // // // // // Guruh statistikasi
// // // // // // ?studentIds=id1,id2,id3
// // // // // router.get('/group-stats',
// // // // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // // // //   ctrl.getGroupStats
// // // // // );

// // // // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // // // ADMIN ENDPOINTLARI
// // // // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // // router.delete('/student/:studentId/reset',
// // // // //   authorize(ADMIN),
// // // // //   ctrl.resetStudentWords
// // // // // );

// // // // // module.exports = router;

// // // // // // Cache qayta qurish (agar noto'g'ri bo'lib qolsa)
// // // // // router.post('/student/:studentId/rebuild-cache',
// // // // //   authorize(ADMIN),
// // // // //   ctrl.rebuildCache
// // // // // );

// // // // // // const router = require('express').Router();
// // // // // // const ctrl   = require('../controllers/Personalword.controller');
// // // // // // const { authenticate, authorize } = require('../middlewares/auth.middleware');
// // // // // // const { validate } = require('../middlewares/validate.middleware');
// // // // // // const {
// // // // // //   addSelfWordSchema,
// // // // // //   submitReviewSchema,
// // // // // //   addFromVocabSchema,
// // // // // //   addFromVocabCheckSchema,
// // // // // //   getAllWordsQuerySchema,
// // // // // //   updateSelfWordSchema,
// // // // // // } = require('../validators/Personalword.validator');
// // // // // // const { ROLES } = require('../config/constants');

// // // // // // const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

// // // // // // router.use(authenticate);

// // // // // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // // // // O'QUVCHI ENDPOINTLARI
// // // // // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // // // // Bugun takrorlanishi kerak so'zlar
// // // // // // router.get('/due',
// // // // // //   authorize(STUDENT),
// // // // // //   ctrl.getDueWords
// // // // // // );

// // // // // // // Statistika
// // // // // // router.get('/stats',
// // // // // //   authorize(STUDENT),
// // // // // //   ctrl.getStats
// // // // // // );

// // // // // // // To'liq lug'at xazinasi — barcha manbadan, bittada
// // // // // // // ?source=self|teacher|vocabcheck  ?status=...  ?page=1&limit=20
// // // // // // router.get('/my-vocabulary',
// // // // // //   authorize(STUDENT),
// // // // // //   validate(getAllWordsQuerySchema, 'query'),
// // // // // //   ctrl.getMyVocabulary
// // // // // // );

// // // // // // // Barcha so'zlar (filter/pagination)
// // // // // // router.get('/',
// // // // // //   authorize(STUDENT),
// // // // // //   validate(getAllWordsQuerySchema, 'query'),
// // // // // //   ctrl.getAllWords
// // // // // // );

// // // // // // // O'quvchi yangi so'z qo'shadi (cheksiz)
// // // // // // // Body: { word, translation, language }
// // // // // // router.post('/',
// // // // // //   authorize(STUDENT),
// // // // // //   validate(addSelfWordSchema),
// // // // // //   ctrl.addSelfWord
// // // // // // );

// // // // // // // O'quvchi faqat o'zi qo'shgan so'zni o'chiradi
// // // // // // router.delete('/:wordId',
// // // // // //   authorize(STUDENT),
// // // // // //   ctrl.deleteSelfWord
// // // // // // );

// // // // // // // O'quvchi faqat o'zi qo'shgan so'zni tahrirlaydi (ustoz kabi)
// // // // // // // Body: { word?, translation?, language? }
// // // // // // router.patch('/:wordId',
// // // // // //   authorize(STUDENT),
// // // // // //   validate(updateSelfWordSchema),
// // // // // //   ctrl.updateSelfWord
// // // // // // );

// // // // // // // SM-2 review
// // // // // // // Body: { reviews: [{ wordId, isCorrect }] }
// // // // // // router.post('/review',
// // // // // //   authorize(STUDENT),
// // // // // //   validate(submitReviewSchema),
// // // // // //   ctrl.submitReview
// // // // // // );

// // // // // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // // // // O'QITUVCHI / ASSISTANT ENDPOINTLARI
// // // // // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // // // // Ustoz lug'atini o'quvchilarga qo'shish
// // // // // // // Body: { studentIds: [...] }
// // // // // // router.post('/from-vocab/:vocabularyId',
// // // // // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // // // // //   validate(addFromVocabSchema),
// // // // // //   ctrl.addFromVocabulary
// // // // // // );

// // // // // // // VocabCheck natijalaridan qo'shish
// // // // // // // Body: { studentId, wordResults: [...] }
// // // // // // router.post('/from-vocabcheck',
// // // // // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // // // // //   validate(addFromVocabCheckSchema),
// // // // // //   ctrl.addFromVocabCheck
// // // // // // );

// // // // // // // Guruh statistikasi
// // // // // // // ?studentIds=id1,id2,id3
// // // // // // router.get('/group-stats',
// // // // // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // // // // //   ctrl.getGroupStats
// // // // // // );

// // // // // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // // // // ADMIN ENDPOINTLARI
// // // // // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // // // router.delete('/student/:studentId/reset',
// // // // // //   authorize(ADMIN),
// // // // // //   ctrl.resetStudentWords
// // // // // // );

// // // // // // module.exports = router;

// // // // // // // const router = require('express').Router();
// // // // // // // const ctrl   = require('../controllers/Personalword.controller');
// // // // // // // const { authenticate, authorize } = require('../middlewares/auth.middleware');
// // // // // // // const { validate } = require('../middlewares/validate.middleware');
// // // // // // // const {
// // // // // // //   addSelfWordSchema,
// // // // // // //   submitReviewSchema,
// // // // // // //   addFromVocabSchema,
// // // // // // //   addFromVocabCheckSchema,
// // // // // // //   getAllWordsQuerySchema,
// // // // // // // } = require('../validators/Personalword.validator');
// // // // // // // const { ROLES } = require('../config/constants');

// // // // // // // const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

// // // // // // // router.use(authenticate);

// // // // // // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // // // // // O'QUVCHI ENDPOINTLARI
// // // // // // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // // // // // Bugun takrorlanishi kerak so'zlar
// // // // // // // router.get('/due',
// // // // // // //   authorize(STUDENT),
// // // // // // //   ctrl.getDueWords
// // // // // // // );

// // // // // // // // Statistika
// // // // // // // router.get('/stats',
// // // // // // //   authorize(STUDENT),
// // // // // // //   ctrl.getStats
// // // // // // // );

// // // // // // // // To'liq lug'at xazinasi — barcha manbadan, bittada
// // // // // // // // ?source=self|teacher|vocabcheck  ?status=...  ?page=1&limit=20
// // // // // // // router.get('/my-vocabulary',
// // // // // // //   authorize(STUDENT),
// // // // // // //   validate(getAllWordsQuerySchema, 'query'),
// // // // // // //   ctrl.getMyVocabulary
// // // // // // // );

// // // // // // // // Barcha so'zlar (filter/pagination)
// // // // // // // router.get('/',
// // // // // // //   authorize(STUDENT),
// // // // // // //   validate(getAllWordsQuerySchema, 'query'),
// // // // // // //   ctrl.getAllWords
// // // // // // // );

// // // // // // // // O'quvchi yangi so'z qo'shadi (cheksiz)
// // // // // // // // Body: { word, translation, language }
// // // // // // // router.post('/',
// // // // // // //   authorize(STUDENT),
// // // // // // //   validate(addSelfWordSchema),
// // // // // // //   ctrl.addSelfWord
// // // // // // // );

// // // // // // // // O'quvchi faqat o'zi qo'shgan so'zni o'chiradi
// // // // // // // router.delete('/:wordId',
// // // // // // //   authorize(STUDENT),
// // // // // // //   ctrl.deleteSelfWord
// // // // // // // );

// // // // // // // // SM-2 review
// // // // // // // // Body: { reviews: [{ wordId, isCorrect }] }
// // // // // // // router.post('/review',
// // // // // // //   authorize(STUDENT),
// // // // // // //   validate(submitReviewSchema),
// // // // // // //   ctrl.submitReview
// // // // // // // );

// // // // // // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // // // // // O'QITUVCHI / ASSISTANT ENDPOINTLARI
// // // // // // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // // // // // Ustoz lug'atini o'quvchilarga qo'shish
// // // // // // // // Body: { studentIds: [...] }
// // // // // // // router.post('/from-vocab/:vocabularyId',
// // // // // // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // // // // // //   validate(addFromVocabSchema),
// // // // // // //   ctrl.addFromVocabulary
// // // // // // // );

// // // // // // // // VocabCheck natijalaridan qo'shish
// // // // // // // // Body: { studentId, wordResults: [...] }
// // // // // // // router.post('/from-vocabcheck',
// // // // // // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // // // // // //   validate(addFromVocabCheckSchema),
// // // // // // //   ctrl.addFromVocabCheck
// // // // // // // );

// // // // // // // // Guruh statistikasi
// // // // // // // // ?studentIds=id1,id2,id3
// // // // // // // router.get('/group-stats',
// // // // // // //   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
// // // // // // //   ctrl.getGroupStats
// // // // // // // );

// // // // // // // // ═══════════════════════════════════════════════════════════════════════════════
// // // // // // // // ADMIN ENDPOINTLARI
// // // // // // // // ═══════════════════════════════════════════════════════════════════════════════

// // // // // // // router.delete('/student/:studentId/reset',
// // // // // // //   authorize(ADMIN),
// // // // // // //   ctrl.resetStudentWords
// // // // // // // );

// // // // // // // module.exports = router;