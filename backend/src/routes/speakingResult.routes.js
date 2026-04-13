const router = require('express').Router();
const speakingResultController = require('../controllers/speakingResult.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  submitSpeakingResultSchema,
  approveSpeakingSchema,
  teacherNoteSchema,
} = require('../validators/speakingResult.validator');
const { ROLES } = require('../config/constants');

const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

router.use(authenticate);

// Teacher/Assistant approves a student for speaking test
router.post(
  '/approve',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  validate(approveSpeakingSchema),
  speakingResultController.approveStudent
);

// Student submits speaking result (processed on mobile)
router.post(
  '/submit',
  authorize(STUDENT),
  validate(submitSpeakingResultSchema),
  speakingResultController.submitResult
);

// List results
router.get('/', speakingResultController.getResults);

// Student progress (speaking)
router.get(
  '/student/:studentId/progress',
  authorize(ADMIN, MANAGER, TEACHER, ASSISTANT),
  speakingResultController.getStudentProgress
);

router.get('/:id', speakingResultController.getResultById);

// Teacher note
router.patch(
  '/:id/note',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  validate(teacherNoteSchema),
  speakingResultController.addTeacherNote
);

module.exports = router;
