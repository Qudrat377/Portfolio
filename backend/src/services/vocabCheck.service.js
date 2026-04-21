const VocabCheck = require('../models/VocabCheck');
const Vocabulary = require('../models/Vocabulary');
const Group = require('../models/Group');
const { AppError } = require('../utils/AppError');
const { ROLES } = require('../config/constants');
const studentVocabService = require('./studentVocab.service');

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
    const startOfDay = new Date(new Date(targetDate).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(targetDate).setHours(23, 59, 59, 999));

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

    // ── StudentVocab ga avtomatik sync ─────────────────────────────────────
    // VocabCheck saqlangandan keyin, natijalarni o'quvchilarning
    // shaxsiy lug'at bazasiga yozamiz (SM-2 algoritmi bilan)
    try {
      await this._syncToStudentVocab(check, homeworkId);
    } catch (err) {
      // Sync muvaffaqiyatsiz bo'lsa ham vocabCheck saqlanib qoladi
      // Log qilib o'tamiz
      console.error('[StudentVocab sync xatosi]', err.message);
    }

    return check;
  }

  // ── Ichki metod: VocabCheck → StudentVocab ─────────────────────────────────
  async _syncToStudentVocab(vocabCheck, homeworkId) {
    if (!vocabCheck.records || vocabCheck.records.length === 0) return;

    // Homework dan vocabulary ni olamiz
    const Homework = require('../models/Homework');
    const hw = await Homework.findById(homeworkId).select('vocabulary').lean();
    if (!hw?.vocabulary) return;

    // Vocabulary items ni olamiz
    const vocab = await Vocabulary.findOne({
      _id: hw.vocabulary,
      isDeleted: false,
    }).lean();
    if (!vocab) return;

    // Items ni tezkor qidirish uchun map
    const itemMap = new Map(
      vocab.items.map((item) => [item._id.toString(), item])
    );

    // Har bir o'quvchi uchun
    for (const record of vocabCheck.records) {
      if (!record.student || !record.wordChecks?.length) continue;

      const wordResults = record.wordChecks.map((wc) => {
        const vocabItem = itemMap.get(wc.wordId.toString());
        return {
          vocabularyItemId: wc.wordId,
          vocabularyId: vocab._id,
          word: wc.word,
          translation:
            vocabItem?.translation ||
            vocabItem?.autoTranslation ||
            '',
          language: vocabItem?.language || 'EN',
          isCorrect: wc.isFound,
        };
      });

      await studentVocabService.addFromVocabCheckResult(
        record.student.toString(),
        wordResults
      );
    }
  }
}

module.exports = new VocabCheckService();

// const VocabCheck = require('../models/VocabCheck');
// const Group = require('../models/Group');
// const { AppError } = require('../utils/AppError');
// const { ROLES } = require('../config/constants');

// class VocabCheckService {
//   async getGroupVocabCheck(groupId, homeworkId, date, requestingUser) {
//     const group = await Group.findOne({ _id: groupId, isDeleted: false });
//     if (!group) throw new AppError('Group not found', 404);

//     if (requestingUser.role === ROLES.TEACHER && group.teacher.toString() !== requestingUser._id.toString()) {
//       throw new AppError('Unauthorized access to this group', 403);
//     }
//     if (requestingUser.role === ROLES.ASSISTANT && group.assistant?.toString() !== requestingUser._id.toString()) {
//       throw new AppError('Unauthorized access to this group', 403);
//     }

//     const targetDate = new Date(date);
//     const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

//     return await VocabCheck.findOne({
//       group: groupId,
//       homework: homeworkId,
//       date: { $gte: startOfDay, $lte: endOfDay },
//     });
//   }

//   async markVocabCheck(data, requestingUser) {
//     const { group: groupId, homework: homeworkId, date, records, topic } = data;

//     const group = await Group.findOne({ _id: groupId, isDeleted: false });
//     if (!group) throw new AppError('Group not found', 404);

//     if (requestingUser.role === ROLES.TEACHER && group.teacher.toString() !== requestingUser._id.toString()) {
//       throw new AppError('Unauthorized access to this group', 403);
//     }
//     if (requestingUser.role === ROLES.ASSISTANT && group.assistant?.toString() !== requestingUser._id.toString()) {
//       throw new AppError('Unauthorized access to this group', 403);
//     }

//     const targetDate = new Date(date);
//     const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
//     // Find if already exists today for this homework
//     let check = await VocabCheck.findOne({
//       group: groupId,
//       homework: homeworkId,
//       date: { $gte: startOfDay, $lte: endOfDay },
//     });

//     if (check) {
//       check.records = records;
//       check.topic = topic || check.topic;
//       check.updatedBy = requestingUser._id;
//       await check.save();
//     } else {
//       check = await VocabCheck.create({
//         group: groupId,
//         homework: homeworkId,
//         date: startOfDay,
//         records,
//         topic,
//         markedBy: requestingUser._id,
//       });
//     }

//     return check;
//   }
// }

// module.exports = new VocabCheckService();
