const mongoose = require('mongoose');

/**
 * VocabularyAssignment
 * Bir lug'at ko'p guruhlarga berilishi mumkin.
 * Bu model qaysi lug'at qaysi guruhga, qachon va kim tomonidan berilganini saqlaydi.
 */
const vocabularyAssignmentSchema = new mongoose.Schema(
  {
    vocabulary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vocabulary',
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Topshirish muddati
    dueDate: {
      type: Date,
      default: null,
    },
    // Ustoz izohi (bu guruh uchun maxsus)
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Bir lug'at bir guruhga faqat bir marta beriladi
vocabularyAssignmentSchema.index({ vocabulary: 1, group: 1 }, { unique: true });
vocabularyAssignmentSchema.index({ group: 1, isActive: 1 });
vocabularyAssignmentSchema.index({ assignedBy: 1 });
vocabularyAssignmentSchema.index({ vocabulary: 1 });

module.exports = mongoose.model('VocabularyAssignment', vocabularyAssignmentSchema);
