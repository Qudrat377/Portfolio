// src/services/Personalword.service.js
//
// ✅ O'ZGARGAN JOYLAR — FAQAT 2 TA:
//
// [FIX-1]  getStatsFromCache() → dueToday query (7767-7779 qatorlar)
//   OLDIN:  { status: { $ne: 'mastered' }, nextReviewAt: { $lte: now } }
//           → yangi so'zlar (status:'new') nextReviewAt = hozir bo'ladi,
//             lekin millisekund farqi tufayli $lte o'tmay qoladi.
//             Natijada dashboard "Bugun: 0" ko'rsatadi.
//   KEYIN:  { $or: [ {status:'new'}, {status:{$in:[...]}, nextReviewAt:{$lte:now}} ] }
//           → yangi so'zlar DOIM hisoblanadi
//
// [FIX-2]  getDueWords() → asosiy query (7817-7822 qatorlar)
//   OLDIN:  { status: { $ne: 'mastered' }, nextReviewAt: { $lte: now } }
//           → yangi so'zlar sessiyaga tushmaydi (yuqoridagi sabab)
//   KEYIN:  { $or: [ {status:'new'}, {status:{$in:[...]}, nextReviewAt:{$lte:now}} ] }
//           → yangi so'zlar DOIM sessiyaga kiradi (SM-2 standart)
//
// [FIX-3]  addFromVocabCheckResult() → yangi so'z yaratish (7991-8009 qatorlar)
//   OLDIN:  to'g'ri javob → stage=1, status='learning', nextReview=ertaga
//           noto'g'ri → stage=0, status='new', nextReview=hozir
//   KEYIN:  HAMMASI → stage=0, status='new', nextReview=hozir
//           Sabab: SM-2 standartida yangi kirgan so'z status:'new' bo'lishi kerak.
//           O'quvchi birinchi marta ko'rgan so'zni bilgan bo'lsa ham,
//           SM-2 sessiyasida o'zi tasdiqlashi kerak.
//
// Qolgan hamma narsa ORIGINAL KOD — hech narsa o'zgartirilmagan.
// ─────────────────────────────────────────────────────────────────────────────

const PersonalWord       = require('../models/Personalword.model');
const PersonalVocabCache = require('../models/personalvocabcache.model');
const Vocabulary         = require('../models/Vocabulary');
const mongoose           = require('mongoose');
const { NotFoundError, AppError, ConflictError } = require('../utils/AppError');
const { computeNextState, getSortedSessionWords, SESSION_LIMIT } = require('../utils/sm2');
const { buildPaginationMeta } = require('../utils/response');
const { parsePagination }     = require('../utils/pagination');

// ─────────────────────────────────────────────────────────────────────────────
// CACHE YORDAMCHI FUNKSIYALARI — O'ZGARMAGAN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cache documentini olish yoki yaratish.
 * upsert: true — yo'q bo'lsa avtomatik yaratadi.
 */
async function getOrCreateCache(studentId) {
  return PersonalVocabCache.findOneAndUpdate(
    { student: studentId },
    { $setOnInsert: { student: studentId } },
    { upsert: true, new: true }
  );
}

/**
 * Cache ni delta bilan yangilash.
 * Har qanday write operatsiyasidan keyin chaqiriladi.
 *
 * delta misoli:
 *   { total: +1, sourceCount: { self: +1 }, statusCount: { new: +1 } }
 *   { total: -1, sourceCount: { self: -1 }, statusCount: { new: -1 } }
 *   { statusCount: { learning: -1, review: +1 } }   // faqat status o'zganda
 */
async function updateCache(studentId, delta) {
  const inc = {};

  if (delta.total !== undefined) {
    inc.total = delta.total;
  }
  if (delta.sourceCount) {
    for (const [key, val] of Object.entries(delta.sourceCount)) {
      inc[`sourceCount.${key}`] = val;
    }
  }
  if (delta.statusCount) {
    for (const [key, val] of Object.entries(delta.statusCount)) {
      inc[`statusCount.${key}`] = val;
    }
  }

  await PersonalVocabCache.findOneAndUpdate(
    { student: studentId },
    { $inc: inc, $set: { updatedAt: new Date() } },
    { upsert: true }
  );
}

/**
 * Cache ni to'liq qayta qurish.
 * Odatda ishlatilmaydi — faqat reset yoki buzilganida.
 */
