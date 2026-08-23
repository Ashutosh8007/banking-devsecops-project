const express = require("express");

const router = express.Router();

const {
  validatePassword,
  checkPassword,
} = require("../middlewares/adminMiddlewares/adminMiddlewares");

const {
  authAdminProtect,
} = require("../middlewares/adminMiddlewares/authAdminsMiddleware");

const {
  checkRole,
} = require("../middlewares/adminMiddlewares/roleAuthMiddleware");

const {
  getAdmins,
  getOneAdmin,
  createAdmin,
  updateAdmin,
  updateOwner,
  deleteAdmin,
  adminLogin,
  updateAdminRole,
  createFirstAdmin,
} = require("../controllers/adminsControllers");

router
  .route("/")
  .get(authAdminProtect, checkRole, getAdmins)
  .post(authAdminProtect, checkRole, validatePassword, createAdmin);

router.route("/login").post(adminLogin);

router
  .route("/:id")
  .get(authAdminProtect, getOneAdmin)
  .put(authAdminProtect, checkPassword, validatePassword, updateAdmin)
  .delete(authAdminProtect, checkRole, deleteAdmin);

router
  .route("/updaterole/:id")
  .put(authAdminProtect, checkRole, updateAdminRole);

router
  .route("/owner/:id")
  .put(authAdminProtect, checkPassword, validatePassword, updateOwner);

// SECURITY: route is gated by ALLOW_OWNER_BOOTSTRAP env var (see controller)
router.route("/owner/create").post(createFirstAdmin); // gated by ALLOW_OWNER_BOOTSTRAP env var

module.exports = router;
