const router = require('express').Router();
const homeworkController = require('../controllers/homework.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createHomeworkSchema,
  updateHomeworkSchema,
  homeworkQuerySchema,
} = require('../validators/homework.validator');
const { ROLES } = require('../config/constants');

const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

router.use(authenticate);

router.get(
  '/',
  validate(homeworkQuerySchema, 'query'),
  homeworkController.getHomework
);

router.get('/:id', homeworkController.getHomeworkById);

router.post(
  '/',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  validate(createHomeworkSchema),
  homeworkController.createHomework
);

router.patch(
  '/:id',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  validate(updateHomeworkSchema),
  homeworkController.updateHomework
);

router.patch(
  '/:id/publish',
  authorize(TEACHER, ADMIN, MANAGER),
  homeworkController.publishHomework
);

router.delete(
  '/:id',
  authorize(TEACHER, ADMIN, MANAGER),
  homeworkController.deleteHomework
);

// Group homework stats
router.get(
  '/group/:groupId/stats',
  authorize(ADMIN, MANAGER, TEACHER, ASSISTANT),
  homeworkController.getHomeworkStats
);

module.exports = router;