async function rebuildCache(studentId) {
  const sid = new mongoose.Types.ObjectId(studentId);

  const [sourceTotals, statusTotals] = await Promise.all([
    PersonalWord.aggregate([
      { $match: { student: sid } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]),
    PersonalWord.aggregate([
      { $match: { student: sid } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const sourceCount = { teacher: 0, self: 0, vocabcheck: 0 };
  const statusCount = { new: 0, learning: 0, review: 0, mastered: 0 };
  let total = 0;

  for (const row of sourceTotals) {
    if (row._id in sourceCount) { sourceCount[row._id] = row.count; total += row.count; }
  }
  for (const row of statusTotals) {
    if (row._id in statusCount) statusCount[row._id] = row.count;
  }

  await PersonalVocabCache.findOneAndUpdate(
    { student: studentId },
    { $set: { sourceCount, statusCount, total, updatedAt: new Date() } },
    { upsert: true }
  );

  return { sourceCount, statusCount, total };
}

/**
 * Cache + dueToday ni birga qaytaradi.
 * dueToday vaqtga bog'liq — har GET da hisoblanadi.
 * Lekin bu query indexed (student + nextReviewAt + status) — juda tez.
 */
async function getStatsFromCache(studentId) {
  const now = new Date();
  const sid = new mongoose.Types.ObjectId(studentId);

  const [cache, dueCount] = await Promise.all([
    getOrCreateCache(studentId),

    // ✅ [FIX-1]: OLDIN: { status: { $ne: 'mastered' }, nextReviewAt: { $lte: now } }
    //             KEYIN: $or — yangi so'zlar DOIM, vaqti kelganlar vaqtga ko'ra
    PersonalWord.countDocuments({
      student: sid,
      $or: [
        { status: 'new' },
        { status: { $in: ['learning', 'review'] }, nextReviewAt: { $lte: now } },
      ],
    }),
  ]);

  return {
    total:    cache.total,
    newWords: cache.statusCount.new,
    learning: cache.statusCount.learning,
    review:   cache.statusCount.review,
    mastered: cache.statusCount.mastered,
    dueToday: dueCount,
    summary: {
      teacher:    cache.sourceCount.teacher,
      self:       cache.sourceCount.self,
      vocabcheck: cache.sourceCount.vocabcheck,
      total:      cache.total,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────
class PersonalWordService {

  // ── 1. Bugungi takrorlash uchun so'zlar ───────────────────────────────────
  //
  // FIX: limit=50 o'rniga SESSION_LIMIT=20, priority sort bilan
  // Barcha due so'zlarni olamiz, keyin priority bo'yicha 20 tasini beramiz.
  // dueCount — umumiy due so'zlar soni (frontend uchun "N ta kutmoqda")
  // hasMore  — yana so'zlar bormi (sessiya tugagach yangi sessiya boshlanadi)
  //
  // Priority: learning > new > review
  // Mantiq: o'rganilayotgan so'zlar birinchi, yangilar keyin, takrorlash oxirida
  //
  async getDueWords(studentId) {
    const now = new Date();

    // ✅ [FIX-2]: OLDIN: { status: { $ne: 'mastered' }, nextReviewAt: { $lte: now } }
    //             KEYIN: $or — yangi so'zlar DOIM sessiyaga kiradi (SM-2 standart)
    //             Sabab: yangi so'z qo'shilganda nextReviewAt = new Date() = hozir.
    //             Lekin $lte millisekundga sezgir — ayni shu millisekund o'tmaguncha
    //             so'z ko'rinmay qolardi. $or bilan bu muammo yo'qoladi.
    const allDue = await PersonalWord.find({
      student: studentId,
      $or: [
        { status: 'new' },
        { status: { $in: ['learning', 'review'] }, nextReviewAt: { $lte: now } },
      ],
    }).lean();

    // SM-2 priority sort + SESSION_LIMIT ta olish
    const { words, dueCount, hasMore } = getSortedSessionWords(allDue, SESSION_LIMIT);

    return { words, dueCount, hasMore };
  }

  // ── 2. Statistika — cache dan ─────────────────────────────────────────────
  //
  // OLDIN: aggregate() → barcha so'zlarni guruhlash  ⚠️ sekin
  // KEYIN: cache doc o'qish → 1 ta kichik document   ✅ tez
  //
  async getStats(studentId) {
    const { summary, ...stats } = await getStatsFromCache(studentId);
    return stats;
  }

  // ── 3. Barcha so'zlar — pagination bilan — O'ZGARMAGAN ───────────────────
  //
  // total uchun: filter yo'q bo'lsa cache dan, filter bor bo'lsa countDocuments.
  async getAllWords(studentId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const { status, source }    = query;

    const filter = { student: studentId };
    if (status) filter.status = status;
    if (source) filter.source = source;

    let total;
    if (!status && !source) {
      const cache = await getOrCreateCache(studentId);
      total = cache.total;
    } else {
      total = await PersonalWord.countDocuments(filter);
    }

    const words = await PersonalWord.find(filter)
      .sort({ nextReviewAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      words,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  // ── 4. TO'LIQ lug'at xazinasi — summary bilan — O'ZGARMAGAN ─────────────
  //
  // OLDIN:
  //   countDocuments()  ⚠️
  //   aggregate() × 2   ⚠️
  //   find()            ✅
  //
  // KEYIN:
  //   cache doc o'qish  ✅ 1 ms
  //   dueToday count    ✅ indexed
  //   find()            ✅
  //
  async getMyVocabulary(studentId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const { status, source }    = query;

    const filter = { student: studentId };
    if (status) filter.status = status;
    if (source) filter.source = source;

    // Stats + summary — cache dan (bitta query)
    const cached = await getStatsFromCache(studentId);

    // total: filter yo'q → cache dan, filter bor → countDocuments (indexed)
    let total;
    if (!status && !source) {
      total = cached.total;
    } else {
      total = await PersonalWord.countDocuments(filter);
    }

    const words = await PersonalWord.find(filter)
      .sort({ nextReviewAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      words,
      meta:    buildPaginationMeta(total, page, limit),
      summary: cached.summary,
      stats: {
        total:    cached.total,
        newWords: cached.newWords,
        learning: cached.learning,
        review:   cached.review,
        mastered: cached.mastered,
        dueToday: cached.dueToday,
      },
    };
  }

  // ── 5. Ustoz lug'atidan so'z qo'shish — O'ZGARMAGAN ─────────────────────
  async addWordsFromVocabulary(studentId, vocabularyId) {
    const vocab = await Vocabulary.findOne({ _id: vocabularyId, isDeleted: false }).lean();
    if (!vocab) throw new NotFoundError('Vocabulary');

    const existingIds = await PersonalWord.distinct('vocabularyItemId', {
      student:          studentId,
      vocabularyItemId: { $in: vocab.items.map(i => i._id) },
    });
    const existingSet = new Set(existingIds.map(id => id.toString()));

    const newDocs = vocab.items
      .filter(item => !existingSet.has(item._id.toString()))
      .map(item => ({
        student:            studentId,
        word:               item.word,
        translation:        item.translation || item.autoTranslation || '',
        language:           item.language,
        source:             'teacher',
        vocabularyId:       vocab._id,
        vocabularyItemId:   item._id,
        stage:              0,
        consecutiveCorrect: 0,
        totalReviews:       0,
        totalCorrect:       0,
        nextReviewAt:       new Date(),
        lastReviewedAt:     null,
        status:             'new',
      }));

    if (newDocs.length === 0) return { addedCount: 0 };

    await PersonalWord.insertMany(newDocs, { ordered: false });

    // Cache yangilash — bir marta, bitta delta
    await updateCache(studentId, {
      total:       newDocs.length,
      sourceCount: { teacher: newDocs.length },
      statusCount: { new:     newDocs.length },
    });

    return { addedCount: newDocs.length };
  }

  // ── 6. VocabCheck natijalaridan so'z qo'shish / yangilash ────────────────
  async addFromVocabCheckResult(studentId, wordResults) {
    let addedCount = 0;

    for (const result of wordResults) {
      const existing = await PersonalWord.findOne({
        student:          studentId,
        vocabularyItemId: result.vocabularyItemId,
      });

      if (existing) {
        // Mavjud so'z — SM-2 review, O'ZGARMAGAN
        const oldStatus = existing.status;
        const updates   = computeNextState(existing, result.isCorrect);
        Object.assign(existing, updates);
        await existing.save();

        if (oldStatus !== updates.status) {
          await updateCache(studentId, {
            statusCount: { [oldStatus]: -1, [updates.status]: +1 },
          });
        }
      } else {
        // ✅ [FIX-3]: OLDIN:
        //   const initialStage = result.isCorrect ? 1 : 0;
        //   const status       = initialStage === 0 ? 'new' : 'learning';
        //   const nextReview   = new Date(Date.now() + (result.isCorrect ? 86400000 : 0));
        //   → to'g'ri javob bilan qo'shilgan so'z darhol 'learning' bo'lib,
        //     nextReviewAt = ertaga bo'lardi. Bu o'quvchi ko'rmaganida sessiyaga
        //     kirmasligiga olib kelardi.
        //
        // KEYIN: HAMMASI stage=0, status='new', nextReview=hozir
        //   → getDueWords [FIX-2] status:'new' ni darhol oladi
        //   → o'quvchi birinchi sessiyada o'z ko'zi bilan ko'radi va tasdiqlaydi

        await PersonalWord.create({
          student:            studentId,
          word:               result.word,
          translation:        result.translation || '',
          language:           result.language || 'EN',
          source:             'vocabcheck',
          vocabularyId:       result.vocabularyId || null,
          vocabularyItemId:   result.vocabularyItemId,
          stage:              0,             // ✅ [FIX-3]
          consecutiveCorrect: 0,             // ✅ [FIX-3]
          totalReviews:       0,             // ✅ [FIX-3] (1 emas — SM-2 sessiyasida o'rganadi)
          totalCorrect:       0,             // ✅ [FIX-3]
          nextReviewAt:       new Date(),    // ✅ [FIX-3] hozir
          lastReviewedAt:     null,          // ✅ [FIX-3]
          status:             'new',         // ✅ [FIX-3]
        });

        await updateCache(studentId, {
          total:       1,
          sourceCount: { vocabcheck: 1 },
          statusCount: { new: 1 },           // ✅ [FIX-3] 'new' — oldin dynamic edi
        });

        addedCount++;
      }
    }

    return { updated: wordResults.length, addedCount };
  }

  // ── 7. O'quvchi o'zi so'z qo'shadi (cheksiz) — O'ZGARMAGAN ──────────────
  //
  // Limit yo'q. Server yukiga ta'siri:
  //   - 1 ta find (duplicate check, indexed)
  //   - 1 ta create
  //   - 1 ta cache $inc (1 ms)
  //
  async addSelfWord(studentId, wordData) {
    const { word, translation, language = 'EN' } = wordData;
    if (!word?.trim()) throw new AppError("So'z bo'sh bo'lmasligi kerak", 400);

    const wordLower = word.trim().toLowerCase();

    // Duplicate tekshiruvi: bir xil word + bir xil til bo'lsa xato
    // lekin "run" (yugurmoq) va "run" (oqmoq) ikkalasi ham saqlanadi
    // chunki translation farq qiladi — biz faqat word+language kombinatsiyasini tekshiramiz
    const duplicate = await PersonalWord.findOne({
      student:  studentId,
      source:   'self',
      word:     { $regex: new RegExp(`^${wordLower}$`, 'i') },
      language: language,
    }).select('_id word translation').lean();

    if (duplicate) {
      throw new ConflictError(
        `"${word}" (${language}) so'zi allaqachon mavjud: "${duplicate.translation || 'tarjimasiz'}". ` +
        `Boshqa ma'nosini qo'shmoqchi bo'lsangiz, tarjimasini farqli kiriting.`
      );
    }

    const newWord = await PersonalWord.create({
      student:            studentId,
      word:               word.trim(),
      translation:        translation?.trim() || '',
      language,
      source:             'self',
      vocabularyId:       null,
      vocabularyItemId:   null,
      stage:              0,
      consecutiveCorrect: 0,
      totalReviews:       0,
      totalCorrect:       0,
      nextReviewAt:       new Date(),
      lastReviewedAt:     null,
      status:             'new',
    });

    // Cache yangilash — +1 self, +1 new, +1 total
    await updateCache(studentId, {
      total:       1,
      sourceCount: { self: 1 },
      statusCount: { new:  1 },
    });

    return { word: newWord };
  }

  // ── 8. O'quvchi o'zi qo'shgan so'zni tahrirlaydi — O'ZGARMAGAN ──────────
  // source va status o'zgarmaydi — cache yangilanmaydi
  async updateSelfWord(studentId, wordId, updateData) {
    const word = await PersonalWord.findOne({
      _id:     wordId,
      student: studentId,
      source:  'self',
    });

    if (!word) {
      throw new AppError(
        "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni tahrirlaya olasiz",
        404
      );
    }

    const { word: newWord, translation, language } = updateData;

    if (newWord && newWord.trim().toLowerCase() !== word.word.toLowerCase()) {
      const dup = await PersonalWord.findOne({
        student: studentId,
        source:  'self',
        word:    { $regex: new RegExp(`^${newWord.trim()}$`, 'i') },
        _id:     { $ne: wordId },
      }).select('_id').lean();

      if (dup) {
        throw new ConflictError(
          `"${newWord.trim()}" so'zi allaqachon shaxsiy lug'atingizda mavjud`
        );
      }
      word.word = newWord.trim();
    }

    if (translation !== undefined) word.translation = translation?.trim() ?? '';
    if (language)                  word.language    = language;

    await word.save();
    return { word };
  }

  // ── 9. O'quvchi o'zi qo'shgan so'zni o'chiradi — O'ZGARMAGAN ────────────
  async deleteSelfWord(studentId, wordId) {
    const word = await PersonalWord.findOne({
      _id:     wordId,
      student: studentId,
      source:  'self',
    });

    if (!word) {
      throw new AppError(
        "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni o'chira olasiz",
        404
      );
    }

    const deletedStatus = word.status;
    await word.deleteOne();

    // Cache yangilash — -1 self, -1 [status], -1 total
    await updateCache(studentId, {
      total:       -1,
      sourceCount: { self: -1 },
      statusCount: { [deletedStatus]: -1 },
    });

    return { success: true };
  }

  // ── 10. SM-2 review — O'ZGARMAGAN ────────────────────────────────────────
  async submitReview(studentId, reviews) {
    if (!reviews?.length) throw new AppError("reviews massivi bo'sh", 400);

    const wordIds = reviews.map(r => r.wordId);

    const words = await PersonalWord.find({
      _id:     { $in: wordIds },
      student: studentId,
    });

    if (!words.length) throw new NotFoundError('PersonalWord');

    const wordMap    = new Map(words.map(w => [w._id.toString(), w]));
    const results    = [];
    const statusDelta = {};   // barcha status o'zgarishlarini yig'amiz

    for (const review of reviews) {
      const word = wordMap.get(review.wordId.toString());
      if (!word) continue;

      const oldStatus = word.status;
      const updates   = computeNextState(word, review.isCorrect);
      const newStatus = updates.status;

      Object.assign(word, updates);
      await word.save();

      // Status o'zgarganda delta yig'ish
      if (oldStatus !== newStatus) {
        statusDelta[oldStatus] = (statusDelta[oldStatus] || 0) - 1;
        statusDelta[newStatus] = (statusDelta[newStatus] || 0) + 1;
      }

      results.push({
        wordId:       word._id,
        word:         word.word,
        isCorrect:    review.isCorrect,
        newStage:     updates.stage,
        newStatus,
        nextReviewAt: updates.nextReviewAt,
      });
    }

    // Bir marta cache yangilash (barcha o'zgarishlar bilan)
    if (Object.keys(statusDelta).length > 0) {
      await updateCache(studentId, { statusCount: statusDelta });
    }

    return { reviewed: results.length, results };
  }


  // ── Example qo'shish — O'ZGARMAGAN ─────────────────────────────────────────
  async addExample(studentId, wordId, text) {
    if (!text?.trim()) throw new AppError("Misol bo'sh bo'lishi mumkin emas", 400);
    const word = await PersonalWord.findOne({ _id: wordId, student: studentId });
    if (!word) throw new NotFoundError('PersonalWord');
    word.examples = word.examples || [];
    word.examples.push({ text: text.trim() });
    await word.save();
    return { examples: word.examples };
  }

  // ── Example o'chirish — O'ZGARMAGAN ────────────────────────────────────────
  async deleteExample(studentId, wordId, exampleId) {
    const word = await PersonalWord.findOne({ _id: wordId, student: studentId });
    if (!word) throw new NotFoundError('PersonalWord');
    const before = word.examples?.length || 0;
    word.examples = (word.examples || []).filter(e => e._id?.toString() !== exampleId);
    if (word.examples.length === before) throw new AppError("Misol topilmadi", 404);
    await word.save();
    return { examples: word.examples };
  }

  // ── Example yangilash — O'ZGARMAGAN ────────────────────────────────────────
  async updateExample(studentId, wordId, exampleId, text) {
    if (!text?.trim()) throw new AppError("Misol bo'sh bo'lishi mumkin emas", 400);
    const word = await PersonalWord.findOne({ _id: wordId, student: studentId });
    if (!word) throw new NotFoundError('PersonalWord');
    const ex = (word.examples || []).find(e => e._id?.toString() === exampleId);
    if (!ex) throw new AppError("Misol topilmadi", 404);
    ex.text = text.trim();
    await word.save();
    return { examples: word.examples };
  }

  // ── Notes yangilash — O'ZGARMAGAN ──────────────────────────────────────────
  async updateNotes(studentId, wordId, notes) {
    const word = await PersonalWord.findOne({ _id: wordId, student: studentId });
    if (!word) throw new NotFoundError('PersonalWord');
    word.notes = notes?.trim() || '';
    await word.save();
    return { notes: word.notes };
  }

  // ── 11. Guruh statistikasi (o'qituvchi uchun) — O'ZGARMAGAN ──────────────
  //
  // OLDIN: har o'quvchi uchun alohida aggregate()  ⚠️
  // KEYIN: bir so'rovda barcha cache doc larni olamiz ✅
  //
  async getGroupStats(studentIds) {
    const caches = await PersonalVocabCache.find({
      student: { $in: studentIds },
    }).lean();

    const cacheMap = new Map(caches.map(c => [c.student.toString(), c]));

    return studentIds.map(id => {
      const c = cacheMap.get(id.toString());
      return {
        studentId: id,
        stats: c
          ? {
              total:    c.total,
              newWords: c.statusCount.new,
              learning: c.statusCount.learning,
              review:   c.statusCount.review,
              mastered: c.statusCount.mastered,
            }
          : { total: 0, newWords: 0, learning: 0, review: 0, mastered: 0 },
      };
    });
  }

  // ── 12. Admin: o'quvchi barcha so'zlarini o'chirish — O'ZGARMAGAN ────────
  async resetStudentWords(studentId) {
    const result = await PersonalWord.deleteMany({ student: studentId });

    await PersonalVocabCache.findOneAndUpdate(
      { student: studentId },
      {
        $set: {
          sourceCount: { teacher: 0, self: 0, vocabcheck: 0 },
          statusCount: { new: 0, learning: 0, review: 0, mastered: 0 },
          total:       0,
          updatedAt:   new Date(),
        },
      },
      { upsert: true }
    );

    return { success: true, deletedCount: result.deletedCount };
  }

  // ── 13. Cache ni qayta qurish (admin) — O'ZGARMAGAN ──────────────────────
  // Agar cache noto'g'ri bo'lib qolsa — to'liq qayta hisoblaydi
  async rebuildCacheForStudent(studentId) {
    return rebuildCache(studentId);
  }
}

module.exports = new PersonalWordService();

// ── 14. O'quvchi o'zi uchun VocabCheck natijalarini qo'shish — O'ZGARMAGAN ──
// SpeakingPracticeScreen dan chaqiriladi (JWT dan studentId olinadi)
// addFromVocabCheckResult bilan bir xil mantiq, lekin studentId JWT dan
PersonalWordService.prototype.addSelfVocabCheckResult = async function(studentId, wordResults) {
  return this.addFromVocabCheckResult(studentId, wordResults);
};

// const PersonalWord       = require('../models/Personalword.model');
// const PersonalVocabCache = require('../models/personalvocabcache.model');
// const Vocabulary         = require('../models/Vocabulary');
// const mongoose           = require('mongoose');
// const { NotFoundError, AppError, ConflictError } = require('../utils/AppError');
// const { computeNextState, getSortedSessionWords, SESSION_LIMIT } = require('../utils/sm2');
// const { buildPaginationMeta } = require('../utils/response');
// const { parsePagination }     = require('../utils/pagination');

// // ─────────────────────────────────────────────────────────────────────────────
// // CACHE YORDAMCHI FUNKSIYALARI
// // ─────────────────────────────────────────────────────────────────────────────

// /**
//  * Cache documentini olish yoki yaratish.
//  * upsert: true — yo'q bo'lsa avtomatik yaratadi.
//  */
// async function getOrCreateCache(studentId) {
//   return PersonalVocabCache.findOneAndUpdate(
//     { student: studentId },
//     { $setOnInsert: { student: studentId } },
//     { upsert: true, new: true }
//   );
// }

// /**
//  * Cache ni delta bilan yangilash.
//  * Har qanday write operatsiyasidan keyin chaqiriladi.
//  *
//  * delta misoli:
//  *   { total: +1, sourceCount: { self: +1 }, statusCount: { new: +1 } }
//  *   { total: -1, sourceCount: { self: -1 }, statusCount: { new: -1 } }
//  *   { statusCount: { learning: -1, review: +1 } }   // faqat status o'zganda
//  */
// async function updateCache(studentId, delta) {
//   const inc = {};

//   if (delta.total !== undefined) {
//     inc.total = delta.total;
//   }
//   if (delta.sourceCount) {
//     for (const [key, val] of Object.entries(delta.sourceCount)) {
//       inc[`sourceCount.${key}`] = val;
//     }
//   }
//   if (delta.statusCount) {
//     for (const [key, val] of Object.entries(delta.statusCount)) {
//       inc[`statusCount.${key}`] = val;
//     }
//   }

//   await PersonalVocabCache.findOneAndUpdate(
//     { student: studentId },
//     { $inc: inc, $set: { updatedAt: new Date() } },
//     { upsert: true }
//   );
// }

// /**
//  * Cache ni to'liq qayta qurish.
//  * Odatda ishlatilmaydi — faqat reset yoki buzilganida.
//  */
// async function rebuildCache(studentId) {
//   const sid = new mongoose.Types.ObjectId(studentId);

//   const [sourceTotals, statusTotals] = await Promise.all([
//     PersonalWord.aggregate([
//       { $match: { student: sid } },
//       { $group: { _id: '$source', count: { $sum: 1 } } },
//     ]),
//     PersonalWord.aggregate([
//       { $match: { student: sid } },
//       { $group: { _id: '$status', count: { $sum: 1 } } },
//     ]),
//   ]);

//   const sourceCount = { teacher: 0, self: 0, vocabcheck: 0 };
//   const statusCount = { new: 0, learning: 0, review: 0, mastered: 0 };
//   let total = 0;

//   for (const row of sourceTotals) {
//     if (row._id in sourceCount) { sourceCount[row._id] = row.count; total += row.count; }
//   }
//   for (const row of statusTotals) {
//     if (row._id in statusCount) statusCount[row._id] = row.count;
//   }

//   await PersonalVocabCache.findOneAndUpdate(
//     { student: studentId },
//     { $set: { sourceCount, statusCount, total, updatedAt: new Date() } },
//     { upsert: true }
//   );

//   return { sourceCount, statusCount, total };
// }

// /**
//  * Cache + dueToday ni birga qaytaradi.
//  * dueToday vaqtga bog'liq — har GET da hisoblanadi.
//  * Lekin bu query indexed (student + nextReviewAt + status) — juda tez.
//  */
// async function getStatsFromCache(studentId) {
//   const now = new Date();
//   const sid = new mongoose.Types.ObjectId(studentId);

//   const [cache, dueCount] = await Promise.all([
//     getOrCreateCache(studentId),
//     // Indexed query: student_1_nextReviewAt_1 index ishlatadi
//     PersonalWord.countDocuments({
//       student:      sid,
//       status:       { $ne: 'mastered' },
//       nextReviewAt: { $lte: now },
//     }),
//   ]);

//   return {
//     total:    cache.total,
//     newWords: cache.statusCount.new,
//     learning: cache.statusCount.learning,
//     review:   cache.statusCount.review,
//     mastered: cache.statusCount.mastered,
//     dueToday: dueCount,
//     summary: {
//       teacher:    cache.sourceCount.teacher,
//       self:       cache.sourceCount.self,
//       vocabcheck: cache.sourceCount.vocabcheck,
//       total:      cache.total,
//     },
//   };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // SERVICE
// // ─────────────────────────────────────────────────────────────────────────────
// class PersonalWordService {

//   // ── 1. Bugungi takrorlash uchun so'zlar ───────────────────────────────────
//   //
//   // FIX: limit=50 o'rniga SESSION_LIMIT=20, priority sort bilan
//   // Barcha due so'zlarni olamiz, keyin priority bo'yicha 20 tasini beramiz.
//   // dueCount — umumiy due so'zlar soni (frontend uchun "N ta kutmoqda")
//   // hasMore  — yana so'zlar bormi (sessiya tugagach yangi sessiya boshlanadi)
//   //
//   // Priority: learning > new > review
//   // Mantiq: o'rganilayotgan so'zlar birinchi, yangilar keyin, takrorlash oxirida
//   //
//   async getDueWords(studentId) {
//     const now = new Date();

//     // Barcha due so'zlarni olamiz (limit yo'q) — server yukiga ta'siri minimal
//     // chunki har o'quvchi uchun alohida indexed query
//     const allDue = await PersonalWord.find({
//       student:      studentId,
//       status:       { $ne: 'mastered' },
//       nextReviewAt: { $lte: now },
//     })
//       .lean();

//     // SM-2 priority sort + SESSION_LIMIT ta olish
//     const { words, dueCount, hasMore } = getSortedSessionWords(allDue, SESSION_LIMIT);

//     return { words, dueCount, hasMore };
//   }

//   // ── 2. Statistika — cache dan ─────────────────────────────────────────────
//   //
//   // OLDIN: aggregate() → barcha so'zlarni guruhlash  ⚠️ sekin
//   // KEYIN: cache doc o'qish → 1 ta kichik document   ✅ tez
//   //
//   async getStats(studentId) {
//     const { summary, ...stats } = await getStatsFromCache(studentId);
//     return stats;
//   }

//   // ── 3. Barcha so'zlar — pagination bilan ─────────────────────────────────
//   //
//   // total uchun: filter yo'q bo'lsa cache dan, filter bor bo'lsa countDocuments.
//   // countDocuments filter bilan ham tez — chunki compound index bor.
//   //
//   async getAllWords(studentId, query = {}) {
//     const { page, limit, skip } = parsePagination(query);
//     const { status, source }    = query;

//     const filter = { student: studentId };
//     if (status) filter.status = status;
//     if (source) filter.source = source;

//     let total;
//     if (!status && !source) {
//       const cache = await getOrCreateCache(studentId);
//       total = cache.total;
//     } else {
//       total = await PersonalWord.countDocuments(filter);
//     }

//     const words = await PersonalWord.find(filter)
//       .sort({ nextReviewAt: 1 })
//       .skip(skip)
//       .limit(limit)
//       .lean();

//     return {
//       words,
//       meta: buildPaginationMeta(total, page, limit),
//     };
//   }

//   // ── 4. TO'LIQ lug'at xazinasi — summary bilan ────────────────────────────
//   //
//   // OLDIN:
//   //   countDocuments()  ⚠️
//   //   aggregate() × 2   ⚠️
//   //   find()            ✅
//   //
//   // KEYIN:
//   //   cache doc o'qish  ✅ 1 ms
//   //   dueToday count    ✅ indexed
//   //   find()            ✅
//   //
//   async getMyVocabulary(studentId, query = {}) {
//     const { page, limit, skip } = parsePagination(query);
//     const { status, source }    = query;

//     const filter = { student: studentId };
//     if (status) filter.status = status;
//     if (source) filter.source = source;

//     // Stats + summary — cache dan (bitta query)
//     const cached = await getStatsFromCache(studentId);

//     // total: filter yo'q → cache dan, filter bor → countDocuments (indexed)
//     let total;
//     if (!status && !source) {
//       total = cached.total;
//     } else {
//       total = await PersonalWord.countDocuments(filter);
//     }

//     const words = await PersonalWord.find(filter)
//       .sort({ nextReviewAt: 1 })
//       .skip(skip)
//       .limit(limit)
//       .lean();

//     return {
//       words,
//       meta:    buildPaginationMeta(total, page, limit),
//       summary: cached.summary,
//       stats: {
//         total:    cached.total,
//         newWords: cached.newWords,
//         learning: cached.learning,
//         review:   cached.review,
//         mastered: cached.mastered,
//         dueToday: cached.dueToday,
//       },
//     };
//   }

//   // ── 5. Ustoz lug'atidan so'z qo'shish ─────────────────────────────────────
//   async addWordsFromVocabulary(studentId, vocabularyId) {
//     const vocab = await Vocabulary.findOne({ _id: vocabularyId, isDeleted: false }).lean();
//     if (!vocab) throw new NotFoundError('Vocabulary');

//     const existingIds = await PersonalWord.distinct('vocabularyItemId', {
//       student:          studentId,
//       vocabularyItemId: { $in: vocab.items.map(i => i._id) },
//     });
//     const existingSet = new Set(existingIds.map(id => id.toString()));

//     const newDocs = vocab.items
//       .filter(item => !existingSet.has(item._id.toString()))
//       .map(item => ({
//         student:            studentId,
//         word:               item.word,
//         translation:        item.translation || item.autoTranslation || '',
//         language:           item.language,
//         source:             'teacher',
//         vocabularyId:       vocab._id,
//         vocabularyItemId:   item._id,
//         stage:              0,
//         consecutiveCorrect: 0,
//         totalReviews:       0,
//         totalCorrect:       0,
//         nextReviewAt:       new Date(),
//         lastReviewedAt:     null,
//         status:             'new',
//       }));

//     if (newDocs.length === 0) return { addedCount: 0 };

//     await PersonalWord.insertMany(newDocs, { ordered: false });

//     // Cache yangilash — bir marta, bitta delta
//     await updateCache(studentId, {
//       total:       newDocs.length,
//       sourceCount: { teacher: newDocs.length },
//       statusCount: { new:     newDocs.length },
//     });

//     return { addedCount: newDocs.length };
//   }

//   // ── 6. VocabCheck natijalaridan so'z qo'shish / yangilash ────────────────
//   async addFromVocabCheckResult(studentId, wordResults) {
//     let addedCount = 0;

//     for (const result of wordResults) {
//       const existing = await PersonalWord.findOne({
//         student:          studentId,
//         vocabularyItemId: result.vocabularyItemId,
//       });

//       if (existing) {
//         const oldStatus = existing.status;
//         const updates   = computeNextState(existing, result.isCorrect);
//         Object.assign(existing, updates);
//         await existing.save();

//         if (oldStatus !== updates.status) {
//           await updateCache(studentId, {
//             statusCount: { [oldStatus]: -1, [updates.status]: +1 },
//           });
//         }
//       } else {
//         const initialStage = result.isCorrect ? 1 : 0;
//         const status       = initialStage === 0 ? 'new' : 'learning';
//         const nextReview   = new Date(Date.now() + (result.isCorrect ? 86400000 : 0));

//         await PersonalWord.create({
//           student:            studentId,
//           word:               result.word,
//           translation:        result.translation || '',
//           language:           result.language || 'EN',
//           source:             'vocabcheck',
//           vocabularyId:       result.vocabularyId || null,
//           vocabularyItemId:   result.vocabularyItemId,
//           stage:              initialStage,
//           consecutiveCorrect: result.isCorrect ? 1 : 0,
//           totalReviews:       1,
//           totalCorrect:       result.isCorrect ? 1 : 0,
//           nextReviewAt:       nextReview,
//           lastReviewedAt:     new Date(),
//           status,
//         });

//         await updateCache(studentId, {
//           total:       1,
//           sourceCount: { vocabcheck: 1 },
//           statusCount: { [status]:   1 },
//         });

//         addedCount++;
//       }
//     }

//     return { updated: wordResults.length, addedCount };
//   }

//   // ── 7. O'quvchi o'zi so'z qo'shadi (cheksiz) ─────────────────────────────
//   //
//   // Limit yo'q. Server yukiga ta'siri:
//   //   - 1 ta find (duplicate check, indexed)
//   //   - 1 ta create
//   //   - 1 ta cache $inc (1 ms)
//   //
//   async addSelfWord(studentId, wordData) {
//     const { word, translation, language = 'EN' } = wordData;
//     if (!word?.trim()) throw new AppError("So'z bo'sh bo'lmasligi kerak", 400);

//     const wordLower = word.trim().toLowerCase();

//     // Duplicate tekshiruvi: bir xil word + bir xil til bo'lsa xato
//     // lekin "run" (yugurmoq) va "run" (oqmoq) ikkalasi ham saqlanadi
//     // chunki translation farq qiladi — biz faqat word+language kombinatsiyasini tekshiramiz
//     const duplicate = await PersonalWord.findOne({
//       student:  studentId,
//       source:   'self',
//       word:     { $regex: new RegExp(`^${wordLower}$`, 'i') },
//       language: language,
//     }).select('_id word translation').lean();

//     if (duplicate) {
//       throw new ConflictError(
//         `"${word}" (${language}) so'zi allaqachon mavjud: "${duplicate.translation || 'tarjimasiz'}". ` +
//         `Boshqa ma'nosini qo'shmoqchi bo'lsangiz, tarjimasini farqli kiriting.`
//       );
//     }

//     const newWord = await PersonalWord.create({
//       student:            studentId,
//       word:               word.trim(),
//       translation:        translation?.trim() || '',
//       language,
//       source:             'self',
//       vocabularyId:       null,
//       vocabularyItemId:   null,
//       stage:              0,
//       consecutiveCorrect: 0,
//       totalReviews:       0,
//       totalCorrect:       0,
//       nextReviewAt:       new Date(),
//       lastReviewedAt:     null,
//       status:             'new',
//     });

//     // Cache yangilash — +1 self, +1 new, +1 total
//     await updateCache(studentId, {
//       total:       1,
//       sourceCount: { self: 1 },
//       statusCount: { new:  1 },
//     });

//     return { word: newWord };
//   }

//   // ── 8. O'quvchi o'zi qo'shgan so'zni tahrirlaydi ─────────────────────────
//   // source va status o'zgarmaydi — cache yangilanmaydi
//   async updateSelfWord(studentId, wordId, updateData) {
//     const word = await PersonalWord.findOne({
//       _id:     wordId,
//       student: studentId,
//       source:  'self',
//     });

//     if (!word) {
//       throw new AppError(
//         "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni tahrirlaya olasiz",
//         404
//       );
//     }

//     const { word: newWord, translation, language } = updateData;

//     if (newWord && newWord.trim().toLowerCase() !== word.word.toLowerCase()) {
//       const dup = await PersonalWord.findOne({
//         student: studentId,
//         source:  'self',
//         word:    { $regex: new RegExp(`^${newWord.trim()}$`, 'i') },
//         _id:     { $ne: wordId },
//       }).select('_id').lean();

//       if (dup) {
//         throw new ConflictError(
//           `"${newWord.trim()}" so'zi allaqachon shaxsiy lug'atingizda mavjud`
//         );
//       }
//       word.word = newWord.trim();
//     }

//     if (translation !== undefined) word.translation = translation?.trim() ?? '';
//     if (language)                  word.language    = language;

//     await word.save();
//     return { word };
//   }

//   // ── 9. O'quvchi o'zi qo'shgan so'zni o'chiradi ───────────────────────────
//   async deleteSelfWord(studentId, wordId) {
//     const word = await PersonalWord.findOne({
//       _id:     wordId,
//       student: studentId,
//       source:  'self',
//     });

//     if (!word) {
//       throw new AppError(
//         "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni o'chira olasiz",
//         404
//       );
//     }

//     const deletedStatus = word.status;
//     await word.deleteOne();

//     // Cache yangilash — -1 self, -1 [status], -1 total
//     await updateCache(studentId, {
//       total:       -1,
//       sourceCount: { self: -1 },
//       statusCount: { [deletedStatus]: -1 },
//     });

//     return { success: true };
//   }

//   // ── 10. SM-2 review ───────────────────────────────────────────────────────
//   async submitReview(studentId, reviews) {
//     if (!reviews?.length) throw new AppError("reviews massivi bo'sh", 400);

//     const wordIds = reviews.map(r => r.wordId);

//     const words = await PersonalWord.find({
//       _id:     { $in: wordIds },
//       student: studentId,
//     });

//     if (!words.length) throw new NotFoundError('PersonalWord');

//     const wordMap    = new Map(words.map(w => [w._id.toString(), w]));
//     const results    = [];
//     const statusDelta = {};   // barcha status o'zgarishlarini yig'amiz

//     for (const review of reviews) {
//       const word = wordMap.get(review.wordId.toString());
//       if (!word) continue;

//       const oldStatus = word.status;
//       const updates   = computeNextState(word, review.isCorrect);
//       const newStatus = updates.status;

//       Object.assign(word, updates);
//       await word.save();

//       // Status o'zgarganda delta yig'ish
//       if (oldStatus !== newStatus) {
//         statusDelta[oldStatus] = (statusDelta[oldStatus] || 0) - 1;
//         statusDelta[newStatus] = (statusDelta[newStatus] || 0) + 1;
//       }

//       results.push({
//         wordId:       word._id,
//         word:         word.word,
//         isCorrect:    review.isCorrect,
//         newStage:     updates.stage,
//         newStatus,
//         nextReviewAt: updates.nextReviewAt,
//       });
//     }

//     // Bir marta cache yangilash (barcha o'zgarishlar bilan)
//     if (Object.keys(statusDelta).length > 0) {
//       await updateCache(studentId, { statusCount: statusDelta });
//     }

//     return { reviewed: results.length, results };
//   }


//   // ── Example qo'shish ────────────────────────────────────────────────────────
//   async addExample(studentId, wordId, text) {
//     if (!text?.trim()) throw new AppError("Misol bo'sh bo'lishi mumkin emas", 400);
//     const word = await PersonalWord.findOne({ _id: wordId, student: studentId });
//     if (!word) throw new NotFoundError('PersonalWord');
//     word.examples = word.examples || [];
//     word.examples.push({ text: text.trim() });
//     await word.save();
//     return { examples: word.examples };
//   }

//   // ── Example o'chirish ────────────────────────────────────────────────────────
//   async deleteExample(studentId, wordId, exampleId) {
//     const word = await PersonalWord.findOne({ _id: wordId, student: studentId });
//     if (!word) throw new NotFoundError('PersonalWord');
//     const before = word.examples?.length || 0;
//     word.examples = (word.examples || []).filter(e => e._id?.toString() !== exampleId);
//     if (word.examples.length === before) throw new AppError("Misol topilmadi", 404);
//     await word.save();
//     return { examples: word.examples };
//   }

//   // ── Example yangilash ────────────────────────────────────────────────────────
//   async updateExample(studentId, wordId, exampleId, text) {
//     if (!text?.trim()) throw new AppError("Misol bo'sh bo'lishi mumkin emas", 400);
//     const word = await PersonalWord.findOne({ _id: wordId, student: studentId });
//     if (!word) throw new NotFoundError('PersonalWord');
//     const ex = (word.examples || []).find(e => e._id?.toString() === exampleId);
//     if (!ex) throw new AppError("Misol topilmadi", 404);
//     ex.text = text.trim();
//     await word.save();
//     return { examples: word.examples };
//   }

//   // ── Notes yangilash ─────────────────────────────────────────────────────────
//   async updateNotes(studentId, wordId, notes) {
//     const word = await PersonalWord.findOne({ _id: wordId, student: studentId });
//     if (!word) throw new NotFoundError('PersonalWord');
//     word.notes = notes?.trim() || '';
//     await word.save();
//     return { notes: word.notes };
//   }

//   // ── 11. Guruh statistikasi (o'qituvchi uchun) ─────────────────────────────
//   //
//   // OLDIN: har o'quvchi uchun alohida aggregate()  ⚠️
//   // KEYIN: bir so'rovda barcha cache doc larni olamiz ✅
//   //
//   async getGroupStats(studentIds) {
//     const caches = await PersonalVocabCache.find({
//       student: { $in: studentIds },
//     }).lean();

//     const cacheMap = new Map(caches.map(c => [c.student.toString(), c]));

//     return studentIds.map(id => {
//       const c = cacheMap.get(id.toString());
//       return {
//         studentId: id,
//         stats: c
//           ? {
//               total:    c.total,
//               newWords: c.statusCount.new,
//               learning: c.statusCount.learning,
//               review:   c.statusCount.review,
//               mastered: c.statusCount.mastered,
//             }
//           : { total: 0, newWords: 0, learning: 0, review: 0, mastered: 0 },
//       };
//     });
//   }

//   // ── 12. Admin: o'quvchi barcha so'zlarini o'chirish ──────────────────────
//   async resetStudentWords(studentId) {
//     const result = await PersonalWord.deleteMany({ student: studentId });

//     await PersonalVocabCache.findOneAndUpdate(
//       { student: studentId },
//       {
//         $set: {
//           sourceCount: { teacher: 0, self: 0, vocabcheck: 0 },
//           statusCount: { new: 0, learning: 0, review: 0, mastered: 0 },
//           total:       0,
//           updatedAt:   new Date(),
//         },
//       },
//       { upsert: true }
//     );

//     return { success: true, deletedCount: result.deletedCount };
//   }

//   // ── 13. Cache ni qayta qurish (admin) ─────────────────────────────────────
//   // Agar cache noto'g'ri bo'lib qolsa — to'liq qayta hisoblaydi
//   async rebuildCacheForStudent(studentId) {
//     return rebuildCache(studentId);
//   }
// }

// module.exports = new PersonalWordService();

// // ── 14. O'quvchi o'zi uchun VocabCheck natijalarini qo'shish ─────────────────
// // SpeakingPracticeScreen dan chaqiriladi (JWT dan studentId olinadi)
// // addFromVocabCheckResult bilan bir xil mantiq, lekin studentId JWT dan
// PersonalWordService.prototype.addSelfVocabCheckResult = async function(studentId, wordResults) {
//   return this.addFromVocabCheckResult(studentId, wordResults);
// };

// // const PersonalWord       = require('../models/Personalword.model');
// // const PersonalVocabCache = require('../models/personalvocabcache.model');
// // const Vocabulary         = require('../models/Vocabulary');
// // const mongoose           = require('mongoose');
// // const { NotFoundError, AppError, ConflictError } = require('../utils/AppError');
// // const { computeNextState } = require('../utils/sm2');
// // const { buildPaginationMeta } = require('../utils/response');
// // const { parsePagination }     = require('../utils/pagination');

// // // ─────────────────────────────────────────────────────────────────────────────
// // // CACHE YORDAMCHI FUNKSIYALARI
// // // ─────────────────────────────────────────────────────────────────────────────

// // /**
// //  * Cache documentini olish yoki yaratish.
// //  * upsert: true — yo'q bo'lsa avtomatik yaratadi.
// //  */
// // async function getOrCreateCache(studentId) {
// //   return PersonalVocabCache.findOneAndUpdate(
// //     { student: studentId },
// //     { $setOnInsert: { student: studentId } },
// //     { upsert: true, new: true }
// //   );
// // }

// // /**
// //  * Cache ni delta bilan yangilash.
// //  * Har qanday write operatsiyasidan keyin chaqiriladi.
// //  *
// //  * delta misoli:
// //  *   { total: +1, sourceCount: { self: +1 }, statusCount: { new: +1 } }
// //  *   { total: -1, sourceCount: { self: -1 }, statusCount: { new: -1 } }
// //  *   { statusCount: { learning: -1, review: +1 } }   // faqat status o'zganda
// //  */
// // async function updateCache(studentId, delta) {
// //   const inc = {};

// //   if (delta.total !== undefined) {
// //     inc.total = delta.total;
// //   }
// //   if (delta.sourceCount) {
// //     for (const [key, val] of Object.entries(delta.sourceCount)) {
// //       inc[`sourceCount.${key}`] = val;
// //     }
// //   }
// //   if (delta.statusCount) {
// //     for (const [key, val] of Object.entries(delta.statusCount)) {
// //       inc[`statusCount.${key}`] = val;
// //     }
// //   }

// //   await PersonalVocabCache.findOneAndUpdate(
// //     { student: studentId },
// //     { $inc: inc, $set: { updatedAt: new Date() } },
// //     { upsert: true }
// //   );
// // }

// // /**
// //  * Cache ni to'liq qayta qurish.
// //  * Odatda ishlatilmaydi — faqat reset yoki buzilganida.
// //  */
// // async function rebuildCache(studentId) {
// //   const sid = new mongoose.Types.ObjectId(studentId);

// //   const [sourceTotals, statusTotals] = await Promise.all([
// //     PersonalWord.aggregate([
// //       { $match: { student: sid } },
// //       { $group: { _id: '$source', count: { $sum: 1 } } },
// //     ]),
// //     PersonalWord.aggregate([
// //       { $match: { student: sid } },
// //       { $group: { _id: '$status', count: { $sum: 1 } } },
// //     ]),
// //   ]);

// //   const sourceCount = { teacher: 0, self: 0, vocabcheck: 0 };
// //   const statusCount = { new: 0, learning: 0, review: 0, mastered: 0 };
// //   let total = 0;

// //   for (const row of sourceTotals) {
// //     if (row._id in sourceCount) { sourceCount[row._id] = row.count; total += row.count; }
// //   }
// //   for (const row of statusTotals) {
// //     if (row._id in statusCount) statusCount[row._id] = row.count;
// //   }

// //   await PersonalVocabCache.findOneAndUpdate(
// //     { student: studentId },
// //     { $set: { sourceCount, statusCount, total, updatedAt: new Date() } },
// //     { upsert: true }
// //   );

// //   return { sourceCount, statusCount, total };
// // }

// // /**
// //  * Cache + dueToday ni birga qaytaradi.
// //  * dueToday vaqtga bog'liq — har GET da hisoblanadi.
// //  * Lekin bu query indexed (student + nextReviewAt + status) — juda tez.
// //  */
// // async function getStatsFromCache(studentId) {
// //   const now = new Date();
// //   const sid = new mongoose.Types.ObjectId(studentId);

// //   const [cache, dueCount] = await Promise.all([
// //     getOrCreateCache(studentId),
// //     // Indexed query: student_1_nextReviewAt_1 index ishlatadi
// //     PersonalWord.countDocuments({
// //       student:      sid,
// //       status:       { $ne: 'mastered' },
// //       nextReviewAt: { $lte: now },
// //     }),
// //   ]);

// //   return {
// //     total:    cache.total,
// //     newWords: cache.statusCount.new,
// //     learning: cache.statusCount.learning,
// //     review:   cache.statusCount.review,
// //     mastered: cache.statusCount.mastered,
// //     dueToday: dueCount,
// //     summary: {
// //       teacher:    cache.sourceCount.teacher,
// //       self:       cache.sourceCount.self,
// //       vocabcheck: cache.sourceCount.vocabcheck,
// //       total:      cache.total,
// //     },
// //   };
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // SERVICE
// // // ─────────────────────────────────────────────────────────────────────────────
// // class PersonalWordService {

// //   // ── 1. Bugungi takrorlash uchun so'zlar ───────────────────────────────────
// //   //
// //   // Indexed query: { student, status != mastered, nextReviewAt <= now }
// //   // JS ga faqat max 50 ta kichik document tortiladi — o'quvchi soni muhim emas.
// //   //
// //   async getDueWords(studentId) {
// //     const now = new Date();

// //     const words = await PersonalWord.find({
// //       student:      studentId,
// //       status:       { $ne: 'mastered' },
// //       nextReviewAt: { $lte: now },
// //     })
// //       .limit(50)
// //       .lean();

// //     return {
// //       words: words.sort(() => Math.random() - 0.5),
// //       count: words.length,
// //     };
// //   }

// //   // ── 2. Statistika — cache dan ─────────────────────────────────────────────
// //   //
// //   // OLDIN: aggregate() → barcha so'zlarni guruhlash  ⚠️ sekin
// //   // KEYIN: cache doc o'qish → 1 ta kichik document   ✅ tez
// //   //
// //   async getStats(studentId) {
// //     const { summary, ...stats } = await getStatsFromCache(studentId);
// //     return stats;
// //   }

// //   // ── 3. Barcha so'zlar — pagination bilan ─────────────────────────────────
// //   //
// //   // total uchun: filter yo'q bo'lsa cache dan, filter bor bo'lsa countDocuments.
// //   // countDocuments filter bilan ham tez — chunki compound index bor.
// //   //
// //   async getAllWords(studentId, query = {}) {
// //     const { page, limit, skip } = parsePagination(query);
// //     const { status, source }    = query;

// //     const filter = { student: studentId };
// //     if (status) filter.status = status;
// //     if (source) filter.source = source;

// //     let total;
// //     if (!status && !source) {
// //       const cache = await getOrCreateCache(studentId);
// //       total = cache.total;
// //     } else {
// //       total = await PersonalWord.countDocuments(filter);
// //     }

// //     const words = await PersonalWord.find(filter)
// //       .sort({ nextReviewAt: 1 })
// //       .skip(skip)
// //       .limit(limit)
// //       .lean();

// //     return {
// //       words,
// //       meta: buildPaginationMeta(total, page, limit),
// //     };
// //   }

// //   // ── 4. TO'LIQ lug'at xazinasi — summary bilan ────────────────────────────
// //   //
// //   // OLDIN:
// //   //   countDocuments()  ⚠️
// //   //   aggregate() × 2   ⚠️
// //   //   find()            ✅
// //   //
// //   // KEYIN:
// //   //   cache doc o'qish  ✅ 1 ms
// //   //   dueToday count    ✅ indexed
// //   //   find()            ✅
// //   //
// //   async getMyVocabulary(studentId, query = {}) {
// //     const { page, limit, skip } = parsePagination(query);
// //     const { status, source }    = query;

// //     const filter = { student: studentId };
// //     if (status) filter.status = status;
// //     if (source) filter.source = source;

// //     // Stats + summary — cache dan (bitta query)
// //     const cached = await getStatsFromCache(studentId);

// //     // total: filter yo'q → cache dan, filter bor → countDocuments (indexed)
// //     let total;
// //     if (!status && !source) {
// //       total = cached.total;
// //     } else {
// //       total = await PersonalWord.countDocuments(filter);
// //     }

// //     const words = await PersonalWord.find(filter)
// //       .sort({ nextReviewAt: 1 })
// //       .skip(skip)
// //       .limit(limit)
// //       .lean();

// //     return {
// //       words,
// //       meta:    buildPaginationMeta(total, page, limit),
// //       summary: cached.summary,
// //       stats: {
// //         total:    cached.total,
// //         newWords: cached.newWords,
// //         learning: cached.learning,
// //         review:   cached.review,
// //         mastered: cached.mastered,
// //         dueToday: cached.dueToday,
// //       },
// //     };
// //   }

// //   // ── 5. Ustoz lug'atidan so'z qo'shish ─────────────────────────────────────
// //   async addWordsFromVocabulary(studentId, vocabularyId) {
// //     const vocab = await Vocabulary.findOne({ _id: vocabularyId, isDeleted: false }).lean();
// //     if (!vocab) throw new NotFoundError('Vocabulary');

// //     const existingIds = await PersonalWord.distinct('vocabularyItemId', {
// //       student:          studentId,
// //       vocabularyItemId: { $in: vocab.items.map(i => i._id) },
// //     });
// //     const existingSet = new Set(existingIds.map(id => id.toString()));

// //     const newDocs = vocab.items
// //       .filter(item => !existingSet.has(item._id.toString()))
// //       .map(item => ({
// //         student:            studentId,
// //         word:               item.word,
// //         translation:        item.translation || item.autoTranslation || '',
// //         language:           item.language,
// //         source:             'teacher',
// //         vocabularyId:       vocab._id,
// //         vocabularyItemId:   item._id,
// //         stage:              0,
// //         consecutiveCorrect: 0,
// //         totalReviews:       0,
// //         totalCorrect:       0,
// //         nextReviewAt:       new Date(),
// //         lastReviewedAt:     null,
// //         status:             'new',
// //       }));

// //     if (newDocs.length === 0) return { addedCount: 0 };

// //     await PersonalWord.insertMany(newDocs, { ordered: false });

// //     // Cache yangilash — bir marta, bitta delta
// //     await updateCache(studentId, {
// //       total:       newDocs.length,
// //       sourceCount: { teacher: newDocs.length },
// //       statusCount: { new:     newDocs.length },
// //     });

// //     return { addedCount: newDocs.length };
// //   }

// //   // ── 6. VocabCheck natijalaridan so'z qo'shish / yangilash ────────────────
// //   async addFromVocabCheckResult(studentId, wordResults) {
// //     let addedCount = 0;

// //     for (const result of wordResults) {
// //       const existing = await PersonalWord.findOne({
// //         student:          studentId,
// //         vocabularyItemId: result.vocabularyItemId,
// //       });

// //       if (existing) {
// //         const oldStatus = existing.status;
// //         const updates   = computeNextState(existing, result.isCorrect);
// //         Object.assign(existing, updates);
// //         await existing.save();

// //         if (oldStatus !== updates.status) {
// //           await updateCache(studentId, {
// //             statusCount: { [oldStatus]: -1, [updates.status]: +1 },
// //           });
// //         }
// //       } else {
// //         const initialStage = result.isCorrect ? 1 : 0;
// //         const status       = initialStage === 0 ? 'new' : 'learning';
// //         const nextReview   = new Date(Date.now() + (result.isCorrect ? 86400000 : 0));

// //         await PersonalWord.create({
// //           student:            studentId,
// //           word:               result.word,
// //           translation:        result.translation || '',
// //           language:           result.language || 'EN',
// //           source:             'vocabcheck',
// //           vocabularyId:       result.vocabularyId || null,
// //           vocabularyItemId:   result.vocabularyItemId,
// //           stage:              initialStage,
// //           consecutiveCorrect: result.isCorrect ? 1 : 0,
// //           totalReviews:       1,
// //           totalCorrect:       result.isCorrect ? 1 : 0,
// //           nextReviewAt:       nextReview,
// //           lastReviewedAt:     new Date(),
// //           status,
// //         });

// //         await updateCache(studentId, {
// //           total:       1,
// //           sourceCount: { vocabcheck: 1 },
// //           statusCount: { [status]:   1 },
// //         });

// //         addedCount++;
// //       }
// //     }

// //     return { updated: wordResults.length, addedCount };
// //   }

// //   // ── 7. O'quvchi o'zi so'z qo'shadi (cheksiz) ─────────────────────────────
// //   //
// //   // Limit yo'q. Server yukiga ta'siri:
// //   //   - 1 ta find (duplicate check, indexed)
// //   //   - 1 ta create
// //   //   - 1 ta cache $inc (1 ms)
// //   //
// //   async addSelfWord(studentId, wordData) {
// //     const { word, translation, language = 'EN' } = wordData;
// //     if (!word?.trim()) throw new AppError("So'z bo'sh bo'lmasligi kerak", 400);

// //     const wordLower = word.trim().toLowerCase();

// //     // Duplicate tekshiruvi: bir xil word + bir xil til bo'lsa xato
// //     // lekin "run" (yugurmoq) va "run" (oqmoq) ikkalasi ham saqlanadi
// //     // chunki translation farq qiladi — biz faqat word+language kombinatsiyasini tekshiramiz
// //     const duplicate = await PersonalWord.findOne({
// //       student:  studentId,
// //       source:   'self',
// //       word:     { $regex: new RegExp(`^${wordLower}$`, 'i') },
// //       language: language,
// //     }).select('_id word translation').lean();

// //     if (duplicate) {
// //       throw new ConflictError(
// //         `"${word}" (${language}) so'zi allaqachon mavjud: "${duplicate.translation || 'tarjimasiz'}". ` +
// //         `Boshqa ma'nosini qo'shmoqchi bo'lsangiz, tarjimasini farqli kiriting.`
// //       );
// //     }

// //     const newWord = await PersonalWord.create({
// //       student:            studentId,
// //       word:               word.trim(),
// //       translation:        translation?.trim() || '',
// //       language,
// //       source:             'self',
// //       vocabularyId:       null,
// //       vocabularyItemId:   null,
// //       stage:              0,
// //       consecutiveCorrect: 0,
// //       totalReviews:       0,
// //       totalCorrect:       0,
// //       nextReviewAt:       new Date(),
// //       lastReviewedAt:     null,
// //       status:             'new',
// //     });

// //     // Cache yangilash — +1 self, +1 new, +1 total
// //     await updateCache(studentId, {
// //       total:       1,
// //       sourceCount: { self: 1 },
// //       statusCount: { new:  1 },
// //     });

// //     return { word: newWord };
// //   }

// //   // ── 8. O'quvchi o'zi qo'shgan so'zni tahrirlaydi ─────────────────────────
// //   // source va status o'zgarmaydi — cache yangilanmaydi
// //   async updateSelfWord(studentId, wordId, updateData) {
// //     const word = await PersonalWord.findOne({
// //       _id:     wordId,
// //       student: studentId,
// //       source:  'self',
// //     });

// //     if (!word) {
// //       throw new AppError(
// //         "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni tahrirlaya olasiz",
// //         404
// //       );
// //     }

// //     const { word: newWord, translation, language } = updateData;

// //     if (newWord && newWord.trim().toLowerCase() !== word.word.toLowerCase()) {
// //       const dup = await PersonalWord.findOne({
// //         student: studentId,
// //         source:  'self',
// //         word:    { $regex: new RegExp(`^${newWord.trim()}$`, 'i') },
// //         _id:     { $ne: wordId },
// //       }).select('_id').lean();

// //       if (dup) {
// //         throw new ConflictError(
// //           `"${newWord.trim()}" so'zi allaqachon shaxsiy lug'atingizda mavjud`
// //         );
// //       }
// //       word.word = newWord.trim();
// //     }

// //     if (translation !== undefined) word.translation = translation?.trim() ?? '';
// //     if (language)                  word.language    = language;

// //     await word.save();
// //     return { word };
// //   }

// //   // ── 9. O'quvchi o'zi qo'shgan so'zni o'chiradi ───────────────────────────
// //   async deleteSelfWord(studentId, wordId) {
// //     const word = await PersonalWord.findOne({
// //       _id:     wordId,
// //       student: studentId,
// //       source:  'self',
// //     });

// //     if (!word) {
// //       throw new AppError(
// //         "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni o'chira olasiz",
// //         404
// //       );
// //     }

// //     const deletedStatus = word.status;
// //     await word.deleteOne();

// //     // Cache yangilash — -1 self, -1 [status], -1 total
// //     await updateCache(studentId, {
// //       total:       -1,
// //       sourceCount: { self: -1 },
// //       statusCount: { [deletedStatus]: -1 },
// //     });

// //     return { success: true };
// //   }

// //   // ── 10. SM-2 review ───────────────────────────────────────────────────────
// //   async submitReview(studentId, reviews) {
// //     if (!reviews?.length) throw new AppError("reviews massivi bo'sh", 400);

// //     const wordIds = reviews.map(r => r.wordId);

// //     const words = await PersonalWord.find({
// //       _id:     { $in: wordIds },
// //       student: studentId,
// //     });

// //     if (!words.length) throw new NotFoundError('PersonalWord');

// //     const wordMap    = new Map(words.map(w => [w._id.toString(), w]));
// //     const results    = [];
// //     const statusDelta = {};   // barcha status o'zgarishlarini yig'amiz

// //     for (const review of reviews) {
// //       const word = wordMap.get(review.wordId.toString());
// //       if (!word) continue;

// //       const oldStatus = word.status;
// //       const updates   = computeNextState(word, review.isCorrect);
// //       const newStatus = updates.status;

// //       Object.assign(word, updates);
// //       await word.save();

// //       // Status o'zgarganda delta yig'ish
// //       if (oldStatus !== newStatus) {
// //         statusDelta[oldStatus] = (statusDelta[oldStatus] || 0) - 1;
// //         statusDelta[newStatus] = (statusDelta[newStatus] || 0) + 1;
// //       }

// //       results.push({
// //         wordId:       word._id,
// //         word:         word.word,
// //         isCorrect:    review.isCorrect,
// //         newStage:     updates.stage,
// //         newStatus,
// //         nextReviewAt: updates.nextReviewAt,
// //       });
// //     }

// //     // Bir marta cache yangilash (barcha o'zgarishlar bilan)
// //     if (Object.keys(statusDelta).length > 0) {
// //       await updateCache(studentId, { statusCount: statusDelta });
// //     }

// //     return { reviewed: results.length, results };
// //   }


// //   // ── Example qo'shish ────────────────────────────────────────────────────────
// //   async addExample(studentId, wordId, text) {
// //     if (!text?.trim()) throw new AppError("Misol bo'sh bo'lishi mumkin emas", 400);
// //     const word = await PersonalWord.findOne({ _id: wordId, student: studentId });
// //     if (!word) throw new NotFoundError('PersonalWord');
// //     word.examples = word.examples || [];
// //     word.examples.push({ text: text.trim() });
// //     await word.save();
// //     return { examples: word.examples };
// //   }

// //   // ── Example o'chirish ────────────────────────────────────────────────────────
// //   async deleteExample(studentId, wordId, exampleId) {
// //     const word = await PersonalWord.findOne({ _id: wordId, student: studentId });
// //     if (!word) throw new NotFoundError('PersonalWord');
// //     const before = word.examples?.length || 0;
// //     word.examples = (word.examples || []).filter(e => e._id?.toString() !== exampleId);
// //     if (word.examples.length === before) throw new AppError("Misol topilmadi", 404);
// //     await word.save();
// //     return { examples: word.examples };
// //   }

// //   // ── Example yangilash ────────────────────────────────────────────────────────
// //   async updateExample(studentId, wordId, exampleId, text) {
// //     if (!text?.trim()) throw new AppError("Misol bo'sh bo'lishi mumkin emas", 400);
// //     const word = await PersonalWord.findOne({ _id: wordId, student: studentId });
// //     if (!word) throw new NotFoundError('PersonalWord');
// //     const ex = (word.examples || []).find(e => e._id?.toString() === exampleId);
// //     if (!ex) throw new AppError("Misol topilmadi", 404);
// //     ex.text = text.trim();
// //     await word.save();
// //     return { examples: word.examples };
// //   }

// //   // ── Notes yangilash ─────────────────────────────────────────────────────────
// //   async updateNotes(studentId, wordId, notes) {
// //     const word = await PersonalWord.findOne({ _id: wordId, student: studentId });
// //     if (!word) throw new NotFoundError('PersonalWord');
// //     word.notes = notes?.trim() || '';
// //     await word.save();
// //     return { notes: word.notes };
// //   }

// //   // ── 11. Guruh statistikasi (o'qituvchi uchun) ─────────────────────────────
// //   //
// //   // OLDIN: har o'quvchi uchun alohida aggregate()  ⚠️
// //   // KEYIN: bir so'rovda barcha cache doc larni olamiz ✅
// //   //
// //   async getGroupStats(studentIds) {
// //     const caches = await PersonalVocabCache.find({
// //       student: { $in: studentIds },
// //     }).lean();

// //     const cacheMap = new Map(caches.map(c => [c.student.toString(), c]));

// //     return studentIds.map(id => {
// //       const c = cacheMap.get(id.toString());
// //       return {
// //         studentId: id,
// //         stats: c
// //           ? {
// //               total:    c.total,
// //               newWords: c.statusCount.new,
// //               learning: c.statusCount.learning,
// //               review:   c.statusCount.review,
// //               mastered: c.statusCount.mastered,
// //             }
// //           : { total: 0, newWords: 0, learning: 0, review: 0, mastered: 0 },
// //       };
// //     });
// //   }

// //   // ── 12. Admin: o'quvchi barcha so'zlarini o'chirish ──────────────────────
// //   async resetStudentWords(studentId) {
// //     const result = await PersonalWord.deleteMany({ student: studentId });

// //     await PersonalVocabCache.findOneAndUpdate(
// //       { student: studentId },
// //       {
// //         $set: {
// //           sourceCount: { teacher: 0, self: 0, vocabcheck: 0 },
// //           statusCount: { new: 0, learning: 0, review: 0, mastered: 0 },
// //           total:       0,
// //           updatedAt:   new Date(),
// //         },
// //       },
// //       { upsert: true }
// //     );

// //     return { success: true, deletedCount: result.deletedCount };
// //   }

// //   // ── 13. Cache ni qayta qurish (admin) ─────────────────────────────────────
// //   // Agar cache noto'g'ri bo'lib qolsa — to'liq qayta hisoblaydi
// //   async rebuildCacheForStudent(studentId) {
// //     return rebuildCache(studentId);
// //   }
// // }

// // module.exports = new PersonalWordService();

// // // ── 14. O'quvchi o'zi uchun VocabCheck natijalarini qo'shish ─────────────────
// // // SpeakingPracticeScreen dan chaqiriladi (JWT dan studentId olinadi)
// // // addFromVocabCheckResult bilan bir xil mantiq, lekin studentId JWT dan
// // PersonalWordService.prototype.addSelfVocabCheckResult = async function(studentId, wordResults) {
// //   return this.addFromVocabCheckResult(studentId, wordResults);
// // };

// // // const PersonalWord       = require('../models/Personalword.model');
// // // const PersonalVocabCache = require('../models/personalvocabcache.model');
// // // const Vocabulary         = require('../models/Vocabulary');
// // // const mongoose           = require('mongoose');
// // // const { NotFoundError, AppError, ConflictError } = require('../utils/AppError');
// // // const { computeNextState } = require('../utils/sm2');
// // // const { buildPaginationMeta } = require('../utils/response');
// // // const { parsePagination }     = require('../utils/pagination');

// // // // ─────────────────────────────────────────────────────────────────────────────
// // // // CACHE YORDAMCHI FUNKSIYALARI
// // // // ─────────────────────────────────────────────────────────────────────────────

// // // /**
// // //  * Cache documentini olish yoki yaratish.
// // //  * upsert: true — yo'q bo'lsa avtomatik yaratadi.
// // //  */
// // // async function getOrCreateCache(studentId) {
// // //   return PersonalVocabCache.findOneAndUpdate(
// // //     { student: studentId },
// // //     { $setOnInsert: { student: studentId } },
// // //     { upsert: true, new: true }
// // //   );
// // // }

// // // /**
// // //  * Cache ni delta bilan yangilash.
// // //  * Har qanday write operatsiyasidan keyin chaqiriladi.
// // //  *
// // //  * delta misoli:
// // //  *   { total: +1, sourceCount: { self: +1 }, statusCount: { new: +1 } }
// // //  *   { total: -1, sourceCount: { self: -1 }, statusCount: { new: -1 } }
// // //  *   { statusCount: { learning: -1, review: +1 } }   // faqat status o'zganda
// // //  */
// // // async function updateCache(studentId, delta) {
// // //   const inc = {};

// // //   if (delta.total !== undefined) {
// // //     inc.total = delta.total;
// // //   }
// // //   if (delta.sourceCount) {
// // //     for (const [key, val] of Object.entries(delta.sourceCount)) {
// // //       inc[`sourceCount.${key}`] = val;
// // //     }
// // //   }
// // //   if (delta.statusCount) {
// // //     for (const [key, val] of Object.entries(delta.statusCount)) {
// // //       inc[`statusCount.${key}`] = val;
// // //     }
// // //   }

// // //   await PersonalVocabCache.findOneAndUpdate(
// // //     { student: studentId },
// // //     { $inc: inc, $set: { updatedAt: new Date() } },
// // //     { upsert: true }
// // //   );
// // // }

// // // /**
// // //  * Cache ni to'liq qayta qurish.
// // //  * Odatda ishlatilmaydi — faqat reset yoki buzilganida.
// // //  */
// // // async function rebuildCache(studentId) {
// // //   const sid = new mongoose.Types.ObjectId(studentId);

// // //   const [sourceTotals, statusTotals] = await Promise.all([
// // //     PersonalWord.aggregate([
// // //       { $match: { student: sid } },
// // //       { $group: { _id: '$source', count: { $sum: 1 } } },
// // //     ]),
// // //     PersonalWord.aggregate([
// // //       { $match: { student: sid } },
// // //       { $group: { _id: '$status', count: { $sum: 1 } } },
// // //     ]),
// // //   ]);

// // //   const sourceCount = { teacher: 0, self: 0, vocabcheck: 0 };
// // //   const statusCount = { new: 0, learning: 0, review: 0, mastered: 0 };
// // //   let total = 0;

// // //   for (const row of sourceTotals) {
// // //     if (row._id in sourceCount) { sourceCount[row._id] = row.count; total += row.count; }
// // //   }
// // //   for (const row of statusTotals) {
// // //     if (row._id in statusCount) statusCount[row._id] = row.count;
// // //   }

// // //   await PersonalVocabCache.findOneAndUpdate(
// // //     { student: studentId },
// // //     { $set: { sourceCount, statusCount, total, updatedAt: new Date() } },
// // //     { upsert: true }
// // //   );

// // //   return { sourceCount, statusCount, total };
// // // }

// // // /**
// // //  * Cache + dueToday ni birga qaytaradi.
// // //  * dueToday vaqtga bog'liq — har GET da hisoblanadi.
// // //  * Lekin bu query indexed (student + nextReviewAt + status) — juda tez.
// // //  */
// // // async function getStatsFromCache(studentId) {
// // //   const now = new Date();
// // //   const sid = new mongoose.Types.ObjectId(studentId);

// // //   const [cache, dueCount] = await Promise.all([
// // //     getOrCreateCache(studentId),
// // //     // Indexed query: student_1_nextReviewAt_1 index ishlatadi
// // //     PersonalWord.countDocuments({
// // //       student:      sid,
// // //       status:       { $ne: 'mastered' },
// // //       nextReviewAt: { $lte: now },
// // //     }),
// // //   ]);

// // //   return {
// // //     total:    cache.total,
// // //     newWords: cache.statusCount.new,
// // //     learning: cache.statusCount.learning,
// // //     review:   cache.statusCount.review,
// // //     mastered: cache.statusCount.mastered,
// // //     dueToday: dueCount,
// // //     summary: {
// // //       teacher:    cache.sourceCount.teacher,
// // //       self:       cache.sourceCount.self,
// // //       vocabcheck: cache.sourceCount.vocabcheck,
// // //       total:      cache.total,
// // //     },
// // //   };
// // // }

// // // // ─────────────────────────────────────────────────────────────────────────────
// // // // SERVICE
// // // // ─────────────────────────────────────────────────────────────────────────────
// // // class PersonalWordService {

// // //   // ── 1. Bugungi takrorlash uchun so'zlar ───────────────────────────────────
// // //   //
// // //   // Indexed query: { student, status != mastered, nextReviewAt <= now }
// // //   // JS ga faqat max 50 ta kichik document tortiladi — o'quvchi soni muhim emas.
// // //   //
// // //   async getDueWords(studentId) {
// // //     const now = new Date();

// // //     const words = await PersonalWord.find({
// // //       student:      studentId,
// // //       status:       { $ne: 'mastered' },
// // //       nextReviewAt: { $lte: now },
// // //     })
// // //       .limit(50)
// // //       .lean();

// // //     return {
// // //       words: words.sort(() => Math.random() - 0.5),
// // //       count: words.length,
// // //     };
// // //   }

// // //   // ── 2. Statistika — cache dan ─────────────────────────────────────────────
// // //   //
// // //   // OLDIN: aggregate() → barcha so'zlarni guruhlash  ⚠️ sekin
// // //   // KEYIN: cache doc o'qish → 1 ta kichik document   ✅ tez
// // //   //
// // //   async getStats(studentId) {
// // //     const { summary, ...stats } = await getStatsFromCache(studentId);
// // //     return stats;
// // //   }

// // //   // ── 3. Barcha so'zlar — pagination bilan ─────────────────────────────────
// // //   //
// // //   // total uchun: filter yo'q bo'lsa cache dan, filter bor bo'lsa countDocuments.
// // //   // countDocuments filter bilan ham tez — chunki compound index bor.
// // //   //
// // //   async getAllWords(studentId, query = {}) {
// // //     const { page, limit, skip } = parsePagination(query);
// // //     const { status, source }    = query;

// // //     const filter = { student: studentId };
// // //     if (status) filter.status = status;
// // //     if (source) filter.source = source;

// // //     let total;
// // //     if (!status && !source) {
// // //       const cache = await getOrCreateCache(studentId);
// // //       total = cache.total;
// // //     } else {
// // //       total = await PersonalWord.countDocuments(filter);
// // //     }

// // //     const words = await PersonalWord.find(filter)
// // //       .sort({ nextReviewAt: 1 })
// // //       .skip(skip)
// // //       .limit(limit)
// // //       .lean();

// // //     return {
// // //       words,
// // //       meta: buildPaginationMeta(total, page, limit),
// // //     };
// // //   }

// // //   // ── 4. TO'LIQ lug'at xazinasi — summary bilan ────────────────────────────
// // //   //
// // //   // OLDIN:
// // //   //   countDocuments()  ⚠️
// // //   //   aggregate() × 2   ⚠️
// // //   //   find()            ✅
// // //   //
// // //   // KEYIN:
// // //   //   cache doc o'qish  ✅ 1 ms
// // //   //   dueToday count    ✅ indexed
// // //   //   find()            ✅
// // //   //
// // //   async getMyVocabulary(studentId, query = {}) {
// // //     const { page, limit, skip } = parsePagination(query);
// // //     const { status, source }    = query;

// // //     const filter = { student: studentId };
// // //     if (status) filter.status = status;
// // //     if (source) filter.source = source;

// // //     // Stats + summary — cache dan (bitta query)
// // //     const cached = await getStatsFromCache(studentId);

// // //     // total: filter yo'q → cache dan, filter bor → countDocuments (indexed)
// // //     let total;
// // //     if (!status && !source) {
// // //       total = cached.total;
// // //     } else {
// // //       total = await PersonalWord.countDocuments(filter);
// // //     }

// // //     const words = await PersonalWord.find(filter)
// // //       .sort({ nextReviewAt: 1 })
// // //       .skip(skip)
// // //       .limit(limit)
// // //       .lean();

// // //     return {
// // //       words,
// // //       meta:    buildPaginationMeta(total, page, limit),
// // //       summary: cached.summary,
// // //       stats: {
// // //         total:    cached.total,
// // //         newWords: cached.newWords,
// // //         learning: cached.learning,
// // //         review:   cached.review,
// // //         mastered: cached.mastered,
// // //         dueToday: cached.dueToday,
// // //       },
// // //     };
// // //   }

// // //   // ── 5. Ustoz lug'atidan so'z qo'shish ─────────────────────────────────────
// // //   async addWordsFromVocabulary(studentId, vocabularyId) {
// // //     const vocab = await Vocabulary.findOne({ _id: vocabularyId, isDeleted: false }).lean();
// // //     if (!vocab) throw new NotFoundError('Vocabulary');

// // //     const existingIds = await PersonalWord.distinct('vocabularyItemId', {
// // //       student:          studentId,
// // //       vocabularyItemId: { $in: vocab.items.map(i => i._id) },
// // //     });
// // //     const existingSet = new Set(existingIds.map(id => id.toString()));

// // //     const newDocs = vocab.items
// // //       .filter(item => !existingSet.has(item._id.toString()))
// // //       .map(item => ({
// // //         student:            studentId,
// // //         word:               item.word,
// // //         translation:        item.translation || item.autoTranslation || '',
// // //         language:           item.language,
// // //         source:             'teacher',
// // //         vocabularyId:       vocab._id,
// // //         vocabularyItemId:   item._id,
// // //         stage:              0,
// // //         consecutiveCorrect: 0,
// // //         totalReviews:       0,
// // //         totalCorrect:       0,
// // //         nextReviewAt:       new Date(),
// // //         lastReviewedAt:     null,
// // //         status:             'new',
// // //       }));

// // //     if (newDocs.length === 0) return { addedCount: 0 };

// // //     await PersonalWord.insertMany(newDocs, { ordered: false });

// // //     // Cache yangilash — bir marta, bitta delta
// // //     await updateCache(studentId, {
// // //       total:       newDocs.length,
// // //       sourceCount: { teacher: newDocs.length },
// // //       statusCount: { new:     newDocs.length },
// // //     });

// // //     return { addedCount: newDocs.length };
// // //   }

// // //   // ── 6. VocabCheck natijalaridan so'z qo'shish / yangilash ────────────────
// // //   async addFromVocabCheckResult(studentId, wordResults) {
// // //     let addedCount = 0;

// // //     for (const result of wordResults) {
// // //       const existing = await PersonalWord.findOne({
// // //         student:          studentId,
// // //         vocabularyItemId: result.vocabularyItemId,
// // //       });

// // //       if (existing) {
// // //         const oldStatus = existing.status;
// // //         const updates   = computeNextState(existing, result.isCorrect);
// // //         Object.assign(existing, updates);
// // //         await existing.save();

// // //         if (oldStatus !== updates.status) {
// // //           await updateCache(studentId, {
// // //             statusCount: { [oldStatus]: -1, [updates.status]: +1 },
// // //           });
// // //         }
// // //       } else {
// // //         const initialStage = result.isCorrect ? 1 : 0;
// // //         const status       = initialStage === 0 ? 'new' : 'learning';
// // //         const nextReview   = new Date(Date.now() + (result.isCorrect ? 86400000 : 0));

// // //         await PersonalWord.create({
// // //           student:            studentId,
// // //           word:               result.word,
// // //           translation:        result.translation || '',
// // //           language:           result.language || 'EN',
// // //           source:             'vocabcheck',
// // //           vocabularyId:       result.vocabularyId || null,
// // //           vocabularyItemId:   result.vocabularyItemId,
// // //           stage:              initialStage,
// // //           consecutiveCorrect: result.isCorrect ? 1 : 0,
// // //           totalReviews:       1,
// // //           totalCorrect:       result.isCorrect ? 1 : 0,
// // //           nextReviewAt:       nextReview,
// // //           lastReviewedAt:     new Date(),
// // //           status,
// // //         });

// // //         await updateCache(studentId, {
// // //           total:       1,
// // //           sourceCount: { vocabcheck: 1 },
// // //           statusCount: { [status]:   1 },
// // //         });

// // //         addedCount++;
// // //       }
// // //     }

// // //     return { updated: wordResults.length, addedCount };
// // //   }

// // //   // ── 7. O'quvchi o'zi so'z qo'shadi (cheksiz) ─────────────────────────────
// // //   //
// // //   // Limit yo'q. Server yukiga ta'siri:
// // //   //   - 1 ta find (duplicate check, indexed)
// // //   //   - 1 ta create
// // //   //   - 1 ta cache $inc (1 ms)
// // //   //
// // //   async addSelfWord(studentId, wordData) {
// // //     const { word, translation, language = 'EN' } = wordData;
// // //     if (!word?.trim()) throw new AppError("So'z bo'sh bo'lmasligi kerak", 400);

// // //     const wordLower = word.trim().toLowerCase();

// // //     const duplicate = await PersonalWord.findOne({
// // //       student: studentId,
// // //       source:  'self',
// // //       word:    { $regex: new RegExp(`^${wordLower}$`, 'i') },
// // //     }).select('_id').lean();

// // //     if (duplicate) {
// // //       throw new ConflictError(`"${word}" so'zi allaqachon shaxsiy lug'atingizda mavjud`);
// // //     }

// // //     const newWord = await PersonalWord.create({
// // //       student:            studentId,
// // //       word:               word.trim(),
// // //       translation:        translation?.trim() || '',
// // //       language,
// // //       source:             'self',
// // //       vocabularyId:       null,
// // //       vocabularyItemId:   null,
// // //       stage:              0,
// // //       consecutiveCorrect: 0,
// // //       totalReviews:       0,
// // //       totalCorrect:       0,
// // //       nextReviewAt:       new Date(),
// // //       lastReviewedAt:     null,
// // //       status:             'new',
// // //     });

// // //     // Cache yangilash — +1 self, +1 new, +1 total
// // //     await updateCache(studentId, {
// // //       total:       1,
// // //       sourceCount: { self: 1 },
// // //       statusCount: { new:  1 },
// // //     });

// // //     return { word: newWord };
// // //   }

// // //   // ── 8. O'quvchi o'zi qo'shgan so'zni tahrirlaydi ─────────────────────────
// // //   // source va status o'zgarmaydi — cache yangilanmaydi
// // //   async updateSelfWord(studentId, wordId, updateData) {
// // //     const word = await PersonalWord.findOne({
// // //       _id:     wordId,
// // //       student: studentId,
// // //       source:  'self',
// // //     });

// // //     if (!word) {
// // //       throw new AppError(
// // //         "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni tahrirlaya olasiz",
// // //         404
// // //       );
// // //     }

// // //     const { word: newWord, translation, language } = updateData;

// // //     if (newWord && newWord.trim().toLowerCase() !== word.word.toLowerCase()) {
// // //       const dup = await PersonalWord.findOne({
// // //         student: studentId,
// // //         source:  'self',
// // //         word:    { $regex: new RegExp(`^${newWord.trim()}$`, 'i') },
// // //         _id:     { $ne: wordId },
// // //       }).select('_id').lean();

// // //       if (dup) {
// // //         throw new ConflictError(
// // //           `"${newWord.trim()}" so'zi allaqachon shaxsiy lug'atingizda mavjud`
// // //         );
// // //       }
// // //       word.word = newWord.trim();
// // //     }

// // //     if (translation !== undefined) word.translation = translation?.trim() ?? '';
// // //     if (language)                  word.language    = language;

// // //     await word.save();
// // //     return { word };
// // //   }

// // //   // ── 9. O'quvchi o'zi qo'shgan so'zni o'chiradi ───────────────────────────
// // //   async deleteSelfWord(studentId, wordId) {
// // //     const word = await PersonalWord.findOne({
// // //       _id:     wordId,
// // //       student: studentId,
// // //       source:  'self',
// // //     });

// // //     if (!word) {
// // //       throw new AppError(
// // //         "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni o'chira olasiz",
// // //         404
// // //       );
// // //     }

// // //     const deletedStatus = word.status;
// // //     await word.deleteOne();

// // //     // Cache yangilash — -1 self, -1 [status], -1 total
// // //     await updateCache(studentId, {
// // //       total:       -1,
// // //       sourceCount: { self: -1 },
// // //       statusCount: { [deletedStatus]: -1 },
// // //     });

// // //     return { success: true };
// // //   }

// // //   // ── 10. SM-2 review ───────────────────────────────────────────────────────
// // //   async submitReview(studentId, reviews) {
// // //     if (!reviews?.length) throw new AppError("reviews massivi bo'sh", 400);

// // //     const wordIds = reviews.map(r => r.wordId);

// // //     const words = await PersonalWord.find({
// // //       _id:     { $in: wordIds },
// // //       student: studentId,
// // //     });

// // //     if (!words.length) throw new NotFoundError('PersonalWord');

// // //     const wordMap    = new Map(words.map(w => [w._id.toString(), w]));
// // //     const results    = [];
// // //     const statusDelta = {};   // barcha status o'zgarishlarini yig'amiz

// // //     for (const review of reviews) {
// // //       const word = wordMap.get(review.wordId.toString());
// // //       if (!word) continue;

// // //       const oldStatus = word.status;
// // //       const updates   = computeNextState(word, review.isCorrect);
// // //       const newStatus = updates.status;

// // //       Object.assign(word, updates);
// // //       await word.save();

// // //       // Status o'zgarganda delta yig'ish
// // //       if (oldStatus !== newStatus) {
// // //         statusDelta[oldStatus] = (statusDelta[oldStatus] || 0) - 1;
// // //         statusDelta[newStatus] = (statusDelta[newStatus] || 0) + 1;
// // //       }

// // //       results.push({
// // //         wordId:       word._id,
// // //         word:         word.word,
// // //         isCorrect:    review.isCorrect,
// // //         newStage:     updates.stage,
// // //         newStatus,
// // //         nextReviewAt: updates.nextReviewAt,
// // //       });
// // //     }

// // //     // Bir marta cache yangilash (barcha o'zgarishlar bilan)
// // //     if (Object.keys(statusDelta).length > 0) {
// // //       await updateCache(studentId, { statusCount: statusDelta });
// // //     }

// // //     return { reviewed: results.length, results };
// // //   }

// // //   // ── 11. Guruh statistikasi (o'qituvchi uchun) ─────────────────────────────
// // //   //
// // //   // OLDIN: har o'quvchi uchun alohida aggregate()  ⚠️
// // //   // KEYIN: bir so'rovda barcha cache doc larni olamiz ✅
// // //   //
// // //   async getGroupStats(studentIds) {
// // //     const caches = await PersonalVocabCache.find({
// // //       student: { $in: studentIds },
// // //     }).lean();

// // //     const cacheMap = new Map(caches.map(c => [c.student.toString(), c]));

// // //     return studentIds.map(id => {
// // //       const c = cacheMap.get(id.toString());
// // //       return {
// // //         studentId: id,
// // //         stats: c
// // //           ? {
// // //               total:    c.total,
// // //               newWords: c.statusCount.new,
// // //               learning: c.statusCount.learning,
// // //               review:   c.statusCount.review,
// // //               mastered: c.statusCount.mastered,
// // //             }
// // //           : { total: 0, newWords: 0, learning: 0, review: 0, mastered: 0 },
// // //       };
// // //     });
// // //   }

// // //   // ── 12. Admin: o'quvchi barcha so'zlarini o'chirish ──────────────────────
// // //   async resetStudentWords(studentId) {
// // //     const result = await PersonalWord.deleteMany({ student: studentId });

// // //     await PersonalVocabCache.findOneAndUpdate(
// // //       { student: studentId },
// // //       {
// // //         $set: {
// // //           sourceCount: { teacher: 0, self: 0, vocabcheck: 0 },
// // //           statusCount: { new: 0, learning: 0, review: 0, mastered: 0 },
// // //           total:       0,
// // //           updatedAt:   new Date(),
// // //         },
// // //       },
// // //       { upsert: true }
// // //     );

// // //     return { success: true, deletedCount: result.deletedCount };
// // //   }

// // //   // ── 13. Cache ni qayta qurish (admin) ─────────────────────────────────────
// // //   // Agar cache noto'g'ri bo'lib qolsa — to'liq qayta hisoblaydi
// // //   async rebuildCacheForStudent(studentId) {
// // //     return rebuildCache(studentId);
// // //   }
// // // }

// // // module.exports = new PersonalWordService();

// // // // const PersonalWord = require('../models/Personalword.model');
// // // // const Vocabulary    = require('../models/Vocabulary');
// // // // const mongoose      = require('mongoose');
// // // // const { NotFoundError, AppError, ConflictError } = require('../utils/AppError');
// // // // const { computeNextState, computeStats: _computeStats } = require('../utils/sm2');
// // // // const { buildPaginationMeta } = require('../utils/response');
// // // // const { parsePagination } = require('../utils/pagination');

// // // // // SM-2 ga qo'shimcha: DB dan stats hisoblash
// // // // async function computeDbStats(studentId) {
// // // //   const now = new Date();
// // // //   const sid = new mongoose.Types.ObjectId(studentId);

// // // //   const [totals, dueCount] = await Promise.all([
// // // //     PersonalWord.aggregate([
// // // //       { $match: { student: sid } },
// // // //       { $group: { _id: '$status', count: { $sum: 1 } } },
// // // //     ]),
// // // //     PersonalWord.countDocuments({
// // // //       student: sid,
// // // //       status: { $ne: 'mastered' },
// // // //       nextReviewAt: { $lte: now },
// // // //     }),
// // // //   ]);

// // // //   const statsMap = { new: 0, learning: 0, review: 0, mastered: 0 };
// // // //   let total = 0;
// // // //   for (const row of totals) {
// // // //     statsMap[row._id] = row.count;
// // // //     total += row.count;
// // // //   }

// // // //   return {
// // // //     total,
// // // //     newWords:  statsMap.new,
// // // //     learning:  statsMap.learning,
// // // //     review:    statsMap.review,
// // // //     mastered:  statsMap.mastered,
// // // //     dueToday:  dueCount,
// // // //   };
// // // // }

// // // // class PersonalWordService {

// // // //   // ── 1. Bugungi takrorlash uchun so'zlar ───────────────────────────────────
// // // //   //
// // // //   // Server yuki: MongoDB o'zi filter + limit qiladi.
// // // //   // JS ga faqat max 50 ta so'z tortiladi.
// // // //   //
// // // //   async getDueWords(studentId) {
// // // //     const now = new Date();

// // // //     const words = await PersonalWord.find({
// // // //       student: studentId,
// // // //       status: { $ne: 'mastered' },
// // // //       nextReviewAt: { $lte: now },
// // // //     })
// // // //       .limit(50)
// // // //       .lean();

// // // //     // Aralashtirib yuborish
// // // //     const shuffled = words.sort(() => Math.random() - 0.5);

// // // //     return {
// // // //       words: shuffled,
// // // //       count: shuffled.length,
// // // //     };
// // // //   }

// // // //   // ── 2. Statistika ─────────────────────────────────────────────────────────
// // // //   async getStats(studentId) {
// // // //     return computeDbStats(studentId);
// // // //   }

// // // //   // ── 3. Barcha so'zlar — pagination bilan ──────────────────────────────────
// // // //   //
// // // //   // source, status bo'yicha filter.
// // // //   // MongoDB o'zi skip/limit qiladi — butun collection tortilmaydi.
// // // //   //
// // // //   async getAllWords(studentId, query = {}) {
// // // //     const { page, limit, skip } = parsePagination(query);
// // // //     const { status, source } = query;

// // // //     const filter = { student: studentId };
// // // //     if (status) filter.status = status;
// // // //     if (source) filter.source = source;

// // // //     const [words, total] = await Promise.all([
// // // //       PersonalWord.find(filter)
// // // //         .sort({ nextReviewAt: 1 })
// // // //         .skip(skip)
// // // //         .limit(limit)
// // // //         .lean(),
// // // //       PersonalWord.countDocuments(filter),
// // // //     ]);

// // // //     return {
// // // //       words,
// // // //       meta: buildPaginationMeta(total, page, limit),
// // // //     };
// // // //   }

// // // //   // ── 4. O'quvchining TO'LIQ lug'at xazinasi ───────────────────────────────
// // // //   //
// // // //   // Barcha manbadan so'zlar, bittada, pagination bilan.
// // // //   // source + status filter optional.
// // // //   // Summary (har bir manbadan qancha so'z) ham qaytariladi.
// // // //   //
// // // //   async getMyVocabulary(studentId, query = {}) {
// // // //     const { page, limit, skip } = parsePagination(query);
// // // //     const { status, source } = query;

// // // //     const filter = { student: studentId };
// // // //     if (status) filter.status = status;
// // // //     if (source) filter.source = source;

// // // //     const [words, total, summary] = await Promise.all([
// // // //       PersonalWord.find(filter)
// // // //         .sort({ nextReviewAt: 1 })
// // // //         .skip(skip)
// // // //         .limit(limit)
// // // //         .lean(),
// // // //       PersonalWord.countDocuments(filter),
// // // //       // Har bir source dan nechta so'z borligini hisoblash
// // // //       PersonalWord.aggregate([
// // // //         { $match: { student: new mongoose.Types.ObjectId(studentId) } },
// // // //         { $group: { _id: '$source', count: { $sum: 1 } } },
// // // //       ]),
// // // //     ]);

// // // //     const summaryMap = { teacher: 0, self: 0, vocabcheck: 0 };
// // // //     for (const row of summary) {
// // // //       if (summaryMap[row._id] !== undefined) {
// // // //         summaryMap[row._id] = row.count;
// // // //       }
// // // //     }

// // // //     return {
// // // //       words,
// // // //       meta: buildPaginationMeta(total, page, limit),
// // // //       summary: {
// // // //         ...summaryMap,
// // // //         total: summaryMap.teacher + summaryMap.self + summaryMap.vocabcheck,
// // // //       },
// // // //     };
// // // //   }

// // // //   // ── 5. Ustoz lug'atidan so'zlarni qo'shish ────────────────────────────────
// // // //   //
// // // //   // Homework berilganda chaqiriladi.
// // // //   // Allaqachon mavjud so'zlar o'tkazib yuboriladi (vocabularyItemId unique index).
// // // //   //
// // // //   async addWordsFromVocabulary(studentId, vocabularyId) {
// // // //     const vocab = await Vocabulary.findOne({ _id: vocabularyId, isDeleted: false }).lean();
// // // //     if (!vocab) throw new NotFoundError('Vocabulary');

// // // //     // Allaqachon qo'shilgan vocabularyItemId lar
// // // //     const existingIds = await PersonalWord.distinct('vocabularyItemId', {
// // // //       student: studentId,
// // // //       vocabularyItemId: { $in: vocab.items.map((i) => i._id) },
// // // //     });

// // // //     const existingSet = new Set(existingIds.map((id) => id.toString()));

// // // //     const newDocs = vocab.items
// // // //       .filter((item) => !existingSet.has(item._id.toString()))
// // // //       .map((item) => ({
// // // //         student:          studentId,
// // // //         word:             item.word,
// // // //         translation:      item.translation || item.autoTranslation || '',
// // // //         language:         item.language,
// // // //         source:           'teacher',
// // // //         vocabularyId:     vocab._id,
// // // //         vocabularyItemId: item._id,
// // // //         stage:            0,
// // // //         consecutiveCorrect: 0,
// // // //         totalReviews:     0,
// // // //         totalCorrect:     0,
// // // //         nextReviewAt:     new Date(),
// // // //         lastReviewedAt:   null,
// // // //         status:           'new',
// // // //       }));

// // // //     if (newDocs.length === 0) {
// // // //       return { addedCount: 0 };
// // // //     }

// // // //     // insertMany — tezkor, bitta DB so'rovi
// // // //     // ordered: false — agar birortasi xato bo'lsa qolganlarni davom ettiradi
// // // //     await PersonalWord.insertMany(newDocs, { ordered: false });

// // // //     return { addedCount: newDocs.length };
// // // //   }

// // // //   // ── 6. VocabCheck natijalaridan so'z qo'shish/yangilash ──────────────────
// // // //   async addFromVocabCheckResult(studentId, wordResults) {
// // // //     for (const result of wordResults) {
// // // //       const existing = await PersonalWord.findOne({
// // // //         student: studentId,
// // // //         vocabularyItemId: result.vocabularyItemId,
// // // //       });

// // // //       if (existing) {
// // // //         // Mavjud so'zni SM-2 bilan yangilash
// // // //         const updates = computeNextState(existing, result.isCorrect);
// // // //         Object.assign(existing, updates);
// // // //         await existing.save();
// // // //       } else {
// // // //         // Yangi so'z qo'shish
// // // //         const initialStage = result.isCorrect ? 1 : 0;
// // // //         const nextReview = new Date(
// // // //           Date.now() + (result.isCorrect ? 24 * 60 * 60 * 1000 : 0)
// // // //         );
// // // //         await PersonalWord.create({
// // // //           student:          studentId,
// // // //           word:             result.word,
// // // //           translation:      result.translation || '',
// // // //           language:         result.language || 'EN',
// // // //           source:           'vocabcheck',
// // // //           vocabularyId:     result.vocabularyId || null,
// // // //           vocabularyItemId: result.vocabularyItemId,
// // // //           stage:            initialStage,
// // // //           consecutiveCorrect: result.isCorrect ? 1 : 0,
// // // //           totalReviews:     1,
// // // //           totalCorrect:     result.isCorrect ? 1 : 0,
// // // //           nextReviewAt:     nextReview,
// // // //           lastReviewedAt:   new Date(),
// // // //           status:           initialStage === 0 ? 'new' : 'learning',
// // // //         });
// // // //       }
// // // //     }

// // // //     return { updated: wordResults.length };
// // // //   }

// // // //   // ── 7. O'QUVCHI O'ZI SO'Z QO'SHADI ───────────────────────────────────────
// // // //   //
// // // //   // Cheksiz so'z qo'shish mumkin (limit yo'q).
// // // //   // Faqat duplicate tekshiruvi: o'zi qo'shgan so'zlar ichida xuddi shu so'z bormi?
// // // //   //
// // // //   async addSelfWord(studentId, wordData) {
// // // //     const { word, translation, language = 'EN' } = wordData;

// // // //     if (!word || !word.trim()) {
// // // //       throw new AppError("So'z bo'sh bo'lmasligi kerak", 400);
// // // //     }

// // // //     const wordLower = word.trim().toLowerCase();

// // // //     // Duplicate tekshiruvi — faqat 'self' manbali so'zlar ichida
// // // //     const duplicate = await PersonalWord.findOne({
// // // //       student: studentId,
// // // //       source:  'self',
// // // //       word:    { $regex: new RegExp(`^${wordLower}$`, 'i') },
// // // //     });

// // // //     if (duplicate) {
// // // //       throw new ConflictError(`"${word}" so'zi allaqachon shaxsiy lug'atingizda mavjud`);
// // // //     }

// // // //     const newWord = await PersonalWord.create({
// // // //       student:          studentId,
// // // //       word:             word.trim(),
// // // //       translation:      translation?.trim() || '',
// // // //       language,
// // // //       source:           'self',
// // // //       vocabularyId:     null,
// // // //       vocabularyItemId: null,
// // // //       stage:            0,
// // // //       consecutiveCorrect: 0,
// // // //       totalReviews:     0,
// // // //       totalCorrect:     0,
// // // //       nextReviewAt:     new Date(),
// // // //       lastReviewedAt:   null,
// // // //       status:           'new',
// // // //     });

// // // //     return { word: newWord };
// // // //   }

// // // //   // ── 8. O'quvchi o'zi qo'shgan so'zni o'chiradi ───────────────────────────
// // // //   async deleteSelfWord(studentId, wordId) {
// // // //     const word = await PersonalWord.findOne({
// // // //       _id:     wordId,
// // // //       student: studentId,
// // // //       source:  'self',      // faqat o'zi qo'shganlarini o'chira oladi
// // // //     });

// // // //     if (!word) {
// // // //       throw new AppError(
// // // //         "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni o'chira olasiz",
// // // //         404
// // // //       );
// // // //     }

// // // //     await word.deleteOne();
// // // //     return { success: true };
// // // //   }

// // // //   // ── 9. O'quvchi o'zi qo'shgan so'zni tahrirlaydi ─────────────────────────
// // // //   //
// // // //   // Ustoz vocabulary ni o'zgartirganday — faqat source: 'self' bo'lgan
// // // //   // so'zlardagina ruxsat beriladi.
// // // //   //
// // // //   // O'zgartirilishi mumkin bo'lgan fieldlar:
// // // //   //   word        — so'zning o'zi
// // // //   //   translation — tarjimasi
// // // //   //   language    — tili (EN/UZ)
// // // //   //
// // // //   // SM-2 progress (stage, status, nextReviewAt va h.k.) o'zgartirilmaydi —
// // // //   // o'rganish jarayoniga ta'sir qilmasin deb.
// // // //   //
// // // //   async updateSelfWord(studentId, wordId, updateData) {
// // // //     const word = await PersonalWord.findOne({
// // // //       _id:     wordId,
// // // //       student: studentId,
// // // //       source:  'self',   // faqat o'zi qo'shgan so'zlarni tahrirlashi mumkin
// // // //     });

// // // //     if (!word) {
// // // //       throw new AppError(
// // // //         "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni tahrirlaya olasiz",
// // // //         404
// // // //       );
// // // //     }

// // // //     const { word: newWord, translation, language } = updateData;

// // // //     // Duplicate tekshiruvi — so'zni o'zgartirmoqchi bo'lsa, o'sha so'z boshqasida bormi?
// // // //     if (newWord && newWord.trim().toLowerCase() !== word.word.toLowerCase()) {
// // // //       const duplicate = await PersonalWord.findOne({
// // // //         student: studentId,
// // // //         source:  'self',
// // // //         word:    { $regex: new RegExp(`^${newWord.trim()}$`, 'i') },
// // // //         _id:     { $ne: wordId },  // o'zini hisobga olmaydi
// // // //       });

// // // //       if (duplicate) {
// // // //         throw new AppError(
// // // //           `"${newWord.trim()}" so'zi allaqachon shaxsiy lug'atingizda mavjud`,
// // // //           409
// // // //         );
// // // //       }

// // // //       word.word = newWord.trim();
// // // //     }

// // // //     if (translation !== undefined) word.translation = translation?.trim() ?? '';
// // // //     if (language)                  word.language    = language;

// // // //     await word.save();

// // // //     return { word };
// // // //   }

// // // //   // ── 10. SM-2 review — o'quvchi javob berdi ───────────────────────────────
// // // //   //
// // // //   // reviews = [{ wordId, isCorrect }]
// // // //   // wordId = PersonalWord._id (universal — barcha source uchun ishlaydi)
// // // //   //
// // // //   async submitReview(studentId, reviews) {
// // // //     if (!reviews || reviews.length === 0) {
// // // //       throw new AppError("reviews massivi bo'sh", 400);
// // // //     }

// // // //     const wordIds = reviews.map((r) => r.wordId);

// // // //     // Barcha so'zlarni bitta so'rovda olamiz
// // // //     const words = await PersonalWord.find({
// // // //       _id:     { $in: wordIds },
// // // //       student: studentId,
// // // //     });

// // // //     if (words.length === 0) throw new NotFoundError('PersonalWord');

// // // //     const wordMap = new Map(words.map((w) => [w._id.toString(), w]));
// // // //     const results = [];

// // // //     for (const review of reviews) {
// // // //       const word = wordMap.get(review.wordId.toString());
// // // //       if (!word) continue;

// // // //       const updates = computeNextState(word, review.isCorrect);
// // // //       Object.assign(word, updates);
// // // //       await word.save();   // individual save — har bir so'z alohida

// // // //       results.push({
// // // //         wordId:       word._id,
// // // //         word:         word.word,
// // // //         isCorrect:    review.isCorrect,
// // // //         newStage:     updates.stage,
// // // //         newStatus:    updates.status,
// // // //         nextReviewAt: updates.nextReviewAt,
// // // //       });
// // // //     }

// // // //     return {
// // // //       reviewed: results.length,
// // // //       results,
// // // //     };
// // // //   }

// // // //   // ── 10. Guruh o'quvchilari statistikasi (o'qituvchi uchun) ───────────────
// // // //   async getGroupStats(studentIds) {
// // // //     const stats = await Promise.all(
// // // //       studentIds.map(async (id) => ({
// // // //         studentId: id,
// // // //         stats: await computeDbStats(id),
// // // //       }))
// // // //     );
// // // //     return stats;
// // // //   }

// // // //   // ── 11. Admin: o'quvchi barcha so'zlarini o'chirish ──────────────────────
// // // //   async resetStudentWords(studentId) {
// // // //     const result = await PersonalWord.deleteMany({ student: studentId });
// // // //     return { success: true, deletedCount: result.deletedCount };
// // // //   }
// // // // }

// // // // module.exports = new PersonalWordService();

// // // // // const PersonalWord = require('../models/Personalword.model');
// // // // // const Vocabulary    = require('../models/Vocabulary');
// // // // // const mongoose      = require('mongoose');
// // // // // const { NotFoundError, AppError, ConflictError } = require('../utils/AppError');
// // // // // const { computeNextState, computeStats: _computeStats } = require('../utils/sm2');
// // // // // const { buildPaginationMeta } = require('../utils/response');
// // // // // const { parsePagination } = require('../utils/pagination');

// // // // // // SM-2 ga qo'shimcha: DB dan stats hisoblash
// // // // // async function computeDbStats(studentId) {
// // // // //   const now = new Date();
// // // // //   const sid = new mongoose.Types.ObjectId(studentId);

// // // // //   const [totals, dueCount] = await Promise.all([
// // // // //     PersonalWord.aggregate([
// // // // //       { $match: { student: sid } },
// // // // //       { $group: { _id: '$status', count: { $sum: 1 } } },
// // // // //     ]),
// // // // //     PersonalWord.countDocuments({
// // // // //       student: sid,
// // // // //       status: { $ne: 'mastered' },
// // // // //       nextReviewAt: { $lte: now },
// // // // //     }),
// // // // //   ]);

// // // // //   const statsMap = { new: 0, learning: 0, review: 0, mastered: 0 };
// // // // //   let total = 0;
// // // // //   for (const row of totals) {
// // // // //     statsMap[row._id] = row.count;
// // // // //     total += row.count;
// // // // //   }

// // // // //   return {
// // // // //     total,
// // // // //     newWords:  statsMap.new,
// // // // //     learning:  statsMap.learning,
// // // // //     review:    statsMap.review,
// // // // //     mastered:  statsMap.mastered,
// // // // //     dueToday:  dueCount,
// // // // //   };
// // // // // }

// // // // // class PersonalWordService {

// // // // //   // ── 1. Bugungi takrorlash uchun so'zlar ───────────────────────────────────
// // // // //   //
// // // // //   // Server yuki: MongoDB o'zi filter + limit qiladi.
// // // // //   // JS ga faqat max 50 ta so'z tortiladi.
// // // // //   //
// // // // //   async getDueWords(studentId) {
// // // // //     const now = new Date();

// // // // //     const words = await PersonalWord.find({
// // // // //       student: studentId,
// // // // //       status: { $ne: 'mastered' },
// // // // //       nextReviewAt: { $lte: now },
// // // // //     })
// // // // //       .limit(50)
// // // // //       .lean();

// // // // //     // Aralashtirib yuborish
// // // // //     const shuffled = words.sort(() => Math.random() - 0.5);

// // // // //     return {
// // // // //       words: shuffled,
// // // // //       count: shuffled.length,
// // // // //     };
// // // // //   }

// // // // //   // ── 2. Statistika ─────────────────────────────────────────────────────────
// // // // //   async getStats(studentId) {
// // // // //     return computeDbStats(studentId);
// // // // //   }

// // // // //   // ── 3. Barcha so'zlar — pagination bilan ──────────────────────────────────
// // // // //   //
// // // // //   // source, status bo'yicha filter.
// // // // //   // MongoDB o'zi skip/limit qiladi — butun collection tortilmaydi.
// // // // //   //
// // // // //   async getAllWords(studentId, query = {}) {
// // // // //     const { page, limit, skip } = parsePagination(query);
// // // // //     const { status, source } = query;

// // // // //     const filter = { student: studentId };
// // // // //     if (status) filter.status = status;
// // // // //     if (source) filter.source = source;

// // // // //     const [words, total] = await Promise.all([
// // // // //       PersonalWord.find(filter)
// // // // //         .sort({ nextReviewAt: 1 })
// // // // //         .skip(skip)
// // // // //         .limit(limit)
// // // // //         .lean(),
// // // // //       PersonalWord.countDocuments(filter),
// // // // //     ]);

// // // // //     return {
// // // // //       words,
// // // // //       meta: buildPaginationMeta(total, page, limit),
// // // // //     };
// // // // //   }

// // // // //   // ── 4. O'quvchining TO'LIQ lug'at xazinasi ───────────────────────────────
// // // // //   //
// // // // //   // Barcha manbadan so'zlar, bittada, pagination bilan.
// // // // //   // source + status filter optional.
// // // // //   // Summary (har bir manbadan qancha so'z) ham qaytariladi.
// // // // //   //
// // // // //   async getMyVocabulary(studentId, query = {}) {
// // // // //     const { page, limit, skip } = parsePagination(query);
// // // // //     const { status, source } = query;

// // // // //     const filter = { student: studentId };
// // // // //     if (status) filter.status = status;
// // // // //     if (source) filter.source = source;

// // // // //     const [words, total, summary] = await Promise.all([
// // // // //       PersonalWord.find(filter)
// // // // //         .sort({ nextReviewAt: 1 })
// // // // //         .skip(skip)
// // // // //         .limit(limit)
// // // // //         .lean(),
// // // // //       PersonalWord.countDocuments(filter),
// // // // //       // Har bir source dan nechta so'z borligini hisoblash
// // // // //       PersonalWord.aggregate([
// // // // //         { $match: { student: new mongoose.Types.ObjectId(studentId) } },
// // // // //         { $group: { _id: '$source', count: { $sum: 1 } } },
// // // // //       ]),
// // // // //     ]);

// // // // //     const summaryMap = { teacher: 0, self: 0, vocabcheck: 0 };
// // // // //     for (const row of summary) {
// // // // //       if (summaryMap[row._id] !== undefined) {
// // // // //         summaryMap[row._id] = row.count;
// // // // //       }
// // // // //     }

// // // // //     return {
// // // // //       words,
// // // // //       meta: buildPaginationMeta(total, page, limit),
// // // // //       summary: {
// // // // //         ...summaryMap,
// // // // //         total: summaryMap.teacher + summaryMap.self + summaryMap.vocabcheck,
// // // // //       },
// // // // //     };
// // // // //   }

// // // // //   // ── 5. Ustoz lug'atidan so'zlarni qo'shish ────────────────────────────────
// // // // //   //
// // // // //   // Homework berilganda chaqiriladi.
// // // // //   // Allaqachon mavjud so'zlar o'tkazib yuboriladi (vocabularyItemId unique index).
// // // // //   //
// // // // //   async addWordsFromVocabulary(studentId, vocabularyId) {
// // // // //     const vocab = await Vocabulary.findOne({ _id: vocabularyId, isDeleted: false }).lean();
// // // // //     if (!vocab) throw new NotFoundError('Vocabulary');

// // // // //     // Allaqachon qo'shilgan vocabularyItemId lar
// // // // //     const existingIds = await PersonalWord.distinct('vocabularyItemId', {
// // // // //       student: studentId,
// // // // //       vocabularyItemId: { $in: vocab.items.map((i) => i._id) },
// // // // //     });

// // // // //     const existingSet = new Set(existingIds.map((id) => id.toString()));

// // // // //     const newDocs = vocab.items
// // // // //       .filter((item) => !existingSet.has(item._id.toString()))
// // // // //       .map((item) => ({
// // // // //         student:          studentId,
// // // // //         word:             item.word,
// // // // //         translation:      item.translation || item.autoTranslation || '',
// // // // //         language:         item.language,
// // // // //         source:           'teacher',
// // // // //         vocabularyId:     vocab._id,
// // // // //         vocabularyItemId: item._id,
// // // // //         stage:            0,
// // // // //         consecutiveCorrect: 0,
// // // // //         totalReviews:     0,
// // // // //         totalCorrect:     0,
// // // // //         nextReviewAt:     new Date(),
// // // // //         lastReviewedAt:   null,
// // // // //         status:           'new',
// // // // //       }));

// // // // //     if (newDocs.length === 0) {
// // // // //       return { addedCount: 0 };
// // // // //     }

// // // // //     // insertMany — tezkor, bitta DB so'rovi
// // // // //     // ordered: false — agar birortasi xato bo'lsa qolganlarni davom ettiradi
// // // // //     await PersonalWord.insertMany(newDocs, { ordered: false });

// // // // //     return { addedCount: newDocs.length };
// // // // //   }

// // // // //   // ── 6. VocabCheck natijalaridan so'z qo'shish/yangilash ──────────────────
// // // // //   async addFromVocabCheckResult(studentId, wordResults) {
// // // // //     for (const result of wordResults) {
// // // // //       const existing = await PersonalWord.findOne({
// // // // //         student: studentId,
// // // // //         vocabularyItemId: result.vocabularyItemId,
// // // // //       });

// // // // //       if (existing) {
// // // // //         // Mavjud so'zni SM-2 bilan yangilash
// // // // //         const updates = computeNextState(existing, result.isCorrect);
// // // // //         Object.assign(existing, updates);
// // // // //         await existing.save();
// // // // //       } else {
// // // // //         // Yangi so'z qo'shish
// // // // //         const initialStage = result.isCorrect ? 1 : 0;
// // // // //         const nextReview = new Date(
// // // // //           Date.now() + (result.isCorrect ? 24 * 60 * 60 * 1000 : 0)
// // // // //         );
// // // // //         await PersonalWord.create({
// // // // //           student:          studentId,
// // // // //           word:             result.word,
// // // // //           translation:      result.translation || '',
// // // // //           language:         result.language || 'EN',
// // // // //           source:           'vocabcheck',
// // // // //           vocabularyId:     result.vocabularyId || null,
// // // // //           vocabularyItemId: result.vocabularyItemId,
// // // // //           stage:            initialStage,
// // // // //           consecutiveCorrect: result.isCorrect ? 1 : 0,
// // // // //           totalReviews:     1,
// // // // //           totalCorrect:     result.isCorrect ? 1 : 0,
// // // // //           nextReviewAt:     nextReview,
// // // // //           lastReviewedAt:   new Date(),
// // // // //           status:           initialStage === 0 ? 'new' : 'learning',
// // // // //         });
// // // // //       }
// // // // //     }

// // // // //     return { updated: wordResults.length };
// // // // //   }

// // // // //   // ── 7. O'QUVCHI O'ZI SO'Z QO'SHADI ───────────────────────────────────────
// // // // //   //
// // // // //   // Cheksiz so'z qo'shish mumkin (limit yo'q).
// // // // //   // Faqat duplicate tekshiruvi: o'zi qo'shgan so'zlar ichida xuddi shu so'z bormi?
// // // // //   //
// // // // //   async addSelfWord(studentId, wordData) {
// // // // //     const { word, translation, language = 'EN' } = wordData;

// // // // //     if (!word || !word.trim()) {
// // // // //       throw new AppError("So'z bo'sh bo'lmasligi kerak", 400);
// // // // //     }

// // // // //     const wordLower = word.trim().toLowerCase();

// // // // //     // Duplicate tekshiruvi — faqat 'self' manbali so'zlar ichida
// // // // //     const duplicate = await PersonalWord.findOne({
// // // // //       student: studentId,
// // // // //       source:  'self',
// // // // //       word:    { $regex: new RegExp(`^${wordLower}$`, 'i') },
// // // // //     });

// // // // //     if (duplicate) {
// // // // //       throw new ConflictError(`"${word}" so'zi allaqachon shaxsiy lug'atingizda mavjud`);
// // // // //     }

// // // // //     const newWord = await PersonalWord.create({
// // // // //       student:          studentId,
// // // // //       word:             word.trim(),
// // // // //       translation:      translation?.trim() || '',
// // // // //       language,
// // // // //       source:           'self',
// // // // //       vocabularyId:     null,
// // // // //       vocabularyItemId: null,
// // // // //       stage:            0,
// // // // //       consecutiveCorrect: 0,
// // // // //       totalReviews:     0,
// // // // //       totalCorrect:     0,
// // // // //       nextReviewAt:     new Date(),
// // // // //       lastReviewedAt:   null,
// // // // //       status:           'new',
// // // // //     });

// // // // //     return { word: newWord };
// // // // //   }

// // // // //   // ── 8. O'quvchi o'zi qo'shgan so'zni o'chiradi ───────────────────────────
// // // // //   async deleteSelfWord(studentId, wordId) {
// // // // //     const word = await PersonalWord.findOne({
// // // // //       _id:     wordId,
// // // // //       student: studentId,
// // // // //       source:  'self',      // faqat o'zi qo'shganlarini o'chira oladi
// // // // //     });

// // // // //     if (!word) {
// // // // //       throw new AppError(
// // // // //         "So'z topilmadi yoki faqat o'zingiz qo'shgan so'zlarni o'chira olasiz",
// // // // //         404
// // // // //       );
// // // // //     }

// // // // //     await word.deleteOne();
// // // // //     return { success: true };
// // // // //   }

// // // // //   // ── 9. SM-2 review — o'quvchi javob berdi ────────────────────────────────
// // // // //   //
// // // // //   // reviews = [{ wordId, isCorrect }]
// // // // //   // wordId = PersonalWord._id (universal — barcha source uchun ishlaydi)
// // // // //   //
// // // // //   async submitReview(studentId, reviews) {
// // // // //     if (!reviews || reviews.length === 0) {
// // // // //       throw new AppError("reviews massivi bo'sh", 400);
// // // // //     }

// // // // //     const wordIds = reviews.map((r) => r.wordId);

// // // // //     // Barcha so'zlarni bitta so'rovda olamiz
// // // // //     const words = await PersonalWord.find({
// // // // //       _id:     { $in: wordIds },
// // // // //       student: studentId,
// // // // //     });

// // // // //     if (words.length === 0) throw new NotFoundError('PersonalWord');

// // // // //     const wordMap = new Map(words.map((w) => [w._id.toString(), w]));
// // // // //     const results = [];

// // // // //     for (const review of reviews) {
// // // // //       const word = wordMap.get(review.wordId.toString());
// // // // //       if (!word) continue;

// // // // //       const updates = computeNextState(word, review.isCorrect);
// // // // //       Object.assign(word, updates);
// // // // //       await word.save();   // individual save — har bir so'z alohida

// // // // //       results.push({
// // // // //         wordId:       word._id,
// // // // //         word:         word.word,
// // // // //         isCorrect:    review.isCorrect,
// // // // //         newStage:     updates.stage,
// // // // //         newStatus:    updates.status,
// // // // //         nextReviewAt: updates.nextReviewAt,
// // // // //       });
// // // // //     }

// // // // //     return {
// // // // //       reviewed: results.length,
// // // // //       results,
// // // // //     };
// // // // //   }

// // // // //   // ── 10. Guruh o'quvchilari statistikasi (o'qituvchi uchun) ───────────────
// // // // //   async getGroupStats(studentIds) {
// // // // //     const stats = await Promise.all(
// // // // //       studentIds.map(async (id) => ({
// // // // //         studentId: id,
// // // // //         stats: await computeDbStats(id),
// // // // //       }))
// // // // //     );
// // // // //     return stats;
// // // // //   }

// // // // //   // ── 11. Admin: o'quvchi barcha so'zlarini o'chirish ──────────────────────
// // // // //   async resetStudentWords(studentId) {
// // // // //     const result = await PersonalWord.deleteMany({ student: studentId });
// // // // //     return { success: true, deletedCount: result.deletedCount };
// // // // //   }
// // // // // }

// // // // // module.exports = new PersonalWordService();