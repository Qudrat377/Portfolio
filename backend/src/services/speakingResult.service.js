const SpeakingResult = require('../models/SpeakingResult');
const Homework = require('../models/Homework');
const Group = require('../models/Group');
const { NotFoundError, AppError, ConflictError } = require('../utils/AppError');
const { parsePagination, parseSort } = require('../utils/pagination');
const { buildPaginationMeta } = require('../utils/response');
const { SPEAKING_TEST_STATUS, ROLES } = require('../config/constants');
const { audit, ACTIONS } = require('../utils/auditLog');

class SpeakingResultService {
  /**
   * Teacher/Assistant approves a student to take the speaking test
   */
  async approveStudentForTest(homeworkId, studentId, approver) {
    const homework = await Homework.findOne({ _id: homeworkId, isDeleted: false })
      .populate('group');
    if (!homework) throw new NotFoundError('Homework');
    if (homework.type !== 'VOCABULARY') throw new AppError('Speaking test only applies to VOCABULARY homework', 400);

    const group = homework.group;
    const inGroup = group.students.some((s) => s.toString() === studentId);
    if (!inGroup) throw new AppError('Student is not in this group', 400);

    // Check if already approved/started
    const existing = await SpeakingResult.findOne({
      homework: homeworkId,
      student: studentId,
      status: { $in: [SPEAKING_TEST_STATUS.PENDING, SPEAKING_TEST_STATUS.IN_PROGRESS] },
    });
    if (existing) throw new ConflictError('Student already approved or test is in progress');

    const result = await SpeakingResult.create({
      student: studentId,
      homework: homeworkId,
      group: group._id,
      vocabulary: homework.vocabulary,
      approvedBy: approver._id,
      timeLimitSeconds: homework.timeLimitSeconds || 60,
      status: SPEAKING_TEST_STATUS.PENDING,
    });

    await audit({
      userId: approver._id,
      action: ACTIONS.APPROVE,
      resource: 'SpeakingResult',
      resourceId: result._id,
      details: { studentId, homeworkId },
    });

    return result;
  }

  /**
   * Student submits speaking test results (processed on mobile — no audio stored)
   */
  async submitResult(data, student) {
    const { homework: homeworkId, vocabulary, wordResults, durationSeconds, startedAt, completedAt } = data;

    // Find the approved pending test
    const result = await SpeakingResult.findOne({
      homework: homeworkId,
      student: student._id,
      status: { $in: [SPEAKING_TEST_STATUS.PENDING, SPEAKING_TEST_STATUS.IN_PROGRESS] },
    });
    if (!result) throw new NotFoundError('No approved speaking test found for this homework');

    const totalWords = wordResults.length;
    const correctWords = wordResults.filter((w) => w.isCorrect).length;
    const incorrectWords = totalWords - correctWords;
    const score = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
    const completedWithinLimit = durationSeconds <= result.timeLimitSeconds;

    result.wordResults = wordResults;
    result.totalWords = totalWords;
    result.correctWords = correctWords;
    result.incorrectWords = incorrectWords;
    result.score = score;
    result.durationSeconds = durationSeconds;
    result.completedWithinLimit = completedWithinLimit;
    result.startedAt = startedAt || new Date();
    result.completedAt = completedAt || new Date();
    result.status = SPEAKING_TEST_STATUS.COMPLETED;
    // vocabulary field already set on approval

    await result.save();

    await audit({
      userId: student._id,
      action: ACTIONS.SUBMIT,
      resource: 'SpeakingResult',
      resourceId: result._id,
      details: { score, totalWords, correctWords, durationSeconds },
    });

    return result;
  }

  async getResults(query, requestingUser) {
    const { group, student, homework, status, sort } = query;
    const { page, limit, skip } = parsePagination(query);

    const filter = {};
    if (group) filter.group = group;
    if (homework) filter.homework = homework;
    if (status) filter.status = status;

    if (requestingUser.role === ROLES.STUDENT) {
      filter.student = requestingUser._id;
    } else if (student) {
      filter.student = student;
    }

    const sortObj = parseSort(sort, { createdAt: -1 });

    const [results, total] = await Promise.all([
      SpeakingResult.find(filter)
        .populate('student', 'firstName lastName phone')
        .populate('homework', 'title timeLimitSeconds')
        .populate('group', 'name')
        .populate('approvedBy', 'firstName lastName role')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      SpeakingResult.countDocuments(filter),
    ]);

    return { results, meta: buildPaginationMeta(total, page, limit) };
  }

  async getResultById(id, requestingUser) {
    const result = await SpeakingResult.findById(id)
      .populate('student', 'firstName lastName phone')
      .populate('homework', 'title timeLimitSeconds')
      .populate('vocabulary', 'title items')
      .populate('group', 'name')
      .populate('approvedBy', 'firstName lastName role');

    if (!result) throw new NotFoundError('Speaking result');

    if (
      requestingUser.role === ROLES.STUDENT &&
      result.student._id.toString() !== requestingUser._id.toString()
    ) {
      throw new NotFoundError('Speaking result');
    }

    return result;
  }

  async addTeacherNote(id, teacherNote, teacher) {
    const result = await SpeakingResult.findById(id);
    if (!result) throw new NotFoundError('Speaking result');

    result.teacherNote = teacherNote;
    await result.save();

    await audit({
      userId: teacher._id,
      action: ACTIONS.UPDATE,
      resource: 'SpeakingResult',
      resourceId: result._id,
      details: { teacherNote },
    });

    return result;
  }

  async getStudentProgress(studentId, groupId) {
    const filter = { student: studentId, status: SPEAKING_TEST_STATUS.COMPLETED };
    if (groupId) filter.group = groupId;

    const results = await SpeakingResult.find(filter)
      .populate('homework', 'title dueDate')
      .sort({ createdAt: 1 })
      .lean();

    const avgScore =
      results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
        : 0;

    return { results, avgScore, totalTests: results.length };
  }
}

module.exports = new SpeakingResultService();
