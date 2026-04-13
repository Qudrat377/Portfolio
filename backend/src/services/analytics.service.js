const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Submission = require('../models/Submission');
const SpeakingResult = require('../models/SpeakingResult');
const Group = require('../models/Group');
const User = require('../models/User');
const Homework = require('../models/Homework');
const { ROLES, ATTENDANCE_STATUS, SUBMISSION_STATUS } = require('../config/constants');

const toOid = (id) => mongoose.Types.ObjectId.createFromHexString(id);

class AnalyticsService {
  /**
   * Overall student progress report
   */
  async getStudentProgress(studentId, groupId) {
    const filter = { student: toOid(studentId) };
    if (groupId) filter.group = toOid(groupId);

    // Attendance stats
    const attendanceRecords = await Attendance.find({ 'records.student': toOid(studentId) })
      .lean();

    const studentAttendance = attendanceRecords.flatMap((a) =>
      a.records.filter((r) => r.student.toString() === studentId)
    );

    const attendanceStats = {
      total: studentAttendance.length,
      present: studentAttendance.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length,
      absent: studentAttendance.filter((r) => r.status === ATTENDANCE_STATUS.ABSENT).length,
      late: studentAttendance.filter((r) => r.status === ATTENDANCE_STATUS.LATE).length,
    };
    attendanceStats.rate =
      attendanceStats.total > 0
        ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
        : 0;

    // Homework submission stats
    const submissionStats = await Submission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
        },
      },
    ]);

    const totalSubmissions = submissionStats.reduce((sum, s) => sum + s.count, 0);
    const approved = submissionStats.find((s) => s._id === SUBMISSION_STATUS.APPROVED)?.count || 0;
    const avgScore =
      submissionStats.find((s) => s._id === SUBMISSION_STATUS.APPROVED)?.avgScore || 0;

    // Speaking test stats
    const speakingStats = await SpeakingResult.aggregate([
      { $match: { ...filter, status: 'COMPLETED' } },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          avgScore: { $avg: '$score' },
          avgDuration: { $avg: '$durationSeconds' },
          totalCorrect: { $sum: '$correctWords' },
          totalWords: { $sum: '$totalWords' },
        },
      },
    ]);

    // Score trend over time (last 10 speaking tests)
    const scoreTrend = await SpeakingResult.find({
      ...filter,
      status: 'COMPLETED',
    })
      .sort({ createdAt: 1 })
      .limit(10)
      .select('score createdAt homework')
      .populate('homework', 'title')
      .lean();

    return {
      attendance: attendanceStats,
      homework: {
        total: totalSubmissions,
        approved,
        completionRate:
          totalSubmissions > 0 ? Math.round((approved / totalSubmissions) * 100) : 0,
        avgScore: Math.round(avgScore || 0),
        byStatus: submissionStats,
      },
      speaking: speakingStats[0] || {
        totalTests: 0,
        avgScore: 0,
        avgDuration: 0,
        totalCorrect: 0,
        totalWords: 0,
      },
      scoreTrend,
    };
  }

  /**
   * Group overview analytics
   */
  async getGroupAnalytics(groupId) {
    const group = await Group.findOne({ _id: groupId, isDeleted: false })
      .populate('teacher', 'firstName lastName')
      .populate('assistant', 'firstName lastName')
      .lean();

    if (!group) throw new Error('Group not found');

    const studentCount = group.students.length;

    // Attendance rate for the group (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceDocs = await Attendance.find({
      group: toOid(groupId),
      date: { $gte: thirtyDaysAgo },
    }).lean();

    let totalMarks = 0;
    let presentMarks = 0;
    attendanceDocs.forEach((doc) => {
      doc.records.forEach((r) => {
        totalMarks++;
        if (r.status === ATTENDANCE_STATUS.PRESENT) presentMarks++;
      });
    });

    // Homework completion rate
    const homeworkCount = await Homework.countDocuments({ group: toOid(groupId), isDeleted: false, isPublished: true });
    const submissionStats = await Submission.aggregate([
      { $match: { group: toOid(groupId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
        },
      },
    ]);

    // Top students by score
    const topStudents = await Submission.aggregate([
      {
        $match: {
          group: toOid(groupId),
          status: SUBMISSION_STATUS.APPROVED,
          score: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$student',
          avgScore: { $avg: '$score' },
          totalSubmissions: { $sum: 1 },
        },
      },
      { $sort: { avgScore: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      { $unwind: '$studentInfo' },
      {
        $project: {
          firstName: '$studentInfo.firstName',
          lastName: '$studentInfo.lastName',
          avgScore: { $round: ['$avgScore', 1] },
          totalSubmissions: 1,
        },
      },
    ]);

    return {
      group: {
        name: group.name,
        level: group.level,
        teacher: group.teacher,
        assistant: group.assistant,
        studentCount,
        maxStudents: group.maxStudents,
        schedule: group.schedule,
      },
      attendance: {
        sessions: attendanceDocs.length,
        totalMarks,
        presentMarks,
        rate: totalMarks > 0 ? Math.round((presentMarks / totalMarks) * 100) : 0,
      },
      homework: {
        published: homeworkCount,
        submissionsByStatus: submissionStats,
      },
      topStudents,
    };
  }

  /**
   * Center-wide overview (Admin/Manager)
   */
  async getCenterOverview() {
    const [
      totalStudents,
      totalTeachers,
      totalGroups,
      activeGroups,
      recentSubmissions,
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.STUDENT, isDeleted: false, isActive: true }),
      User.countDocuments({ role: ROLES.TEACHER, isDeleted: false, isActive: true }),
      Group.countDocuments({ isDeleted: false }),
      Group.countDocuments({ isDeleted: false, isActive: true }),
      Submission.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    // Monthly attendance trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const attendanceTrend = await Attendance.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      { $unwind: '$records' },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            status: '$records.status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return {
      users: { totalStudents, totalTeachers },
      groups: { total: totalGroups, active: activeGroups },
      recentSubmissions,
      attendanceTrend,
    };
  }
}

module.exports = new AnalyticsService();
