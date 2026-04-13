const speakingResultService = require('../services/speakingResult.service');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

exports.approveStudent = asyncHandler(async (req, res) => {
  const { homework, student } = req.body;
  const result = await speakingResultService.approveStudentForTest(homework, student, req.user);
  sendSuccess(res, {
    data: { result },
    message: 'Student approved for speaking test',
    statusCode: 201,
  });
});

exports.submitResult = asyncHandler(async (req, res) => {
  const result = await speakingResultService.submitResult(req.body, req.user);
  sendSuccess(res, { data: { result }, message: 'Speaking result submitted successfully' });
});

exports.getResults = asyncHandler(async (req, res) => {
  const result = await speakingResultService.getResults(req.query, req.user);
  sendSuccess(res, { data: result.results, meta: result.meta });
});

exports.getResultById = asyncHandler(async (req, res) => {
  const result = await speakingResultService.getResultById(req.params.id, req.user);
  sendSuccess(res, { data: { result } });
});

exports.addTeacherNote = asyncHandler(async (req, res) => {
  const result = await speakingResultService.addTeacherNote(
    req.params.id,
    req.body.teacherNote,
    req.user
  );
  sendSuccess(res, { data: { result }, message: 'Teacher note added' });
});

exports.getStudentProgress = asyncHandler(async (req, res) => {
  const result = await speakingResultService.getStudentProgress(
    req.params.studentId,
    req.query.groupId
  );
  sendSuccess(res, { data: result });
});
