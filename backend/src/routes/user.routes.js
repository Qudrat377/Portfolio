const router = require("express").Router();
const userController = require("../controllers/user.controller");
const {
  authenticate,
  authorize,
  authorizeOwnerOrRoles,
} = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  userQuerySchema,
} = require("../validators/user.validator");
const { ROLES } = require("../config/constants");

const { ADMIN, MANAGER, TEACHER } = ROLES;

router.use(authenticate);

// My profile
router.get("/profile", userController.updateProfile); // GET own profile handled via /auth/me
router.patch(
  "/profile",
  validate(updateProfileSchema),
  userController.updateProfile,
);

// Admin/Manager: full user management
router.get(
  "/",
  authorize(ADMIN, MANAGER, TEACHER),
  validate(userQuerySchema, "query"),
  userController.getUsers,
);

router.post(
  "/",
  authorize(ADMIN, MANAGER, TEACHER),
  validate(createUserSchema),
  userController.createUser,
);

router.get(
  "/:id",
  authorize(ADMIN, MANAGER, TEACHER),
  userController.getUserById,
);

router.patch(
  "/:id",
  authorize(ADMIN, MANAGER),
  validate(updateUserSchema),
  userController.updateUser,
);

router.patch(
  "/:id/toggle-status",
  authorize(ADMIN, MANAGER),
  userController.toggleUserStatus,
);

router.delete("/:id", authorize(ADMIN), userController.deleteUser);

module.exports = router;
