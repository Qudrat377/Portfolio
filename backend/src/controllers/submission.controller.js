const submissionService = require('../services/submission.service');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

exports.getSubmissions = asyncHandler(async (req, res) => {
  const result = await submissionService.getSubmissions(req.query, req.user);
  sendSuccess(res, { data: result.submissions, meta: result.meta });
});

exports.getSubmissionById = asyncHandler(async (req, res) => {
  const submission = await submissionService.getSubmissionById(req.params.id, req.user);
  sendSuccess(res, { data: { submission } });
});

exports.submitHomework = asyncHandler(async (req, res) => {
  const submission = await submissionService.submitHomework(
    req.params.homeworkId,
    req.body,
    req.user
  );
  sendSuccess(res, {
    data: { submission },
    message: 'Homework submitted successfully',
    statusCode: 201,
  });
});

exports.reviewSubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.reviewSubmission(
    req.params.id,
    req.body,
    req.user
  );
  sendSuccess(res, { data: { submission }, message: 'Submission reviewed successfully' });
});

exports.getGroupStats = asyncHandler(async (req, res) => {
  const stats = await submissionService.getGroupSubmissionStats(
    req.params.groupId,
    req.query.homeworkId
  );
  sendSuccess(res, { data: stats });
});
