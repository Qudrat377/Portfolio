const mongoose = require('mongoose');

/**
 * PersonalVocabCache — O'quvchining lug'at statistikasini keshlaydi
 *
 * MUAMMO (hal qilinayotgan):
 *   getMyVocabulary da har so'rovda:
 *     1. countDocuments()  — barcha so'zlarni sanash  ⚠️ sekin
 *     2. aggregate()       — source bo'yicha guruhlash ⚠️ sekin
 *   200 o'quvchi × 2 og'ir query = server qiyinlashadi
 *
 * YECHIM:
 *   Har o'quvchi uchun bitta kichik cache document.
 *   So'z qo'shilganda / o'chirilganda / review da — cache yangilanadi.
 *   GET da faqat shu bitta documentni o'qiymiz → 1 ms.
 *
 * TTL:
 *   dueToday vaqtga bog'liq (nextReviewAt <= now).
 *   Shuning uchun dueToday ni har GET da qayta hisoblaymiz,
 *   qolgan statslar (total, source counts, status counts) esa
 *   faqat write operatsiyalarida yangilanadi.
 */

const personalVocabCacheSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,   // bitta o'quvchi = bitta cache doc
    },

    // Manba bo'yicha hisoblar
    sourceCount: {
      teacher:    { type: Number, default: 0 },
      self:       { type: Number, default: 0 },
      vocabcheck: { type: Number, default: 0 },
    },

    // Status bo'yicha hisoblar
    statusCount: {
      new:      { type: Number, default: 0 },
      learning: { type: Number, default: 0 },
      review:   { type: Number, default: 0 },
      mastered: { type: Number, default: 0 },
    },

    // Jami so'zlar
    total: { type: Number, default: 0 },

    // Cache qachon yangilangani (debug uchun)
    updatedAt: { type: Date, default: () => new Date() },
  },
  {
    // timestamps: false — updatedAt ni o'zimiz boshqaramiz
    versionKey: false,
  }
);

personalVocabCacheSchema.index({ student: 1 }, { unique: true });

module.exports = mongoose.model('PersonalVocabCache', personalVocabCacheSchema);