const router = require('express').Router();
const submissionController = require('../controllers/submission.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  submitHomeworkSchema,
  reviewSubmissionSchema,
  submissionQuerySchema,
} = require('../validators/submission.validator');
const { ROLES } = require('../config/constants');

const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

router.use(authenticate);

router.get(
  '/',
  validate(submissionQuerySchema, 'query'),
  submissionController.getSubmissions
);

router.get('/:id', submissionController.getSubmissionById);

// Student submits homework
router.post(
  '/homework/:homeworkId',
  authorize(STUDENT),
  validate(submitHomeworkSchema),
  submissionController.submitHomework
);

// Teacher/Assistant reviews submission
router.patch(
  '/:id/review',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  validate(reviewSubmissionSchema),
  submissionController.reviewSubmission
);

// Submission stats for a group
router.get(
  '/group/:groupId/stats',
  authorize(ADMIN, MANAGER, TEACHER, ASSISTANT),
  submissionController.getGroupStats
);

module.exports = router;
