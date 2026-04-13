const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../config/constants');

const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

router.use(authenticate);

// Student views own progress
router.get('/me/progress', authorize(STUDENT), analyticsController.getMyProgress);

// Teacher/Admin views a specific student's progress
router.get(
  '/students/:studentId/progress',
  authorize(ADMIN, MANAGER, TEACHER, ASSISTANT),
  analyticsController.getStudentProgress
);

// Group analytics
router.get(
  '/groups/:groupId',
  authorize(ADMIN, MANAGER, TEACHER, ASSISTANT),
  analyticsController.getGroupAnalytics
);

// Center-wide overview
router.get(
  '/overview',
  authorize(ADMIN, MANAGER),
  analyticsController.getCenterOverview
);

module.exports = router;
