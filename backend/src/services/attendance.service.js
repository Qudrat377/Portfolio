const Attendance = require('../models/Attendance');
const Group = require('../models/Group');
const { NotFoundError, AppError, ConflictError } = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { buildPaginationMeta } = require('../utils/response');
const { audit, ACTIONS } = require('../utils/auditLog');

class AttendanceService {
  async markAttendance(data, markingUser) {
    const { group: groupId, date } = data;

    const group = await Group.findOne({ _id: groupId, isDeleted: false }).select('students teacher assistant');
    if (!group) throw new NotFoundError('Group');

    // Normalize date to start of day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check duplicate
    const existing = await Attendance.findOne({ group: groupId, date: attendanceDate });
    if (existing) throw new ConflictError('Attendance already marked for this date');

    // Validate all students are in the group
    const groupStudentIds = group.students.map((s) => s.toString());
    for (const record of data.records) {
      if (!groupStudentIds.includes(record.student.toString())) {
        throw new AppError(`Student ${record.student} is not in this group`, 400);
      }
    }

    const attendance = await Attendance.create({
      ...data,
      date: attendanceDate,
      markedBy: markingUser._id,
    });

    await audit({
      userId: markingUser._id,
      action: ACTIONS.MARK_ATTENDANCE,
      resource: 'Attendance',
      resourceId: attendance._id,
      details: { groupId, date: attendanceDate, count: data.records.length },
    });

    return attendance;
  }

  async updateAttendance(id, data, updatingUser) {
    const attendance = await Attendance.findById(id);
    if (!attendance) throw new NotFoundError('Attendance');

    Object.assign(attendance, { ...data, updatedBy: updatingUser._id });
    await attendance.save();

    await audit({
      userId: updatingUser._id,
      action: ACTIONS.UPDATE,
      resource: 'Attendance',
      resourceId: attendance._id,
    });

    return attendance;
  }

  async getAttendance(query) {
    const { group, student, startDate, endDate, status } = query;
    const { page, limit, skip } = parsePagination(query);

    const filter = {};
    if (group) filter.group = group;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }
    if (student) filter['records.student'] = student;
    if (status) filter['records.status'] = status;

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('group', 'name')
        .populate('markedBy', 'firstName lastName role')
        .populate('records.student', 'firstName lastName phone')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance.countDocuments(filter),
    ]);

    return { records, meta: buildPaginationMeta(total, page, limit) };
  }

  async getStudentAttendance(studentId, groupId) {
    const filter = { 'records.student': studentId };
    if (groupId) filter.group = groupId;

    const records = await Attendance.find(filter)
      .populate('group', 'name')
      .sort({ date: -1 })
      .lean();

    // Extract only this student's records
    const studentRecords = records.map((r) => ({
      date: r.date,
      group: r.group,
      topic: r.topic,
      status: r.records.find((rec) => rec.student.toString() === studentId)?.status,
      note: r.records.find((rec) => rec.student.toString() === studentId)?.note,
    }));

    // Calculate stats
    const total = studentRecords.length;
    const present = studentRecords.filter((r) => r.status === 'PRESENT').length;
    const absent = studentRecords.filter((r) => r.status === 'ABSENT').length;
    const late = studentRecords.filter((r) => r.status === 'LATE').length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      records: studentRecords,
      stats: { total, present, absent, late, attendanceRate },
    };
  }
}

module.exports = new AttendanceService();
