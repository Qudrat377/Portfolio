const personalWordService = require('../services/Personalword.service');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

// ── O'QUVCHI endpointlari ──────────────────────────────────────────────────────

// GET /api/v1/personal-words/due
// Bugun takrorlanishi kerak so'zlar (max 50)
exports.getDueWords = asyncHandler(async (req, res) => {
  const result = await personalWordService.getDueWords(req.user._id);
  sendSuccess(res, { data: result });
});

// GET /api/v1/personal-words/stats
// Statistika (barcha so'zlarni tortmasdan)
exports.getStats = asyncHandler(async (req, res) => {
  const result = await personalWordService.getStats(req.user._id);
  sendSuccess(res, { data: result });
});

// GET /api/v1/personal-words
// Barcha so'zlar pagination bilan
// ?source=self|teacher|vocabcheck
// ?status=new|learning|review|mastered
// ?page=1&limit=20
exports.getAllWords = asyncHandler(async (req, res) => {
  const result = await personalWordService.getAllWords(req.user._id, req.query);
  sendSuccess(res, { data: result.words, meta: result.meta });
});

// GET /api/v1/personal-words/my-vocabulary
// To'liq lug'at xazinasi — barcha manbadan, bittada
// Summary ham qaytariladi (kimdan nechta so'z)
exports.getMyVocabulary = asyncHandler(async (req, res) => {
  const result = await personalWordService.getMyVocabulary(req.user._id, req.query);
  sendSuccess(res, {
    data: {
      words:   result.words,
      summary: result.summary,
    },
    meta: result.meta,
  });
});

// POST /api/v1/personal-words
// O'quvchi yangi so'z qo'shadi
// Body: { word, translation, language }
exports.addSelfWord = asyncHandler(async (req, res) => {
  const result = await personalWordService.addSelfWord(req.user._id, req.body);
  sendSuccess(res, {
    data:    result,
    message: "So'z shaxsiy lug'atingizga qo'shildi",
    statusCode: 201,
  });
});

// DELETE /api/v1/personal-words/:wordId
// O'quvchi faqat o'zi qo'shgan so'zni (source: 'self') o'chira oladi
exports.deleteSelfWord = asyncHandler(async (req, res) => {
  const result = await personalWordService.deleteSelfWord(req.user._id, req.params.wordId);
  sendSuccess(res, { data: result, message: "So'z o'chirildi" });
});

// PATCH /api/v1/personal-words/:wordId
// O'quvchi faqat o'zi qo'shgan so'zni (source: 'self') tahrirlaydi
// Body: { word?, translation?, language? }  — hammasi optional, kamida bittasi kerak
exports.updateSelfWord = asyncHandler(async (req, res) => {
  const result = await personalWordService.updateSelfWord(
    req.user._id,
    req.params.wordId,
    req.body
  );
  sendSuccess(res, {
    data:    result,
    message: "So'z muvaffaqiyatli tahrirlandi",
  });
});

// POST /api/v1/personal-words/review
// SM-2 — o'quvchi javob berdi
// Body: { reviews: [{ wordId, isCorrect }] }
exports.submitReview = asyncHandler(async (req, res) => {
  const result = await personalWordService.submitReview(req.user._id, req.body.reviews);
  sendSuccess(res, {
    data:    result,
    message: `${result.reviewed} ta so'z tekshirildi`,
  });
});

// ── O'QITUVCHI / ASSISTANT endpointlari ───────────────────────────────────────

// POST /api/v1/personal-words/from-vocab/:vocabularyId
// Ustoz lug'atini o'quvchilarga qo'shish
// Body: { studentIds: [...] }
exports.addFromVocabulary = asyncHandler(async (req, res) => {
  const { studentIds } = req.body;

  if (!studentIds || studentIds.length === 0) {
    return sendSuccess(res, { data: { summary: [] } });
  }

  const results = await Promise.allSettled(
    studentIds.map((sid) =>
      personalWordService.addWordsFromVocabulary(sid, req.params.vocabularyId)
    )
  );

  const summary = results.map((r, i) => ({
    studentId:  studentIds[i],
    success:    r.status === 'fulfilled',
    addedCount: r.status === 'fulfilled' ? r.value.addedCount : 0,
    error:      r.status === 'rejected'  ? r.reason?.message  : null,
  }));

  sendSuccess(res, {
    data:       { summary },
    message:    "Lug'at o'quvchilarga qo'shildi",
    statusCode: 201,
  });
});

// POST /api/v1/personal-words/from-vocabcheck
// VocabCheck natijalaridan so'z qo'shish
// Body: { studentId, wordResults: [...] }
exports.addFromVocabCheck = asyncHandler(async (req, res) => {
  const { studentId, wordResults } = req.body;
  const result = await personalWordService.addFromVocabCheckResult(studentId, wordResults);
  sendSuccess(res, {
    data:       result,
    message:    'VocabCheck natijalari saqlandi',
    statusCode: 201,
  });
});

// GET /api/v1/personal-words/group-stats?studentIds=id1,id2,id3
// Guruh o'quvchilari statistikasi
exports.getGroupStats = asyncHandler(async (req, res) => {
  const studentIds = req.query.studentIds
    ? req.query.studentIds.split(',').filter(Boolean)
    : [];

  if (studentIds.length === 0) {
    return sendSuccess(res, { data: [] });
  }

  const result = await personalWordService.getGroupStats(studentIds);
  sendSuccess(res, { data: result });
});

// ── ADMIN endpointlari ─────────────────────────────────────────────────────────

// DELETE /api/v1/personal-words/student/:studentId/reset
exports.resetStudentWords = asyncHandler(async (req, res) => {
  const result = await personalWordService.resetStudentWords(req.params.studentId);
  sendSuccess(res, { data: result, message: "O'quvchi lug'at bazasi tozalandi" });
});

