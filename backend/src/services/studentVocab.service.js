const StudentVocab = require('../models/StudentVocab');
const Vocabulary = require('../models/Vocabulary');
const { NotFoundError, AppError } = require('../utils/AppError');
const { computeNextState, computeStats } = require('../utils/sm2');

class StudentVocabService {

  // ── 1. O'quvchining lug'at bazasini olish ─────────────────────────────────
  // Render uchun optimallashtirilgan:
  // - Faqat dueToday so'zlarni qaytaramiz (barchasi emas!)
  // - Frontend qolgan barcha so'zlarni alohida so'raydi
  async getDueWords(studentId) {
    const now = new Date();

    const doc = await StudentVocab.findOne({ student: studentId })
      .select('words stats lastStudiedAt')
      .lean();

    if (!doc) {
      return { words: [], stats: { total: 0, mastered: 0, learning: 0, newWords: 0, dueToday: 0 } };
    }

    // Faqat bugun takrorlanishi kerak bo'lganlar
    const dueWords = doc.words.filter(
      (w) => w.status !== 'mastered' && new Date(w.nextReviewAt) <= now
    );

    // Aralashtirib yuborish (random tartib)
    const shuffled = dueWords.sort(() => Math.random() - 0.5);

    return {
      words: shuffled,
      stats: doc.stats,
      lastStudiedAt: doc.lastStudiedAt,
    };
  }

  // ── 2. Statistika olish ────────────────────────────────────────────────────
  async getStats(studentId) {
    const doc = await StudentVocab.findOne({ student: studentId })
      .select('stats lastStudiedAt')
      .lean();

    if (!doc) {
      return { total: 0, mastered: 0, learning: 0, newWords: 0, dueToday: 0 };
    }

    return { stats: doc.stats, lastStudiedAt: doc.lastStudiedAt };
  }

  // ── 3. Barcha so'zlar (sahifalab) ─────────────────────────────────────────
  async getAllWords(studentId, query = {}) {
    const { status, page = 1, limit = 30 } = query;
    const skip = (page - 1) * limit;

    const doc = await StudentVocab.findOne({ student: studentId })
      .select('words stats')
      .lean();

    if (!doc) return { words: [], total: 0, stats: {} };

    let words = doc.words;

    // Status bo'yicha filter
    if (status) {
      words = words.filter((w) => w.status === status);
    }

    const total = words.length;

    // nextReviewAt bo'yicha sort (eng yaqini avval)
    words = words
      .sort((a, b) => new Date(a.nextReviewAt) - new Date(b.nextReviewAt))
      .slice(skip, skip + parseInt(limit));

    return { words, total, stats: doc.stats };
  }

  // ── 4. Yangi so'zlarni bazaga qo'shish ────────────────────────────────────
  // Bu yerda 3 xil holat bor:
  //   a) Teacher/Assistant lug'at yaratganda (vocabularyId bilan)
  //   b) VocabCheck da noto'g'ri bo'lgan so'zlar avtomatik qo'shilganda
  //   c) O'quvchi o'zi qo'shganda (kelajak uchun)
  async addWordsFromVocabulary(studentId, vocabularyId) {
    const vocab = await Vocabulary.findOne({ _id: vocabularyId, isDeleted: false }).lean();
    if (!vocab) throw new NotFoundError('Vocabulary');

    let doc = await StudentVocab.findOne({ student: studentId });

    if (!doc) {
      doc = new StudentVocab({ student: studentId, words: [] });
    }

    // Allaqachon mavjud so'zlarni tekshirish (duplicate oldini olish)
    const existingIds = new Set(
      doc.words.map((w) => w.vocabularyItemId.toString())
    );

    let addedCount = 0;

    for (const item of vocab.items) {
      if (existingIds.has(item._id.toString())) continue;

      doc.words.push({
        vocabularyItemId: item._id,
        word: item.word,
        translation: item.translation || item.autoTranslation || '',
        language: item.language,
        vocabularyId: vocab._id,
        stage: 0,
        consecutiveCorrect: 0,
        totalReviews: 0,
        totalCorrect: 0,
        nextReviewAt: new Date(), // bugundan boshlanadi
        lastReviewedAt: null,
        status: 'new',
      });

      addedCount++;
    }

    // Statistikani yangilash
    doc.stats = computeStats(doc.words);

    await doc.save();

    return { addedCount, total: doc.words.length };
  }

