const vocabularyService = require('../services/vocabulary.service');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

exports.getVocabularies = asyncHandler(async (req, res) => {
  const result = await vocabularyService.getVocabularies(req.query);
  sendSuccess(res, { data: result.vocabularies, meta: result.meta });
});

exports.getVocabularyById = asyncHandler(async (req, res) => {
  const vocabulary = await vocabularyService.getVocabularyById(req.params.id);
  sendSuccess(res, { data: { vocabulary } });
});

exports.createVocabulary = asyncHandler(async (req, res) => {
  const vocabulary = await vocabularyService.createVocabulary(req.body, req.user);
  sendSuccess(res, { data: { vocabulary }, message: 'Vocabulary created successfully', statusCode: 201 });
});

exports.updateVocabulary = asyncHandler(async (req, res) => {
  const vocabulary = await vocabularyService.updateVocabulary(req.params.id, req.body, req.user);
  sendSuccess(res, { data: { vocabulary }, message: 'Vocabulary updated successfully' });
});

exports.updateItemTranslation = asyncHandler(async (req, res) => {
  const { itemId, editedTranslation } = req.body;
  const vocabulary = await vocabularyService.updateItemTranslation(req.params.id, itemId, editedTranslation, req.user);
  sendSuccess(res, { data: { vocabulary }, message: 'Translation updated successfully' });
});

exports.deleteVocabulary = asyncHandler(async (req, res) => {
  await vocabularyService.deleteVocabulary(req.params.id, req.user);
  sendSuccess(res, { message: 'Vocabulary deleted successfully' });
});

// ── Assignment ─────────────────────────────────────────────────────────────────

exports.assignToGroup = asyncHandler(async (req, res) => {
  const assignment = await vocabularyService.assignToGroup(
    req.params.id,
    req.params.groupId,
    req.body,
    req.user
  );
  sendSuccess(res, { data: { assignment }, message: "Vocabulary assigned to group", statusCode: 201 });
});

exports.removeFromGroup = asyncHandler(async (req, res) => {
  await vocabularyService.removeFromGroup(req.params.id, req.params.groupId, req.user);
  sendSuccess(res, { message: "Vocabulary removed from group" });
});

exports.getGroupVocabularies = asyncHandler(async (req, res) => {
  const result = await vocabularyService.getGroupVocabularies(req.params.groupId, req.query);
  sendSuccess(res, { data: result.vocabularies, meta: result.meta });
});

exports.getVocabularyGroups = asyncHandler(async (req, res) => {
  const groups = await vocabularyService.getVocabularyGroups(req.params.id);
  sendSuccess(res, { data: { groups } });
});


// const vocabularyService = require('../services/vocabulary.service');
// const { sendSuccess } = require('../utils/response');
// const { asyncHandler } = require('../middlewares/error.middleware');

// exports.getVocabularies = asyncHandler(async (req, res) => {
//   const result = await vocabularyService.getVocabularies(req.query, req.user);
//   sendSuccess(res, { data: result.vocabularies, meta: result.meta });
// });

// exports.getVocabularyById = asyncHandler(async (req, res) => {
//   const vocabulary = await vocabularyService.getVocabularyById(req.params.id);
//   sendSuccess(res, { data: { vocabulary } });
// });

// exports.createVocabulary = asyncHandler(async (req, res) => {
//   const vocabulary = await vocabularyService.createVocabulary(req.body, req.user);
//   sendSuccess(res, { data: { vocabulary }, message: 'Vocabulary created successfully', statusCode: 201 });
// });

// exports.updateVocabulary = asyncHandler(async (req, res) => {
//   const vocabulary = await vocabularyService.updateVocabulary(req.params.id, req.body, req.user);
//   sendSuccess(res, { data: { vocabulary }, message: 'Vocabulary updated successfully' });
// });

// exports.updateItemTranslation = asyncHandler(async (req, res) => {
//   const { itemId, editedTranslation } = req.body;
//   const vocabulary = await vocabularyService.updateItemTranslation(
//     req.params.id,
//     itemId,
//     editedTranslation,
//     req.user
//   );
//   sendSuccess(res, { data: { vocabulary }, message: 'Translation updated successfully' });
// });

// exports.deleteVocabulary = asyncHandler(async (req, res) => {
//   await vocabularyService.softDeleteVocabulary(req.params.id, req.user);
//   sendSuccess(res, { message: 'Vocabulary deleted successfully' });
// });
