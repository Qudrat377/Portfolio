const Vocabulary = require('../models/Vocabulary');
const VocabularyAssignment = require('../models/VocabularyAssignment');
const { NotFoundError, ConflictError } = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { buildPaginationMeta } = require('../utils/response');
const { audit, ACTIONS } = require('../utils/auditLog');

class VocabularyService {

  // ── Barcha lug'atlar (guruhsiz, global) ──────────────────────────────────────
  async getVocabularies(query) {
    const { search, topic } = query;
    const { page, limit, skip } = parsePagination(query);

    const filter = { isDeleted: false };
    if (topic) filter.topic = topic;
    if (search) filter.$text = { $search: search };

    const [vocabularies, total] = await Promise.all([
      Vocabulary.find(filter)
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vocabulary.countDocuments(filter),
    ]);

    return { vocabularies, meta: buildPaginationMeta(total, page, limit) };
  }

  // ── Bitta lug'at ─────────────────────────────────────────────────────────────
  async getVocabularyById(id) {
    const vocab = await Vocabulary.findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'firstName lastName');
    if (!vocab) throw new NotFoundError('Vocabulary');
    return vocab;
  }

  // ── Yaratish ─────────────────────────────────────────────────────────────────
  async createVocabulary(data, creatingUser) {
    const title = await Vocabulary.findOne({title: data.title})

    if (title) throw new NotFoundError('Title avvaldan bor');

    const vocab = await Vocabulary.create({
      ...data,
      createdBy: creatingUser._id,
    });

    await audit({
      userId: creatingUser._id,
      action: ACTIONS.CREATE,
      resource: 'Vocabulary',
      resourceId: vocab._id,
      details: { title: vocab.title, itemCount: vocab.items.length },
    });

    return vocab;
  }

  // ── Yangilash ────────────────────────────────────────────────────────────────
  async updateVocabulary(id, data, updatingUser) {
    const vocab = await Vocabulary.findOne({ _id: id, isDeleted: false });
    if (!vocab) throw new NotFoundError('Vocabulary');

    Object.assign(vocab, data);
    await vocab.save();

    await audit({
      userId: updatingUser._id,
      action: ACTIONS.UPDATE,
      resource: 'Vocabulary',
      resourceId: vocab._id,
    });

    return vocab;
  }

  // ── Tarjimani o'zgartirish ───────────────────────────────────────────────────
  async updateItemTranslation(vocabId, itemId, editedTranslation, updatingUser) {
    const vocab = await Vocabulary.findOne({ _id: vocabId, isDeleted: false });
    if (!vocab) throw new NotFoundError('Vocabulary');

    const item = vocab.items.id(itemId);
    if (!item) throw new NotFoundError('Vocabulary item');

    item.editedTranslation = editedTranslation;
    await vocab.save();

    return vocab;
  }

  // ── O'chirish ────────────────────────────────────────────────────────────────
  async deleteVocabulary(id, deletingUser) {
    const vocab = await Vocabulary.findOne({ _id: id, isDeleted: false });
    if (!vocab) throw new NotFoundError('Vocabulary');

    vocab.isDeleted = true;
    await vocab.save();

    // Bu lug'atga tegishli barcha assignmentlarni ham o'chirish
    await VocabularyAssignment.updateMany(
      { vocabulary: id },
      { isActive: false }
    );

    await audit({
      userId: deletingUser._id,
      action: ACTIONS.DELETE,
      resource: 'Vocabulary',
      resourceId: vocab._id,
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ASSIGNMENT metodlari
  // ────────────────────────────────────────────────────────────────────────────

  // ── Guruhga lug'at berish ────────────────────────────────────────────────────
  async assignToGroup(vocabularyId, groupId, data, assigningUser) {
    // Lug'at mavjudligini tekshirish
    const vocab = await Vocabulary.findOne({ _id: vocabularyId, isDeleted: false });
    if (!vocab) throw new NotFoundError('Vocabulary');

    // Allaqachon berilganmi?
    const existing = await VocabularyAssignment.findOne({
      vocabulary: vocabularyId,
      group: groupId,
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictError('Bu lug\'at allaqachon bu guruhga berilgan');
      }
      // Eski assignment ni qayta faollashtirish
      existing.isActive = true;
      existing.dueDate = data.dueDate || null;
      existing.note = data.note || '';
      existing.assignedBy = assigningUser._id;
      await existing.save();
      return existing;
    }

    const assignment = await VocabularyAssignment.create({
      vocabulary: vocabularyId,
      group: groupId,
      assignedBy: assigningUser._id,
      dueDate: data.dueDate || null,
      note: data.note || '',
    });

    await audit({
      userId: assigningUser._id,
      action: ACTIONS.ASSIGN,
      resource: 'VocabularyAssignment',
      resourceId: assignment._id,
      details: { vocabularyId, groupId },
    });

    return assignment;
  }

  // ── Guruhdan lug'atni olib tashlash ──────────────────────────────────────────
  async removeFromGroup(vocabularyId, groupId, removingUser) {
    const assignment = await VocabularyAssignment.findOne({
      vocabulary: vocabularyId,
      group: groupId,
      isActive: true,
    });

    if (!assignment) throw new NotFoundError('Assignment');

    assignment.isActive = false;
    await assignment.save();

    await audit({
      userId: removingUser._id,
      action: ACTIONS.UPDATE,
      resource: 'VocabularyAssignment',
      resourceId: assignment._id,
      details: { removed: true },
    });
  }

  // ── Guruhning barcha lug'atlari ──────────────────────────────────────────────
  async getGroupVocabularies(groupId, query) {
    const { page, limit, skip } = parsePagination(query);

    const filter = { group: groupId, isActive: true };

    const [assignments, total] = await Promise.all([
      VocabularyAssignment.find(filter)
        .populate({
          path: 'vocabulary',
          match: { isDeleted: false },
          populate: { path: 'createdBy', select: 'firstName lastName' },
        })
        .populate('assignedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VocabularyAssignment.countDocuments(filter),
    ]);

    // vocabulary null bo'lganlarni filter qilish (o'chirilgan bo'lsa)
    const filtered = assignments.filter(a => a.vocabulary !== null);

    return {
      vocabularies: filtered.map(a => ({
        ...a.vocabulary,
        assignmentId: a._id,
        assignedBy: a.assignedBy,
        assignedAt: a.createdAt,
        dueDate: a.dueDate,
        note: a.note,
      })),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  // ── Lug'at qaysi guruhlarga berilganligini ko'rish ───────────────────────────
  async getVocabularyGroups(vocabularyId) {
    const assignments = await VocabularyAssignment.find({
      vocabulary: vocabularyId,
      isActive: true,
    })
      .populate('group', 'name level')
      .populate('assignedBy', 'firstName lastName')
      .lean();

    return assignments;
  }
}

module.exports = new VocabularyService();


// const Vocabulary = require('../models/Vocabulary');
// const Group = require('../models/Group');
// const { NotFoundError, AppError } = require('../utils/AppError');
// const { parsePagination } = require('../utils/pagination');
// const { buildPaginationMeta } = require('../utils/response');
// const { audit, ACTIONS } = require('../utils/auditLog');

// class VocabularyService {
//   async getVocabularies(query, requestingUser) {
//     const { group } = query;
//     const { page, limit, skip } = parsePagination(query);

//     const filter = { isDeleted: false };
//     if (group) filter.group = group;

//     const [vocabularies, total] = await Promise.all([
//       Vocabulary.find(filter)
//         .populate('group', 'name')
//         .populate('createdBy', 'firstName lastName')
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//       Vocabulary.countDocuments(filter),
//     ]);

//     return { vocabularies, meta: buildPaginationMeta(total, page, limit) };
//   }

//   async getVocabularyById(id) {
//     const vocab = await Vocabulary.findOne({ _id: id, isDeleted: false })
//       .populate('group', 'name')
//       .populate('createdBy', 'firstName lastName');
//     if (!vocab) throw new NotFoundError('Vocabulary');
//     return vocab;
//   }

//   async createVocabulary(data, creatingUser) {
//     const group = await Group.findOne({ _id: data.group, isDeleted: false });
//     if (!group) throw new NotFoundError('Group');

//     const vocab = await Vocabulary.create({ ...data, createdBy: creatingUser._id });

//     await audit({
//       userId: creatingUser._id,
//       action: ACTIONS.CREATE,
//       resource: 'Vocabulary',
//       resourceId: vocab._id,
//       details: { title: vocab.title, itemCount: vocab.items.length },
//     });

//     return vocab;
//   }

//   async updateVocabulary(id, data, updatingUser) {
//     const vocab = await Vocabulary.findOne({ _id: id, isDeleted: false });
//     if (!vocab) throw new NotFoundError('Vocabulary');

//     Object.assign(vocab, data);
//     await vocab.save();

//     await audit({
//       userId: updatingUser._id,
//       action: ACTIONS.UPDATE,
//       resource: 'Vocabulary',
//       resourceId: vocab._id,
//     });

//     return vocab;
//   }

//   async updateItemTranslation(vocabId, itemId, editedTranslation, updatingUser) {
//     const vocab = await Vocabulary.findOne({ _id: vocabId, isDeleted: false });
//     if (!vocab) throw new NotFoundError('Vocabulary');

//     const item = vocab.items.id(itemId);
//     if (!item) throw new NotFoundError('Vocabulary item');

//     item.editedTranslation = editedTranslation;
//     await vocab.save();

//     await audit({
//       userId: updatingUser._id,
//       action: ACTIONS.UPDATE,
//       resource: 'Vocabulary',
//       resourceId: vocab._id,
//       details: { itemId, editedTranslation },
//     });

//     return vocab;
//   }

//   async softDeleteVocabulary(id, deletingUser) {
//     const vocab = await Vocabulary.findOne({ _id: id, isDeleted: false });
//     if (!vocab) throw new NotFoundError('Vocabulary');

//     vocab.isDeleted = true;
//     await vocab.save();

//     await audit({
//       userId: deletingUser._id,
//       action: ACTIONS.DELETE,
//       resource: 'Vocabulary',
//       resourceId: vocab._id,
//     });
//   }
// }

// module.exports = new VocabularyService();
