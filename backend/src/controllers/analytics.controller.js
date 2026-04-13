const analyticsService = require('../services/analytics.service');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

exports.getStudentProgress = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId || req.user._id.toString();
  const { groupId } = req.query;
  const data = await analyticsService.getStudentProgress(studentId, groupId);
  sendSuccess(res, { data });
});

exports.getMyProgress = asyncHandler(async (req, res) => {
  const { groupId } = req.query;
  const data = await analyticsService.getStudentProgress(req.user._id.toString(), groupId);
  sendSuccess(res, { data });
});

exports.getGroupAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getGroupAnalytics(req.params.groupId);
  sendSuccess(res, { data });
});

exports.getCenterOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getCenterOverview();
  sendSuccess(res, { data });
});
