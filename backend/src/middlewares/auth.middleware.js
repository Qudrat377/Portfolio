const { verifyAccessToken } = require('../utils/jwt');
const { AuthenticationError, AuthorizationError } = require('../utils/AppError');
const User = require('../models/User');

/**
 * Verify JWT and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }
    if (user.isDeleted) {
      throw new AuthenticationError('Account has been deleted');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Authorize specific roles
 * Usage: authorize('ADMIN', 'MANAGER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AuthorizationError(
          `Role '${req.user.role}' is not authorized for this action`
        )
      );
    }
    next();
  };
};

/**
 * Authorize if user is the resource owner OR has one of the given roles
 * Usage: authorizeOwnerOrRoles('userId', 'ADMIN', 'MANAGER')
 */
const authorizeOwnerOrRoles = (paramName, ...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }
    const isOwner = req.user._id.toString() === req.params[paramName];
    const hasRole = roles.includes(req.user.role);
    if (!isOwner && !hasRole) {
      return next(new AuthorizationError());
    }
    next();
  };
};

module.exports = { authenticate, authorize, authorizeOwnerOrRoles };
