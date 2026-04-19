const router = require('express').Router();
const vocabCheckController = require('../controllers/vocabCheck.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Get a specific day's records for a group
router.get(
  '/groups/:groupId',
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.TEACHER, ROLES.ASSISTANT),
  vocabCheckController.getGroupVocabCheck
);

// Submit logic (creating or updating records)
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.TEACHER, ROLES.ASSISTANT),
  vocabCheckController.markVocabCheck
);

module.exports = router;
