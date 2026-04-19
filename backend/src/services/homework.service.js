const Homework = require('../models/Homework');
const Group = require('../models/Group');
const Submission = require('../models/Submission');
const { NotFoundError, AppError } = require('../utils/AppError');
const { parsePagination, parseSort } = require('../utils/pagination');
const { buildPaginationMeta } = require('../utils/response');
const { HOMEWORK_TYPES, ROLES } = require('../config/constants');
const { audit, ACTIONS } = require('../utils/auditLog');

class HomeworkService {
  async getHomework(query, requestingUser) {
    const { group, type, isPublished, dueBefore, dueAfter, sort } = query;
    const { page, limit, skip } = parsePagination(query);

    const filter = { isDeleted: false };

    if (requestingUser.role === ROLES.STUDENT) {
      // Students only see published homework for their groups
      filter.isPublished = true;
      filter.group = { $in: requestingUser.groups };
    } else {
      if (group) filter.group = group;
      if (typeof isPublished === 'boolean') filter.isPublished = isPublished;
    }

    if (type) filter.type = type;
    if (dueBefore || dueAfter) {
      filter.dueDate = {};
      if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);
      if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
    }

    const sortObj = parseSort(sort, { dueDate: 1 });

    const [homework, total] = await Promise.all([
      Homework.find(filter)
        .populate('group', 'name level')
        .populate('createdBy', 'firstName lastName')
        .populate({ path: 'vocabulary', select: 'title items' })
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Homework.countDocuments(filter),
    ]);

