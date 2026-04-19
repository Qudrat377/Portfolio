const VocabCheck = require('../models/VocabCheck');
const Group = require('../models/Group');
const { AppError } = require('../utils/AppError');
const { ROLES } = require('../config/constants');

class VocabCheckService {
  async getGroupVocabCheck(groupId, homeworkId, date, requestingUser) {
    const group = await Group.findOne({ _id: groupId, isDeleted: false });
    if (!group) throw new AppError('Group not found', 404);

    if (requestingUser.role === ROLES.TEACHER && group.teacher.toString() !== requestingUser._id.toString()) {
      throw new AppError('Unauthorized access to this group', 403);
    }
    if (requestingUser.role === ROLES.ASSISTANT && group.assistant?.toString() !== requestingUser._id.toString()) {
      throw new AppError('Unauthorized access to this group', 403);
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    return await VocabCheck.findOne({
      group: groupId,
      homework: homeworkId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });
  }

  async markVocabCheck(data, requestingUser) {
    const { group: groupId, homework: homeworkId, date, records, topic } = data;

    const group = await Group.findOne({ _id: groupId, isDeleted: false });
    if (!group) throw new AppError('Group not found', 404);

    if (requestingUser.role === ROLES.TEACHER && group.teacher.toString() !== requestingUser._id.toString()) {
      throw new AppError('Unauthorized access to this group', 403);
    }
    if (requestingUser.role === ROLES.ASSISTANT && group.assistant?.toString() !== requestingUser._id.toString()) {
      throw new AppError('Unauthorized access to this group', 403);
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
    // Find if already exists today for this homework
    let check = await VocabCheck.findOne({
      group: groupId,
      homework: homeworkId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (check) {
      check.records = records;
      check.topic = topic || check.topic;
      check.updatedBy = requestingUser._id;
      await check.save();
    } else {
      check = await VocabCheck.create({
        group: groupId,
        homework: homeworkId,
        date: startOfDay,
        records,
        topic,
        markedBy: requestingUser._id,
      });
    }

    return check;
  }
}

module.exports = new VocabCheckService();
