const groupService = require('../services/group.service');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

exports.getGroups = asyncHandler(async (req, res) => {
  const result = await groupService.getGroups(req.query, req.user);
  sendSuccess(res, { data: result.groups, meta: result.meta });
});

exports.getGroupById = asyncHandler(async (req, res) => {
  const group = await groupService.getGroupById(req.params.id);
  sendSuccess(res, { data: { group } });
});

exports.createGroup = asyncHandler(async (req, res) => {
  const group = await groupService.createGroup(req.body, req.user);
  sendSuccess(res, { data: { group }, message: 'Group created successfully', statusCode: 201 });
});

exports.updateGroup = asyncHandler(async (req, res) => {
  const group = await groupService.updateGroup(req.params.id, req.body, req.user);
  sendSuccess(res, { data: { group }, message: 'Group updated successfully' });
});

exports.deleteGroup = asyncHandler(async (req, res) => {
  await groupService.softDeleteGroup(req.params.id, req.user);
  sendSuccess(res, { message: 'Group deleted successfully' });
});

exports.addStudent = asyncHandler(async (req, res) => {
  const group = await groupService.addStudent(req.params.id, req.body.studentId, req.user);
  sendSuccess(res, { data: { group }, message: 'Student added to group' });
});

exports.removeStudent = asyncHandler(async (req, res) => {
  await groupService.removeStudent(req.params.id, req.params.studentId, req.user);
  sendSuccess(res, { message: 'Student removed from group' });
});