    return { homework, meta: buildPaginationMeta(total, page, limit) };
  }

  async getHomeworkById(id, requestingUser) {
    const homework = await Homework.findOne({ _id: id, isDeleted: false })
      .populate('group', 'name level teacher assistant students')
      .populate('createdBy', 'firstName lastName')
      .populate({
        path: 'vocabulary',
        populate: { path: 'items' },
      });

    if (!homework) throw new NotFoundError('Homework');

    // Students can only view published homework in their groups
    if (requestingUser.role === ROLES.STUDENT) {
      if (!homework.isPublished) throw new NotFoundError('Homework');
      const inGroup = requestingUser.groups.some(
        (g) => g.toString() === homework.group._id.toString()
      );
      if (!inGroup) throw new NotFoundError('Homework');
    }

    return homework;
  }

  async createHomework(data, creatingUser) {
    // Object kelsa _id ni olamiz, string kelsa o'zini ishlatamiz
    const groupId = data.group?._id ?? data.group;
    const vocabularyId = data.vocabulary?._id ?? data.vocabulary ?? null;

    const group = await Group.findOne({ _id: groupId, isDeleted: false });
    if (!group) throw new NotFoundError('Group');

    if (data.type === HOMEWORK_TYPES.URL && !data.resourceUrl) {
      throw new AppError('Resource URL is required for URL homework', 400);
    }
    if (data.type === HOMEWORK_TYPES.TEXT && !data.textContent) {
      throw new AppError('Text content is required for TEXT homework', 400);
    }
    if (data.type === HOMEWORK_TYPES.VOCABULARY && !vocabularyId) {
      throw new AppError('Vocabulary list is required for VOCABULARY homework', 400);
    }

    const homework = await Homework.create({
      ...data,
      group: groupId,
      vocabulary: vocabularyId,
      createdBy: creatingUser._id,
    });

    await audit({
      userId: creatingUser._id,
      action: ACTIONS.CREATE,
      resource: 'Homework',
      resourceId: homework._id,
      details: { type: homework.type, group: homework.group },
    });

    return homework;
  }

  async updateHomework(id, data, updatingUser) {
    const homework = await Homework.findOne({ _id: id, isDeleted: false });
    if (!homework) throw new NotFoundError('Homework');

    Object.assign(homework, data);
    await homework.save();

    await audit({
      userId: updatingUser._id,
      action: ACTIONS.UPDATE,
      resource: 'Homework',
      resourceId: homework._id,
    });

    return homework;
  }

  async publishHomework(id, updatingUser) {
    const homework = await Homework.findOne({ _id: id, isDeleted: false });
    if (!homework) throw new NotFoundError('Homework');

    homework.isPublished = true;
    await homework.save();

    await audit({
      userId: updatingUser._id,
      action: ACTIONS.UPDATE,
      resource: 'Homework',
      resourceId: homework._id,
      details: { published: true },
    });

    return homework;
  }

  async softDeleteHomework(id, deletingUser) {
    const homework = await Homework.findOne({ _id: id, isDeleted: false });
    if (!homework) throw new NotFoundError('Homework');

    homework.isDeleted = true;
    homework.deletedAt = new Date();
    await homework.save();

    await audit({
      userId: deletingUser._id,
      action: ACTIONS.DELETE,
      resource: 'Homework',
      resourceId: homework._id,
    });
  }

  async getHomeworkStats(groupId) {
    const [total, published, byType] = await Promise.all([
      Homework.countDocuments({ group: groupId, isDeleted: false }),
      Homework.countDocuments({ group: groupId, isDeleted: false, isPublished: true }),
      Homework.aggregate([
        { $match: { group: require('mongoose').Types.ObjectId.createFromHexString(groupId), isDeleted: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);
    return { total, published, byType };
  }
}

module.exports = new HomeworkService();


// const Homework = require('../models/Homework');
// const Group = require('../models/Group');
// const Submission = require('../models/Submission');
// const { NotFoundError, AppError } = require('../utils/AppError');
// const { parsePagination, parseSort } = require('../utils/pagination');
// const { buildPaginationMeta } = require('../utils/response');
// const { HOMEWORK_TYPES, ROLES } = require('../config/constants');
// const { audit, ACTIONS } = require('../utils/auditLog');

// class HomeworkService {
//   async getHomework(query, requestingUser) {
//     const { group, type, isPublished, dueBefore, dueAfter, sort } = query;
//     const { page, limit, skip } = parsePagination(query);

//     const filter = { isDeleted: false };

//     if (requestingUser.role === ROLES.STUDENT) {
//       // Students only see published homework for their groups
//       filter.isPublished = true;
//       filter.group = { $in: requestingUser.groups };
//     } else {
//       if (group) filter.group = group;
//       if (typeof isPublished === 'boolean') filter.isPublished = isPublished;
//     }

//     if (type) filter.type = type;
//     if (dueBefore || dueAfter) {
//       filter.dueDate = {};
//       if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);
//       if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
//     }

//     const sortObj = parseSort(sort, { dueDate: 1 });

//     const [homework, total] = await Promise.all([
//       Homework.find(filter)
//         .populate('group', 'name level')
//         .populate('createdBy', 'firstName lastName')
//         .populate('vocabulary', 'title')
//         .sort(sortObj)
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//       Homework.countDocuments(filter),
//     ]);

//     return { homework, meta: buildPaginationMeta(total, page, limit) };
//   }

//   async getHomeworkById(id, requestingUser) {
//     const homework = await Homework.findOne({ _id: id, isDeleted: false })
//       .populate('group', 'name level teacher assistant students')
//       .populate('createdBy', 'firstName lastName')
//       .populate({
//         path: 'vocabulary',
//         populate: { path: 'items' },
//       });

//     if (!homework) throw new NotFoundError('Homework');

//     // Students can only view published homework in their groups
//     if (requestingUser.role === ROLES.STUDENT) {
//       if (!homework.isPublished) throw new NotFoundError('Homework');
//       const inGroup = requestingUser.groups.some(
//         (g) => g.toString() === homework.group._id.toString()
//       );
//       if (!inGroup) throw new NotFoundError('Homework');
//     }

//     return homework;
//   }

//   async createHomework(data, creatingUser) {
//     console.log(data);
    
//     const group = await Group.findOne({ _id: data.group, isDeleted: false });
//     if (!group) throw new NotFoundError('Group');

//     if (data.type === HOMEWORK_TYPES.URL && !data.resourceUrl) {
//       throw new AppError('Resource URL is required for URL homework', 400);
//     }
//     if (data.type === HOMEWORK_TYPES.TEXT && !data.textContent) {
//       throw new AppError('Text content is required for TEXT homework', 400);
//     }
//     if (data.type === HOMEWORK_TYPES.VOCABULARY && !data.vocabulary) {
//       throw new AppError('Vocabulary list is required for VOCABULARY homework', 400);
//     }

//     const homework = await Homework.create({ ...data, createdBy: creatingUser._id });

//     await audit({
//       userId: creatingUser._id,
//       action: ACTIONS.CREATE,
//       resource: 'Homework',
//       resourceId: homework._id,
//       details: { type: homework.type, group: homework.group },
//     });

//     return homework;
//   }

//   async updateHomework(id, data, updatingUser) {
//     const homework = await Homework.findOne({ _id: id, isDeleted: false });
//     if (!homework) throw new NotFoundError('Homework');

//     Object.assign(homework, data);
//     await homework.save();

//     await audit({
//       userId: updatingUser._id,
//       action: ACTIONS.UPDATE,
//       resource: 'Homework',
//       resourceId: homework._id,
//     });

//     return homework;
//   }

//   async publishHomework(id, updatingUser) {
//     const homework = await Homework.findOne({ _id: id, isDeleted: false });
//     if (!homework) throw new NotFoundError('Homework');

//     homework.isPublished = true;
//     await homework.save();

//     await audit({
//       userId: updatingUser._id,
//       action: ACTIONS.UPDATE,
//       resource: 'Homework',
//       resourceId: homework._id,
//       details: { published: true },
//     });

//     return homework;
//   }

//   async softDeleteHomework(id, deletingUser) {
//     const homework = await Homework.findOne({ _id: id, isDeleted: false });
//     if (!homework) throw new NotFoundError('Homework');

//     homework.isDeleted = true;
//     homework.deletedAt = new Date();
//     await homework.save();

//     await audit({
//       userId: deletingUser._id,
//       action: ACTIONS.DELETE,
//       resource: 'Homework',
//       resourceId: homework._id,
//     });
//   }

//   async getHomeworkStats(groupId) {
//     const [total, published, byType] = await Promise.all([
//       Homework.countDocuments({ group: groupId, isDeleted: false }),
//       Homework.countDocuments({ group: groupId, isDeleted: false, isPublished: true }),
//       Homework.aggregate([
//         { $match: { group: require('mongoose').Types.ObjectId.createFromHexString(groupId), isDeleted: false } },
//         { $group: { _id: '$type', count: { $sum: 1 } } },
//       ]),
//     ]);
//     return { total, published, byType };
//   }
// }

// module.exports = new HomeworkService();
