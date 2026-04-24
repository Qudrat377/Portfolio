const mongoose = require('mongoose');

/**
 * PersonalWord — O'quvchining shaxsiy lug'at so'zlari
 *
 * ARXITEKTURA QARORI:
 * ──────────────────
 * Oldingi yondashuv: StudentVocab — bitta document, words[] subdocument array
 *   Muammo: GET da butun array MongoDB dan JS ga tortiladi → server yuki
 *
 * Yangi yondashuv: PersonalWord — har bir so'z alohida document (ustoz kabi)
 *   Afzallik:
 *     ✓ MongoDB o'zi pagination, filter, sort qiladi — JS da hech narsa yuklanmaydi
 *     ✓ Cheksiz so'z qo'shish mumkin — array to'lib qolmaydi
 *     ✓ GET, UPDATE, DELETE — faqat kerakli so'zlar tortiladi
 *     ✓ Index to'g'ridan-to'g'ri ishlaydi
 *
 * So'z manbalari (source):
 *   teacher    → ustoz homework orqali qo'shgan (addWordsFromVocabulary)
 *   self       → o'quvchi o'zi qo'shgan
 *   vocabcheck → dars vaqtida VocabCheck orqali tushgan
 */

const personalWordSchema = new mongoose.Schema(
  {
    // Egasi — kim o'rganayotgan so'z
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // So'zning o'zi
    word: {
      type: String,
      required: true,
      trim: true,
    },
    translation: {
      type: String,
      trim: true,
      default: '',
    },
    language: {
      type: String,
      enum: ['EN', 'UZ'],
      default: 'EN',
    },

    // Manba
    source: {
      type: String,
      enum: ['teacher', 'self', 'vocabcheck'],
      required: true,
    },

    // Ustoz lug'atiga bog'liqlik (teacher/vocabcheck uchun to'ldiriladi)
    vocabularyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vocabulary',
      default: null,
    },
    vocabularyItemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // ── SM-2 algoritmi maydonlari ─────────────────────────────────────────────
    // stage: 0=yangi, 1-2=learning, 3-5=review, 6-7=mastered
    stage: {
      type: Number,
      default: 0,
      min: 0,
      max: 7,
    },
    consecutiveCorrect: { type: Number, default: 0 },
    totalReviews:       { type: Number, default: 0 },
    totalCorrect:       { type: Number, default: 0 },

    nextReviewAt:   { type: Date, default: () => new Date() },
    lastReviewedAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ['new', 'learning', 'review', 'mastered'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexlar ──────────────────────────────────────────────────────────────────
// Asosiy query: o'quvchi + bugungi due so'zlar
personalWordSchema.index({ student: 1, nextReviewAt: 1 });

// Filter: status bo'yicha
personalWordSchema.index({ student: 1, status: 1 });

// Filter: source bo'yicha (self/teacher/vocabcheck)
personalWordSchema.index({ student: 1, source: 1 });

// Duplicate tekshiruvi uchun (source: 'self' da bir xil so'z bo'lmasin)
personalWordSchema.index({ student: 1, source: 1, word: 1 });

// Teacher/vocabcheck uchun duplicate tekshiruvi
personalWordSchema.index({ student: 1, vocabularyItemId: 1 }, {
  unique: true,
  partialFilterExpression: { vocabularyItemId: { $ne: null } },
});

module.exports = mongoose.model('PersonalWord', personalWordSchema);