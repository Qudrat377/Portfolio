const { ValidationError } = require('../utils/AppError');

/**
 * Joi validation middleware factory
 * @param {Object} schema - Joi schema
 * @param {'body'|'query'|'params'} source - where to validate
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return next(new ValidationError(errors));
    }

    req[source] = value;
    next();
  };
};

module.exports = { validate };