// const personalWordService = require('../services/Personalword.service');
// const { sendSuccess } = require('../utils/response');
// const { asyncHandler } = require('../middlewares/error.middleware');

// // ── O'QUVCHI endpointlari ──────────────────────────────────────────────────────

// // GET /api/v1/personal-words/due
// // Bugun takrorlanishi kerak so'zlar (max 50)
// exports.getDueWords = asyncHandler(async (req, res) => {
//   const result = await personalWordService.getDueWords(req.user._id);
//   sendSuccess(res, { data: result });
// });

// // GET /api/v1/personal-words/stats
// // Statistika (barcha so'zlarni tortmasdan)
// exports.getStats = asyncHandler(async (req, res) => {
//   const result = await personalWordService.getStats(req.user._id);
//   sendSuccess(res, { data: result });
// });

// // GET /api/v1/personal-words
// // Barcha so'zlar pagination bilan
// // ?source=self|teacher|vocabcheck
// // ?status=new|learning|review|mastered
// // ?page=1&limit=20
// exports.getAllWords = asyncHandler(async (req, res) => {
//   const result = await personalWordService.getAllWords(req.user._id, req.query);
//   sendSuccess(res, { data: result.words, meta: result.meta });
// });

// // GET /api/v1/personal-words/my-vocabulary
// // To'liq lug'at xazinasi — barcha manbadan, bittada
// // Summary ham qaytariladi (kimdan nechta so'z)
// exports.getMyVocabulary = asyncHandler(async (req, res) => {
//   const result = await personalWordService.getMyVocabulary(req.user._id, req.query);
//   sendSuccess(res, {
//     data: {
//       words:   result.words,
//       summary: result.summary,
//     },
//     meta: result.meta,
//   });
// });

// // POST /api/v1/personal-words
// // O'quvchi yangi so'z qo'shadi
// // Body: { word, translation, language }
// exports.addSelfWord = asyncHandler(async (req, res) => {
//   const result = await personalWordService.addSelfWord(req.user._id, req.body);
//   sendSuccess(res, {
//     data:    result,
//     message: "So'z shaxsiy lug'atingizga qo'shildi",
//     statusCode: 201,
//   });
// });

// // DELETE /api/v1/personal-words/:wordId
// // O'quvchi faqat o'zi qo'shgan so'zni (source: 'self') o'chira oladi
// exports.deleteSelfWord = asyncHandler(async (req, res) => {
//   const result = await personalWordService.deleteSelfWord(req.user._id, req.params.wordId);
//   sendSuccess(res, { data: result, message: "So'z o'chirildi" });
// });

// // POST /api/v1/personal-words/review
// // SM-2 — o'quvchi javob berdi
// // Body: { reviews: [{ wordId, isCorrect }] }
// exports.submitReview = asyncHandler(async (req, res) => {
//   const result = await personalWordService.submitReview(req.user._id, req.body.reviews);
//   sendSuccess(res, {
//     data:    result,
//     message: `${result.reviewed} ta so'z tekshirildi`,
//   });
// });

// // ── O'QITUVCHI / ASSISTANT endpointlari ───────────────────────────────────────

// // POST /api/v1/personal-words/from-vocab/:vocabularyId
// // Ustoz lug'atini o'quvchilarga qo'shish
// // Body: { studentIds: [...] }
// exports.addFromVocabulary = asyncHandler(async (req, res) => {
//   const { studentIds } = req.body;

//   if (!studentIds || studentIds.length === 0) {
//     return sendSuccess(res, { data: { summary: [] } });
//   }

//   const results = await Promise.allSettled(
//     studentIds.map((sid) =>
//       personalWordService.addWordsFromVocabulary(sid, req.params.vocabularyId)
//     )
//   );

//   const summary = results.map((r, i) => ({
//     studentId:  studentIds[i],
//     success:    r.status === 'fulfilled',
//     addedCount: r.status === 'fulfilled' ? r.value.addedCount : 0,
//     error:      r.status === 'rejected'  ? r.reason?.message  : null,
//   }));

//   sendSuccess(res, {
//     data:       { summary },
//     message:    "Lug'at o'quvchilarga qo'shildi",
//     statusCode: 201,
//   });
// });

// // POST /api/v1/personal-words/from-vocabcheck
// // VocabCheck natijalaridan so'z qo'shish
// // Body: { studentId, wordResults: [...] }
// exports.addFromVocabCheck = asyncHandler(async (req, res) => {
//   const { studentId, wordResults } = req.body;
//   const result = await personalWordService.addFromVocabCheckResult(studentId, wordResults);
//   sendSuccess(res, {
//     data:       result,
//     message:    'VocabCheck natijalari saqlandi',
//     statusCode: 201,
//   });
// });

// // GET /api/v1/personal-words/group-stats?studentIds=id1,id2,id3
// // Guruh o'quvchilari statistikasi
// exports.getGroupStats = asyncHandler(async (req, res) => {
//   const studentIds = req.query.studentIds
//     ? req.query.studentIds.split(',').filter(Boolean)
//     : [];

//   if (studentIds.length === 0) {
//     return sendSuccess(res, { data: [] });
//   }

//   const result = await personalWordService.getGroupStats(studentIds);
//   sendSuccess(res, { data: result });
// });

// // ── ADMIN endpointlari ─────────────────────────────────────────────────────────

// // DELETE /api/v1/personal-words/student/:studentId/reset
// exports.resetStudentWords = asyncHandler(async (req, res) => {
//   const result = await personalWordService.resetStudentWords(req.params.studentId);
//   sendSuccess(res, { data: result, message: "O'quvchi lug'at bazasi tozalandi" });
// });