const studentVocabService = require('../services/studentVocab.service');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

// ── O'quvchi uchun ─────────────────────────────────────────────────────────

// GET /api/v1/student-vocab/due
// Bugun takrorlanishi kerak so'zlar
exports.getDueWords = asyncHandler(async (req, res) => {
  const result = await studentVocabService.getDueWords(req.user._id);
  sendSuccess(res, { data: result });
});

// GET /api/v1/student-vocab/stats
// Statistika
exports.getMyStats = asyncHandler(async (req, res) => {
  const result = await studentVocabService.getStats(req.user._id);
  sendSuccess(res, { data: result });
});

// GET /api/v1/student-vocab/words?status=learning&page=1&limit=30
// Barcha so'zlar (sahifalab)
exports.getAllWords = asyncHandler(async (req, res) => {
  const result = await studentVocabService.getAllWords(req.user._id, req.query);
  sendSuccess(res, { data: result });
});

// POST /api/v1/student-vocab/review
// O'quvchi o'rganib javob berdi
// Body: { reviews: [{ vocabularyItemId, isCorrect }] }
exports.submitReview = asyncHandler(async (req, res) => {
  const result = await studentVocabService.submitReview(
    req.user._id,
    req.body.reviews
  );
  sendSuccess(res, {
    data: result,
    message: `${result.reviewed} ta so'z tekshirildi`,
  });
});

// ── O'qituvchi / Assistant uchun ────────────────────────────────────────────

// POST /api/v1/student-vocab/add-from-vocab/:vocabularyId
// Teacher lug'at yaratib, o'quvchilar bazasiga qo'shadi
// Body: { studentIds: ['...', '...'] }
exports.addFromVocabulary = asyncHandler(async (req, res) => {
  const { vocabularyId } = req.params;
  const { studentIds } = req.body;

  if (!studentIds || studentIds.length === 0) {
    return sendSuccess(res, { data: { results: [] }, message: 'studentIds bo\'sh' });
  }

  // Barcha o'quvchilar uchun parallel qo'shish
  const results = await Promise.allSettled(
    studentIds.map((sid) =>
      studentVocabService.addWordsFromVocabulary(sid, vocabularyId)
    )
  );

  const summary = results.map((r, i) => ({
    studentId: studentIds[i],
    success: r.status === 'fulfilled',
    addedCount: r.status === 'fulfilled' ? r.value.addedCount : 0,
    error: r.status === 'rejected' ? r.reason?.message : null,
  }));

  sendSuccess(res, {
    data: { summary },
    message: 'Lug\'at o\'quvchilar bazasiga qo\'shildi',
    statusCode: 201,
  });
});

// POST /api/v1/student-vocab/from-vocabcheck
// VocabCheck natijalaridan so'z qo'shish
// Body: { studentId, wordResults: [{vocabularyItemId, word, translation, language, vocabularyId, isCorrect}] }
exports.addFromVocabCheck = asyncHandler(async (req, res) => {
  const { studentId, wordResults } = req.body;

  const result = await studentVocabService.addFromVocabCheckResult(
    studentId,
    wordResults
  );

  sendSuccess(res, {
    data: result,
    message: 'VocabCheck natijalari saqlandi',
    statusCode: 201,
  });
});

// GET /api/v1/student-vocab/group-stats
// Guruh o'quvchilarining umumiy statistikasi
// Query: studentIds=id1,id2,id3
exports.getGroupStats = asyncHandler(async (req, res) => {
  const studentIds = req.query.studentIds
    ? req.query.studentIds.split(',').filter(Boolean)
    : [];

  if (studentIds.length === 0) {
    return sendSuccess(res, { data: [] });
  }

  const result = await studentVocabService.getGroupStats(studentIds);
  sendSuccess(res, { data: result });
});

// DELETE /api/v1/student-vocab/:studentId/reset  (faqat ADMIN)
exports.resetStudentVocab = asyncHandler(async (req, res) => {
  await studentVocabService.resetStudentVocab(req.params.studentId);
  sendSuccess(res, { message: 'O\'quvchi lug\'at bazasi tozalandi' });
});