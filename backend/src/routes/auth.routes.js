const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { authLimiter, passwordLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} = require('../validators/auth.validator');

// Public
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

// Protected
router.use(authenticate);
router.get('/me', authController.me);
router.post('/logout', authController.logout);
router.patch(
  '/change-password',
  passwordLimiter,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;
