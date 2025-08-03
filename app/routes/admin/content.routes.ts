import { Router } from "express";
import * as controller from "../../controllers/admin/content.controller";
import * as schema from "../../schemas/admin/content.schemas";
import { validate } from "../../middleware/validation.middleware";

const router = Router();

// Content management routes
router.get("/", validate(schema.getAllContent), controller.getAllContent);
router.get(
  "/stats",
  validate(schema.getContentStats),
  controller.getContentStats,
);
router.get("/export", validate(schema.exportContent), controller.exportContent);

// Bulk operations
router.patch(
  "/bulk-delete",
  validate(schema.bulkDeleteContent),
  controller.bulkDeleteContent,
);
router.patch(
  "/bulk-restore",
  validate(schema.bulkRestoreContent),
  controller.bulkRestoreContent,
);
router.patch(
  "/bulk-status",
  validate(schema.bulkUpdateContentStatus),
  controller.bulkUpdateContentStatus,
);

// Individual content operations
router.get("/:id", validate(schema.getContentById), controller.getContentById);
router.put("/:id", validate(schema.updateContent), controller.updateContent);
router.delete("/:id", validate(schema.deleteContent), controller.deleteContent);

// Content restoration and permanent deletion
router.patch(
  "/:id/restore",
  validate(schema.restoreContent),
  controller.restoreContent,
);
router.delete(
  "/:id/permanent",
  validate(schema.permanentlyDeleteContent),
  controller.permanentlyDeleteContent,
);

export default router;
