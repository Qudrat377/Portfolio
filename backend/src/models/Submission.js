const mongoose = require('mongoose');
const { SUBMISSION_STATUS, HOMEWORK_TYPES } = require('../config/constants');

const vocabularyAnswerSchema = new mongoose.Schema(
  {
    vocabularyItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    word: String,
    isCorrect: {
      type: Boolean,
      default: false,
    },
    studentAnswer: String,
    timeTakenSeconds: Number,
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    homework: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Homework',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SUBMISSION_STATUS),
      default: SUBMISSION_STATUS.PENDING,
    },

    // TEXT homework submission
    textAnswer: {
      type: String,
      trim: true,
      maxlength: 10000,
    },

    // URL homework: student notes/comments
    urlNote: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    // VOCABULARY homework answers (from mobile speaking test)
    vocabularyAnswers: [vocabularyAnswerSchema],

    // Score (for vocabulary: auto-calculated, for text: teacher-given)
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    // Teacher/Assistant review
    feedback: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: null,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Unique: one submission per student per homework
submissionSchema.index({ homework: 1, student: 1 }, { unique: true });
submissionSchema.index({ student: 1, status: 1 });
submissionSchema.index({ group: 1, status: 1 });
submissionSchema.index({ homework: 1, status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
