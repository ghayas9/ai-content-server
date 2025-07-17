import { Router } from "express";
import * as controller from "../../controllers/admin/user.controller";
import * as schema from "../../schemas/admin/user.schemas";
import { validate } from "../../middleware/validation.middleware";
import { isAuthenticated } from "../../middleware/authentication";
const router = Router();

// Apply authentication and admin authorization to all routes
router.use(isAuthenticated);

// User management routes
router.get("/", validate(schema.getAllUsers), controller.getAllUsers);
router.post("/", validate(schema.createUser), controller.createUser);
router.get("/stats", controller.getUserStats);
router.get(
  "/top-creators",
  validate(schema.getUsersWithMostContent),
  controller.getUsersWithMostContent,
);

// Bulk operations
router.patch(
  "/bulk-update",
  validate(schema.bulkUpdateUsers),
  controller.bulkUpdateUsers,
);

// Individual user operations
router.get("/:id", validate(schema.getUserById), controller.getUserById);
router.put("/:id", validate(schema.updateUser), controller.updateUser);
router.delete("/:id", validate(schema.deleteUser), controller.deleteUser);

// User restoration and permanent deletion
router.patch(
  "/:id/restore",
  validate(schema.restoreUser),
  controller.restoreUser,
);
router.delete(
  "/:id/permanent",
  validate(schema.permanentlyDeleteUser),
  controller.permanentlyDeleteUser,
);

// Status management routes
router.patch(
  "/:id/status",
  validate(schema.toggleUserStatus),
  controller.toggleUserStatus,
);
router.patch("/:id/block", validate(schema.getUserById), controller.blockUser);
router.patch(
  "/:id/unblock",
  validate(schema.getUserById),
  controller.unblockUser,
);
router.patch(
  "/:id/activate",
  validate(schema.getUserById),
  controller.activateUser,
);
router.patch(
  "/:id/deactivate",
  validate(schema.getUserById),
  controller.deactivateUser,
);

// Role management routes
router.patch(
  "/:id/make-admin",
  validate(schema.getUserById),
  controller.makeUserAdmin,
);
router.patch(
  "/:id/remove-admin",
  validate(schema.getUserById),
  controller.removeAdminRole,
);

// Email verification
router.patch(
  "/:id/verify-email",
  validate(schema.getUserById),
  controller.verifyUserEmail,
);

// Password management
router.patch(
  "/:id/change-password",
  validate(schema.changeUserPassword),
  controller.changeUserPassword,
);

// Credit management routes
router.patch(
  "/:id/credits",
  validate(schema.adjustUserCredits),
  controller.adjustUserCredits,
);
router.patch(
  "/:id/credits/add",
  validate(schema.addCreditsToUser),
  controller.addCreditsToUser,
);
router.patch(
  "/:id/credits/deduct",
  validate(schema.deductCreditsFromUser),
  controller.deductCreditsFromUser,
);
router.patch(
  "/:id/credits/set",
  validate(schema.setUserCredits),
  controller.setUserCredits,
);

export default router;
