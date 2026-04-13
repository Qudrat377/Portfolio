const Group = require('../models/Group');
const User = require('../models/User');
const { NotFoundError, ConflictError, AppError, AuthorizationError } = require('../utils/AppError');
const { parsePagination, withActive, parseSort } = require('../utils/pagination');
const { buildPaginationMeta } = require('../utils/response');
const { ROLES } = require('../config/constants');
const { audit, ACTIONS } = require('../utils/auditLog');

class GroupService {
  async getGroups(query, requestingUser) {
    const { teacher, level, isActive, search, sort } = query;
    const { page, limit, skip } = parsePagination(query);

    const filter = withActive({});

    // Teachers/Assistants only see their groups
    if (requestingUser.role === ROLES.TEACHER) {
      filter.teacher = requestingUser._id;
    } else if (requestingUser.role === ROLES.ASSISTANT) {
      filter.assistant = requestingUser._id;
    } else if (requestingUser.role === ROLES.STUDENT) {
      filter.students = requestingUser._id;
    } else {
      if (teacher) filter.teacher = teacher;
    }

    if (level) filter.level = level;
    if (typeof isActive === 'boolean') filter.isActive = isActive;
    if (search) filter.$text = { $search: search };

    const sortObj = parseSort(sort);

    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate('teacher', 'firstName lastName phone')
        .populate('assistant', 'firstName lastName phone')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Group.countDocuments(filter),
    ]);

    return { groups, meta: buildPaginationMeta(total, page, limit) };
  }

  async getGroupById(id) {
    const group = await Group.findOne({ _id: id, isDeleted: false })
      .populate('teacher', 'firstName lastName phone role')
      .populate('assistant', 'firstName lastName phone role')
      .populate('students', 'firstName lastName phone')
      .populate('createdBy', 'firstName lastName');
    if (!group) throw new NotFoundError('Group');
    return group;
  }

  async createGroup(data, creatingUser) {
    
    // Verify teacher exists and has correct role
    const teacher = await User.findOne({ _id: data.teacher, role: ROLES.TEACHER, isDeleted: false });
    console.log(teacher);
    
    if (!teacher) throw new NotFoundError('Teacher');

    if (data.assistant) {
      const assistant = await User.findOne({
        _id: data.assistant,
        role: ROLES.ASSISTANT,
        isDeleted: false,
      });
      if (!assistant) throw new NotFoundError('Assistant');
    }

    const group = await Group.create({ ...data, createdBy: creatingUser._id });

    await audit({
      userId: creatingUser._id,
      action: ACTIONS.CREATE,
      resource: 'Group',
      resourceId: group._id,
      details: { name: group.name },
    });

    return group;
  }

  async updateGroup(id, data, updatingUser) {
    const group = await Group.findOne({ _id: id, isDeleted: false });
    if (!group) throw new NotFoundError('Group');

    if (data.teacher) {
      const teacher = await User.findOne({ _id: data.teacher, role: ROLES.TEACHER, isDeleted: false });
      if (!teacher) throw new NotFoundError('Teacher');
    }

    if (data.assistant) {
      const assistant = await User.findOne({
        _id: data.assistant,
        role: ROLES.ASSISTANT,
        isDeleted: false,
      });
      if (!assistant) throw new NotFoundError('Assistant');
    }

    Object.assign(group, data);
    await group.save();

    await audit({
      userId: updatingUser._id,
      action: ACTIONS.UPDATE,
      resource: 'Group',
      resourceId: group._id,
      details: { updated: Object.keys(data) },
    });

    return group;
  }

  async addStudent(groupId, studentId, updatingUser) {
    const group = await Group.findOne({ _id: groupId, isDeleted: false });
    if (!group) throw new NotFoundError('Group');

    const student = await User.findOne({ _id: studentId, role: ROLES.STUDENT, isDeleted: false });
    if (!student) throw new NotFoundError('Student');

    if (group.students.some((s) => s.toString() === studentId)) {
      throw new ConflictError('Student already in this group');
    }

    if (group.students.length >= group.maxStudents) {
      throw new AppError('Group is full', 400);
    }

    group.students.push(studentId);
    await group.save();

    // Add group ref to student
    if (!student.groups.includes(groupId)) {
      student.groups.push(groupId);
      await student.save();
    }

    await audit({
      userId: updatingUser._id,
      action: ACTIONS.ASSIGN,
      resource: 'Group',
      resourceId: group._id,
      details: { studentId, action: 'add' },
    });

    return group;
  }

  async removeStudent(groupId, studentId, updatingUser) {
    const group = await Group.findOne({ _id: groupId, isDeleted: false });
    if (!group) throw new NotFoundError('Group');

    group.students = group.students.filter((s) => s.toString() !== studentId);
    await group.save();

    // Remove group ref from student
    await User.findByIdAndUpdate(studentId, { $pull: { groups: groupId } });

    await audit({
      userId: updatingUser._id,
      action: ACTIONS.ASSIGN,
      resource: 'Group',
      resourceId: group._id,
      details: { studentId, action: 'remove' },
    });
  }

  async softDeleteGroup(id, deletingUser) {
    const group = await Group.findOne({ _id: id, isDeleted: false });
    if (!group) throw new NotFoundError('Group');

    group.isDeleted = true;
    group.deletedAt = new Date();
    group.isActive = false;
    await group.save();

    await audit({
      userId: deletingUser._id,
      action: ACTIONS.DELETE,
      resource: 'Group',
      resourceId: group._id,
    });
  }
}

module.exports = new GroupService();
