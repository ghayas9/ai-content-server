import { Router } from "express";
import * as controller from "../controllers/comments.controller";
import * as schema from "../schemas/comments.schemas";
import { validate } from "../middleware/validation.middleware";
import { isAuthenticated } from "../middleware/authentication";

const router = Router();

// Public routes
router.get(
  "/content/:contentId",
  validate(schema.getCommentsForContent),
  controller.getCommentsForContent,
);
router.get("/single/:id", validate(schema.getCommentById), controller.getOne);
router.get(
  "/replies/:commentId",
  validate(schema.getReplies),
  controller.getReplies,
);
router.get(
  "/user/:userId",
  validate(schema.getUserComments),
  controller.getUserComments,
);
router.get("/search", validate(schema.searchComments), controller.search);
router.get(
  "/top",
  validate(schema.getTopCommentedContent),
  controller.getTopCommented,
);
router.get(
  "/analytics",
  validate(schema.getCommentAnalytics),
  controller.getAnalytics,
);

// Authenticated routes
router.post(
  "/",
  isAuthenticated,
  validate(schema.createComment),
  controller.create,
);

router.get(
  "/my",
  isAuthenticated,
  validate(schema.getMyComments),
  controller.getMyComments,
);

router.put(
  "/:id",
  isAuthenticated,
  validate(schema.updateComment),
  controller.updateOne,
);

router.delete(
  "/:id",
  isAuthenticated,
  validate(schema.deleteComment),
  controller.deleteOne,
);

router.post(
  "/:id/report",
  isAuthenticated,
  validate(schema.reportComment),
  controller.report,
);

// Admin routes (you might want to add an isAdmin middleware)
router.get(
  "/reported",
  validate(schema.getReportedComments),
  controller.getReported,
);

router.patch(
  "/:id/pin",
  isAuthenticated, // Add isAdmin middleware if needed
  validate(schema.togglePinComment),
  controller.togglePin,
);

router.patch(
  "/:id/moderate",
  isAuthenticated, // Add isAdmin middleware if needed
  validate(schema.moderateComment),
  controller.moderate,
);

export default router;
