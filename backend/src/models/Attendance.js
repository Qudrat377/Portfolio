const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      required: true,
      default: ATTENDANCE_STATUS.ABSENT,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    records: [attendanceRecordSchema],
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

// Compound index: one attendance record per group per day
attendanceSchema.index({ group: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ 'records.student': 1 });
attendanceSchema.index({ group: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