  // ── 5. VocabCheck natijalaridan so'z qo'shish (noto'g'rilarni) ─────────────
  // Assistant lug'at so'raganda → bilmaganlar avtomatik bazaga tushadi
  async addFromVocabCheckResult(studentId, wordResults) {
    // wordResults = [{ vocabularyItemId, word, translation, language, vocabularyId, isCorrect }]

    let doc = await StudentVocab.findOne({ student: studentId });
    if (!doc) {
      doc = new StudentVocab({ student: studentId, words: [] });
    }

    const existingMap = new Map(
      doc.words.map((w, idx) => [w.vocabularyItemId.toString(), idx])
    );

    for (const result of wordResults) {
      const idStr = result.vocabularyItemId.toString();
      const existingIdx = existingMap.get(idStr);

      if (existingIdx !== undefined) {
        // Mavjud so'z → SM-2 algoritmini ishlatish
        const current = doc.words[existingIdx];
        const updates = computeNextState(current, result.isCorrect);
        Object.assign(doc.words[existingIdx], updates);
      } else {
        // Yangi so'z → bazaga qo'shish
        // To'g'ri bilgan bo'lsa stage=1 (1 kundan keyin), bilmasa stage=0 (bugun)
        const initialStage = result.isCorrect ? 1 : 0;
        const nextReview = new Date();
        if (result.isCorrect) nextReview.setDate(nextReview.getDate() + 1);

        doc.words.push({
          vocabularyItemId: result.vocabularyItemId,
          word: result.word,
          translation: result.translation || '',
          language: result.language || 'EN',
          vocabularyId: result.vocabularyId,
          stage: initialStage,
          consecutiveCorrect: result.isCorrect ? 1 : 0,
          totalReviews: 1,
          totalCorrect: result.isCorrect ? 1 : 0,
          nextReviewAt: nextReview,
          lastReviewedAt: new Date(),
          status: initialStage === 0 ? 'new' : 'learning',
        });
      }
    }

    doc.stats = computeStats(doc.words);
    doc.lastStudiedAt = new Date();
    await doc.save();

    return { updated: doc.words.length };
  }

  // ── 6. O'quvchi o'rganib javob berdi ─────────────────────────────────────
  // Frontend dan: [{ vocabularyItemId, isCorrect }] massivi keladi
  // Bitta session da bir nechta so'z tekshiriladi
  async submitReview(studentId, reviews) {
    // reviews = [{ vocabularyItemId: '...', isCorrect: true/false }]

    if (!reviews || reviews.length === 0) {
      throw new AppError('reviews massivi bo\'sh', 400);
    }

    const doc = await StudentVocab.findOne({ student: studentId });
    if (!doc) throw new NotFoundError('StudentVocab');

    const wordMap = new Map(
      doc.words.map((w, idx) => [w.vocabularyItemId.toString(), idx])
    );

    const results = [];

    for (const review of reviews) {
      const idx = wordMap.get(review.vocabularyItemId.toString());
      if (idx === undefined) continue;

      const current = doc.words[idx];
      const updates = computeNextState(current, review.isCorrect);
      Object.assign(doc.words[idx], updates);

      results.push({
        vocabularyItemId: review.vocabularyItemId,
        word: current.word,
        isCorrect: review.isCorrect,
        newStage: updates.stage,
        newStatus: updates.status,
        nextReviewAt: updates.nextReviewAt,
      });
    }

    doc.stats = computeStats(doc.words);
    doc.lastStudiedAt = new Date();
    await doc.save();

    return {
      reviewed: results.length,
      results,
      stats: doc.stats,
    };
  }

  // ── 7. Guruh o'quvchilari uchun umumiy statistika (o'qituvchi uchun) ───────
  async getGroupStats(studentIds) {
    const docs = await StudentVocab.find(
      { student: { $in: studentIds } },
      { student: 1, stats: 1, lastStudiedAt: 1 }
    ).lean();

    return docs.map((d) => ({
      studentId: d.student,
      stats: d.stats,
      lastStudiedAt: d.lastStudiedAt,
    }));
  }

  // ── 8. O'quvchi lug'at bazasini tozalash (admin) ──────────────────────────
  async resetStudentVocab(studentId) {
    await StudentVocab.deleteOne({ student: studentId });
    return { success: true };
  }
}

module.exports = new StudentVocabService();