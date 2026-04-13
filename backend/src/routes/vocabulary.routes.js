const router = require('express').Router();
const vocabularyController = require('../controllers/vocabulary.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createVocabularySchema,
  updateVocabularySchema,
  updateTranslationSchema,
  assignToGroupSchema,
} = require('../validators/vocabulary.validator');
const { ROLES } = require('../config/constants');

const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

router.use(authenticate);

// ── Lug'atlar (global, guruhsiz) ─────────────────────────────────────────────
router.get('/', vocabularyController.getVocabularies);
router.get('/:id', vocabularyController.getVocabularyById);
router.get('/:id/groups', authorize(ADMIN, MANAGER, TEACHER, ASSISTANT), vocabularyController.getVocabularyGroups);

router.post('/', authorize(TEACHER, ASSISTANT, ADMIN, MANAGER), validate(createVocabularySchema), vocabularyController.createVocabulary);
router.patch('/:id', authorize(TEACHER, ASSISTANT, ADMIN, MANAGER), validate(updateVocabularySchema), vocabularyController.updateVocabulary);
router.patch('/:id/translation', authorize(TEACHER, ASSISTANT, ADMIN, MANAGER), validate(updateTranslationSchema), vocabularyController.updateItemTranslation);
router.delete('/:id', authorize(TEACHER, ADMIN, MANAGER), vocabularyController.deleteVocabulary);

// ── Assignment (guruhga berish) ──────────────────────────────────────────────
// Guruhning lug'atlari
router.get('/group/:groupId', vocabularyController.getGroupVocabularies);

// Guruhga lug'at berish
router.post('/:id/assign/:groupId',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  validate(assignToGroupSchema),
  vocabularyController.assignToGroup
);

// Guruhdan lug'at olib tashlash
router.delete('/:id/assign/:groupId',
  authorize(TEACHER, ADMIN, MANAGER),
  vocabularyController.removeFromGroup
);

module.exports = router;


// const router = require('express').Router();
// const vocabularyController = require('../controllers/vocabulary.controller');
// const { authenticate, authorize } = require('../middlewares/auth.middleware');
// const { validate } = require('../middlewares/validate.middleware');
// const {
//   createVocabularySchema,
//   updateVocabularySchema,
//   updateTranslationSchema,
// } = require('../validators/vocabulary.validator');
// const { ROLES } = require('../config/constants');

// const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

// router.use(authenticate);

// router.get('/', vocabularyController.getVocabularies);

// router.get('/:id', vocabularyController.getVocabularyById);

// router.post(
//   '/',
//   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
//   validate(createVocabularySchema),
//   vocabularyController.createVocabulary
// );

// router.patch(
//   '/:id',
//   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
//   validate(updateVocabularySchema),
//   vocabularyController.updateVocabulary
// );

// // Update a single word's translation
// router.patch(
//   '/:id/translation',
//   authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
//   validate(updateTranslationSchema),
//   vocabularyController.updateItemTranslation
// );

// router.delete(
//   '/:id',
//   authorize(TEACHER, ADMIN, MANAGER),
//   vocabularyController.deleteVocabulary
// );

// module.exports = router;
