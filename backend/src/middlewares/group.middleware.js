const Group = require('../models/Group');
const { AuthorizationError, NotFoundError } = require('../utils/AppError');
const { ROLES } = require('../config/constants');

/**
 * Verify that the authenticated teacher/assistant belongs to this group
 * Admins and Managers bypass this check
 */
const requireGroupMembership = async (req, res, next) => {
  try {
    const { ADMIN, MANAGER } = ROLES;
    if ([ADMIN, MANAGER].includes(req.user.role)) return next();

    const groupId = req.params.groupId || req.body.group || req.query.group;
    if (!groupId) return next();

    const group = await Group.findById(groupId).select('teacher assistant');
    if (!group) return next(new NotFoundError('Group'));

    const userId = req.user._id.toString();
    const isTeacher = group.teacher?.toString() === userId;
    const isAssistant = group.assistant?.toString() === userId;

    if (!isTeacher && !isAssistant) {
      return next(new AuthorizationError('You are not a member of this group'));
    }

    req.group = group;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Verify the student belongs to the group
 */
const requireStudentInGroup = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.body.group;
    if (!groupId) return next();

    const group = await Group.findById(groupId).select('students');
    if (!group) return next(new NotFoundError('Group'));

    const userId = req.user._id.toString();
    const isInGroup = group.students.some((s) => s.toString() === userId);

    if (!isInGroup) {
      return next(new AuthorizationError('You are not a student in this group'));
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireGroupMembership, requireStudentInGroup };
