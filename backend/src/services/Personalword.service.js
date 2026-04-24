const PersonalWord = require('../models/Personalword.model');
const Vocabulary    = require('../models/Vocabulary');
const mongoose      = require('mongoose');
const { NotFoundError, AppError, ConflictError } = require('../utils/AppError');
const { computeNextState, computeStats: _computeStats } = require('../utils/sm2');
const { buildPaginationMeta } = require('../utils/response');
const { parsePagination } = require('../utils/pagination');

// SM-2 ga qo'shimcha: DB dan stats hisoblash
async function computeDbStats(studentId) {
  const now = new Date();
  const sid = new mongoose.Types.ObjectId(studentId);

  const [totals, dueCount] = await Promise.all([
    PersonalWord.aggregate([
      { $match: { student: sid } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    PersonalWord.countDocuments({
      student: sid,
      status: { $ne: 'mastered' },
      nextReviewAt: { $lte: now },
    }),
  ]);

  const statsMap = { new: 0, learning: 0, review: 0, mastered: 0 };
  let total = 0;
  for (const row of totals) {
    statsMap[row._id] = row.count;
    total += row.count;
  }

  return {
    total,
    newWords:  statsMap.new,
    learning:  statsMap.learning,
    review:    statsMap.review,
    mastered:  statsMap.mastered,
    dueToday:  dueCount,
  };
}

class PersonalWordService {

  // ── 1. Bugungi takrorlash uchun so'zlar ───────────────────────────────────
  //
  // Server yuki: MongoDB o'zi filter + limit qiladi.
  // JS ga faqat max 50 ta so'z tortiladi.
  //
  async getDueWords(studentId) {
    const now = new Date();

    const words = await PersonalWord.find({
      student: studentId,
      status: { $ne: 'mastered' },
      nextReviewAt: { $lte: now },
    })
      .limit(50)
      .lean();

    // Aralashtirib yuborish
    const shuffled = words.sort(() => Math.random() - 0.5);

    return {
      words: shuffled,
      count: shuffled.length,
    };
  }

  // ── 2. Statistika ─────────────────────────────────────────────────────────
  async getStats(studentId) {
    return computeDbStats(studentId);
  }

  // ── 3. Barcha so'zlar — pagination bilan ──────────────────────────────────
  //
  // source, status bo'yicha filter.
  // MongoDB o'zi skip/limit qiladi — butun collection tortilmaydi.
  //
  async getAllWords(studentId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const { status, source } = query;

    const filter = { student: studentId };
    if (status) filter.status = status;
    if (source) filter.source = source;

    const [words, total] = await Promise.all([
      PersonalWord.find(filter)
        .sort({ nextReviewAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PersonalWord.countDocuments(filter),
    ]);

    return {
      words,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  // ── 4. O'quvchining TO'LIQ lug'at xazinasi ───────────────────────────────
  //
  // Barcha manbadan so'zlar, bittada, pagination bilan.
  // source + status filter optional.
  // Summary (har bir manbadan qancha so'z) ham qaytariladi.
  //
  async getMyVocabulary(studentId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const { status, source } = query;

    const filter = { student: studentId };
    if (status) filter.status = status;
    if (source) filter.source = source;

    const [words, total, summary] = await Promise.all([
      PersonalWord.find(filter)
        .sort({ nextReviewAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PersonalWord.countDocuments(filter),
      // Har bir source dan nechta so'z borligini hisoblash
      PersonalWord.aggregate([
        { $match: { student: new mongoose.Types.ObjectId(studentId) } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
    ]);

    const summaryMap = { teacher: 0, self: 0, vocabcheck: 0 };
    for (const row of summary) {
      if (summaryMap[row._id] !== undefined) {
        summaryMap[row._id] = row.count;
      }
    }

    return {
      words,
      meta: buildPaginationMeta(total, page, limit),
      summary: {
        ...summaryMap,
        total: summaryMap.teacher + summaryMap.self + summaryMap.vocabcheck,
      },
    };
  }

  // ── 5. Ustoz lug'atidan so'zlarni qo'shish ────────────────────────────────
  //
  // Homework berilganda chaqiriladi.
  // Allaqachon mavjud so'zlar o'tkazib yuboriladi (vocabularyItemId unique index).
  //
  async addWordsFromVocabulary(studentId, vocabularyId) {
    const vocab = await Vocabulary.findOne({ _id: vocabularyId, isDeleted: false }).lean();
    if (!vocab) throw new NotFoundError('Vocabulary');

    // Allaqachon qo'shilgan vocabularyItemId lar
    const existingIds = await PersonalWord.distinct('vocabularyItemId', {
      student: studentId,
      vocabularyItemId: { $in: vocab.items.map((i) => i._id) },
    });

    const existingSet = new Set(existingIds.map((id) => id.toString()));

    const newDocs = vocab.items
      .filter((item) => !existingSet.has(item._id.toString()))
      .map((item) => ({
        student:          studentId,
        word:             item.word,
        translation:      item.translation || item.autoTranslation || '',
        language:         item.language,
        source:           'teacher',
        vocabularyId:     vocab._id,
        vocabularyItemId: item._id,
        stage:            0,
        consecutiveCorrect: 0,
        totalReviews:     0,
        totalCorrect:     0,
        nextReviewAt:     new Date(),
        lastReviewedAt:   null,
        status:           'new',
      }));

    if (newDocs.length === 0) {
      return { addedCount: 0 };
    }

    // insertMany — tezkor, bitta DB so'rovi
    // ordered: false — agar birortasi xato bo'lsa qolganlarni davom ettiradi
    await PersonalWord.insertMany(newDocs, { ordered: false });

    return { addedCount: newDocs.length };
  }

  // ── 6. VocabCheck natijalaridan so'z qo'shish/yangilash ──────────────────
  async addFromVocabCheckResult(studentId, wordResults) {
    for (const result of wordResults) {
      const existing = await PersonalWord.findOne({
        student: studentId,
        vocabularyItemId: result.vocabularyItemId,
      });

      if (existing) {
        // Mavjud so'zni SM-2 bilan yangilash
        const updates = computeNextState(existing, result.isCorrect);
        Object.assign(existing, updates);
        await existing.save();
      } else {
        // Yangi so'z qo'shish
        const initialStage = result.isCorrect ? 1 : 0;
        const nextReview = new Date(
          Date.now() + (result.isCorrect ? 24 * 60 * 60 * 1000 : 0)
        );
        await PersonalWord.create({
          student:          studentId,
          word:             result.word,
          translation:      result.translation || '',
          language:         result.language || 'EN',
          source:           'vocabcheck',
          vocabularyId:     result.vocabularyId || null,
          vocabularyItemId: result.vocabularyItemId,
          stage:            initialStage,
          consecutiveCorrect: result.isCorrect ? 1 : 0,
          totalReviews:     1,
          totalCorrect:     result.isCorrect ? 1 : 0,
          nextReviewAt:     nextReview,
          lastReviewedAt:   new Date(),
          status:           initialStage === 0 ? 'new' : 'learning',
        });
      }
    }

    return { updated: wordResults.length };
  }

  // ── 7. O'QUVCHI O'ZI SO'Z QO'SHADI ───────────────────────────────────────
  //
  // Cheksiz so'z qo'shish mumkin (limit yo'q).
  // Faqat duplicate tekshiruvi: o'zi qo'shgan so'zlar ichida xuddi shu so'z bormi?
  //
  async addSelfWord(studentId, wordData) {
    const { word, translation, language = 'EN' } = wordData;

    if (!word || !word.trim()) {
      throw new AppError("So'z bo'sh bo'lmasligi kerak", 400);
    }

    const wordLower = word.trim().toLowerCase();

    // Duplicate tekshiruvi — faqat 'self' manbali so'zlar ichida
    const duplicate = await PersonalWord.findOne({
      student: studentId,
      source:  'self',
      word:    { $regex: new RegExp(`^${wordLower}$`, 'i') },
    });

    if (duplicate) {
      throw new ConflictError(`"${word}" so'zi allaqachon shaxsiy lug'atingizda mavjud`);
    }

    const newWord = await PersonalWord.create({
      student:          studentId,
      word:             word.trim(),
      translation:      translation?.trim() || '',
      language,
      source:           'self',
      vocabularyId:     null,
      vocabularyItemId: null,
      stage:            0,
      consecutiveCorrect: 0,
      totalReviews:     0,
      totalCorrect:     0,
      nextReviewAt:     new Date(),
      lastReviewedAt:   null,
      status:           'new',
    });

    return { word: newWord };
  }

  // ── 8. O'quvchi o'zi qo'shgan so'zni o'chiradi ───────────────────────────
  async deleteSelfWord(studentId, wordId) {
    const word = await PersonalWord.findOne({
      _id:     wordId,
      student: studentId,
      source:  'self',      // faqat o'zi qo'shganlarini o'chira oladi
    });

    if (!word) {
      throw new AppError(
        "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni o'chira olasiz",
        404
      );
    }

    await word.deleteOne();
    return { success: true };
  }

  // ── 9. O'quvchi o'zi qo'shgan so'zni tahrirlaydi ─────────────────────────
  //
  // Ustoz vocabulary ni o'zgartirganday — faqat source: 'self' bo'lgan
  // so'zlardagina ruxsat beriladi.
  //
  // O'zgartirilishi mumkin bo'lgan fieldlar:
  //   word        — so'zning o'zi
  //   translation — tarjimasi
  //   language    — tili (EN/UZ)
  //
  // SM-2 progress (stage, status, nextReviewAt va h.k.) o'zgartirilmaydi —
  // o'rganish jarayoniga ta'sir qilmasin deb.
  //
  async updateSelfWord(studentId, wordId, updateData) {
    const word = await PersonalWord.findOne({
      _id:     wordId,
      student: studentId,
      source:  'self',   // faqat o'zi qo'shgan so'zlarni tahrirlashi mumkin
    });

    if (!word) {
      throw new AppError(
        "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni tahrirlaya olasiz",
        404
      );
    }

    const { word: newWord, translation, language } = updateData;

    // Duplicate tekshiruvi — so'zni o'zgartirmoqchi bo'lsa, o'sha so'z boshqasida bormi?
    if (newWord && newWord.trim().toLowerCase() !== word.word.toLowerCase()) {
      const duplicate = await PersonalWord.findOne({
        student: studentId,
        source:  'self',
        word:    { $regex: new RegExp(`^${newWord.trim()}$`, 'i') },
        _id:     { $ne: wordId },  // o'zini hisobga olmaydi
      });

      if (duplicate) {
        throw new AppError(
          `"${newWord.trim()}" so'zi allaqachon shaxsiy lug'atingizda mavjud`,
          409
        );
      }

      word.word = newWord.trim();
    }

    if (translation !== undefined) word.translation = translation?.trim() ?? '';
    if (language)                  word.language    = language;

    await word.save();

    return { word };
  }

  // ── 10. SM-2 review — o'quvchi javob berdi ───────────────────────────────
  //
  // reviews = [{ wordId, isCorrect }]
  // wordId = PersonalWord._id (universal — barcha source uchun ishlaydi)
  //
  async submitReview(studentId, reviews) {
    if (!reviews || reviews.length === 0) {
      throw new AppError("reviews massivi bo'sh", 400);
    }

    const wordIds = reviews.map((r) => r.wordId);

    // Barcha so'zlarni bitta so'rovda olamiz
    const words = await PersonalWord.find({
      _id:     { $in: wordIds },
      student: studentId,
    });

    if (words.length === 0) throw new NotFoundError('PersonalWord');

    const wordMap = new Map(words.map((w) => [w._id.toString(), w]));
    const results = [];

    for (const review of reviews) {
      const word = wordMap.get(review.wordId.toString());
      if (!word) continue;

      const updates = computeNextState(word, review.isCorrect);
      Object.assign(word, updates);
      await word.save();   // individual save — har bir so'z alohida

      results.push({
        wordId:       word._id,
        word:         word.word,
        isCorrect:    review.isCorrect,
        newStage:     updates.stage,
        newStatus:    updates.status,
        nextReviewAt: updates.nextReviewAt,
      });
    }

    return {
      reviewed: results.length,
      results,
    };
  }

  // ── 10. Guruh o'quvchilari statistikasi (o'qituvchi uchun) ───────────────
  async getGroupStats(studentIds) {
    const stats = await Promise.all(
      studentIds.map(async (id) => ({
        studentId: id,
        stats: await computeDbStats(id),
      }))
    );
    return stats;
  }

  // ── 11. Admin: o'quvchi barcha so'zlarini o'chirish ──────────────────────
  async resetStudentWords(studentId) {
    const result = await PersonalWord.deleteMany({ student: studentId });
    return { success: true, deletedCount: result.deletedCount };
  }
}

module.exports = new PersonalWordService();

// const PersonalWord = require('../models/Personalword.model');
// const Vocabulary    = require('../models/Vocabulary');
// const mongoose      = require('mongoose');
// const { NotFoundError, AppError, ConflictError } = require('../utils/AppError');
// const { computeNextState, computeStats: _computeStats } = require('../utils/sm2');
// const { buildPaginationMeta } = require('../utils/response');
// const { parsePagination } = require('../utils/pagination');

// // SM-2 ga qo'shimcha: DB dan stats hisoblash
// async function computeDbStats(studentId) {
//   const now = new Date();
//   const sid = new mongoose.Types.ObjectId(studentId);

//   const [totals, dueCount] = await Promise.all([
//     PersonalWord.aggregate([
//       { $match: { student: sid } },
//       { $group: { _id: '$status', count: { $sum: 1 } } },
//     ]),
//     PersonalWord.countDocuments({
//       student: sid,
//       status: { $ne: 'mastered' },
//       nextReviewAt: { $lte: now },
//     }),
//   ]);

//   const statsMap = { new: 0, learning: 0, review: 0, mastered: 0 };
//   let total = 0;
//   for (const row of totals) {
//     statsMap[row._id] = row.count;
//     total += row.count;
//   }

//   return {
//     total,
//     newWords:  statsMap.new,
//     learning:  statsMap.learning,
//     review:    statsMap.review,
//     mastered:  statsMap.mastered,
//     dueToday:  dueCount,
//   };
// }

// class PersonalWordService {

//   // ── 1. Bugungi takrorlash uchun so'zlar ───────────────────────────────────
//   //
//   // Server yuki: MongoDB o'zi filter + limit qiladi.
//   // JS ga faqat max 50 ta so'z tortiladi.
//   //
//   async getDueWords(studentId) {
//     const now = new Date();

//     const words = await PersonalWord.find({
//       student: studentId,
//       status: { $ne: 'mastered' },
//       nextReviewAt: { $lte: now },
//     })
//       .limit(50)
//       .lean();

//     // Aralashtirib yuborish
//     const shuffled = words.sort(() => Math.random() - 0.5);

//     return {
//       words: shuffled,
//       count: shuffled.length,
//     };
//   }

//   // ── 2. Statistika ─────────────────────────────────────────────────────────
//   async getStats(studentId) {
//     return computeDbStats(studentId);
//   }

//   // ── 3. Barcha so'zlar — pagination bilan ──────────────────────────────────
//   //
//   // source, status bo'yicha filter.
//   // MongoDB o'zi skip/limit qiladi — butun collection tortilmaydi.
//   //
//   async getAllWords(studentId, query = {}) {
//     const { page, limit, skip } = parsePagination(query);
//     const { status, source } = query;

//     const filter = { student: studentId };
//     if (status) filter.status = status;
//     if (source) filter.source = source;

//     const [words, total] = await Promise.all([
//       PersonalWord.find(filter)
//         .sort({ nextReviewAt: 1 })
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//       PersonalWord.countDocuments(filter),
//     ]);

//     return {
//       words,
//       meta: buildPaginationMeta(total, page, limit),
//     };
//   }

//   // ── 4. O'quvchining TO'LIQ lug'at xazinasi ───────────────────────────────
//   //
//   // Barcha manbadan so'zlar, bittada, pagination bilan.
//   // source + status filter optional.
//   // Summary (har bir manbadan qancha so'z) ham qaytariladi.
//   //
//   async getMyVocabulary(studentId, query = {}) {
//     const { page, limit, skip } = parsePagination(query);
//     const { status, source } = query;

//     const filter = { student: studentId };
//     if (status) filter.status = status;
//     if (source) filter.source = source;

//     const [words, total, summary] = await Promise.all([
//       PersonalWord.find(filter)
//         .sort({ nextReviewAt: 1 })
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//       PersonalWord.countDocuments(filter),
//       // Har bir source dan nechta so'z borligini hisoblash
//       PersonalWord.aggregate([
//         { $match: { student: new mongoose.Types.ObjectId(studentId) } },
//         { $group: { _id: '$source', count: { $sum: 1 } } },
//       ]),
//     ]);

//     const summaryMap = { teacher: 0, self: 0, vocabcheck: 0 };
//     for (const row of summary) {
//       if (summaryMap[row._id] !== undefined) {
//         summaryMap[row._id] = row.count;
//       }
//     }

//     return {
//       words,
//       meta: buildPaginationMeta(total, page, limit),
//       summary: {
//         ...summaryMap,
//         total: summaryMap.teacher + summaryMap.self + summaryMap.vocabcheck,
//       },
//     };
//   }

//   // ── 5. Ustoz lug'atidan so'zlarni qo'shish ────────────────────────────────
//   //
//   // Homework berilganda chaqiriladi.
//   // Allaqachon mavjud so'zlar o'tkazib yuboriladi (vocabularyItemId unique index).
//   //
//   async addWordsFromVocabulary(studentId, vocabularyId) {
//     const vocab = await Vocabulary.findOne({ _id: vocabularyId, isDeleted: false }).lean();
//     if (!vocab) throw new NotFoundError('Vocabulary');

//     // Allaqachon qo'shilgan vocabularyItemId lar
//     const existingIds = await PersonalWord.distinct('vocabularyItemId', {
//       student: studentId,
//       vocabularyItemId: { $in: vocab.items.map((i) => i._id) },
//     });

//     const existingSet = new Set(existingIds.map((id) => id.toString()));

//     const newDocs = vocab.items
//       .filter((item) => !existingSet.has(item._id.toString()))
//       .map((item) => ({
//         student:          studentId,
//         word:             item.word,
//         translation:      item.translation || item.autoTranslation || '',
//         language:         item.language,
//         source:           'teacher',
//         vocabularyId:     vocab._id,
//         vocabularyItemId: item._id,
//         stage:            0,
//         consecutiveCorrect: 0,
//         totalReviews:     0,
//         totalCorrect:     0,
//         nextReviewAt:     new Date(),
//         lastReviewedAt:   null,
//         status:           'new',
//       }));

//     if (newDocs.length === 0) {
//       return { addedCount: 0 };
//     }

//     // insertMany — tezkor, bitta DB so'rovi
//     // ordered: false — agar birortasi xato bo'lsa qolganlarni davom ettiradi
//     await PersonalWord.insertMany(newDocs, { ordered: false });

//     return { addedCount: newDocs.length };
//   }

//   // ── 6. VocabCheck natijalaridan so'z qo'shish/yangilash ──────────────────
//   async addFromVocabCheckResult(studentId, wordResults) {
//     for (const result of wordResults) {
//       const existing = await PersonalWord.findOne({
//         student: studentId,
//         vocabularyItemId: result.vocabularyItemId,
//       });

//       if (existing) {
//         // Mavjud so'zni SM-2 bilan yangilash
//         const updates = computeNextState(existing, result.isCorrect);
//         Object.assign(existing, updates);
//         await existing.save();
//       } else {
//         // Yangi so'z qo'shish
//         const initialStage = result.isCorrect ? 1 : 0;
//         const nextReview = new Date(
//           Date.now() + (result.isCorrect ? 24 * 60 * 60 * 1000 : 0)
//         );
//         await PersonalWord.create({
//           student:          studentId,
//           word:             result.word,
//           translation:      result.translation || '',
//           language:         result.language || 'EN',
//           source:           'vocabcheck',
//           vocabularyId:     result.vocabularyId || null,
//           vocabularyItemId: result.vocabularyItemId,
//           stage:            initialStage,
//           consecutiveCorrect: result.isCorrect ? 1 : 0,
//           totalReviews:     1,
//           totalCorrect:     result.isCorrect ? 1 : 0,
//           nextReviewAt:     nextReview,
//           lastReviewedAt:   new Date(),
//           status:           initialStage === 0 ? 'new' : 'learning',
//         });
//       }
//     }

//     return { updated: wordResults.length };
//   }

//   // ── 7. O'QUVCHI O'ZI SO'Z QO'SHADI ───────────────────────────────────────
//   //
//   // Cheksiz so'z qo'shish mumkin (limit yo'q).
//   // Faqat duplicate tekshiruvi: o'zi qo'shgan so'zlar ichida xuddi shu so'z bormi?
//   //
//   async addSelfWord(studentId, wordData) {
//     const { word, translation, language = 'EN' } = wordData;

//     if (!word || !word.trim()) {
//       throw new AppError("So'z bo'sh bo'lmasligi kerak", 400);
//     }

//     const wordLower = word.trim().toLowerCase();

//     // Duplicate tekshiruvi — faqat 'self' manbali so'zlar ichida
//     const duplicate = await PersonalWord.findOne({
//       student: studentId,
//       source:  'self',
//       word:    { $regex: new RegExp(`^${wordLower}$`, 'i') },
//     });

//     if (duplicate) {
//       throw new ConflictError(`"${word}" so'zi allaqachon shaxsiy lug'atingizda mavjud`);
//     }

//     const newWord = await PersonalWord.create({
//       student:          studentId,
//       word:             word.trim(),
//       translation:      translation?.trim() || '',
//       language,
//       source:           'self',
//       vocabularyId:     null,
//       vocabularyItemId: null,
//       stage:            0,
//       consecutiveCorrect: 0,
//       totalReviews:     0,
//       totalCorrect:     0,
//       nextReviewAt:     new Date(),
//       lastReviewedAt:   null,
//       status:           'new',
//     });

//     return { word: newWord };
//   }

//   // ── 8. O'quvchi o'zi qo'shgan so'zni o'chiradi ───────────────────────────
//   async deleteSelfWord(studentId, wordId) {
//     const word = await PersonalWord.findOne({
//       _id:     wordId,
//       student: studentId,
//       source:  'self',      // faqat o'zi qo'shganlarini o'chira oladi
//     });

//     if (!word) {
//       throw new AppError(
//         "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni o'chira olasiz",
//         404
//       );
//     }

//     await word.deleteOne();
//     return { success: true };
//   }

//   // ── 9. SM-2 review — o'quvchi javob berdi ────────────────────────────────
//   //
//   // reviews = [{ wordId, isCorrect }]
//   // wordId = PersonalWord._id (universal — barcha source uchun ishlaydi)
//   //
//   async submitReview(studentId, reviews) {
//     if (!reviews || reviews.length === 0) {
//       throw new AppError("reviews massivi bo'sh", 400);
//     }

//     const wordIds = reviews.map((r) => r.wordId);

//     // Barcha so'zlarni bitta so'rovda olamiz
//     const words = await PersonalWord.find({
//       _id:     { $in: wordIds },
//       student: studentId,
//     });

//     if (words.length === 0) throw new NotFoundError('PersonalWord');

//     const wordMap = new Map(words.map((w) => [w._id.toString(), w]));
//     const results = [];

//     for (const review of reviews) {
//       const word = wordMap.get(review.wordId.toString());
//       if (!word) continue;

//       const updates = computeNextState(word, review.isCorrect);
//       Object.assign(word, updates);
//       await word.save();   // individual save — har bir so'z alohida

//       results.push({
//         wordId:       word._id,
//         word:         word.word,
//         isCorrect:    review.isCorrect,
//         newStage:     updates.stage,
//         newStatus:    updates.status,
//         nextReviewAt: updates.nextReviewAt,
//       });
//     }

//     return {
//       reviewed: results.length,
//       results,
//     };
//   }

//   // ── 10. Guruh o'quvchilari statistikasi (o'qituvchi uchun) ───────────────
//   async getGroupStats(studentIds) {
//     const stats = await Promise.all(
//       studentIds.map(async (id) => ({
//         studentId: id,
//         stats: await computeDbStats(id),
//       }))
//     );
//     return stats;
//   }

//   // ── 11. Admin: o'quvchi barcha so'zlarini o'chirish ──────────────────────
//   async resetStudentWords(studentId) {
//     const result = await PersonalWord.deleteMany({ student: studentId });
//     return { success: true, deletedCount: result.deletedCount };
//   }
// }

// module.exports = new PersonalWordService();