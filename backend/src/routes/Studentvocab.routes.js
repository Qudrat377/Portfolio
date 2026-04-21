const router = require('express').Router();
const ctrl = require("../controllers/Studentvocab.controller");
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  submitReviewSchema,
  addFromVocabSchema,
  addFromVocabCheckSchema,
  getAllWordsQuerySchema,
} = require('../validators/studentVocab.validator');
const { ROLES } = require('../config/constants');

const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

router.use(authenticate);

// ── O'quvchi uchun endpointlar ─────────────────────────────────────────────

// Bugun takrorlanishi kerak so'zlar
router.get('/due', authorize(STUDENT), ctrl.getDueWords);

// Statistika
router.get('/stats', authorize(STUDENT), ctrl.getMyStats);

// Barcha so'zlar (sahifalab)
router.get(
  '/words',
  authorize(STUDENT),
  validate(getAllWordsQuerySchema, 'query'),
  ctrl.getAllWords
);

// O'rganib javob berish (SM-2 yangilanadi)
router.post(
  '/review',
  authorize(STUDENT),
  validate(submitReviewSchema),
  ctrl.submitReview
);

// ── O'qituvchi / Assistant uchun ─────────────────────────────────────────

// Lug'atni o'quvchilar bazasiga qo'shish
router.post(
  '/add-from-vocab/:vocabularyId',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  validate(addFromVocabSchema),
  ctrl.addFromVocabulary
);

// VocabCheck natijalaridan so'z qo'shish
router.post(
  '/from-vocabcheck',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  validate(addFromVocabCheckSchema),
  ctrl.addFromVocabCheck
);

// Guruh statistikasi
router.get(
  '/group-stats',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  ctrl.getGroupStats
);

// ── Admin uchun ──────────────────────────────────────────────────────────

// O'quvchi lug'at bazasini tozalash
router.delete(
  '/:studentId/reset',
  authorize(ADMIN, MANAGER),
  ctrl.resetStudentVocab
);

module.exports = router;