const mongoose = require('mongoose');
const { SPEAKING_TEST_STATUS } = require('../config/constants');

/**
 * SpeakingResult — stores only metadata about speaking tests.
 * No audio is stored. Designed for future AI speech recognition integration.
 */
const speakingResultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    homework: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Homework',
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    vocabulary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vocabulary',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SPEAKING_TEST_STATUS),
      default: SPEAKING_TEST_STATUS.PENDING,
    },

    // Aggregate results — no audio stored
    totalWords: {
      type: Number,
      default: 0,
    },
    correctWords: {
      type: Number,
      default: 0,
    },
    incorrectWords: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    timeLimitSeconds: {
      type: Number,
      required: true,
    },
    completedWithinLimit: {
      type: Boolean,
      default: false,
    },

    // Per-word results (no audio, just pass/fail)
    wordResults: [
      {
        vocabularyItemId: mongoose.Schema.Types.ObjectId,
        word: String,
        isCorrect: Boolean,
        timeTakenSeconds: Number,
        // Future AI field: can store confidence score from speech recognition
        aiConfidence: {
          type: Number,
          default: null,
        },
      },
    ],

    // AI integration hook (future)
    aiProcessed: {
      type: Boolean,
      default: false,
    },
    aiProvider: {
      type: String,
      default: null,
    },
    aiMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    teacherNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

speakingResultSchema.index({ student: 1, homework: 1 });
speakingResultSchema.index({ group: 1, status: 1 });
speakingResultSchema.index({ approvedBy: 1 });
speakingResultSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('SpeakingResult', speakingResultSchema);
