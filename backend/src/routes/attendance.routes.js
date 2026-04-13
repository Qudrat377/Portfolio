const router = require('express').Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  markAttendanceSchema,
  updateAttendanceSchema,
  attendanceQuerySchema,
} = require('../validators/attendance.validator');
const { ROLES } = require('../config/constants');

const { ADMIN, MANAGER, TEACHER, ASSISTANT, STUDENT } = ROLES;

router.use(authenticate);

// Student: view own attendance
router.get('/me', authorize(STUDENT), attendanceController.getMyAttendance);

// All roles can view attendance list (filtered by service layer)
router.get(
  '/',
  authorize(ADMIN, MANAGER, TEACHER, ASSISTANT),
  validate(attendanceQuerySchema, 'query'),
  attendanceController.getAttendance
);

// Student attendance summary by student ID
router.get(
  '/student/:studentId',
  authorize(ADMIN, MANAGER, TEACHER, ASSISTANT),
  attendanceController.getStudentAttendance
);

// Mark new attendance
router.post(
  '/',
  authorize(TEACHER, ASSISTANT),
  validate(markAttendanceSchema),
  attendanceController.markAttendance
);

// Update existing attendance record
router.patch(
  '/:id',
  authorize(TEACHER, ASSISTANT, ADMIN, MANAGER),
  validate(updateAttendanceSchema),
  attendanceController.updateAttendance
);

module.exports = router;
