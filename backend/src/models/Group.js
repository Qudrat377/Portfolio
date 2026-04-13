const mongoose = require('mongoose');
const { DAYS_OF_WEEK } = require('../config/constants');

const scheduleSchema = new mongoose.Schema(
  {
    days: [
      {
        type: String,
        enum: DAYS_OF_WEEK,
      },
    ],
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'],
    },
    room: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    assistant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    schedule: scheduleSchema,
    level: {
      type: String,
      enum: ['BEGINNER', 'ELEMENTARY', 'PRE_INTERMEDIATE', 'INTERMEDIATE', 'UPPER_INTERMEDIATE', 'ADVANCED'],
      default: 'BEGINNER',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    startDate: {
      type: Date,
      required: false,
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    maxStudents: {
      type: Number,
      default: 20,
      min: 1,
      max: 50,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
groupSchema.index({ teacher: 1 });
groupSchema.index({ assistant: 1 });
groupSchema.index({ isDeleted: 1, isActive: 1 });
groupSchema.index({ name: 'text' });

// Virtual: student count
groupSchema.virtual('studentCount').get(function () {
  return this.students ? this.students.length : 0;
});

module.exports = mongoose.model('Group', groupSchema);
