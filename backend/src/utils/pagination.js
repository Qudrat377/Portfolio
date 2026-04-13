const { PAGINATION } = require('../config/constants');

/**
 * Parse pagination params from query
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Apply soft delete filter
 */
const withActive = (filter = {}) => ({ ...filter, isDeleted: false });

/**
 * Build sort object from query
 */
const parseSort = (sortQuery, defaultSort = { createdAt: -1 }) => {
  if (!sortQuery) return defaultSort;
  const [field, order] = sortQuery.split(':');
  return { [field]: order === 'asc' ? 1 : -1 };
};

module.exports = { parsePagination, withActive, parseSort };
