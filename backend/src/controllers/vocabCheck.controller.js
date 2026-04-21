const vocabCheckService = require('../services/vocabCheck.service');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

exports.getGroupVocabCheck = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { homeworkId, date } = req.query; // pass date in YYYY-MM-DD
  
  const check = await vocabCheckService.getGroupVocabCheck(groupId, homeworkId, date, req.user);
  // sendSuccess(res, { data: { vocabCheck: check } });
  sendSuccess(res, { data: { vocabCheck: check }, message: '...', statusCode: 201 });
});

exports.markVocabCheck = asyncHandler(async (req, res) => {
  const check = await vocabCheckService.markVocabCheck(req.body, req.user);
  // sendSuccess(res, 201, { message: 'Vocabulary check saved successfully', data: { vocabCheck: check } });
  sendSuccess(res, { data: { vocabCheck: check }, message: 'Vocabulary check saved successfully', statusCode: 201 });
});
