const User = require('../models/User');
const { NotFoundError, ConflictError, AuthorizationError } = require('../utils/AppError');
const { parsePagination, withActive, parseSort } = require('../utils/pagination');
const { buildPaginationMeta } = require('../utils/response');
const { ROLE_CREATION_PERMISSIONS } = require('../config/constants');
const { audit, ACTIONS } = require('../utils/auditLog');

class UserService {
  async getUsers(query, requestingUser) {
    const { role, search, isActive, page: qPage, limit: qLimit, sort } = query;
    const { page, limit, skip } = parsePagination(query);

    const filter = withActive({});

    if (role) filter.role = role;
    if (typeof isActive === 'boolean') filter.isActive = isActive;

    if (search) {
      filter.$text = { $search: search };
    }

    const sortObj = parseSort(sort);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getUserById(id) {
    const user = await User.findOne({ _id: id, isDeleted: false })
      .select('-password -refreshToken')
      .populate('groups', 'name level');
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async createUser(data, creatorUser) {
    const allowedRoles = ROLE_CREATION_PERMISSIONS[creatorUser.role] || [];
    if (!allowedRoles.includes(data.role)) {
      throw new AuthorizationError(
        `You cannot create a user with role '${data.role}'`
      );
    }

    const existing = await User.findOne({ phone: data.phone, isDeleted: false });
    if (existing) throw new ConflictError('Phone number already registered');

    if (data.email) {
      const emailExists = await User.findOne({ email: data.email, isDeleted: false });
      if (emailExists) throw new ConflictError('Email already registered');
    }

    const user = await User.create({ ...data, createdBy: creatorUser._id });

    await audit({
      userId: creatorUser._id,
      action: ACTIONS.CREATE,
      resource: 'User',
      resourceId: user._id,
      details: { role: user.role, phone: user.phone },
    });

    return user.toSafeObject();
  }

  async updateUser(id, data, updatingUser) {
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) throw new NotFoundError('User');

    Object.assign(user, data);
    await user.save();

    await audit({
      userId: updatingUser._id,
      action: ACTIONS.UPDATE,
      resource: 'User',
      resourceId: user._id,
      details: { updated: Object.keys(data) },
    });

    return user.toSafeObject();
  }

  async updateProfile(userId, data) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User');
    Object.assign(user, data);
    await user.save();
    return user.toSafeObject();
  }

  async softDeleteUser(id, deletingUser) {
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) throw new NotFoundError('User');

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isActive = false;
    user.refreshToken = null;
    await user.save();

    await audit({
      userId: deletingUser._id,
      action: ACTIONS.DELETE,
      resource: 'User',
      resourceId: user._id,
    });
  }

  async toggleUserStatus(id, updatingUser) {
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) throw new NotFoundError('User');

    user.isActive = !user.isActive;
    await user.save();

    await audit({
      userId: updatingUser._id,
      action: ACTIONS.UPDATE,
      resource: 'User',
      resourceId: user._id,
      details: { isActive: user.isActive },
    });

    return { isActive: user.isActive };
  }
}

module.exports = new UserService();
