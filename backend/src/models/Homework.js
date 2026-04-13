const mongoose = require('mongoose');
const { HOMEWORK_TYPES } = require('../config/constants');

const homeworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: Object.values(HOMEWORK_TYPES),
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },

    // TYPE: URL
    resourceUrl: {
      type: String,
      trim: true,
    },
    urlDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // TYPE: TEXT
    textContent: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    // TYPE: VOCABULARY
    vocabulary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vocabulary',
    },
    // Speaking test time limit in seconds
    timeLimitSeconds: {
      type: Number,
      default: 60,
      min: 10,
      max: 600,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

homeworkSchema.index({ group: 1, dueDate: -1 });
homeworkSchema.index({ createdBy: 1 });
homeworkSchema.index({ isDeleted: 1 });
homeworkSchema.index({ type: 1 });

module.exports = mongoose.model('Homework', homeworkSchema);
