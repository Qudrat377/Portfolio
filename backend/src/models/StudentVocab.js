const mongoose = require('mongoose');

/**
 * StudentVocab — O'quvchining shaxsiy lug'at bazasi
 *
 * Ebbinghaus takrorlash tizimi asosida ishlaydi.
 * Har bir so'z uchun alohida holat saqlanadi:
 *   - qancha marta to'g'ri aytilgan
 *   - keyingi takrorlash qachon bo'lishi kerak
 *   - qaysi bosqichda (interval)
 *
 * Render.com / MongoDB Atlas uchun optimallashtirilgan:
 *   - Bitta o'quvchi uchun bitta hujjat (subdocument array)
 *   - Compound index — tezkor qidiruv
 *   - Faqat zarur maydonlar saqlanadi
 */

// ── Har bir so'z uchun holat ──────────────────────────────────────────────────
const wordStateSchema = new mongoose.Schema(
  {
    // Manba: Vocabulary collection dagi item._id
    vocabularyItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // So'zning o'zi (qidiruvda kerak)
    word: { type: String, required: true, trim: true },
    translation: { type: String, trim: true },
    language: { type: String, enum: ['EN', 'UZ'], default: 'EN' },

    // Qaysi lug'atdan kelgan
    vocabularyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vocabulary',
      required: true,
    },

    // ── SM-2 algoritmi maydonlari ─────────────────────────────────────────────
    // Bosqich: 0=yangi, 1=birinchi, 2=ikkinchi... (max 7)
    stage: { type: Number, default: 0, min: 0, max: 7 },

    // Ketma-ket to'g'ri javoblar soni
    consecutiveCorrect: { type: Number, default: 0 },

    // Jami tekshirilgan marta
    totalReviews: { type: Number, default: 0 },

    // Jami to'g'ri javoblar
    totalCorrect: { type: Number, default: 0 },

    // Keyingi takrorlash sanasi
    nextReviewAt: { type: Date, default: () => new Date() },

    // Oxirgi marta tekshirilgan sana
    lastReviewedAt: { type: Date, default: null },

    // Holat
    // new      → hali o'rganilmagan
    // learning → o'rganilmoqda (stage < 3)
    // review   → mustahkamlash (stage 3-5)
    // mastered → o'zlashtirilgan (stage >= 6, 21+ kun)
    status: {
      type: String,
      enum: ['new', 'learning', 'review', 'mastered'],
      default: 'new',
    },
  },
  { _id: false }
);

// ── Asosiy model ──────────────────────────────────────────────────────────────
const studentVocabSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // So'zlar ro'yxati (subdocument array)
    words: [wordStateSchema],

    // Statistika (tezkor ko'rsatish uchun)
    stats: {
      total: { type: Number, default: 0 },
      mastered: { type: Number, default: 0 },
      learning: { type: Number, default: 0 },
      newWords: { type: Number, default: 0 },
      dueToday: { type: Number, default: 0 },
    },

    // Oxirgi o'rganish sanasi
    lastStudiedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// ── Indexlar ──────────────────────────────────────────────────────────────────
// Har bir o'quvchi uchun bitta hujjat
studentVocabSchema.index({ student: 1 }, { unique: true });

// So'z qidirish uchun
studentVocabSchema.index({ student: 1, 'words.nextReviewAt': 1 });
studentVocabSchema.index({ student: 1, 'words.vocabularyItemId': 1 });
studentVocabSchema.index({ student: 1, 'words.status': 1 });

module.exports = mongoose.model('StudentVocab', studentVocabSchema);