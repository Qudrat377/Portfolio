const Submission = require('../models/Submission');
const Homework = require('../models/Homework');
const { NotFoundError, ConflictError, AppError } = require('../utils/AppError');
const { parsePagination, parseSort } = require('../utils/pagination');
const { buildPaginationMeta } = require('../utils/response');
const { SUBMISSION_STATUS, HOMEWORK_TYPES } = require('../config/constants');
const { audit, ACTIONS } = require('../utils/auditLog');

class SubmissionService {
  async getSubmissions(query, requestingUser) {
    const { homework, group, student, status, sort } = query;
    const { page, limit, skip } = parsePagination(query);

    const filter = {};
    if (homework) filter.homework = homework;
    if (group) filter.group = group;
    if (status) filter.status = status;

    // Students only see their own submissions
    if (requestingUser.role === 'STUDENT') {
      filter.student = requestingUser._id;
    } else if (student) {
      filter.student = student;
    }

    const sortObj = parseSort(sort, { createdAt: -1 });

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('student', 'firstName lastName phone')
        .populate('homework', 'title type dueDate')
        .populate('group', 'name')
        .populate('reviewedBy', 'firstName lastName role')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Submission.countDocuments(filter),
    ]);

    return { submissions, meta: buildPaginationMeta(total, page, limit) };
  }

  async getSubmissionById(id, requestingUser) {
    const submission = await Submission.findById(id)
      .populate('student', 'firstName lastName phone')
      .populate('homework', 'title type dueDate textContent resourceUrl timeLimitSeconds')
      .populate('group', 'name')
      .populate('reviewedBy', 'firstName lastName role');

    if (!submission) throw new NotFoundError('Submission');

    if (
      requestingUser.role === 'STUDENT' &&
      submission.student._id.toString() !== requestingUser._id.toString()
    ) {
      throw new NotFoundError('Submission');
    }

    return submission;
  }

  async submitHomework(homeworkId, data, student) {
    const homework = await Homework.findOne({ _id: homeworkId, isDeleted: false, isPublished: true })
      .populate('group', 'students');

    if (!homework) throw new NotFoundError('Homework');

    // Verify student is in the group
    const inGroup = homework.group.students.some((s) => s.toString() === student._id.toString());
    if (!inGroup) throw new AppError('You are not in this group', 403);

    // Check for existing submission
    const existing = await Submission.findOne({ homework: homeworkId, student: student._id });
    if (existing && existing.status !== SUBMISSION_STATUS.PENDING) {
      throw new ConflictError('Homework already submitted');
    }

    const isLate = new Date() > new Date(homework.dueDate);

    // Calculate score for vocabulary
    let score = null;
    if (homework.type === HOMEWORK_TYPES.VOCABULARY && data.vocabularyAnswers?.length) {
      const correct = data.vocabularyAnswers.filter((a) => a.isCorrect).length;
      score = Math.round((correct / data.vocabularyAnswers.length) * 100);
    }

    const submissionData = {
      homework: homeworkId,
      student: student._id,
      group: homework.group._id,
      status: SUBMISSION_STATUS.SUBMITTED,
      submittedAt: new Date(),
      isLate,
      score,
      ...data,
    };

    let submission;
    if (existing) {
      Object.assign(existing, submissionData);
      submission = await existing.save();
    } else {
      submission = await Submission.create(submissionData);
    }

    await audit({
      userId: student._id,
      action: ACTIONS.SUBMIT,
      resource: 'Submission',
      resourceId: submission._id,
      details: { homeworkId, type: homework.type, isLate },
    });

    return submission;
  }

  async reviewSubmission(id, data, reviewer) {
    const submission = await Submission.findById(id);
    if (!submission) throw new NotFoundError('Submission');

    if (submission.status === SUBMISSION_STATUS.PENDING) {
      throw new AppError('Cannot review a submission that has not been submitted', 400);
    }

    submission.status = data.status;
    submission.feedback = data.feedback || submission.feedback;
    submission.score = data.score !== undefined ? data.score : submission.score;
    submission.reviewedBy = reviewer._id;
    submission.reviewedAt = new Date();
    await submission.save();

    await audit({
      userId: reviewer._id,
      action: data.status === SUBMISSION_STATUS.APPROVED ? ACTIONS.APPROVE : ACTIONS.REJECT,
      resource: 'Submission',
      resourceId: submission._id,
      details: { status: data.status, score: data.score },
    });

    return submission;
  }

  async getGroupSubmissionStats(groupId, homeworkId) {
    const filter = { group: groupId };
    if (homeworkId) filter.homework = homeworkId;

    const stats = await Submission.aggregate([
      { $match: { group: require('mongoose').Types.ObjectId.createFromHexString(groupId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
        },
      },
    ]);

    return stats;
  }
}

module.exports = new SubmissionService();
