const homeworkService = require('../services/homework.service');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

exports.getHomework = asyncHandler(async (req, res) => {
  const result = await homeworkService.getHomework(req.query, req.user);
  sendSuccess(res, { data: result.homework, meta: result.meta });
});

exports.getHomeworkById = asyncHandler(async (req, res) => {
  const homework = await homeworkService.getHomeworkById(req.params.id, req.user);
  sendSuccess(res, { data: { homework } });
});

exports.createHomework = asyncHandler(async (req, res) => {
  const homework = await homeworkService.createHomework(req.body, req.user);
  sendSuccess(res, { data: { homework }, message: 'Homework created successfully', statusCode: 201 });
});

exports.updateHomework = asyncHandler(async (req, res) => {
  const homework = await homeworkService.updateHomework(req.params.id, req.body, req.user);
  sendSuccess(res, { data: { homework }, message: 'Homework updated successfully' });
});

exports.publishHomework = asyncHandler(async (req, res) => {
  const homework = await homeworkService.publishHomework(req.params.id, req.user);
  sendSuccess(res, { data: { homework }, message: 'Homework published successfully' });
});

exports.deleteHomework = asyncHandler(async (req, res) => {
  await homeworkService.softDeleteHomework(req.params.id, req.user);
  sendSuccess(res, { message: 'Homework deleted successfully' });
});

exports.getHomeworkStats = asyncHandler(async (req, res) => {
  const stats = await homeworkService.getHomeworkStats(req.params.groupId);
  sendSuccess(res, { data: stats });
});
