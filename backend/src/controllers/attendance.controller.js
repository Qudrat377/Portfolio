const attendanceService = require('../services/attendance.service');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

exports.markAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.markAttendance(req.body, req.user);
  sendSuccess(res, { data: { attendance }, message: 'Attendance marked successfully', statusCode: 201 });
});

exports.updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.updateAttendance(req.params.id, req.body, req.user);
  sendSuccess(res, { data: { attendance }, message: 'Attendance updated successfully' });
});

exports.getAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getAttendance(req.query);
  sendSuccess(res, { data: result.records, meta: result.meta });
});

exports.getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { groupId } = req.query;
  const result = await attendanceService.getStudentAttendance(studentId, groupId);
  sendSuccess(res, { data: result });
});

exports.getMyAttendance = asyncHandler(async (req, res) => {
  const { groupId } = req.query;
  const result = await attendanceService.getStudentAttendance(
    req.user._id.toString(),
    groupId
  );
  sendSuccess(res, { data: result });
});
