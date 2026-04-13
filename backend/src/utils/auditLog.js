const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

/**
 * Record an audit log entry
 */
const audit = async ({ userId, action, resource, resourceId, details = {}, ip, userAgent }) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      resource,
      resourceId,
      details,
      ip,
      userAgent,
    });
  } catch (err) {
    logger.error(`Audit log failed: ${err.message}`);
  }
};

const ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  ASSIGN: 'ASSIGN',
  MARK_ATTENDANCE: 'MARK_ATTENDANCE',
  SUBMIT: 'SUBMIT',
};

module.exports = { audit, ACTIONS };
