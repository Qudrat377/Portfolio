const router = require('express').Router();
const groupController = require('../controllers/group.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createGroupSchema,
  updateGroupSchema,
  addStudentSchema,
  groupQuerySchema,
} = require('../validators/group.validator');
const { ROLES } = require('../config/constants');

const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

router.use(authenticate);

router.get(
  '/',
  validate(groupQuerySchema, 'query'),
  groupController.getGroups
);

router.get('/:id', groupController.getGroupById);

router.post(
  '/',
  authorize(ADMIN, MANAGER, TEACHER),
  validate(createGroupSchema),
  groupController.createGroup
);

router.patch(
  '/:id',
  authorize(ADMIN, MANAGER, TEACHER),
  validate(updateGroupSchema),
  groupController.updateGroup
);

router.delete(
  '/:id',
  authorize(ADMIN, MANAGER, TEACHER),
  groupController.deleteGroup
);

// Student management within group
router.post(
  '/:id/students',
  authorize(ADMIN, MANAGER, TEACHER),
  validate(addStudentSchema),
  groupController.addStudent
);

router.delete(
  '/:id/students/:studentId',
  authorize(ADMIN, MANAGER, TEACHER),
  groupController.removeStudent
);

// Get vocabulary learning progress stats for a group
router.get(
  '/:id/vocabulary-progress',
  authorize(ADMIN, MANAGER, TEACHER, ASSISTANT),
  groupController.getGroupVocabularyStats
);

module.exports = router;
