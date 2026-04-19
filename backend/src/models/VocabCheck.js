const mongoose = require('mongoose');
const { VOCABCHECK_STATUS } = require('../config/constants');

const wordCheckSchema = new mongoose.Schema(
  {
    wordId: { type: mongoose.Schema.Types.ObjectId, required: true },
    word: { type: String, required: true },
    isFound: { type: Boolean, required: true },
  },
  { _id: false }
);

const vocabCheckRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    wordChecks: [wordCheckSchema],
    score: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  { _id: false }
);

const vocabCheckSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    homework: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Homework',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    records: [vocabCheckRecordSchema],
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    topic: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

vocabCheckSchema.index({ group: 1, homework: 1, date: 1 }, { unique: true });
vocabCheckSchema.index({ date: 1 });
vocabCheckSchema.index({ 'records.student': 1 });

module.exports = mongoose.model('VocabCheck', vocabCheckSchema);
